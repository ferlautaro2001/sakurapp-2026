# Guía de Prácticas y Memoria del Agente (SakurApp)

Este documento define las reglas de comportamiento, hábitos de trabajo y memoria operativa que el agente debe respetar en este repositorio.

---

## 🧭 Flujo y Política de Actualización de Grafos (Graphify)

Cuando se trabaje con grafos de conocimiento (`graphify`):

### 1. No regenerar en micro-cambios (Criterio de Fluidez)
* **Evitar la actualización en cada mensaje o edición puntual:** Ajustes de estilos CSS, márgenes, corrección de textos, validadores simples o tweaks de UI no alteran la arquitectura del sistema.
* No ejecutar la reconstrucción innecesaria del grafo para mantener máxima velocidad de respuesta (evita demoras de 5 a 10 segundos).

### 2. Cuándo sí actualizar el grafo (Criterio Estructural)
Ejecutar o sugerir la actualización del grafo únicamente cuando ocurran cambios arquitectónicos reales:
* **Nuevas pantallas o rutas:** Creación de componentes `.page.ts` o cambios en `app.routes.ts`.
* **Nuevos servicios o lógica compartida:** Creación o modificación sustancial de `.service.ts`.
* **Contratos y modelos de datos:** Modificaciones en `modelos.ts`, reglas de Firestore o esquemas de DataConnect.
* **Cierre de hitos / sprints:** Al finalizar una tanda importante de features y antes de comenzar la siguiente.

### 3. Modo de Actualización Preferido: Incremental
* Siempre priorizar el modo incremental:
  ```bash
  /graphify --update
  ```
  Aprovecha el `manifest.json` y analiza únicamente los archivos modificados en 1 a 2 segundos, sin reanalizar el 100% del repositorio.

### 4. Uso del Grafo para Análisis de Impacto (Blast Radius)
* Antes de modificar o refactorizar **God Nodes** (abstracciones centrales como `Usuario`, `SesionService`, `PaginaConSesion`, `AlmacenService`):
  * Consultar el grafo existente (`graph.json` o `/graphify path` / `/graphify query`) para evaluar qué pantallas y servicios dependen directa o indirectamente de ellos.
  * Garantizar que los cambios no provoquen regresiones silenciosas en componentes lejanos.
