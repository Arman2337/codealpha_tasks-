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
        if (sectionToShow) sectionToShow.classList.remove('hidden');
    }

    // --- RENDER METHODS --- //

    async loadFeed() {
        this.sections.feed.innerHTML = '<p class="text-center p-8">Loading feed...</p>';
        try {
            const posts = await api.getFeed();
            const currentUser = await api.getCurrentUser();
            
            this.sections.feed.innerHTML = `<section id="posts-feed"></section>`;
            const postsFeed = this.sections.feed.querySelector('#posts-feed');
            postsFeed.innerHTML = posts.length > 0
                ? posts.map(post => this.createPostElement(post, currentUser)).join('')
                : '<div class="glass-card rounded-2xl p-8 text-center"><p>No posts in your feed yet. Follow some users to see their posts here!</p></div>';
            
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
            this.sections.profile.innerHTML = this.createProfileElement(user, posts, true);
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
            console.error("Error loading explore:", e);
            this.sections.explore.innerHTML = '<p class="text-center p-8 text-red-500">Could not load explore content.</p>';
        }
    }
    
    async loadActivity() {
         this.sections.activity.innerHTML = '<div class="glass-card rounded-2xl p-8 text-center"><p>No recent activity.</p></div>';
    }

    renderSideBar(user) {
        const placeholderAvatar = `https://placehold.co/56x56/E2E8F0/4A5568?text=${user.username.charAt(0)}`;
        if (this.userProfileSnippet) {
            this.userProfileSnippet.innerHTML = `
                <div class="flex items-center gap-4 mb-8">
                    <img src="${user.profilePicture || placeholderAvatar}" class="w-14 h-14 rounded-full object-cover" alt="User Avatar">
                    <div><p class="font-bold">${user.username}</p><p class="text-sm text-gray-500">${user.name || ''}</p></div>
                    <button id="logout-btn" class="ml-auto text-blue-500 font-semibold text-sm">Logout</button>
                </div>`;
            document.getElementById('logout-btn').addEventListener('click', () => authHandler.handleLogout());
        }
        if (this.suggestionsBox) {
            this.suggestionsBox.innerHTML = `<div class="glass-card rounded-2xl p-4"><h3 class="font-bold text-gray-600 mb-4">Suggestions</h3><p class="text-sm text-gray-400">None right now.</p></div>`;
        }
    }

    // --- HTML ELEMENT CREATORS --- //

    renderAvatar(username, profilePicture, size) {
        const dimension = typeof size === 'number' ? size : 48;
        if (profilePicture) {
            return `<img src="${profilePicture}" class="w-${Math.round(dimension/4)*1} h-${Math.round(dimension/4)*1} rounded-full object-cover" alt="" onerror="this.onerror=null;this.src='https://placehold.co/${dimension}x${dimension}/E2E8F0/4A5568?text=${(username||'?').charAt(0)}'">`;
        }
        // Inline SVG user icon fallback
        return `
            <svg width="${dimension}" height="${dimension}" viewBox="0 0 24 24" fill="#CBD5E1" xmlns="http://www.w3.org/2000/svg" class="rounded-full">
                <circle cx="12" cy="12" r="12" fill="#E5E7EB"/>
                <circle cx="12" cy="8" r="4" fill="#CBD5E1"/>
                <path d="M4 20c1.5-4 6-5 8-5s6 1 8 5" fill="#CBD5E1"/>
            </svg>
        `;
    }

    createPostElement(post, currentUser) {
        const isLiked = post.likes.includes(currentUser._id);
        const avatarHTML = this.renderAvatar(post.user.username, post.user.profilePicture, 48);
        
        return `
            <article class="glass-card rounded-2xl mb-8 overflow-hidden" data-post-id="${post._id}">
                <div class="flex items-center p-4 gap-4">
                    ${avatarHTML}
                    <div><p class="font-bold">${post.user.username}</p><p class="text-xs text-gray-500">${new Date(post.createdAt).toLocaleString()}</p></div>
                </div>
                <img src="${post.image}" class="w-full h-auto max-h-[600px] object-cover" alt="Post Image">
                <div class="p-4">
                    <div class="flex items-center gap-4 text-2xl mb-2">
                        <button class="like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}"><i class="${isLiked ? 'fas' : 'far'} fa-heart"></i></button>
                        <button class="comment-btn" data-post-id="${post._id}"><i class="far fa-comment"></i></button>
                        <button><i class="far fa-paper-plane"></i></button>
                    </div>
                    <p class="font-bold like-count">${post.likes.length} likes</p>
                    <p class="mt-2"><span class="font-bold mr-2">${post.user.username}</span> ${post.caption || ''}</p>
                    ${post.comments.length > 0 ? `<button class="view-comments-btn text-gray-500 text-sm mt-2 hover:underline" data-post-id="${post._id}">View all ${post.comments.length} comments</button>` : ''}
                    <div class="comments-container mt-4"></div>
                </div>
            </article>`;
    }
    
    createProfileElement(user, posts, canEdit = false) {
        const placeholderAvatar = `https://placehold.co/128x128/E2E8F0/4A5568?text=${user.username.charAt(0)}`;
        return `
            <div class="glass-card rounded-2xl overflow-hidden">
                <div class="profile-cover h-48 md:h-64"></div>
                <div class="p-4 md:p-6 relative">
                    <div class="absolute -top-16 left-6">
                        <img src="${user.profilePicture || placeholderAvatar}" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover profile-picture">
                    </div>
                    ${canEdit ? `<div class=\"flex justify-end\"><button id=\"edit-profile-btn-action\" class=\"bg-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors\">Edit Profile</button></div>` : ''}
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
                ${posts.map(post => {
                    const likesCount = post.likes?.length || 0;
                    const commentsCount = post.comments?.length || 0;
                    return `
                        <div class="relative aspect-square overflow-hidden rounded-lg group cursor-pointer">
                            <img src="${post.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div class="text-white flex gap-4 text-lg font-bold">
                                    <span><i class="fas fa-heart mr-1"></i> ${likesCount}</span>
                                    <span><i class="fas fa-comment mr-1"></i> ${commentsCount}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
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
        this.createModal("Edit Profile", `
            <form id="edit-profile-form">
                <div class="mb-4">
                    <label class="block mb-2 font-semibold">Profile Picture</label>
                    <input type="file" id="edit-picture-input" accept="image/*" class="w-full p-2 border rounded-lg bg-gray-50">
                </div>
                <div class="mb-4">
                    <label class="block mb-2 font-semibold">Name</label>
                    <input type="text" id="edit-name-input" value="${user.name || ''}" class="w-full p-2 border rounded-lg bg-gray-50">
                </div>
                <div class="mb-4">
                    <label class="block mb-2 font-semibold">Bio</label>
                    <textarea id="edit-bio-input" rows="3" class="w-full p-2 border rounded-lg bg-gray-50">${user.bio || ''}</textarea>
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-4 rounded-xl text-lg">Save Changes</button>
            </form>
        `);

        document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const profileData = {
                profilePicture: document.getElementById('edit-picture-input').files[0],
                name: document.getElementById('edit-name-input').value,
                bio: document.getElementById('edit-bio-input').value,
            };
            if (!profileData.profilePicture) delete profileData.profilePicture;
            
            try {
                await api.updateProfile(profileData);
                this.closeModal();
                this.loadProfile();
            } catch (error) {
                alert('Failed to update profile.');
                console.error(error);
            }
        });
    }

    renderSearchModal() {
        this.createModal("Search Users", `
            <div class="relative">
                <input type="text" id="search-input" placeholder="Search for users..." class="w-full p-3 border rounded-lg bg-gray-50 pl-10">
                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
            <div id="search-results" class="mt-4 max-h-64 overflow-y-auto"><p class="text-center text-gray-500">Start typing to find users.</p></div>
        `);

        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value;
            if (query.length < 2) {
                searchResults.innerHTML = '<p class="text-center text-gray-500">Keep typing...</p>';
                return;
            }
            
            searchResults.innerHTML = '<p class="text-center text-gray-500">Searching...</p>';
            try {
                const users = await api.searchUsers(query);
                this.renderSearchResults(users, searchResults);
            } catch (error) {
                searchResults.innerHTML = '<p class="text-center text-red-500">Could not perform search.</p>';
            }
        });
    }
    
    renderSearchResults(users, container) {
        if (users.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">No users found.</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="space-y-3">
                ${users.map(user => {
                    const avatar = this.renderAvatar(user.username, user.profilePicture, 40);
                    return `
                        <div class="search-result-item flex items-center gap-4 p-2 rounded-lg hover:bg-gray-100 cursor-pointer" data-username="${user.username}" data-user-id="${user._id}">
                            ${avatar}
                            <div>
                                <p class="font-bold">${user.username}</p>
                                <p class="text-sm text-gray-500">${user.name || ''}</p>
                            </div>
                            <button class="follow-btn ml-auto bg-blue-500 text-white font-semibold px-3 py-1 rounded-lg text-sm hover:bg-blue-600" data-user-id="${user._id}">Follow</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Open profile on item click (excluding follow button)
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.follow-btn')) return; // ignore when clicking follow
                const username = item.getAttribute('data-username');
                this.closeModal();
                this.loadUserProfileByUsername(username);
            });
        });

        // Follow action
        container.querySelectorAll('.follow-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const userId = button.getAttribute('data-user-id');
                button.disabled = true;
                try {
                    await api.followUser(userId);
                    button.textContent = 'Following';
                    button.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                    button.classList.add('bg-gray-300');
                } catch (error) {
                    console.error('Failed to follow:', error);
                    button.disabled = false;
                }
            });
        });
    }

    async loadUserProfileByUsername(username) {
        // Activate profile section in nav
        this.navLinks.forEach(link => link.classList.toggle('active', link.id === 'profile-btn'));
        Object.values(this.sections).forEach(section => section.classList.add('hidden'));
        const sectionToShow = this.sections.profile;
        sectionToShow.classList.remove('hidden');

        this.sections.profile.innerHTML = '<p class="text-center p-8">Loading profile...</p>';
        try {
            const [currentUser, user] = await Promise.all([
                api.getCurrentUser(),
                api.getUserProfile(username)
            ]);
            const posts = await api.getUserPosts(user._id);
            const canEdit = currentUser && currentUser._id === user._id;
            this.sections.profile.innerHTML = this.createProfileElement(user, posts, canEdit);
            this.initializeProfileInteractions(user, posts);
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.sections.profile.innerHTML = '<p class="text-center p-8 text-red-500">Could not load user profile.</p>';
        }
    }

    createModal(title, content) {
        this.closeModal();
        const modalHTML = `
            <div id="app-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                <div class="glass-card rounded-2xl p-6 w-full max-w-md animate-pop-in">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">${title}</h2>
                        <button id="close-modal-btn" class="text-2xl text-gray-500 hover:text-black">&times;</button>
                    </div>
                    <div>${content}</div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('close-modal-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('app-modal').addEventListener('click', (e) => { if (e.target.id === 'app-modal') this.closeModal(); });
    }

    closeModal() {
        const modal = document.getElementById('app-modal');
        if (modal) modal.remove();
    }

    // --- EVENT LISTENERS & DYNAMIC CONTENT --- //

    initializePostInteractions(container) {
        container.querySelectorAll('.like-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const postId = button.dataset.postId;
                button.classList.toggle('liked');
                const icon = button.querySelector('i');
                icon.classList.toggle('far');
                icon.classList.toggle('fas');

                try {
                    const updatedPost = await api.likePost(postId);
                    const countElement = button.closest('.p-4').querySelector('.like-count');
                    countElement.textContent = `${updatedPost.likes.length} likes`;
                } catch (error) {
                    console.error("Failed to like post:", error);
                    button.classList.toggle('liked');
                    icon.classList.toggle('far');
                    icon.classList.toggle('fas');
                }
            });
        });

        container.querySelectorAll('.view-comments-btn, .comment-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const postId = button.dataset.postId;
                const postElement = document.querySelector(`article[data-post-id="${postId}"]`);
                const commentsContainer = postElement.querySelector('.comments-container');
                
                const isExpanded = commentsContainer.classList.toggle('expanded');

                if (isExpanded && commentsContainer.innerHTML === '') {
                    commentsContainer.innerHTML = `<p class="text-sm text-gray-500">Loading comments...</p>`;
                    try {
                        const post = await api.getPost(postId);
                        commentsContainer.innerHTML = this.createCommentsSection(post.comments);
                        this.attachCommentFormListeners(commentsContainer, postId);
                    } catch (error) {
                        commentsContainer.innerHTML = `<p class="text-sm text-red-500">Could not load comments.</p>`;
                    }
                }
            });
        });
    }
    
    createCommentsSection(comments) {
        const commentsHTML = comments.length > 0 ? comments.map(comment => {
            const placeholderAvatar = `https://placehold.co/40x40/E2E8F0/4A5568?text=${comment.user.username.charAt(0)}`;
            return `
                <div class="flex items-start gap-3 mb-3">
                    <img src="${comment.user.profilePicture || placeholderAvatar}" class="w-8 h-8 rounded-full object-cover mt-1">
                    <div class="bg-gray-100 p-2 rounded-lg w-full">
                        <p class="text-sm"><span class="font-bold">${comment.user.username}</span> ${comment.text}</p>
                    </div>
                </div>`;
        }).join('') : '';

        return `
            <div class="space-y-2 border-t pt-4 mt-4">
                ${commentsHTML}
                <form class="add-comment-form flex gap-2">
                    <input type="text" placeholder="Add a comment..." class="w-full p-2 border rounded-lg bg-gray-50 text-sm">
                    <button type="submit" class="bg-purple-500 text-white font-semibold px-4 rounded-lg text-sm">Post</button>
                </form>
            </div>`;
    }

    attachCommentFormListeners(container, postId) {
        const form = container.querySelector('.add-comment-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = form.querySelector('input[type="text"]');
            const text = input.value.trim();
            if (!text) return;
            form.querySelector('button[type="submit"]').disabled = true;
            try {
                const comments = await api.addComment(postId, text);
                container.innerHTML = this.createCommentsSection(comments);
                this.attachCommentFormListeners(container, postId);
            } catch (error) {
                console.error('Failed to add comment:', error);
                form.querySelector('button[type="submit"]').disabled = false;
            }
        });
    }

    initializeProfileInteractions(user, posts) {
        const editBtn = document.getElementById('edit-profile-btn-action');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.renderEditProfileModal(user);
            });
        }

        const tabs = document.querySelectorAll('.profile-tab');
        const contentArea = document.getElementById('profile-content-area');
        
        const renderPosts = () => {
            if (posts.length > 0) {
                contentArea.innerHTML = `<div class="grid grid-cols-3 gap-1">${posts.map(p => `<div class="aspect-square bg-gray-200"><img src="${p.image}" class="w-full h-full object-cover"></div>`).join('')}</div>`;
            } else {
                contentArea.innerHTML = `<p class="text-center text-gray-500 p-8">No posts yet.</p>`;
            }
        };

        const renderSaved = () => {
            contentArea.innerHTML = `<p class="text-center text-gray-500 p-8">You have no saved posts.</p>`;
        };

        renderPosts();

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.classList.remove('active');
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
