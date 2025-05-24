class UIHandler {
    constructor() {
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.contentSections = document.querySelectorAll('.content-section');
        this.postsContainer = document.querySelector('.posts-container');
        this.profileSection = document.getElementById('profile-section');
        this.createPostSection = document.getElementById('create-post-section');
        this.editProfileModal = document.getElementById('edit-profile-modal');
        this.createPostForm = document.getElementById('create-post-form');
        this.editProfileForm = document.getElementById('edit-profile-form');

        this.initializeEventListeners();
        this.initializeApp();
    }

    initializeEventListeners() {
        // Navigation
        this.navButtons.forEach(button => {
            button.addEventListener('click', () => this.handleNavigation(button.id));
        });

        // Create post form
        this.createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
        
        // Edit profile form
        this.editProfileForm.addEventListener('submit', (e) => this.handleEditProfile(e));
        
        // Close modal
        document.getElementById('close-modal').addEventListener('click', () => {
            this.editProfileModal.classList.add('hidden');
        });

        // Image preview handlers
        this.initializeImagePreviews();

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
            await api.createPost({
                image: imageInput.files[0],
                caption: captionInput.value
            });

            // Reset form and preview
            this.createPostForm.reset();
            this.createPostForm.querySelector('.image-preview').innerHTML = '';
            
            // Show feed with new post
            this.handleNavigation('home-btn');
        } catch (error) {
            alert(error.message);
        }
    }

    async handleEditProfile(event) {
        event.preventDefault();
        const bioInput = document.getElementById('edit-bio');
        const pictureInput = document.getElementById('edit-profile-picture');

        try {
            await api.updateProfile({
                bio: bioInput.value,
                profilePicture: pictureInput.files[0]
            });

            // Reset form and close modal
            this.editProfileForm.reset();
            this.editProfileForm.querySelector('.image-preview').innerHTML = '';
            this.editProfileModal.classList.add('hidden');

            // Reload profile
            await this.loadProfile();
        } catch (error) {
            alert(error.message);
        }
    }

    async loadFeed() {
        try {
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
            this.renderPosts(posts, this.profileSection.querySelector('.profile-posts'));
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    renderProfile(user) {
        document.getElementById('profile-username').textContent = user.username;
        document.getElementById('profile-bio').textContent = user.bio || 'No bio yet';
        document.getElementById('profile-picture').src = user.profilePicture || DEFAULT_PROFILE_PICTURE;
        document.getElementById('followers-count').textContent = `${user.followers.length} followers`;
        document.getElementById('following-count').textContent = `${user.following.length} following`;
        document.getElementById('edit-bio').value = user.bio || '';
    }

    renderPosts(posts, container) {
        if (!posts.length) {
            container.innerHTML = '<p class="no-posts">No posts yet</p>';
            return;
        }

        container.innerHTML = posts.map(post => this.createPostElement(post)).join('');
        this.initializePostInteractions(container);
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
                    <img src="${post.image}" alt="Post image">
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
                    const result = await api.likePost(postId);
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
                    const comments = await api.addComment(postId, text);
                    const commentsList = e.currentTarget.parentElement.querySelector('.comments-list');
                    commentsList.innerHTML = this.renderComments(comments);
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
    }

    async initializeApp() {
        // Load initial feed
        await this.loadFeed();
    }
}

// Initialize UI handler
const uiHandler = new UIHandler(); 