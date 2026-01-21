/**
 * Trending Finder Feature
 * Handles finding and displaying trending products
 */

const TrendingFinder = {
    /**
     * Find trending products
     */
    findTrending(products, minGrowth = 0) {
        // Safety check
        if (!Array.isArray(products)) return [];
        
        // Filter by minimum growth
        return AnalyzerService.findTrending(products, minGrowth);
    },

    /**
     * Find rising stars (fast growth + low competition)
     */
    findRisingStars(products) {
        return AnalyzerService.findRisingStars(products);
    },

    /**
     * Render trending section header
     */
    renderHeader(count) {
        return `
            <div class="section-header">
                <h2>🔥 Trending Products <span class="count">(${count})</span></h2>
                <div class="filter-pills">
                    <button class="pill active" data-growth="0">All</button>
                    <button class="pill" data-growth="50">50%+</button>
                    <button class="pill" data-growth="100">100%+</button>
                    <button class="pill" data-growth="200">200%+</button>
                </div>
            </div>
        `;
    },

    /**
     * Get growth badge HTML
     */
    getGrowthBadge(growthRate) {
        let icon = '📈';
        if (growthRate >= 200) icon = '💥';
        else if (growthRate >= 100) icon = '🚀';
        else if (growthRate >= 50) icon = '🔥';

        return `<span class="badge badge-growth">${icon} +${growthRate}%</span>`;
    },

    /**
     * Get rising star indicator
     */
    getRisingStarBadge() {
        return `<span class="badge badge-rising">⭐ Rising Star</span>`;
    }
};

window.TrendingFinder = TrendingFinder;
