# Liberté Premium 1.4 — correctif GitHub Actions

Le workflow Android détecte maintenant le projet dans la racine du dépôt ou dans `Lib-main/`. S’il manque `package-lock.json`, il le génère depuis `package.json`, puis lance `npm ci`. Le fichier de remplacement dans l’archive est `GITHUB_WORKFLOW_A_COPIER/build-apk.yml`.

## Installation sur GitHub

Copie ce workflow dans `.github/workflows/build-apk.yml` du dépôt. Vérifie aussi que `package.json` et `package-lock.json` sont présents dans le même dossier de projet. Après un push, le workflow repère automatiquement la racine appropriée.

Le workflow a été vérifié localement pour sa syntaxe et le projet conserve le lockfile `npm` version 3. La compilation APK doit être confirmée par l’exécution GitHub Actions, car cet environnement n’a pas compilé l’APK.
