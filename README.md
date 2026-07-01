# LINE LIFF QR 掃描 POC

用 Vue 3 + Vite 製作的 QR code 掃描 POC，**同時支援 LIFF（LINE App 內）與一般瀏覽器**，可免費部署到 GitHub Pages。

## 功能

- **兩種掃描引擎，皆走瀏覽器相機**（可在一般瀏覽器與 LINE 內建瀏覽器 iOS/Android 使用）
  - `html5-qrcode`：高階、內建掃描框與相機切換。
  - `@zxing/browser`：核心維護活躍、可自訂，供比較與備援。
- 產生 QR 分頁：自動產生 GUID、生成 QR、頁面顯示 GUID。
- **可切換掃描開啟方式**：「以彈跳視窗開啟相機」checkbox（**預設打勾**）— 勾選時以 Modal 彈窗開相機，掃到後自動關閉並顯示結果；取消勾選則內嵌於頁面掃描。
- 顯示執行環境資訊（是否在 LINE App、OS、LIFF 版本）。
- 掃描結果顯示、複製、若為網址可直接開啟、掃描歷史（標記掃描引擎）。

> 註：`liff.scanCodeV2()` 原生掃描在 iOS 的 LINE 不支援，故本 POC 掃描一律走瀏覽器相機（html5-qrcode / @zxing/browser），全平台通用。

## 掃描方式支援對照

| 環境 | html5-qrcode | @zxing/browser |
|------|:---:|:---:|
| LINE App 內 (Android LIFF) | ✅ | ✅ |
| LINE App 內 (iOS LIFF) | ✅ | ✅ |
| 外部瀏覽器 (Chrome/Safari) | ✅ | ✅ |

> 兩者皆需 **HTTPS** 或 `localhost` 才能取得相機權限。GitHub Pages 預設就是 HTTPS。
> `@zxing/library` 與 `html5-qrcode` 對標準 QR 支援等價；兩者皆不支援 Micro QR。

## 測試方式（模擬客戶情境）

1. 開「產生 QR」分頁 → 產生一組 GUID 的 QR（可用另一支手機/螢幕顯示）。
2. 回「掃描」分頁，確認 **「以彈跳視窗開啟相機」已勾選**（預設打勾）。
3. 點 **html5-qrcode 掃描** 或 **@zxing/browser 掃描** → 相機以**彈跳視窗（Modal）**開啟。
4. 對準 QR，掃到後 **視窗自動關閉**，結果顯示在「最新結果」與「掃描紀錄」（標記使用的引擎）。
5. 驗證掃到的值與步驟 1 產生的 **GUID 相同** → 端到端 POC 成功。
6. 想比較「內嵌掃描」行為時，取消勾選再掃一次即可。

> Modal 關閉（掃到、按 ×、或點背景）時都會 `stop()` 釋放相機，相機燈會熄滅。

## 兩種掃描庫支援的瀏覽器 / 手機

圖例：✅ 完整支援（相機即時掃描）｜🟡 部分支援（僅檔案上傳，相機開發中）｜❌ 不支援

### html5-qrcode

