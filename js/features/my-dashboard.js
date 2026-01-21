/**
 * My Dashboard Feature
 * Handles wishlist, promoted items, and collections
 */

const MyDashboard = {
    currentTab: 'wishlist',

    render() {
        const container = document.getElementById('dashboardContent');
        const tabs = document.querySelectorAll('.dash-tab');
        
        // Bind tabs
        tabs.forEach(tab => {
            tab.onclick = (e) => {
                // Update UI
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update State & Render
                this.currentTab = e.target.dataset.dash;
                this.renderContent();
            };
        });

        this.renderContent();
    },

    renderContent() {
        const container = document.getElementById('dashboardContent');
        
        switch (this.currentTab) {
            case 'wishlist':
                this.renderWishlist(container);
                break;
            case 'promoted':
                this.renderPromoted(container);
                break;
            case 'collections':
                this.renderCollections(container);
                break;
        }
    },

    renderWishlist(container) {
        const items = StorageService.getWishlist();
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❤️</div>
                    <h3>No Saved Items</h3>
                    <p>Add products to your wishlist to track them here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="products-grid">
                ${items.map(product => this.createDashboardCard(product, 'wishlist')).join('')}
            </div>
        `;
        
        this.bindCardEvents(container);
    },

    renderPromoted(container) {
        const items = StorageService.getPromoted();
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📢</div>
                    <h3>No Promoted Items</h3>
                    <p>Mark items as 'Promoted' to track your active campaigns.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="products-grid">
                ${items.map(product => this.createDashboardCard(product, 'promoted')).join('')}
            </div>
        `;

        this.bindCardEvents(container);
    },

    renderCollections(container) {
        const collections = StorageService.getCollections();
        const names = Object.keys(collections);

        if (names.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>No Collections</h3>
                    <p>Group your products into collections for better organization.</p>
                    <button class="btn btn-primary" onclick="MyDashboard.createNewCollection()">
                        + Create Collection
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="collections-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
                ${names.map(name => `
                    <div class="collection-card" style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px;">
                        <h3>${name}</h3>
                        <p>${collections[name].length} Items</p>
                        <button class="btn btn-secondary btn-sm" onclick="MyDashboard.viewCollection('${name}')">View</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    createDashboardCard(product, type) {
        // Reuse product card logic but add Notes
        const note = StorageService.getNotes(product.id);
        
        return `
            <div class="dashboard-product-card" style="background: var(--bg-tertiary); border-radius: 12px; padding: 16px; display: flex; gap: 16px;">
                <img src="${product.image}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                
                <div class="d-card-content" style="flex: 1;">
                    <h4>${product.name}</h4>
                    <div class="d-stats" style="font-size: 0.9rem; color: var(--text-secondary); margin: 8px 0;">
                        <span>💰 Comm: ${product.commissionRate}%</span> | 
                        <span>📦 Sold: ${product.soldText}</span>
                    </div>
                    
                    <div class="d-actions" style="display: flex; gap: 8px;">
                        <button class="btn btn-sm btn-primary" onclick="LinkManager.copyLink({id:'${product.id}', url:'${product.link}'})">Copy Link</button>
                        ${type === 'wishlist' ? 
                            `<button class="btn btn-sm btn-secondary" onclick="MyDashboard.promote('${product.id}')">Promote</button>` : 
                            `<button class="btn btn-sm btn-ghost" onclick="MyDashboard.unpromote('${product.id}')">Stop Promoting</button>`
                        }
                    </div>

                    <div class="notes-section" style="margin-top: 12px;">
                        <textarea placeholder="Add private note..." 
                            style="width: 100%; background: var(--bg-card); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px; border-radius: 4px;"
                            onchange="MyDashboard.saveNote('${product.id}', this.value)"
                        >${note}</textarea>
                    </div>
                </div>
            </div>
        `;
    },

    saveNote(id, text) {
        StorageService.saveNote(id, text);
        App.showToast('Note saved', 'success');
    },

    promote(id) {
        const list = StorageService.getWishlist();
        const product = list.find(p => p.id === id);
        if (product) {
            StorageService.addToPromoted(product);
            StorageService.removeFromWishlist(id);
            this.render(); // Refresh
            App.showToast('Moved to Promoted', 'success');
        }
    },

    unpromote(id) {
        StorageService.removeFromPromoted(id);
        this.render();
        App.showToast('Removed from Promoted', 'info');
    },

    createNewCollection() {
        const name = prompt('Enter collection name:');
        if (name) {
            if (StorageService.createCollection(name)) {
                this.render();
                App.showToast('Collection created', 'success');
            } else {
                App.showToast('Collection already exists', 'error');
            }
        }
    },

    viewCollection(name) {
        // Implement view logic
        alert('Viewing collection: ' + name);
    },
    
    // Bind events for dynamically created buttons if needed
    bindCardEvents(container) {
        // ...
    }
};

window.MyDashboard = MyDashboard;
