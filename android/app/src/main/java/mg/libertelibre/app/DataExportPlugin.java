package mg.libertelibre.app;

import android.app.Activity;
import android.content.Intent;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "DataExport")
public class DataExportPlugin extends Plugin {
    private boolean saving = false;

    @PluginMethod
    public void save(PluginCall call) {
        if (saving) { call.reject("Un export est déjà en cours."); return; }
        if (call.getString("content") == null || call.getString("name") == null) {
            call.reject("Contenu ou nom de fichier manquant."); return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveToBackupFolder(call);
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(call.getString("mimeType", "application/json"));
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("name"));
        saving = true;
        try { startActivityForResult(call, intent, "fileSelected"); }
        catch (Exception e) { saving = false; call.reject("Impossible d’ouvrir le sélecteur de fichiers.", e); }
    }


    private void saveToBackupFolder(PluginCall call) {
        String requestedName = call.getString("name", "liberte-backup.json");
        String mime = call.getString("mimeType", "application/json");
        String relativePath = Environment.DIRECTORY_DOWNLOADS + "/Backup/";
        Uri collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        String name = uniqueName(collection, relativePath, requestedName);
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri item = null;
        try {
            item = getContext().getContentResolver().insert(collection, values);
            if (item == null) throw new java.io.IOException("Impossible de créer le fichier dans Download/Backup.");
            try (OutputStream output = getContext().getContentResolver().openOutputStream(item, "w")) {
                if (output == null) throw new java.io.IOException("Destination inaccessible.");
                output.write(call.getString("content", "").getBytes(StandardCharsets.UTF_8));
                output.flush();
            }
            ContentValues ready = new ContentValues();
            ready.put(MediaStore.MediaColumns.IS_PENDING, 0);
            getContext().getContentResolver().update(item, ready, null, null);
            JSObject response = new JSObject();
            response.put("cancelled", false);
            response.put("defaultLocation", true);
            response.put("path", "Download/Backup/" + name);
            call.resolve(response);
        } catch (Exception error) {
            if (item != null) getContext().getContentResolver().delete(item, null, null);
            call.reject("Enregistrement impossible dans Download/Backup. Vérifie l’espace disponible.", error);
        }
    }

    private String uniqueName(Uri collection, String relativePath, String requestedName) {
        String candidate = requestedName;
        String base = requestedName;
        String extension = "";
        int dot = requestedName.lastIndexOf('.');
        if (dot > 0) { base = requestedName.substring(0, dot); extension = requestedName.substring(dot); }
        String[] projection = {MediaStore.MediaColumns.DISPLAY_NAME};
        for (int index = 1; index < 1000; index++) {
            try (Cursor cursor = getContext().getContentResolver().query(collection, projection,
                MediaStore.MediaColumns.RELATIVE_PATH + "=? AND " + MediaStore.MediaColumns.DISPLAY_NAME + "=?",
                new String[]{relativePath, candidate}, null)) {
                if (cursor == null || !cursor.moveToFirst()) return candidate;
            } catch (Exception ignored) { return candidate; }
            candidate = base + "_" + index + extension;
        }
        return base + "_" + System.currentTimeMillis() + extension;
    }

    @ActivityCallback
    private void fileSelected(PluginCall call, ActivityResult result) {
        saving = false;
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK) {
            JSObject response = new JSObject();
            response.put("cancelled", true); call.resolve(response); return;
        }
        Intent data = result.getData();
        if (data == null || data.getData() == null) { call.reject("Aucun fichier sélectionné."); return; }
        try (OutputStream output = getContext().getContentResolver().openOutputStream(data.getData(), "wt")) {
            if (output == null) throw new java.io.IOException("Destination inaccessible");
            output.write(call.getString("content", "").getBytes(StandardCharsets.UTF_8));
            output.flush();
        } catch (Exception e) { call.reject("Enregistrement impossible. Vérifie l’espace disponible et la destination.", e); return; }
        JSObject response = new JSObject();
        response.put("cancelled", false); call.resolve(response);
    }
}
