/**
 * Commission Display Feature
 * Handles commission rate display and earnings calculations
 */

const CommissionDisplay = {
    /**
     * Find top commission products
     */
    findTopCommission(products, minCommission = 0) {
        if (!Array.isArray(products)) return [];
        return AnalyzerService.findTopCommission(products, minCommission);
    },

    /**
     * Get commission badge HTML
     */
    getCommissionBadge(commissionRate) {
        let icon = '💰';
        if (commissionRate >= 20) icon = '💰💰💰';
        else if (commissionRate >= 15) icon = '💰💰';

        return `<span class="badge badge-commission">${icon} ${commissionRate}%</span>`;
    },

    /**
     * Format potential earnings
     */
    formatEarnings(amount) {
        if (amount >= 1000000) {
            return `฿${(amount / 1000000).toFixed(1)}M`;
        }
        if (amount >= 1000) {
            return `฿${(amount / 1000).toFixed(1)}K`;
        }
        return `฿${amount}`;
    },

    /**
     * Render earnings estimate
     */
    renderEarningsEstimate(product) {
        const monthly = product.potentialEarnings;
        const daily = Math.round(monthly / 30);

        return `
            <div class="earnings-estimate">
                <div class="earnings-row">
                    <span class="earnings-label">💵 ประมาณรายได้/เดือน:</span>
                    <span class="earnings-value">${this.formatEarnings(monthly)}</span>
                </div>
                <div class="earnings-row small">
                    <span class="earnings-label">📊 ต่อวัน:</span>
                    <span class="earnings-value">${this.formatEarnings(daily)}</span>
                </div>
                <div class="earnings-formula">
                    <small>= ยอดขาย/วัน × ราคา × ${product.commissionRate}%</small>
                </div>
            </div>
        `;
    },

    /**
     * Render commission section in product detail
     */
    renderCommissionSection(product) {
        return `
            <div class="commission-section">
                <h4>💵 Commission Information</h4>
                <div class="commission-grid">
                    <div class="commission-item">
                        <span class="label">Commission Rate</span>
                        <span class="value highlight">${product.commissionRate}%</span>
                    </div>
                    <div class="commission-item">
                        <span class="label">ราคาสินค้า</span>
                        <span class="value">฿${product.price.toLocaleString()}</span>
                    </div>
                    <div class="commission-item">
                        <span class="label">รายได้ต่อชิ้น</span>
                        <span class="value">฿${Math.round(product.price * product.commissionRate / 100)}</span>
                    </div>
                    <div class="commission-item">
                        <span class="label">ยอดขาย</span>
                        <span class="value">${product.soldText}</span>
                    </div>
                </div>
                ${this.renderEarningsEstimate(product)}
            </div>
        `;
    }
};

window.CommissionDisplay = CommissionDisplay;
