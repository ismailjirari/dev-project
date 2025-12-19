# Gestion des Stages  #
## Guide d’Installation ##

Ce document décrit pas à pas l’installation et l’exécution de
l’application Gestion des Stages sur Windows (backend Flask + frontend
HTML/JS + base de données MySQL).

Prérequis

Avant de commencer, assurez-vous d’avoir installé les outils suivants :

a\) Python 3.8 ou plus

python --version

python -m pip --version

👉 Si Python n’est pas installé : - Téléchargez-le depuis
https://www.python.org/ - 

⚠ Cochez Add Python to PATH lors de l’installation

Je recommande Python 3.11

b\) MySQL 8.0 ou plus

> ● Télécharger MySQL Installer depuis https://www.mysql.com/ ● Choisir
> Developer Default
>
> ● Notez soigneusement le mot de passe root défini lors de
> l’installation

c\) Git (optionnel) git --version

👉 Téléchargement : https://git-scm.com/


Étape 1 : Configuration de la Base de Données 
1. Démarrer le service MySQL

>. Ouvrir Services (services.msc) ● Démarrer MySQL (ou MySQL)

<img src="./yzlbtmzl.png" style="width:6.5in;height:3.65625in" />

2. Prendre le fichier data_base.sql puis runner la commande

<img src="./bajn25cz.png" style="width:6.5in;height:3.65625in" />

Étape 2 : Configuration du Backend (Flask) cd C:\gestion-stages\backend

python -m venv venv venv\Scripts\activate

Installation des dépendances

pip install -r requirements.txt

⚠ Remplacez **password123@**par votre mot de passe MySQL réel

Fichier principal

> ● Créez app.py
>
> ● Collez le code backend Flask fourni

Vérification :

[<u>app.py</u>](http://app.py) :

. . .

DB_CONFIG = {

> 'host': os.getenv('DB_HOST', 'localhost'),
>
> 'user': os.getenv('DB_USER', 'root'),
>
> 'password': os.getenv('DB_PASSWORD', 'votre mot de passe MySQL réel'),
>
> 'database': os.getenv('DB_NAME', 'gestion_stages'),
>
> 'port': int(os.getenv('DB_PORT', 3306)),

}

. . .

Étape 3 : Lancer l’Application :

Terminal  – Backend

cd C:\gestion-stages\backend venv\Scripts\activate

python app.py

➡ Flask sert automatiquement le frontend

Étape 4 : Accès à l’Application

Ouvrir le navigateur :

👉 http://localhost:5000

🔧 TestsdeConnexion

Test 1 – Compte étudiant

> ● Email : jean.dupont@email.com ● Mot de passe : bonjour123

Test 3 – Compte administrateur ● Email : admin@ecole.fr

> ● Mot de passe : simo123

🐛 Dépannage

MySQL ne démarre pas services.msc

Démarrer le service MySQL manuellement

Erreur de connexion MySQL mysql -u root -p

Problème Python

venv\Scripts\activate pip list

python --version

📁 Structure Finale du Projet

gestion-stages/
├── backend/
│ ├── venv/ # Environnement virtuel Python
│ ├── logs/ # Fichiers de logs de l'application
│ ├── app.py # Point d'entrée de l'API backend
│ ├── requirements.txt # Dépendances Python
└── frontend/
├──────components/
│   ├──── api.js # Fonctions d'appel à l'API backend
│   └──── auth.js # Gestion de l'authentification
├── index.html # Page d'accueil / connexion
├── student.html # Interface étudiante
├── admin.html # Interface administrateur
├── script.js # Script commun
├── student.js # Logique spécifique étudiant
├── admin.js # Logique spécifique administrateur
└── styles.css # Styles CSS communs

🔄 CommandesUtiles

cd C:\gestion-stages\backend\venv\Scripts\activate

python app.py

Quitter l’environnement virtuel :

deactivate













