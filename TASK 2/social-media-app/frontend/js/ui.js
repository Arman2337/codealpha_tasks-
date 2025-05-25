class UIHandler {
    constructor() {
        // Navigation elements
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.contentSections = document.querySelectorAll('.content-section');
        this.postsContainer = document.querySelector('.posts-container');
        this.profileSection = document.getElementById('profile-section');
        this.createPostSection = document.getElementById('create-post-section');
        
        // Edit profile elements
        this.editProfileBtn = document.getElementById('edit-profile-btn');
        this.editProfilePictureBtn = document.getElementById('edit-profile-picture-btn');
        this.editProfileModal = document.getElementById('edit-profile-modal');
        this.editProfileForm = document.getElementById('edit-profile-form');
        this.closeModalBtn = document.getElementById('close-modal');
        this.cancelEditBtn = document.getElementById('cancel-edit');
        
        // Create post elements
        this.createPostForm = document.getElementById('create-post-form');

        // Daily engagement features
        this.dailyStreak = 0;
        this.lastActiveDate = null;
        this.achievements = [];
        this.dailyChallenge = null;

        this.initializeEventListeners();
        this.initializeApp();
    }

    initializeEventListeners() {
        // Navigation
        this.navButtons.forEach(button => {
            button.addEventListener('click', () => this.handleNavigation(button.id));
        });

        // Edit profile
        this.editProfileBtn.addEventListener('click', () => this.openEditProfileModal());
        this.editProfilePictureBtn.addEventListener('click', () => this.openEditProfileModal());
        this.closeModalBtn.addEventListener('click', () => this.closeEditProfileModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeEditProfileModal());
        this.editProfileForm.addEventListener('submit', (e) => this.handleEditProfile(e));

        // Create post
        this.createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));

        // Image preview handlers
        this.initializeImagePreviews();

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.editProfileModal) {
                this.closeEditProfileModal();
            }
        });

        // App initialization
        window.addEventListener('app:initialized', () => this.initializeApp());
    }

    initializeImagePreviews() {
        const imageInputs = document.querySelectorAll('input[type="file"]');
        imageInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleImagePreview(e));
        });
    }

    handleImagePreview(event) {
        const file = event.target.files[0];
        const previewContainer = event.target.parentElement.querySelector('.image-preview');
        
        if (file) {
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, or GIF)');
                event.target.value = '';
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                alert('File size must be less than 5MB');
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.innerHTML = '';
        }
    }

    openEditProfileModal() {
        // Get current user data
        const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
        
        // Populate form fields
        document.getElementById('edit-name').value = user.name || '';
        document.getElementById('edit-username').value = user.username || '';
        document.getElementById('edit-bio').value = user.bio || '';
        document.getElementById('edit-email').value = user.email || '';
        
        // Show modal
        this.editProfileModal.classList.remove('hidden');
    }

    closeEditProfileModal() {
        this.editProfileModal.classList.add('hidden');
        this.editProfileForm.reset();
        this.editProfileForm.querySelector('.image-preview').innerHTML = '';
    }

    async handleEditProfile(event) {
        event.preventDefault();
        
        const submitButton = this.editProfileForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';

            // Create FormData object for file upload
            const formData = new FormData();
            formData.append('name', document.getElementById('edit-name').value);
            formData.append('username', document.getElementById('edit-username').value);
            formData.append('bio', document.getElementById('edit-bio').value);
            formData.append('email', document.getElementById('edit-email').value);
            
            const profilePicture = document.getElementById('edit-profile-picture').files[0];
            if (profilePicture) {
                formData.append('profilePicture', profilePicture);
            }

            // Update profile
            const updatedUser = await api.updateProfile(formData);
            
            // Update local storage
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
            
            // Update UI
            this.renderProfile(updatedUser);
            
            // Close modal
            this.closeEditProfileModal();
            
            // Show success message
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.message || 'Error updating profile');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    async handleNavigation(buttonId) {
        // Update active nav button
        this.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.id === buttonId);
        });

        // Show corresponding section
        this.contentSections.forEach(section => {
            section.classList.remove('active');
        });

        switch (buttonId) {
            case 'home-btn':
                document.getElementById('feed-section').classList.add('active');
                await this.loadFeed();
                break;
            case 'profile-btn':
                this.profileSection.classList.add('active');
                await this.loadProfile();
                break;
            case 'create-post-btn':
                this.createPostSection.classList.add('active');
                break;
            case 'explore-btn':
                document.getElementById('explore-section').classList.add('active');
                await this.loadExplore();
                break;
            case 'activity-btn':
                document.getElementById('activity-section').classList.add('active');
                await this.loadActivity();
                break;
        }
    }

    async handleCreatePost(event) {
        event.preventDefault();
        const imageInput = document.getElementById('post-image');
        const captionInput = document.getElementById('post-caption');

        if (!imageInput.files[0]) {
            alert('Please select an image');
            return;
        }

        try {
            const submitButton = this.createPostForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Sharing...';

            await api.createPost({
                image: imageInput.files[0],
                caption: captionInput.value,
                allowComments: document.getElementById('allow-comments').checked,
                showLikes: document.getElementById('show-likes').checked
            });

            // Reset form and preview
            this.createPostForm.reset();
            this.createPostForm.querySelector('.image-preview').innerHTML = '';
            
            // Show feed with new post
            this.handleNavigation('home-btn');

            // Check if this completes the daily challenge
            if (this.dailyChallenge && this.dailyChallenge.type === 'post') {
                await this.completeDailyChallenge();
            }

            // Check for achievements
            await this.checkAndAwardAchievements('post');

        } catch (error) {
            alert(error.message || 'Error creating post');
        } finally {
            const submitButton = this.createPostForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Share';
        }
    }

    async loadFeed() {
        try {
            this.postsContainer.innerHTML = '<div class="loading">Loading feed...</div>';
            const posts = await api.getFeed();
            this.renderPosts(posts, this.postsContainer);
        } catch (error) {
            console.error('Error loading feed:', error);
            this.postsContainer.innerHTML = '<p class="error">Error loading feed</p>';
        }
    }

    async loadProfile() {
        try {
            const user = await api.getCurrentUser();
            this.renderProfile(user);
            const posts = await api.getUserPosts(user._id);
            this.renderPosts(posts, this.profileSection.querySelector('.profile-posts-grid'));
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    async loadExplore() {
        try {
            const exploreSection = document.getElementById('explore-section');
            exploreSection.innerHTML = '<div class="loading">Loading explore content...</div>';
            const posts = await api.getExplorePosts();
            this.renderExploreGrid(posts, exploreSection.querySelector('.explore-grid'));
        } catch (error) {
            console.error('Error loading explore:', error);
        }
    }

    async loadActivity() {
        try {
            const activitySection = document.getElementById('activity-section');
            activitySection.innerHTML = '<div class="loading">Loading activity...</div>';
            const activities = await api.getActivity();
            this.renderActivity(activities, activitySection.querySelector('.activity-feed'));
        } catch (error) {
            console.error('Error loading activity:', error);
        }
    }

    renderProfile(user) {
        // Update profile header with a more unique design
        const profileHeader = document.querySelector('.profile-header');
        profileHeader.innerHTML = `
            <div class="profile-cover"></div>
            <div class="profile-info">
                <div class="profile-picture-container">
                    <img src="${user.profilePicture || DEFAULT_PROFILE_PICTURE}" 
                         alt="${user.username}" 
                         id="profile-picture"
                         class="profile-picture">
                    <button id="edit-profile-picture-btn" class="edit-picture-btn">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>
                <div class="profile-details">
                    <h2 id="profile-username">${user.username}</h2>
                    <h3 id="profile-name">${user.name || ''}</h3>
                    <p id="profile-bio" class="profile-bio">${user.bio || 'No bio yet'}</p>
                    <div class="profile-stats">
                        <div class="stat-item">
                            <span id="posts-count" class="stat-value">${user.posts?.length || 0}</span>
                            <span class="stat-label">Posts</span>
                        </div>
                        <div class="stat-item">
                            <span id="followers-count" class="stat-value">${user.followers.length}</span>
                            <span class="stat-label">Followers</span>
                        </div>
                        <div class="stat-item">
                            <span id="following-count" class="stat-value">${user.following.length}</span>
                            <span class="stat-label">Following</span>
                        </div>
                    </div>
                    <button id="edit-profile-btn" class="btn btn-primary">Edit Profile</button>
                </div>
            </div>
        `;

        // Reattach event listeners
        document.getElementById('edit-profile-btn').addEventListener('click', () => this.openEditProfileModal());
        document.getElementById('edit-profile-picture-btn').addEventListener('click', () => this.openEditProfileModal());
    }

    renderPosts(posts, container) {
        if (!posts.length) {
            container.innerHTML = '<p class="no-posts">No posts yet</p>';
            return;
        }

        container.innerHTML = posts.map(post => this.createPostElement(post)).join('');
        this.initializePostInteractions(container);
    }

    renderExploreGrid(posts, container) {
        if (!posts.length) {
            container.innerHTML = '<p class="no-posts">No posts to explore</p>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="explore-item" data-post-id="${post._id}">
                <img src="${post.image}" alt="Post">
                <div class="explore-item-overlay">
                    <div class="explore-item-stats">
                        <span><i class="fas fa-heart"></i> ${post.likes.length}</span>
                        <span><i class="fas fa-comment"></i> ${post.comments.length}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers for explore items
        container.querySelectorAll('.explore-item').forEach(item => {
            item.addEventListener('click', () => this.openPostModal(item.dataset.postId));
        });
    }

    renderActivity(activities, container) {
        if (!activities.length) {
            container.innerHTML = '<p class="no-activity">No recent activity</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <img src="${activity.user.profilePicture || DEFAULT_PROFILE_PICTURE}" alt="${activity.user.username}">
                <div class="activity-content">
                    <p>
                        <strong>${activity.user.username}</strong>
                        ${activity.type === 'like' ? 'liked your post' :
                          activity.type === 'comment' ? 'commented on your post' :
                          activity.type === 'follow' ? 'started following you' : ''}
                    </p>
                    <small>${new Date(activity.createdAt).toLocaleString()}</small>
                </div>
                ${activity.post ? `<img src="${activity.post.image}" alt="Post" class="activity-post-preview">` : ''}
            </div>
        `).join('');
    }

    createPostElement(post) {
        const isLiked = post.likes.includes(JSON.parse(localStorage.getItem(STORAGE_KEYS.user))._id);
        const isOwner = post.user._id === JSON.parse(localStorage.getItem(STORAGE_KEYS.user))._id;

        return `
            <div class="post" data-post-id="${post._id}">
                <div class="post-header">
                    <img src="${post.user.profilePicture || DEFAULT_PROFILE_PICTURE}" alt="${post.user.username}">
                    <div class="post-user-info">
                        <h3>${post.user.username}</h3>
                        <small>${new Date(post.createdAt).toLocaleDateString()}</small>
                    </div>
                    ${isOwner ? `
                        <button class="btn btn-secondary delete-post" data-post-id="${post._id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="post-content">
                    ${post.caption ? `<p>${post.caption}</p>` : ''}
                    <img src="${post.image}" alt="Post image" class="post-image">
                </div>
                <div class="post-actions">
                    <button class="post-action like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
                        <i class="fas fa-heart"></i>
                        <span class="like-count">${post.likes.length}</span>
                    </button>
                    <button class="post-action comment-btn" data-post-id="${post._id}">
                        <i class="fas fa-comment"></i>
                        <span class="comment-count">${post.comments.length}</span>
                    </button>
                    <button class="post-action share-btn" data-post-id="${post._id}">
                        <i class="fas fa-share"></i>
                    </button>
                    <button class="post-action save-btn" data-post-id="${post._id}">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
                <div class="post-comments">
                    ${this.renderComments(post.comments)}
                    <form class="comment-form" data-post-id="${post._id}">
                        <input type="text" placeholder="Add a comment..." required>
                        <button type="submit">Post</button>
                    </form>
                </div>
            </div>
        `;
    }

    renderComments(comments) {
        if (!comments.length) return '';
        
        return `
            <div class="comments-list">
                ${comments.map(comment => `
                    <div class="comment" data-comment-id="${comment._id}">
                        <img src="${comment.user.profilePicture || DEFAULT_PROFILE_PICTURE}" alt="${comment.user.username}">
                        <div class="comment-content">
                            <strong>${comment.user.username}</strong>
                            <p>${comment.text}</p>
                        </div>
                        ${comment.user._id === JSON.parse(localStorage.getItem(STORAGE_KEYS.user))._id ? `
                            <button class="delete-comment" data-comment-id="${comment._id}">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    initializePostInteractions(container) {
        // Like buttons
        container.querySelectorAll('.like-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.currentTarget.dataset.postId;
                try {
                    const result = await this.handleLikePost(postId);
                    const likeCount = button.querySelector('.like-count');
                    likeCount.textContent = result.likeCount;
                    button.classList.toggle('liked');
                } catch (error) {
                    console.error('Error liking post:', error);
                }
            });
        });

        // Comment forms
        container.querySelectorAll('.comment-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const postId = e.currentTarget.dataset.postId;
                const input = e.currentTarget.querySelector('input');
                const text = input.value;

                try {
                    const comments = await this.handleAddComment(postId, text);
                    const postElement = e.currentTarget.closest('.post');
                    const commentsList = postElement ? postElement.querySelector('.comments-list') : null;
                    if (commentsList) {
                        commentsList.innerHTML = this.renderComments(comments);
                    }
                    input.value = '';
                } catch (error) {
                    console.error('Error adding comment:', error);
                }
            });
        });

        // Delete post buttons
        container.querySelectorAll('.delete-post').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this post?')) {
                    const postId = e.currentTarget.dataset.postId;
                    try {
                        await api.deletePost(postId);
                        e.currentTarget.closest('.post').remove();
                    } catch (error) {
                        console.error('Error deleting post:', error);
                    }
                }
            });
        });

        // Delete comment buttons
        container.querySelectorAll('.delete-comment').forEach(button => {
            button.addEventListener('click', async (e) => {
                const commentId = e.currentTarget.dataset.commentId;
                const postId = e.currentTarget.closest('.post').dataset.postId;
                try {
                    await api.deleteComment(postId, commentId);
                    e.currentTarget.closest('.comment').remove();
                } catch (error) {
                    console.error('Error deleting comment:', error);
                }
            });
        });

        // Share buttons
        container.querySelectorAll('.share-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.currentTarget.dataset.postId;
                const postUrl = `${window.location.origin}/post/${postId}`;
                navigator.clipboard.writeText(postUrl).then(() => {
                    alert('Post link copied to clipboard!');
                }).catch(() => {
                    alert('Error copying link. Please try again.');
                });
            });
        });

        // Save buttons
        container.querySelectorAll('.save-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.currentTarget.dataset.postId;
                try {
                    await api.toggleSavePost(postId);
                    button.classList.toggle('saved');
                } catch (error) {
                    console.error('Error saving post:', error);
                }
            });
        });
    }

    async openPostModal(postId) {
        try {
            const post = await api.getPost(postId);
            const modal = document.getElementById('post-modal');
            const container = modal.querySelector('.post-modal-container');
            
            container.innerHTML = this.createPostElement(post);
            this.initializePostInteractions(container);
            
            modal.classList.remove('hidden');
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
            
            // Close modal when clicking close button
            document.getElementById('close-post-modal').addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        } catch (error) {
            console.error('Error opening post modal:', error);
        }
    }

    async initializeApp() {
        // Load initial feed
        await this.loadFeed();
    }

    async initializeDailyFeatures() {
        // Check and update daily streak
        this.checkDailyStreak();
        
        // Load or create daily challenge
        await this.loadDailyChallenge();
        
        // Load user achievements
        await this.loadAchievements();
        
        // Update UI with daily features
        this.updateDailyFeaturesUI();
    }

    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastActive = localStorage.getItem('lastActiveDate');
        
        if (lastActive === today) {
            return; // Already active today
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastActive === yesterdayStr) {
            this.dailyStreak = parseInt(localStorage.getItem('dailyStreak') || '0') + 1;
        } else {
            this.dailyStreak = 1;
        }
        
        localStorage.setItem('dailyStreak', this.dailyStreak.toString());
        localStorage.setItem('lastActiveDate', today);
    }

    async loadDailyChallenge() {
        const challenges = [
            { type: 'post', description: 'Share a photo of your day', points: 10 },
            { type: 'comment', description: 'Comment on 3 posts', points: 5 },
            { type: 'like', description: 'Like 5 posts', points: 3 },
            { type: 'follow', description: 'Follow 2 new users', points: 7 }
        ];
        
        // Get today's challenge based on date
        const today = new Date().getDate();
        this.dailyChallenge = challenges[today % challenges.length];
        
        // Check if challenge is completed
        const completedChallenges = JSON.parse(localStorage.getItem('completedChallenges') || '[]');
        const todayStr = new Date().toDateString();
        
        if (completedChallenges.includes(todayStr)) {
            this.dailyChallenge.completed = true;
        }
    }

    async loadAchievements() {
        const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
        if (!user) return;

        const achievements = [
            { id: 'first_post', title: 'First Post', description: 'Share your first post', icon: '📸' },
            { id: 'social_butterfly', title: 'Social Butterfly', description: 'Get 10 followers', icon: '🦋' },
            { id: 'popular', title: 'Popular', description: 'Get 50 likes on a post', icon: '⭐' },
            { id: 'streak_3', title: '3 Day Streak', description: 'Use the app for 3 days in a row', icon: '🔥' },
            { id: 'streak_7', title: '7 Day Streak', description: 'Use the app for 7 days in a row', icon: '🌟' }
        ];

        // Check which achievements are unlocked
        this.achievements = achievements.map(achievement => {
            const unlocked = this.checkAchievementUnlocked(achievement, user);
            return { ...achievement, unlocked };
        });
    }

    checkAchievementUnlocked(achievement, user) {
        switch (achievement.id) {
            case 'first_post':
                return user.posts && user.posts.length > 0;
            case 'social_butterfly':
                return user.followers && user.followers.length >= 10;
            case 'popular':
                return user.posts && user.posts.some(post => post.likes.length >= 50);
            case 'streak_3':
                return this.dailyStreak >= 3;
            case 'streak_7':
                return this.dailyStreak >= 7;
            default:
                return false;
        }
    }

    updateDailyFeaturesUI() {
        // Add daily features to the feed section
        const feedSection = document.getElementById('feed-section');
        const dailyFeaturesHTML = `
            <div class="daily-features">
                <div class="streak-badge">
                    <i class="fas fa-fire"></i>
                    <span>${this.dailyStreak} Day Streak</span>
                </div>
                
                ${this.dailyChallenge && !this.dailyChallenge.completed ? `
                    <div class="daily-challenge">
                        <h3>Daily Challenge</h3>
                        <p>${this.dailyChallenge.description}</p>
                        <div class="challenge-progress">
                            <div class="progress-bar" style="width: 0%"></div>
                        </div>
                        <small>+${this.dailyChallenge.points} points</small>
                    </div>
                ` : ''}
                
                <div class="achievement-badges">
                    ${this.achievements.map(achievement => `
                        <div class="badge ${achievement.unlocked ? 'unlocked' : 'locked'}">
                            <span>${achievement.icon}</span>
                            <span>${achievement.title}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Insert daily features at the top of the feed
        const feedContent = feedSection.querySelector('.posts-container');
        if (feedContent) {
            feedContent.insertAdjacentHTML('beforebegin', dailyFeaturesHTML);
        }
    }

    async handleLikePost(postId) {
        try {
            const result = await api.likePost(postId);
            
            // Check if this completes the daily challenge
            if (this.dailyChallenge && this.dailyChallenge.type === 'like') {
                const likeCount = parseInt(localStorage.getItem('dailyLikes') || '0') + 1;
                localStorage.setItem('dailyLikes', likeCount.toString());
                
                if (likeCount >= 5) {
                    await this.completeDailyChallenge();
                }
            }

            return result;
        } catch (error) {
            console.error('Error liking post:', error);
            throw error;
        }
    }

    async handleAddComment(postId, text) {
        try {
            const comments = await api.addComment(postId, text);
            
            // Check if this completes the daily challenge
            if (this.dailyChallenge && this.dailyChallenge.type === 'comment') {
                const commentCount = parseInt(localStorage.getItem('dailyComments') || '0') + 1;
                localStorage.setItem('dailyComments', commentCount.toString());
                
                if (commentCount >= 3) {
                    await this.completeDailyChallenge();
                }
            }

            return comments;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    async completeDailyChallenge() {
        const today = new Date().toDateString();
        const completedChallenges = JSON.parse(localStorage.getItem('completedChallenges') || '[]');
        
        if (!completedChallenges.includes(today)) {
            completedChallenges.push(today);
            localStorage.setItem('completedChallenges', JSON.stringify(completedChallenges));
            
            // Update user points
            const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
            user.points = (user.points || 0) + this.dailyChallenge.points;
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
            
            // Show celebration
            this.showCelebration(`Daily Challenge Completed! +${this.dailyChallenge.points} points`);
            
            // Update UI
            this.dailyChallenge.completed = true;
            this.updateDailyFeaturesUI();
        }
    }

    async checkAndAwardAchievements(action) {
        const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
        const newAchievements = [];

        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && this.checkAchievementUnlocked(achievement, user)) {
                achievement.unlocked = true;
                newAchievements.push(achievement);
            }
        });

        if (newAchievements.length > 0) {
            // Show celebration for each new achievement
            newAchievements.forEach(achievement => {
                this.showCelebration(`Achievement Unlocked: ${achievement.title}!`);
            });

            // Update UI
            this.updateDailyFeaturesUI();
        }
    }

    showCelebration(message) {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <h3>🎉 ${message}</h3>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Remove celebration after animation
        setTimeout(() => {
            celebration.remove();
        }, 3000);
    }
}

// Add celebration styles to CSS
const style = document.createElement('style');
style.textContent = `
    .celebration {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--gradient-success);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        animation: slideDown 0.5s ease, fadeOut 0.5s ease 2.5s forwards;
    }

    @keyframes slideDown {
        from { transform: translate(-50%, -100%); }
        to { transform: translate(-50%, 0); }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    .daily-features {
        margin-bottom: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .badge.locked {
        opacity: 0.5;
        filter: grayscale(1);
    }

    .badge.unlocked {
        animation: popIn 0.5s ease;
    }

    @keyframes popIn {
        0% { transform: scale(0.8); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize UI handler
const uiHandler = new UIHandler(); 