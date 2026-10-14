package co.gemelosdelsol.juego;

import android.app.Activity;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/**
 * Contenedor del juego para Android.
 * Los archivos del juego (index.html, js, css...) viajan dentro del APK y se
 * muestran en pantalla completa. No usa internet: todo funciona sin conexión
 * y la partida se guarda en el almacenamiento privado de la app.
 */
public class MainActivity extends Activity {

    private static final String DOMINIO = "appassets.androidplatform.net";
    private static final String INICIO = "https://" + DOMINIO + "/assets/www/index.html";

    private WebView web;

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        setContentView(web);
        pantallaCompleta();

        WebSettings ajustes = web.getSettings();
        ajustes.setJavaScriptEnabled(true);
        ajustes.setDomStorageEnabled(true);           // aquí se guarda la partida
        ajustes.setMediaPlaybackRequiresUserGesture(false);
        ajustes.setAllowFileAccess(false);
        ajustes.setAllowContentAccess(false);
        ajustes.setSupportZoom(false);

        final WebViewAssetLoader cargador = new WebViewAssetLoader.Builder()
                .setDomain(DOMINIO)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView vista, WebResourceRequest pedido) {
                return cargador.shouldInterceptRequest(pedido.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView vista, WebResourceRequest pedido) {
                Uri uri = pedido.getUrl();
                return !DOMINIO.equals(uri.getHost()); // no se abren páginas externas
            }
        });

        if (estado != null) web.restoreState(estado);
        else web.loadUrl(INICIO);
    }

    // Oculta las barras del sistema para jugar en toda la pantalla.
    private void pantallaCompleta() {
        Window ventana = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            ventana.setDecorFitsSystemWindows(false);
            WindowInsetsController c = ventana.getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            ventana.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean tieneFoco) {
        super.onWindowFocusChanged(tieneFoco);
        if (tieneFoco) pantallaCompleta();
    }

    // El botón "atrás" del teléfono abre o cierra la pausa; en el título, sale del juego.
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.botonAtras ? window.botonAtras() : 'salir'", (respuesta) -> {
            if (respuesta != null && respuesta.contains("salir")) finish();
        });
    }

    @Override
    protected void onPause() {
        web.evaluateJavascript("window.alPausarApp && window.alPausarApp()", null);
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        pantallaCompleta();
        web.evaluateJavascript("window.alVolverApp && window.alVolverApp()", null);
    }

    @Override
    protected void onSaveInstanceState(Bundle estado) {
        super.onSaveInstanceState(estado);
        web.saveState(estado);
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
