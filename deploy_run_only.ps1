$ErrorActionPreference = "Stop"

Write-Host "Granting Secret Accessor permissions to default compute service account..."
$ProjectId = gcloud config get-value project
$ProjectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$ServiceAccount = "$ProjectNumber-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $ProjectId `
    --member="serviceAccount:$ServiceAccount" `
    --role="roles/secretmanager.secretAccessor" | Out-Null

Write-Host "Permissions granted. Re-deploying to Cloud Run (container is cached, will be fast)..."
$envContent = Get-Content .env.local
$secretsList = @()

foreach ($line in $envContent) {
    if ($line.Trim() -eq '' -or $line.StartsWith('#')) { continue }
    $split = $line.Split('=', 2)
    $key = $split[0].Trim()
    
    if ($key -eq "NEXT_PUBLIC_APP_URL") { continue }
    
    # Use explicit variable scoping in string template to avoid PowerShell parsing colon as scope
    $secretsList += "${key}=${key}:latest"
}

$secretsFlag = $secretsList -join ","

gcloud run deploy wire-composer-service `
    --source . `
    --region=us-central1 `
    --allow-unauthenticated `
    --set-secrets=$secretsFlag `
    --format="value(status.url)" | Out-File -FilePath service_url.txt -Encoding utf8

$ServiceUrl = (Get-Content service_url.txt).Trim()
Write-Host "Initial deployment succeeded! App is alive at: $ServiceUrl"

Write-Host "Updating NEXT_PUBLIC_APP_URL environment variable to match the deployed URL..."
gcloud run services update wire-composer-service `
    --region=us-central1 `
    --set-env-vars="NEXT_PUBLIC_APP_URL=$ServiceUrl" | Out-Null

$CronSecret = $null
foreach ($line in $envContent) {
    if ($line -match '^\s*CRON_SECRET\s*=\s*(.+)\s*$') {
        $CronSecret = $matches[1].Trim().Trim('"').Trim("'")
        break
    }
}

$SchedulerJob = "wire-composer-run-scheduled"
$SchedulerLocation = "us-central1"
$CronUri = "$ServiceUrl/api/cron/run-scheduled"

if (-not $CronSecret) {
    Write-Host "WARNING: CRON_SECRET missing from .env.local - scheduled pipelines will not run until it is set and this script is re-run."
} else {
    Write-Host "Enabling Cloud Scheduler API (if needed)..."
    gcloud services enable cloudscheduler.googleapis.com --project=$ProjectId | Out-Null

    Write-Host "Ensuring Cloud Scheduler job '$SchedulerJob' (every 5 minutes)..."
    $prevErr = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    gcloud scheduler jobs describe $SchedulerJob --location=$SchedulerLocation 2>$null | Out-Null
    $schedulerExists = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $prevErr
    if ($schedulerExists) {
        gcloud scheduler jobs update http $SchedulerJob `
            --location=$SchedulerLocation `
            --schedule="*/5 * * * *" `
            --uri=$CronUri `
            --http-method=GET `
            --headers="Authorization=Bearer $CronSecret" `
            --attempt-deadline=540s `
            --time-zone=UTC | Out-Null
        Write-Host "Cloud Scheduler job updated."
    } else {
        gcloud scheduler jobs create http $SchedulerJob `
            --location=$SchedulerLocation `
            --schedule="*/5 * * * *" `
            --uri=$CronUri `
            --http-method=GET `
            --headers="Authorization=Bearer $CronSecret" `
            --attempt-deadline=540s `
            --time-zone=UTC | Out-Null
        Write-Host "Cloud Scheduler job created."
    }
}

Write-Host "========================================="
Write-Host "Deployment complete and fully secured!"
Write-Host "Live URL: $ServiceUrl"
if ($CronSecret) {
    Write-Host "Scheduled pipelines: Cloud Scheduler -> $CronUri"
}
Write-Host "========================================="
