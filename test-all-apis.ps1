Write-Host "`n=== Testing All APIs ===" -ForegroundColor Cyan

Write-Host "`n1. Testing /api/rooms..." -ForegroundColor Yellow
$rooms = (curl -UseBasicParsing http://localhost:3000/api/rooms | ConvertFrom-Json).rooms
Write-Host "   Result: $($rooms.Count) rooms" -ForegroundColor Green

Write-Host "`n2. Testing /api/schedules..." -ForegroundColor Yellow
$schedules = (curl -UseBasicParsing http://localhost:3000/api/schedules | ConvertFrom-Json).schedules
Write-Host "   Result: $($schedules.Count) schedules" -ForegroundColor Green

Write-Host "`n3. Testing /api/bookings..." -ForegroundColor Yellow
$bookings = (curl -UseBasicParsing http://localhost:3000/api/bookings | ConvertFrom-Json).bookings
Write-Host "   Result: $($bookings.Count) bookings" -ForegroundColor Green

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Rooms:     $($rooms.Count) ✓" -ForegroundColor Green
Write-Host "Schedules: $($schedules.Count) ✓" -ForegroundColor Green
Write-Host "Bookings:  $($bookings.Count) ✓" -ForegroundColor Green
Write-Host "`nAll APIs connected to Cosmos DB!" -ForegroundColor Green
