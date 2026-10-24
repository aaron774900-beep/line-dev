export default async function handler(req, res) {
  // 設定 CORS 跨域標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-username, x-password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 取得 Vercel KV / Redis 環境變數
  const kvUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;

  // =========================================================
  // 1. GET 請求：讀取雲端歷史紀錄
  // =========================================================
  if (req.method === 'GET') {
    try {
      if (!kvUrl || !kvToken) {
        return res.status(200).json({ success: true, history: [] });
      }
      const kvRes = await fetch(`${kvUrl}/lrange/memo_history/0/9`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      const data = await kvRes.json();
      const history = (data.result || []).map(item => (typeof item === 'string' ? JSON.parse(item) : item));
      return res.status(200).json({ success: true, history });
    } catch (error) {
      return res.status(500).json({ success: false, error: '無法讀取雲端歷史紀錄', details: error.message });
    }
  }

  // =========================================================
  // 2. POST 請求：發送 LINE Flex Message 並寫入 Redis
  // =========================================================
  if (req.method === 'POST') {
    const { username, password, message } = req.body || {};

    // 讀取後端環境變數帳密 (預設 fallback: Aaron / 123456)
    const envUser = process.env.ADMIN_USER || 'Aaron';
    const envPass = process.env.ADMIN_PASS || '123456';

    const reqUser = username || req.headers['x-username'];
    const reqPass = password || req.headers['x-password'];

    // 身分驗證
    if (reqUser !== envUser || reqPass !== envPass) {
      return res.status(401).json({ success: false, error: '帳號或密碼錯誤！' });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = process.env.LINE_USER_ID;

    if (!token || !userId) {
      return res.status(500).json({ success: false, error: '伺服器未設定 LINE Token 或 User ID' });
    }

    try {
      const nowTimeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

      // 呼叫 LINE Messaging API 發送 Flex Message 卡片
      const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: userId,
          messages: [
            {
              type: 'flex',
              altText: '📌 專屬備忘錄通知：' + message,
              contents: {
                type: 'bubble',
                size: 'mega',
                header: {
                  type: 'box',
                  layout: 'vertical',
                  backgroundColor: '#27272A',
                  paddingAll: '15px',
                  contents: [
                    {
                      type: 'text',
                      text: '📌 專屬備忘錄通知',
                      weight: 'bold',
                      color: '#10B981',
                      size: 'sm'
                    }
                  ]
                },
                body: {
                  type: 'box',
                  layout: 'vertical',
                  backgroundColor: '#18181B',
                  paddingAll: '15px',
                  contents: [
                    {
                      type: 'text',
                      text: message,
                      wrap: true,
                      color: '#FFFFFF',
                      size: 'md'
                    },
                    {
                      type: 'text',
                      text: nowTimeStr,
                      size: 'xs',
                      color: '#71717A',
                      margin: 'md'
                    }
                  ]
                }
              }
            }
          ]
        })
      });

      if (!lineRes.ok) {
        const errorData = await lineRes.json();
        return res.status(lineRes.status).json({ success: false, error: 'LINE API 發送失敗', details: errorData });
      }

      // 同步寫入 Redis (記錄最新 10 筆)
      if (kvUrl && kvToken) {
        const newEntry = JSON.stringify({
          text: message,
          time: nowTimeStr,
          timestamp: Date.now()
        });

        await fetch(`${kvUrl}/lpush/memo_history/${encodeURIComponent(newEntry)}`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });

        await fetch(`${kvUrl}/ltrim/memo_history/0/9`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
      }

      return res.status(200).json({ success: true, message: '備忘錄卡片已成功發送！' });
    } catch (err) {
      return res.status(500).json({ success: false, error: '伺服器內部錯誤', details: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
