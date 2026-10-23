export default async function handler(req, res) {
    // 驗證 Vercel Cron 的授權（防止被外部隨意呼叫）
    const authHeader = req.headers['authorization'];
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // 抓取三峽（Sanxia）的天氣資訊（使用免費開源的 wttr.in API）
        const weatherRes = await fetch('https://wttr.in/Sanxia?format=j1');
        const weatherData = await weatherRes.json();
        
        const current = weatherData.current_condition[0];
        const tempC = current.temp_C;
        const desc = current.weatherDesc[0].value;
        const humidity = current.humidity;

        const message = `🌅 早安，Aaron！\n\n📍 今日三峽天氣報告：\n- 氣溫：${tempC}°C\n- 狀況：${desc}\n- 濕度：${humidity}%\n\n祝你有個美好且高效率的一天！🚀`;

        // 發送到你的 LINE
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const userId = process.env.LINE_USER_ID;

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
            throw new Error('LINE API 發送失敗');
        }

        return res.status(200).json({ success: true, message: '早安天氣推播成功！' });
    } catch (error) {
        console.error('Cron 執行錯誤:', error);
        return res.status(500).json({ error: error.message });
    }
}
