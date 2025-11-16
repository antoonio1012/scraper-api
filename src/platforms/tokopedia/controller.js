// File: src/platforms/tokopedia/controller.js

const TokopediaScraper = require('./scraper');
const AIService = require('../../core/ai-service');

class TokopediaController {

    static async scrapeProducts(req, res) {
        try {
            const { query, pages = 1, limit } = req.query;
            if (!query) {
                return res.status(400).json({ success: false, error: 'Parameter "query" diperlukan' });
            }

            const numLimit = limit ? parseInt(limit) : null;
            const numPages = parseInt(pages);
            
            const scraper = new TokopediaScraper(); 
            
            console.log(`🎯 SCRAPING [TOKOPEDIA]: ${query}, LIMIT: ${numLimit || 'Semua Produk'}`);
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
                        console.log(`⚙️ Processing (Sekuensial): ${product.product_name.substring(0, 50)}...`);
                        
                        const details = await scraper.scrapeProductDetails(product.product_url);
                        const aiPrompt = `Analyze this product title: ${product.product_name}`;
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
                platform: 'tokopedia',
                query: query,
                pages_scraped: parseInt(pages),
                total_products: allProducts.length,
                products: allProducts
            });
            
        } catch (error) {
            console.error('❌ API Error (Tokopedia):', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async testScrape(req, res) {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ success: false, error: 'Parameter "query" diperlukan' });
            }
            const scraper = new TokopediaScraper();
            const products = await scraper.scrapeProducts(query, 1);
            res.json({ success: true, query: query, total_products: products.length, products: products });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ✅ FIX: Menambahkan fungsi testDetails yang hilang
    static async testDetails(req, res) {
        try {
            const { url } = req.query;
            if (!url) {
                return res.status(400).json({ success: false, error: 'Parameter "url" diperlukan' });
            }
            console.log(`[TEST DETAIL] 🕵️‍♂️ Scraping details for: ${url}`);
            const scraper = new TokopediaScraper();
            const details = await scraper.scrapeProductDetails(url);
            res.json({ success: true, url: url, result: details });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = TokopediaController;