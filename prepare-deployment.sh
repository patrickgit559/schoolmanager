#!/bin/bash
# Script de préparation au déploiement

echo "🚀 Préparation au déploiement..."

# Vérifier Git
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé"
    exit 1
fi

echo "✅ Git vérifié"

# Initialiser Git si nécessaire
if [ ! -d .git ]; then
    echo "📝 Initialisation du repository Git..."
    git init
    git add .
    git commit -m "Initial commit: MongoDB to Supabase migration"
fi

# Afficher les instructions
echo ""
echo "════════════════════════════════════════════════"
echo "📋 PROCHAINES ÉTAPES :"
echo "════════════════════════════════════════════════"
echo ""
echo "1️⃣  GITHUB"
echo "   • Crée un repository: https://github.com/new"
echo "   • Puis execute:"
echo "     git remote add origin https://github.com/VOTRE_USERNAME/schoolmanager.git"
echo "     git branch -M main"
echo "     git push -u origin main"
echo ""
echo "2️⃣  RENDER.COM"
echo "   • Crée un compte: https://render.com"
echo "   • Connecte-toi avec GitHub"
echo "   • Clique 'New +' → 'Web Service'"
echo "   • Sélectionne ce repository"
echo ""
echo "3️⃣  VERCEL"
echo "   • Crée un compte: https://vercel.com"
echo "   • Connecte-toi avec GitHub"
echo "   • Clique 'Import Project'"
echo ""
echo "📖 Guide complet: DEPLOYMENT_GUIDE.md"
echo "════════════════════════════════════════════════"
echo ""
