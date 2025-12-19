import mysql.connector
from mysql.connector import errorcode

# Configuration de la connexion
host = "localhost"
user = "root"  # votre utilisateur MySQL
password = "votre mot de passe MySQL réel"
db_name = "gestion_stages"

try:
    # Connexion à MySQL
    conn = mysql.connector.connect(
        host=host,
        user=user,
        password=password
    )
    cursor = conn.cursor()
    print("Connexion réussie à MySQL !")
    
    # Optionnel : sélectionner la base de données si elle existe
    try:
        cursor.execute(f"USE {db_name}")
        print(f"Base de données '{db_name}' sélectionnée.")
    except mysql.connector.Error as err:
        print(f"Base de données '{db_name}' non trouvée : {err}")
        # Vous pouvez ajouter ici la création de la base si nécessaire
    
except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Erreur d'authentification : vérifiez vos identifiants")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print(f"Base de données '{db_name}' n'existe pas")
    else:
        print(f"Erreur de connexion : {err}")
    exit(1)

finally:
    # Fermeture propre de la connexion
    if 'cursor' in locals() and cursor is not None:
        cursor.close()
    if 'conn' in locals() and conn.is_connected():
        conn.close()
        print("Connexion fermée.")
