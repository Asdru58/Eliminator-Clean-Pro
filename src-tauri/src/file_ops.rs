use trash;
use std::fs::{self, OpenOptions};
use std::io::Write;
use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Clone, Debug)]
pub struct DeletionResult {
    pub success: bool,
    pub error: Option<String>,
}

pub fn move_to_trash(path: &str) -> DeletionResult {
    match trash::delete(path) {
        Ok(_) => {
            let _ = log_action("TRASH", path);
            DeletionResult { success: true, error: None }
        },
        Err(e) => DeletionResult { success: false, error: Some(e.to_string()) },
    }
}

pub fn delete_permanently(path: &str) -> DeletionResult {
    match fs::remove_file(path) {
        Ok(_) => {
            let _ = log_action("DELETE", path);
            DeletionResult { success: true, error: None }
        },
        Err(e) => DeletionResult { success: false, error: Some(e.to_string()) },
    }
}

fn log_action(action: &str, path: &str) -> std::io::Result<()> {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("deletion_log.txt")?;

    let start = SystemTime::now();
    let since_the_epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");
    let timestamp = since_the_epoch.as_secs();

    writeln!(file, "[{}] {}: {}", timestamp, action, path)?;
    Ok(())
}
