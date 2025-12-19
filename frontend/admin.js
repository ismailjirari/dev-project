/**
admin.js :
 */

/**
 * Admin dashboard script
 */
import { authService, withAuth } from './components/auth.js';
import { apiService, handleApiError } from './components/api.js';

// DOM Elements
const pageAlert = document.getElementById('pageAlert');
const loadingData = document.getElementById('loadingData');
const noData = document.getElementById('noData');
const stagesTable = document.getElementById('stagesTable');
const stagesTableBody = document.getElementById('stagesTableBody');
const studentsTable = document.getElementById('studentsTable');
const studentsTableBody = document.getElementById('studentsTableBody');
const recentStagesList = document.getElementById('recentStagesList');

// State
let allStages = [];
let allStudents = [];
let recentStages = [];
let filteredStages = [];
let currentPage = 1;
const itemsPerPage = 10;

// Initialize admin page
const initAdminPage = withAuth('admin')(async function() {
    try {
        const user = authService.getCurrentUser();
        
        // Update UI with user info
        updateUserInfo(user);
        
        // Load initial data
        await loadDashboardData();
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing admin page:', error);
        showAlert(pageAlert, 'Erreur lors du chargement du tableau de bord', 'error');
    }
});

function updateUserInfo(user) {
    if (user) {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.textContent = `${user.nom} (Administrateur)`;
        }
    }
}

function setupEventListeners() {
    // Refresh button
    window.refreshData = async function() {
        await loadDashboardData();
        showAlert(pageAlert, 'Données actualisées', 'success');
    };
    
    // Show all stages button
    window.showAllStages = function() {
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterSearch').value = '';
        filterStages();
    };
}

async function loadDashboardData() {
    showLoading(true);
    
    try {
        // Load data in parallel
        const [statsData, stagesData, studentsData] = await Promise.all([
            apiService.getStats(),
            apiService.getStages(),
            apiService.getStudents()
        ]);
        
        // Update stats
        updateStats(statsData.stats);
        
        // Update stages
        allStages = stagesData;
        filteredStages = [...allStages];
        renderStagesTable();
        
        // Update students
        allStudents = studentsData;
        renderStudentsTable();
        
        // Update recent stages
        recentStages = statsData.derniers_stages || [];
        renderRecentStages();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        const errorInfo = handleApiError(error);
        showAlert(pageAlert, errorInfo.message, 'error');
    } finally {
        showLoading(false);
    }
}

function updateStats(stats) {
    if (!stats) return;
    
    document.getElementById('statEnAttente').textContent = stats.en_attente || 0;
    document.getElementById('statValide').textContent = stats.valide || 0;
    document.getElementById('statRefuse').textContent = stats.refuse || 0;
    document.getElementById('statTotal').textContent = stats.total || 0;
}

function showLoading(show) {
    if (loadingData) {
        loadingData.style.display = show ? 'block' : 'none';
    }
    
    if (stagesTable) {
        stagesTable.style.display = show ? 'none' : 'table';
    }
    
    if (noData) {
        noData.style.display = 'none';
    }
}

