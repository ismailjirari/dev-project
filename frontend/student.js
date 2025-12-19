/**
student.js :
 */
/**
 * Student dashboard script
 */
import { authService, withAuth } from './components/auth.js';
import { apiService, handleApiError } from './components/api.js';

// DOM Elements
const stageForm = document.getElementById('stageForm');
const stagesTable = document.getElementById('stagesTable');
const stagesTableBody = document.getElementById('stagesTableBody');
const loadingStages = document.getElementById('loadingStages');
const noStages = document.getElementById('noStages');
const pageAlert = document.getElementById('pageAlert');
const formAlert = document.getElementById('formAlert');

// State
let currentStudentId = null;
let currentStages = [];
let currentPage = 1;
const itemsPerPage = 10;

// Initialize student page
const initStudentPage = withAuth('etudiant')(async function() {
    try {
        const user = authService.getCurrentUser();
        currentStudentId = user.id;
        
        // Update UI with user info
        updateUserInfo();
        
        // Load student's stages
        await loadStages();
        
        // Set up form
        setupStageForm();
        
        // Set min date to today for date inputs
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date_debut').min = today;
        document.getElementById('date_fin').min = today;
        
    } catch (error) {
        console.error('Error initializing student page:', error);
        showAlert(pageAlert, 'Erreur lors du chargement de la page', 'error');
    }
});

function updateUserInfo() {
    const user = authService.getCurrentUser();
    if (user) {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.textContent = `${user.nom} (Étudiant)`;
        }
    }
}

function setupStageForm() {
    stageForm.addEventListener('submit', handleStageSubmission);
    
    // Real-time date validation
    const dateDebut = document.getElementById('date_debut');
    const dateFin = document.getElementById('date_fin');
    
    dateDebut.addEventListener('change', function() {
        dateFin.min = this.value;
        validateDates();
    });
    
    dateFin.addEventListener('change', validateDates);
}

function validateDates() {
    const dateDebut = document.getElementById('date_debut').value;
    const dateFin = document.getElementById('date_fin').value;
    const dateFinError = document.getElementById('dateFinError');
    
    if (dateDebut && dateFin) {
        const start = new Date(dateDebut);
        const end = new Date(dateFin);
        
        if (end <= start) {
            dateFinError.textContent = 'La date de fin doit être après la date de début';
            document.getElementById('date_fin').classList.add('error');
            return false;
        }
    }
    
    dateFinError.textContent = '';
    document.getElementById('date_fin').classList.remove('error');
    return true;
}

function validateStageForm() {
    let isValid = true;
    
    const entreprise = document.getElementById('entreprise');
    const sujet = document.getElementById('sujet');
    const dateDebut = document.getElementById('date_debut');
    const dateFin = document.getElementById('date_fin');
    
    const entrepriseError = document.getElementById('entrepriseError');
    const sujetError = document.getElementById('sujetError');
    const dateDebutError = document.getElementById('dateDebutError');
    const dateFinError = document.getElementById('dateFinError');
    
    // Reset errors
    [entrepriseError, sujetError, dateDebutError, dateFinError].forEach(el => {
        el.textContent = '';
    });
    [entreprise, sujet, dateDebut, dateFin].forEach(el => {
        el.classList.remove('error');
    });
    
    // Validate entreprise
    if (!entreprise.value.trim()) {
        entrepriseError.textContent = 'Le nom de l\'entreprise est requis';
        entreprise.classList.add('error');
        isValid = false;
    }
    
    // Validate sujet
    if (!sujet.value.trim()) {
        sujetError.textContent = 'Le sujet du stage est requis';
        sujet.classList.add('error');
        isValid = false;
    }
    
    // Validate dates
    if (!dateDebut.value) {
        dateDebutError.textContent = 'La date de début est requise';
        dateDebut.classList.add('error');
        isValid = false;
    }
    
    if (!dateFin.value) {
        dateFinError.textContent = 'La date de fin est requise';
        dateFin.classList.add('error');
        isValid = false;
    }
    
    // Validate date logic
    if (dateDebut.value && dateFin.value) {
        if (!validateDates()) {
            isValid = false;
        }
    }
    
    return isValid;
}

