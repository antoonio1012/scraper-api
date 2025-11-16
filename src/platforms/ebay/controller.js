// File: src/platforms/ebay/controller.js

const EbayScraper = require('./scraper');
const AIService = require('../../core/ai-service');
const BrowserService = require('../../core/browser'); 

/**
 * Helper function untuk membuat prompt AI
 */
function buildAIPrompt(pageText) {
    return `
        Anda adalah asisten ekstraksi data e-commerce.
        Tugas Anda adalah membaca teks mentah dari halaman produk dan mengembalikan JSON.
        
        Teks Mentah:
        """
        ${pageText}
        """

        Tolong ekstrak informasi berikut dari teks di atas:
        1. product_name: Nama lengkap produk. Ambil dari judul utama.
        
        2. product_price: Harga FINAL JUAL. 
           PRIORITASKAN mengambil harga konversi seperti:
           a) Teks yang mengandung "Approximately IDR" atau "IDR".
           b) Harga "Buy It Now" atau "Fixed Price" dari mata uang ASLI (USD, GBP, EUR).
           JANGAN lakukan konversi IDR. Kembalikan teks harga yang ditemukan (contoh: "Rp1.320.067,33" atau "GBP 59.99"). Jika tidak ada, isi "-".

        3. product_description: Deskripsi lengkap dari penjual. Prioritaskan bagian "Item specifics", "About this item", atau deskripsi yang terlihat jelas. Jika tidak ada deskripsi yang memadai, isi "-".
        
        4. product_image: URL gambar utama produk. Cari URL di bagian "Product Main Image URL:". Jika tidak ditemukan, isi "-".

        Pastikan Anda HANYA mengembalikan objek JSON yang valid, seperti contoh ini:
        {
          "product_name": "Contoh Nama Produk",
          "product_price": "Rp1.320.067,33",
          "product_description": "Ini adalah deskripsi produk yang diambil dari teks.",
          "product_image": "https://example.com/url-gambar-produk-utama.jpg"
        }
    `;
}

class EbayController {
    
    // FUNGSI UTAMA: MENGGUNAKAN AI MURNI
    static async scrapeProducts(req, res) {
        try {
            const { query, pages = 1, limit } = req.query;
            if (!query) {
                return res.status(400).json({ success: false, error: 'Parameter "query" diperlukan' });
            }

            const numLimit = limit ? parseInt(limit) : null;
            const numPages = parseInt(pages);
            const scraper = new EbayScraper(); 
            let itemCounter = 0;
            
            console.log(`🎯 SCRAPING (AI MODE): ${query}, LIMIT: ${numLimit || 'Semua Produk'}`);
            let allProducts = [];

            for (let page = 1; page <= numPages; page++) {
                console.log(`📄 Scraping page ${page} (mencari link)...`);
                
                const productLinks = await scraper.scrapeProducts(query, page);
                if (productLinks.length === 0) {
                    console.log(`No products found on page ${page}, stopping.`);
                    break;
                }
                
                const productsToProcess = numLimit ? productLinks.slice(0, numLimit) : productLinks;
                const totalItemsOnPage = productsToProcess.length;
                console.log(`📦 Memproses ${totalItemsOnPage} produk dengan AI...`);

                
                for (let i = 0; i < totalItemsOnPage; i++) {
                    const product = productsToProcess[i];
                    
                    // ✅ START FIX: HAPUS LOGIKA RETRY, LAKUKAN FETCH SEKALI
                    console.log(`[${i + 1}/${totalItemsOnPage}] ⚙️ Memproses (AI): ${product.product_url}`);
                    const productData = await scraper.getProductDetailText(product.product_url);
                    
                    // ✅ FIX: Cek gagal cepat
                    if (productData.text.includes("Teks tidak tersedia") || productData.text.length < 100) {
                        console.warn(`⚠️ FILTERED: Item dilewati (Gagal Cepat). URL: ${product.product_url}`);
                        continue; // Langsung Lompati
                    }
                    // ✅ END FIX: HAPUS LOGIKA RETRY
                    
                    // Lanjutkan Pemrosesan AI
                    try {
                        
                        const aiPrompt = buildAIPrompt(productData.text);
                        const aiResult = await AIService.callAI(aiPrompt);
                        
                        let extractedData = {};
                        try {
                            extractedData = JSON.parse(aiResult.response); 
                        } catch (parseError) {
                            console.error("❌ Gagal mem-parse JSON dari AI:", aiResult.response);
                            extractedData = {
                                product_name: "Error: AI Parse Failed",
                                product_price: "-",
                                product_description: aiResult.response,
                                product_image: productData.imageUrl
                            };
                        }
                        
                        // Logika filter kualitas data
                        if (!extractedData.product_name || extractedData.product_name.trim() === "") {
                             console.warn(`⚠️ FILTERED: AI mengembalikan nama kosong. Item dilewati.`);
                             continue;
                        }

                        allProducts.push({
                            product_url: product.product_url,
                            product_name: extractedData.product_name || "-",
                            product_price: extractedData.product_price || "-",
                            product_description: extractedData.product_description || "-",
                            product_image: productData.imageUrl || "-",
                            ai_source: aiResult.source
                        });

                        itemCounter++;
                        // Restart browser setiap 10 item (tanpa jeda 3 detik)
                        if (itemCounter % 10 === 0) {
                            console.log("♻️ Restarting browser instance to clear memory...");
                            await BrowserService.closeBrowser();
                            console.log("⏳ Waiting 1 second (minimal) for memory release...");
                            await new Promise(resolve => setTimeout(resolve, 1000)); // Mengurangi jeda ke 1 detik
                        }

                    } catch (err) {
                        console.error(`Gagal memproses produk: ${product.product_url}`, err.message);
                    }
                }
                
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

    // ... (Fungsi handler lainnya: testScrape, testDetails, testAI tidak berubah)
    static async testScrape(req, res) { /* ... */ }
    static async testDetails(req, res) { /* ... */ }
    static async testAI(req, res) { /* ... */ }
}

module.exports = EbayController;