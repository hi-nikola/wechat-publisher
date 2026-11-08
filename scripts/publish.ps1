[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateNotNullOrEmpty()]
    [string]$File,
    [string]$Theme = 'lapis',
    [string]$Highlight = 'solarized-light',
    [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
if (-not $DryRun) {
    foreach ($name in 'WECHAT_APP_ID', 'WECHAT_APP_SECRET') {
        if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name, 'Process'))) {
            $value = [Environment]::GetEnvironmentVariable($name, 'User')
            if (-not [string]::IsNullOrWhiteSpace($value)) {
                [Environment]::SetEnvironmentVariable($name, $value, 'Process')
            }
        }
    }
}
$arguments = @((Join-Path $PSScriptRoot 'publish.mjs'), $File, $Theme, $Highlight)
if ($DryRun) { $arguments += '--dry-run' }
& node @arguments
exit $LASTEXITCODE
