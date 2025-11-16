// File: src/core/browser.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Aktifkan Stealth Plugin
puppeteer.use(StealthPlugin());

let browserInstance;

class BrowserService {
    static async getBrowser() {
        if (browserInstance) {
            return browserInstance;
        }

        console.log("🚀 Launching Stealth Browser...");
        browserInstance = await puppeteer.launch({
            // Gunakan headless: false untuk debugging/stabilitas tinggi
            headless: true, 
            defaultViewport: null, 
            userDataDir: './user_data', // Menyimpan cookies/session
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security', 
                '--disable-features=IsolateOrigins,site-per-process',
                '--start-maximized', 
                '--disable-infobars',
                '--lang=id-ID,id'
            ],
            ignoreHTTPSErrors: true
        });
        return browserInstance;
    }

    // Fungsi untuk menutup browser sepenuhnya dan membersihkan memori
    static async closeBrowser() {
        if (browserInstance) {
            await browserInstance.close();
            browserInstance = null;
            console.log("Browser instance closed and memory cleared.");
        }
    }
}

module.exports = BrowserService;