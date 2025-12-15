# Cursor 캐시 정리 스크립트
# 실행 전에 Cursor를 완전히 종료하세요!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cursor 캐시 정리 스크립트" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$cursorPath = "$env:APPDATA\Cursor"
Write-Host "캐시 위치: $cursorPath" -ForegroundColor Gray
Write-Host ""

# 삭제할 폴더 목록
$foldersToDelete = @(
    "Cache",
    "CachedData",
    "Code Cache",
    "GPUCache",
    "logs"
)

$deletedCount = 0
$totalSize = 0

foreach ($folder in $foldersToDelete) {
    $fullPath = Join-Path $cursorPath $folder
    if (Test-Path $fullPath) {
        try {
            # 폴더 크기 계산
            $size = (Get-ChildItem -Path $fullPath -Recurse -ErrorAction SilentlyContinue | 
                     Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
            if ($size) {
                $sizeMB = [math]::Round($size / 1MB, 2)
                $totalSize += $size
                Write-Host "삭제 중: $folder ($sizeMB MB)" -ForegroundColor Yellow
            } else {
                Write-Host "삭제 중: $folder" -ForegroundColor Yellow
            }
            
            Remove-Item -Path $fullPath -Recurse -Force -ErrorAction Stop
            Write-Host "  ✓ 삭제 완료" -ForegroundColor Green
            $deletedCount++
        }
        catch {
            Write-Host "  ✗ 삭제 실패: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "건너뜀: $folder (존재하지 않음)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($totalSize -gt 0) {
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    Write-Host "총 $deletedCount 개 폴더 삭제 완료" -ForegroundColor Green
    Write-Host "정리된 공간: $totalSizeMB MB" -ForegroundColor Green
} else {
    Write-Host "삭제된 항목: $deletedCount 개" -ForegroundColor Green
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "이제 Cursor를 다시 시작하세요!" -ForegroundColor Yellow



