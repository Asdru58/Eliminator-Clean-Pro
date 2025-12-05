mod scanner;
mod file_ops;

use scanner::DuplicateGroup;
use file_ops::DeletionResult;
use tauri::{State, Window};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};

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
    state: State<'_, AppState>
) -> Result<Vec<DuplicateGroup>, String> {
    state.cancelled.store(false, Ordering::Relaxed);
    let cancelled = state.cancelled.clone();
    
    let paths_clone = paths.clone();
    let result = tokio::task::spawn_blocking(move || {
        scanner::scan_directories(paths_clone, window, cancelled)
    }).await.map_err(|e| e.to_string())??;
    
    Ok(result)
}

#[tauri::command]
fn cancel_scan(state: State<'_, AppState>) {
    state.cancelled.store(true, Ordering::Relaxed);
}

#[tauri::command]
async fn trash_file(path: String) -> DeletionResult {
    tokio::task::spawn_blocking(move || {
        file_ops::move_to_trash(&path)
    }).await.unwrap_or_else(|e| DeletionResult { success: false, error: Some(e.to_string()) })
}

#[tauri::command]
async fn delete_file(path: String) -> DeletionResult {
    tokio::task::spawn_blocking(move || {
        file_ops::delete_permanently(&path)
    }).await.unwrap_or_else(|e| DeletionResult { success: false, error: Some(e.to_string()) })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState { cancelled: Arc::new(AtomicBool::new(false)) })
        .invoke_handler(tauri::generate_handler![greet, scan_files, cancel_scan, trash_file, delete_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
