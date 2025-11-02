@echo off
echo 🚀 Building APK for Cypher Chat...
echo.

REM Check if Android SDK is installed
if not exist "%ANDROID_HOME%" (
    echo ❌ Android SDK not found. Installing...
    echo 📥 Please install Android Studio from: https://developer.android.com/studio
    echo 📁 Install to: C:\Android\Sdk
    pause
    exit /b 1
)

echo ✅ Android SDK found at: %ANDROID_HOME%

REM Create Android project structure
echo 📁 Creating Android project...
mkdir app\src\main\java\com\cypherchat\app
mkdir app\src\main\res\layout
mkdir app\src\main\res\values
mkdir app\src\main\res\mipmap-hdpi
mkdir app\src\main\res\mipmap-mdpi
mkdir app\src\main\res\mipmap-xhdpi
mkdir app\src\main\res\mipmap-xxhdpi
mkdir app\src\main\res\mipmap-xxxhdpi

REM Copy files
echo 📋 Copying project files...
copy MainActivity.java app\src\main\java\com\cypherchat\app\
copy AndroidManifest.xml app\src\main\
copy activity_main.xml app\src\main\res\layout\
copy strings.xml app\src\main\res\values\
copy build.gradle app\
copy gradle.properties .

REM Build APK
echo 🔨 Building APK...
cd app
gradlew assembleDebug

if %errorlevel% equ 0 (
    echo ✅ APK built successfully!
    echo 📱 APK location: app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo 🔄 To install on your phone:
    echo 1. Enable "Unknown Sources" in phone settings
    echo 2. Transfer app-debug.apk to your phone
    echo 3. Tap the APK file to install
) else (
    echo  Build failed. Check Android SDK installation.
)

pause