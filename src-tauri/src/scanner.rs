use std::collections::HashMap;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use walkdir::WalkDir;
use serde::Serialize;
use blake3::Hasher;
use rayon::prelude::*;
use tauri::{Emitter, Window};

#[derive(Serialize, Clone, Debug)]
pub struct FileInfo {
    pub path: String,
    pub size: u64,
    pub modified: u64,
}

#[derive(Serialize, Clone, Debug)]
pub struct DuplicateGroup {
    pub hash: String,
    pub files: Vec<FileInfo>,
}

#[derive(Serialize, Clone, Debug)]
struct ProgressEvent {
    phase: String,
    current: usize,
    total: usize,
}

const PARTIAL_SIZE: u64 = 16 * 1024; // 16KB

pub fn scan_directories(
    paths: Vec<String>, 
    window: Window, 
    cancelled: Arc<AtomicBool>
) -> Result<Vec<DuplicateGroup>, String> {
    let mut size_map: HashMap<u64, Vec<String>> = HashMap::new();
    let mut total_files = 0;

    // Phase 1: Group by size (Serial - WalkDir is fast)
    let _ = window.emit("scan-progress", ProgressEvent { phase: "Scanning".into(), current: 0, total: 0 });
    
    for path_str in paths {
        if cancelled.load(Ordering::Relaxed) { return Err("Cancelled".into()); }
        for entry in WalkDir::new(path_str).into_iter().filter_map(|e| e.ok()) {
            if !entry.file_type().is_file() { continue; }
            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };
            let size = metadata.len();
            if size > 0 {
                size_map.entry(size).or_default().push(entry.path().to_string_lossy().to_string());
                total_files += 1;
            }
            if total_files % 100 == 0 {
                 let _ = window.emit("scan-progress", ProgressEvent { phase: "Scanning".into(), current: total_files, total: 0 });
            }
        }
    }

    if cancelled.load(Ordering::Relaxed) { return Err("Cancelled".into()); }

    // Filter out unique sizes
    let mut potential_duplicates: Vec<Vec<String>> = size_map.into_values().filter(|v| v.len() > 1).collect();
    
    let total_groups = potential_duplicates.len();
    let processed_groups = Arc::new(Mutex::new(0));

    // Phase 2: Partial Hash (Parallel)
    let _ = window.emit("scan-progress", ProgressEvent { phase: "Phase 1/2: Partial Hash".into(), current: 0, total: total_groups });

    let partial_results: Vec<(String, String)> = potential_duplicates.par_iter().flat_map(|group| {
        if cancelled.load(Ordering::Relaxed) { return vec![]; }
        
        let mut group_results = Vec::new();
        for path in group {
             if let Ok(hash) = get_partial_hash(path) {
                 group_results.push((hash, path.clone()));
             }
        }
        
        let mut count = processed_groups.lock().unwrap();
        *count += 1;
        if *count % 10 == 0 {
            let _ = window.emit("scan-progress", ProgressEvent { phase: "Phase 1/2: Partial Hash".into(), current: *count, total: total_groups });
        }

        group_results
    }).collect();

    if cancelled.load(Ordering::Relaxed) { return Err("Cancelled".into()); }

    // Regroup by partial hash
    let mut partial_hash_map: HashMap<String, Vec<String>> = HashMap::new();
    for (hash, path) in partial_results {
        partial_hash_map.entry(hash).or_default().push(path);
    }

    potential_duplicates = partial_hash_map.into_values().filter(|v| v.len() > 1).collect();
    
    let total_groups_full = potential_duplicates.len();
    *processed_groups.lock().unwrap() = 0;

    // Phase 3: Full Hash (Parallel)
    let _ = window.emit("scan-progress", ProgressEvent { phase: "Phase 2/2: Full Hash".into(), current: 0, total: total_groups_full });

    let full_results: Vec<(String, String)> = potential_duplicates.par_iter().flat_map(|group| {
        if cancelled.load(Ordering::Relaxed) { return vec![]; }

        let mut group_results = Vec::new();
        for path in group {
            if let Ok(hash) = get_full_hash(path) {
                group_results.push((hash, path.clone()));
            }
        }

        let mut count = processed_groups.lock().unwrap();
        *count += 1;
        if *count % 5 == 0 {
            let _ = window.emit("scan-progress", ProgressEvent { phase: "Phase 2/2: Full Hash".into(), current: *count, total: total_groups_full });
        }

        group_results
    }).collect();

    if cancelled.load(Ordering::Relaxed) { return Err("Cancelled".into()); }

    // Final Regroup
    let mut full_hash_map: HashMap<String, Vec<String>> = HashMap::new();
    for (hash, path) in full_results {
        full_hash_map.entry(hash).or_default().push(path);
    }

    // Build Final Result
    let mut results = Vec::new();
    for (hash, paths) in full_hash_map {
        if paths.len() > 1 {
            let files: Vec<FileInfo> = paths.iter().map(|p| {
                let metadata = std::fs::metadata(p).ok();
                let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                let modified = metadata.as_ref()
                    .and_then(|m| m.modified().ok())
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0);

                FileInfo {
                    path: p.clone(),
                    size,
                    modified,
                }
            }).collect();
            results.push(DuplicateGroup { hash, files });
        }
    }
    
    let _ = window.emit("scan-progress", ProgressEvent { phase: "Complete".into(), current: 100, total: 100 });

    Ok(results)
}

fn get_partial_hash(path: &str) -> std::io::Result<String> {
    let mut file = File::open(path)?;
    let size = file.metadata()?.len();
    let mut hasher = Hasher::new();

    if size <= PARTIAL_SIZE * 2 {
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;
        hasher.update(&buffer);
    } else {
        let mut buffer = vec![0; PARTIAL_SIZE as usize];
        file.read_exact(&mut buffer)?;
        hasher.update(&buffer);

        file.seek(SeekFrom::End(-(PARTIAL_SIZE as i64)))?;
        file.read_exact(&mut buffer)?;
        hasher.update(&buffer);
    }

    Ok(hasher.finalize().to_hex().to_string())
}

fn get_full_hash(path: &str) -> std::io::Result<String> {
    let mut file = File::open(path)?;
    let mut hasher = Hasher::new();
    let mut buffer = [0; 65536]; // 64KB buffer

    loop {
        let count = file.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }

    Ok(hasher.finalize().to_hex().to_string())
}
