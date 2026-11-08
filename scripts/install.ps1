[CmdletBinding()]
param(
    [string]$Target = (Join-Path $env:USERPROFILE '.codex\skills\wechat-publisher'),
    [string]$BackupRoot
)
$ErrorActionPreference = 'Stop'
$source = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$targetPath = [IO.Path]::GetFullPath($Target).TrimEnd('\')
if ($source.TrimEnd('\') -ieq $targetPath) { throw 'Source is already the target directory.' }
if ((Split-Path $targetPath -Leaf) -ne 'wechat-publisher') { throw 'Target must be the wechat-publisher directory.' }
if (-not (Test-Path -LiteralPath (Join-Path $source 'SKILL.md') -PathType Leaf)) { throw 'Missing source SKILL.md.' }
if (-not $BackupRoot) { $BackupRoot = Join-Path (Split-Path $source -Parent) 'wechat-publisher-backups' }
$backup = Join-Path ([IO.Path]::GetFullPath($BackupRoot)) (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
if (Test-Path -LiteralPath $targetPath) {
    New-Item -ItemType Directory -Path $backup -Force > $null
    Get-ChildItem -LiteralPath $targetPath -Force | Where-Object Name -ne '.git' |
        Copy-Item -Destination $backup -Recurse -Force
}
$files = @('SKILL.md','README.md','LICENSE','example.md') | ForEach-Object { Get-Item -LiteralPath (Join-Path $source $_) }
foreach ($directory in 'assets','references','scripts','licenses') {
    $files += Get-ChildItem -LiteralPath (Join-Path $source $directory) -Recurse -File
}
New-Item -ItemType Directory -Path $targetPath -Force > $null
foreach ($file in $files) {
    $relative = $file.FullName.Substring($source.Length).TrimStart('\')
    $destination = Join-Path $targetPath $relative
    New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force > $null
    Copy-Item -LiteralPath $file.FullName -Destination $destination -Force
}
foreach ($file in $files) {
    $relative = $file.FullName.Substring($source.Length).TrimStart('\')
    if ((Get-FileHash -LiteralPath $file.FullName).Hash -ne (Get-FileHash -LiteralPath (Join-Path $targetPath $relative)).Hash) {
        throw "Installed file hash mismatch: $relative; backup: $backup"
    }
}
$obsolete = Join-Path $targetPath 'wechat-publisher.skill'
if ((Test-Path -LiteralPath $obsolete -PathType Leaf) -and (Test-Path -LiteralPath (Join-Path $backup 'wechat-publisher.skill') -PathType Leaf)) {
    Remove-Item -LiteralPath $obsolete
}
[pscustomobject]@{Installed=$true; Target=$targetPath; Backup=$backup; VerifiedFiles=$files.Count}
