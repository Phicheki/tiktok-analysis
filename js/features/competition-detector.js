/**
 * Competition Detector Feature
 * Analyzes market saturation and finds hidden gems
 */

const CompetitionDetector = {
    
    /**
     * Find "Hidden Gems"
     * Low Competition (Score < 30) AND Good Sales (> 100)
     */
    findHiddenGems(products) {
        return products.filter(p => p.saturationScore < 30 && p.soldCount > 100);
    },

    /**
     * Get badge HTML
     */
    getCompetitionBadge(product) {
        const level = AnalyzerService.getCompetitionLevel(product.saturationScore);
        const colorClass = `badge-competition-${level.toLowerCase()}`;
        return `<span class="badge ${colorClass}">Target: ${level}</span>`;
    },

    getHiddenGemBadge() {
        return `<span class="badge" style="background: linear-gradient(135deg, #00f5d4 0%, #00b894 100%); color: #000;">💎 Hidden Gem</span>`;
    },

    renderAnalysis(product) {
        const score = product.saturationScore;
        const level = AnalyzerService.getCompetitionLevel(score);
        
        let color = '#ccc';
        if (level === 'Low') color = 'var(--competition-low)';
        if (level === 'Medium') color = 'var(--competition-medium)';
        if (level === 'High') color = 'var(--competition-high)';

        return `
            <div class="competition-analysis">
                <h3>📊 Market Analysis</h3>
                <div class="score-bar-container" style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin: 10px 0;">
                    <div class="score-bar" style="width: ${score}%; background: ${color}; height: 100%; border-radius: 4px;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                    <span>Saturation Score: <strong>${score}/100</strong></span>
                    <span style="color: ${color}; font-weight: bold;">${level} Competition</span>
                </div>
                
                <div class="analysis-details" style="margin-top: 15px; font-size: 0.9rem; color: var(--text-secondary);">
                    ${this.getAnalysisText(level, product)}
                </div>
            </div>
        `;
    },

    getAnalysisText(level, product) {
        if (level === 'Low') {
            return `✅ <strong>Blue Ocean Opportunity!</strong> This product has good sales volume (${product.soldText}) but relatively low competition. Great chance to dominate this niche.`;
        }
        if (level === 'Medium') {
            return `⚠️ <strong>Growing Niche.</strong> There are already established sellers, but there's still room for high-quality content. Focus on unique selling points.`;
        }
        return `🔴 <strong>Highly Saturated.</strong> This is a Red Ocean. Requires very high-quality content or unique offers to compete. Consider looking for related sub-niches.`;
    }
};

window.CompetitionDetector = CompetitionDetector;
