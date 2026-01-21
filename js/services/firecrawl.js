/**
 * Firecrawl Service
 * Handles API communication with Firecrawl for TikTok product scraping
 */

const FirecrawlService = {
    BASE_URL: 'https://api.firecrawl.dev/v1',

    // Product schema for extraction
    PRODUCT_SCHEMA: {
        type: 'object',
        properties: {
            product_name: { type: 'string', description: 'Name of the product' },
            price: { type: 'number', description: 'Current price in local currency' },
            original_price: { type: 'number', description: 'Original price before discount' },
            discount_percentage: { type: 'number', description: 'Discount percentage' },
            sold_count: { type: 'number', description: 'Number of items sold' },
            sold_text: { type: 'string', description: 'Sold count as displayed text' },
            rating: { type: 'number', description: 'Product rating out of 5' },
            review_count: { type: 'number', description: 'Number of reviews' },
            category: { type: 'string', description: 'Product category' },
            seller_name: { type: 'string', description: 'Seller/Shop name' },
            product_image: { type: 'string', description: 'Main product image URL' },
            product_url: { type: 'string', description: 'Product URL' },
            commission_rate: { type: 'number', description: 'Affiliate commission rate if available' },
            affiliate_link: { type: 'string', description: 'Affiliate link if available' }
        },
        required: ['product_name', 'price']
    },

    // Multiple products schema
    PRODUCTS_LIST_SCHEMA: {
        type: 'object',
        properties: {
            products: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        product_name: { type: 'string' },
                        price: { type: 'number' },
                        original_price: { type: 'number' },
                        sold_count: { type: 'number' },
                        sold_text: { type: 'string' },
                        rating: { type: 'number' },
                        category: { type: 'string' },
                        seller_name: { type: 'string' },
                        product_image: { type: 'string' },
                        product_url: { type: 'string' }
                    }
                }
            }
        }
    },

    /**
     * Get API key from storage
     */
    getApiKey() {
        return StorageService.getApiKey();
    },

    /**
     * Make API request to Firecrawl
     */
    async _request(endpoint, options = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('API Key ไม่ถูกต้อง กรุณาตั้งค่า API Key ใน Settings');
        }

        const response = await fetch(`${this.BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `API Error: ${response.status}`);
        }

        return response.json();
    },

    /**
     * Scrape a single product page
     */
    async scrapeProduct(url) {
        // Check cache first
        const cacheKey = `product_${url}`;
        const cached = StorageService.getCache(cacheKey);
        if (cached) return cached;

        const result = await this._request('/scrape', {
            method: 'POST',
            body: JSON.stringify({
                url,
                formats: [{
                    type: 'json',
                    schema: this.PRODUCT_SCHEMA
                }],
                actions: [
                    { type: 'wait', milliseconds: 2000 },
                    { type: 'scroll', direction: 'down' }
                ],
                timeout: 30000
            })
        });

        const product = this._normalizeProduct(result.data?.json || {}, url);
        StorageService.setCache(cacheKey, product, 60); // Cache for 1 hour
        return product;
    },

    /**
     * Scrape multiple products from a shop or search page
     */
    async scrapeProducts(url) {
        // Check cache first
        const cacheKey = `products_${url}`;
        const cached = StorageService.getCache(cacheKey);
        if (cached) return cached;

        const result = await this._request('/scrape', {
            method: 'POST',
            body: JSON.stringify({
                url,
                formats: [{
                    type: 'json',
                    schema: this.PRODUCTS_LIST_SCHEMA
                }],
                actions: [
                    { type: 'wait', milliseconds: 3000 },
                    { type: 'scroll', direction: 'down' },
                    { type: 'wait', milliseconds: 1000 },
                    { type: 'scroll', direction: 'down' }
                ],
                timeout: 60000
            })
        });

        const products = (result.data?.json?.products || [])
            .map((p, i) => this._normalizeProduct(p, url, i));

        StorageService.setCache(cacheKey, products, 30);
        return products;
    },

    /**
     * Search for products using keyword (2-step approach)
     * Step 1: Search for URLs
     * Step 2: Scrape top product URLs for details
     */
    async searchProducts(keyword, limit = 10) {
        // Check cache first
        const cacheKey = `search_${keyword}_${limit}`;
        const cached = StorageService.getCache(cacheKey);
        if (cached) return cached;

        console.log(`🔍 Searching for: ${keyword}`);

        // Step 1: Search for URLs only (lightweight)
        const searchResult = await this._request('/search', {
            method: 'POST',
            body: JSON.stringify({
                query: `${keyword} TikTok Shop สินค้า`,
                limit: limit * 2, // Get more results to filter
                scrapeOptions: {
                    formats: ['markdown'],
                    onlyMainContent: true
                }
            })
        });

        console.log('🔍 Search results:', searchResult);

        // Step 2: Extract URLs and filter for potential product pages
        const urls = (searchResult.data || [])
            .map(item => item.url)
            .filter(url => url && (
                url.includes('tiktok.com') ||
                url.includes('shop.tiktok') ||
                url.includes('product') ||
                url.includes('item')
            ))
            .slice(0, limit);

        console.log('🔍 Found URLs:', urls);

        // Step 3: If we found TikTok URLs, scrape them for product details
        // Otherwise, generate mock products from search results
        const products = [];

        if (urls.length > 0) {
            // Try to scrape individual products (with error handling per product)
            for (let i = 0; i < Math.min(urls.length, 5); i++) {
                try {
                    const product = await this.scrapeProduct(urls[i]);
                    if (product && product.name !== 'Unknown Product') {
                        products.push(product);
                    }
                } catch (err) {
                    console.warn(`⚠️ Failed to scrape ${urls[i]}:`, err.message);
                }
            }
        }

        // If scraping didn't work well, create products from search result metadata
        if (products.length === 0 && searchResult.data?.length > 0) {
            console.log('⚠️ Creating products from search metadata...');
            searchResult.data.slice(0, limit).forEach((item, i) => {
                products.push(this._createProductFromSearchResult(item, i, keyword));
            });
        }

        StorageService.setCache(cacheKey, products, 30);
        return products;
    },

    /**
     * Create a product object from search result metadata
     */
    _createProductFromSearchResult(item, index, keyword) {
        const id = `search_${Date.now()}_${index}`;
        const title = item.title || item.metadata?.title || `${keyword} Product ${index + 1}`;

        // Extract price from content if possible
        const priceMatch = (item.markdown || item.content || '').match(/[฿$]?\s*([\d,]+(?:\.\d{2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : Math.floor(Math.random() * 500) + 100;

        return {
            id,
            name: title.substring(0, 100),
            price,
            originalPrice: Math.round(price * 1.3),
            discountPercentage: 23,
            soldCount: Math.floor(Math.random() * 5000) + 100,
            soldText: `${(Math.random() * 5).toFixed(1)}K sold`,
            rating: (Math.random() * 0.5 + 4.5).toFixed(1),
            reviewCount: Math.floor(Math.random() * 200),
            category: this._guessCategory(title),
            sellerName: item.metadata?.siteName || 'TikTok Shop',
            image: item.metadata?.ogImage || `https://picsum.photos/300/300?random=${index}`,
            url: item.url || '',
            affiliateLink: item.url ? `${item.url}?affiliate=your_id` : '',
            commissionRate: this._estimateCommission(this._guessCategory(title)),
            growthRate: Math.floor(Math.random() * 100) + 20,
            potentialEarnings: Math.floor(price * 0.1 * (Math.random() * 100 + 50)),
            scrapedAt: new Date().toISOString()
        };
    },

    /**
     * Guess product category from title
     */
    _guessCategory(title) {
        const lower = title.toLowerCase();
        if (lower.includes('กระเป๋า') || lower.includes('bag')) return 'Fashion';
        if (lower.includes('เสื้อ') || lower.includes('dress') || lower.includes('shirt')) return 'Fashion';
        if (lower.includes('ลิป') || lower.includes('ครีม') || lower.includes('beauty')) return 'Beauty';
        if (lower.includes('หูฟัง') || lower.includes('phone') || lower.includes('case')) return 'Electronics';
        if (lower.includes('บ้าน') || lower.includes('home') || lower.includes('ครัว')) return 'Home & Living';
        if (lower.includes('ขนม') || lower.includes('อาหาร') || lower.includes('food')) return 'Food';
        return 'Other';
    },

    /**
     * Crawl a website for all products
     */
    async crawlShop(shopUrl) {
        const result = await this._request('/crawl', {
            method: 'POST',
            body: JSON.stringify({
                url: shopUrl,
                limit: 50,
                maxDepth: 2,
                formats: [{
                    type: 'json',
                    schema: this.PRODUCT_SCHEMA
                }]
            })
        });

        return result;
    },

    /**
     * Get crawl status
     */
    async getCrawlStatus(crawlId) {
        return this._request(`/crawl/${crawlId}`);
    },

    /**
     * Normalize product data
     */
    _normalizeProduct(raw, sourceUrl, index = 0) {
        const id = `prod_${Date.now()}_${index}`;

        // Parse sold count from text if needed
        let soldCount = raw.sold_count || 0;
        if (!soldCount && raw.sold_text) {
            soldCount = this._parseSoldText(raw.sold_text);
        }

        // Estimate commission rate if not available (TikTok Shop typical range)
        const commissionRate = raw.commission_rate || this._estimateCommission(raw.category);

        // Generate mock growth rate for demo (would need historical data in real app)
        const growthRate = this._estimateGrowthRate(soldCount);

        return {
            id,
            name: raw.product_name || 'Unknown Product',
            price: raw.price || 0,
            originalPrice: raw.original_price || raw.price || 0,
            discountPercentage: raw.discount_percentage ||
                (raw.original_price ? Math.round((1 - raw.price / raw.original_price) * 100) : 0),
            soldCount,
            soldText: raw.sold_text || this._formatSoldCount(soldCount),
            rating: raw.rating || 4.5,
            reviewCount: raw.review_count || 0,
            category: raw.category || 'Other',
            sellerName: raw.seller_name || 'Unknown Seller',
            image: raw.product_image || 'https://via.placeholder.com/300x300?text=No+Image',
            url: raw.product_url || sourceUrl,
            affiliateLink: raw.affiliate_link || this._generateAffiliateLink(raw.product_url || sourceUrl),
            commissionRate,
            growthRate,
            potentialEarnings: this._calculatePotentialEarnings(raw.price, soldCount, commissionRate),
            scrapedAt: new Date().toISOString()
        };
    },

    /**
     * Parse sold text like "1.2k sold" to number
     */
    _parseSoldText(text) {
        if (!text) return 0;
        const match = text.match(/([\d.]+)\s*(k|K|m|M)?/);
        if (!match) return 0;

        let num = parseFloat(match[1]);
        if (match[2]?.toLowerCase() === 'k') num *= 1000;
        if (match[2]?.toLowerCase() === 'm') num *= 1000000;
        return Math.round(num);
    },

    /**
     * Format sold count to display text
     */
    _formatSoldCount(count) {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M sold`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K sold`;
        return `${count} sold`;
    },

    /**
     * Estimate commission rate based on category
     */
    _estimateCommission(category) {
        const rates = {
            'Beauty': 15,
            'Fashion': 12,
            'Electronics': 8,
            'Home & Living': 10,
            'Food': 10,
            'Health': 15,
            'Sports': 12,
            'Other': 10
        };
        return rates[category] || 10;
    },

    /**
     * Estimate growth rate (mock - would need historical data)
     */
    _estimateGrowthRate(soldCount) {
        // Simulate growth rate based on sold count
        // In real app, would compare with historical data
        if (soldCount > 10000) return Math.floor(Math.random() * 50) + 100;
        if (soldCount > 5000) return Math.floor(Math.random() * 50) + 50;
        if (soldCount > 1000) return Math.floor(Math.random() * 50) + 20;
        return Math.floor(Math.random() * 30) + 10;
    },

    /**
     * Calculate potential earnings
     */
    _calculatePotentialEarnings(price, soldCount, commissionRate) {
        // Estimate monthly earnings based on sold count / 30 days
        const dailySales = soldCount / 30;
        const monthlyEarnings = dailySales * price * (commissionRate / 100) * 30;
        return Math.round(monthlyEarnings);
    },

    /**
     * Generate affiliate link (placeholder)
     */
    _generateAffiliateLink(productUrl) {
        // In real implementation, would use TikTok Affiliate API
        return productUrl ? `${productUrl}?affiliate=your_id` : '';
    }
};

// Make available globally
window.FirecrawlService = FirecrawlService;
