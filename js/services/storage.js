/**
 * Storage Service
 * Handles all LocalStorage operations
 */

const StorageService = {
    KEYS: {
        API_KEY: 'firecrawl_api_key',
        WISHLIST: 'tiktok_wishlist',
        PROMOTED: 'tiktok_promoted',
        COLLECTIONS: 'tiktok_collections',
        NOTES: 'tiktok_notes',
        CACHE: 'tiktok_api_cache'
    },

    // --- API Key ---
    getApiKey() {
        return localStorage.getItem(this.KEYS.API_KEY);
    },

    setApiKey(key) {
        localStorage.setItem(this.KEYS.API_KEY, key);
    },

    // --- Wishlist (Saved Products) ---
    getWishlist() {
        return JSON.parse(localStorage.getItem(this.KEYS.WISHLIST) || '[]');
    },

    addToWishlist(product) {
        const list = this.getWishlist();
        if (!list.find(p => p.id === product.id)) {
            list.push({ ...product, savedAt: new Date().toISOString() });
            localStorage.setItem(this.KEYS.WISHLIST, JSON.stringify(list));
            return true;
        }
        return false;
    },

    removeFromWishlist(productId) {
        const list = this.getWishlist();
        const newList = list.filter(p => p.id !== productId);
        localStorage.setItem(this.KEYS.WISHLIST, JSON.stringify(newList));
    },

    isInWishlist(productId) {
        const list = this.getWishlist();
        return !!list.find(p => p.id === productId);
    },

    // --- Promoted Products (Tracking) ---
    getPromoted() {
        return JSON.parse(localStorage.getItem(this.KEYS.PROMOTED) || '[]');
    },

    addToPromoted(product) {
        const list = this.getPromoted();
        if (!list.find(p => p.id === product.id)) {
            list.push({ ...product, promotedAt: new Date().toISOString() });
            localStorage.setItem(this.KEYS.PROMOTED, JSON.stringify(list));
            return true;
        }
        return false;
    },

    removeFromPromoted(productId) {
        const list = this.getPromoted();
        const newList = list.filter(p => p.id !== productId);
        localStorage.setItem(this.KEYS.PROMOTED, JSON.stringify(newList));
    },

    isPromoted(productId) {
        const list = this.getPromoted();
        return !!list.find(p => p.id === productId);
    },

    // --- Collections ---
    getCollections() {
        return JSON.parse(localStorage.getItem(this.KEYS.COLLECTIONS) || '{}');
    },

    saveToCollection(name, product) {
        const collections = this.getCollections();
        if (!collections[name]) {
            collections[name] = [];
        }
        if (!collections[name].find(p => p.id === product.id)) {
            collections[name].push(product);
            localStorage.setItem(this.KEYS.COLLECTIONS, JSON.stringify(collections));
        }
    },

    createCollection(name) {
        const collections = this.getCollections();
        if (!collections[name]) {
            collections[name] = [];
            localStorage.setItem(this.KEYS.COLLECTIONS, JSON.stringify(collections));
            return true;
        }
        return false;
    },

    // --- Notes ---
    getNotes(productId) {
        const allNotes = JSON.parse(localStorage.getItem(this.KEYS.NOTES) || '{}');
        return allNotes[productId] || '';
    },

    saveNote(productId, noteText) {
        const allNotes = JSON.parse(localStorage.getItem(this.KEYS.NOTES) || '{}');
        allNotes[productId] = noteText;
        localStorage.setItem(this.KEYS.NOTES, JSON.stringify(allNotes));
    },

    // --- Cache System ---
    getCache(key) {
        const cache = JSON.parse(localStorage.getItem(this.KEYS.CACHE) || '{}');
        const item = cache[key];
        
        if (!item) return null;

        // Check expiration (ttl in minutes)
        const now = new Date().getTime();
        if (now > item.expiry) {
            delete cache[key];
            localStorage.setItem(this.KEYS.CACHE, JSON.stringify(cache));
            return null;
        }

        return item.data;
    },

    setCache(key, data, ttlMinutes = 60) {
        const cache = JSON.parse(localStorage.getItem(this.KEYS.CACHE) || '{}');
        const now = new Date().getTime();
        
        cache[key] = {
            data: data,
            expiry: now + (ttlMinutes * 60 * 1000)
        };
        
        // Cleanup old cache if too large (simple check)
        const keys = Object.keys(cache);
        if (keys.length > 50) {
            // Remove oldest
            const sortedKeys = keys.sort((a, b) => cache[a].expiry - cache[b].expiry);
            delete cache[sortedKeys[0]];
        }

        try {
            localStorage.setItem(this.KEYS.CACHE, JSON.stringify(cache));
        } catch (e) {
            // If quota exceeded, clear all cache
            console.warn('LocalStorage quota exceeded, clearing cache');
            localStorage.removeItem(this.KEYS.CACHE);
        }
    },

    // --- Setup & Utilities ---
    clearAllData() {
        localStorage.removeItem(this.KEYS.WISHLIST);
        localStorage.removeItem(this.KEYS.PROMOTED);
        localStorage.removeItem(this.KEYS.COLLECTIONS);
        localStorage.removeItem(this.KEYS.NOTES);
        localStorage.removeItem(this.KEYS.CACHE);
    },

    exportData() {
        const data = {
            wishlist: this.getWishlist(),
            promoted: this.getPromoted(),
            collections: this.getCollections(),
            notes: JSON.parse(localStorage.getItem(this.KEYS.NOTES) || '{}')
        };
        return JSON.stringify(data, null, 2);
    }
};

// Make available globally
window.StorageService = StorageService;