資料來源：官方 README [mebjas/html5-qrcode](https://github.com/mebjas/html5-qrcode#supported-platforms)

| 平台 | 瀏覽器 | 支援 |
|------|--------|:---:|
| PC / Mac | Firefox / Chrome / Safari / Opera / Edge | ✅ |
| Android | Chrome / Firefox / Edge / Opera | ✅ |
| Android | Opera Mini / UC Browser | 🟡 |
| iOS | Safari | ✅ |
| iOS | Chrome / Firefox | ✅（iOS ≥ 15.1）※ |
| iOS | Edge | 🟡 |

> ※ iOS 15.1 以前，第三方瀏覽器共用 WebKit 且無法取得相機權限，故只能檔案上傳。詳見 [issue/14](https://github.com/mebjas/html5-qrcode/issues/14)。

### @zxing/browser

資料來源：官方 repo [zxing-js/browser](https://github.com/zxing-js/browser)（無官方支援矩陣；掃描完全依賴瀏覽器 `MediaDevices.getUserMedia`，故支援度等同該 API）

| 平台 | 瀏覽器 | 支援 |
|------|--------|:---:|
| PC / Mac | Chrome / Firefox / Safari / Edge / Opera | ✅ |
| Android | Chrome / Firefox / Edge / Opera / Samsung Internet | ✅ |
| iOS | Safari（iOS 11+） | ✅ |
| iOS | Chrome / Firefox / Edge（iOS 14.3+） | ✅ |

> `getUserMedia` 需在 **HTTPS / localhost** 下才可用；iOS 上第三方瀏覽器同樣受 WebKit 版本限制。
> 除相機掃描外，`@zxing/browser` 亦支援從 `<img>` / `<video>` / 圖片或影片 URL 解碼。

### 小結

- 兩者在 **主流桌機瀏覽器、Android Chrome、iOS Safari** 皆可即時相機掃描 → 本 POC 目標環境全覆蓋。
- **iOS 第三方瀏覽器**兩者都受 WebKit 版本限制（html5-qrcode 需 iOS ≥ 15.1、getUserMedia 需 iOS ≥ 14.3）。
- **LINE 內建瀏覽器（iOS/Android）** 走的是系統 WebView 的 `getUserMedia`，兩者皆可掃描。

### 哪款相機問題最少？（結論）

就「**開箱即用、相機問題最少**」而言 → **html5-qrcode 略勝**。

- **html5-qrcode（推薦作為主要引擎）**
  - 內建處理最容易出包的環節：權限請求、相機列舉、**後鏡頭自動選擇**、手電筒/變焦、掃描框、長寬比、方向。
  - iOS 相容性已調校；相機不可用時可退回**檔案上傳**。
  - 社群使用量極大，常見裝置的坑多已修復。
  - ⚠️ 目前為**維護模式**（作者暫不修 bug、不併 PR）。
- **@zxing/browser（比較 / 備援）**
  - 薄封裝，`getUserMedia`、串流釋放、對焦、constraints 需自行處理 → 出錯點較多。
  - 但**完全可控**且核心維護活躍，踩到特定 bug 時能自行修正。

**建議**：POC / 快速上線用 **html5-qrcode** 為主；若特定 Android 機型對焦不佳或遇到相容問題，再切換 **@zxing/browser** 對照。本專案保留兩顆按鈕即為此目的。


## 本機開發

```bash
npm install
cp .env.example .env   # 填入 VITE_LIFF_ID（沒有也能用瀏覽器相機）
npm run dev
```

打開 `https://localhost:5173`（相機需 HTTPS 或 localhost）。手機測試可用 `npm run dev -- --host` 加上區網 IP，但區網 IP 非 HTTPS 時相機會被擋，建議直接部署後用手機測。

## 部署到 GitHub Pages

1. 建立 GitHub repo，推送本專案。
2. Repo **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
3. Repo **Settings → Secrets and variables → Actions → Variables** 新增變數 `VITE_LIFF_ID`（值填你的 LIFF ID；可先留空）。
4. Push 到 `main` 分支即自動建置部署，網址為 `https://<帳號>.github.io/<repo>/`。

## 設定 LINE LIFF

1. 到 [LINE Developers Console](https://developers.line.biz/) 建立 Provider 與 **LINE Login** channel。
2. 新增 LIFF app：
   - **Endpoint URL** 填 GitHub Pages 網址（部署完成後的 `https://<帳號>.github.io/<repo>/`）。
   - **Size** 選 Full。
   - Scopes 勾 `profile`、`openid`（本 POC 不強制需要）。
3. 複製 **LIFF ID** 填入 GitHub Actions Variable `VITE_LIFF_ID`，重新觸發部署。
4. 用 LINE 開啟 `https://liff.line.me/<LIFF_ID>` 測試 LIFF 內行為。

## 技術

- Vue 3 + Vite
- `@line/liff`
- `html5-qrcode`
- `@zxing/browser` + `@zxing/library`
- `qrcode`（產生 QR）
