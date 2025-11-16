📦 AI E-commerce Scraper API
Node.js • Puppeteer • OpenRouter • DeepSeek LLM Extraction

🧠 Overview
Proyek ini adalah API scraping e-commerce yang memanfaatkan kombinasi:
Puppeteer Stealth Browser
AI Extraction (DeepSeek via OpenRouter)
Arsitektur modular
Session persistence
Auto browser recovery
Berbeda dari scraper biasa yang mengandalkan CSS selector, scraper ini menyerahkan ekstraksi data produk langsung kepada AI, menjadikannya jauh lebih fleksibel terhadap perubahan UI marketplace.

Target utama saat ini: eBay (Stable)
Tokopedia masih dalam tahap Stealth Bypass Development.

🚀 Fitur Unggulan
✔ 1. AI-Only Product Extraction (Hybrid Mode)
AI membaca raw text dari halaman detail produk dan mengekstraksi:
Nama
Harga (IDR priority)
Deskripsi
Metadata lainnya (jika diprompt)

✔ 2. Puppeteer Anti-Bot Stealth
Non-headless (default) → melewati bot eBay dengan mudah
Menyimpan session cookies (userDataDir)
Human-like behavior (delay random, scroll gradual)

✔ 3. Auto Browser Restart
Browser direstart otomatis setiap 10 produk untuk mencegah:
Memory leak
Crash
Throttle error
Stuck loading

📁 Struktur Direktori
project
│── core/
│   ├── ai.js
│   ├── browser.js
│   └── utils.js
│
│── platforms/
│   ├── ebay/
│   └── tokopedia/
│
│── routes/
│── app.js
│── package.json
│── README.md
│── .env

⚙️ Installation

1️⃣ Clone repo
git clone https://github.com/yourusername/ai-ecommerce-scraper.git
cd ai-ecommerce-scraper

2️⃣ Install dependencies
npm install

3️⃣ Buat file .env
# OpenRouter API Key (required)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Port server
PORT=3000

4️⃣ Jalankan server
npm run dev


🛒 Platform: eBay (Stable AI Extraction)
Endpoint utama:
Search → Collect Links → Visit → Extract using AI → Return JSON

Example Request:
/api/ebay/scrape?query=nike&pages=1&limit=5
or 
/api/ebay/scrape?query=nike&pages=1


Contoh Output .json
"product_url": "https://www.ebay.com/itm/406274807474?_skw=toystory&itmmeta=01KA67KD76A7F1YVTZY76XSA61&hash=item5e97dd96b2:g:j0oAAeSwrwdo8cp~&itmprp=enc%3AAQAKAAAAwFkggFvd1GGDu0w3yXCmi1edcgnuIh1bb66SMKloIIAE5jTjp6BpAv7EFrw60qW%2FaxqEQahOhuggBSvvWns0hrlOFCl6UW3GVByAFEl%2BDvKC%2BZUbX4nUvF3l32uvFq%2F5m4LXwoQ7xgAQ%2B05aondPZHhr74Ywb01c6GHtae6ARQjY2KMNkJHa3TYChcXjO942EieKE6gnXxShBmt8s1XMf2NfUMRosrZrrn5cmglG8J%2Fzo1dGGkAOYqoJN1S2FQ%2F9cA%3D%3D%7Ctkp%3ABk9SR6LVzcfRZg",
"product_name": "Toy Story 30th Anniversary Real Size Talking Figure Woody Woody's Roundup ver.",
"product_price": "IDR1,420,095.00",
"product_description": "-",
"product_image": "https://i.ebayimg.com/images/g/j0oAAeSwrwdo8cp~/s-l140.webp",
"ai_source": "openrouter-deepseek"

Thank You , i hope i can discuss more ... 
