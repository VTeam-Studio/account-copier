import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

// 配置 CORS，只允许特定域名访问
app.use(cors({
    origin: ['https://how.milkawa.xyz', 'http://localhost:3000'],
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

// 代理 Mojang API 的请求
app.get('/api/minecraft/uuid/:username', async (req, res) => {
    try {
        const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${req.params.username}`);
        if (response.status === 404) {
            return res.status(404).json({ error: 'Player not found' });
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3001; // 改用 3001 端口

// 添加错误处理
const server = app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try another port.`);
        process.exit(1);
    } else {
        console.error('Server error:', error);
        process.exit(1);
    }
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.info('SIGTERM signal received.');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});