<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import liff from '@line/liff'
import Html5QrScanner from './components/Html5QrScanner.vue'

const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''

const env = reactive({
  liffReady: false,
  inClient: false,
  loggedIn: false,
  os: '',
  liffVersion: '',
  lineVersion: '',
  nativeScanAvailable: false,
  initError: ''
})

const scannerVisible = ref(false)
const scannerRef = ref(null)
const result = ref('')
const history = ref([])
const status = ref('')

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

/** LIFF 原生掃描（僅部分環境支援） */
async function scanWithLiff() {
  status.value = ''
  try {
    const res = await liff.scanCodeV2()
    if (res && res.value != null) {
      handleResult(res.value, 'LIFF 原生')
    } else {
      status.value = '使用者取消或未取得結果。'
    }
  } catch (err) {
    status.value = 'LIFF 掃描失敗：' + (err?.message || String(err)) + '，可改用瀏覽器相機。'
  }
}

/** 瀏覽器相機掃描（html5-qrcode） */
async function scanWithBrowser() {
  status.value = ''
  scannerVisible.value = true
  await nextTick()
  await scannerRef.value?.start()
}

function onScanned(text) {
  handleResult(text, '瀏覽器相機')
  scannerRef.value?.stop()
  scannerVisible.value = false
}

function onScannerError(msg) {
  status.value = msg
  scannerVisible.value = false
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

onMounted(initLiff)
</script>

<template>
  <main>
    <h1>LINE LIFF QR 掃描 POC</h1>

    <section class="card">
      <h2>環境資訊</h2>
      <ul class="env">
        <li>LIFF 初始化：<b :class="env.liffReady ? 'ok' : 'no'">{{ env.liffReady ? '成功' : '未完成' }}</b></li>
        <li>執行環境：<b>{{ env.liffReady ? (env.inClient ? 'LINE App 內 (LIFF)' : '外部瀏覽器') : '瀏覽器' }}</b></li>
        <li>已登入：<b>{{ env.loggedIn ? '是' : '否' }}</b></li>
        <li>OS / LIFF 版本：<b>{{ env.os || '-' }} / {{ env.liffVersion || '-' }}</b></li>
        <li>原生掃描可用：<b :class="env.nativeScanAvailable ? 'ok' : 'no'">{{ env.nativeScanAvailable ? '是' : '否' }}</b></li>
      </ul>
      <p v-if="env.initError" class="warn">{{ env.initError }}</p>
      <button v-if="env.liffReady && !env.loggedIn" class="btn ghost" @click="login">LINE 登入</button>
    </section>

    <section class="card">
      <h2>掃描</h2>
      <div class="actions">
        <button class="btn" :disabled="!env.nativeScanAvailable" @click="scanWithLiff">
          LIFF 原生掃描
        </button>
        <button class="btn" @click="scanWithBrowser">瀏覽器相機掃描</button>
      </div>
      <p class="hint">
        原生掃描僅在支援的 LINE App 環境可用；其他情況請用瀏覽器相機（需 HTTPS 與相機權限）。
      </p>

      <Html5QrScanner
        v-if="scannerVisible"
        ref="scannerRef"
        @scanned="onScanned"
        @error="onScannerError"
        @close="scannerVisible = false"
      />
    </section>

    <section class="card" v-if="result">
      <h2>最新結果</h2>
      <p class="result">{{ result }}</p>
      <div class="actions">
        <button class="btn ghost" @click="copyResult">複製</button>
        <a v-if="isUrl(result)" class="btn link" :href="result" target="_blank" rel="noopener">開啟連結</a>
      </div>
    </section>

    <section class="card" v-if="history.length">
      <h2>掃描紀錄</h2>
      <ol class="history">
        <li v-for="(h, i) in history" :key="i">
          <span class="tag">{{ h.source }}</span>
          <span class="time">{{ h.time }}</span>
          <div class="hval">{{ h.value }}</div>
        </li>
      </ol>
    </section>

    <p v-if="status" class="status">{{ status }}</p>
  </main>
</template>

<style scoped>
h1 {
  font-size: 20px;
  text-align: center;
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
