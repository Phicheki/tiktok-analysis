/**
 * Analyzer Service
 * Handles data analysis for trending, competition, and earnings calculations
 */

const AnalyzerService = {
    /**
     * Calculate statistics for a product list
     */
    calculateStatistics(products) {
        if (!products.length) {
            return {
                totalProducts: 0,
                avgGrowth: 0,
                avgCommission: 0,
                hiddenGemsCount: 0,
                avgPrice: 0,
                totalPotentialEarnings: 0
            };
        }

        const totalProducts = products.length;
        const avgGrowth = Math.round(
            products.reduce((sum, p) => sum + (p.growthRate || 0), 0) / totalProducts
        );
        const avgCommission = Math.round(
            products.reduce((sum, p) => sum + (p.commissionRate || 0), 0) / totalProducts
        );
        const avgPrice = Math.round(
            products.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts
        );
        const totalPotentialEarnings = products.reduce(
            (sum, p) => sum + (p.potentialEarnings || 0), 0
        );
        const hiddenGemsCount = products.filter(p =>
            this.calculateSaturationScore(p) < 30 && p.soldCount > 100
        ).length;

        return {
            totalProducts,
            avgGrowth,
            avgCommission,
            hiddenGemsCount,
            avgPrice,
            totalPotentialEarnings
        };
    },

    /**
     * Calculate saturation score (competition level)
     * Lower = less competition = better opportunity
     */
    calculateSaturationScore(product) {
        // Factors:
        // - Number of affiliate videos (estimated from review count)
        // - Sold count
        // - Category competition level

        const categoryCompetition = {
            'Beauty': 70,
            'Fashion': 65,
            'Electronics': 50,
            'Home & Living': 40,
            'Food': 55,
            'Health': 45,
            'Sports': 35,
            'Other': 50
        };

        const baseCategoryScore = categoryCompetition[product.category] || 50;

        // Adjust based on review count (more reviews = more affiliates likely)
        let affiliateAdjustment = 0;
        if (product.reviewCount > 1000) affiliateAdjustment = 20;
        else if (product.reviewCount > 500) affiliateAdjustment = 10;
        else if (product.reviewCount > 100) affiliateAdjustment = 5;
        else affiliateAdjustment = -10; // Low reviews = opportunity

        // Adjust for sold count (high sales + low reviews = hidden gem)
        const salesReviewRatio = product.soldCount / Math.max(product.reviewCount, 1);
        let ratioAdjustment = 0;
        if (salesReviewRatio > 100) ratioAdjustment = -15;
        else if (salesReviewRatio > 50) ratioAdjustment = -10;
        else if (salesReviewRatio > 20) ratioAdjustment = -5;

        const score = Math.max(0, Math.min(100,
            baseCategoryScore + affiliateAdjustment + ratioAdjustment
        ));

        return score;
    },

    /**
     * Get competition level from saturation score
     */
    getCompetitionLevel(score) {
        if (score < 30) return { level: 'low', label: '🟢 Low', color: 'var(--competition-low)' };
        if (score < 60) return { level: 'medium', label: '🟡 Medium', color: 'var(--competition-medium)' };
        return { level: 'high', label: '🔴 High', color: 'var(--competition-high)' };
    },

    /**
     * Find trending products (high growth rate)
     */
    findTrending(products, minGrowth = 50) {
        return products
            .filter(p => p.growthRate >= minGrowth)
            .sort((a, b) => b.growthRate - a.growthRate);
    },

    /**
     * Find rising stars (growing fast but not yet saturated)
     */
    findRisingStars(products) {
        return products
            .filter(p => p.growthRate >= 50 && this.calculateSaturationScore(p) < 50)
            .sort((a, b) => {
                // Balance between growth and low competition
                const scoreA = a.growthRate - this.calculateSaturationScore(a);
                const scoreB = b.growthRate - this.calculateSaturationScore(b);
                return scoreB - scoreA;
            });
    },

    /**
     * Find hidden gems (high sales, low competition)
     */
    findHiddenGems(products) {
        return products
            .filter(p => {
                const saturation = this.calculateSaturationScore(p);
                return saturation < 30 && p.soldCount > 100;
            })
            .sort((a, b) => {
                // Rank by potential: high sales + low competition
                const potentialA = a.soldCount / this.calculateSaturationScore(a);
                const potentialB = b.soldCount / this.calculateSaturationScore(b);
                return potentialB - potentialA;
            });
    },

    /**
     * Find top commission products
     */
    findTopCommission(products, minCommission = 10) {
        return products
            .filter(p => p.commissionRate >= minCommission)
            .sort((a, b) => b.potentialEarnings - a.potentialEarnings);
    },

    /**
     * Sort products by different criteria
     */
    sortProducts(products, sortBy = 'growth') {
        const sorted = [...products];

        switch (sortBy) {
            case 'growth':
                return sorted.sort((a, b) => b.growthRate - a.growthRate);
            case 'commission':
                return sorted.sort((a, b) => b.commissionRate - a.commissionRate);
            case 'sales':
                return sorted.sort((a, b) => b.soldCount - a.soldCount);
            case 'competition':
                return sorted.sort((a, b) =>
                    this.calculateSaturationScore(a) - this.calculateSaturationScore(b)
                );
            case 'earnings':
                return sorted.sort((a, b) => b.potentialEarnings - a.potentialEarnings);
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            default:
                return sorted;
        }
    },

    /**
     * Filter products by criteria
     */
    filterProducts(products, filters = {}) {
        // Safety check - ensure products is an array
        if (!Array.isArray(products)) {
            console.warn('filterProducts received non-array:', products);
            return [];
        }

        return products.filter(p => {
            // Category filter
            if (filters.category && p.category !== filters.category) {
                return false;
            }

            // Growth filter (minimum growth %)
            if (filters.growth && p.growthRate < parseInt(filters.growth)) {
                return false;
            }

            // Commission filter (minimum %)
            if (filters.commission && p.commissionRate < parseInt(filters.commission)) {
                return false;
            }

            // Competition filter
            if (filters.competition) {
                const saturation = this.calculateSaturationScore(p);
                if (filters.competition === 'low' && saturation >= 30) return false;
                if (filters.competition === 'medium' && (saturation < 30 || saturation >= 60)) return false;
                if (filters.competition === 'high' && saturation < 60) return false;
            }

            // Price range
            if (filters.minPrice && p.price < filters.minPrice) return false;
            if (filters.maxPrice && p.price > filters.maxPrice) return false;

            return true;
        });
    },

    /**
     * Get category breakdown
     */
    getCategoryBreakdown(products) {
        const breakdown = {};
        products.forEach(p => {
            const cat = p.category || 'Other';
            if (!breakdown[cat]) {
                breakdown[cat] = { count: 0, totalSales: 0, totalEarnings: 0 };
            }
            breakdown[cat].count++;
            breakdown[cat].totalSales += p.soldCount;
            breakdown[cat].totalEarnings += p.potentialEarnings;
        });
        return breakdown;
    },

    /**
     * Get growth distribution for chart
     */
    getGrowthDistribution(products) {
        const buckets = {
            '0-25%': 0,
            '26-50%': 0,
            '51-100%': 0,
            '101-200%': 0,
            '200%+': 0
        };

        products.forEach(p => {
            if (p.growthRate <= 25) buckets['0-25%']++;
            else if (p.growthRate <= 50) buckets['26-50%']++;
            else if (p.growthRate <= 100) buckets['51-100%']++;
            else if (p.growthRate <= 200) buckets['101-200%']++;
            else buckets['200%+']++;
        });

        return buckets;
    },

    /**
     * Generate content type analysis (mock for demo)
     */
    analyzeContentTypes(product) {
        // In real app, would analyze actual affiliate videos
        return {
            unboxing: Math.floor(Math.random() * 40) + 20,
            review: Math.floor(Math.random() * 30) + 30,
            tutorial: Math.floor(Math.random() * 20) + 10,
            comparison: Math.floor(Math.random() * 15) + 5
        };
    },

    /**
     * Get suggested hashtags based on category
     */
    getSuggestedHashtags(product) {
        const baseHashtags = ['#TikTokShop', '#สินค้าขายดี', '#รีวิว', '#แนะนำ'];

        const categoryHashtags = {
            'Beauty': ['#บิวตี้', '#เครื่องสำอาง', '#สกินแคร์', '#makeup', '#beauty'],
            'Fashion': ['#แฟชั่น', '#เสื้อผ้า', '#OOTD', '#fashion', '#style'],
            'Electronics': ['#อิเล็กทรอนิกส์', '#gadget', '#tech', '#ของมันต้องมี'],
            'Home & Living': ['#บ้าน', '#ของแต่งบ้าน', '#homeliving', '#interior'],
            'Food': ['#อาหาร', '#ของกิน', '#อร่อย', '#foodtiktok'],
            'Health': ['#สุขภาพ', '#อาหารเสริม', '#healthy', '#wellness'],
            'Sports': ['#กีฬา', '#ออกกำลังกาย', '#fitness', '#workout']
        };

        const catTags = categoryHashtags[product.category] || ['#ของดี', '#น่าซื้อ'];
        return [...baseHashtags, ...catTags];
    }
};

// Make available globally
window.AnalyzerService = AnalyzerService;
