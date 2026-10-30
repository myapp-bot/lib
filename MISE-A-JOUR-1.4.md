# Liberté Premium 1.4

Cette version conserve des parcours tabac et alcool distincts. La bibliothèque est partagée entre les deux parcours et ses contenus restent modifiables.

## Modifications

- Accueil : carrousel utilisant les deux images fournies. Les images entières s’ajustent au cadre, avec ou sans le texte d’accueil.
- Réglages : choix d’une ou de plusieurs images d’accueil. Le bouton « Suivante » apparaît lorsqu’au moins deux images sont sélectionnées.
- Suppression des réglages d’opacité et de chargement d’image obsolètes.
- Bibliothèque : deux guides du matin et du soir, utilisables avec la lecture vocale intégrée et modifiables comme les autres ressources.
- Protocoles : remplacement des textes de base par les sept protocoles express demandés.
- Navigation rapide : ordre aligné sur le volet gauche ; le raccourci Réglages est remplacé par Bibliothèque. Les parcours restent accessibles dans le volet et dans la barre rapide.
- Synchronisation Android après mise à jour des ressources web.

## Mise à jour GitHub

Le ZIP contient le projet Android complet. Extrais son dossier `Lib-main` dans ton dépôt en remplaçant les fichiers existants, puis envoie les modifications sur GitHub. Le workflow de compilation est fourni sous `GITHUB_WORKFLOW_A_COPIER/build-apk.yml` pour être copié dans `.github/workflows/build-apk.yml` de ton dépôt.

## Vérification

Les tests Node passent : 11 réussis, aucun échec. `npm run sync` a réussi et les fichiers web Android sont identiques au HTML source. L’APK n’a pas été compilé ici.
