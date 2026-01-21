// App Controller
const App = {
    state: {
        products: [],
        loading: false,
        filters: {
            category: '',
            growth: '',
            commission: '',
            competition: ''
        },
        currentTab: 'trending',
        sortBy: 'growth',
    },

    init() {
        this.bindEvents();
        this.checkApiKey();
        this.loadSettings();
        
        // Load demo data if no key (for testing)
        if (!localStorage.getItem('firecrawl_api_key')) {
            this.loadDemoData();
        }
    },

    bindEvents() {
        // Search & Filter Events
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Filters
        ['filterCategory', 'filterGrowth', 'filterCommission', 'filterCompetition'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.applyFilters());
        });

        // Sorting
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.state.sortBy = e.target.value;
            this.renderProducts();
        });

        // Tabs
        document.querySelectorAll('.tab').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Settings Modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.toggleModal('settingsModal', true));
        document.getElementById('closeSettings').addEventListener('click', () => this.toggleModal('settingsModal', false));
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        
        // API Test Button
        document.getElementById('testApiBtn').addEventListener('click', () => this.testApiKey());

        // Product Modal
        document.getElementById('closeProduct').addEventListener('click', () => this.toggleModal('productModal', false));
        document.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.toggleModal('productModal', false);
            }
        });

        // Export Button in Dashboard
        document.getElementById('exportBtn').addEventListener('click', () => LinkManager.exportLinks());
    },

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) {
            this.showToast('กรุณาใส่ URL หรือ Keyword', 'info');
            return;
        }

        this.setLoading(true);
        try {
            // Check for API key
            const apiKey = localStorage.getItem('firecrawl_api_key');
            if (!apiKey) {
                this.showToast('กรุณาใส่ API Key ใน Settings ก่อน', 'error');
                this.toggleModal('settingsModal', true);
                this.setLoading(false);
                return;
            }

            // Call Firecrawl Service
            const products = await FirecrawlService.searchProducts(query);
            
            // Normalize and Analyze Data
            this.state.products = products.map(p => {
                const normalized = FirecrawlService.normalizeProduct(p);
                // Calculate derived metrics
                normalized.saturationScore = AnalyzerService.calculateSaturationScore(normalized);
                normalized.potentialEarnings = CommissionDisplay.calculateEarnings(normalized.price, normalized.commissionRate);
                return normalized;
            });

            this.updateStats();
            this.renderProducts();
            this.updateCharts();

            if (this.state.products.length === 0) {
                document.getElementById('emptyState').style.display = 'flex';
                document.getElementById('productsSection').style.display = 'none';
            } else {
                document.getElementById('emptyState').style.display = 'none';
                document.getElementById('productsSection').style.display = 'block';
                document.getElementById('statsGrid').style.display = 'grid';
            }

        } catch (error) {
            console.error('Search error:', error);
            this.showToast('เกิดข้อผิดพลาดในการค้นหา: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    applyFilters() {
        this.state.filters = {
            category: document.getElementById('filterCategory').value,
            growth: document.getElementById('filterGrowth').value,
            commission: document.getElementById('filterCommission').value,
            competition: document.getElementById('filterCompetition').value
        };
        this.renderProducts();
    },

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = '';

        let filtered = this.state.products;

        // 1. Filter by Tab Logic
        if (this.state.currentTab === 'trending') {
            filtered = TrendingFinder.findTrendingProducts(filtered, 7); // Growth > 20%
        } else if (this.state.currentTab === 'hidden-gems') {
            filtered = CompetitionDetector.findHiddenGems(filtered);
        } else if (this.state.currentTab === 'top-commission') {
            filtered = CommissionDisplay.findTopCommissionProducts(filtered);
        } else if (this.state.currentTab === 'my-dashboard') {
            // Handled separately in MyDashboard module, but basic list here
             filtered = []; // MyDashboard renders its own content
             MyDashboard.render();
             return; 
        }

        // 2. Apply Dropdown Filters
        filtered = AnalyzerService.filterProducts(filtered, this.state.filters);

        // 3. Sort
        filtered = AnalyzerService.sortProducts(filtered, this.state.sortBy);

        // Render
        filtered.forEach(product => {
            const card = window.createProductCard(product); // Using helper from component
            grid.appendChild(card);
        });

        // Update count
        document.getElementById('totalProducts').textContent = filtered.length;
    },

    updateStats() {
        const products = this.state.products;
        if (!products.length) return;

        const avgGrowth = products.reduce((sum, p) => sum + p.growthRate, 0) / products.length;
        const avgComm = products.reduce((sum, p) => sum + p.commissionRate, 0) / products.length;
        const gems = products.filter(p => p.saturationScore < 30).length;

        document.getElementById('avgGrowth').textContent = `${avgGrowth.toFixed(1)}%`;
        document.getElementById('avgCommission').textContent = `${avgComm.toFixed(1)}%`;
        document.getElementById('hiddenGemsCount').textContent = gems;

        // Animate numbers (simple implementation)
        this.animateValue('totalProducts', 0, products.length, 1000);
    },

    updateCharts() {
        const products = this.state.products;
        if (!products.length) return;

        // Use AnalyzerService to get chart data
        const growthData = AnalyzerService.getGrowthDistribution(products);
        const categoryData = AnalyzerService.getCategoryBreakdown(products);

        // Render Growth Chart
        const ctxGrowth = document.getElementById('growthChart').getContext('2d');
        if (window.growthChartInstance) window.growthChartInstance.destroy();
        
        window.growthChartInstance = new Chart(ctxGrowth, {
            type: 'bar',
            data: {
                labels: growthData.labels,
                datasets: [{
                    label: 'Number of Products',
                    data: growthData.data,
                    backgroundColor: 'rgba(255, 45, 85, 0.6)',
                    borderColor: '#ff2d55',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Growth Rate Distribution' }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Render Category Chart
        const ctxCat = document.getElementById('categoryChart').getContext('2d');
        if (window.categoryChartInstance) window.categoryChartInstance.destroy();

        window.categoryChartInstance = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.data,
                    backgroundColor: [
                        'rgba(255, 45, 85, 0.8)',
                        'rgba(0, 245, 212, 0.8)',
                        'rgba(123, 97, 255, 0.8)',
                        'rgba(255, 215, 0, 0.8)',
                        'rgba(0, 200, 83, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
        
        document.getElementById('chartsSection').style.display = 'grid';
    },

    switchTab(tabName) {
        this.state.currentTab = tabName;
        
        // Update UI
        document.querySelectorAll('.tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Handle Sections Display
        const productsSection = document.getElementById('productsSection');
        const dashboardSection = document.getElementById('dashboardSection');
        const statsGrid = document.getElementById('statsGrid');
        const searchSection = document.querySelector('.search-section');

        if (tabName === 'my-dashboard') {
            productsSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            statsGrid.style.display = 'none'; // Optional: hide stats on dashboard
            searchSection.style.display = 'none'; // Optional: hide search on dashboard
            MyDashboard.render();
        } else {
            productsSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            statsGrid.style.display = 'grid';
            searchSection.style.display = 'block';
            this.renderProducts();
        }
    },

    showProductDetail(product) {
        // Update Modal Content
        const modalBody = document.getElementById('productModalBody');
        document.getElementById('productModalTitle').textContent = product.name;

        // Use feature modules to render sections
        modalBody.innerHTML = `
            <div class="product-detail-layout">
                <div class="detail-left">
                    <img src="${product.image}" class="detail-image" alt="${product.name}">
                    <div class="detail-actions">
                        <button class="btn btn-primary btn-block" onclick="LinkManager.copyLink({id:'${product.id}', url:'${product.link}'})">
                            📋 Refer Now (Copy Link)
                        </button>
                    </div>
                </div>
                <div class="detail-right">
                    <div class="detail-stats-grid">
                        <div class="d-stat">
                            <label>Price</label>
                            <span>฿${product.price}</span>
                        </div>
                        <div class="d-stat">
                            <label>Commission</label>
                            <span>${product.commissionRate}%</span>
                        </div>
                        <div class="d-stat">
                            <label>Growth</label>
                            <span class="${product.growthRate > 0 ? 'text-success' : ''}">+${product.growthRate}%</span>
                        </div>
                         <div class="d-stat">
                            <label>Sold</label>
                            <span>${product.soldText}</span>
                        </div>
                    </div>

                    <hr class="separator">

                    ${CompetitionDetector.renderAnalysis(product)}

                    <hr class="separator">

                    ${CommissionDisplay.renderEarnings(product)}
                    
                    <hr class="separator">

                    ${ContentIdeas.renderIdeas(product)}
                </div>
            </div>
        `;

        this.toggleModal('productModal', true);
    },

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (show) modal.classList.add('active');
        else modal.classList.remove('active');
    },

    setLoading(isLoading) {
        this.state.loading = isLoading;
        const loader = document.getElementById('loadingState');
        const empty = document.getElementById('emptyState');
        
        if (isLoading) {
            loader.style.display = 'flex';
            empty.style.display = 'none';
            document.getElementById('productsSection').style.display = 'none';
        } else {
            loader.style.display = 'none';
            // empty state handled in performSearch
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    loadSettings() {
        const key = localStorage.getItem('firecrawl_api_key');
        if (key) {
            document.getElementById('apiKey').value = key;
        }
    },

    saveSettings() {
        const key = document.getElementById('apiKey').value.trim();
        if (key) {
            localStorage.setItem('firecrawl_api_key', key);
            this.showToast('บันทึก API Key เรียบร้อย', 'success');
            this.toggleModal('settingsModal', false);
            // Reload if no products
            if (this.state.products.length === 0) {
              // optional: trigger search or demo data
            }
        } else {
            this.showToast('Please enter an API Key', 'error');
        }
    },

    async testApiKey() {
        const key = document.getElementById('apiKey').value.trim();
        const resultDiv = document.getElementById('apiTestResult');
        const btn = document.getElementById('testApiBtn');

        if (!key) {
            this.showToast('Please enter an API Key first', 'error');
            return;
        }

        // UI Loading State
        btn.disabled = true;
        btn.textContent = 'Testing...';
        resultDiv.className = 'api-test-result loading show';
        resultDiv.textContent = 'Checking API Key...';

        try {
            const isValid = await FirecrawlService.testApiKey(key);
            
            if (isValid) {
                resultDiv.className = 'api-test-result success show';
                resultDiv.textContent = '✅ API Key is Valid! Balance available.';
                this.showToast('API Key is valid', 'success');
            } else {
                resultDiv.className = 'api-test-result error show';
                resultDiv.textContent = '❌ API Key Invalid or Credit Exhausted.';
                this.showToast('API Key check failed', 'error');
            }
        } catch (error) {
            resultDiv.className = 'api-test-result error show';
            resultDiv.textContent = '❌ Error: ' + error.message;
        } finally {
            btn.disabled = false;
            btn.textContent = '🧪 ทดสอบ API';
        }
    },

    checkApiKey() {
        const key = localStorage.getItem('firecrawl_api_key');
        if (!key) {
            // Show welcome or prompt
            setTimeout(() => {
                this.showToast('Welcome! Please set your Firecrawl API Key.', 'info');
                // Optional: Open settings automatically? 
                // this.toggleModal('settingsModal', true);
            }, 1000);
        }
    },

    loadDemoData() {
        // Mock data for initial view or testing
        const demoProducts = [
            {
                id: 'demo1',
                name: 'Lipstick Matte Lasting Waterproof',
                price: 159,
                originalPrice: 299,
                discountPercentage: 47,
                soldCount: 5000,
                soldText: '5k+ sold',
                rating: 4.8,
                image: 'https://via.placeholder.com/300',
                link: '#',
                growthRate: 150,
                commissionRate: 15,
                sales: 1200
            },
            {
                id: 'demo2',
                name: 'Wireless Earbuds Pro',
                price: 490,
                originalPrice: 890,
                discountPercentage: 55,
                soldCount: 1200,
                soldText: '1.2k+ sold',
                rating: 4.5,
                image: 'https://via.placeholder.com/300',
                link: '#',
                growthRate: 80,
                commissionRate: 10,
                sales: 500
            },
            {
                id: 'demo3',
                name: 'Vitamin C Serum Face',
                price: 290,
                originalPrice: 390,
                discountPercentage: 25,
                soldCount: 10000,
                soldText: '10k+ sold',
                rating: 4.9,
                image: 'https://via.placeholder.com/300',
                link: '#',
                growthRate: 20,
                commissionRate: 20,
                sales: 3000
            }
        ];

        this.state.products = demoProducts.map(p => {
             const n = FirecrawlService.normalizeProduct(p);
             n.saturationScore = AnalyzerService.calculateSaturationScore(n);
             n.potentialEarnings = CommissionDisplay.calculateEarnings(n.price, n.commissionRate);
             return n;
        });

        this.updateStats();
        this.renderProducts();
        this.updateCharts();
        
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('productsSection').style.display = 'block';
        document.getElementById('statsGrid').style.display = 'grid';
    },
    
    // Animation Helper
    animateValue(id, start, end, duration) {
        if (start === end) return;
        const range = end - start;
        const obj = document.getElementById(id);
        if (!obj) return;
        
        let current = start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        
        const timer = setInterval(function() {
            current += increment;
            obj.innerHTML = current;
            if (current == end) {
                clearInterval(timer);
            }
        }, stepTime);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
