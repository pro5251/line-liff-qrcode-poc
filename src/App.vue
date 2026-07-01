<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import liff from '@line/liff'
import Html5QrScanner from './components/Html5QrScanner.vue'
import ZxingScanner from './components/ZxingScanner.vue'
import QrGenerator from './components/QrGenerator.vue'

const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''

const env = reactive({
  liffReady: false,
  inClient: false,
  loggedIn: false,
  os: '',
  liffVersion: '',
  lineVersion: '',
  nativeScanAvailable: false,
  iosVersion: '',
  initError: '',
  browserName: '',
  browserVersion: '',
  userAgent: ''
})

const scannerVisible = ref(false)
const scannerEngine = ref('html5')
const useModal = ref(true)
const tab = ref('scan')
const scannerRef = ref(null)
const result = ref('')
const history = ref([])
const status = ref('')

/** LIFF 連結（可分享，用 LINE 開啟即進入 LIFF）*/
const liffLink = computed(() => (LIFF_ID ? `https://liff.line.me/${LIFF_ID}` : ''))

/** 複製 LIFF Link */
async function copyLiffLink() {
  if (!liffLink.value) {
    status.value = '尚未設定 VITE_LIFF_ID，無法產生 LIFF Link。'
    return
  }
  try {
    await navigator.clipboard.writeText(liffLink.value)
    status.value = '已複製 LIFF Link：' + liffLink.value
  } catch (_) {
    status.value = '複製失敗，請手動複製：' + liffLink.value
  }
}

/** 初始化 LIFF；失敗不阻擋瀏覽器相機掃描 */
async function initLiff() {
  if (!LIFF_ID) {
    env.initError = '尚未設定 VITE_LIFF_ID，LIFF 原生功能停用（瀏覽器相機掃描仍可用）。'
    return
  }
  try {
    await liff.init({ liffId: LIFF_ID })
    env.liffReady = true
    env.inClient = liff.isInClient()
    env.loggedIn = liff.isLoggedIn()
    env.os = liff.getOS()
    env.liffVersion = liff.getVersion()
    env.lineVersion = liff.getLineVersion() || ''
    env.nativeScanAvailable = liff.isApiAvailable('scanCodeV2')
  } catch (err) {
    env.initError = 'LIFF 初始化失敗：' + (err?.message || String(err))
  }
}

/** 解析 iOS 版本（供 scanCodeV2 iOS ≥ 14.3 判斷參考）*/
function detectIosVersion() {
  const m = navigator.userAgent.match(/OS (\d+)_(\d+)(?:_(\d+))?/i)
  if (m) env.iosVersion = `${m[1]}.${m[2]}.${m[3] || 0}`
}

/** 解析瀏覽器名稱與版本 */
function detectBrowser() {
  const ua = navigator.userAgent
  env.userAgent = ua

  const rules = [
    { name: 'LINE',        re: /\bLine\/([\d.]+)/i },
    { name: 'SamsungBrowser', re: /SamsungBrowser\/([\d.]+)/i },
    { name: 'Edge',        re: /Edg\/([\d.]+)/i },
    { name: 'Chrome',      re: /Chrome\/([\d.]+)/i },
    { name: 'Firefox',     re: /Firefox\/([\d.]+)/i },
    { name: 'Safari',      re: /Version\/([\d.]+).*Safari/i },
    { name: 'Opera',       re: /OPR\/([\d.]+)/i },
  ]

  for (const { name, re } of rules) {
    const m = ua.match(re)
    if (m) {
      env.browserName = name
      env.browserVersion = m[1]
      return
    }
  }
  env.browserName = 'Unknown'
  env.browserVersion = ''
}

/** LINE 原生 2D code reader（liff.scanCodeV2）*/
async function scanCodeV2() {
  status.value = ''
  if (!env.nativeScanAvailable) {
    status.value = 'scanCodeV2 在目前環境不可用（見掃描按鈕下方說明）。'
    return
  }
  try {
    const res = await liff.scanCodeV2()
    if (res && res.value != null) {
      handleResult(res.value, 'liff.scanCodeV2')
    } else {
      status.value = '使用者取消或未取得結果。'
    }
  } catch (err) {
    status.value = 'scanCodeV2 失敗：' + (err?.message || String(err))
  }
}

/** 開啟相機掃描；engine: 'html5' | 'zxing' */
async function startScan(engine) {
  status.value = ''
  scannerEngine.value = engine
  scannerVisible.value = true
  await nextTick()
  await scannerRef.value?.start()
}

