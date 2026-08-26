param(
  [switch]$Clean
)

$packageRoot = $PSScriptRoot
$srcDir = Join-Path $packageRoot ".."
$destDir = Join-Path $packageRoot "skills"

New-Item -ItemType Directory -Force -Path $destDir | Out-Null

if ($Clean) {
  Get-ChildItem -Path $destDir -Filter *.md -File -ErrorAction SilentlyContinue | Remove-Item -Force
}

Get-ChildItem -Path $srcDir -Filter *.md -File | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination (Join-Path $destDir $_.Name) -Force
}
