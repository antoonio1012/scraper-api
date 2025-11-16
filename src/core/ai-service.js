// File: src/core/ai-service.js

const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

class AIService {
    static async callAI(prompt) {
        try {
            console.log("🤖 Calling AI via OpenRouter (Mode Ekstraksi JSON)...");
            
            const response = await axios.post(OPENROUTER_API_URL, {
                model: "deepseek/deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                
                // ✅ FIX: Batasi OUTPUT token untuk menghemat kredit
                max_tokens: 500, 

            }, {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000', 
                    'X-Title': 'Ebay AI Scraper'
                },
                // Kurangi timeout karena input lebih kecil
                timeout: 15000 
            });
            
            console.log("✅ AI JSON Response received");
            
            const aiResponseString = response.data.choices[0].message.content;
            return { source: 'openrouter-deepseek', response: aiResponseString };

        } catch (error) {
            console.error('❌ OpenRouter Error:', error.response?.data || error.message);
            console.log("🔄 Using Mock AI as fallback...");
            
            return { 
                source: 'mock', 
                response: JSON.stringify({
                    product_name: "Mock Product",
                    product_price: "Mock Price",
                    product_description: "Mock AI Description"
                })
            };
        }
    }
}

module.exports = AIService;