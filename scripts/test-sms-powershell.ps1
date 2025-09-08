# MyMobileAPI SMS Test Script
$CLIENT_ID = "1a3be1ae-e72e-4afa-89c0-dee4eb2b6ace"
$API_SECRET = "fe3404b9-8cd8-4c31-bd9b-9977f3ce21db"
$BASE_URL = "https://api.mymobileapi.com/v1"
$SENDER = "SmartKollect"
$TEST_PHONE = "+27606424958"

# Create Basic Auth header
$credentials = "${CLIENT_ID}:${API_SECRET}"
$encodedCredentials = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($credentials))
$authHeader = "Basic $encodedCredentials"

# SMS request body
$body = @{
    to = $TEST_PHONE
    from = $SENDER
    body = "Test SMS from SmartKollect - MyMobileAPI integration is working!"
    testMode = $true
} | ConvertTo-Json

Write-Host "Testing MyMobileAPI SMS service..."
Write-Host "Base URL: $BASE_URL"
Write-Host "Client ID: $CLIENT_ID"
Write-Host "Sender: $SENDER"
Write-Host "Phone: $TEST_PHONE"
Write-Host "Auth Header: $authHeader"
Write-Host ""

Write-Host "Request Body:"
Write-Host $body
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/sms/send" -Method POST -Headers @{
        "Authorization" = $authHeader
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    } -Body $body

    Write-Host "SUCCESS! SMS sent successfully:"
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "FAILED! Error response:"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    Write-Host "Error: $($_.Exception.Message)"
}