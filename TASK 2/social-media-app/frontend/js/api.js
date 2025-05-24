class ApiService {
    constructor() {
        this.token = localStorage.getItem(STORAGE_KEYS.token);
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
        return this.fetch(API_ENDPOINTS.me);
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

        return response.json();
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

        return response.json();
    }

    async getFeed() {
        return this.fetch(API_ENDPOINTS.feed);
    }

    async getUserPosts(userId) {
        return this.fetch(API_ENDPOINTS.userPosts(userId));
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
}

// Create and export a single instance
const api = new ApiService(); 