async function handleStageSubmission(event) {
    event.preventDefault();
    
    if (!validateStageForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('submitStageBtn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Déclaration...';
    
    const stageData = {
        id_etudiant: currentStudentId,
        entreprise: document.getElementById('entreprise').value.trim(),
        sujet: document.getElementById('sujet').value.trim(),
        date_debut: document.getElementById('date_debut').value,
        date_fin: document.getElementById('date_fin').value
    };
    
    try {
        const response = await apiService.createStage(stageData);
        
        if (response.success) {
            showAlert(formAlert, 'Stage déclaré avec succès !', 'success');
            stageForm.reset();
            
            // Reload stages
            await loadStages();
            
            // Scroll to stages table
            document.querySelector('.dashboard').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            showAlert(formAlert, response.error || 'Erreur lors de la déclaration', 'error');
        }
    } catch (error) {
        console.error('Stage submission error:', error);
        const errorInfo = handleApiError(error);
        showAlert(formAlert, errorInfo.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function loadStages() {
    showLoading(true);
    
    try {
        const stages = await apiService.getStudentStages(currentStudentId);
        currentStages = stages;
        
        if (stages.length === 0) {
            showNoStagesMessage();
        } else {
            renderStagesTable();
        }
    } catch (error) {
        console.error('Error loading stages:', error);
        const errorInfo = handleApiError(error);
        showAlert(pageAlert, errorInfo.message, 'error');
        
        // Show empty state if error
        showNoStagesMessage();
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    if (loadingStages) {
        loadingStages.style.display = show ? 'block' : 'none';
    }
    
    if (stagesTable) {
        stagesTable.style.display = show ? 'none' : 'table';
    }
}

function showNoStagesMessage() {
    if (noStages) {
        noStages.style.display = 'block';
    }
    
    if (stagesTable) {
        stagesTable.style.display = 'none';
    }
    
    // Hide pagination
    const pagination = document.getElementById('stagesPagination');
    if (pagination) {
        pagination.style.display = 'none';
    }
}

function renderStagesTable() {
    if (!stagesTableBody || currentStages.length === 0) {
        showNoStagesMessage();
        return;
    }
    
    // Show table and hide no stages message
    stagesTable.style.display = 'table';
    noStages.style.display = 'none';
    
    // Clear existing rows
    stagesTableBody.innerHTML = '';
    
    // Calculate pagination
    const totalPages = Math.ceil(currentStages.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageStages = currentStages.slice(startIndex, endIndex);
    
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
            <td>${escapeHtml(stage.entreprise)}</td>
            <td>${escapeHtml(stage.sujet.substring(0, 50))}${stage.sujet.length > 50 ? '...' : ''}</td>
            <td>${dateDebut} - ${dateFin}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${dateDeclaration}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewStageDetails(${stage.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        stagesTableBody.appendChild(row);
    });
    
    // Update pagination
    updatePagination(totalPages);
}

function updatePagination(totalPages) {
    const pagination = document.getElementById('stagesPagination');
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

// Global functions
window.refreshStages = async function() {
    await loadStages();
    showAlert(pageAlert, 'Liste des stages actualisée', 'success');
};

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

window.closeModal = function() {
    const modal = document.getElementById('stageModal');
    modal.classList.remove('show');
};

function showStageModal(stage) {
    const modal = document.getElementById('stageModal');
    const modalTitle = document.getElementById('modalStageTitle');
    const stageDetails = document.getElementById('stageDetails');
    
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
        
        <div style="margin-bottom: 1rem;">
            <strong>Étudiant:</strong><br>
            <p style="margin-top: 0.25rem;">${escapeHtml(stage.etudiant_nom)} (${stage.email})</p>
        </div>
        
        <div>
            <strong>Date de déclaration:</strong><br>
            <p style="margin-top: 0.25rem;">${dateDeclaration}</p>
        </div>
    `;
    
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
document.addEventListener('DOMContentLoaded', initStudentPage);

// Global logout function
window.logout = function() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        authService.clearSession();
        window.location.href = '/';
    }
};