# app.py  :

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import os
from dotenv import load_dotenv
import bcrypt
import logging
from logging.handlers import RotatingFileHandler

# Charger les variables d'environnement
load_dotenv()

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Créer un handler pour les logs
if not os.path.exists('logs'):
    os.makedirs('logs')
file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
logger.addHandler(file_handler)

# Initialisation de l'application Flask
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'votre mot de passe MySQL réel'),
    'database': os.getenv('DB_NAME', 'gestion_stages'),
    'port': int(os.getenv('DB_PORT', 3306)),

}

# Helper functions
def get_db_connection():
    """Établit une connexion à la base de données"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        logger.info("Connexion à la base de données établie")
        return conn
    except Error as e:
        logger.error(f"Erreur de connexion à la base de données: {e}")
        return None

def hash_password(password):
    """Hash un mot de passe avec bcrypt"""
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Erreur lors du hashage du mot de passe: {e}")
        raise

def verify_password(password, hashed_password):
    """Vérifie un mot de passe avec bcrypt"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du mot de passe: {e}")
        return False

def validate_email(email):
    """Valide le format d'un email"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def format_date_for_json(date_obj):
    """Formate une date pour la sérialisation JSON"""
    if isinstance(date_obj, datetime):
        return date_obj.isoformat()
    elif isinstance(date_obj, str):
        return date_obj
    return None

# Routes pour servir les pages HTML
@app.route('/')
def serve_index():
    """Sert la page d'accueil"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Sert les fichiers statiques"""
    return send_from_directory(app.static_folder, path)

# Middleware pour logging des requêtes
@app.before_request
def log_request_info():
    """Log les informations des requêtes entrantes"""
    logger.info(f'Request: {request.method} {request.path} - IP: {request.remote_addr}')
    if request.method in ['POST', 'PUT']:
        if request.is_json:
            logger.info(f'Request JSON: {request.get_json()}')
        else:
            logger.info(f'Request data: {request.data}')

