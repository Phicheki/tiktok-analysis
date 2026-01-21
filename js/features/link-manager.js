/**
 * Link Manager Feature
 * Handles copying links, saving, and exporting
 */

const LinkManager = {
    
    copyLink(product) {
        const link = product.affiliateLink || product.url;
        
        if (!link) {
            App.showToast('No link available', 'error');
            return;
        }

        navigator.clipboard.writeText(link).then(() => {
            App.showToast('📋 Link copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Copy failed', err);
            App.showToast('Failed to copy link', 'error');
        });
    },

    generateCaption(product) {
        return `
🔥 ${product.name}
💰 Price: ฿${product.price}
📦 Check it out here: ${product.affiliateLink || product.url}

#TikTokShop #MustHave ${product.category ? `#${product.category}` : ''}
        `.trim();
    },

    exportLinks() {
        const list = App.state.currentTab === 'my-dashboard' 
            ? StorageService.getWishlist() // Default export wishlist in dashboard
            : App.state.products;

        if (list.length === 0) {
            App.showToast('No products to export', 'info');
            return;
        }

        const content = list.map(p => this.generateCaption(p)).join('\n\n-------------------\n\n');
        
        // Create download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tiktok-products-${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        App.showToast('📥 Exported successfully', 'success');
    }
};

window.LinkManager = LinkManager;
