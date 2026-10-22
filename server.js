const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 設定靜態檔案資料夾（前端網頁放在 public 資料夾下）
app.use(express.static(path.join(__dirname, 'public')));

// 密碼保護驗證中介軟體
const checkAuth = (req, res, next) => {
    const password = req.headers['x-password'] || req.query.password;
    if (password === process.env.WEB_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: '密碼錯誤或未授權' });
    }
};

// 驗證密碼是否正確的 API
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.WEB_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: '密碼錯誤' });
    }
});

// 發送 LINE 廣播訊息 API (使用原生 fetch，不需安裝 bot-sdk)
app.post('/api/broadcast', checkAuth, async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: '訊息內容不能為空' });
    }

    try {
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        
        const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        type: 'text',
                        text: message
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`LINE API 錯誤: ${response.status} - ${errorData}`);
        }

        res.json({ success: true, message: '廣播發送成功！' });
    } catch (error) {
        console.error('發送廣播失敗:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`伺服器運行中，連接埠: ${PORT}`);
});

