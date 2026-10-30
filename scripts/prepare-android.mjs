import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const java = resolve(root, 'android/app/src/main/java/mg/libertelibre/app');
const activity = resolve(java, 'MainActivity.java');
if (!existsSync(activity)) throw new Error('Exécute npx cap add android avant npm run prepare:android.');
copyFileSync(resolve(root, 'native/android/DataExportPlugin.java'), resolve(java, 'DataExportPlugin.java'));
let source = readFileSync(activity, 'utf8');
if (!source.includes('registerPlugin(DataExportPlugin.class)')) {
  if (source.includes('void onCreate(')) {
    if (!source.includes('super.onCreate(savedInstanceState);')) throw new Error('MainActivity personnalisée : intégrer DataExport manuellement.');
    source = source.replace('super.onCreate(savedInstanceState);', 'registerPlugin(DataExportPlugin.class);\n        super.onCreate(savedInstanceState);');
  } else {
    source = source.replace(/extends BridgeActivity\s*\{/, `extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(DataExportPlugin.class);
        super.onCreate(savedInstanceState);
    }
`);
  }
  if (!source.includes('registerPlugin(DataExportPlugin.class)')) throw new Error('MainActivity non reconnue.');
  writeFileSync(activity, source);
}
const res = resolve(root, 'android/app/src/main/res');
for (const density of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']) {
  const dir = resolve(res, 'mipmap-' + density); mkdirSync(dir, {recursive:true});
  for (const name of ['ic_launcher','ic_launcher_round']) copyFileSync(resolve(root,'www/icon-512.png'), resolve(dir,name+'.png'));
}
mkdirSync(resolve(res,'drawable'),{recursive:true});
copyFileSync(resolve(root,'www/icon-512.png'),resolve(res,'drawable/liberte_icon.png'));
writeFileSync(resolve(res,'drawable/liberte_foreground.xml'), `<?xml version="1.0" encoding="utf-8"?>
<inset xmlns:android="http://schemas.android.com/apk/res/android" android:inset="0%"><bitmap android:src="@drawable/liberte_icon" android:gravity="fill" /></inset>`);
mkdirSync(resolve(res,'values'),{recursive:true});
writeFileSync(resolve(res,'values/liberte_colors.xml'), '<resources><color name="liberte_icon_background">#0B1B35</color></resources>');
mkdirSync(resolve(res,'mipmap-anydpi-v26'),{recursive:true});
for (const name of ['ic_launcher','ic_launcher_round']) writeFileSync(resolve(res,'mipmap-anydpi-v26',name+'.xml'), `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/liberte_icon_background"/><foreground android:drawable="@drawable/liberte_foreground"/></adaptive-icon>`);
console.log('Export Android et icônes Liberté intégrés.');

// Native speech engine and Android system authentication.
copyFileSync(resolve(root,'native/android/LibertyDevicePlugin.java'),resolve(java,'LibertyDevicePlugin.java'));
source=readFileSync(activity,'utf8');
if(!source.includes('registerPlugin(LibertyDevicePlugin.class)')){
 source=source.replace('super.onCreate(savedInstanceState);','registerPlugin(LibertyDevicePlugin.class);\n        super.onCreate(savedInstanceState);');
 writeFileSync(activity,source);
}
const gradle=resolve(root,'android/app/build.gradle');
let build=readFileSync(gradle,'utf8');
if(!build.includes('androidx.biometric:biometric:'))build+='\ndependencies { implementation "androidx.biometric:biometric:1.1.0" }\n';
build=build.replace(/versionCode\s+\d+/, 'versionCode 20261030').replace(/versionName\s+"[^"]+"/, 'versionName "1.3.0"');
writeFileSync(gradle,build);
const manifest=resolve(root,'android/app/src/main/AndroidManifest.xml');
let xml=readFileSync(manifest,'utf8');
if(!xml.includes('android.permission.USE_BIOMETRIC'))xml=xml.replace('</manifest>','<uses-permission android:name="android.permission.USE_BIOMETRIC"/>\n</manifest>');
if(!xml.includes('android.intent.action.TTS_SERVICE')){
 const query='<intent><action android:name="android.intent.action.TTS_SERVICE"/></intent>';
 xml=xml.includes('</queries>')?xml.replace('</queries>',query+'</queries>'):xml.replace('</manifest>','<queries>'+query+'</queries>\n</manifest>');
}
writeFileSync(manifest,xml);
