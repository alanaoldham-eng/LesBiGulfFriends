$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$targetFiles = Get-ChildItem -Path "app" -Recurse -Filter "page.tsx" | Select-Object -ExpandProperty FullName

if (-not $targetFiles -or $targetFiles.Count -eq 0) {
  Write-Host "No app/**/page.tsx files found."
  exit 0
}

$removed = 0

foreach ($file in $targetFiles) {
  $original = Get-Content -LiteralPath $file -Raw -Encoding UTF8
  if ($null -eq $original) { continue }

  if ($original -match '^\s*export const dynamic = "force-dynamic";\s*$' -or
      $original -match '^\s*export const dynamic = ''force-dynamic'';\s*$') {

    Copy-Item -LiteralPath $file -Destination ($file + ".bak") -Force

    $updated = $original `
      -replace '(?m)^\s*export const dynamic = "force-dynamic";\r?\n?', '' `
      -replace "(?m)^\s*export const dynamic = 'force-dynamic';\r?\n?", ''

    # collapse accidental 3+ blank lines to 2
    $updated = [regex]::Replace($updated, "(\r?\n){3,}", "`r`n`r`n")

    Set-Content -LiteralPath $file -Value $updated -Encoding UTF8 -NoNewline
    Write-Host "Updated: $file"
    $removed++
  }
}

Write-Host ""
Write-Host "Finished. Files updated: $removed"
Write-Host "Next steps:"
Write-Host "  Remove-Item -Recurse -Force .next"
Write-Host "  npm run build"
