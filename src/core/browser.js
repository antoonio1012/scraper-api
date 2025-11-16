const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

let browserInstance = null;

class BrowserService {
    static async getBrowser() {
        if (browserInstance) return browserInstance;
        
        console.log("🚀 Launching Stealth Browser...");
        browserInstance = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });
        return browserInstance;
    }

    static async closeBrowser() {
        if (browserInstance) {
            await browserInstance.close();
            browserInstance = null;
        }
    }
}

module.exports = BrowserService;