# LINE LIFF QR 掃描 POC

用 Vue 3 + Vite 製作的 QR code 掃描 POC，**同時支援 LIFF（LINE App 內）與一般瀏覽器**，可免費部署到 GitHub Pages。

## 功能

- **雙掃描引擎並存**
  - LIFF 環境：優先使用 `liff.scanCodeV2()`（LINE 原生掃描 UI）。
  - 一般瀏覽器 / 不支援原生掃描時：自動改用 `html5-qrcode`（純前端相機掃描，可切換前後鏡頭）。
- 顯示執行環境資訊（是否在 LINE App、OS、LIFF 版本、原生掃描是否可用）。
- 掃描結果顯示、複製、若為網址可直接開啟、掃描歷史紀錄。

## 掃描方式支援對照

| 環境 | LIFF 原生掃描 | 瀏覽器相機 (html5-qrcode) |
|------|:---:|:---:|
| LINE App 內 (Android LIFF) | ✅ | ✅ |
| LINE App 內 (iOS LIFF) | ⚠️ 常不支援 | ✅ |
| 外部瀏覽器 (Chrome/Safari) | ❌ | ✅（需 HTTPS） |

> 相機掃描需在 **HTTPS** 或 `localhost` 下才能取得相機權限。GitHub Pages 預設就是 HTTPS。

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
