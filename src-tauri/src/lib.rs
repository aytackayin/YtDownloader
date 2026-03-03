use std::sync::Mutex;
use tauri::{Window, Emitter, Manager, State};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use std::process::Command;

struct DownloadState {
    child_pid: Mutex<Option<u32>>,
    cancelled: Mutex<bool>,
}

#[tauri::command]
async fn fetch_metadata(url: String, app: tauri::AppHandle) -> Result<String, String> {
    let sidecar_command = app.shell().sidecar("python-sidecar").map_err(|e| e.to_string())?
        .args(["metadata", &url]);
    
    let output = sidecar_command.output().await.map_err(|e| format!("Sidecar error: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() || stdout.trim().is_empty() {
        return Err(format!("Script Error: {}", stderr));
    }

    Ok(stdout)
}

#[tauri::command]
async fn fetch_video_formats(url: String, app: tauri::AppHandle) -> Result<String, String> {
    let sidecar_command = app.shell().sidecar("python-sidecar").map_err(|e| e.to_string())?
        .args(["formats", &url]);
    
    let output = sidecar_command.output().await.map_err(|e| format!("Sidecar error: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() || stdout.trim().is_empty() {
        return Err(format!("Script Error: {}", stderr));
    }

    Ok(stdout)
}

#[tauri::command]
async fn start_download(
    url: String,
    out_dir: String,
    format: String,
    resolution: String,
    filename: String,
    video_id: String,
    app: tauri::AppHandle,
    window: Window,
) -> Result<(), String> {
    {
        let state = app.state::<DownloadState>();
        *state.cancelled.lock().unwrap() = false;
    }

    let sidecar_command = app.shell().sidecar("python-sidecar").map_err(|e| e.to_string())?
        .args(["download", &url, &out_dir, &format, &resolution, &filename]);

    let (mut rx, child) = sidecar_command.spawn().map_err(|e| format!("Could not start download: {}", e))?;

    {
        let state = app.state::<DownloadState>();
        *state.child_pid.lock().unwrap() = Some(child.pid());
    }

    let event_name = format!("download-progress-{}", video_id);
    let app_clone = app.clone();

    tauri::async_runtime::spawn(async move {
        let mut received_terminal_event = false;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let line_str = String::from_utf8_lossy(&line).to_string();
                    if line_str.contains("\"type\": \"complete\"") || line_str.contains("\"type\":\"complete\"")
                        || line_str.contains("\"type\": \"error\"") || line_str.contains("\"type\":\"error\"") {
                        received_terminal_event = true;
                    }
                    let _ = window.emit(&event_name, line_str);
                }
                CommandEvent::Stderr(line) => {
                    let err_msg = String::from_utf8_lossy(&line).to_string();
                    let _ = window.emit(&event_name, format!("{{\"type\":\"error\",\"message\":\"{}\"}}", err_msg.replace('\"', "\\\"")));
                }
                CommandEvent::Terminated(_) => {
                    let state = app_clone.state::<DownloadState>();
                    *state.child_pid.lock().unwrap() = None;
                    let was_cancelled = *state.cancelled.lock().unwrap();
                    if !was_cancelled && !received_terminal_event {
                         let _ = window.emit(&event_name, "{\"type\":\"error\",\"message\":\"Download terminated unexpectedly.\"}");
                    }
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn cancel_download(state: State<'_, DownloadState>, window: Window) -> Result<(), String> {
    let mut pid_guard = state.child_pid.lock().map_err(|e| e.to_string())?;
    *state.cancelled.lock().map_err(|e| e.to_string())? = true;

    if let Some(pid) = pid_guard.take() {
        #[cfg(windows)]
        {
            Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .output()
                .ok();
        }
        #[cfg(not(windows))]
        {
            Command::new("kill")
                .arg("-9")
                .arg(pid.to_string())
                .output()
                .ok();
        }

        let _ = window.emit("download-cancelled", "{}");
    }
    Ok(())
}

#[tauri::command]
fn delete_video_files(out_dir: String, filename_prefix: String) -> Result<(), String> {
    let path = std::path::Path::new(&out_dir);
    if !path.exists() {
        return Ok(());
    }

    let entries = std::fs::read_dir(path).map_err(|e| e.to_string())?;
    for entry in entries {
        if let Ok(entry) = entry {
            let file_name = entry.file_name().to_string_lossy().to_string();
            if file_name.starts_with(&filename_prefix) {
                let _ = std::fs::remove_file(entry.path());
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn select_folder() -> Result<String, String> {
    Ok(String::new())
}

/// Pass deep links from browser extension to frontend
/// Call: invoke('open_deep_link', { url: 'https://...' })
#[tauri::command]
async fn open_deep_link(url: String, window: Window) -> Result<(), String> {
    window.emit("deep-link-url", url).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(DownloadState {
            child_pid: Mutex::new(None),
            cancelled: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![
            fetch_metadata,
            fetch_video_formats,
            start_download,
            cancel_download,
            delete_video_files,
            select_folder,
            open_deep_link
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
