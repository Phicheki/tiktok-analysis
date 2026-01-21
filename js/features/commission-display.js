/**
 * Commission Display Feature
 * Handles displaying commission rates and calculating earnings
 */

const CommissionDisplay = {
    
    /**
     * Calculate potential earnings
     */
    calculateEarnings(price, commissionRate) {
        return Math.floor(price * (commissionRate / 100)); // Per sale
    },

    /**
     * Find top commission products
     */
    findTopCommissionProducts(products) {
        // Sort by commission %
        return [...products].sort((a, b) => b.commissionRate - a.commissionRate);
    },

    /**
     * Format earnings for display
     */
    formatEarnings(amount) {
        return `฿${amount.toLocaleString()}`;
    },

    /**
     * Render commission details in product modal
     */
    renderEarnings(product) {
        const perSale = this.calculateEarnings(product.price, product.commissionRate);
        const estimatedMonthly = product.potentialEarnings; // Already calculated in service

        return `
            <div class="commission-section">
                <h3>💰 Commission Analysis</h3>
                <div class="earnings-card" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 215, 0, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span>Commission Rate</span>
                        <span style="font-size: 1.2rem; font-weight: bold; color: #ffd700;">${product.commissionRate}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span>Earnings / Sale</span>
                        <span style="color: #4ade80;">+${this.formatEarnings(perSale)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; margin-top: 5px;">
                        <span>Est. Monthly Earnings</span>
                        <span style="font-size: 1.1rem; font-weight: bold; color: #4ade80;">${this.formatEarnings(estimatedMonthly)}</span>
                    </div>
                    <small style="display: block; margin-top: 10px; color: #aaa; font-size: 0.8rem;">
                        *Based on current sales velocity and pricing
                    </small>
                </div>
            </div>
        `;
    }
};

window.CommissionDisplay = CommissionDisplay;
