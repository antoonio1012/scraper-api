const fs = require('fs');
const path = require('path');

class Utils {

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async saveScreenshot(pageInstance, fileName) {
        try {
            const savePath = path.join(__dirname, '..', '..', fileName);
            await pageInstance.screenshot({ path: savePath, fullPage: true });
            console.log(`📸 Screenshot disimpan ke: ${savePath}`);
        } catch (e) {
            console.error(`❌ Gagal menyimpan screenshot ${fileName}: ${e.message}`);
        }
    }

    static async saveDebugHTML(htmlContent, fileName) {
        try {
            const savePath = path.join(__dirname, '..', '..', fileName);
            fs.writeFileSync(savePath, htmlContent);
            console.log(`📄 HTML Debug disimpan ke: ${savePath}`);
        } catch (e) {
            console.error(`❌ Gagal menyimpan HTML ${fileName}: ${e.message}`);
        }
    }

    static cleanProductTitle(title) {
        if (!title) return '';
        
        let cleanedTitle = title;

        if (cleanedTitle.startsWith('New Listing')) {
            cleanedTitle = cleanedTitle.substring('New Listing'.length).trim();
        }
        
        cleanedTitle = cleanedTitle.replace('Opens in a new window or tab', '').trim();
        
        return cleanedTitle.substring(0, 150);
    }
}

module.exports = Utils;
