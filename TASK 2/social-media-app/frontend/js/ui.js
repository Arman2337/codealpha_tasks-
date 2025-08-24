class UIHandler {
    constructor() {
        // Main containers
        this.appContainer = document.getElementById('app-container');
        this.navLinks = document.querySelectorAll('#main-nav .nav-link');
        this.createPostBtn = document.getElementById('create-post-btn');
        
        // Content sections
        this.sections = {
            feed: document.getElementById('feed-section'),
            explore: document.getElementById('explore-section'),
            activity: document.getElementById('activity-section'),
            profile: document.getElementById('profile-section'),
        };

        // Right sidebar placeholders
        this.userProfileSnippet = document.getElementById('user-profile-snippet');
        this.suggestionsBox = document.getElementById('suggestions-box');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Special handling for search button
                if (link.id === 'search-btn') {
                    this.renderSearchModal();
                } else {
                    this.handleNavigation(link.id);
                }
            });
        });
        this.createPostBtn.addEventListener('click', () => this.renderCreatePostModal());
    }

    async handleNavigation(buttonId) {
        this.navLinks.forEach(link => link.classList.toggle('active', link.id === buttonId));
        
        Object.values(this.sections).forEach(section => section.classList.add('hidden'));

        let sectionToShow;
        switch (buttonId) {
            case 'home-btn':
                sectionToShow = this.sections.feed;
                await this.loadFeed();
                break;
            case 'explore-btn':
                sectionToShow = this.sections.explore;
                await this.loadExplore();
                break;
            case 'activity-btn':
                sectionToShow = this.sections.activity;
                await this.loadActivity();
                break;
            case 'profile-btn':
                sectionToShow = this.sections.profile;
                await this.loadProfile();
                break;
        }
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
        }
    }

    // --- RENDER METHODS --- //

    async loadFeed() {
        this.sections.feed.innerHTML = '<p class="text-center p-8">Loading feed...</p>';
        try {
            const posts = await api.getFeed();
            const currentUser = await api.getCurrentUser();
            
            this.sections.feed.innerHTML = `<section id="posts-feed"></section>`;
            const postsFeed = this.sections.feed.querySelector('#posts-feed');
            if (posts.length > 0) {
                postsFeed.innerHTML = posts.map(post => this.createPostElement(post, currentUser)).join('');
            } else {
                postsFeed.innerHTML = '<div class="glass-card rounded-2xl p-8 text-center"><p>No posts in your feed yet. Follow someone to see their posts!</p></div>';
            }
            this.initializePostInteractions(postsFeed);
            this.renderSideBar(currentUser);
        } catch (error) {
            console.error("Error loading feed:", error);
            this.sections.feed.innerHTML = '<p class="text-center p-8 text-red-500">Could not load feed.</p>';
        }
    }

    async loadProfile() {
        this.sections.profile.innerHTML = '<p class="text-center p-8">Loading profile...</p>';
        try {
            const user = await api.getCurrentUser();
            const posts = await api.getUserPosts(user._id);
            this.sections.profile.innerHTML = this.createProfileElement(user, posts);
            this.initializeProfileInteractions(user, posts);
        } catch (error) {
            console.error("Error loading profile:", error);
            this.sections.profile.innerHTML = '<p class="text-center p-8 text-red-500">Could not load profile.</p>';
        }
    }
    
    async loadExplore() {
        this.sections.explore.innerHTML = '<p class="text-center p-8">Loading explore...</p>';
        try {
            const posts = await api.getExplorePosts();
            this.sections.explore.innerHTML = this.createExploreGrid(posts);
        } catch(e) {
            this.sections.explore.innerHTML = '<p class="text-center p-8 text-red-500">Could not load explore content.</p>';
        }
    }
    
    async loadActivity() {
         this.sections.activity.innerHTML = '<div class="glass-card rounded-2xl p-8 text-center"><p>No recent activity.</p></div>';
    }

    renderSideBar(user) {
        if (this.userProfileSnippet) {
            this.userProfileSnippet.innerHTML = `
                <div class="flex items-center gap-4 mb-8">
                    <img src="${user.profilePicture || `https://placehold.co/56x56/E2E8F0/4A5568?text=${user.username.charAt(0)}`}" class="w-14 h-14 rounded-full object-cover" alt="Current User Avatar">
                    <div>
                        <p class="font-bold">${user.username}</p>
                        <p class="text-sm text-gray-500">${user.name || ''}</p>
                    </div>
                    <button id="logout-btn" class="ml-auto text-blue-500 font-semibold text-sm">Logout</button>
                </div>
            `;
            document.getElementById('logout-btn').addEventListener('click', () => authHandler.handleLogout());
        }

        if (this.suggestionsBox) {
            this.suggestionsBox.innerHTML = `
                <div class="glass-card rounded-2xl p-4">
                    <h3 class="font-bold text-gray-600 mb-4">Suggestions For You</h3>
                    <p class="text-sm text-gray-400">No suggestions right now.</p>
                </div>
            `;
        }
    }

    // --- HTML ELEMENT CREATORS --- //

    createPostElement(post, currentUser) {
        const isLiked = post.likes.includes(currentUser._id);
        const placeholderAvatar = `https://placehold.co/48x48/E2E8F0/4A5568?text=${post.user.username.charAt(0)}`;
        
        return `
            <article class="glass-card rounded-2xl mb-8 overflow-hidden">
                <div class="flex items-center p-4 gap-4">
                    <img src="${post.user.profilePicture || placeholderAvatar}" class="w-12 h-12 rounded-full object-cover" alt="User Avatar">
                    <div>
                        <p class="font-bold">${post.user.username}</p>
                        <p class="text-xs text-gray-500">${new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                </div>
                <img src="${post.image}" class="w-full h-auto max-h-[600px] object-cover" alt="Post Image">
                <div class="p-4">
                    <div class="flex items-center gap-4 text-2xl mb-2">
                        <button class="like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
                            <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <button class="comment-btn" data-post-id="${post._id}"><i class="far fa-comment"></i></button>
                        <button><i class="far fa-paper-plane"></i></button>
                    </div>
                    <p class="font-bold like-count">${post.likes.length} likes</p>
                    <p class="mt-2"><span class="font-bold mr-2">${post.user.username}</span> ${post.caption}</p>
                    ${post.comments.length > 0 ? `
                        <button class="view-comments-btn text-gray-500 text-sm mt-2 hover:underline" data-post-id="${post._id}">
                            View all ${post.comments.length} comments
                        </button>
                    ` : '<p class="text-gray-400 text-sm mt-2">No comments yet.</p>'}
                </div>
            </article>
        `;
    }
    
    createProfileElement(user, posts) {
        const placeholderAvatar = `https://placehold.co/128x128/E2E8F0/4A5568?text=${user.username.charAt(0)}`;
        return `
            <div class="glass-card rounded-2xl overflow-hidden">
                <div class="profile-cover h-48 md:h-64"></div>
                <div class="p-4 md:p-6 relative">
                    <div class="absolute -top-16 left-6">
                        <img src="${user.profilePicture || placeholderAvatar}" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover profile-picture">
                    </div>
                    <div class="flex justify-end">
                        <button id="edit-profile-btn-action" class="bg-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">Edit Profile</button>
                    </div>
                    <div class="pt-10">
                        <h2 class="text-2xl font-bold">${user.username}</h2>
                        <p class="text-gray-600">${user.name || ''}</p>
                        <p class="my-4">${user.bio || 'No bio yet. Click edit profile to add one!'}</p>
                        <div class="flex gap-6 text-center">
                            <div><span class="font-bold">${posts.length}</span> Posts</div>
                            <div><span class="font-bold">${user.followers.length}</span> Followers</div>
                            <div><span class="font-bold">${user.following.length}</span> Following</div>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-200 px-4 md:px-6 flex gap-6">
                    <button class="profile-tab active font-semibold py-3" data-tab="posts">Posts</button>
                    <button class="profile-tab text-gray-500 font-semibold py-3" data-tab="saved">Saved</button>
                </div>
                <div id="profile-content-area" class="p-1"></div>
            </div>
        `;
    }

    createExploreGrid(posts) {
        if (!posts || posts.length === 0) {
            return '<p class="text-center p-8">Nothing to explore right now.</p>';
        }
        return `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                ${posts.map(post => `
                    <div class="relative aspect-square overflow-hidden rounded-lg group cursor-pointer">
                        <img src="${post.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div class="text-white flex gap-4 text-lg font-bold">
                                <span><i class="fas fa-heart mr-1"></i> ${post.likes.length}</span>
                                <span><i class="fas fa-comment mr-1"></i> ${post.comments.length}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // --- MODAL CREATORS --- //
    
    renderCreatePostModal() {
        this.createModal("Create New Post", `
            <form id="new-post-form">
                <div class="mb-4">
                    <label class="block mb-2 font-semibold">Upload Image</label>
                    <input type="file" id="post-image-input" accept="image/*" required class="w-full p-2 border rounded-lg bg-gray-50">
                </div>
                <div class="mb-4">
                    <label class="block mb-2 font-semibold">Caption</label>
                    <textarea id="post-caption-input" rows="4" placeholder="Write something..." class="w-full p-2 border rounded-lg bg-gray-50"></textarea>
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-4 rounded-xl text-lg">Share Post</button>
            </form>
        `);

        document.getElementById('new-post-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const image = document.getElementById('post-image-input').files[0];
            const caption = document.getElementById('post-caption-input').value;
            if (!image) { alert('Please select an image.'); return; }
            
            try {
                await api.createPost({ image, caption });
                this.closeModal();
                this.handleNavigation('home-btn');
            } catch (error) {
                alert('Failed to create post.');
                console.error(error);
            }
        });
    }
    
    renderEditProfileModal(user) {
        // Implementation for this modal
    }

    renderSearchModal() {
        this.createModal("Search Users", `
            <div class="relative">
                <input type="text" id="search-input" placeholder="Search for users..." class="w-full p-3 border rounded-lg bg-gray-50 pl-10">
                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
            <div id="search-results" class="mt-4 max-h-64 overflow-y-auto">
                <p class="text-center text-gray-500">Start typing to find users.</p>
            </div>
        `);
    }

    async renderCommentsModal(postId) {
        this.createModal("Comments", `<div id="comments-list" class="text-center p-8">Loading...</div>`);
        const commentsList = document.getElementById('comments-list');
        try {
            const post = await api.getPost(postId);
            if (post.comments.length > 0) {
                commentsList.innerHTML = `
                    <div class="space-y-4 max-h-96 overflow-y-auto text-left">
                        ${post.comments.map(comment => `
                            <div class="flex items-start gap-3">
                                <img src="${comment.user.profilePicture || `https://placehold.co/40x40/E2E8F0/4A5568?text=${comment.user.username.charAt(0)}`}" class="w-10 h-10 rounded-full object-cover">
                                <div>
                                    <p><span class="font-bold">${comment.user.username}</span> ${comment.text}</p>
                                    <p class="text-xs text-gray-500 mt-1">${new Date(comment.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                commentsList.innerHTML = `<p class="text-center text-gray-500 p-8">No comments on this post yet.</p>`;
            }
        } catch (error) {
            commentsList.innerHTML = `<p class="text-center text-red-500 p-8">Could not load comments.</p>`;
        }
    }

    createModal(title, content) {
        this.closeModal(); // Close any existing modal first
        const modalHTML = `
            <div id="app-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                <div class="glass-card rounded-2xl p-6 w-full max-w-md animate-pop-in">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">${title}</h2>
                        <button id="close-modal-btn" class="text-2xl text-gray-500 hover:text-black">&times;</button>
                    </div>
                    <div>${content}</div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const closeModalBtn = document.getElementById('close-modal-btn');
        const appModal = document.getElementById('app-modal');

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }
        if (appModal) {
            appModal.addEventListener('click', (e) => {
                if (e.target.id === 'app-modal') this.closeModal();
            });
        }
    }

    closeModal() {
        const modal = document.getElementById('app-modal');
        if (modal) modal.remove();
    }

    // --- EVENT LISTENERS INITIALIZERS --- //

    initializePostInteractions(container) {
        container.querySelectorAll('.like-btn').forEach(button => {
            button.addEventListener('click', async () => { /* ... unchanged ... */ });
        });

        container.querySelectorAll('.view-comments-btn, .comment-btn').forEach(button => {
            button.addEventListener('click', () => {
                const postId = button.dataset.postId;
                this.renderCommentsModal(postId);
            });
        });
    }
    
    initializeProfileInteractions(user, posts) {
        document.getElementById('edit-profile-btn-action').addEventListener('click', () => {
            this.renderEditProfileModal(user);
        });

        const tabs = document.querySelectorAll('.profile-tab');
        const contentArea = document.getElementById('profile-content-area');
        
        const renderPosts = () => { /* ... unchanged ... */ };
        const renderSaved = () => { /* ... unchanged ... */ };

        renderPosts();

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.classList.remove('active', 'text-gray-500');
                    t.classList.add('text-gray-500');
                });
                tab.classList.add('active');
                tab.classList.remove('text-gray-500');

                if (tab.dataset.tab === 'posts') renderPosts();
                else if (tab.dataset.tab === 'saved') renderSaved();
            });
        });
    }
}

// Initialize the app once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authHandler = new AuthHandler();
});

// Overwrite the original showApp to initialize our UI Handler
AuthHandler.prototype.showApp = function() {
    this.authContainer.classList.add('hidden');
    this.appContainer.classList.remove('hidden');
    window.ui = new UIHandler();
    window.ui.handleNavigation('home-btn');
};
