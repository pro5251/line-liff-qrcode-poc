# LINE LIFF QR 掃描 POC

用 Vue 3 + Vite 製作的 QR code 掃描 POC，**同時支援 LIFF（LINE App 內）與一般瀏覽器**，可免費部署到 GitHub Pages。

## 功能

- **兩種掃描引擎，皆走瀏覽器相機**（可在一般瀏覽器與 LINE 內建瀏覽器 iOS/Android 使用）
  - `html5-qrcode`：高階、內建掃描框與相機切換。
  - `@zxing/browser`：核心維護活躍、可自訂，供比較與備援。
- 產生 QR 分頁：自動產生 GUID、生成 QR、頁面顯示 GUID。
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
