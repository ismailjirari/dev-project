CREATE DATABASE IF NOT EXISTS gestion_stages DEFAULT CHARACTER SET utf8;
USE gestion_stages;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('etudiant', 'admin') NOT NULL DEFAULT 'etudiant'
);

CREATE TABLE IF NOT EXISTS student_auth (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_auth (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_etudiant INT NOT NULL,
    entreprise VARCHAR(100) NOT NULL,
    sujet TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut ENUM('en_attente', 'valide', 'refuse') DEFAULT 'en_attente',
    date_declaration TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_etudiant) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (nom, email, role) VALUES 
('Jean Dupont', 'jean.dupont@email.com', 'etudiant'),
('Marie Martin', 'marie.martin@email.com', 'etudiant'),
('Admin User', 'admin@ecole.fr', 'admin');

INSERT INTO student_auth (user_id, email, password_hash) VALUES
(1, 'jean.dupont@email.com', '$2y$10$LWgWn4lqlrCpK0OmPcKreepVHFyZFOzO/QIlVNSnKf7nTU0W5415m'), -- bonjour123

INSERT INTO admin_auth (user_id, email, password_hash) VALUES
(3, 'admin@ecole.fr', '$2y$10$XcsNP573MKm391ALcOKahucJeMt2DzOqpNjO/weAjf8rIKXbOfTTS'); -- simo123

INSERT INTO stages (id_etudiant, entreprise, sujet, date_debut, date_fin, statut) VALUES
(1, 'Google', 'Développement web React', '2024-03-01', '2024-08-31', 'valide'),
(1, 'Microsoft', 'Cloud Computing', '2024-09-01', '2025-02-28', 'en_attente'),
(2, 'Amazon', 'Machine Learning', '2024-04-01', '2024-09-30', 'refuse');
