/**
auth.js :
 */

/**
 * Authentication service
 */
import { apiService } from './api.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check for stored user session
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                apiService.setToken(localStorage.getItem('token'));
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.clearSession();
            }
        }
    }

    async login(email, password) {
        try {
            const response = await apiService.login(email, password);
            
            if (response.success && response.user) {
                this.setSession(response.user);
                return { success: true, user: response.user };
            } else {
                return { 
                    success: false, 
                    message: response.error || 'Échec de la connexion' 
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.message || 'Erreur lors de la connexion' 
            };
        }
    }

    async registerStudent(nom, email, password) {
        try {
            console.log('AuthService: Registering student', { nom, email });
            const response = await apiService.registerStudent(nom, email, password);
            console.log('AuthService: Registration response', response);
            
            if (response.success) {
                return { 
                    success: true, 
                    user_id: response.user_id,
                    user: response.user 
                };
            } else {
                return { 
                    success: false, 
                    message: response.error || 'Échec de l\'inscription' 
                };
            }
        } catch (error) {
            console.error('AuthService: Registration error', error);
            return { 
                success: false, 
                message: error.message || 'Erreur lors de l\'inscription' 
            };
        }
    }

    setSession(user, token = null) {
        this.currentUser = user;
        
        if (token) {
            localStorage.setItem('token', token);
            apiService.setToken(token);
        }
        
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_id', user.id);
        
        // Dispatch login event
        window.dispatchEvent(new CustomEvent('auth:login', { detail: { user } }));
    }

    clearSession() {
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        apiService.setToken(null);
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    isStudent() {
        return this.currentUser && this.currentUser.role === 'etudiant';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async checkSession() {
        if (!this.currentUser) {
            return false;
        }

        try {
            const user = await apiService.getCurrentUser();
            if (user && user.id === this.currentUser.id) {
                return true;
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }

        this.clearSession();
        return false;
    }

    requireAuth(requiredRole = null) {
        if (!this.isAuthenticated()) {
            window.location.href = '/';
            return false;
        }

        if (requiredRole && this.currentUser.role !== requiredRole) {
            this.showAccessDenied();
            return false;
        }

        return true;
    }

    showAccessDenied() {
        alert('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
        window.location.href = '/';
    }

    validatePassword(password) {
        const errors = [];
        
        if (password.length < 6) {
            errors.push('Le mot de passe doit contenir au moins 6 caractères');
        }
        
        if (!/[A-Z]/.test(password)) {  // <-- PROBLÈME ICI
            errors.push('Le mot de passe doit contenir au moins une majuscule');
        }
        
        if (!/[0-9]/.test(password)) {  // <-- PROBLÈME ICI
            errors.push('Le mot de passe doit contenir au moins un chiffre');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Email validation
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Export singleton instance
export const authService = new AuthService();

// Auth middleware for page protection
export function withAuth(requiredRole = null) {
    return (pageFunction) => {
        return async (...args) => {
            if (!authService.isAuthenticated()) {
                window.location.href = '/';
                return;
            }

            if (requiredRole && !authService.currentUser.role === requiredRole) {
                authService.showAccessDenied();
                return;
            }

            try {
                const sessionValid = await authService.checkSession();
                if (!sessionValid) {
                    window.location.href = '/';
                    return;
                }

                return pageFunction(...args);
            } catch (error) {
                console.error('Auth middleware error:', error);
                window.location.href = '/';
            }
        };
    };
}

// Helper function to update UI based on auth state
export function updateAuthUI() {
    const user = authService.getCurrentUser();
    const authElements = document.querySelectorAll('[data-auth]');
    
    authElements.forEach(element => {
        const authState = element.getAttribute('data-auth');
        
        switch (authState) {
            case 'authenticated':
                element.style.display = user ? '' : 'none';
                break;
            case 'unauthenticated':
                element.style.display = user ? 'none' : '';
                break;
            case 'admin':
                element.style.display = (user && user.role === 'admin') ? '' : 'none';
                break;
            case 'student':
                element.style.display = (user && user.role === 'etudiant') ? '' : 'none';
                break;
        }
    });
    
    // Update user info if element exists
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement && user) {
        userInfoElement.textContent = `${user.nom} (${user.role})`;
    }
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);
window.addEventListener('auth:login', updateAuthUI);
window.addEventListener('auth:logout', updateAuthUI);





