[CmdletBinding()]
param([string]$Repo = 'biocircuit')
# Publishes this project as a PUBLIC GitHub repository and deploys the connected
# staging frontend to GitHub Pages (free for public repositories), then allows
# the Pages origin on the staging Supabase project. Run it yourself:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-github-pages.ps1
# Only public browser configuration (Supabase URL + publishable key) is sent to
# GitHub, as repository variables. Nothing from .cloud/ or .env.local is committed.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$target = Get-Content -LiteralPath '.cloud/staging.json' -Raw | ConvertFrom-Json
if ($target.projectRef -ne 'ibxubsegrabpspopdgep') { throw 'Unexpected staging target.' }
$owner = (gh api user -q .login).Trim()
$pagesOrigin = "https://$owner.github.io"
$siteUrl = "$pagesOrigin/$Repo/"

# 1. Read the two PUBLIC browser values from .env.local without printing them.
$envValues = @{}
Get-Content -LiteralPath '.env.local' | ForEach-Object {
  if ($_ -match '^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_PUBLISHABLE_KEY)\s*=\s*(.+?)\s*$') { $envValues[$Matches[1]] = $Matches[2].Trim('"').Trim("'") }
}
if (-not $envValues.VITE_SUPABASE_URL -or -not $envValues.VITE_SUPABASE_PUBLISHABLE_KEY) { throw 'Public Supabase browser configuration missing from .env.local.' }
if ($envValues.VITE_SUPABASE_PUBLISHABLE_KEY -like 'sb_secret_*') { throw 'Refusing: that is a secret key, not a publishable key.' }

# 2. Commit any pending changes and create the public repository.
if (-not (git status --porcelain)) { Write-Output 'Working tree clean.' } else { git add -A; git commit -q -m 'Update before publishing'; Write-Output 'Committed pending changes.' }
gh repo view "$owner/$Repo" *> $null
if ($LASTEXITCODE -ne 0) { gh repo create "$owner/$Repo" --public --description 'BioCircuit research community (staging preview)' | Out-Null }
if (-not (git remote | Select-String -SimpleMatch 'origin')) { git remote add origin "https://github.com/$owner/$Repo.git" }

# 3. Public build configuration as repository variables (values piped, not echoed).
$envValues.VITE_SUPABASE_URL | gh variable set VITE_SUPABASE_URL --repo "$owner/$Repo"
$envValues.VITE_SUPABASE_PUBLISHABLE_KEY | gh variable set VITE_SUPABASE_PUBLISHABLE_KEY --repo "$owner/$Repo"

# 4. Enable Pages with GitHub Actions as the source, then push (push triggers the deploy).
gh api "repos/$owner/$Repo/pages" *> $null
if ($LASTEXITCODE -ne 0) { gh api -X POST "repos/$owner/$Repo/pages" -f build_type=workflow | Out-Null }
git push -u origin main

# 5. Staging Supabase: allow the Pages origin for Edge Functions and redeploy them
#    (exact origins only; the local loopback origin stays allowed for tests).
$cli = 'node_modules/@supabase/cli-windows-x64/bin/supabase.exe'
& $cli secrets set "ALLOWED_ORIGIN=$($target.frontendOrigin),$pagesOrigin" --project-ref $target.projectRef
foreach ($fn in 'scholarly-search', 'account-delete', 'avatar', 'project-images') {
  & $cli functions deploy $fn --project-ref $target.projectRef --use-api
}

Write-Output ''
Write-Output "Deploy started: https://github.com/$owner/$Repo/actions"
Write-Output "Site (after the workflow finishes, ~2-3 min): $siteUrl"
Write-Output ''
Write-Output 'One dashboard step remains (Supabase -> Authentication -> URL Configuration):'
Write-Output "  Site URL: $siteUrl"
Write-Output "  Add redirect URL: ${siteUrl}account/recovery   (keep http://127.0.0.1:5190/account/recovery)"