// Global filter function
window.filterStages = function() {
    const statusFilter = document.getElementById('filterStatus').value;
    const searchFilter = document.getElementById('filterSearch').value.toLowerCase();
    
    filteredStages = allStages.filter(stage => {
        // Filter by status
        if (statusFilter && stage.statut !== statusFilter) {
            return false;
        }
        
        // Filter by search term
        if (searchFilter) {
            const searchIn = `
                ${stage.entreprise || ''} 
                ${stage.sujet || ''} 
                ${stage.etudiant_nom || ''}
            `.toLowerCase();
            
            if (!searchIn.includes(searchFilter)) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    renderStagesTable();
};

function renderStagesTable() {
    if (!stagesTableBody || filteredStages.length === 0) {
        showNoDataMessage();
        return;
    }
    
    // Show table and hide no data message
    stagesTable.style.display = 'table';
    noData.style.display = 'none';
    
    // Clear existing rows
    stagesTableBody.innerHTML = '';
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredStages.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageStages = filteredStages.slice(startIndex, endIndex);
    
    // Render stages
    pageStages.forEach(stage => {
        const row = document.createElement('tr');
        
        // Format dates
        const dateDebut = stage.date_debut ? new Date(stage.date_debut).toLocaleDateString('fr-FR') : '';
        const dateFin = stage.date_fin ? new Date(stage.date_fin).toLocaleDateString('fr-FR') : '';
        const dateDeclaration = stage.date_declaration ? 
            new Date(stage.date_declaration).toLocaleDateString('fr-FR') : '';
        
        // Status badge
        const statusClass = `badge badge-${stage.statut}`;
        const statusText = stage.statut === 'en_attente' ? 'En attente' :
                          stage.statut === 'valide' ? 'Validé' : 'Refusé';
        
        row.innerHTML = `
            <td>${escapeHtml(stage.etudiant_nom)}</td>
            <td>${escapeHtml(stage.entreprise)}</td>
            <td>${escapeHtml(stage.sujet.substring(0, 50))}${stage.sujet.length > 50 ? '...' : ''}</td>
            <td>${dateDebut} - ${dateFin}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${dateDeclaration}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewStageDetails(${stage.id})" title="Voir détails">
                    <i class="fas fa-eye"></i>
                </button>
                ${stage.statut === 'en_attente' ? `
                    <button class="btn btn-sm btn-success" onclick="validateStage(${stage.id})" title="Valider" style="margin-left: 0.25rem;">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectStage(${stage.id})" title="Refuser" style="margin-left: 0.25rem;">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        `;
        
        stagesTableBody.appendChild(row);
    });
    
    // Update pagination
    updatePagination(totalPages);
}

function showNoDataMessage() {
    if (stagesTable) {
        stagesTable.style.display = 'none';
    }
    
    if (noData) {
        noData.style.display = 'block';
    }
    
    // Hide pagination
    const pagination = document.getElementById('pagination');
    if (pagination) {
        pagination.style.display = 'none';
    }
}

function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'block';
    pageInfo.textContent = `Page ${currentPage} sur ${totalPages}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Set up event listeners
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderStagesTable();
        }
    };
    
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderStagesTable();
        }
    };
}

function renderStudentsTable() {
    if (!studentsTableBody || allStudents.length === 0) {
        document.getElementById('noStudents').style.display = 'block';
        studentsTable.style.display = 'none';
        return;
    }
    
    document.getElementById('noStudents').style.display = 'none';
    studentsTable.style.display = 'table';
    studentsTableBody.innerHTML = '';
    
    allStudents.forEach(student => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${escapeHtml(student.nom)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewStudentStages(${student.id})">
                    <i class="fas fa-list"></i> Voir stages
                </button>
            </td>
        `;
        
        studentsTableBody.appendChild(row);
    });
}

function renderRecentStages() {
    if (!recentStagesList || recentStages.length === 0) {
        recentStagesList.innerHTML = '<p style="color: #64748b; text-align: center;">Aucun stage récent</p>';
        return;
    }
    
    let html = '';
    recentStages.slice(0, 5).forEach(stage => {
        const date = stage.date_declaration ? 
            new Date(stage.date_declaration).toLocaleDateString('fr-FR') : '';
        
        const statusClass = `badge badge-${stage.statut}`;
        const statusText = stage.statut === 'en_attente' ? 'En attente' :
                          stage.statut === 'valide' ? 'Validé' : 'Refusé';
        
        html += `
            <div style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">
                <div style="font-weight: 500; margin-bottom: 0.25rem;">${escapeHtml(stage.entreprise)}</div>
                <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">
                    ${escapeHtml(stage.etudiant_nom)}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="${statusClass}" style="font-size: 0.75rem;">${statusText}</span>
                    <span style="font-size: 0.75rem; color: #94a3b8;">${date}</span>
                </div>
            </div>
        `;
    });
    
    recentStagesList.innerHTML = html;
}

// Global functions
window.viewStageDetails = async function(stageId) {
    try {
        const stage = await apiService.getStage(stageId);
        showStageModal(stage);
    } catch (error) {
        console.error('Error loading stage details:', error);
        const errorInfo = handleApiError(error);
        showAlert(pageAlert, errorInfo.message, 'error');
    }
};

window.validateStage = async function(stageId) {
    if (!confirm('Êtes-vous sûr de vouloir valider ce stage ?')) {
        return;
    }
    
    try {
        showAlert(pageAlert, 'Validation en cours...', 'info');
        
        const response = await apiService.validateStage(stageId);
        
        if (response.success) {
            showAlert(pageAlert, 'Stage validé avec succès', 'success');
            
            // Met à jour directement le stage dans allStages
            const stageIndex = allStages.findIndex(s => s.id === stageId);
            if (stageIndex !== -1) {
                allStages[stageIndex].statut = 'valide';
            }
            
            // Force le rafraîchissement du tableau
            filterStages();
            
            // Met à jour les statistiques
            await updateStatistics();
            
        } else {
            showAlert(pageAlert, response.error || 'Erreur lors de la validation', 'error');
        }
    } catch (error) {
        console.error('Error validating stage:', error);
        const errorInfo = handleApiError(error);
        showAlert(pageAlert, errorInfo.message, 'error');
    }
};

