/**
 * Product Card Component
 * Web component for displaying product information
 */

class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.product = null;
    }

    static get observedAttributes() {
        return ['product-data'];
    }

    connectedCallback() {
        this.render();
        this.bindEvents();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'product-data' && newValue) {
            try {
                this.product = JSON.parse(newValue);
                this.render();
                this.bindEvents();
            } catch (e) {
                console.error('Invalid product data:', e);
            }
        }
    }

    setProduct(product) {
        this.product = product;
        this.render();
        this.bindEvents();
    }

    render() {
        if (!this.product) {
            this.innerHTML = '<div class="product-card skeleton"></div>';
            return;
        }

        const p = this.product;
        const saturationScore = AnalyzerService.calculateSaturationScore(p);
        const competition = AnalyzerService.getCompetitionLevel(saturationScore);
        const isGem = saturationScore < 30 && p.soldCount > 100;
        const isRisingStar = p.growthRate >= 50 && saturationScore < 50;
        const isWishlisted = StorageService.isInWishlist(p.id);

        this.innerHTML = `
            <div class="product-card ${isGem ? 'is-gem' : ''}" data-product-id="${p.id}">
                <div class="product-image">
                    <img src="${p.image}" alt="${p.name}" loading="lazy" 
                         onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    <div class="product-badges">
                        <div class="badges-left">
                            ${TrendingFinder.getGrowthBadge(p.growthRate)}
                            ${isRisingStar ? TrendingFinder.getRisingStarBadge() : ''}
                        </div>
                        <div class="badges-right">
                            ${CompetitionDetector.getCompetitionBadge(p)}
                            ${isGem ? CompetitionDetector.getHiddenGemBadge() : ''}
                        </div>
                    </div>
                    <div class="product-overlay">
                        <button class="btn-overlay btn-quick-view" title="Quick View">
                            👁️
                        </button>
                    </div>
                </div>
                
                <div class="product-content">
                    <h3 class="product-name" title="${p.name || 'Unknown'}">${p.name || 'Unknown Product'}</h3>
                    
                    <div class="product-pricing">
                        <span class="product-price">฿${(p.price || 0).toLocaleString()}</span>
                        ${(p.discountPercentage || 0) > 0 ? `
                            <span class="product-original-price">฿${(p.originalPrice || 0).toLocaleString()}</span>
                            <span class="product-discount">-${p.discountPercentage}%</span>
                        ` : ''}
                    </div>

                    <div class="product-meta">
                        <span class="meta-item">⭐ ${p.rating || 'N/A'}</span>
                        <span class="meta-item">📦 ${p.soldText || 'N/A'}</span>
                    </div>

                    <div class="product-stats">
                        <div class="product-stat">
                            <span class="product-stat-label">Commission</span>
                            <span class="product-stat-value commission-value">💰 ${p.commissionRate || 0}%</span>
                        </div>
                        <div class="product-stat">
                            <span class="product-stat-label">Est. Earnings</span>
                            <span class="product-stat-value earnings-value">${CommissionDisplay.formatEarnings(p.potentialEarnings || 0)}/เดือน</span>
                        </div>
                    </div>
                </div>

                <div class="product-actions">
                    <button class="btn btn-primary btn-copy-link" title="Copy Affiliate Link">
                        📋 Copy Link
                    </button>
                    <button class="btn btn-secondary btn-wishlist ${isWishlisted ? 'active' : ''}" title="Add to Wishlist">
                        ${isWishlisted ? '❤️' : '🤍'}
                    </button>
                    <button class="btn btn-ghost btn-details" title="View Details">
                        ℹ️
                    </button>
                </div>
            </div>
        `;
    }

    bindEvents() {
        if (!this.product) return;

        const card = this.querySelector('.product-card');
        const copyBtn = this.querySelector('.btn-copy-link');
        const wishlistBtn = this.querySelector('.btn-wishlist');
        const detailsBtn = this.querySelector('.btn-details');
        const quickViewBtn = this.querySelector('.btn-quick-view');

        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                LinkManager.copyLink(this.product);
            });
        }

        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleWishlist();
            });
        }

        if (detailsBtn) {
            detailsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                App.showProductDetail(this.product);
            });
        }

        if (quickViewBtn) {
            quickViewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                App.showProductDetail(this.product);
            });
        }

        // Card click
        if (card) {
            card.addEventListener('click', () => {
                App.showProductDetail(this.product);
            });
        }
    }

    toggleWishlist() {
        const isWishlisted = StorageService.isInWishlist(this.product.id);

        if (isWishlisted) {
            StorageService.removeFromWishlist(this.product.id);
            App.showToast('💔 ลบออกจาก Wishlist', 'info');
        } else {
            StorageService.addToWishlist(this.product);
            App.showToast('❤️ เพิ่มใน Wishlist แล้ว!', 'success');
        }

        // Re-render to update button
        this.render();
        this.bindEvents();
    }
}

// Register custom element
customElements.define('product-card', ProductCard);

// Helper to create product cards
window.createProductCard = function (product) {
    const card = document.createElement('product-card');
    card.setProduct(product);
    return card;
};
