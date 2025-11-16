// File: src/platforms/ebay/config.js

module.exports = {
    BASE_URL: 'https://www.ebay.com/sch/i.html',
    DEFAULT_IMAGE: 'https://ir.ebaystatic.com/cr/v/c1/s_1x2.gif',

    TIMEOUTS: {
        NAVIGATION: 60000,
        WAIT_FOR_FUNCTION: 30000,
        WAIT_FOR_SELECTOR: 10000
    },

    SELECTORS: {
        // --- Product List Page ---
        // Selector ini HARUS SINKRON dengan waitForFunction di scraper.js
        PRODUCT_LIST: 'li.s-item, li.s-card, .s-item__wrapper',
        
        // Selector fleksibel untuk data di dalam setiap item
        PRODUCT_TITLE: 'div[role="heading"], .s-item__title',
        PRODUCT_PRICE: '.s-card__price, .s-item__price',
        PRODUCT_LINK: 'a.s-card__link, a.s-item__link',
        PRODUCT_IMAGE: 'img.s-card__image, img.s-item__image-img',

        // --- Product Detail Page ---
        DESCRIPTION_IFRAME: '#desc_ifr',
        
        // Fallback jika iframe gagal (diambil dari kode lama Anda)
        DESCRIPTION_CONTENT: '.item-desc, #itemDescription, .d-itemDetailsWrapper, [data-testid="ux-layout-section__item"]',
        
        // Anda masih hardcode ini di scraper.js, tapi ini tempat yang bagus untuk menyimpannya
        ITEM_SPECIFICS_LABEL: '.ux-labels-values__labels',
        ITEM_SPECIFICS_VALUE: '.ux-labels-values__values'
    }
};