function onScanned(text) {
  const source = scannerEngine.value === 'zxing' ? '@zxing/browser' : 'html5-qrcode'
  handleResult(text, source)
  scannerRef.value?.stop()
  scannerVisible.value = false
}

function onScannerError(msg) {
  status.value = msg
  scannerVisible.value = false
}

/** 關閉掃描器（並釋放相機） */
async function closeScanner() {
  try {
    await scannerRef.value?.stop()
  } catch (_) {
    // 忽略
  } finally {
    scannerVisible.value = false
  }
}

function handleResult(value, source) {
  result.value = value
  history.value.unshift({
    value,
    source,
    time: new Date().toLocaleTimeString()
  })
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(result.value)
    status.value = '已複製到剪貼簿。'
  } catch (_) {
    status.value = '複製失敗，請手動選取。'
  }
}

function isUrl(text) {
  return /^https?:\/\//i.test(text)
}

async function login() {
  if (env.liffReady && !env.loggedIn) liff.login()
}

onMounted(() => {
  detectIosVersion()
  detectBrowser()
  initLiff()
})
</script>

<template>
  <main>
    <h1>LINE LIFF QR 掃描 POC</h1>

    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'scan' }" @click="tab = 'scan'">掃描</button>
      <button class="tab" :class="{ active: tab === 'generate' }" @click="tab = 'generate'">產生 QR</button>
    </div>

    <section class="card">
      <h2>環境資訊</h2>
      <ul class="env">
        <li>LIFF 初始化：<b :class="env.liffReady ? 'ok' : 'no'">{{ env.liffReady ? '成功' : '未完成' }}</b></li>
        <li>執行環境：<b>{{ env.liffReady ? (env.inClient ? 'LINE App 內 (LIFF)' : '外部瀏覽器') : '瀏覽器' }}</b></li>
        <li>已登入：<b>{{ env.loggedIn ? '是' : '否' }}</b></li>
        <li>OS / LIFF 版本：<b>{{ env.os || '-' }} / {{ env.liffVersion || '-' }}</b></li>
        <li>scanCodeV2 可用：<b :class="env.nativeScanAvailable ? 'ok' : 'no'">{{ env.nativeScanAvailable ? '是' : '否' }}</b></li>
        <li>瀏覽器：<b>{{ env.browserName }}{{ env.browserVersion ? ' ' + env.browserVersion : '' }}</b></li>
        <li class="ua-row">UserAgent：<span class="ua">{{ env.userAgent }}</span></li>
      </ul>
      <p v-if="env.initError" class="warn">{{ env.initError }}</p>
      <div class="actions">
        <button class="btn" :disabled="!liffLink" @click="copyLiffLink">
          產生 LIFF Link 並複製
        </button>
        <button v-if="env.liffReady && !env.loggedIn" class="btn ghost" @click="login">LINE 登入</button>
      </div>
      <p v-if="liffLink" class="hint">LIFF Link：{{ liffLink }}</p>
      <p v-else class="hint">設定 VITE_LIFF_ID 後才能產生 LIFF Link。</p>
    </section>

    <section class="card" v-if="tab === 'scan'">
      <h2>掃描</h2>
      <label class="modal-toggle">
        <input type="checkbox" v-model="useModal" />
        以彈跳視窗開啟相機（掃描完自動關閉並顯示結果）
      </label>
      <div class="actions scan-actions">
        <button class="btn" @click="startScan('html5')">html5-qrcode 掃描</button>
        <button class="btn zx" @click="startScan('zxing')">@zxing/browser 掃描</button>
        <button
          class="btn liff"
          :disabled="!env.nativeScanAvailable"
          @click="scanCodeV2"
        >
          liff.scanCodeV2() 掃描
        </button>
      </div>
      <p class="hint">
        兩種掃描引擎皆走瀏覽器相機（需 HTTPS 與相機權限），可在一般瀏覽器與 LINE 內建瀏覽器（iOS/Android）使用。
      </p>
      <p class="hint">
        <b>liff.scanCodeV2()</b>：
        <template v-if="env.nativeScanAvailable">✅ 目前環境可用，可點擊測試。</template>
        <template v-else-if="!env.liffReady">⚠️ 需先設定 VITE_LIFF_ID 並成功初始化 LIFF。</template>
        <template v-else>❌ 目前環境不可用（isApiAvailable 回傳 false）。條件：LINE Console 開啟 Scan QR、LIFF Size 設 Full、iOS ≥ 14.3、瀏覽器支援 WebRTC；PC 的 LIFF 瀏覽器不支援。</template>
        <span v-if="env.iosVersion"> 目前偵測 iOS 版本：{{ env.iosVersion }}。</span>
      </p>

      <!-- 內嵌模式 -->
      <template v-if="scannerVisible && !useModal">
        <Html5QrScanner
          v-if="scannerEngine === 'html5'"
          ref="scannerRef"
          @scanned="onScanned"
          @error="onScannerError"
          @close="closeScanner"
        />
        <ZxingScanner
          v-else
          ref="scannerRef"
          @scanned="onScanned"
          @error="onScannerError"
          @close="closeScanner"
        />
      </template>
    </section>

    <!-- 彈跳視窗模式 -->
    <div
      v-if="scannerVisible && useModal"
      class="modal-backdrop"
      @click.self="closeScanner"
    >
      <div class="modal-card">
        <div class="modal-head">
          <span>掃描中（{{ scannerEngine === 'zxing' ? '@zxing/browser' : 'html5-qrcode' }}）</span>
          <button class="modal-x" @click="closeScanner" aria-label="關閉">×</button>
        </div>
        <Html5QrScanner
          v-if="scannerEngine === 'html5'"
          ref="scannerRef"
          @scanned="onScanned"
          @error="onScannerError"
          @close="closeScanner"
        />
        <ZxingScanner
          v-else
          ref="scannerRef"
          @scanned="onScanned"
          @error="onScannerError"
          @close="closeScanner"
        />
      </div>
    </div>

    <section class="card" v-if="tab === 'scan' && result">
      <h2>最新結果</h2>
      <p class="result">{{ result }}</p>
      <div class="actions">
        <button class="btn ghost" @click="copyResult">複製</button>
        <a v-if="isUrl(result)" class="btn link" :href="result" target="_blank" rel="noopener">開啟連結</a>
      </div>
    </section>

    <section class="card" v-if="tab === 'scan' && history.length">
      <h2>掃描紀錄</h2>
      <ol class="history">
        <li v-for="(h, i) in history" :key="i">
          <span class="tag">{{ h.source }}</span>
          <span class="time">{{ h.time }}</span>
          <div class="hval">{{ h.value }}</div>
        </li>
      </ol>
    </section>

    <QrGenerator v-if="tab === 'generate'" />

    <p v-if="status" class="status">{{ status }}</p>
  </main>
