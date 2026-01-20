# Utiliser l'image Python officielle
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier requirements.txt
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY . .

# Exposer le port
EXPOSE 8000

# Commande pour démarrer l'application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
