# Liberté Premium 1.2.0 — 29 octobre 2026

## Corrections livrées
- Parcours, cycles et statistiques tabac / alcool séparés.
- Ressources communes classées par type ; catégories personnalisables.
- Protocoles affichés depuis la bibliothèque : modifications immédiatement répercutées.
- Textes complets et lecture avec cadence, boucle et arrêt dans chaque ressource.
- Ressources prédéfinies harmonisées ; textes personnels conservés.
- Suivi tabac : date conservée après enregistrement, notes et déclencheurs de la date choisie, modification de la date et de l’heure de chaque cigarette.
- Suivi alcool : correction, déplacement, suppression et recalcul de la dernière consommation.
- Logo croix / chaîne brisée dans l’interface, PWA et ressources Android.
- Masquer le texte conserve la hauteur du bloc photo ; réglage d’opacité directement à l’accueil.
- Versions HTML, npm et Android alignées sur 1.2.0 ; cache PWA renouvelé.

## Mettre à jour GitHub
Conserver le dossier .github déjà présent dans votre dépôt.
Remplacer les dossiers www/, android/, scripts/, tests/ ainsi que package.json et package-lock.json par ceux de cette archive.
Le contenu de Lib-main doit se trouver à la racine du dépôt, pas dans un sous-dossier supplémentaire.
Pour un nouveau dépôt, copier GITHUB_WORKFLOW_A_COPIER/build-apk.yml vers .github/workflows/build-apk.yml.
Le workflow installe les dépendances, exécute les tests, synchronise Android et construit l’APK debug.

## Données existantes
Avant la mise à jour, exporter une sauvegarde JSON depuis Données.
La version conserve la même clé de stockage et le même identifiant Android.
Si vous ouvrez le HTML sous un autre nom ou dans un autre navigateur, restaurer la sauvegarde JSON si les données n’apparaissent pas.

## Vérification et limites
npm ci et les 7 tests Node passent, avec assertions supplémentaires sur les dates, les protocoles, le logo et la conservation des personnalisations.
Synchronisation Capacitor effectuée. APK non compilé ici : l’environnement ne dispose pas du SDK Android / Java 21 requis.
La vérification visuelle dans Chromium n’a pas pu être réalisée : téléchargement du navigateur indisponible.
Gemini : le client et le serveur sécurisé sont fournis ; configurer et héberger le serveur selon gemini-backend/README.md. Aucune clé secrète n’est intégrée dans le HTML ou l’APK. Une connexion réelle à Gemini n’a pas été testée.

## Correctif build GitHub / Android — 29/10/2026
- Ajout de l'import Capacitor `com.getcapacitor.PermissionState` dans la source native `LibertyDevicePlugin.java` et dans la copie Android générée.
- Le correctif est conservé après `npm run sync`, car `scripts/prepare-android.mjs` recopie la source native corrigée.
- Ajout d'un test de non-régression Android pour détecter la disparition de cet import avant la compilation APK.
- Aucune permission microphone supplémentaire n'est demandée à l'utilisateur : l'application 1.2 n'enregistre pas le son et respecte le principe des permissions minimales.
