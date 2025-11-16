// File: src/core/ai-service.js

const axios = require('axios');
require('dotenv').config(); // Pastikan .env dimuat

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

class AIService {
    /**
     * Menghubungi OpenRouter AI untuk analisis.
     * @param {string} prompt - Prompt yang akan dikirim ke AI.
     * @returns {object} - { source: string, response: string }
     */
    static async callAI(prompt) {
        try {
            console.log("🤖 Calling AI via OpenRouter...");
            const response = await axios.post(OPENROUTER_API_URL, {
                model: "deepseek/deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 150,
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000', // Sesuaikan jika perlu
                    'X-Title': 'Ebay AI Scraper'
                },
                timeout: 10000
            });
            console.log("✅ AI Response received");
            let aiResponse = response.data.choices[0].message.content;
            aiResponse = aiResponse.replace(/[^\x20-\x7E\n\r]/g, '').substring(0, 200);
            return { source: 'openrouter-deepseek', response: aiResponse };
        } catch (error) {
            console.error("❌ OpenRouter Error:", error.response?.data || error.message);
            console.log("🔄 Using Mock AI as fallback...");
            await new Promise(resolve => setTimeout(resolve, 500));
            return { source: 'mock', response: 'AI Analysis: Product information extracted. [Mock Data]' };
        }
    }
}

module.exports = AIService;