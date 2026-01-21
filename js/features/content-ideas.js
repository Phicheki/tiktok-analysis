/**
 * Content Ideas Feature
 * Generates video ideas and hashtags
 */

const ContentIdeas = {
    
    /**
     * Generate content ideas based on category
     */
    getIdeas(product) {
        const commonIdeas = [
            { type: 'Unboxing', title: 'Unboxing ASMR', desc: 'Show packaging details and first impressions with ASMR sounds.' },
            { type: 'Review', title: 'Honest Review', desc: 'Pros & Cons after using for 1 week.' },
            { type: 'Tutorial', title: 'How to Use', desc: 'Step-by-step guide on how to get the best results.' }
        ];

        const categoryIdeas = {
            'Fashion': [
                { type: 'Styling', title: '3 Ways to Style', desc: 'Mix and match with different outfits.' },
                { type: 'Try-on', title: 'Try-on Haul', desc: 'Show fit an sizing on real body.' }
            ],
            'Beauty': [
                { type: 'Routine', title: 'Get Ready With Me', desc: 'Incorporate product into daily routine.' },
                { type: 'Test', title: 'Wear Test', desc: 'Check durability after 8 hours.' }
            ],
            'Food': [
                { type: 'Taste Test', title: 'First Bite Reaction', desc: 'Genuine reaction to taste.' },
                { type: 'Recipe', title: 'Quick Recipe', desc: 'Creative way to eat/use this food.' }
            ]
        };

        const specific = categoryIdeas[product.category] || [];
        return [...commonIdeas, ...specific].slice(0, 4);
    },

    /**
     * Generate Trending Hashtags
     */
    getHashtags(product) {
        const base = ['#tiktokshop', '#musthave'];
        const catTags = {
            'Fashion': ['#ootd', '#fashionhacks', '#style'],
            'Beauty': ['#beautytips', '#skincareroutine', '#makeup'],
            'Electronics': ['#tech', '#gadgets', '#techtok'],
            'Home & Living': ['#homedecor', '#homehacks', '#cleaning'],
            'Food': ['#foodie', '#yummy', '#snack']
        };

        const specific = catTags[product.category] || ['#fyp'];
        return [...base, ...specific, `#${product.name.split(' ')[0].replace(/[^a-zA-Z]/g, '')}`];
    },

    copyHashtags(hashtags) {
        navigator.clipboard.writeText(hashtags.join(' '));
        App.showToast('Hashtags copied!', 'success');
    },

    renderIdeas(product) {
        const ideas = this.getIdeas(product);
        const hashtags = this.getHashtags(product);

        return `
            <div class="content-ideas-section">
                <h3>🎬 Content Ideas</h3>
                <div class="video-grid" style="grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
                    ${ideas.map(idea => `
                        <div class="idea-card" style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px;">
                            <span class="badge" style="background: var(--accent-tertiary); margin-bottom: 5px; display:inline-block;">${idea.type}</span>
                            <h4 style="margin: 5px 0; font-size: 0.95rem;">${idea.title}</h4>
                            <p style="font-size: 0.8rem; color: var(--text-secondary);">${idea.desc}</p>
                        </div>
                    `).join('')}
                </div>

                <h4>🔥 Trending Hashtags</h4>
                <div class="hashtag-list" style="margin-top: 10px;">
                    ${hashtags.map(tag => `<span class="hashtag" onclick="ContentIdeas.copyHashtags(['${tag}'])">${tag}</span>`).join('')}
                    <button class="btn btn-sm btn-secondary" onclick="ContentIdeas.copyHashtags(['${hashtags.join(' ')}'])" style="margin-left: auto;">Copy All</button>
                </div>
            </div>
        `;
    }
};

window.ContentIdeas = ContentIdeas;
