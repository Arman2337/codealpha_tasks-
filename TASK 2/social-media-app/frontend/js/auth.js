class AuthHandler {
    constructor() {
        this.authContainer = document.getElementById('auth-container');
        this.appContainer = document.getElementById('app-container');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.logoutButton = document.getElementById('logout-btn');

        this.initializeEventListeners();
        this.checkAuthState();
    }

    initializeEventListeners() {
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        this.logoutButton.addEventListener('click', () => this.handleLogout());
    }

    switchTab(tabName) {
        // Update active tab button
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        // Show active form
        this.loginForm.classList.toggle('active', tabName === 'login');
        this.registerForm.classList.toggle('active', tabName === 'register');
    }

    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = this.loginForm.querySelector('.error-message');

        try {
            errorElement.textContent = '';
            const data = await api.login({ email, password });
            this.showApp();
        } catch (error) {
            errorElement.textContent = error.message;
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorElement = this.registerForm.querySelector('.error-message');

        try {
            errorElement.textContent = '';
            const data = await api.register({ username, email, password });
            this.showApp();
        } catch (error) {
            errorElement.textContent = error.message;
        }
    }

    async handleLogout() {
        try {
            await api.logout();
            this.showAuth();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async checkAuthState() {
        const token = localStorage.getItem(STORAGE_KEYS.token);
        if (token) {
            try {
                await api.getCurrentUser();
                this.showApp();
            } catch (error) {
                console.error('Auth check error:', error);
                this.showAuth();
            }
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        this.authContainer.classList.remove('hidden');
        this.appContainer.classList.add('hidden');
        this.clearForms();
    }

    showApp() {
        this.authContainer.classList.add('hidden');
        this.appContainer.classList.remove('hidden');
        // Trigger app initialization
        window.dispatchEvent(new CustomEvent('app:initialized'));
    }

    clearForms() {
        this.loginForm.reset();
        this.registerForm.reset();
        this.loginForm.querySelector('.error-message').textContent = '';
        this.registerForm.querySelector('.error-message').textContent = '';
    }
}

// Initialize auth handler
const authHandler = new AuthHandler(); 