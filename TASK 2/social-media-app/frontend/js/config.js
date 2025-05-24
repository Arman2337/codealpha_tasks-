const API_BASE_URL = 'http://localhost:5000/api';

const API_ENDPOINTS = {
    // Auth endpoints
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,

    // User endpoints
    userProfile: (username) => `${API_BASE_URL}/users/${username}`,
    updateProfile: `${API_BASE_URL}/users/profile`,
    followUser: (userId) => `${API_BASE_URL}/users/follow/${userId}`,
    unfollowUser: (userId) => `${API_BASE_URL}/users/unfollow/${userId}`,
    userFollowers: (userId) => `${API_BASE_URL}/users/${userId}/followers`,
    userFollowing: (userId) => `${API_BASE_URL}/users/${userId}/following`,

    // Post endpoints
    createPost: `${API_BASE_URL}/posts`,
    feed: `${API_BASE_URL}/posts/feed`,
    userPosts: (userId) => `${API_BASE_URL}/posts/user/${userId}`,
    singlePost: (postId) => `${API_BASE_URL}/posts/${postId}`,
    deletePost: (postId) => `${API_BASE_URL}/posts/${postId}`,
    likePost: (postId) => `${API_BASE_URL}/posts/${postId}/like`,
    addComment: (postId) => `${API_BASE_URL}/posts/${postId}/comments`,
    deleteComment: (postId, commentId) => `${API_BASE_URL}/posts/${postId}/comments/${commentId}`
};

// Local storage keys
const STORAGE_KEYS = {
    token: 'social_media_token',
    user: 'social_media_user'
};

// Default profile picture
const DEFAULT_PROFILE_PICTURE = 'images/default-profile.png';

// Maximum file size for uploads (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types for uploads
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif']; 