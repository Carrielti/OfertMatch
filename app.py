from flask import Flask, jsonify, request, render_template
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
import os
from dotenv import load_dotenv
import datetime

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Configuração do MongoDB
class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.users = None
        self.connect()
    
    def connect(self):
        try:
            self.client = MongoClient(
                os.getenv('MONGO_URI'),
                serverSelectionTimeoutMS=5000
            )
            
            # Testar conexão
            self.client.admin.command('ping')
            
            # Usar database
            db_name = os.getenv('DB_NAME', 'test')
            self.db = self.client[db_name]
            self.users = self.db.users
            
            print(f" MongoDB conectado: {db_name}")
            
        except Exception as e:
            print(f" Falha na conexão MongoDB: {e}")
            self.client = None
            self.db = None
            self.users = None
    
    def is_connected(self):
        return self.users is not None

# Instância global
mongo = MongoDB()

# página HTML
@app.route('/')
def index():
    return render_template('index.html')

#CREATE - Criar usuário
@app.route('/api/users', methods=['POST'])
def create_user():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500
        
    try:
        data = request.get_json()
        
        # Validação
        if not data or 'name' not in data or 'email' not in data:
            return jsonify({"error": "Nome e email são obrigatórios"}), 400
        
        # Sanitização básica
        name = data['name'].strip()
        email = data['email'].strip().lower()
        age = data.get('age')
        
        if age:
            try:
                age = int(age)
            except ValueError:
                return jsonify({"error": "Idade deve ser um número"}), 400
        
        user = {
            "name": name,
            "email": email,
            "age": age,
            "created_at": datetime.datetime.utcnow()
        }
        
        result = mongo.users.insert_one(user)
        
        return jsonify({
            "message": "Usuário criado com sucesso!",
            "id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# READ - Listar todos os usuários
@app.route('/api/users', methods=['GET'])
def get_users():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500
        
    try:
        users = list(mongo.users.find().sort("created_at", -1))
        
        # Converter ObjectId para string
        for user in users:
            user['_id'] = str(user['_id'])
            user['created_at'] = user['created_at'].strftime("%d/%m/%Y %H:%M")
            
        return jsonify({
            "count": len(users),
            "users": users
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500
        
    try:
        user = mongo.users.find_one({"_id": ObjectId(user_id)})
        
        if user:
            user['_id'] = str(user['_id'])
            user['created_at'] = user['created_at'].strftime("%d/%m/%Y %H:%M")
            return jsonify(user)
        else:
            return jsonify({"error": "Usuário não encontrado"}), 404
            
    except InvalidId:
        return jsonify({"error": "ID inválido"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500
        
    try:
        data = request.get_json()
        
        
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name'].strip()
        if 'email' in data:
            update_data['email'] = data['email'].strip().lower()
        if 'age' in data and data['age']:
            try:
                update_data['age'] = int(data['age'])
            except ValueError:
                return jsonify({"error": "Idade deve ser um número"}), 400
        
        result = mongo.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count:
            return jsonify({"message": "Usuário atualizado com sucesso!"})
        else:
            return jsonify({"error": "Usuário não encontrado"}), 404
            
    except InvalidId:
        return jsonify({"error": "ID inválido"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500
        
    try:
        result = mongo.users.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count:
            return jsonify({"message": "Usuário deletado com sucesso!"})
        else:
            return jsonify({"error": "Usuário não encontrado"}), 404
            
    except InvalidId:
        return jsonify({"error": "ID inválido"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)