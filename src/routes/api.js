// File: src/routes/api.js

const express = require('express');
const router = express.Router();

// Impor semua controller
const EbayController = require('../platforms/ebay/controller');
const TokopediaController = require('../platforms/tokopedia/controller');

// === Rute eBay ===
router.get('/ebay/scrape', EbayController.scrapeProducts);
router.get('/ebay/test-scrape', EbayController.testScrape);
router.get('/ebay/test-details', EbayController.testDetails);

// === Rute Tokopedia ===
router.get('/tokopedia/scrape', TokopediaController.scrapeProducts);
router.get('/tokopedia/test-scrape', TokopediaController.testScrape);
// ✅ FIX: Baris ini sekarang akan berfungsi karena TokopediaController.testDetails sudah ada
router.get('/tokopedia/test-details', TokopediaController.testDetails); 

// === Rute AI ===
router.get('/test-ai', EbayController.testAI); // Bisa pakai controller eBay

module.exports = router;