/**
 * TikTok Affiliate Hunter - Main Application
 */

const App = {
    currentProducts: [],
    currentTab: 'trending',
    isLoading: false,
    charts: {},

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.checkApiKey();
        MyDashboard.init();
        console.log('🎯 TikTok Affiliate Hunter initialized');
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Settings modal
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('testApiBtn')?.addEventListener('click', () => this.testApiKey());

        // Settings modal overlay click
        document.querySelector('#settingsModal .modal-overlay')?.addEventListener('click', () => this.closeSettings());

        // Search
        document.getElementById('searchBtn')?.addEventListener('click', () => this.performSearch());
        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Filters
        document.getElementById('filterCategory')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filterGrowth')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filterCommission')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filterCompetition')?.addEventListener('change', () => this.applyFilters());

        // Sort
        document.getElementById('sortBy')?.addEventListener('change', (e) => this.sortProducts(e.target.value));

        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Product modal
        document.getElementById('closeProduct')?.addEventListener('click', () => this.closeProductModal());
        document.querySelector('#productModal .modal-overlay')?.addEventListener('click', () => this.closeProductModal());

        // Export
        document.getElementById('exportBtn')?.addEventListener('click', () => this.showExportModal());
    },

    /**
     * Check if API key is set
     */
    checkApiKey() {
        if (!StorageService.hasApiKey()) {
            this.openSettings();
            this.showToast('⚠️ กรุณาตั้งค่า API Key ก่อนใช้งาน', 'warning');
        }
    },

    /**
     * Open settings modal
     */
    openSettings() {
        const modal = document.getElementById('settingsModal');
        const apiKeyInput = document.getElementById('apiKey');

        if (apiKeyInput) {
            apiKeyInput.value = StorageService.getApiKey();
        }

        modal?.classList.add('active');
    },

    /**
     * Close settings modal
     */
    closeSettings() {
        document.getElementById('settingsModal')?.classList.remove('active');
    },

    /**
     * Save settings
     */
    saveSettings() {
        const apiKey = document.getElementById('apiKey')?.value?.trim();

        if (apiKey) {
            StorageService.setApiKey(apiKey);
            this.showToast('✅ บันทึก API Key แล้ว!', 'success');
            this.closeSettings();
        } else {
            this.showToast('⚠️ กรุณาใส่ API Key', 'warning');
        }
    },

    /**
     * Test API Key
     */
    async testApiKey() {
        const apiKey = document.getElementById('apiKey')?.value?.trim();
        const resultEl = document.getElementById('apiTestResult');

        if (!apiKey) {
            this.showToast('⚠️ กรุณาใส่ API Key ก่อนทดสอบ', 'warning');
            return;
        }

        // Validate API key format
        if (!apiKey.startsWith('fc-')) {
            resultEl.className = 'api-test-result show error';
            resultEl.innerHTML = '❌ รูปแบบ API Key ไม่ถูกต้อง (ต้องขึ้นต้นด้วย fc-)';
            return;
        }

        // Show loading state
        resultEl.className = 'api-test-result show loading';
        resultEl.innerHTML = '🔄 กำลังทดสอบ API Key...';

        try {
            // Test with a simple scrape request
            const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: 'https://example.com',
                    formats: ['markdown'],
                    timeout: 10000
                })
            });

            if (response.ok) {
                resultEl.className = 'api-test-result show success';
                resultEl.innerHTML = '✅ API Key ใช้งานได้! พร้อมใช้งานแล้ว';
                this.showToast('✅ API Key ทดสอบผ่าน!', 'success');
            } else if (response.status === 401) {
                resultEl.className = 'api-test-result show error';
                resultEl.innerHTML = '❌ API Key ไม่ถูกต้องหรือหมดอายุ';
            } else if (response.status === 402) {
                resultEl.className = 'api-test-result show error';
                resultEl.innerHTML = '❌ Credits หมด กรุณาเติมเงินที่ firecrawl.dev';
            } else if (response.status === 429) {
                resultEl.className = 'api-test-result show error';
                resultEl.innerHTML = '⚠️ Rate limit exceeded รอสักครู่แล้วลองใหม่';
            } else {
                const error = await response.json().catch(() => ({}));
                resultEl.className = 'api-test-result show error';
                resultEl.innerHTML = `❌ Error ${response.status}: ${error.message || 'Unknown error'}`;
            }
        } catch (error) {
            resultEl.className = 'api-test-result show error';
            resultEl.innerHTML = `❌ Connection error: ${error.message}`;
        }
    },

    /**
     * Perform search
     */
    async performSearch() {
        const query = document.getElementById('searchInput')?.value?.trim();

        if (!query) {
            this.showToast('⚠️ กรุณาใส่ URL หรือ Keyword', 'warning');
            return;
        }

        if (!StorageService.hasApiKey()) {
            this.showToast('⚠️ กรุณาตั้งค่า API Key ก่อน', 'warning');
            this.openSettings();
            return;
        }

        this.setLoading(true);

        try {
            let products = [];

            // Check if it's a URL or keyword
            if (query.startsWith('http')) {
                // Scrape from URL
                if (query.includes('/product/') || query.includes('item_id')) {
                    // Single product
                    const product = await FirecrawlService.scrapeProduct(query);
                    products = [product];
                } else {
                    // Shop or search page
                    products = await FirecrawlService.scrapeProducts(query);
                }
            } else {
                // Search by keyword
                products = await FirecrawlService.searchProducts(query);
            }

            this.currentProducts = products;
            this.renderProducts();
            this.updateStatistics();
            this.updateCharts();

            if (products.length > 0) {
                this.showToast(`✅ พบ ${products.length} สินค้า`, 'success');
            } else {
                this.showToast('ไม่พบสินค้า ลองใช้ keyword อื่น', 'info');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showToast(`❌ Error: ${error.message}`, 'error');

            // Load demo data for testing
            this.loadDemoData();
        } finally {
            this.setLoading(false);
        }
    },

    /**
     * Load demo data for testing
     */
    loadDemoData() {
        const categories = ['Beauty', 'Fashion', 'Electronics', 'Home & Living', 'Food'];
        const demoProducts = Array.from({ length: 20 }, (_, i) => ({
            id: `demo_${i}`,
            name: `สินค้าตัวอย่าง ${i + 1} - ${categories[i % categories.length]} Product`,
            price: Math.floor(Math.random() * 2000) + 100,
            originalPrice: Math.floor(Math.random() * 3000) + 500,
            discountPercentage: Math.floor(Math.random() * 50),
            soldCount: Math.floor(Math.random() * 10000) + 100,
            soldText: `${(Math.random() * 10).toFixed(1)}K sold`,
            rating: (Math.random() * 1 + 4).toFixed(1),
            reviewCount: Math.floor(Math.random() * 500),
            category: categories[i % categories.length],
            sellerName: `Shop ${i + 1}`,
            image: `https://picsum.photos/300/300?random=${i}`,
            url: 'https://shop.tiktok.com',
            affiliateLink: `https://shop.tiktok.com?affiliate=demo&product=${i}`,
            commissionRate: Math.floor(Math.random() * 15) + 5,
            growthRate: Math.floor(Math.random() * 200) + 10,
            potentialEarnings: Math.floor(Math.random() * 50000) + 1000,
            scrapedAt: new Date().toISOString()
        }));

        this.currentProducts = demoProducts;
        this.renderProducts();
        this.updateStatistics();
        this.updateCharts();
        this.showToast('📦 โหลด Demo Data สำหรับทดสอบ', 'info');
    },

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;

        const loadingEl = document.getElementById('loadingState');
        const emptyEl = document.getElementById('emptyState');
        const productsEl = document.getElementById('productsSection');
        const statsEl = document.getElementById('statsGrid');
        const chartsEl = document.getElementById('chartsSection');
        const dashboardEl = document.getElementById('dashboardSection');

        if (loading) {
            loadingEl.style.display = 'flex';
            emptyEl.style.display = 'none';
            productsEl.style.display = 'none';
            dashboardEl.style.display = 'none';
        } else {
            loadingEl.style.display = 'none';

            if (this.currentProducts.length > 0 && this.currentTab !== 'my-dashboard') {
                productsEl.style.display = 'block';
                statsEl.style.display = 'grid';
                chartsEl.style.display = 'grid';
                emptyEl.style.display = 'none';
            } else if (this.currentTab === 'my-dashboard') {
                dashboardEl.style.display = 'block';
                productsEl.style.display = 'none';
                emptyEl.style.display = 'none';
            } else {
                emptyEl.style.display = 'flex';
            }
        }
    },

    /**
     * Switch tab
     */
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Handle My Dashboard separately
        if (tabName === 'my-dashboard') {
            document.getElementById('productsSection').style.display = 'none';
            document.getElementById('statsGrid').style.display = 'none';
            document.getElementById('chartsSection').style.display = 'none';
            document.getElementById('dashboardSection').style.display = 'block';
            document.getElementById('emptyState').style.display = 'none';
            MyDashboard.renderContent();
            return;
        }

        // Hide dashboard, show products
        document.getElementById('dashboardSection').style.display = 'none';

        if (this.currentProducts.length > 0) {
            document.getElementById('productsSection').style.display = 'block';
            document.getElementById('statsGrid').style.display = 'grid';
            document.getElementById('chartsSection').style.display = 'grid';
            this.renderProducts();
        } else {
            document.getElementById('emptyState').style.display = 'flex';
        }
    },

    /**
     * Render products based on current tab
     */
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const sectionHeader = document.querySelector('.section-header h2');
        if (!grid) return;

        // Safety check - ensure currentProducts is an array
        if (!Array.isArray(this.currentProducts)) {
            console.warn('currentProducts is not an array');
            this.currentProducts = [];
        }

        let products = [...this.currentProducts];

        // Filter and sort based on tab
        switch (this.currentTab) {
            case 'trending':
                products = TrendingFinder.findTrending(products, 0);
                if (sectionHeader) sectionHeader.textContent = '🔥 Trending Products';
                break;
            case 'hidden-gems':
                products = CompetitionDetector.findHiddenGems(products);
                if (sectionHeader) sectionHeader.textContent = '🎯 Hidden Gems';
                break;
            case 'top-commission':
                products = CommissionDisplay.findTopCommission(products);
                if (sectionHeader) sectionHeader.textContent = '💰 Top Commission';
                break;
        }

        // Apply current filters
        products = this.getFilteredProducts(products);

        // Apply current sort
        const sortBy = document.getElementById('sortBy')?.value || 'growth';
        products = AnalyzerService.sortProducts(products, sortBy);

        // Render cards
        grid.innerHTML = '';
        products.forEach(product => {
            const card = createProductCard(product);
            grid.appendChild(card);
        });

        // Update count in header
        if (sectionHeader) {
            const count = products.length;
            sectionHeader.innerHTML = sectionHeader.textContent.split('(')[0] + ` (${count})`;
        }
    },

    /**
     * Get filtered products based on current filter values
     */
    getFilteredProducts(products) {
        const filters = {
            category: document.getElementById('filterCategory')?.value,
            growth: document.getElementById('filterGrowth')?.value,
            commission: document.getElementById('filterCommission')?.value,
            competition: document.getElementById('filterCompetition')?.value
        };

        return AnalyzerService.filterProducts(products, filters);
    },

    /**
     * Apply filters
     */
    applyFilters() {
        this.renderProducts();
    },

    /**
     * Sort products
     */
    sortProducts(sortBy) {
        this.renderProducts();
    },

    /**
     * Update statistics cards
     */
    updateStatistics() {
        const stats = AnalyzerService.calculateStatistics(this.currentProducts);

        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('avgGrowth').textContent = `${stats.avgGrowth}%`;
        document.getElementById('avgCommission').textContent = `${stats.avgCommission}%`;
        document.getElementById('hiddenGemsCount').textContent = stats.hiddenGemsCount;
    },

    /**
     * Update charts
     */
    updateCharts() {
        this.updateGrowthChart();
        this.updateCategoryChart();
    },

    /**
     * Update growth distribution chart
     */
    updateGrowthChart() {
        const ctx = document.getElementById('growthChart');
        if (!ctx) return;

        const distribution = AnalyzerService.getGrowthDistribution(this.currentProducts);

        if (this.charts.growth) {
            this.charts.growth.destroy();
        }

        this.charts.growth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(distribution),
                datasets: [{
                    label: 'Products',
                    data: Object.values(distribution),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(255, 205, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(54, 162, 235, 0.8)'
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(255, 159, 64)',
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    },

    /**
     * Update category breakdown chart
     */
    updateCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const breakdown = AnalyzerService.getCategoryBreakdown(this.currentProducts);

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(breakdown),
                datasets: [{
                    data: Object.values(breakdown).map(b => b.count),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: 'rgba(255,255,255,0.7)' }
                    }
                }
            }
        });
    },

    /**
     * Show product detail modal
     */
    showProductDetail(product) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const body = document.getElementById('productModalBody');

        if (!modal || !body) return;

        title.textContent = product.name;

        body.innerHTML = `
            <div class="product-detail">
                <div class="detail-header">
                    <div class="detail-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="detail-info">
                        <h3>${product.name}</h3>
                        <div class="detail-pricing">
                            <span class="detail-price">฿${product.price.toLocaleString()}</span>
                            ${product.discountPercentage > 0 ? `
                                <span class="detail-original">฿${product.originalPrice.toLocaleString()}</span>
                                <span class="detail-discount">-${product.discountPercentage}%</span>
                            ` : ''}
                        </div>
                        <div class="detail-meta">
                            <span>⭐ ${product.rating} (${product.reviewCount} reviews)</span>
                            <span>📦 ${product.soldText}</span>
                            <span>🏪 ${product.sellerName}</span>
                        </div>
                        <div class="detail-badges">
                            ${TrendingFinder.getGrowthBadge(product.growthRate)}
                            ${CommissionDisplay.getCommissionBadge(product.commissionRate)}
                            ${CompetitionDetector.getCompetitionBadge(product)}
                        </div>
                    </div>
                </div>

                <div class="detail-sections">
                    ${CommissionDisplay.renderCommissionSection(product)}
                    ${CompetitionDetector.renderCompetitionAnalysis(product)}
                    ${ContentIdeas.renderContentIdeas(product)}
                </div>

                <div class="detail-actions">
                    <button class="btn btn-primary" onclick="LinkManager.copyLink(App.getProduct('${product.id}'))">
                        📋 Copy Affiliate Link
                    </button>
                    <button class="btn btn-secondary" onclick="LinkManager.copyWithCaption(App.getProduct('${product.id}'))">
                        📝 Copy with Caption
                    </button>
                    <button class="btn btn-secondary" onclick="MyDashboard.addToWishlist(App.getProduct('${product.id}'))">
                        ❤️ Add to Wishlist
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    /**
     * Close product modal
     */
    closeProductModal() {
        document.getElementById('productModal')?.classList.remove('active');
    },

    /**
     * Get product by ID
     */
    getProduct(productId) {
        return this.currentProducts.find(p => p.id === productId) ||
            StorageService.getWishlist().find(p => p.id === productId);
    },

    /**
     * Show export modal
     */
    showExportModal() {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const body = document.getElementById('productModalBody');

        if (!modal || !body) return;

        title.textContent = '📥 Export Links';
        body.innerHTML = LinkManager.renderExportModal();
        modal.classList.add('active');
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Make App available globally
window.App = App;
