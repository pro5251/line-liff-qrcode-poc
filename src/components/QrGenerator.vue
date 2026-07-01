<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

const guid = ref('')
const dataUrl = ref('')
const status = ref('')

/** 產生一組 GUID 並生成對應 QR code 圖片 */
async function generate() {
  status.value = ''
  guid.value =
    (crypto.randomUUID && crypto.randomUUID()) ||
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  try {
    dataUrl.value = await QRCode.toDataURL(guid.value, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M'
    })
  } catch (err) {
    status.value = '產生 QR 失敗：' + (err?.message || String(err))
  }
}

async function copyGuid() {
  try {
    await navigator.clipboard.writeText(guid.value)
    status.value = '已複製 GUID。'
  } catch (_) {
    status.value = '複製失敗，請手動選取。'
  }
}

onMounted(generate)
</script>

<template>
  <section class="card">
    <h2>產生 QR Code（GUID）</h2>

    <div class="qr-wrap" v-if="dataUrl">
      <img :src="dataUrl" alt="QR code" class="qr" />
    </div>

    <label class="label">GUID</label>
    <p class="guid">{{ guid }}</p>

    <div class="actions">
      <button class="btn" @click="generate">重新產生</button>
      <button class="btn ghost" @click="copyGuid">複製 GUID</button>
    </div>

    <p class="hint">用「掃描」分頁掃這張 QR，即可讀回這組 GUID。</p>
    <p v-if="status" class="status">{{ status }}</p>
  </section>
</template>

<style scoped>
h2 {
  font-size: 15px;
  margin: 0 0 12px;
  color: #93c5fd;
}
.card {
  background: #1e293b;
  border-radius: 14px;
  padding: 16px;
}
.qr-wrap {
  display: flex;
  justify-content: center;
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 14px;
}
.qr {
  width: 260px;
  height: 260px;
}
.label {
  font-size: 12px;
  color: #94a3b8;
}
.guid {
  word-break: break-all;
  background: #0f172a;
  padding: 12px;
  border-radius: 8px;
  font-family: monospace;
  margin: 4px 0 14px;
}
.actions {
  display: flex;
  gap: 8px;
}
.btn {
  flex: 1;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: #22c55e;
  color: #052e16;
  font-weight: 700;
  font-size: 15px;
}
.btn.ghost {
  background: #334155;
  color: #e2e8f0;
}
.hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 12px 0 0;
}
.status {
  color: #fbbf24;
  font-size: 13px;
  text-align: center;
}
</style>
