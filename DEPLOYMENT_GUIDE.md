# 🚀 Guide de Déploiement Complet - SUP'INTER

## ✅ Prérequis
- Compte **GitHub** (gratuit)
- Compte **Render.com** (gratuit)
- Compte **Vercel** (gratuit)
- Supabase est déjà configuré ✅

---

## 📋 ÉTAPE 1 : Préparer GitHub

### 1.1 Créer un repository GitHub
1. Va sur https://github.com/new
2. Nom du repo : `schoolmanager`
3. Description : `SUP'INTER University Management System`
4. Rends-le **Public** (gratuit)
5. Clique **"Create repository"**

### 1.2 Pusher ton code sur GitHub
```powershell
cd C:\Users\acer\Downloads\schoolmanager-main
git init
git add .
git commit -m "Initial commit: MongoDB to Supabase migration"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/schoolmanager.git
git push -u origin main
```

⚠️ **Remplace `VOTRE_USERNAME` par ton username GitHub !**

---

## 🔧 ÉTAPE 2 : Déployer le Backend sur Render.com

### 2.1 Créer un compte Render
1. Va sur https://render.com
2. Clique **"Sign up"**
3. Connecte-toi avec GitHub

### 2.2 Déployer l'API
1. Sur le dashboard Render, clique **"New +"** → **"Web Service"**
2. Sélectionne ton repository GitHub `schoolmanager`
3. Remplis les champs :
   - **Name** : `schoolmanager-api`
   - **Branch** : `main`
   - **Runtime** : `Python 3`
   - **Build Command** : `pip install -r backend/requirements-prod.txt`
   - **Start Command** : `cd backend && uvicorn server:app --host 0.0.0.0 --port 8000`
   - **Plan** : `Free`

4. Clique **"Create Web Service"**

### 2.3 Ajouter les variables d'environnement
1. Dans Render, va à **Settings** de ton service
2. Scroll jusqu'à **"Environment"**
3. Ajoute ces variables :
   ```
   SUPABASE_URL=https://ydfpjxphqzqcebxvgikm.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT_SECRET=EVutw93Fip_TisanIcs1A-f4F1vRdJ6hbn4eALw9PIA
   CORS_ORIGINS=https://VOTRE_VERCEL_DOMAIN.vercel.app,http://localhost:3000
   ```

4. Clique **"Save"**

Le déploiement commence automatiquement ✅

**Ton API sera accessible à** : `https://schoolmanager-api.onrender.com`

---

## 🎨 ÉTAPE 3 : Déployer le Frontend sur Vercel

### 3.1 Configurer le frontend
Avant de déployer, modifie le fichier de configuration :

Édite `frontend/src/lib/api.js` :
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://schoolmanager-api.onrender.com/api';
```

Crée un fichier `.env.production` dans `frontend/` :
```
REACT_APP_API_URL=https://schoolmanager-api.onrender.com/api
```

### 3.2 Créer un compte Vercel
1. Va sur https://vercel.com
2. Clique **"Sign Up"**
3. Connecte-toi avec GitHub

### 3.3 Importer et déployer
1. Clique **"Import Project"**
2. Sélectionne ton repository `schoolmanager`
3. Remplis les champs :
   - **Project Name** : `schoolmanager-app`
   - **Framework** : `Create React App`
   - **Root Directory** : `frontend`

4. Ajoute les variables d'environnement :
   ```
   REACT_APP_API_URL=https://schoolmanager-api.onrender.com/api
   ```

5. Clique **"Deploy"**

**Ton app sera accessible à** : `https://schoolmanager-app.vercel.app`

---

## ✅ Étapes Finales

### 4.1 Mettre à jour CORS
1. Va sur Render → Settings de ton API
2. Modifie `CORS_ORIGINS` :
   ```
   https://schoolmanager-app.vercel.app,http://localhost:3000
   ```

### 4.2 Tester l'application
1. Ouvre https://schoolmanager-app.vercel.app
2. Crée un utilisateur → `/register`
3. Connecte-toi → `/login`
4. Teste les fonctionnalités

### 4.3 Voir les logs (Debugging)
**Backend (Render)** :
- Dashboard Render → Web Service → Logs

**Frontend (Vercel)** :
- Dashboard Vercel → Deployments → voir les logs

---

## 🔐 Variables d'environnement à utiliser

### Backend (.env sur Render)
```
SUPABASE_URL=https://ydfpjxphqzqcebxvgikm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZnBqeHBocXpxY2VieHZnaWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODM3MDEsImV4cCI6MjA4NDQ1OTcwMX0.RAfJ-9a5evaceK41lW71LdNYp_vS7q5IdD8iG1qpGKU
JWT_SECRET=EVutw93Fip_TisanIcs1A-f4F1vRdJ6hbn4eALw9PIA
CORS_ORIGINS=https://schoolmanager-app.vercel.app
```

### Frontend (.env.production sur Vercel)
```
REACT_APP_API_URL=https://schoolmanager-api.onrender.com/api
```

---

## 🆘 Troubleshooting

### "Build failed on Render"
- Vérifie que `requirements-prod.txt` est dans le dossier `backend/`
- Vérifie le **Build Command** : `pip install -r backend/requirements-prod.txt`

### "CORS Error"
- Ajoute l'URL Vercel dans `CORS_ORIGINS` sur Render
- Utilise les variables correctes

### "API not responding"
- Vérifie les **Logs** sur Render
- Assure-toi que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont correctes

---

## 📊 Coûts
- **Render.com** : Gratuit (avec limitation)
- **Vercel** : Gratuit (avec limitation)
- **Supabase** : Gratuit jusqu'à 500 MB

Total : **$0 pour débuter** 🎉

---

## 🎯 Prochaines étapes
1. ✅ Tester en production
2. ✅ Configurer un domaine personnalisé
3. ✅ Mettre en place des backups automatiques
4. ✅ Ajouter monitoring et alertes

Besoin d'aide ? Je suis là ! 👍
