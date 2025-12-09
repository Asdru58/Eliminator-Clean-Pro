Write-Host "Iniciando despliegue de Eliminator Clean Pro..." -ForegroundColor Cyan

# 1. Authenticate if needed
if (-not (gh auth status)) {
    Write-Host "Autenticación requerida. Sigue las instrucciones en el navegador..." -ForegroundColor Yellow
    gh auth login -h GitHub.com -p https -w
}

# 2. Create Repo and Push
Write-Host "Creando repositorio y subiendo código..." -ForegroundColor Cyan
try {
    gh repo create EliminatorCleanPro --public --source=. --remote=origin --push
} catch {
    Write-Host "El repositorio ya existe o hubo un error. Intentando push manual..." -ForegroundColor Yellow
    git push -u origin master
}

# 3. Create Release
Write-Host "Creando Release v1.0.0 y subiendo instaladores..." -ForegroundColor Cyan
$installers = Get-ChildItem "src-tauri/target/release/bundle/nsis/*.exe", "src-tauri/target/release/bundle/msi/*.msi"
$files = $installers | ForEach-Object { $_.FullName }

gh release create v1.0.0 --title "v1.0.0" --notes "Initial release of Eliminator Clean Pro. Fastest duplicate remover." $files

# 4. Show Link
$user = gh api user -q .login
$url = "https://github.com/$user/EliminatorCleanPro/releases/tag/v1.0.0"
Write-Host "¡ÉXITO! Tu release está disponible en:" -ForegroundColor Green
Write-Host $url -ForegroundColor Green
Start-Process $url
