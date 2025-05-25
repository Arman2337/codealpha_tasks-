class ApiService {
    constructor() {
        this.token = localStorage.getItem(STORAGE_KEYS.token);
        this.baseUrl = API_BASE_URL.replace('/api', ''); // Remove /api to get base URL
    }

    // Helper method to set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem(STORAGE_KEYS.token, token);
    }

    // Helper method to clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
    }

    // Helper method to get headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Helper method to handle fetch requests
    async fetch(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: this.getHeaders(options.includeAuth !== false)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth API methods
    async register(userData) {
        const data = await this.fetch(API_ENDPOINTS.register, {
            method: 'POST',
            body: JSON.stringify(userData),
            includeAuth: false
        });
        this.setToken(data.token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
        return data;
    }

    async login(credentials) {
        const data = await this.fetch(API_ENDPOINTS.login, {
            method: 'POST',
            body: JSON.stringify(credentials),
            includeAuth: false
        });
        this.setToken(data.token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
        return data;
    }

    async logout() {
        await this.fetch(API_ENDPOINTS.logout, { method: 'POST' });
        this.clearToken();
    }

    async getCurrentUser() {
        const user = await this.fetch(API_ENDPOINTS.me);
        return {
            ...user,
            profilePicture: this.transformImageUrl(user.profilePicture)
        };
    }

    // User API methods
    async getUserProfile(username) {
        return this.fetch(API_ENDPOINTS.userProfile(username));
    }

    async updateProfile(profileData) {
        const formData = new FormData();
        
        if (profileData.bio) {
            formData.append('bio', profileData.bio);
        }
        
        if (profileData.profilePicture) {
            formData.append('profilePicture', profileData.profilePicture);
        }

        const response = await fetch(API_ENDPOINTS.updateProfile, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Error updating profile');
        }

        const data = await response.json();
        // Transform image URL in response
        if (data.profilePicture) {
            data.profilePicture = this.transformImageUrl(data.profilePicture);
        }
        return data;
    }

    async followUser(userId) {
        return this.fetch(API_ENDPOINTS.followUser(userId), {
            method: 'POST'
        });
    }

    async unfollowUser(userId) {
        return this.fetch(API_ENDPOINTS.unfollowUser(userId), {
            method: 'POST'
        });
    }

    async getUserFollowers(userId) {
        return this.fetch(API_ENDPOINTS.userFollowers(userId));
    }

    async getUserFollowing(userId) {
        return this.fetch(API_ENDPOINTS.userFollowing(userId));
    }

    // Post API methods
    async createPost(postData) {
        const formData = new FormData();
        formData.append('image', postData.image);
        if (postData.caption) {
            formData.append('caption', postData.caption);
        }

        const response = await fetch(API_ENDPOINTS.createPost, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Error creating post');
        }

        const data = await response.json();
        // Transform image URL in response
        if (data.image) {
            data.image = this.transformImageUrl(data.image);
        }
        return data;
    }

    async getFeed() {
        const posts = await this.fetch(API_ENDPOINTS.feed);
        return posts.map(post => ({
            ...post,
            image: this.transformImageUrl(post.image),
            user: {
                ...post.user,
                profilePicture: this.transformImageUrl(post.user.profilePicture)
            },
            comments: post.comments.map(comment => ({
                ...comment,
                user: {
                    ...comment.user,
                    profilePicture: this.transformImageUrl(comment.user.profilePicture)
                }
            }))
        }));
    }

    async getExplorePosts() {
        // For now, just return all posts (same as feed)
        return this.getFeed();
    }

    async getUserPosts(userId) {
        const posts = await this.fetch(API_ENDPOINTS.userPosts(userId));
        return posts.map(post => ({
            ...post,
            image: this.transformImageUrl(post.image),
            user: {
                ...post.user,
                profilePicture: this.transformImageUrl(post.user.profilePicture)
            },
            comments: post.comments.map(comment => ({
                ...comment,
                user: {
                    ...comment.user,
                    profilePicture: this.transformImageUrl(comment.user.profilePicture)
                }
            }))
        }));
    }

    async getPost(postId) {
        return this.fetch(API_ENDPOINTS.singlePost(postId));
    }

    async deletePost(postId) {
        return this.fetch(API_ENDPOINTS.deletePost(postId), {
            method: 'DELETE'
        });
    }

    async likePost(postId) {
        return this.fetch(API_ENDPOINTS.likePost(postId), {
            method: 'POST'
        });
    }

    async addComment(postId, text) {
        return this.fetch(API_ENDPOINTS.addComment(postId), {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }

    async deleteComment(postId, commentId) {
        return this.fetch(API_ENDPOINTS.deleteComment(postId, commentId), {
            method: 'DELETE'
        });
    }

    // Add this method for activity
    async getActivity() {
        // Placeholder: Return empty array as there is no backend endpoint yet
        console.log('Fetching activity data (placeholder)');
        return [];
    }

    // Helper method to transform image URLs
    transformImageUrl(url) {
        if (!url) return DEFAULT_PROFILE_PICTURE;
        if (url.startsWith('http')) return url;
        return `${this.baseUrl}/${url}`;
    }
}

// Create and export a single instance
const api = new ApiService(); 