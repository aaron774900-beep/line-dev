require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');

const app = express();
app.use(express.json());
app.use(express.static('public')); // 讓前端網頁放在 public 資料夾

// 設定 LINE SDK
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};
const client = new line.Client(config);

// 設定你的網頁解鎖密碼（也可以從 Render 環境變數讀取）
const WEB_PASSWORD = process.env.WEB_PASSWORD || "123456";

// 發送備忘錄 API
app.post('/api/send-memo', async (req, res) => {
  const { password, message } = req.body;

  // 1. 驗證密碼
  if (password !== WEB_PASSWORD) {
    return res.status(401).json({ success: false, error: '密碼錯誤！' });
  }

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, error: '備忘錄內容不能為空！' });
  }

  try {
    // 2. 透過 LINE API 廣播給所有加入官方帳號的好友
    await client.broadcast({
      type: 'text',
      text: `📌 【備忘錄通知】\n${message}`
    });

    res.json({ success: true, message: '訊息已成功發送給所有好友！' });
  } catch (err) {
    console.error('LINE API 發送失敗:', err);
    res.status(500).json({ success: false, error: '發送失敗，請檢查 LINE Token 設定。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器運作中：http://localhost:${PORT}`);
});
