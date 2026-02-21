@echo off
echo ========================================
echo Kepler TapTrack - Database Update
echo ========================================
echo.

cd server

echo [1/2] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Error: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo [2/2] Pushing schema changes to database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo Error: Failed to push schema changes
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database updated successfully!
echo ========================================
echo.
pause
