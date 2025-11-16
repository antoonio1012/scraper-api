// File: src/platforms/tokopedia/config.js

module.exports = {
    BASE_URL: "https://www.tokopedia.com/search",
    QUERY_PARAM: "?q=",
    PAGE_PARAM: "&page=",

    TIMEOUTS: {
        NAVIGATION: 60000,          // Waktu maksimum untuk page.goto()
        WAIT_FOR_FUNCTION: 30000,   // Generic waitForFunction
        WAIT_FOR_SELECTOR: 30000    // Cadangan timeout selektor
    },

    SELECTORS: {
        // Kontainer utama hasil pencarian (bisa dipakai untuk validasi halaman)
        PRODUCT_CONTAINER: 'div[data-testid="divSearchProductPageContent"]',

        // Satu item produk (kartu)
        PRODUCT_ITEM: 'div[data-testid="divProductWrapper"]',

        // Data di dalam item produk
        PRODUCT_NAME: '[data-testid="linkProductName"]',
        PRODUCT_PRICE: '[data-testid="lblProductPrice"]',
        PRODUCT_IMAGE: '[data-testid="imgProductCard"]'
    }
};
