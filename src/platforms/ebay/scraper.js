// File: src/platforms/ebay/scraper.js

const cheerio = require('cheerio');
const BrowserService = require('../../core/browser');
const Utils = require('../../core/utils');
const config = require('./config');

class EbayScraper {

    // METHOD INSTANCE: Mengambil link produk dari halaman pencarian
    async scrapeProducts(searchQuery, page = 1) {
        let pageInstance = null;
        try {
            const url = `${config.BASE_URL}?_nkw=${encodeURIComponent(searchQuery)}&_sacat=0&_pgn=${page}`;
            console.log(`[Mode Stealth] 🔍 Scraping eBay: ${searchQuery} - Page ${page}`);
            
            const browser = await BrowserService.getBrowser();
            pageInstance = await browser.newPage();
            
            await pageInstance.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await pageInstance.setViewport({ width: 1366, height: 768 });
            
            console.log(`🔗 Navigating to URL: ${url}`);
            await pageInstance.goto(url, { 
                waitUntil: 'domcontentloaded',
                timeout: config.TIMEOUTS.NAVIGATION 
            });

            console.log(`⏳ Menunggu produk...`);
            try {
                await pageInstance.waitForFunction(
                    () => {
                        const selectors = ['li.s-item', 'li.s-card', '.s-item__wrapper'];
                        for (const selector of selectors) {
                            if (document.querySelector(selector)) return true;
                        }
                        return false;
                    },
                    { timeout: config.TIMEOUTS.WAIT_FOR_FUNCTION }
                );
                console.log(`✅ SUKSES: Produk ditemukan.`);
            } catch (e) {
                console.error(`❌ GAGAL Menunggu (waitForFunction): ${e.message}`);
                await Utils.saveScreenshot(pageInstance, 'ebay_TIMING_FAILURE_screenshot.png');
                throw new Error('Gagal menunggu JavaScript eBay mengisi produk.');
            }

            const html = await pageInstance.content();
            const products = this.extractProductsFromHTML(html);
            
            console.log(`✅ Found ${products.length} product links`);
            return products;
            
        } catch (error) {
            console.error('❌ Puppeteer Stealth Error:', error.message);
            return [];
        } finally {
            if (pageInstance) {
                await pageInstance.close();
            }
        }
    }

    // HELPER: Ekstraksi Link (Dipanggil via this.extractProductsFromHTML)
    extractProductsFromHTML(html) {
        const $ = cheerio.load(html);
        const products = [];
        const productSelectors = config.SELECTORS.PRODUCT_LIST.split(', ');
        
        productSelectors.forEach(selector => {
            const elements = $(selector);
            elements.each((index, element) => {
                const $element = $(element);
                let title = this.extractText($element, config.SELECTORS.PRODUCT_TITLE);
                let link = this.extractAttribute($element, config.SELECTORS.PRODUCT_LINK, 'href');

                title = Utils.cleanProductTitle(title);
                
                // FILTER JUNK LINKS
                if (!title || title.length < 3 || title.toLowerCase().includes('shop on ebay') ||
                    !link || !link.includes('/itm/') || link.includes('/sch/i.html')) 
                {
                    return; 
                }

                const isDuplicate = products.some(p => p.product_url === link);
                if (!isDuplicate) {
                    products.push({
                        product_url: link,
                    });
                }
            });
        });
        return products;
    }

    // METHOD: Helper untuk extract text (Diperlukan oleh extractProductsFromHTML)
    extractText($element, selectorString) {
        const selectors = selectorString.split(', ');
        for (const selector of selectors) {
            const text = $element.find(selector).first().text().trim();
            if (text && text.length > 0) return text;
        }
        return '';
    }

    // METHOD: Helper untuk extract attribute (Diperlukan oleh extractProductsFromHTML)
    extractAttribute($element, selectorString, attribute) {
        const selectors = selectorString.split(', ');
        for (const selector of selectors) {
            const attrValue = $element.find(selector).first().attr(attribute);
            if (attrValue) return attrValue;
        }
        return '';
    }

