# 🚀 LINE 自動化發送儀表板 (LINE Automation Dashboard)

一個輕量、現代化且安全的雲端原生 Web 儀表板，支援發送 LINE 訊息卡片（Flex Message）、伺服器端帳密驗證、即時天氣顯示與雲端歷史紀錄同步。

---

## ✨ 核心功能特色

* **📱 精美 Flex Message 卡片推播**：打破傳統純文字，以帶有主題標題、時間戳記與自適應排版的卡片樣式發送 LINE 訊息。
* **☁️ 無伺服器跨裝置同步 (Vercel KV)**：採用 REST API 連接 Vercel KV (Redis)，實現輕量化且跨裝置的備忘錄歷史紀錄發送與讀取。
* **🔒 雙重安全驗證**：
  * **前端控制**：防刷新機制與互動式人類驗證問答。
  * **後端保護**：API 端點安全驗證（支援 `ADMIN_USER` 與 `ADMIN_PASS` 環境變數對比）。
* **🌦️ 即時資訊整合**：內建三峽區域即時天氣資訊面板。
* **🎨 互動式 UI 體驗**：支援 Markdown 即時預覽、發送成功彩花特效 (Canvas Confetti) 以及響應式深色模式介面。

---

## 🛠️ 技術棧 (Tech Stack)

* **前端 (Frontend)**：HTML5, CSS3 (Tailwind CSS / Canvas Confetti), Vanilla JavaScript
* **後端 (Backend)**：Vercel Serverless Functions (Node.js API Endpoint)
* **資料庫 (Database)**：Vercel KV (Redis via REST API)
* **第三方 API**：LINE Messaging API (Push / Flex Message)

---

## 📁 專案結構

```
├── api/
│   └── broadcast.js       # 後端 Serverless API (處理 LINE 推播與 Redis 讀寫)
├── index.html             # 前端主介面 (包含天氣、備忘錄輸入、驗證碼與歷史紀錄)
├── package.json           # 專案套件配置檔
└── README.md              # 專案說明文件
```

---

## ⚙️ 環境變數設定 (Environment Variables)

在 Vercel 專案設定 (`Settings > Environment Variables`) 中，請確保已設定以下環境變數：

| 變數名稱 | 說明 | 範例值 |
| :--- | :--- | :--- |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API 的 Long-lived Access Token | `YOUR_CHANNEL_ACCESS_TOKEN` |
| `LINE_USER_ID` | 接收推播訊息的 LINE User ID | `U1234567890abcdef...` |
| `ADMIN_USER` | 前端登入/發送時驗證的管理員帳號 | `Aaron` |
| `ADMIN_PASS` | 前端登入/發送時驗證的管理員密碼 | `YOUR_SECURE_PASSWORD` |
| `KV_REST_API_URL` | Vercel KV 的 REST API 網址 (自動注入) | `https://...kv.vercel-storage.com` |
| `KV_REST_API_TOKEN` | Vercel KV 的 Authorization Bearer Token (自動注入) | `YOUR_KV_TOKEN` |

---

## 🚀 部署與安裝指南

### 1. 本地端開發 / 準備
確保專案包含 `api/broadcast.js` 與前端介面，並推送到你的 GitHub 儲存庫。

### 2. 部署至 Vercel
1. 將 GitHub 儲存庫連結至 [Vercel](https://vercel.com)。
2. 在專案的 **Storage** 分頁建立一個全新的 **Vercel KV (Redis)** 資料庫，並將其連接到該專案（Vercel 會自動注入 `KV_REST_API_URL` 與 `KV_REST_API_TOKEN`）。
3. 在 **Settings > Environment Variables** 手動新增 `LINE_CHANNEL_ACCESS_TOKEN`、`LINE_USER_ID`、`ADMIN_USER` 與 `ADMIN_PASS`。
4. 點擊 **Deploy** 完成部署。

---

## 📝 授權條款 (License)

MIT License © 2026 Aaron.
