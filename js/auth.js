// auth.js – управление аутентификацией

const authService = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),

    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (data.success) {
                this.token = data.tokens.accessToken;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true, user: this.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Ошибка сети' };
        }
    },

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    },

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    },

    isAuthenticated() {
        return !!this.token;
    },

    isAdmin() {
        return this.user && (this.user.role === 'admin' || this.user.role === 'manager');
    }
};

// Обработка формы входа (login.html)
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const button = document.querySelector('#loginForm button[type="submit"]');
        const messageEl = document.getElementById('message');

        button.disabled = true;
        button.textContent = 'Вход...';
        messageEl.textContent = '';

        const result = await authService.login(email, password);

        if (result.success) {
            // Перенаправляем в зависимости от роли
            if (result.user.role === 'admin' || result.user.role === 'manager') {
                window.location.href = '/admin-dashboard';
            } else {
                window.location.href = '/profile';
            }
        } else {
            messageEl.textContent = result.error || 'Ошибка входа';
            button.disabled = false;
            button.textContent = 'Войти';
        }
    });
}

// Обработка формы регистрации (register.html)
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const button = document.querySelector('#registerForm button[type="submit"]');
        const messageEl = document.getElementById('message');

        button.disabled = true;
        button.textContent = 'Регистрация...';
        messageEl.textContent = '';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, fullName, email, phone, password })
            });
            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.tokens.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/profile';
            } else {
                messageEl.textContent = data.error || 'Ошибка регистрации';
            }
        } catch (error) {
            messageEl.textContent = 'Ошибка сети';
        } finally {
            button.disabled = false;
            button.textContent = 'Зарегистрироваться';
        }
    });
}

// Проверка доступа к админ-панели (будет использоваться в admin.js)
function checkAdminAccess() {
    if (!authService.isAuthenticated() || !authService.isAdmin()) {
        window.location.href = '/profile';
    }
}

// Функция выхода, доступная глобально
window.logout = function() {
    authService.logout();
};

// Если нужно, можно экспортировать для других модулей
window.authService = authService;