const Utils = require("../../core/utils");

const BrowserService = require('../../core/browser');

module.exports = {
    scrapeTokopedia: async (keyword, limit) => {
        console.log(`[TOKOPEDIA] 🔍 Searching: ${keyword}`);

        const browser = await BrowserService.getBrowser();
        const page = await browser.newPage();

        // =============================
        // 🔥 Anti-block Tokopedia FIX
        // =============================
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        );

        await page.setExtraHTTPHeaders({
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
        });

        await page.evaluateOnNewDocument(() => {
            // Webdriver OFF
            Object.defineProperty(navigator, "webdriver", { get: () => false });

            // Plugin spoof
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            // WebGL
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function (parameter) {
                // Spoof GPU
                if (parameter === 37445) return "NVIDIA Corporation";
                if (parameter === 37446) return "NVIDIA GeForce GTX 1650";
                return getParameter(parameter);
            };
        });

        // =============================
        // 📍 Load page
        // =============================
        const url = `https://www.tokopedia.com/search?q=${encodeURIComponent(keyword)}&page=1`;
        console.log(`🔗 Navigating to: ${url}`);

        try {
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

            // Scroll → wajib sebelum selector muncul
            await autoScroll(page);

            // Tunggu munculnya card produk (retry 3x)
            let cards = null;
            for (let retry = 1; retry <= 3; retry++) {
                try {
                    cards = await page.$$('div[data-testid="master-product-card"]');
                    if (cards.length > 0) break;

                    console.log(`⏳ Retry ${retry} - halaman masih loading...`);
                    await autoScroll(page);
                    await page.waitForTimeout(2000);
                } catch { }
            }

            if (!cards || cards.length === 0) {
                throw new Error("master-product-card tidak muncul (Tokopedia block?)");
            }

            console.log(`✅ Found ${cards.length} product cards.`);

            const products = await page.evaluate(() => {
                const items = [];
                document.querySelectorAll('div[data-testid="master-product-card"]').forEach(card => {
                    const title = card.querySelector("div[data-testid='spnSRPProdName']")?.innerText ?? null;
                    const price = card.querySelector("div[data-testid='spnSRPProdPrice']")?.innerText ?? null;
                    const link = card.querySelector("a")?.href ?? null;

                    if (title && price && link) {
                        items.push({ title, price, link });
                    }
                });
                return items;
            });

            return products.slice(0, limit);

        } catch (e) {
            console.log(`❌ Tokopedia Scraper Error: ${e.message}`);

            await Utils.saveScreenshot(page, "tokopedia_FAILURE_screenshot.png");
            await Utils.saveDebugHTML(await page.content(), "tokopedia_FAILURE_debug.html");

            return [];
        }
    }
};


// =============================
// 📜 Scroll utility
// =============================
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise(resolve => {
            let total = 0;
            const distance = 300;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                total += distance;
                if (total >= 1500) clearInterval(timer), resolve();
            }, 200);
        });
    });
}
