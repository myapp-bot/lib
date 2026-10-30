# Backend Gemini sécurisé pour Liberté

L’API Gemini est appelée uniquement depuis ce serveur Node.js. La clé Gemini et le code d’accès restent dans des variables d’environnement; ils ne sont pas inclus dans l’application, l’APK ou le dépôt.

## Démarrage local

1. Installer Node.js 20 ou plus.
2. Copier `.env.example` vers `.env`.
3. Créer une clé dans Google AI Studio, puis la mettre uniquement dans `GEMINI_API_KEY` du fichier `.env` local. Ne pas envoyer cette clé dans ChatGPT ni la publier sur GitHub.
4. Générer un code avec `openssl rand -hex 32` et le mettre dans `APP_ACCESS_TOKEN`.
5. Lancer `node gemini-backend/server.mjs` depuis la racine du projet.
6. Dans l’application, saisir `http://localhost:8787` et le même code. Pour l’APK, remplacer `localhost` par l’adresse HTTPS du serveur déployé.

## Déploiement

Déployer `server.mjs` sur un hébergement Node.js HTTPS. Ajouter `GEMINI_API_KEY`, `APP_ACCESS_TOKEN`, `ALLOWED_ORIGINS`, `GEMINI_MODEL`, `PER_IP_DAILY_LIMIT` et `GLOBAL_DAILY_LIMIT` dans les variables/secrets de l’hébergeur. `ALLOWED_ORIGINS` doit contenir l’origine web réelle et, pour Capacitor Android, `https://localhost` ou `capacitor://localhost` selon la configuration. Ne pas autoriser `*`.

Le serveur limite un message à 2 000 caractères, les réponses à 600 tokens, et l’usage à 12 appels par adresse IP et par jour et 50 appels par jour au total par défaut. Ces compteurs sont en mémoire et se réinitialisent si le processus redémarre; pour un service public, les remplacer par des compteurs persistants partagés et une authentification utilisateur.

L’application demande un consentement explicite avant tout envoi. Elle ne transmet ni historique, ni suivi de tabac/alcool, ni identité. Les messages sont conservés uniquement dans l’interface pendant la session.

L’offre gratuite Gemini est limitée et peut changer. Google indique que le contenu traité en offre gratuite peut servir à améliorer ses services. Pour éviter le basculement payant, utiliser une clé Google AI Studio d’un projet sans compte de facturation associé; les quotas gratuits peuvent toutefois être indisponibles ou épuisés. L’assistant ne remplace pas un professionnel de santé.
