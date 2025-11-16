// File: index.js (di root folder)

require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.port || 3000;

// Middleware
app.use(express.json());

// --- Impor dan Gunakan Rute ---
// Semua rute di api.js akan otomatis diawali dengan /api
const apiRoutes = require('./src/routes/api.js');
app.use('/api', apiRoutes);

// Rute root (dari file lama Anda)
app.get('/', (req, res) => {
    res.json({ 
        message: 'EBAY AI SCRAPER API - STEALTH MODE 🚀',
        status: 'OK', 
        port: port,
        has_openrouter_key: !!process.env.OPENROUTER_API_KEY,
        endpoints: {
            '/api/scrape?query=nike&pages=1': 'MAIN ENDPOINT (Proses semua produk)',
            '/api/scrape?query=nike&pages=1&limit=2': 'MAIN ENDPOINT (Proses 2 produk)',
            '/api/test-scrape?query=nike': 'Test scraping halaman list saja',
            '/api/test-details?url=...': 'Test scraping halaman detail saja',
            '/api/test-ai?prompt=Hello': 'Test AI only',
            '/': 'This page'
        }
    });
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
    console.log(`🔑 OpenRouter API Key Loaded: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
    console.log(`🤖 Puppeteer Stealth Mode is ON.`);
});