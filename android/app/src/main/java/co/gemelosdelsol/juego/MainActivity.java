package co.gemelosdelsol.juego;

import android.app.Activity;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
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

    // ------------------------------------------------------------------
    // MANDOS BLUETOOTH (8BitDo, Xbox, PlayStation, controles Android...)
    // Android entrega los botones del mando como "teclas". Aquí se traducen
    // a los botones del juego y se envían a JavaScript (G.entrada.mandoNativo).
    // Así funcionan junto con los botones táctiles de la pantalla.
    // ------------------------------------------------------------------
    private static String botonDeTecla(int codigo) {
        switch (codigo) {
            case KeyEvent.KEYCODE_BUTTON_A:
            case KeyEvent.KEYCODE_DPAD_CENTER:
                return "a";       // A / Cruz: confirmar, hablar, golpe preciso
            case KeyEvent.KEYCODE_BUTTON_B:
                return "b";       // B / Círculo: cancelar, cerbatana o rugido
            case KeyEvent.KEYCODE_BUTTON_X:
            case KeyEvent.KEYCODE_BUTTON_Y:
            case KeyEvent.KEYCODE_BUTTON_L1:
            case KeyEvent.KEYCODE_BUTTON_R1:
                return "x";       // X / Y / gatillos: cambiar de líder
            case KeyEvent.KEYCODE_BUTTON_START:
            case KeyEvent.KEYCODE_BUTTON_SELECT:
            case KeyEvent.KEYCODE_MENU:
                return "pausa";   // Start / Select: menú de pausa
            case KeyEvent.KEYCODE_DPAD_UP:
                return "arriba";
            case KeyEvent.KEYCODE_DPAD_DOWN:
                return "abajo";
            case KeyEvent.KEYCODE_DPAD_LEFT:
                return "izquierda";
            case KeyEvent.KEYCODE_DPAD_RIGHT:
                return "derecha";
            default:
                return null;
        }
    }

    private static boolean esMando(int fuente) {
        return (fuente & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD
                || (fuente & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK
                || (fuente & InputDevice.SOURCE_DPAD) == InputDevice.SOURCE_DPAD;
    }

    private void enviarBoton(String boton, boolean presionado) {
        web.evaluateJavascript("window.G && G.entrada && G.entrada.mandoNativo('" + boton + "'," + presionado + ")", null);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent evento) {
        String boton = botonDeTecla(evento.getKeyCode());
        if (boton != null && esMando(evento.getSource())) {
            if (evento.getRepeatCount() == 0) {
                if (evento.getAction() == KeyEvent.ACTION_DOWN) enviarBoton(boton, true);
                else if (evento.getAction() == KeyEvent.ACTION_UP) enviarBoton(boton, false);
            }
            return true;
        }
        return super.dispatchKeyEvent(evento);
    }

    // Palanca analógica y cruceta "sombrero" (algunos mandos la mandan como eje).
    private final boolean[] direcciones = new boolean[4]; // arriba, abajo, izquierda, derecha
    private static final String[] NOMBRES_DIR = {"arriba", "abajo", "izquierda", "derecha"};

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent evento) {
        if (esMando(evento.getSource()) && evento.getAction() == MotionEvent.ACTION_MOVE) {
            float x = evento.getAxisValue(MotionEvent.AXIS_X);
            float y = evento.getAxisValue(MotionEvent.AXIS_Y);
            float hx = evento.getAxisValue(MotionEvent.AXIS_HAT_X);
            float hy = evento.getAxisValue(MotionEvent.AXIS_HAT_Y);
            if (Math.abs(hx) > Math.abs(x)) x = hx;
            if (Math.abs(hy) > Math.abs(y)) y = hy;
            boolean[] ahora = {y < -0.5f, y > 0.5f, x < -0.5f, x > 0.5f};
            for (int i = 0; i < 4; i++) {
                if (ahora[i] != direcciones[i]) {
                    direcciones[i] = ahora[i];
                    enviarBoton(NOMBRES_DIR[i], ahora[i]);
                }
            }
            return true;
        }
        return super.dispatchGenericMotionEvent(evento);
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