window.rejectStage = async function(stageId) {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce stage ?')) {
        return;
    }
    
    try {
        showAlert(pageAlert, 'Refus en cours...', 'info');
        
        const response = await apiService.rejectStage(stageId);
        
        if (response.success) {
            showAlert(pageAlert, 'Stage refusé avec succès', 'success');
            
            // Met à jour directement le stage dans allStages
            const stageIndex = allStages.findIndex(s => s.id === stageId);
            if (stageIndex !== -1) {
                allStages[stageIndex].statut = 'refuse';
            }
            
            // Force le rafraîchissement du tableau
            filterStages();
            
            // Met à jour les statistiques
            await updateStatistics();
            
        } else {
            showAlert(pageAlert, response.error || 'Erreur lors du refus', 'error');
        }
    } catch (error) {
        console.error('Error rejecting stage:', error);
        const errorInfo = handleApiError(error);
        showAlert(pageAlert, errorInfo.message, 'error');
    }
};

// Fonction pour mettre à jour les statistiques
async function updateStatistics() {
    try {
        const statsData = await apiService.getStats();
        updateStats(statsData.stats);
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

window.viewStudentStages = function(studentId) {
    // Filter stages by student
    const student = allStudents.find(s => s.id === studentId);
    if (student) {
        document.getElementById('filterSearch').value = student.nom;
        filterStages();
        
        // Scroll to stages table
        document.querySelector('.dashboard').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
};

window.closeModal = function() {
    const modal = document.getElementById('stageModal');
    modal.classList.remove('show');
};

function showStageModal(stage) {
    const modal = document.getElementById('stageModal');
    const modalTitle = document.getElementById('modalStageTitle');
    const stageDetails = document.getElementById('stageDetails');
    const modalActions = document.getElementById('modalActions');
    
    // Format dates
    const dateDebut = stage.date_debut ? new Date(stage.date_debut).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    
    const dateFin = stage.date_fin ? new Date(stage.date_fin).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    
    const dateDeclaration = stage.date_declaration ? 
        new Date(stage.date_declaration).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '';
    
    // Status badge
    const statusClass = `badge badge-${stage.statut}`;
    const statusText = stage.statut === 'en_attente' ? 'En attente de validation' :
                      stage.statut === 'valide' ? 'Validé' : 'Refusé';
    
    modalTitle.textContent = `Stage: ${escapeHtml(stage.entreprise)}`;
    
    stageDetails.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Étudiant:</strong><br>
            <p style="margin-top: 0.25rem;">${escapeHtml(stage.etudiant_nom)} (${stage.email})</p>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Entreprise:</strong><br>
            <p style="margin-top: 0.25rem;">${escapeHtml(stage.entreprise)}</p>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Sujet:</strong><br>
            <p style="margin-top: 0.25rem; white-space: pre-line;">${escapeHtml(stage.sujet)}</p>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Période:</strong><br>
            <p style="margin-top: 0.25rem;">Du ${dateDebut} au ${dateFin}</p>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Statut:</strong><br>
            <p style="margin-top: 0.25rem;"><span class="${statusClass}">${statusText}</span></p>
        </div>
        
        <div>
            <strong>Date de déclaration:</strong><br>
            <p style="margin-top: 0.25rem;">${dateDeclaration}</p>
        </div>
    `;
    
    // Set up actions based on status
    let actionsHtml = '<button class="btn btn-secondary" onclick="closeModal()">Fermer</button>';
    
    if (stage.statut === 'en_attente') {
        actionsHtml = `
            <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
            <button class="btn btn-success" onclick="validateStage(${stage.id}); closeModal();">Valider</button>
            <button class="btn btn-danger" onclick="rejectStage(${stage.id}); closeModal();">Refuser</button>
        `;
    }
    
    modalActions.innerHTML = actionsHtml;
    
    modal.classList.add('show');
}

function showAlert(element, message, type) {
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPage);

// Global logout function
window.logout = function() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        authService.clearSession();
        window.location.href = '/';
    }
};