@app.after_request
def log_response_info(response):
    """Log les informations des réponses sortantes"""
    logger.info(f'Response: {response.status_code} - {request.path}')
    return response

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    """Gère les erreurs 404"""
    logger.warning(f'Page non trouvée: {request.path}')
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Ressource non trouvée'}), 404
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(500)
def internal_error(error):
    """Gère les erreurs 500"""
    logger.error(f'Erreur interne du serveur: {error}')
    return jsonify({'error': 'Une erreur interne est survenue'}), 500

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de vérification de santé"""
    try:
        conn = get_db_connection()
        if conn:
            conn.ping(reconnect=True)
            conn.close()
            db_status = 'connected'
        else:
            db_status = 'disconnected'
    except Error:
        db_status = 'error'
    
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'database': db_status,
        'version': '1.0.0'
    }), 200

# Routes d'authentification
@app.route('/api/register/student', methods=['POST'])
def register_student():
    """Inscription d'un nouvel étudiant"""
    conn = None
    cursor = None
    
    try:
        # Debug: Log les headers
        logger.info(f"Register request headers: {dict(request.headers)}")
        
        # Debug: Log raw data
        logger.info(f"Register request raw data: {request.data}")
        
        data = request.get_json()
        if not data:
            logger.error("No JSON data received or invalid JSON")
            return jsonify({'error': 'Données JSON manquantes ou invalides'}), 400
        
        logger.info(f"Parsed data: {data}")
        
        nom = data.get('nom', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation des données
        if not all([nom, email, password]):
            logger.error(f"Missing fields: nom={bool(nom)}, email={bool(email)}, password={bool(password)}")
            return jsonify({'error': 'Tous les champs sont requis'}), 400
        
        if not validate_email(email):
            logger.error(f"Invalid email format: {email}")
            return jsonify({'error': 'Format d\'email invalide'}), 400
        
        if len(password) < 6:
            logger.error(f"Password too short: {len(password)} characters")
            return jsonify({'error': 'Le mot de passe doit contenir au moins 6 caractères'}), 400
        
        conn = get_db_connection()
        if not conn:
            logger.error("Database connection failed")
            return jsonify({'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor()
        
        # Vérifier si l'email existe déjà
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            logger.warning(f"Email already exists: {email}")
            cursor.close()
            conn.close()
            return jsonify({'error': 'Cet email est déjà utilisé'}), 409
        
        # SUPPRIMER cette ligne: conn.start_transaction()
        # NE PAS démarrer de transaction explicitement
        
        # Insérer dans users
        cursor.execute(
            "INSERT INTO users (nom, email, role) VALUES (%s, %s, 'etudiant')",
            (nom, email)
        )
        user_id = cursor.lastrowid
        
        # Hasher le mot de passe
        password_hash = hash_password(password)
        
        # Insérer dans student_auth
        cursor.execute(
            "INSERT INTO student_auth (user_id, email, password_hash) VALUES (%s, %s, %s)",
            (user_id, email, password_hash)
        )
        
        # Commit des opérations
        conn.commit()
        logger.info(f'Nouvel étudiant inscrit avec succès: {email}')
        
        # Fermer le curseur et la connexion
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Compte étudiant créé avec succès',
            'user_id': user_id,
            'user': {
                'id': user_id,
                'nom': nom,
                'email': email,
                'role': 'etudiant'
            }
        }), 201
        
    except Error as e:
        # Rollback en cas d'erreur
        if conn:
            try:
                conn.rollback()
            except:
                pass
        
        logger.error(f'Database error during registration: {e}')
        
        # Message d'erreur plus précis
        error_msg = str(e).lower()
        if 'duplicate' in error_msg or '1062' in str(e):
            return jsonify({'error': 'Cet email est déjà utilisé'}), 409
        elif 'transaction' in error_msg:
            return jsonify({'error': 'Erreur de transaction avec la base de données. Veuillez réessayer.'}), 500
        else:
            return jsonify({'error': f'Erreur lors de la création du compte: {str(e)}'}), 500
            
    except Exception as e:
        logger.error(f'Unexpected error during registration: {e}')
        return jsonify({'error': 'Une erreur inattendue est survenue'}), 500
        
    finally:
        # Nettoyage garanti
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass
    
@app.route('/api/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur"""
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Données JSON invalides ou manquantes'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email et mot de passe requis'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Récupérer l'utilisateur
            cursor.execute("""
                SELECT id, nom, email, role 
                FROM users 
                WHERE email = %s
            """, (email,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
            
            # Récupérer le hash du mot de passe selon le rôle
            if user['role'] == 'etudiant':
                cursor.execute("""
                    SELECT password_hash 
                    FROM student_auth 
                    WHERE email = %s
                """, (email,))
            elif user['role'] == 'admin':
                cursor.execute("""
                    SELECT password_hash 
                    FROM admin_auth 
                    WHERE email = %s
                """, (email,))
            else:
                return jsonify({'error': 'Rôle utilisateur invalide'}), 401
            
            auth_data = cursor.fetchone()
            
            if not auth_data or not verify_password(password, auth_data['password_hash']):
                return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
            
            logger.info(f'Connexion réussie pour: {email}')
            
            return jsonify({
                'success': True,
                'message': 'Connexion réussie',
                'user': {
                    'id': user['id'],
                    'nom': user['nom'],
                    'email': user['email'],
                    'role': user['role']
                }
            }), 200
            
        except Error as e:
            logger.error(f'Erreur lors de la connexion: {e}')
            return jsonify({'error': 'Erreur lors de l\'authentification'}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f'Erreur inattendue lors de la connexion: {e}')
        return jsonify({'error': 'Une erreur inattendue est survenue'}), 500

# Routes pour les utilisateurs
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Récupère les informations d'un utilisateur"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nom, email, role 
            FROM users 
            WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user:
            return jsonify(user), 200
        else:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
    except Error as e:
        logger.error(f'Erreur lors de la récupération de l\'utilisateur: {e}')
        return jsonify({'error': 'Erreur lors de la récupération des données'}), 500

# Routes pour les stages
@app.route('/api/stages', methods=['GET'])
def get_all_stages():
    """Récupère tous les stages"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor(dictionary=True)
        query = """
        SELECT s.*, u.nom as etudiant_nom, u.email 
        FROM stages s
        JOIN users u ON s.id_etudiant = u.id
        ORDER BY s.date_declaration DESC
        """
        cursor.execute(query)
        stages = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Formater les dates
        for stage in stages:
            stage['date_debut'] = format_date_for_json(stage['date_debut'])
            stage['date_fin'] = format_date_for_json(stage['date_fin'])
            stage['date_declaration'] = format_date_for_json(stage['date_declaration'])
        
        return jsonify(stages), 200
        
    except Error as e:
        logger.error(f'Erreur lors de la récupération des stages: {e}')
        return jsonify({'error': 'Erreur lors de la récupération des données'}), 500

@app.route('/api/stages/<int:stage_id>', methods=['GET'])
def get_stage(stage_id):
    """Récupère un stage spécifique"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
        SELECT s.*, u.nom as etudiant_nom, u.email 
        FROM stages s
        JOIN users u ON s.id_etudiant = u.id
        WHERE s.id = %s
        """, (stage_id,))
        
        stage = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if stage:
            # Formater les dates
            stage['date_debut'] = format_date_for_json(stage['date_debut'])
            stage['date_fin'] = format_date_for_json(stage['date_fin'])
            stage['date_declaration'] = format_date_for_json(stage['date_declaration'])
            
            return jsonify(stage), 200
        else:
            return jsonify({'error': 'Stage non trouvé'}), 404
            
    except Error as e:
        logger.error(f'Erreur lors de la récupération du stage: {e}')
        return jsonify({'error': 'Erreur lors de la récupération des données'}), 500

@app.route('/api/stages/etudiant/<int:etudiant_id>', methods=['GET'])
def get_stages_etudiant(etudiant_id):
    """Récupère les stages d'un étudiant spécifique"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
        SELECT s.*, u.nom as etudiant_nom 
        FROM stages s
        JOIN users u ON s.id_etudiant = u.id
        WHERE s.id_etudiant = %s
        ORDER BY s.date_declaration DESC
        """, (etudiant_id,))
        
        stages = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Formater les dates
        for stage in stages:
            stage['date_debut'] = format_date_for_json(stage['date_debut'])
            stage['date_fin'] = format_date_for_json(stage['date_fin'])
            stage['date_declaration'] = format_date_for_json(stage['date_declaration'])
        
        return jsonify(stages), 200
        
    except Error as e:
        logger.error(f'Erreur lors de la récupération des stages étudiant: {e}')
        return jsonify({'error': 'Erreur lors de la récupération des données'}), 500

@app.route('/api/stages', methods=['POST'])
def create_stage():
    """Crée un nouveau stage"""
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Données JSON invalides ou manquantes'}), 400
        
        # Validation des champs requis
        required_fields = ['id_etudiant', 'entreprise', 'sujet', 'date_debut', 'date_fin']
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({'error': f'Le champ {field} est requis'}), 400
        
        # Validation des dates
        try:
            date_debut = datetime.strptime(data['date_debut'], '%Y-%m-%d')
            date_fin = datetime.strptime(data['date_fin'], '%Y-%m-%d')
            
            if date_fin <= date_debut:
                return jsonify({'error': 'La date de fin doit être après la date de début'}), 400
                
        except ValueError:
            return jsonify({'error': 'Format de date invalide. Utilisez YYYY-MM-DD'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor()
        
        try:
            # Vérifier que l'étudiant existe
            cursor.execute("SELECT id FROM users WHERE id = %s AND role = 'etudiant'", (data['id_etudiant'],))
            if not cursor.fetchone():
                return jsonify({'error': 'Étudiant non trouvé'}), 404
            
            # Insérer le stage
            cursor.execute("""
            INSERT INTO stages (id_etudiant, entreprise, sujet, date_debut, date_fin, statut)
            VALUES (%s, %s, %s, %s, %s, 'en_attente')
            """, (
                data['id_etudiant'],
                data['entreprise'].strip(),
                data['sujet'].strip(),
                data['date_debut'],
                data['date_fin']
            ))
            
            conn.commit()
            stage_id = cursor.lastrowid
            
            logger.info(f'Nouveau stage créé: ID {stage_id} pour étudiant {data["id_etudiant"]}')
            
            return jsonify({
                'success': True,
                'message': 'Stage déclaré avec succès',
                'id': stage_id
            }), 201
            
        except Error as e:
            conn.rollback()
            logger.error(f'Erreur lors de la création du stage: {e}')
            return jsonify({'error': 'Erreur lors de la création du stage'}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f'Erreur inattendue lors de la création du stage: {e}')
        return jsonify({'error': 'Une erreur inattendue est survenue'}), 500

# Routes d'administration
@app.route('/api/stages/<int:stage_id>/validate', methods=['POST', 'PUT'])
def validate_stage(stage_id):
    """Valide un stage"""
    return update_statut_stage(stage_id, 'valide')

@app.route('/api/stages/<int:stage_id>/reject', methods=['POST', 'PUT'])
def reject_stage(stage_id):
    """Refuse un stage"""
    return update_statut_stage(stage_id, 'refuse')

def update_statut_stage(stage_id, statut):
    """Met à jour le statut d'un stage"""
    try:
        conn = get_db_connection()
        if not conn:
            logger.error("Erreur de connexion à la base de données")
            return jsonify({'success': False, 'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Vérifier si le stage existe
            cursor.execute("SELECT id FROM stages WHERE id = %s", (stage_id,))
            if not cursor.fetchone():
                return jsonify({'success': False, 'error': 'Stage non trouvé'}), 404
            
            # Mettre à jour le statut
            cursor.execute("""
            UPDATE stages 
            SET statut = %s 
            WHERE id = %s
            """, (statut, stage_id))
            
            conn.commit()
            affected_rows = cursor.rowcount
            
            if affected_rows == 0:
                return jsonify({'success': False, 'error': 'Aucun stage mis à jour'}), 404
            
            # Récupérer le stage mis à jour
            cursor.execute("""
            SELECT s.*, u.nom as etudiant_nom, u.email 
            FROM stages s
            JOIN users u ON s.id_etudiant = u.id
            WHERE s.id = %s
            """, (stage_id,))
            stage = cursor.fetchone()
            
            logger.info(f'Stage {stage_id} mis à jour avec statut: {statut}')
            
            return jsonify({
                'success': True,
                'message': f'Stage {statut} avec succès',
                'stage': stage
            }), 200
            
        except Error as e:
            conn.rollback()
            logger.error(f'Erreur lors de la mise à jour du stage: {e}')
            return jsonify({'success': False, 'error': f'Erreur lors de la mise à jour du stage: {str(e)}'}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f'Erreur inattendue lors de la mise à jour du stage: {e}')
        return jsonify({'success': False, 'error': 'Une erreur inattendue est survenue'}), 500
# Routes pour les statistiques
@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Récupère les statistiques des stages"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Statistiques globales
        cursor.execute("""
        SELECT 
            COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
            COUNT(CASE WHEN statut = 'valide' THEN 1 END) as valide,
            COUNT(CASE WHEN statut = 'refuse' THEN 1 END) as refuse,
            COUNT(*) as total
        FROM stages
        """)
        stats = cursor.fetchone()
        
        # Derniers stages
        cursor.execute("""
        SELECT s.*, u.nom as etudiant_nom
        FROM stages s
        JOIN users u ON s.id_etudiant = u.id
        ORDER BY s.date_declaration DESC
        LIMIT 5
        """)
        derniers_stages = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Formater les dates
        for stage in derniers_stages:
            stage['date_debut'] = format_date_for_json(stage['date_debut'])
            stage['date_fin'] = format_date_for_json(stage['date_fin'])
            stage['date_declaration'] = format_date_for_json(stage['date_declaration'])
        
        return jsonify({
            'stats': stats,
            'derniers_stages': derniers_stages
        }), 200
        
    except Error as e:
        logger.error(f'Erreur lors de la récupération des statistiques: {e}')
        return jsonify({'error': 'Erreur lors de la récupération des statistiques'}), 500

# Route pour les étudiants
@app.route('/api/etudiants', methods=['GET'])
def get_etudiants():
    """Récupère la liste des étudiants"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Erreur de connexion à la base de données'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nom, email, role 
            FROM users 
            WHERE role = 'etudiant'
            ORDER BY nom
        """)
        etudiants = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(etudiants), 200
        
    except Error as e:
        logger.error(f'Erreur lors de la récupération des étudiants: {e}')
        return jsonify({'error': 'Erreur lors de la récupération des données'}), 500

if __name__ == '__main__':
    # Configuration du serveur
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Lancement de l'application sur {host}:{port}")
    
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )






