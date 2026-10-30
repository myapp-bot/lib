package mg.libertelibre.app;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

@CapacitorPlugin(name = "LibertyDevice")
public class LibertyDevicePlugin extends Plugin {
    private TextToSpeech tts;
    private boolean ready = false;
    private String text = "";
    private int offset = 0, chunkStart = 0, chunkEnd = 0;
    private boolean paused = false;
    private boolean loop = false;
    private volatile int generation = 0;
    private float rate = .75f;
    private boolean authenticating = false;

    @Override public void load() {
        getActivity().runOnUiThread(() -> {
            tts = new TextToSpeech(getContext(), status -> getActivity().runOnUiThread(() -> {
                if (status != TextToSpeech.SUCCESS) return;
                int language = tts.setLanguage(Locale.FRANCE);
                ready = true;
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    public void onStart(String id) { }
                    public void onDone(String id) { getActivity().runOnUiThread(() -> {
                        if (!id.equals(Integer.toString(generation)) || paused) return;
                        offset = chunkEnd;
                        if (offset < text.length()) play(); else if (loop) { offset = 0; play(); } else emit("Lecture terminée.");
                    }); }
                    public void onError(String id) { if(id.equals(Integer.toString(generation))) emit("Lecture impossible. Vérifie les voix françaises et le volume multimédia."); }
                    @Override public void onRangeStart(String id, int start, int end, int frame) {
                        getActivity().runOnUiThread(() -> { if(id.equals(Integer.toString(generation))) offset = chunkStart + start; });
                    }
                });
            }));
        });
    }
    private void emit(String message) { JSObject result = new JSObject(); result.put("message", message); notifyListeners("speechState", result); }
    private void play() {
        if (offset >= text.length()) { emit("Lecture terminée."); return; }
        chunkStart = offset;
        chunkEnd = Math.min(text.length(), chunkStart + 1500);
        if(chunkEnd < text.length()) { int space = text.lastIndexOf(' ',chunkEnd); if(space > chunkStart) chunkEnd = space + 1; }
        tts.setSpeechRate(rate);
        int result = tts.speak(text.substring(chunkStart, chunkEnd), TextToSpeech.QUEUE_FLUSH, null, Integer.toString(++generation));
        if(result == TextToSpeech.ERROR) emit("Lecture impossible. Vérifie la synthèse vocale Android.");
    }
    @PluginMethod public void speak(PluginCall call) { getActivity().runOnUiThread(() -> {
        if (!ready) { call.reject("Voix française indisponible ou en cours de chargement. Réessaie ou installe une voix française dans les paramètres Android."); return; }
        int languageResult = tts.setLanguage(Locale.forLanguageTag(call.getString("language", "fr-FR")));
        if(languageResult == TextToSpeech.LANG_MISSING_DATA || languageResult == TextToSpeech.LANG_NOT_SUPPORTED) { call.reject("Voix demandée indisponible. Installe une voix compatible dans les paramètres Android."); return; }
        String value = call.getString("text", "");
        if(value.trim().isEmpty()) { call.reject("Aucun texte à lire."); return; }
        ++generation; tts.stop(); text = value; offset = 0; paused = false;
        rate = Math.max(.55f, Math.min(1.2f, call.getFloat("rate", .75f)));
        loop = call.getBoolean("loop", false);
        play(); call.resolve();
    }); }
    @PluginMethod public void setLoop(PluginCall call) { getActivity().runOnUiThread(() -> { loop = call.getBoolean("enabled", false); call.resolve(); }); }
    @PluginMethod public void pause(PluginCall call) { getActivity().runOnUiThread(() -> { paused = true; ++generation; if(tts != null) tts.stop(); call.resolve(); }); }
    @PluginMethod public void resume(PluginCall call) { getActivity().runOnUiThread(() -> { if(ready && paused) { paused = false; play(); } call.resolve(); }); }
    @PluginMethod public void stop(PluginCall call) { getActivity().runOnUiThread(() -> { ++generation; paused = false; loop = false; text = ""; offset = 0; if(tts != null) tts.stop(); call.resolve(); }); }

    @PluginMethod public void authenticate(PluginCall call) { getActivity().runOnUiThread(() -> {
        if(authenticating) {call.reject("Authentification déjà en cours."); return;}
        int allowed = BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
        if(BiometricManager.from(getContext()).canAuthenticate(allowed) != BiometricManager.BIOMETRIC_SUCCESS) {
            call.reject("Configure une empreinte, un visage ou un PIN de verrouillage dans les paramètres Android."); return;
        }
        authenticating = true;
        BiometricPrompt prompt = new BiometricPrompt(getActivity(), ContextCompat.getMainExecutor(getContext()), new BiometricPrompt.AuthenticationCallback() {
            @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) { authenticating = false; call.resolve(); }
            @Override public void onAuthenticationError(int code, CharSequence message) { authenticating = false; call.reject(message.toString()); }
        });
        boolean malagasy = "mg".equals(call.getString("language", "fr"));
        try { prompt.authenticate(new BiometricPrompt.PromptInfo.Builder().setTitle(malagasy ? "Sokafy ny Liberté" : "Déverrouiller Liberté")
            .setSubtitle(malagasy ? "Biometrika na kaody hidin’ny telefaonina" : "Biométrie ou code de verrouillage du téléphone")
            .setAllowedAuthenticators(allowed).build()); }
        catch(Exception e) { authenticating = false; call.reject("Authentification indisponible.", e); }
    }); }
    @Override protected void handleOnDestroy() { if(tts != null) { tts.stop(); tts.shutdown(); } }
}
