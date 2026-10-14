[CmdletBinding()]
param([ValidateSet('A', 'B')][string]$Account = 'A', [switch]$Replace)
$ErrorActionPreference = 'Stop'
# Run in your own trusted local terminal. No credential belongs in command arguments/chat.
$taskRoot = Split-Path -Parent $PSScriptRoot
$credentialName = if ($Account -eq 'B') { '.cloud/email-staging-account-b.xml' } else { '.cloud/email-staging-credentials.xml' }
$credentialPath = Join-Path $taskRoot $credentialName
if ((Test-Path -LiteralPath $credentialPath) -and -not $Replace) { throw 'This account already has private credentials. Reuse them; explicit -Replace is required to overwrite.' }
if (-not (Test-Path -LiteralPath (Join-Path $taskRoot '.cloud/staging.json'))) { throw 'Verified staging configuration is required.' }
$target = Get-Content -LiteralPath (Join-Path $taskRoot '.cloud/staging.json') -Raw | ConvertFrom-Json
if ($target.projectRef -ne 'ibxubsegrabpspopdgep') { throw 'Unexpected staging target.' }
$stagingCredential = Get-Credential -Message "Dedicated BioCircuit staging account ${Account}: controlled email and unique password (12+ characters). No SMS or academic verification will be granted."
if ($null -eq $stagingCredential) { throw 'No credentials entered.' }
if ($stagingCredential.UserName.Length -gt 254 -or $stagingCredential.UserName -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') { throw 'A valid controlled email is required.' }
if ($stagingCredential.Password.Length -lt 12 -or $stagingCredential.Password.Length -gt 128) { throw 'Use a unique password of 12 to 128 characters.' }
if ($Account -eq 'B') {
  $primaryPath = Join-Path $taskRoot '.cloud/email-staging-credentials.xml'
  if (Test-Path -LiteralPath $primaryPath) {
    $primaryCredential = Import-Clixml -LiteralPath $primaryPath
    if ([string]::Equals($primaryCredential.UserName, $stagingCredential.UserName, [StringComparison]::OrdinalIgnoreCase)) { throw 'Account B must use a different controlled email.' }
  }
}
# Windows DPAPI encrypts the password for this local Windows user; email is still personal.
$stagingCredential | Export-Clixml -LiteralPath $credentialPath
Write-Output "Private credentials saved for account $Account and this Windows user. No account created. For existing accounts use node scripts/test-staging-persistence.mjs. Only for a NEW controlled B account add --register-second-account; signup remains separate from login."
