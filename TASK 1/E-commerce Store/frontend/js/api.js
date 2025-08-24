// frontend/js/api.js
const API_BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Something went wrong');
        }
        // For DELETE requests with no content, response.json() will fail.
        if (method === 'DELETE') {
            return { message: 'Deleted successfully' };
        }
        return response.json();
    } catch (error) {
        console.error(`API Error (${method} ${endpoint}):`, error);
        throw error;
    }
}

export const api = {
    get: (endpoint) => request(endpoint, 'GET'),
    post: (endpoint, data) => request(endpoint, 'POST', data),
    put: (endpoint, data) => request(endpoint, 'PUT', data),
    del: (endpoint) => request(endpoint, 'DELETE'),
};