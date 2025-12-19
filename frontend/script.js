/**
script.js :
 */

/**
 * Main script for authentication page
 */
import { authService, updateAuthUI } from './components/auth.js';
import { apiService, handleApiError } from './components/api.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginAlert = document.getElementById('loginAlert');
const registerAlert = document.getElementById('registerAlert');

// Form validation functions
function validateLoginForm() {
    let isValid = true;
    
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    
    // Reset errors
    emailError.textContent = '';
    passwordError.textContent = '';
    email.classList.remove('error');
    password.classList.remove('error');
    
    // Validate email
    if (!email.value.trim()) {
        emailError.textContent = 'L\'email est requis';
        email.classList.add('error');
        isValid = false;
    } else if (!authService.validateEmail(email.value)) {
        emailError.textContent = 'Format d\'email invalide';
        email.classList.add('error');
        isValid = false;
    }
    
    // Validate password
    if (!password.value) {
        passwordError.textContent = 'Le mot de passe est requis';
        password.classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

function validateRegisterForm() {
    let isValid = true;
    
    const name = document.getElementById('registerName');
    const email = document.getElementById('registerEmail');
    const password = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('registerEmailError');
    const passwordError = document.getElementById('registerPasswordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    
    // Reset errors
    [nameError, emailError, passwordError, confirmPasswordError].forEach(el => {
        el.textContent = '';
    });
    [name, email, password, confirmPassword].forEach(el => {
        el.classList.remove('error');
    });
    
    // Validate name
    if (!name.value.trim()) {
        nameError.textContent = 'Le nom est requis';
        name.classList.add('error');
        isValid = false;
    }
    
    // Validate email
    if (!email.value.trim()) {
        emailError.textContent = 'L\'email est requis';
        email.classList.add('error');
        isValid = false;
    } else if (!authService.validateEmail(email.value)) {
        emailError.textContent = 'Format d\'email invalide';
        email.classList.add('error');
        isValid = false;
    }
    
    // Validate password - SIMPLIFIÉE
    if (!password.value) {
        passwordError.textContent = 'Le mot de passe est requis';
        password.classList.add('error');
        isValid = false;
    } else if (password.value.length < 6) {
        passwordError.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
        password.classList.add('error');
        isValid = false;
    }
    // Supprimer la validation complexe
    
    // Validate password confirmation
    if (password.value !== confirmPassword.value) {
        confirmPasswordError.textContent = 'Les mots de passe ne correspondent pas';
        confirmPassword.classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

// Form submission handlers
async function handleLogin(event) {
    event.preventDefault();
    
    if (!validateLoginForm()) {
        return;
    }
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    
    // Disable button and show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
    try {
        const result = await authService.login(email, password);
        
        if (result.success) {
            showAlert(loginAlert, 'Connexion réussie ! Redirection...', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (result.user.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/student.html';
                }
            }, 1000);
        } else {
            showAlert(loginAlert, result.message || 'Échec de la connexion', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        }
    } catch (error) {
        console.error('Login error:', error);
        const errorInfo = handleApiError(error);
        showAlert(loginAlert, errorInfo.message, 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    console.log('Register form submitted');
    
    if (!validateRegisterForm()) {
        console.log('Form validation failed');
        return;
    }
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    
    console.log('Registration data:', { name, email, password });
    
    // Disable button and show loading state
    registerBtn.disabled = true;
    const originalText = registerBtn.innerHTML;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';
    
    try {
        const result = await authService.registerStudent(name, email, password);
        console.log('Registration result:', result);
        
        if (result.success) {
            showAlert(registerAlert, 'Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
            
            // Clear form
            registerForm.reset();
            
            // Auto-fill login form and switch back
            setTimeout(() => {
                document.getElementById('email').value = email;
                showLogin();
                document.getElementById('password').focus();
            }, 2000);
        } else {
            showAlert(registerAlert, result.message || 'Échec de l\'inscription', 'error');
        }
    } catch (error) {
        console.error('Registration error details:', error);
        const errorInfo = handleApiError(error);
        showAlert(registerAlert, errorInfo.message, 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = originalText;
    }
}

// UI functions
function showRegister() {
    console.log('Switching to register form');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    clearAlerts();
    clearFormErrors();
}

function showLogin() {
    console.log('Switching to login form');
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    clearAlerts();
    clearFormErrors();
}

function showAlert(element, message, type) {
    console.log(`Showing alert: ${type} - ${message}`);
    element.textContent = message;
    element.className = `alert alert-${type} show`;
    element.style.display = 'flex';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function clearAlerts() {
    [loginAlert, registerAlert].forEach(alert => {
        alert.style.display = 'none';
        alert.textContent = '';
    });
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.textContent = '';
    });
    
    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach(control => {
        control.classList.remove('error');
    });
}

// Global functions for HTML onclick handlers
window.showRegister = showRegister;
window.showLogin = showLogin;

window.logout = function() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        authService.clearSession();
        window.location.href = '/';
    }
};

// Check if user is already logged in
function checkExistingSession() {
    if (authService.isAuthenticated()) {
        // Check if session is still valid
        authService.checkSession().then(valid => {
            if (valid) {
                // Redirect based on role
                const user = authService.getCurrentUser();
                if (user.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/student.html';
                }
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Check for existing valid session
    checkExistingSession();
    
    // Update auth UI
    updateAuthUI();
    
    // Attach form submit handlers
    if (loginForm) {
        console.log('Attaching login form handler');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('Login form not found!');
    }
    
    if (registerForm) {
        console.log('Attaching register form handler');
        registerForm.addEventListener('submit', handleRegister);
    } else {
        console.error('Register form not found!');
    }
    
    // Add input validation on blur
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.form && this.form.id === 'loginForm') {
                validateLoginForm();
            } else if (this.form && this.form.id === 'registerForm') {
                validateRegisterForm();
            }
        });
    });
    
    // Test API connection
    testAPIConnection();
});

// Test API connection on load
async function testAPIConnection() {
    try {
        console.log('Testing API connection...');
        const response = await apiService.healthCheck();
        console.log('API connection successful:', response);
    } catch (error) {
        console.warn('API connection test failed:', error);
        if (window.location.pathname === '/') {
            showAlert(loginAlert, 
                'Attention: Le serveur backend n\'est pas accessible. Certaines fonctionnalités peuvent être limitées.',
                'warning'
            );
        }
    }
}

// Debug function
window.debugRegistration = async function() {
    console.log('=== DEBUG REGISTRATION ===');
    console.log('Form elements check:');
    console.log('registerForm:', document.getElementById('registerForm'));
    console.log('registerName:', document.getElementById('registerName'));
    console.log('registerEmail:', document.getElementById('registerEmail'));
    console.log('registerPassword:', document.getElementById('registerPassword'));
    
    // Test manual registration
    const testData = {
        nom: 'Test Debug',
        email: 'debug@test.com',
        password: 'password123'
    };
    
    console.log('Testing with data:', testData);
    
    try {
        const response = await fetch('http://localhost:5000/api/register/student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        
        alert(`Test: ${response.ok ? 'Success' : 'Error'}\nStatus: ${response.status}\nMessage: ${result.message || result.error}`);
    } catch (error) {
        console.error('Debug test error:', error);
        alert('Debug test error: ' + error.message);
    }
};






 // Debug function - add this to script.js
window.handleRegisterClick = function(event) {
    event.preventDefault();
    console.log('Register button clicked manually');
    
    // Get form data
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    console.log('Form data:', { name, email, password, confirmPassword });
    
    // Trigger form submission
    const form = document.getElementById('registerForm');
    if (form) {
        const submitEvent = new Event('submit', { cancelable: true });
        form.dispatchEvent(submitEvent);
    }
};



validateRegisterForm