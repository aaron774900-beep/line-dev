import { createClient } from 'redis';

// 建立 Redis 客戶端連線（Vercel 會自動讀取環境變數）
const client = createClient({
  url: process.env.REDIS_URL || process.env.STORAGE_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

async function getRedisClient() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-username, x-password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET 請求：從 Redis 讀取歷史紀錄
  if (req.method === 'GET') {
    try {
      const redis = await getRedisClient();
      const historyJson = await redis.lRange('memo_history', 0, 9);
      const history = historyJson.map(item => JSON.parse(item));
      return res.status(200).json({ success: true, history });
    } catch (error) {
      console.error('Redis Read Error:', error);
      return res.status(500).json({ success: false, error: '無法讀取雲端歷史紀錄' });
    }
  }

  // 2. POST 請求：發送 LINE 訊息並存入 Redis
  if (req.method === 'POST') {
    const { username, password, message } = req.body;

    const envUser = process.env.ADMIN_USER || 'Aaron';
    const envPass = process.env.ADMIN_PASS || '123456';

    const reqUser = username || req.headers['x-username'];
    const reqPass = password || req.headers['x-password'];

    if (reqUser !== envUser || reqPass !== envPass) {
      return res.status(401).json({ success: false, error: '帳號或密碼錯誤！' });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = process.env.LINE_USER_ID;

    if (!token || !userId) {
      return res.status(500).json({ success: false, error: '伺服器未設定 LINE Token 或 User ID' });
    }

    try {
      const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
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

      if (!lineRes.ok) {
        const errorData = await lineRes.json();
        return res.status(lineRes.status).json({ success: false, error: 'LINE API 發送失敗', details: errorData });
      }

      // 寫入 Redis 雲端資料庫
      const redis = await getRedisClient();
      const newEntry = {
        text: message,
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };

      await redis.lPush('memo_history', JSON.stringify(newEntry));
      await redis.lTrim('memo_history', 0, 9); // 保留最新 10 筆

      return res.status(200).json({ success: true, message: '訊息已成功發送並同步至雲端！' });
    } catch (err) {
      return res.status(500).json({ success: false, error: '伺服器內部錯誤', details: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

