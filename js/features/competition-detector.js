/**
 * Competition Detector Feature
 * Handles saturation scoring and finding hidden gems
 */

const CompetitionDetector = {
    /**
     * Find hidden gems (high sales + low competition)
     */
    findHiddenGems(products) {
        if (!Array.isArray(products)) return [];
        return AnalyzerService.findHiddenGems(products);
    },

    /**
     * Get saturation score for a product
     */
    getSaturationScore(product) {
        return AnalyzerService.calculateSaturationScore(product);
    },

    /**
     * Get competition level info
     */
    getCompetitionLevel(product) {
        const score = this.getSaturationScore(product);
        return AnalyzerService.getCompetitionLevel(score);
    },

    /**
     * Get competition badge HTML
     */
    getCompetitionBadge(product) {
        const score = this.getSaturationScore(product);
        const level = AnalyzerService.getCompetitionLevel(score);

        const badgeClass = `badge-competition-${level.level}`;
        return `<span class="badge ${badgeClass}">${level.label}</span>`;
    },

    /**
     * Get hidden gem badge
     */
    getHiddenGemBadge() {
        return `<span class="badge badge-gem">💎 Hidden Gem</span>`;
    },

    /**
     * Render competition analysis section
     */
    renderCompetitionAnalysis(product) {
        const score = this.getSaturationScore(product);
        const level = AnalyzerService.getCompetitionLevel(score);
        const isGem = score < 30 && product.soldCount > 100;

        return `
            <div class="competition-analysis">
                <h4>💎 Competition Analysis</h4>
                
                <div class="saturation-meter">
                    <div class="meter-label">
                        <span>Saturation Score</span>
                        <span class="score" style="color: ${level.color}">${score}/100</span>
                    </div>
                    <div class="meter-bar">
                        <div class="meter-fill" style="width: ${score}%; background: ${level.color}"></div>
                    </div>
                    <div class="meter-legend">
                        <span>🟢 Low (0-30)</span>
                        <span>🟡 Medium (30-60)</span>
                        <span>🔴 High (60+)</span>
                    </div>
                </div>

                <div class="competition-verdict">
                    <div class="verdict-icon" style="color: ${level.color}">
                        ${level.level === 'low' ? '💎' : level.level === 'medium' ? '⚡' : '🔥'}
                    </div>
                    <div class="verdict-text">
                        <strong>${level.label} Competition</strong>
                        <p>${this.getVerdictDescription(level.level, isGem)}</p>
                    </div>
                </div>

                ${isGem ? this.renderHiddenGemCard(product) : ''}

                <div class="competition-factors">
                    <h5>📊 Analysis Factors</h5>
                    <ul>
                        <li>
                            <span>Category Competition</span>
                            <span>${product.category}</span>
                        </li>
                        <li>
                            <span>Reviews Count</span>
                            <span>${product.reviewCount.toLocaleString()}</span>
                        </li>
                        <li>
                            <span>Sales/Reviews Ratio</span>
                            <span>${Math.round(product.soldCount / Math.max(product.reviewCount, 1))}:1</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    },

    /**
     * Get verdict description
     */
    getVerdictDescription(level, isGem) {
        if (isGem) {
            return '💎 สินค้านี้เป็น Hidden Gem! มีคนขายน้อยแต่ยอดขายดี โอกาสทำ affiliate สูงมาก!';
        }

        switch (level) {
            case 'low':
                return 'การแข่งขันต่ำ โอกาสดีในการทำ affiliate!';
            case 'medium':
                return 'การแข่งขันปานกลาง ต้องทำ content ที่ดีเพื่อแข่งขัน';
            case 'high':
                return 'การแข่งขันสูงมาก แนะนำให้มองหาสินค้าอื่น หรือทำ content ที่โดดเด่น';
            default:
                return '';
        }
    },

    /**
     * Render hidden gem highlight card
     */
    renderHiddenGemCard(product) {
        return `
            <div class="hidden-gem-card">
                <div class="gem-icon">💎✨</div>
                <div class="gem-content">
                    <strong>Hidden Gem Found!</strong>
                    <p>สินค้านี้มียอดขาย ${product.soldText} แต่คนทำ affiliate น้อย นี่คือโอกาสทอง!</p>
                    <div class="gem-actions">
                        <button class="btn btn-primary btn-sm" onclick="LinkManager.copyLink(App.getProduct('${product.id}'))">
                            📋 Copy Link Now
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render hidden gems section header
     */
    renderHiddenGemsHeader(count) {
        return `
            <div class="section-header hidden-gems-header">
                <h2>💎 Hidden Gems <span class="count">(${count})</span></h2>
                <p class="section-desc">สินค้าที่คนทำ affiliate น้อย แต่ยอดขายดี - โอกาสทอง!</p>
            </div>
        `;
    }
};

window.CompetitionDetector = CompetitionDetector;
