$cliPath = "$env:LOCALAPPDATA\Programs\GEJA PHP IDE\resources\cli"

$currentPath = [System.Environment]::GetEnvironmentVariable(
  "Path",
  [System.EnvironmentVariableTarget]::User
)

if ($currentPath -notlike "*$cliPath*") {

  $newPath = "$currentPath;$cliPath"

  [System.Environment]::SetEnvironmentVariable(
    "Path",
    $newPath,
    [System.EnvironmentVariableTarget]::User
  )

  Write-Host "PATH atualizado:"
  Write-Host $newPath
}
