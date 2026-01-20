# Migration MongoDB → Supabase (PostgreSQL)

## Résumé des changements

Ce document décrit la migration complète du backend de MongoDB vers Supabase (PostgreSQL).

## Modifications apportées

### 1. **Dépendances (requirements.txt)**
- ❌ Supprimé: `motor==3.3.0` (async MongoDB driver)
- ❌ Supprimé: `pymongo==4.5.0` (MongoDB driver)
- ✅ Ajouté: `supabase==2.0.0` (Supabase Python client)

### 2. **Initialisation de la base de données (server.py)**

**Avant (MongoDB):**
```python
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
```

**Après (Supabase/PostgreSQL):**
```python
from supabase import create_client, Client

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
```

### 3. **Schéma de base de données**

Le fichier `supabase_schema.sql` contient la définition complète du schéma PostgreSQL avec:

- **Tables principales:**
  - `users` - Utilisateurs du système
  - `campuses` - Campus (emplacements)
  - `academic_years` - Années académiques
  - `formations` - Formations (BTS, DUT, LICENCE, etc.)
  - `filieres` - Filières d'études
  - `levels` - Niveaux académiques
  - `classes` - Classes
  - `subjects` - Matières/Sujets
  - `students` - Étudiants
  - `professors` - Professeurs
  - `professor_hours` - Heures de cours des professeurs
  - `staff` - Personnel
  - `grades` - Notes/Grades
  - `transactions` - Transactions financières
  - `archives` - Archives de documents
  - `student_absences` - Absences d'étudiants

- **Table de liaison:**
  - `filiere_formations` - Relation many-to-many entre filières et formations

### 4. **Conversions des opérations de base de données**

#### Opération: INSERT (Créer)

**MongoDB:**
```python
await db.users.insert_one(user_doc)
```

**Supabase:**
```python
response = supabase.table('users').insert(user_doc).execute()
if not response.data:
    raise HTTPException(status_code=400, detail="Erreur")
```

#### Opération: SELECT (Lire)

**MongoDB:**
```python
user = await db.users.find_one({"id": user_id}, {"_id": 0})
users = await db.users.find({}, {"_id": 0}).to_list(100)
```

**Supabase:**
```python
response = supabase.table('users').select('*').eq('id', user_id).execute()
user = response.data[0] if response.data else None
response = supabase.table('users').select('*').execute()
users = response.data
```

#### Opération: UPDATE (Mettre à jour)

**MongoDB:**
```python
await db.users.update_one({"id": user_id}, {"$set": update_data})
```

**Supabase:**
```python
supabase.table('users').update(update_data).eq('id', user_id).execute()
```

#### Opération: DELETE (Supprimer)

**MongoDB:**
```python
await db.users.delete_one({"id": user_id})
```

**Supabase:**
```python
supabase.table('users').delete().eq('id', user_id).execute()
```

### 5. **Filtrage et requêtes avancées**

**Supabase Query Builder:**
```python
# Égalité
query = supabase.table('students').select('*').eq('campus_id', campus_id)

# Chaînes (IN)
query = supabase.table('formations').select('*').in_('id', formation_ids)

# Tri
response = query.order('created_at', desc=True).execute()

# Comparaison
query = query.gt('tuition_paid', 0)  # Greater than
query = query.lt('tuition_amount', 100000)  # Less than
```

### 6. **Requêtes relationnelles**

Lors de la migration de MongoDB (documents imbriqués) vers PostgreSQL (tables normalisées), les requêtes relationnelles nécessitent maintenant des joins explicites:

**MongoDB:**
```python
student = await db.students.find_one({"id": student_id})
# Toutes les données sont dans un seul document
```

**Supabase:**
```python
student_response = supabase.table('students').select('*').eq('id', student_id).execute()
if student_response.data:
    student = student_response.data[0]
    # Récupérer les données liées
    formation_response = supabase.table('formations').select('*').eq('id', student['formation_id']).execute()
    formation = formation_response.data[0] if formation_response.data else None
```

### 7. **Relations Many-to-Many**

**Filieres ↔ Formations:**

Table de liaison: `filiere_formations(filiere_id, formation_id)`

