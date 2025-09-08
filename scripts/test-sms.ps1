# SMS Test Script for PowerShell
# Make sure your Next.js server is running with: npm run dev

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "           SMS SERVICE TEST (PowerShell)" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$BaseURL = "http://localhost:3000"
$PhoneNumber = "0606424958"

# Test configuration
Write-Host "📋 Testing SMS service configuration..." -ForegroundColor Yellow
Write-Host "GET $BaseURL/api/test-sms" -ForegroundColor Gray
Write-Host ""

try {
    $configResponse = Invoke-RestMethod -Uri "$BaseURL/api/test-sms" -Method GET -Headers @{
        "Accept" = "application/json"
    }
    
    Write-Host "✅ Configuration test response:" -ForegroundColor Green
    $configResponse | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ Configuration test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Test SMS sending
Write-Host "📱 Sending test SMS to $PhoneNumber..." -ForegroundColor Yellow
Write-Host "POST $BaseURL/api/test-sms" -ForegroundColor Gray
Write-Host ""

try {
    $smsBody = @{
        phoneNumber = $PhoneNumber
    } | ConvertTo-Json
    
    $smsResponse = Invoke-RestMethod -Uri "$BaseURL/api/test-sms" -Method POST -Body $smsBody -Headers @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    Write-Host "✅ SMS test response:" -ForegroundColor Green
    $smsResponse | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ SMS test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "Error Details:" -ForegroundColor Red
        $_.ErrorDetails.Message
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Test PTP SMS
Write-Host "💰 Testing PTP SMS..." -ForegroundColor Yellow
Write-Host "POST $BaseURL/api/send-ptp-sms" -ForegroundColor Gray
Write-Host ""

try {
    $paymentDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    
    $ptpBody = @{
        customerName = "Test Customer"
        phoneNumber = $PhoneNumber
        amount = 1500.00
        paymentDate = $paymentDate
        paymentMethod = "bank_transfer"
        notes = "Test PTP from PowerShell script"
    } | ConvertTo-Json
    
    $ptpResponse = Invoke-RestMethod -Uri "$BaseURL/api/send-ptp-sms" -Method POST -Body $ptpBody -Headers @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    Write-Host "✅ PTP SMS response:" -ForegroundColor Green
    $ptpResponse | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ PTP SMS test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "Error Details:" -ForegroundColor Red
        $_.ErrorDetails.Message
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "                 TEST COMPLETE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Check your phone for test messages!" -ForegroundColor Green
Write-Host "💡 If tests failed, check your .env.local file for correct MyMobileAPI credentials" -ForegroundColor Yellow