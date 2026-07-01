<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'

const emit = defineEmits(['scanned', 'error', 'close'])

const regionId = 'html5qr-region'
const cameras = ref([])
const currentCameraId = ref('')
const running = ref(false)
let html5Qrcode = null

/** 啟動指定相機的掃描 */
async function startWith(cameraId) {
  if (!html5Qrcode) {
    html5Qrcode = new Html5Qrcode(regionId, { verbose: false })
  }
  await html5Qrcode.start(
    cameraId,
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      emit('scanned', decodedText)
    },
    () => {
      // 每一幀掃不到不視為錯誤，忽略即可
    }
  )
  running.value = true
  currentCameraId.value = cameraId
}

/** 初始化相機清單並啟動（優先後鏡頭） */
async function start() {
  try {
    const devices = await Html5Qrcode.getCameras()
    if (!devices || devices.length === 0) {
      emit('error', '找不到可用的相機')
      return
    }
    cameras.value = devices
    const back = devices.find((d) => /back|rear|environment|後/i.test(d.label))
    await startWith(back ? back.id : devices[devices.length - 1].id)
  } catch (err) {
    emit('error', formatError(err))
  }
}

/** 切換相機 */
async function switchCamera() {
  if (cameras.value.length < 2) return
  const idx = cameras.value.findIndex((c) => c.id === currentCameraId.value)
  const next = cameras.value[(idx + 1) % cameras.value.length]
  await stop()
  await startWith(next.id)
}

/** 停止掃描並釋放相機 */
async function stop() {
  try {
    if (html5Qrcode && running.value) {
      await html5Qrcode.stop()
      await html5Qrcode.clear()
    }
  } catch (_) {
    // 忽略停止時的例外
  } finally {
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
    <div :id="regionId" class="region"></div>
    <div class="controls">
      <button class="btn" @click="switchCamera" :disabled="cameras.length < 2">
        切換相機
      </button>
      <button class="btn ghost" @click="close">關閉</button>
    </div>
    <p v-if="cameras.length" class="hint">偵測到 {{ cameras.length }} 個相機</p>
  </div>
</template>

<style scoped>
.region {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
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