    // -----------------------------------------------------------------
    // FUNGSI UTAMA AI: Mengambil Teks Mentah dari halaman detail
    // -----------------------------------------------------------------
    async getProductDetailText(productUrl) {
        let pageInstance = null;
        try {
            if (!productUrl || productUrl === '-' || !productUrl.includes('/itm/')) {
                return { text: "Teks tidak tersedia - URL tidak valid", imageUrl: '-' };
            }

            console.log(`[Mode AI] Navigasi ke halaman produk...`);
            
            const browser = await BrowserService.getBrowser();
            pageInstance = await browser.newPage();
            
            await pageInstance.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await pageInstance.setViewport({ width: 1366, height: 768 });
            
            // BLOKIR ASET AGAR LEBIH CEPAT (Mode AI)
            await pageInstance.setRequestInterception(true);
            pageInstance.on('request', (req) => {
                if (['image', 'font', 'stylesheet', 'media'].includes(req.resourceType())) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await pageInstance.goto(productUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: config.TIMEOUTS.NAVIGATION
            });

            // Scroll untuk memicu lazy load (jika ada)
            await pageInstance.evaluate(async () => {
                window.scrollBy(0, 500);
            });
            await new Promise(resolve => setTimeout(resolve, 500)); 

            const html = await pageInstance.content();
            const $ = cheerio.load(html);

            // HYBRID FIX: Ekstrak URL gambar utama
            let imageUrl = '';
            const mainImageSelectors = [
                'img.ux-image-grid-item__image', 'img.x-img-fallback', 'img[data-test-id="main-image"]', '.ux-image-grid-item img'
            ];
            for (const selector of mainImageSelectors) {
                const imgElement = $(selector).first();
                if (imgElement.length) {
                    imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
                    if (imageUrl) break;
                }
            }
            if (!imageUrl) {
                const galleryImage = $('img.x-gallery__img').first();
                if (galleryImage.length) {
                    imageUrl = galleryImage.attr('src') || galleryImage.attr('data-src');
                }
            }

            // Ambil teks dari iframe deskripsi
            let iframeDescriptionText = '';
            try {
                const iframeElement = await pageInstance.$('#desc_ifr'); 
                if (iframeElement) {
                    const frame = await iframeElement.contentFrame();
                    if (frame) {
                        await frame.evaluate(() => { window.scrollBy(0, 500); });
                        iframeDescriptionText = await frame.evaluate(() => document.body.innerText.trim());
                    }
                }
            } catch (e) {}

            // Gabungkan teks terstruktur
            let combinedText = `Product Description (from iframe): ${iframeDescriptionText.substring(0, 3000)} ` + 
                                $('#mainContent').text() + " " + $('div[data-testid="x-item-specifics-readonly"]').text();
            
            // Membersihkan teks mentah
            const cleanedText = combinedText
                .replace(/\s+/g, ' ') 
                .replace(`//g`, "")
                .trim();
            
            console.log(`[Mode AI] Teks mentah halaman diambil (${cleanedText.length} karakter).`);
            
            // Batasi jumlah karakter
            return { text: cleanedText.substring(0, 5000), imageUrl: imageUrl || '-' };

        } catch (error) {
            console.error('❌ Gagal mengambil Teks Halaman Detail:', error.message);
            
            // ✅ FINAL FIX: Jika terjadi timeout navigasi (error 60 detik), paksa restart browser.
            if (error.message.includes("Navigation timeout")) {
                 console.error("⚠️ CRITICAL ERROR: Navigation timeout occurred. Forcing full browser restart.");
                 await BrowserService.closeBrowser(); 
            }

            // Kembalikan objek error
            return { text: "Teks tidak tersedia - Halaman gagal dimuat.", imageUrl: '-' };
        } finally {
            if (pageInstance) {
                await pageInstance.close();
            }
        }
    }
}

module.exports = EbayScraper;