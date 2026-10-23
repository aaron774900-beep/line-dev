const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 帳號與密碼雙重驗證中介軟體
const checkAuth = (req, res, next) => {
    const username = req.headers['x-username'] || req.body.username;
    const password = req.headers['x-password'] || req.body.password;

    const validUser = process.env.WEB_USERNAME || 'Aaron'; // 可在 Vercel 設定 WEB_USERNAME，預設 Aaron
    const validPass = process.env.WEB_PASSWORD;

    if (username === validUser && password === validPass) {
        next();
    } else {
        res.status(401).json({ error: '帳號或密碼錯誤！' });
    }
};

// 發送 LINE 1 對 1 Push Message API
app.post('/api/broadcast', checkAuth, async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: '訊息內容不能為空' });
    }

    try {
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const userId = process.env.LINE_USER_ID;

        if (!userId) {
            return res.status(500).json({ error: '未設定 LINE_USER_ID 環境變數' });
        }

        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                to: userId,
                messages: [{ type: 'text', text: message }]
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`LINE API 錯誤: ${response.status} - ${errorData}`);
        }

        res.json({ success: true, message: '訊息已成功發送到你的 LINE！' });
    } catch (error) {
        console.error('發送失敗:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`伺服器運行中，連接埠: ${PORT}`);
});
