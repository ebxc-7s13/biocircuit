[CmdletBinding()]
param([ValidateSet('A', 'B')][string]$Account = 'A', [ValidateSet('Link', 'Code')][string]$Mode = 'Link', [switch]$Expired)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$target = Get-Content -LiteralPath (Join-Path $taskRoot '.cloud/staging.json') -Raw | ConvertFrom-Json
if ($target.projectRef -ne 'ibxubsegrabpspopdgep') { throw 'Unexpected staging target.' }
$credentialFile = if ($Account -eq 'A') { '.cloud/email-staging-credentials.xml' } else { '.cloud/email-staging-account-b.xml' }
if (-not (Test-Path -LiteralPath (Join-Path $taskRoot $credentialFile))) { throw 'Existing private credentials are required; no account is created.' }
function Read-PrivateText([string]$Prompt) {
  $secure = Read-Host -Prompt $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
if (-not $Expired) {
  # Links expire after 3600 s and each new request supersedes older emails.
  $latest = Get-ChildItem -LiteralPath (Join-Path $taskRoot 'docs/verification/cloud') -Filter 'recovery-request-*.json' -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc | Select-Object -Last 1
  if ($latest) {
    $request = Get-Content -LiteralPath $latest.FullName -Raw | ConvertFrom-Json
    if ($request.useBefore) {
      $deadline = ([DateTime]$request.useBefore).ToUniversalTime()
      if ($deadline -lt [DateTime]::UtcNow) { Write-Warning ('The newest recorded request expired at ' + $deadline.ToString('u') + '. Run npm run recovery:request first, then use the NEWEST email.') }
      else { Write-Output ('Use ONLY the newest email; its link must be used before ' + $deadline.ToLocalTime().ToString('HH:mm') + ' local time. Do not click it: copy the link address.') }
    }
  }
}
$artifact = Read-PrivateText 'Enter the ACTUAL delivered recovery link or code privately (never paste into chat)'
if ($Mode -eq 'Code' -and $artifact -notmatch '^\d{6,10}$') { throw 'Enter the actual code received from Auth.' }
if ($Mode -eq 'Link') {
  $parsedLink = $null
  if (-not [Uri]::TryCreate($artifact, [UriKind]::Absolute, [ref]$parsedLink)) { throw 'Invalid recovery link.' }
  $expectedAuthHost = 'ibxubsegrabpspopdgep.supabase.co'
  $origin = [Uri]$target.frontendOrigin
  $authLink = $parsedLink.Scheme -eq 'https' -and $parsedLink.Host -eq $expectedAuthHost -and $parsedLink.AbsolutePath -eq '/auth/v1/verify'
  $localLink = $parsedLink.Scheme -eq 'http' -and $parsedLink.Authority -eq $origin.Authority -and $parsedLink.AbsolutePath -eq '/account/recovery'
  if (-not ($authLink -or $localLink) -or $parsedLink.UserInfo) { throw 'Only actual confirmed staging/local recovery links are allowed.' }
}
if ($Expired) {
  # Negative test only: an already-expired real link. No password is collected or changed.
  if ($Mode -ne 'Link') { throw 'Expired verification uses an actual delivered link.' }
  $expiredPayload = @{ account = $Account; mode = 'ExpiredLink'; artifact = $artifact } | ConvertTo-Json -Compress
  ConvertTo-SecureString -String $expiredPayload -AsPlainText -Force | Export-Clixml -LiteralPath (Join-Path $taskRoot '.cloud/recovery-expired-input.xml')
  $artifact = $null; $expiredPayload = $null
  Write-Output 'Expired-link input encrypted for this Windows user. No request, password or reset involved.'
  return
}
$newPassword = Read-PrivateText 'Enter a NEW unique staging password (12-128 characters)'
$confirmation = Read-PrivateText 'Confirm the new password'
if ($newPassword.Length -lt 12 -or $newPassword.Length -gt 128 -or $newPassword -cne $confirmation) { throw 'Use matching unique passwords of12-128 characters.' }
$inputPayload = @{ account = $Account; mode = $Mode; artifact = $artifact; nextPassword = $newPassword } | ConvertTo-Json -Compress
$protected = ConvertTo-SecureString -String $inputPayload -AsPlainText -Force
$protected | Export-Clixml -LiteralPath (Join-Path $taskRoot '.cloud/recovery-input.xml')
$artifact = $null; $newPassword = $null; $confirmation = $null; $inputPayload = $null
Write-Output 'Real receipt input encrypted for this Windows user. No request/reset performed. Run npm run recovery:reset promptly (or ask Claude to); the link works once only. Do not share the private file.'
