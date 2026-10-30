# Liberté Premium 1.3.0

- Accueil : bouton et curseur d’opacité retirés. Le réglage de l’image reste disponible dans Réglages.
- Historiques tabac et alcool : boutons Modifier retirés ; heures des cigarettes affichées en lecture seule. Aucune donnée historique supprimée.
- Réglages : carte Thèmes & polices visible en haut, 8 palettes, aperçu et enregistrement automatique. Deux familles intégrées hors ligne (Clarté et Élégance), avec poids normal et gras ; autres polices selon l’appareil.
- Icône : logo de la dernière version corrigée repris à l’identique depuis icon-512.png, pour l’interface et Android.
- Correction CI : import com.getcapacitor.PermissionState conservé dans la source native ET la copie Android. Test supplémentaire de concordance entre les deux fichiers.

## Mise à jour GitHub
Le contenu du dossier Lib-main doit être à la racine du dépôt.
Remplacer www/, android/, native/, scripts/, tests/, LICENSES/, package.json et package-lock.json.
Conserver votre dossier .github existant. Pour un nouveau dépôt, copier GITHUB_WORKFLOW_A_COPIER/build-apk.yml vers .github/workflows/build-apk.yml.
Ne pas copier seulement la classe dans android/ : la prochaine synchronisation la remplace depuis native/android/LibertyDevicePlugin.java.
Exporter une sauvegarde JSON avant la mise à jour. L’identifiant Android et la clé de stockage restent les mêmes.

## Validation
npm ci : réussi.
npm run sync : réussi.
node --test tests/*.test.cjs : 10 tests réussis, 0 échec, après synchronisation.
HTML autonome identique au HTML inclus dans Android ; icône identique au PNG de référence.
La compilation APK complète n’a pas été exécutée dans cet environnement. Le workflow fourni la réalise sur GitHub.