</template>

<style scoped>
h1 {
  font-size: 20px;
  text-align: center;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.tab {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: #1e293b;
  color: #94a3b8;
  font-weight: 700;
  font-size: 15px;
}
.tab.active {
  background: #3b82f6;
  color: #fff;
}
.card {
  background: #1e293b;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
}
h2 {
  font-size: 15px;
  margin: 0 0 12px;
  color: #93c5fd;
}
.env {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 14px;
  line-height: 1.9;
}
.env b {
  color: #e2e8f0;
}
.ok {
  color: #4ade80 !important;
}
.no {
  color: #f87171 !important;
}
.ua-row {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}
.ua {
  word-break: break-all;
  color: #64748b;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.btn {
  flex: 1;
  min-width: 130px;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: #22c55e;
  color: #052e16;
  font-weight: 700;
  font-size: 15px;
  text-align: center;
  text-decoration: none;
}
.btn.ghost {
  background: #334155;
  color: #e2e8f0;
}
.btn.link {
  background: #3b82f6;
  color: #fff;
}
.btn.zx {
  background: #a855f7;
  color: #fff;
}
.btn.liff {
  background: #06c755;
  color: #04371a;
}
.scan-actions {
  flex-direction: column;
  gap: 12px;
}
.scan-actions .btn {
  width: 100%;
  min-width: unset;
}
.modal-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #cbd5e1;
  margin-bottom: 12px;
}
.modal-toggle input {
  width: 18px;
  height: 18px;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}
.modal-card {
  width: 100%;
  max-width: 420px;
  background: #1e293b;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #93c5fd;
  font-weight: 700;
  font-size: 14px;
}
.modal-x {
  border: none;
  background: transparent;
  color: #e2e8f0;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}
.btn:disabled {
  opacity: 0.45;
}
.hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 10px 0 0;
}
.warn {
  color: #fbbf24;
  font-size: 13px;
}
.result {
  word-break: break-all;
  background: #0f172a;
  padding: 12px;
  border-radius: 8px;
  font-family: monospace;
}
.history {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
}
.history li {
  margin-bottom: 8px;
}
.tag {
  background: #334155;
  padding: 1px 6px;
  border-radius: 6px;
  margin-right: 6px;
}
.time {
  color: #94a3b8;
}
.hval {
  word-break: break-all;
  font-family: monospace;
  margin-top: 2px;
}
.status {
  text-align: center;
  color: #fbbf24;
  font-size: 13px;
}
</style>
