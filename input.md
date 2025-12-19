🎓 GestiondesStages–Guided’Installation (Windows)

Ce document décrit pas à pas l’installation et l’exécution de
l’application Gestion des Stages sur Windows (backend Flask + frontend
HTML/JS + base de données MySQL).

📋 Prérequis

Avant de commencer, assurez-vous d’avoir installé les outils suivants :

a\) Python 3.8 ou plus

python --version

python -m pip --version

👉 Si Python n’est pas installé : - Téléchargez-le depuis
https://www.python.org/ - ⚠ Cochez Add Python to PATH lors de
l’installation

Je recommande Python 3.11

b\) MySQL 8.0 ou plus

> ● Télécharger MySQL Installer depuis https://www.mysql.com/ ● Choisir
> Developer Default
>
> ● Notez soigneusement le mot de passe root défini lors de
> l’installation

c\) Git (optionnel) git --version

👉 Téléchargement : https://git-scm.com/

🚀 InstallationPasàPas

Étape 1 : Préparer l’environnement

mkdir C:\gestion-stages cd C:\gestion-stages

mkdir backend mkdir frontend

mkdir frontend\components

explorer .

Étape 2 : Configuration de la Base de Données 1. Démarrer le service
MySQL

> ● Ouvrir Services (services.msc) ● Démarrer MySQL (ou MySQL)

<img src="./yzlbtmzl.png" style="width:6.5in;height:3.65625in" />2.
Prendre le fichier data_base.sql puis runner la commande

<img src="./bajn25cz.png" style="width:6.5in;height:3.65625in" />

Étape 3 : Configuration du Backend (Flask) cd C:\gestion-stages\backend

python -m venv venv venv\Scripts\activate

Installation des dépendances

Créer le fichier requirements.txt :

echo flask==2.3.3 **\>** requirements.txt

echo flask-cors==4.0.0 **\>\>** requirements.txt

echo mysql-connector-python==8.1.0 **\>\>** requirements.txt echo
python-dotenv==1.0.0 **\>\>** requirements.txt

echo bcrypt==4.0.1 **\>\>** requirements.txt

pip install -r requirements.txt

Création du fichier *.env*

echo DB_HOST=localhost **\>** .env echo DB_USER=root **\>\>** .env

echo DB_PASSWORD=password123@ **\>\>** .env echo DB_NAME=gestion_stages
**\>\>** .env echo DB_PORT=3306 **\>\>** .env

echo FLASK_DEBUG=True **\>\>** .env

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
>
> 'charset': 'utf8mb4',
>
> 'connection_timeout': 10,
>
> 'pool_name': 'gestion_stages_pool',
>
> 'pool_size': 5

}

. . .

||
||
||
||

import mysql.connector

from mysql.connector import errorcode

\# Informations de connexion

host = "localhost"

user = "root" \# votre utilisateur MySQL

password = "votre mot de passe MySQL réel"

\# Nom de la base de données

db_name = "gestion_stages"

\# Connexion au serveur MySQL

try:

> conn = mysql.connector.connect(
>
> host=host,
>
> user=user,
>
> password=password
>
> )
>
> cursor = conn.cursor()
>
> print("Connexion réussie à MySQL !")

except mysql.connector.Error as err:

> print(f"Erreur de connexion : {err}")
>
> exit(1)

\# Fermeture de la connexion

cursor.close()

conn.close()

Étape 4 : Configuration du Frontend cd C:\gestion-stages\frontend

Créer les fichiers HTML : - index.html- student.html- admin.html

Créer les fichiers JavaScript :

cd components

> ● api.js ● auth.js

cd ..

> ● script.js ● student.js ● admin.js

Créer le fichier CSS : - styles.css

Vérification :

dir

dir components

Étape 5 : Lancer l’Application Option A – Deux terminaux

Terminal 1 – Backend

cd C:\gestion-stages\backend venv\Scripts\activate

python app.py

Terminal 2 – Frontend

cd C:\gestion-stages\backend venv\Scripts\activate

python -m http.server 8000 --directory ../frontend

Option B – Backend uniquement (recommandé) cd C:\gestion-stages\backend
venv\Scripts\activate

python app.py

➡ Flask sert automatiquement le frontend

Étape 6 : Accès à l’Application

Ouvrir le navigateur :

👉 http://localhost:5000

🔧 TestsdeConnexion

Test 1 – Santé du backend http://localhost:5000/api/health

Résultat attendu :

{"status": "ok", "database": "connected"}

Test 2 – Compte étudiant

> ● Email : jean.dupont@email.com ● Mot de passe : password123

Test 3 – Compte administrateur ● Email : admin@ecole.fr

> ● Mot de passe : password123

🐛 Dépannage

MySQL ne démarre pas services.msc

Démarrer le service MySQL manuellement

Erreur de connexion MySQL mysql -u root -p

Vérifier le fichier .env

Port 5000 déjà utilisé

netstat -ano **\|** **findstr** :5000 taskkill /PID 1234 /F

Problème Python

venv\Scripts\activate pip list

python --version

Problème d’inscription

curl -X POST http://localhost:5000/api/register/student ^ -H
"Content-Type: application/json" ^

-d
"{\\nom\\:\\Test\\,\\email\\:\\test@test.com\\,\\password\\:\\password123\\}"

📁 StructureFinaleduProjet

C:\gestion-stages\\ ├── backend\\

│ ├── venv\\ │ ├── logs\\ │ ├── app.py

│ ├── requirements.txt │ └── .env

└── frontend\\

> ├── components\\ │ ├── api.js │ └── auth.js ├── index.html ├──
> student.html ├── admin.html ├── script.js ├── student.js ├── admin.js
> └── styles.css

🔄 CommandesUtiles

cd C:\gestion-stages\backend venv\Scripts\activate

python app.py

Quitter l’environnement virtuel :

deactivate