```python
# Créer une relation
supabase.table('filiere_formations').insert({
    "filiere_id": filiere_id,
    "formation_id": formation_id
}).execute()

# Récupérer les formations d'une filière
ff_response = supabase.table('filiere_formations').select('formation_id').eq('filiere_id', filiere_id).execute()
formation_ids = [ff['formation_id'] for ff in ff_response.data]

formations_response = supabase.table('formations').select('*').in_('id', formation_ids).execute()
formations = formations_response.data
```

## Instructions de configuration

### 1. **Créer un projet Supabase**
- Allez sur https://supabase.com
- Créez un nouveau projet
- Attendez l'initialisation

### 2. **Créer le schéma de base de données**
- Dans le tableau de bord Supabase, allez à "SQL Editor"
- Créez une nouvelle requête
- Copiez-collez le contenu de `supabase_schema.sql`
- Exécutez la requête

### 3. **Configurer les variables d'environnement**
```bash
# Copier .env.example en .env
cp .env.example .env

# Éditer .env et ajouter:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-supabase
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000
```

Vous pouvez trouver `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans:
- Supabase Dashboard → Settings → API

### 4. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

### 5. **Exécuter le serveur**
```bash
uvicorn server:app --reload
```

## Avantages de la migration

1. **PostgreSQL:**
   - Base de données relationnelle puissante
   - Meilleure performance pour les queries complexes
   - Transactions ACID guaranties
   - Scalabilité horizontale avec Supabase

2. **Supabase:**
   - Backend complet et gratuit
   - Authentification intégrée (futur)
   - Stockage de fichiers intégré
   - Temps réel avec WebSocket
   - Interface d'administration intuitive
   - API REST et GraphQL automatique

3. **Sécurité:**
   - Row Level Security (RLS) pour PostgreSQL
   - Contrôle d'accès granulaire
   - Chiffrement des données en transit et au repos

## Considérations de performance

### Optimisations apportées:

1. **Indexes:**
   - Sur les colonnes fréquemment recherchées
   - Sur les clés étrangères
   - Définis dans `supabase_schema.sql`

2. **Requêtes groupées:**
   - Utilisation de `.select()` avec filtres
   - Éviter les requêtes N+1 quand c'est possible

3. **Pagination:**
   - À implémenter avec `.limit()` et `.offset()`
   - Important pour les grandes tables

### Recommandations:

```python
# ✅ BON: Récupérer seulement les colonnes nécessaires
response = supabase.table('students').select('id, first_name, last_name, matricule').eq('class_id', class_id).execute()

# ❌ MAUVAIS: Récupérer toutes les colonnes
response = supabase.table('students').select('*').execute()
```

## Migration des données (si existantes)

Si vous aviez déjà des données dans MongoDB, vous pouvez les exporter et importer dans Supabase:

1. **Exporter de MongoDB:**
```bash
mongoexport --uri "mongodb://..." --collection users --out users.json
```

2. **Transformer le format:**
- MongoDB utilise `_id`, PostgreSQL n'a pas besoin
- Adapter les types de données si nécessaire

3. **Importer dans Supabase:**
- Utiliser le CSV ou JSON import dans l'interface Supabase
- Ou utiliser les APIs Supabase pour importer

## Prochaines étapes

- [ ] Implémenter la pagination pour les grandes listes
- [ ] Ajouter des indexes supplémentaires pour les requêtes fréquentes
- [ ] Implémenter les requêtes de recherche (full-text search)
- [ ] Configurer les Row Level Security (RLS) pour plus de sécurité
- [ ] Implémenter les webhooks pour les événements asynchrones
- [ ] Ajouter des triggers PostgreSQL si nécessaire
- [ ] Configurer les sauvegardes automatiques

## Support et problèmes courants

### Erreur: "SUPABASE_URL not found"
- Vérifiez que les variables d'environnement sont définies dans `.env`
- Redémarrez le serveur après modification de `.env`

### Erreur: "42P07: relation already exists"
- Le schéma a déjà été créé
- Supprimez les tables manuellement si nécessaire, puis recréez

### Performance lente
- Vérifiez les indexes
- Utilisez le Query Planner de Supabase pour analyser les requêtes
- Envisagez d'ajouter de nouveaux indexes

## Ressources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
