/**
api.js :
 */

/**
 * API service for backend communication
 */
const API_BASE_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:5000/api' 
    : '/api';

class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

class APIService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            credentials: 'same-origin'
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        // Log pour le debugging
        console.log(`API Request: ${config.method || 'GET'} ${url}`);
        if (config.body) {
            console.log('Request body:', config.body);
        }

        try {
            const response = await fetch(url, config);
            
            // Si la réponse n'est pas JSON (par exemple 204 No Content)
            const contentType = response.headers.get('content-type');
            let data = {};
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else if (response.status === 204) {
                // No content, c'est OK
                data = { success: true };
            } else {
                // Tenter de lire le texte
                const text = await response.text();
                if (text) {
                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = { message: text };
                    }
                }
            }

            console.log(`API Response ${response.status}:`, data);

            if (!response.ok) {
                throw new APIError(
                    data.error || data.message || `HTTP error! status: ${response.status}`,
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            console.error('API Request Failed:', error);
            
            if (error instanceof APIError) {
                throw error;
            }
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new APIError('Impossible de se connecter au serveur. Vérifiez votre connexion.', 0);
            }
            
            throw new APIError('Une erreur inattendue est survenue', 0, { 
                originalError: error.message 
            });
        }
    }

    // ============ AUTHENTICATION ============
    async login(email, password) {
        return this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async registerStudent(nom, email, password) {
        return this.request('/register/student', {
            method: 'POST',
            body: JSON.stringify({ nom, email, password })
        });
    }

    // ============ USERS ============
    async getCurrentUser() {
        const userId = localStorage.getItem('user_id');
        if (!userId) return null;
        
        return this.request(`/users/${userId}`);
    }

    // ============ STAGES ============
    async getStages() {
        return this.request('/stages');
    }

    async getStage(id) {
        return this.request(`/stages/${id}`);
    }

    async getStudentStages(studentId) {
        return this.request(`/stages/etudiant/${studentId}`);
    }

    async createStage(stageData) {
        return this.request('/stages', {
            method: 'POST',
            body: JSON.stringify(stageData)
        });
    }

    async validateStage(stageId) {
        return this.request(`/stages/${stageId}/validate`, {
            method: 'POST',
            body: JSON.stringify({ action: 'validate' })
        });
    }

    async rejectStage(stageId) {
        return this.request(`/stages/${stageId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ action: 'reject' })
        });
    }

    // Alternative: Une seule fonction pour mettre à jour le statut
    async updateStageStatus(stageId, status) {
        return this.request(`/stages/${stageId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ statut: status })
        });
    }

    // ============ STATISTICS ============
    async getStats() {
        return this.request('/stats');
    }

    async getDashboardStats() {
        return this.request('/stats/dashboard');
    }

    // ============ STUDENTS ============
    async getStudents() {
        return this.request('/etudiants');
    }

    async getStudent(id) {
        return this.request(`/etudiants/${id}`);
    }

    // ============ HEALTH CHECK ============
    async healthCheck() {
        return this.request('/health');
    }

    // ============ UPLOAD ============
    async uploadFile(formData) {
        const url = `${API_BASE_URL}/upload`;
        const config = {
            method: 'POST',
            headers: {
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            body: formData
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new APIError(data.error || `Upload failed: ${response.status}`, response.status, data);
            }
            
            return data;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    // ============ UTILS ============
    async checkAuth() {
        try {
            const user = await this.getCurrentUser();
            return { authenticated: !!user, user };
        } catch (error) {
            return { authenticated: false, error };
        }
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
    }
}

// Export singleton instance
export const apiService = new APIService();

// Utility function to handle API errors in UI
export function handleApiError(error) {
    console.error('API Error Details:', {
        name: error.name,
        message: error.message,
        status: error.status,
        data: error.data
    });
    
    if (error instanceof APIError) {
        switch (error.status) {
            case 0:
                return { 
                    message: 'Erreur de connexion. Vérifiez votre connexion internet et assurez-vous que le serveur est démarré.',
                    type: 'error',
                    details: 'Serveur injoignable'
                };
            case 401:
                return { 
                    message: 'Session expirée ou non authentifié. Veuillez vous reconnecter.',
                    type: 'warning',
                    action: 'logout',
                    details: 'Token invalide ou expiré'
                };
            case 403:
                return { 
                    message: 'Accès non autorisé. Vous n\'avez pas les permissions nécessaires.',
                    type: 'error',
                    details: 'Permissions insuffisantes'
                };
            case 404:
                return { 
                    message: 'Ressource non trouvée. L\'élément demandé n\'existe pas.',
                    type: 'error',
                    details: 'Endpoint ou ressource introuvable'
                };
            case 409:
                return { 
                    message: 'Conflit: ' + (error.data?.error || 'La ressource existe déjà ou est en conflit.'),
                    type: 'warning',
                    details: 'Conflit de données'
                };
            case 422:
                return { 
                    message: 'Données invalides: ' + (error.data?.errors || 'Vérifiez les informations fournies.'),
                    type: 'warning',
                    details: 'Validation échouée'
                };
            case 500:
                return { 
                    message: 'Erreur serveur interne. Veuillez réessayer plus tard ou contacter l\'administrateur.',
                    type: 'error',
                    details: 'Erreur serveur'
                };
            default:
                return { 
                    message: error.data?.error || error.data?.message || `Erreur ${error.status}: ${error.message}`,
                    type: 'error',
                    details: `Code HTTP: ${error.status}`
                };
        }
    }
    
    return { 
        message: 'Une erreur inattendue est survenue: ' + error.message,
        type: 'error',
        details: 'Exception non gérée'
    };
}

// Helper pour construire des query strings
export function buildQueryString(params) {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, value);
        }
    });
    
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
}