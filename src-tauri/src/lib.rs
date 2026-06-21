use std::path::{Path, PathBuf};

#[tauri::command]
fn portable_data_dir() -> Result<String, String> {
    let exe_path = std::env::current_exe().map_err(|error| error.to_string())?;
    let data_dir = portable_data_dir_from_exe(&exe_path)?;

    std::fs::create_dir_all(&data_dir).map_err(|error| error.to_string())?;

    Ok(data_dir.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![portable_data_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn portable_data_dir_from_exe(exe_path: &Path) -> Result<PathBuf, String> {
    let app_dir = exe_path
        .parent()
        .ok_or_else(|| "Could not resolve executable directory".to_string())?;

    Ok(app_dir.join("data"))
}

#[cfg(test)]
mod tests {
    use super::portable_data_dir_from_exe;
    use std::path::Path;

    #[test]
    fn derives_data_dir_next_to_executable() {
        let data_dir = portable_data_dir_from_exe(Path::new(r"C:\Apps\Daily\每日计划与复盘.exe"))
            .expect("data dir");

        assert_eq!(data_dir, Path::new(r"C:\Apps\Daily\data"));
    }
}
