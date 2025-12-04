from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from pymongo import MongoClient, DESCENDING
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from datetime import datetime
import os
import bcrypt

# ================== CARREGAR VARIÁVEIS DE AMBIENTE ==================
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev')
CORS(app)

# ================== CONFIGURAÇÃO DO MONGODB ==================
class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.users = None
        self.connect()
    
    def connect(self):
        try:
            mongo_uri = os.getenv('MONGO_URI')
            if not mongo_uri:
                raise ValueError("MONGO_URI não definido no .env")
            
            self.client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=5000
            )
            
            # Testar conexão
            self.client.admin.command('ping')
            
            # Usar database
            db_name = os.getenv('DB_NAME', 'ofertmatch')
            self.db = self.client[db_name]
            self.users = self.db.users
            
            print(f"✅ MongoDB conectado: {db_name}")
            
        except Exception as e:
            print(f"❌ Falha na conexão MongoDB: {e}")
            self.client = None
            self.db = None
            self.users = None
    
    def is_connected(self):
        return self.users is not None

# Instância global
mongo = MongoDB()

# ================== FUNÇÕES AUXILIARES ==================
def serialize(doc):
    """Converte ObjectId para string."""
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def parse_pagination(req):
    """Lê page, limit e calcula skip para paginação."""
    try:
        page = max(1, int(req.args.get("page", 1)))
    except Exception:
        page = 1
    try:
        limit = max(1, min(100, int(req.args.get("limit", 10))))
    except Exception:
        limit = 10
    skip = (page - 1) * limit
    return page, limit, skip

def parse_query(req, fields):
    """Monta filtro de busca textual com parâmetro q."""
    q = (req.args.get("q") or "").strip()
    if not q:
        return {}
    # OR de regex nos campos passados
    return {"$or": [{f: {"$regex": q, "$options": "i"}} for f in fields]}

