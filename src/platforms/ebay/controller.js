// File: src/platforms/ebay/controller.js

const EbayScraper = require('./scraper');
const AIService = require('../../core/ai-service');

class EbayController {

    /**
     * Endpoint utama untuk scrape list produk, detail, dan AI.
     */
    static async scrapeProducts(req, res) {
        try {
            const { query, pages = 1, limit } = req.query;
            if (!query) {
                return res.status(400).json({ success: false, error: 'Parameter "query" diperlukan' });
            }

            const numLimit = limit ? parseInt(limit) : null;
            const numPages = parseInt(pages);
            const scraper = new EbayScraper(); // Buat instance scraper
            
            console.log(`🎯 SCRAPING: ${query}, LIMIT: ${numLimit || 'Semua Produk'}`);
            let allProducts = [];

            for (let page = 1; page <= numPages; page++) {
                console.log(`📄 Scraping page ${page}...`);
                
                const products = await scraper.scrapeProducts(query, page);
                if (products.length === 0) {
                    console.log(`No products found on page ${page}, stopping.`);
                    break;
                }
                
                const productsToProcess = numLimit ? products.slice(0, numLimit) : products;
                console.log(`📦 Processing ${productsToProcess.length} products for this page...`);

                
                const processedProducts = [];
                for (const product of productsToProcess) {
                    try {
                        const delay = 500 + Math.random() * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));

                        console.log(`⚙️ Processing (Sekuensial): ${product.product_name.substring(0, 50)}...`);
                        
                        // Panggil metode dari instance scraper
                        const details = await scraper.scrapeProductDetails(product.product_url);
                        
                        const aiPrompt = `Analyze this product title: ${product.product_name}`;
                        
                        // Panggil metode statis dari AIService
                        const aiResult = await AIService.callAI(aiPrompt);
                        
                        product.product_description = details.product_description;
                        product.item_specifics = details.item_specifics;
                        product.ai_data = {
                            source: aiResult.source,
                            analysis: aiResult.response
                        };
                        processedProducts.push(product);

                    } catch (err) {
                        console.error(`Gagal memproses produk: ${product.product_name}`, err.message);
                    }
                }
                
                allProducts.push(...processedProducts);
                
                if (page < numPages) {
                    console.log(`Waiting 1 second before next page...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            res.json({
                success: true,
                query: query,
                pages_scraped: parseInt(pages),
                total_products: allProducts.length,
                products: allProducts
            });
            
        } catch (error) {
            console.error('❌ API Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Endpoint tes untuk scrape list produk saja.
     */
    static async testScrape(req, res) {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ success: false, error: 'Parameter "query" diperlukan' });
            }
            const scraper = new EbayScraper();
            const products = await scraper.scrapeProducts(query, 1);
            res.json({ success: true, query: query, total_products: products.length, products: products });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Endpoint tes untuk scrape detail produk saja.
     */
    static async testDetails(req, res) {
        try {
            const { url } = req.query;
            if (!url) {
                return res.status(400).json({ success: false, error: 'Parameter "url" diperlukan' });
            }
            console.log(`[TEST DETAIL] 🕵️‍♂️ Scraping details for: ${url}`);
            const scraper = new EbayScraper();
            const details = await scraper.scrapeProductDetails(url);
            res.json({ success: true, url: url, result: details });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Endpoint tes untuk AI saja.
     */
    static async testAI(req, res) {
        try {
            const prompt = req.query.prompt || "Hello, AI!";
            const aiResult = await AIService.callAI(prompt);
            res.json({ success: true, prompt: prompt, ai_source: aiResult.source, response: aiResult.response });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = EbayController;