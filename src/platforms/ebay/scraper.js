const cheerio = require('cheerio');
const BrowserService = require('../../core/browser');
const Utils = require('../../core/utils');
const config = require('./config');

class EbayScraper {
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

            console.log(`⏳ Menunggu JavaScript eBay mengisi rak buku dengan PRODUK... (up to 30s)`);
            
            try {
                // ✅ PERBAIKI: Tunggu produk dengan berbagai format
                await pageInstance.waitForFunction(
                    () => {
                        const selectors = ['li.s-item', 'li.s-card', '.s-item__wrapper'];
                        for (const selector of selectors) {
                            if (document.querySelector(selector)) {
                                return true;
                            }
                        }
                        return false;
                    },
                    { timeout: config.TIMEOUTS.WAIT_FOR_FUNCTION }
                );
                console.log(`✅ SUKSES: JavaScript selesai! Rak buku sudah terisi produk.`);
            } catch (e) {
                console.error(`❌ GAGAL Menunggu (waitForFunction): ${e.message}`);
                await Utils.saveScreenshot(pageInstance, 'ebay_TIMING_FAILURE_screenshot.png');
                const htmlContent = await pageInstance.content();
                await Utils.saveDebugHTML(htmlContent, 'ebay_TIMING_FAILURE_debug.html');
                throw new Error('Gagal menunggu JavaScript eBay mengisi produk.');
            }

            console.log('Extracting HTML...');
            const html = await pageInstance.content();
            await Utils.saveDebugHTML(html, 'ebay_stealth_debug.html');
            console.log('✅ Stealth HTML saved to ebay_stealth_debug.html');

            // ✅ PERBAIKI: Gunakan fungsi extract yang baru
            const products = this.extractProductsFromHTML(html);
            
            console.log(`✅ Found ${products.length} products (Data Bersih)`);
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

    // ✅ PERBAIKI: Fungsi extract yang lebih comprehensive
    extractProductsFromHTML(html) {
        const $ = cheerio.load(html);
        const products = [];
        
        // ✅ PERBAIKI: Gunakan semua selectors dari config
        const productSelectors = config.SELECTORS.PRODUCT_LIST.split(', ');
        
        console.log(`🔄 Using selectors: ${productSelectors.join(', ')}`);
        
        productSelectors.forEach(selector => {
            const elements = $(selector);
            console.log(`🔍 Selector "${selector}" found ${elements.length} items`);
            
            elements.each((index, element) => {
                try {
                    const $element = $(element);
                    
                    // ✅ FLEXIBLE: Coba semua selector untuk title
                    let title = this.extractText($element, config.SELECTORS.PRODUCT_TITLE);
                    
                    // ✅ FLEXIBLE: Coba semua selector untuk price
                    let price = this.extractText($element, config.SELECTORS.PRODUCT_PRICE);
                    
                    // ✅ FLEXIBLE: Coba semua selector untuk link
                    let link = this.extractAttribute($element, config.SELECTORS.PRODUCT_LINK, 'href');
                    
                    // ✅ FLEXIBLE: Coba semua selector untuk image
                    let image = this.extractAttribute($element, config.SELECTORS.PRODUCT_IMAGE, 'src');

                    title = Utils.cleanProductTitle(title);
                    
                    // Validasi product - lebih longgar
                    if (!title || title.length < 3 || title.toLowerCase().includes('shop on ebay') ||!link || !link.includes('/itm/') || link.includes('/sch/i.html')) 
                    {
                        return; 
                    }

                    // Cek duplikat
                    const isDuplicate = products.some(p => p.product_url === link);
                    if (!isDuplicate) {
                        products.push({
                            product_name: title,
                            product_price: price || '-',
                            product_url: link,
                            product_image: image || config.DEFAULT_IMAGE
                        });
                    }
                    
                } catch (err) {
                    console.warn(`Skipping malformed item: ${err.message}`);
                }
            });
        });

        console.log(`📊 Total unique products found: ${products.length}`);
        return products;
    }

    // ✅ HELPER: Extract text dengan multiple selectors
    extractText($element, selectorString) {
        const selectors = selectorString.split(', ');
        for (const selector of selectors) {
            const text = $element.find(selector).first().text().trim();
            if (text && text.length > 0) {
                return text;
            }
        }
        return '';
    }

    // ✅ HELPER: Extract attribute dengan multiple selectors
    extractAttribute($element, selectorString, attribute) {
        const selectors = selectorString.split(', ');
        for (const selector of selectors) {
            const attrValue = $element.find(selector).first().attr(attribute);
            if (attrValue) {
                return attrValue;
            }
        }
        return '';
    }

