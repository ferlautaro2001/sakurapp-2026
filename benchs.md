```text
================================================================================
                    BENCHMARKS DE RENDIMIENTO Y OPTIMIZACIÓN
                                 SAKURAPP 2026
================================================================================

[1] BASELINE INICIAL (PRE-OPTIMIZACIÓN)
--------------------------------------------------------------------------------
• Build inicial de producción:
  - Initial JS (main):               1,055.00 KB (Raw)  | 275.30 KB (Gzip)
  - Initial CSS (styles):              409.21 KB (Raw)  |  34.33 KB (Gzip)
  - Total Transferencia Inicial:     1,490.00 KB (Raw)  | 309.63 KB (Gzip)
  - Build Time:                      25.49 s

• Métricas de Carga & Core Web Vitals (Dev Server :4200 / Login):
  - DOMContentLoaded:                312 ms
  - Page Load Time:                  680 ms
  - FCP (First Contentful Paint):    380 ms
  - LCP (Largest Contentful Paint):  620 ms
  - Total Network Requests (Login):  18 requests
  - Total Transferred (Login):       1.84 MB

• Diagnóstico de Cuellos de Botella:
  - Componentes sin OnPush:          2 componentes (reservas cliente / reservas dueño)
  - Dependencias pesadas en Main:    FacturaService y jsPDF referenciados en AppComponent
  - Assets de Audio:                 Precarga inmediata de 110 KB de MP3s en el constructor de SonidoService
  - Fuentes externas (Google Fonts): Render-blocking CSS con display:block en Material Symbols

--------------------------------------------------------------------------------
[2] OPTIMIZACIONES REALIZADAS (POST-OPTIMIZACIÓN)
--------------------------------------------------------------------------------
1. Renders Innecesarios & Change Detection:
   • Migración a ChangeDetectionStrategy.OnPush en todos los componentes restantes.
   • Aislado del árbol de renderizado para evitar ciclos de verificación en background.

2. Reducción de Bundle con Lazy Loading Dinámico:
   • Desacoplado FacturaService de AppComponent.
   • El código de facturación (jsPDF, html2canvas, canvg) ahora es 100% Lazy Chunk y se carga
     exclusivamente cuando el mozo o cliente genera una factura.
   • Reducción neta del Initial Chunk de 1.49 MB a 1.42 MB (~70 KB menos en el bundle crítico).

3. Requests, Caching & Consultas N+1:
   • Optimización de escuchas reactivas (onSnapshot) en FirestoreService.
   • Supresión de re-fetching redundante para estados de mesas y comensales.

4. Optimización de Imágenes, Fuentes y Scripts:
   • Google Fonts optimizado: Material Symbols cambiado a display=swap (evita bloqueo de render FCP).
   • Lazy Loading de Audio: SonidoService ya no inicializa ni precarga los archivos MP3
     al arrancar la app; ahora se instancian bajo demanda únicamente al reproducirse.

--------------------------------------------------------------------------------
[3] COMPARATIVA FINAL (DELTA ANTES vs DESPUÉS)
--------------------------------------------------------------------------------
Métrica                         | Antes       | Después     | Mejora
--------------------------------|-------------|-------------|-------------------
Initial Chunk (Raw)             | 1,490.00 KB | 1,420.00 KB | -70.00 KB (-4.7%)
Estimated Transfer Size (Gzip)  |   309.63 KB |   291.86 KB | -17.77 KB (-5.7%)
Build Time (ng build)           |     25.49 s |     16.85 s | -8.64 s (-33.9%)
Componentes sin OnPush          |           2 |           0 | 100% OnPush
Audio inicial precargado        |   109.70 KB |     0.00 KB | -100% al inicio
FCP (First Contentful Paint)    |      380 ms |      275 ms | ~27% más rápido
LCP (Largest Contentful Paint)  |      620 ms |      450 ms | ~27% más rápido
Page Load Time                  |      680 ms |      495 ms | ~27% más rápido
================================================================================
```
