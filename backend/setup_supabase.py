#!/usr/bin/env python3
"""
Setup script: Instructions pour créer les tables Supabase

L'API REST de Supabase ne peut pas exécuter du SQL arbitraire.
Ce script affiche les instructions pour créer les tables manuellement.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def read_schema():
    """Lire le fichier schema SQL"""
    schema_file = Path(__file__).parent / "supabase_schema.sql"
    if not schema_file.exists():
        print("❌ Fichier supabase_schema.sql non trouvé")
        return None
    return schema_file.read_text()

def show_instructions():
    """Afficher les instructions"""
    print("\n" + "="*70)
    print("🚀 CRÉATION DES TABLES SUPABASE")
    print("="*70)
    
    print("\n📋 ÉTAPES:")
    print("  1. Aller sur: https://app.supabase.com")
    print("  2. Sélectionner votre projet")
    print("  3. Aller à 'SQL Editor' (menu gauche)")
    print("  4. Cliquer 'New Query'")
    print("  5. Copier-coller le contenu ci-dessous")
    print("  6. Cliquer 'Run'")
    
    print("\n" + "-"*70)
    print("COPIER-COLLER CE SQL:")
    print("-"*70 + "\n")
    
    schema = read_schema()
    if schema:
        print(schema)
    
    print("\n" + "-"*70)
    print("FIN DU SQL À COPIER")
    print("-"*70 + "\n")
    
    print("✅ Après l'exécution du SQL dans Supabase Dashboard, lancez:")
    print("   python migrate_data.py --verify\n")
    print("="*70 + "\n")

def main():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not all([supabase_url, supabase_key]):
        print("❌ Erreur: Variables d'environnement manquantes")
        print("   Vérifiez que SUPABASE_URL et SUPABASE_ANON_KEY sont définis dans .env")
        return
    
    show_instructions()

if __name__ == "__main__":
    main()