    async scrapeProductDetails(productUrl) {
        let pageInstance = null;
        try {
            if (!productUrl || productUrl === '-' || !productUrl.includes('/itm/')) {
                return { product_description: '-', item_specifics: {} };
            }

            console.log(`[Mode Stealth] 🔍 Scraping product details...`);
            
            const browser = await BrowserService.getBrowser();
            pageInstance = await browser.newPage();
            
            await pageInstance.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await pageInstance.setViewport({ width: 1366, height: 768 });
            
            console.log(`🔗 Navigating to product details...`);
            await pageInstance.goto(productUrl, { 
                waitUntil: 'networkidle2',
                timeout: config.TIMEOUTS.NAVIGATION
            });

            console.log(`🖱️ Simulating human scroll...`);
            await pageInstance.evaluate(async () => {
                for (let i = 0; i < document.body.scrollHeight / 4; i += 100) {
                    window.scrollBy(0, 100);
                    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
                }
            });

            console.log(`⏳ Waiting for content to load...`);
            
            let description = '-';
            const specifics = {};

            // STRATEGI 1: AMBIL DESKRIPSI DARI IFRAME
            try {
                console.log(`🔄 Strategy 1: Accessing description iframe...`);
                await pageInstance.waitForSelector(config.SELECTORS.DESCRIPTION_IFRAME, { 
                    timeout: config.TIMEOUTS.WAIT_FOR_SELECTOR 
                });
                
                const iframeElement = await pageInstance.$(config.SELECTORS.DESCRIPTION_IFRAME);
                const frame = await iframeElement.contentFrame();
                
                if (frame) {
                    await frame.waitForSelector('body', { 
                        timeout: config.TIMEOUTS.WAIT_FOR_SELECTOR 
                    });
                    
                    const iframeDescription = await frame.evaluate(() => {
                        return document.body.innerText.trim();
                    });
                    
                    if (iframeDescription && iframeDescription.length > 20) {
                        description = iframeDescription;
                        console.log(`✅ Description from iframe: ${description.length} chars`);
                    }
                }
            } catch (e) {
                console.log(`❌ Iframe strategy failed: ${e.message}`);
            }

            // STRATEGI 2: AMBIL DESKRIPSI DARI HTML LANGSUNG
            if (description === '-' || description.length < 50) {
                try {
                    console.log(`🔄 Strategy 2: Direct HTML scraping...`);
                    const html = await pageInstance.content();
                    const $ = cheerio.load(html);
                    
                    const descSelectors = config.SELECTORS.DESCRIPTION_CONTENT.split(', ');
                    for (const selector of descSelectors) {
                        const text = $(selector).text().trim();
                        if (text && text.length > 50) {
                            description = text;
                            console.log(`✅ Description from selector ${selector}: ${description.length} chars`);
                            break;
                        }
                    }
                } catch (e) {
                    console.log(`❌ HTML strategy failed: ${e.message}`);
                }
            }

            // STRATEGI 3: AMBIL ITEM SPECIFICS
            try {
                console.log(`🔄 Extracting item specifics...`);
                const html = await pageInstance.content();
                const $ = cheerio.load(html);
                
                // Modern layout
                $('.ux-labels-values__labels').each((index, element) => {
                    try {
                        const labelElement = $(element);
                        const valueElement = labelElement.next('.ux-labels-values__values');
                        
                        if (labelElement && valueElement) {
                            const label = labelElement.text().trim().replace(':', '');
                            const value = valueElement.text().trim();
                            
                            if (label && value && label.length < 50) {
                                specifics[label] = value;
                            }
                        }
                    } catch (e) {}
                });
                
                // Traditional layout
                if (Object.keys(specifics).length === 0) {
                    $('.ux-layout-section.e-app--rich .ux-labels-values__row').each((index, element) => {
                        try {
                            const label = $(element).find('.ux-labels-values__labels .ux-textspans').text().trim();
                            const value = $(element).find('.ux-labels-values__values .ux-textspans').text().trim();
                            
                            if (label && value) {
                                specifics[label] = value;
                            }
                        } catch (e) {}
                    });
                }
                
                console.log(`✅ Item specifics found: ${Object.keys(specifics).length}`);
            } catch (e) {
                console.log(`❌ Item specifics extraction failed: ${e.message}`);
            }

            // STRATEGI 4: FALLBACK - META DESCRIPTION
            if (description === '-' || description.length < 30) {
                try {
                    console.log(`🔄 Strategy 4: Meta description fallback...`);
                    const html = await pageInstance.content();
                    const $ = cheerio.load(html);
                    
                    description = $('meta[name="description"]').attr('content') || '-';
                    console.log(`✅ Meta description: ${description.length} chars`);
                } catch (e) {
                    console.log(`❌ Meta strategy failed: ${e.message}`);
                }
            }

            // CLEANUP
            if (description !== '-') {
                description = description.replace(/\s+/g, ' ').trim();
                if (description.length > 500) {
                    description = description.substring(0, 500) + '...';
                }
                description = description
                    .replace(/eBay International Shipping/g, '')
                    .replace(/Shop with confidence/g, '')
                    .replace(/Includes detailed tracking/g, '')
                    .replace(/Learn more/g, '')
                    .trim();
            }

            console.log(`📝 Final description: ${description.length} chars`);
            console.log(`📋 Item specifics: ${Object.keys(specifics).length} items`);
            
            return {
                product_description: description,
                item_specifics: specifics
            };
            
        } catch (error) {
            console.error('❌ Detail scraping error:', error.message);
            if (pageInstance) {
                await Utils.saveScreenshot(pageInstance, 'ebay_DETAIL_FAILURE_screenshot.png');
            }
            return { product_description: '-', item_specifics: {} };
        } finally {
            if (pageInstance) {
                await pageInstance.close();
            }
        }
    }
}

module.exports = EbayScraper;