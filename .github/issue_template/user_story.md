---
name: "🟢 User Story"
about: "Especificación de funcionalidad con criterios BDD y tareas técnicas"
title: "[US-X.Y] [Pto Z] Título de la Historia"
labels: ["user-story"]
assignees: ""
---

## 📖 Historia de Usuario
**Como** [rol/perfil de usuario],  
**Quiero** [acción o funcionalidad deseada],  
**Para** [beneficio o valor de negocio esperado].

---

## 📱 Contexto TFI
* **Punto del Enunciado:** `Punto X`
* **Dispositivo de Demostración:** `Dispositivo 1 / 2 / 3 / 4`
* **Épica Vinculada:** #ID_EPICA

---

## 🎯 Criterios de Aceptación (Gherkin / BDD)
- [ ] **Escenario 1 (Happy Path):**  
  **Dado que** [precondición],  
  **Cuando** [acción del usuario],  
  **Entonces** [resultado esperado con feedback visual y/o sonoro].
- [ ] **Escenario 2 (Validación / Error):**  
  **Dado que** [condición de fallo],  
  **Cuando** [intenta ejecutar la acción],  
  **Entonces** [se muestra Toast/Modal explicativo y el dispositivo vibra].

---

## 🛠️ Tareas Técnicas (Sub-tasks)
- [ ] [TASK-X.Y.1] Frontend: [Descripción de la tarea de UI]
- [ ] [TASK-X.Y.2] Backend/BaaS: [Lógica de datos, reglas de seguridad o endpoints]
- [ ] [TASK-X.Y.3] Nativo/Hardware: [Integración de cámara, QR, audio, haptics o push]
- [ ] [TASK-X.Y.4] QA & Dispositivo: [Prueba en hardware físico y validación de criterios]