const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 帳號與密碼雙重驗證中介軟體
const checkAuth = (req, res, next) => {
    const username = req.headers['x-username'] || req.body.username;
    const password = req.headers['x-password'] || req.body.password;

    const validUser = process.env.WEB_USERNAME || 'Aaron';
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

// 管理員專屬：取得系統狀態與環境變數檢查
app.post('/api/admin/status', checkAuth, (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    res.json({
        success: true,
        data: {
            nodeEnv: process.env.NODE_ENV || 'development',
            uptimeSeconds: uptime,
            hasLineToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
            hasLineUserId: !!process.env.LINE_USER_ID,
            hasWebPassword: !!process.env.WEB_PASSWORD,
            serverTime: new Date().toISOString()
        }
    });
});

app.listen(PORT, () => {
    console.log(`伺服器運行中，連接埠: ${PORT}`);
});

