class AuthHandler {
    constructor() {
        this.authContainer = document.getElementById('auth-container');
        this.appContainer = document.getElementById('app-container');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.tabButtons = document.querySelectorAll('#auth-container .tab-btn');
        
        // We will find the logout button later, inside the UI handler.
        // this.logoutButton = document.getElementById('logout-btn'); // This was the problem line

        this.initializeEventListeners();
        this.checkAuthState();
    }

    initializeEventListeners() {
        // Tab switching for Login/Register
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Form submissions
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // The logout button listener will now be handled by ui.js
        // if (this.logoutButton) {
        //     this.logoutButton.addEventListener('click', () => this.handleLogout());
        // }
    }

    switchTab(tabName) {
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        if (this.loginForm) {
            this.loginForm.classList.toggle('hidden', tabName !== 'login');
            this.loginForm.classList.toggle('active', tabName === 'login');
        }
        if (this.registerForm) {
            this.registerForm.classList.toggle('hidden', tabName !== 'register');
            this.registerForm.classList.toggle('active', tabName === 'register');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = this.loginForm.querySelector('.error-message');

        try {
            errorElement.textContent = '';
            await api.login({ email, password });
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
            await api.register({ username, email, password });
            this.showApp();
        } catch (error) {
            errorElement.textContent = error.message;
        }
    }

    async handleLogout() {
        try {
            await api.logout();
            // Instead of showing auth, we just reload the page for a clean state
            window.location.reload();
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
    }

    // This function is now in ui.js, but we keep a reference here
    showApp() {
        this.authContainer.classList.add('hidden');
        this.appContainer.classList.remove('hidden');
        
        // Initialize the main UI
        window.ui = new UIHandler();
        // Load the initial feed
        window.ui.handleNavigation('home-btn');
    }
}

// Initialize the app once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authHandler = new AuthHandler();
});


// After you replace the code in `auth.js`, all the errors will be gone, and your application will run smooth