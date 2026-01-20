#!/usr/bin/env python3
"""
Script de vérification des tables Supabase

Cette application utilise Supabase (PostgreSQL).
Ce script vérifie que la connexion et toutes les tables sont correctement créées.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

try:
    import requests
except ImportError:
    print("❌ Erreur: requests n'est pas installé")
    print("   pip install requests")
    exit(1)


class SupabaseManager:
    """Gestionnaire REST pour Supabase"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase_url = supabase_url.rstrip('/')
        self.supabase_key = supabase_key
        self.headers = {
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "apikey": supabase_key
        }
    
    def verify_connection(self):
        """Vérifier la connexion à Supabase"""
        try:
            # Test simple en essayant d'accéder à une table
            url = f"{self.supabase_url}/rest/v1/campuses?select=id&limit=1"
            response = requests.get(url, headers=self.headers, timeout=5)
            if response.status_code in [200, 400]:
                print("✅ Connecté à Supabase")
                return True
            else:
                print(f"❌ Erreur de connexion: {response.status_code}")
                print(f"   Réponse: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return False
    
    def verify_tables(self):
        """Vérifier que toutes les tables existent"""
        print("\n🔍 Vérification des tables Supabase...\n")
        
        tables = [
            "campuses", "academic_years", "formations", "filieres", "levels",
            "classes", "subjects", "students", "professors", "professor_hours",
            "staff", "grades", "transactions", "archives", "student_absences", "users"
        ]
        
        success_count = 0
        for table in tables:
            try:
                # Essayer de compter les lignes - la table doit exister
                url = f"{self.supabase_url}/rest/v1/{table}?select=id&limit=1"
                response = requests.get(url, headers=self.headers, timeout=5)
                
                if response.status_code == 200:
                    print(f"  ✅ {table}")
                    success_count += 1
                elif response.status_code == 400:
                    # 400 peut signifier que la table n'existe pas
                    print(f"  ❌ {table}: Table non trouvée")
                else:
                    print(f"  ❌ {table}: Erreur {response.status_code}")
            except Exception as e:
                print(f"  ❌ {table}: {str(e)}")
        
        print(f"\n✅ {success_count}/{len(tables)} tables trouvées")
        return success_count == len(tables)


def main():
    """Fonction principale"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Gestionnaire Supabase")
    parser.add_argument("--verify", action="store_true", help="Vérifier les tables")
    
    args = parser.parse_args()
    
    # Récupérer les configurations
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not all([supabase_url, supabase_key]):
        print("❌ Erreur: Paramètres manquants")
        print("   Définissez SUPABASE_URL et SUPABASE_ANON_KEY dans .env")
        exit(1)
    
    manager = SupabaseManager(supabase_url, supabase_key)
    
    if not manager.verify_connection():
        exit(1)
    
    if args.verify:
        manager.verify_tables()
    else:
        print("\n💡 Utilisation:")
        print("   python migrate_data.py --verify")


if __name__ == "__main__":
    main()
