<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { BrowserQRCodeReader, BrowserCodeReader } from '@zxing/browser'

const emit = defineEmits(['scanned', 'error', 'close'])

const videoEl = ref(null)
const cameras = ref([])
const currentDeviceId = ref('')
const running = ref(false)
let reader = null
let controls = null

/** 啟動指定相機的解碼 */
async function startWith(deviceId) {
  if (!reader) reader = new BrowserQRCodeReader()
  controls = await reader.decodeFromVideoDevice(
    deviceId || undefined,
    videoEl.value,
    (result) => {
      if (result) emit('scanned', result.getText())
    }
  )
  running.value = true
  currentDeviceId.value = deviceId || ''
}

/** 初始化相機清單並啟動（優先後鏡頭） */
async function start() {
  try {
    const devices = await BrowserCodeReader.listVideoInputDevices()
    if (!devices || devices.length === 0) {
      emit('error', '找不到可用的相機')
      return
    }
    cameras.value = devices
    const back = devices.find((d) => /back|rear|environment|後/i.test(d.label))
    await startWith((back || devices[devices.length - 1]).deviceId)
  } catch (err) {
    emit('error', formatError(err))
  }
}

/** 切換相機 */
async function switchCamera() {
  if (cameras.value.length < 2) return
  const idx = cameras.value.findIndex((c) => c.deviceId === currentDeviceId.value)
  const next = cameras.value[(idx + 1) % cameras.value.length]
  await stop()
  await startWith(next.deviceId)
}

/** 停止解碼並釋放相機 */
async function stop() {
  try {
    if (controls) controls.stop()
  } catch (_) {
    // 忽略停止時的例外
  } finally {
    controls = null
    running.value = false
  }
}

function formatError(err) {
  if (err && err.name === 'NotAllowedError') return '相機權限被拒絕，請在瀏覽器設定中允許相機。'
  if (err && err.name === 'NotFoundError') return '找不到相機裝置。'
  return (err && err.message) || String(err)
}

async function close() {
  await stop()
  emit('close')
}

defineExpose({ start, stop })

onBeforeUnmount(stop)
</script>

<template>
  <div class="scanner">
    <video ref="videoEl" class="video" muted playsinline></video>
    <div class="controls">
      <button class="btn" @click="switchCamera" :disabled="cameras.length < 2">
        切換相機
      </button>
      <button class="btn ghost" @click="close">關閉</button>
    </div>
    <p v-if="cameras.length" class="hint">
      @zxing/browser · 偵測到 {{ cameras.length }} 個相機
    </p>
  </div>
</template>

<style scoped>
.video {
  width: 100%;
  border-radius: 12px;
  background: #000;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
.controls {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.btn {
  flex: 1;
  padding: 12px;
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
.btn:disabled {
  opacity: 0.5;
}
.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #94a3b8;
}
</style>
