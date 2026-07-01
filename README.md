# LINE LIFF QR Code Scanner POC

LINE LIFF 環境的 QR Code 掃描測試工具。比較三種掃描方式在不同瀏覽器/裝置上的相容性，並將每次掃描結果自動記錄至 GitHub Gist。

---

## 功能

| 功能 | 說明 |
|------|------|
| **html5-qrcode 掃描** | 使用 `html5-qrcode` 函式庫存取相機 |
| **@zxing/browser 掃描** | 使用 `@zxing/browser` 函式庫存取相機 |
| **liff.scanCodeV2** | LINE 原生掃描（僅限 LINE App + iOS ≥ 14.3 或 Android） |
| **QR 產生器** | 輸入文字或網址，即時產生 QR Code |
| **Gist 記錄** | 掃描成功時自動將瀏覽器資訊寫入 GitHub Gist |
| **LIFF Link 複製** | 一鍵複製可分享的 LIFF 連結 |

---

## 本機開發

```bash
npm install
cp .env.example .env   # 填入環境變數
npm run dev
```

---

## 環境變數

| 變數 | 必填 | 說明 |
|------|------|------|
| `VITE_LIFF_ID` | 否 | LINE Developers Console → LIFF → LIFF ID |
| `VITE_GITHUB_GIST_TOKEN` | 否 | GitHub PAT，僅需 `gist` scope |
| `VITE_GITHUB_GIST_ID` | 否 | 目標 Gist 的 ID（URL 最後那串 hash） |

不設定 `VITE_LIFF_ID` 也能運作——LIFF 原生功能停用，瀏覽器相機掃描仍可用。  
不設定 Gist 變數時，掃描紀錄功能靜默停用。

---

## 部署（GitHub Pages）

推送到 `main` 自動觸發 GitHub Actions。

### GitHub Secrets / Variables 設定

repo → **Settings → Secrets and variables → Actions**：

| 類型 | 名稱 | 值 |
|------|------|-----|
| Variable | `VITE_LIFF_ID` | 你的 LIFF ID |
| Secret | `VITE_GITHUB_GIST_TOKEN` | GitHub PAT（gist scope） |
| Secret | `VITE_GITHUB_GIST_ID` | 目標 Gist ID |

### 建立 GitHub PAT（Gist 用）

1. GitHub → Settings → Developer settings → Personal access tokens (classic)
2. Generate new token → 只勾 **`gist`**
3. 複製 token → 貼入 `VITE_GITHUB_GIST_TOKEN` Secret

### 建立目標 Gist

1. 前往 [gist.github.com](https://gist.github.com)
2. 新建 Gist（內容隨意，Public / Secret 皆可）
3. URL 最後那串 hash → 貼入 `VITE_GITHUB_GIST_ID` Secret

---

## Gist 掃描紀錄格式

每次掃描成功，Gist 中的 `scan-log.txt` 最上方新增一筆：

```
time:    2026-07-01T10:23:45.000Z
result:  https://example.com
source:  html5-qrcode
browser: LINE 14.5
os:      ios
liff:    2.22.1
ua:      Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ...
---
```

---

## 掃描引擎比較

| 引擎 | iOS LINE App | Android LINE App | 一般瀏覽器 |
|------|:-----------:|:----------------:|:---------:|
| `liff.scanCodeV2` | ✅（iOS ≥ 14.3） | ✅ | ❌ |
| `html5-qrcode` | ⚠️（相機權限問題） | ✅ | ✅ |
| `@zxing/browser` | ⚠️（相機權限問題） | ✅ | ✅ |

`liff.scanCodeV2` 是 LINE App 環境中最穩定的選擇。

---

## 技術棧

- [Vue 3](https://vuejs.org/) + `<script setup>`
- [Vite](https://vitejs.dev/)
- [LINE LIFF SDK](https://developers.line.biz/en/docs/liff/)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- [@zxing/browser](https://github.com/zxing-js/browser)
- GitHub Actions + GitHub Pages
