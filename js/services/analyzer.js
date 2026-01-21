/**
 * Analyzer Service
 * Handles data analysis and logic
 */

const AnalyzerService = {
    
    /**
     * Calculate Saturation Score (1-100)
     * Lower is better (Low Competition)
     * Higher is worse (High Competition)
     */
    calculateSaturationScore(product) {
        let score = 0;
        
        // 1. Sold Count Impact (Too many sold = saturated)
        if (product.soldCount > 100000) score += 40;
        else if (product.soldCount > 50000) score += 30;
        else if (product.soldCount > 10000) score += 20;
        else if (product.soldCount > 1000) score += 10;
        
        // 2. Sellers Count (Simulated via seller name uniqueness in search - placeholder logic)
        // In real app, we check how many sellers sell this exact item
        score += 10; // Base competition
        
        // 3. Review Count (Many reviews = established market)
        if (product.reviewCount > 5000) score += 20;
        else if (product.reviewCount > 1000) score += 10;
        
        // 4. Growth Rate (High growth might mean trending but also attracting competition)
        // But for initial "Blue Ocean", we want High Growth + Low Sales
        
        // Cap at 100
        return Math.min(score, 100);
    },

    getCompetitionLevel(score) {
        if (score < 30) return 'Low';
        if (score < 60) return 'Medium';
        return 'High';
    },

    /**
     * Filter products based on criteria
     */
    filterProducts(products, filters) {
        return products.filter(p => {
            // Category Filter
            if (filters.category && filters.category !== '' && p.category.toLowerCase() !== filters.category.toLowerCase()) {
                return false;
            }

            // Growth Filter
            if (filters.growth) {
                const minGrowth = parseInt(filters.growth);
                if (p.growthRate < minGrowth) return false;
            }

            // Commission Filter
            if (filters.commission) {
                const minComm = parseInt(filters.commission);
                if (p.commissionRate < minComm) return false;
            }

            // Competition Filter
            if (filters.competition) {
                const level = this.getCompetitionLevel(p.saturationScore).toLowerCase();
                if (level !== filters.competition.toLowerCase()) return false;
            }

            return true;
        });
    },

    /**
     * Sort products
     */
    sortProducts(products, sortBy) {
        const sorted = [...products];
        
        switch (sortBy) {
            case 'growth':
                return sorted.sort((a, b) => b.growthRate - a.growthRate);
            case 'commission':
                return sorted.sort((a, b) => b.commissionRate - a.commissionRate);
            case 'sales':
                return sorted.sort((a, b) => b.soldCount - a.soldCount);
            case 'competition':
                // Low saturation = Better
                return sorted.sort((a, b) => a.saturationScore - b.saturationScore);
            case 'earnings':
                return sorted.sort((a, b) => b.potentialEarnings - a.potentialEarnings);
            default:
                return sorted;
        }
    },

    /**
     * Get Growth Distribution Data for Chart
     */
    getGrowthDistribution(products) {
        // Bins: 0-50%, 50-100%, 100-200%, 200%+
        const bins = [0, 0, 0, 0];
        
        products.forEach(p => {
            if (p.growthRate < 50) bins[0]++;
            else if (p.growthRate < 100) bins[1]++;
            else if (p.growthRate < 200) bins[2]++;
            else bins[3]++;
        });

        return {
            labels: ['0-50%', '50-100%', '100-200%', '200%+'],
            data: bins
        };
    },

    /**
     * Get Category Breakdown for Chart
     */
    getCategoryBreakdown(products) {
        const categories = {};
        
        products.forEach(p => {
            const cat = p.category || 'Other';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        return {
            labels: Object.keys(categories),
            data: Object.values(categories)
        };
    }
};

// Make available globally
window.AnalyzerService = AnalyzerService;
