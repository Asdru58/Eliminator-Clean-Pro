# Eliminator Clean Pro 🚀

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-orange.svg)
![React](https://img.shields.io/badge/React-v18-blue.svg)
![Rust](https://img.shields.io/badge/Rust-Edition%202021-red.svg)

**Eliminator Clean Pro** es la herramienta definitiva para recuperar espacio en disco. Diseñada para ser rápida, segura y hermosa.

## ✨ Características Premium

- **🚀 Motor de Detección en 3 Fases**:
    1.  **Agrupación por Tamaño**: Filtrado instantáneo de archivos únicos.
    2.  **Hash Parcial**: Compara solo el inicio y fin de los archivos (extremadamente rápido).
    3.  **Hash Completo (BLAKE3)**: Solo se ejecuta en candidatos finales para garantizar 100% de precisión.
    *Todo paralelizado con `rayon` para usar todos los núcleos de tu CPU.*

- **🛡️ Seguridad Total**:
    - **Papelera por Defecto**: Nunca borres nada permanentemente por error.
    - **Confirmación Doble**: Evita clics accidentales.
    - **Log de Acciones**: Registro detallado de cada operación.

- **🎨 Experiencia de Usuario Superior**:
    - **Modo Oscuro**: Interfaz elegante y cómoda para la vista.
    - **Thumbnails**: Vista previa de imágenes antes de borrar.
    - **Selección Inteligente**: "Mantener el más reciente", "Mantener el más antiguo", "Ruta más corta".
    - **Progreso en Tiempo Real**: Barra de progreso detallada y botón de cancelación instantánea.

## 🛠️ Instalación

### Windows
Descarga el instalador `.msi` o el ejecutable `.exe` desde la sección de [Releases](https://github.com/tu-usuario/eliminator-clean-pro/releases).

### macOS / Linux
(Próximamente en Releases)

## 💻 Compilación desde Fuente

Requisitos: Node.js v20+, Rust (Stable).

1.  Clonar:
    ```bash
    git clone https://github.com/tu-usuario/eliminator-clean-pro.git
    cd eliminator-clean-pro
    ```
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Ejecutar en desarrollo:
    ```bash
    npm run tauri dev
    ```
4.  Construir release:
    ```bash
    npm run tauri build
    ```

## 🧩 Stack Tecnológico

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Rust, Tauri v2, Tokio, Rayon, Blake3, Walkdir, Trash.

---
Creado con ❤️ por Antigravity.
