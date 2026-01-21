/**
 * Trending Finder Feature
 * Identifies trending products and rising stars
 */

const TrendingFinder = {
    
    /**
     * Find products with high growth rate
     */
    findTrendingProducts(products, days = 7) {
        // Filter products with > 20% growth
        return products.filter(p => p.growthRate >= 20)
                       .sort((a, b) => b.growthRate - a.growthRate);
    },

    /**
     * Find "Rising Stars" (High growth but low saturation)
     */
    findRisingStars(products) {
        return products.filter(p => p.growthRate >= 50 && p.saturationScore < 50);
    },

    /**
     * Get badge HTML for growth
     */
    getGrowthBadge(rate) {
        if (rate >= 100) return `<span class="badge badge-growth">🚀 +${rate}%</span>`;
        if (rate >= 50) return `<span class="badge badge-growth">🔥 +${rate}%</span>`;
        if (rate >= 20) return `<span class="badge badge-growth">📈 +${rate}%</span>`;
        return '';
    },

    getRisingStarBadge() {
        return `<span class="badge" style="background: #7b61ff;">⭐ Rising Star</span>`;
    },

    renderTrendingSection(container, products) {
        // Render headers, badges etc.
    }
};

window.TrendingFinder = TrendingFinder;