def gerar_hash_senha(senha_plana: str) -> str:
    """Gera hash seguro usando bcrypt."""
    return bcrypt.hashpw(senha_plana.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def conferir_senha(senha_plana: str, hash_armazenado: str) -> bool:
    """Compara a senha enviada com o hash salvo."""
    return bcrypt.checkpw(senha_plana.encode("utf-8"), hash_armazenado.encode("utf-8"))


# ================== PÁGINA INICIAL ==================
@app.route("/")
def index():
    return jsonify({"ok": True, "api": "OfertMatch API"})


# ================== CRUD USERS (CÓDIGO QUE JÁ EXISTIA) ==================

# CREATE - Criar usuário
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
            "created_at": datetime.utcnow()
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
        if 'age' in data and data['age'] is not None:
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

# ================== EMPRESAS (OFERTMATCH) ==================
@app.post("/api/empresas")
def criar_empresa():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    data = request.get_json(silent=True) or {}
    obrig = ["razao_social", "cnpj", "endereco", "email", "responsavel"]
    if not all(data.get(k) for k in obrig):
        return jsonify({"ok": False, "msg": "Campos obrigatórios faltando"}), 400

    if mongo.db.empresas.find_one({"cnpj": data["cnpj"]}):
        return jsonify({"ok": False, "msg": "CNPJ já cadastrado"}), 409

    # Atualiza com o horário atualizado o campo de update
    agora = datetime.utcnow()
    data["created_at"] = agora
    data["updated_at"] = agora

    ins = mongo.db.empresas.insert_one(data)
    return jsonify({"ok": True, "id": str(ins.inserted_id)}), 201

@app.get("/api/empresas")
def listar_empresas():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    page, limit, skip = parse_pagination(request)
    filtro = parse_query(request, ["razao_social", "cnpj", "endereco", "email", "responsavel"])
    total = mongo.db.empresas.count_documents(filtro)
    cur = mongo.db.empresas.find(filtro).sort("_id", DESCENDING).skip(skip).limit(limit)
    data = [serialize(x) for x in cur]
    return jsonify({"ok": True, "data": data, "pagination": {"page": page, "limit": limit, "total": total}})

@app.put("/api/empresas/<id>")
def atualizar_empresa(id):
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    data = request.get_json(silent=True) or {}
    if not ObjectId.is_valid(id):
        return jsonify({"ok": False, "msg": "ID inválido"}), 400
    
    # Atualiza apenas o updated_at
    data["updated_at"] = datetime.utcnow()

    res = mongo.db.empresas.update_one({"_id": ObjectId(id)}, {"$set": data})
    if res.matched_count == 0:
        return jsonify({"ok": False, "msg": "Empresa não encontrada"}), 404
    
    return jsonify({"ok": True, "msg": "Empresa atualizada"})

@app.delete("/api/empresas/<id>")
def deletar_empresa(id):
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    if not ObjectId.is_valid(id):
        return jsonify({"ok": False, "msg": "ID inválido"}), 400
    res = mongo.db.empresas.delete_one({"_id": ObjectId(id)})
    if res.deleted_count == 0:
        return jsonify({"ok": False, "msg": "Empresa não encontrada"}), 404
    return jsonify({"ok": True, "msg": "Empresa excluída"})

# ================== PRODUTOS (OFERTMATCH) ==================
@app.post("/api/produtos")
def criar_produto():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    data = request.get_json(silent=True) or {}
    obrig = ["nome", "codigo", "estoque", "categoria", "marca", "valor"]
    if not all(str(data.get(k, "")).strip() != "" for k in obrig):
        return jsonify({"ok": False, "msg": "Campos obrigatórios faltando"}), 400

    data["estoque"] = int(data.get("estoque", 0))
    data["valor"] = float(data.get("valor", 0))

    # Atualiza com o horário atualizado o campo de update
    agora = datetime.utcnow()
    data["created_at"] = agora
    data["updated_at"] = agora

    ins = mongo.db.produtos.insert_one(data)
    return jsonify({"ok": True, "id": str(ins.inserted_id)}), 201

@app.get("/api/produtos")
def listar_produtos():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    page, limit, skip = parse_pagination(request)
    filtro = parse_query(request, ["nome", "codigo", "categoria", "marca"])
    total = mongo.db.produtos.count_documents(filtro)
    cur = mongo.db.produtos.find(filtro).sort("_id", DESCENDING).skip(skip).limit(limit)
    data = [serialize(x) for x in cur]
    return jsonify({"ok": True, "data": data, "pagination": {"page": page, "limit": limit, "total": total}})

@app.put("/api/produtos/<id>")
def atualizar_produto(id):
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    data = request.get_json(silent=True) or {}
    if not ObjectId.is_valid(id):
        return jsonify({"ok": False, "msg": "ID inválido"}), 400
    
    # Atualiza apenas o updated_at
    data["updated_at"] = datetime.utcnow()

    res = mongo.db.produtos.update_one({"_id": ObjectId(id)}, {"$set": data})
    if res.matched_count == 0:
        return jsonify({"ok": False, "msg": "Produto não encontrado"}), 404
    return jsonify({"ok": True, "msg": "Produto atualizado"})

@app.delete("/api/produtos/<id>")
def deletar_produto(id):
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    if not ObjectId.is_valid(id):
        return jsonify({"ok": False, "msg": "ID inválido"}), 400
    res = mongo.db.produtos.delete_one({"_id": ObjectId(id)})
    if res.deleted_count == 0:
        return jsonify({"ok": False, "msg": "Produto não encontrado"}), 404
    return jsonify({"ok": True, "msg": "Produto excluído"})

# ================== OFERTAS (OFERTMATCH) ==================
@app.post("/api/ofertas")
def criar_oferta():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    data = request.get_json(silent=True) or {}
    obrig = ["produto", "marca", "codigo", "estoque", "categoria", "valor"]
    if not all(str(data.get(k, "")).strip() != "" for k in obrig):
        return jsonify({"ok": False, "msg": "Campos obrigatórios faltando"}), 400

    data["estoque"] = int(data.get("estoque", 0))
    data["valor"] = float(data.get("valor", 0))

    # Atualiza com o horário atualizado o campo de update
    agora = datetime.utcnow()
    data["created_at"] = agora
    data["updated_at"] = agora

    ins = mongo.db.ofertas.insert_one(data)
    return jsonify({"ok": True, "id": str(ins.inserted_id)}), 201

@app.get("/api/ofertas")
def listar_ofertas():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    page, limit, skip = parse_pagination(request)
    filtro = parse_query(request, ["produto", "marca", "codigo", "categoria"])
    total = mongo.db.ofertas.count_documents(filtro)
    cur = mongo.db.ofertas.find(filtro).sort("_id", DESCENDING).skip(skip).limit(limit)
    data = [serialize(x) for x in cur]
    return jsonify({"ok": True, "data": data, "pagination": {"page": page, "limit": limit, "total": total}})

@app.put("/api/ofertas/<id>")
def atualizar_oferta(id):
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    data = request.get_json(silent=True) or {}
    if not ObjectId.is_valid(id):
        return jsonify({"ok": False, "msg": "ID inválido"}), 400

    # Atualiza apenas o updated_at
    data["updated_at"] = datetime.utcnow()
    
    res = mongo.db.ofertas.update_one({"_id": ObjectId(id)}, {"$set": data})
    if res.matched_count == 0:
        return jsonify({"ok": False, "msg": "Oferta não encontrada"}), 404
    return jsonify({"ok": True, "msg": "Oferta atualizada"})

@app.delete("/api/ofertas/<id>")
def deletar_oferta(id):
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    if not ObjectId.is_valid(id):
        return jsonify({"ok": False, "msg": "ID inválido"}), 400
    res = mongo.db.ofertas.delete_one({"_id": ObjectId(id)})
    if res.deleted_count == 0:
        return jsonify({"ok": False, "msg": "Oferta não encontrada"}), 404
    return jsonify({"ok": True, "msg": "Oferta excluída"})

# ================== USUÁRIOS - REGISTER (OFERTMATCH) ==================

@app.post("/api/auth/register")
def register_user():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    data = request.get_json(silent=True) or {}

    obrig = ["email", "password", "cep", "estado", "endereco"]
    if not all(data.get(k) for k in obrig):
        return jsonify({"ok": False, "msg": "Campos obrigatórios faltando"}), 400

    email = data["email"].lower().strip()

    # Verifica se email já existe
    if mongo.db.auth_users.find_one({"email": email}):
        return jsonify({"ok": False, "msg": "Email já cadastrado"}), 409

    # Gerar bcrypt hash
    senha_hash = gerar_hash_senha(data["password"])

    user_doc = {
        "email": email,
        "password": senha_hash,  # <-- hash aqui!
        "cep": data["cep"],
        "estado": data["estado"],
        "endereco": data["endereco"],
        "autorizacao_dados": bool(data.get("autorizacao_dados", True)),
        "tipo": data.get("tipo", "usuario"),
        "created_at": datetime.utcnow(),
        "last_login": None
    }

    res = mongo.db.auth_users.insert_one(user_doc)

    return jsonify({"ok": True, "id": str(res.inserted_id)}), 201

# ================== USUÁRIOS - LOGIN (OFERTMATCH) ==================

@app.post("/api/auth/login")
def login_user():
    if not mongo.is_connected():
        return jsonify({"error": "Banco de dados não conectado"}), 500

    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").lower().strip()
    senha = data.get("password") or ""

    if not email or not senha:
        return jsonify({"ok": False, "msg": "Email e senha são obrigatórios"}), 400

    user = mongo.db.auth_users.find_one({"email": email})
    if not user:
        return jsonify({"ok": False, "msg": "Email ou senha inválidos"}), 401

    # Validar senha com bcrypt
    if not conferir_senha(senha, user["password"]):
        return jsonify({"ok": False, "msg": "Email ou senha inválidos"}), 401

    # Atualizar last_login
    mongo.db.auth_users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    return jsonify({
        "ok": True,
        "msg": "Login autorizado",
        "user_id": str(user["_id"]),
        "email": user["email"],
        "tipo": user.get("tipo", "usuario")
    })

# ================== HEALTHCHECK ==================
@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "ofertmatch-api"})

# ================== MAIN ==================
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
