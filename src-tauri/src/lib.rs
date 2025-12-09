mod file_ops;
mod scanner;

use file_ops::DeletionResult;
use scanner::DuplicateGroup;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State, Window};

struct AppState {
    cancelled: Arc<AtomicBool>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn scan_files(
    window: Window,
    paths: Vec<String>,
    state: State<'_, AppState>,
) -> Result<Vec<DuplicateGroup>, String> {
    state.cancelled.store(false, Ordering::Relaxed);
    let cancelled = state.cancelled.clone();

    let paths_clone = paths.clone();
    let result = tokio::task::spawn_blocking(move || {
        scanner::scan_directories(paths_clone, window, cancelled)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(result)
}

#[tauri::command]
fn cancel_scan(state: State<'_, AppState>) {
    state.cancelled.store(true, Ordering::Relaxed);
}

#[tauri::command]
async fn trash_file(path: String) -> DeletionResult {
    tokio::task::spawn_blocking(move || file_ops::move_to_trash(&path))
        .await
        .unwrap_or_else(|e| DeletionResult {
            success: false,
            error: Some(e.to_string()),
        })
}

#[tauri::command]
async fn delete_file(path: String) -> DeletionResult {
    tokio::task::spawn_blocking(move || file_ops::delete_permanently(&path))
        .await
        .unwrap_or_else(|e| DeletionResult {
            success: false,
            error: Some(e.to_string()),
        })
}

#[derive(serde::Serialize, Clone, Debug)]
struct ProgressEvent {
    phase: String,
    current: usize,
    total: usize,
}

#[tauri::command]
async fn trash_multiple_files(window: Window, paths: Vec<String>) -> DeletionResult {
    let total = paths.len();
    let _ = window.emit(
        "operation-progress",
        ProgressEvent {
            phase: "Moviendo a papelera...".into(),
            current: 0,
            total,
        },
    );

    let mut success_count = 0;
    let mut last_error = None;

    let result = tokio::task::spawn_blocking(move || {
        for (index, path) in paths.iter().enumerate() {
            let res = file_ops::move_to_trash(path);
            if res.success {
                success_count += 1;
            } else {
                last_error = res.error;
            }

            if index % 5 == 0 || index == total - 1 {
                let _ = window.emit(
                    "operation-progress",
                    ProgressEvent {
                        phase: "Moviendo a papelera...".into(),
                        current: index + 1,
                        total,
                    },
                );
            }
        }
        (success_count, last_error)
    })
    .await
    .unwrap_or((0, Some("Task panicked".into())));

    let (success_count, last_error) = result;

    if success_count == total {
        DeletionResult {
            success: true,
            error: None,
        }
    } else {
        DeletionResult {
            success: success_count > 0,
            error: Some(format!(
                "Solo se movieron {} de {} archivos. Último error: {}",
                success_count,
                total,
                last_error.unwrap_or_default()
            )),
        }
    }
}

#[tauri::command]
async fn delete_multiple_files(window: Window, paths: Vec<String>) -> DeletionResult {
    let total = paths.len();
    let _ = window.emit(
        "operation-progress",
        ProgressEvent {
            phase: "Eliminando permanentemente...".into(),
            current: 0,
            total,
        },
    );

    let mut success_count = 0;
    let mut last_error = None;

    let result = tokio::task::spawn_blocking(move || {
        for (index, path) in paths.iter().enumerate() {
            let res = file_ops::delete_permanently(path);
            if res.success {
                success_count += 1;
            } else {
                last_error = res.error;
            }

            if index % 5 == 0 || index == total - 1 {
                let _ = window.emit(
                    "operation-progress",
                    ProgressEvent {
                        phase: "Eliminando permanentemente...".into(),
                        current: index + 1,
                        total,
                    },
                );
            }
        }
        (success_count, last_error)
    })
    .await
    .unwrap_or((0, Some("Task panicked".into())));

    let (success_count, last_error) = result;

    if success_count == total {
        DeletionResult {
            success: true,
            error: None,
        }
    } else {
        DeletionResult {
            success: success_count > 0,
            error: Some(format!(
                "Solo se eliminaron {} de {} archivos. Último error: {}",
                success_count,
                total,
                last_error.unwrap_or_default()
            )),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            cancelled: Arc::new(AtomicBool::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            scan_files,
            cancel_scan,
            trash_file,
            delete_file,
            trash_multiple_files,
            delete_multiple_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
