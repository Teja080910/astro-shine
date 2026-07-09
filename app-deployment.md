# Android Build & Deployment Guide

## Project Setup

### Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x or higher | JavaScript runtime |
| npm | 10.x or higher | Package manager |
| Java | 17 or 21 | Android build toolchain |
| Android Studio | Hedgehog (2023.1.1+) | Android SDK & emulator |
| Gradle | 8.14.3 (bundled wrapper) | Build system |
| Expo CLI | Latest | React Native tooling |

### Android SDK Requirements

Install via Android Studio → SDK Manager:

| Component | Version |
|-----------|---------|
| `compileSdkVersion` | 36 |
| `targetSdkVersion` | 36 |
| `minSdkVersion` | 26 (set by Expo) |
| `buildToolsVersion` | 36.x |

### Environment Variables

Set these in your shell profile (`~/.bashrc`, `~/.zshrc`):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

### Initial Setup

```bash
# 1. Install project dependencies
cd app
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env
# Edit .env with your server URL

# 3. Generate Android native project (if not already present)
npx expo prebuild --platform android

# 4. Verify Android SDK
./gradlew --version
```

---

## Local Development

### Start the Development Server

```bash
cd app
npx expo start
```

### Run on Android Emulator

```bash
# Start emulator from Android Studio, or:
emulator -avd Pixel_8_API_36

# Then:
npx expo run:android
```

### Run on Physical Device

```bash
# Enable USB debugging on your device
# Connect via USB
adb devices

# Then:
npx expo run:android
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `SDK location not found` | Set `ANDROID_HOME` environment variable |
| `Gradle sync fails` | Check Java version (`java -version`), must be 17 or 21 |
| `adb: command not found` | Add `$ANDROID_HOME/platform-tools` to PATH |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Uninstall existing app: `adb uninstall com.astroshine.mobile` |

---

## Debug Build

### Generate Debug APK

```bash
cd app/android
./gradlew assembleDebug
```

### Output Location

```
app/android/app/build/outputs/apk/debug/app-debug.apk
```

### Install on Device

```bash
adb install app/android/app/build/outputs/apk/debug/app-debug.apk
```

### Features

- Signed with auto-generated debug keystore (`android/app/debug.keystore`)
- Includes JavaScript bundle and assets
- Allows USB debugging and `adb logcat`
- Uses `__DEV__ = true` (development mode)

---

## Release Build

### Configure Signing

**Option A: Use debug keystore (development only)**

The release build defaults to the debug keystore. This is fine for testing but **not for production distribution**.

**Option B: Generate a production keystore**

```bash
# Generate a keystore (keep this file safe and secure!)
keytool -genkey -v -keystore release.keystore \
  -alias release-key \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype JKS
```

**Option C: Use environment variables (recommended for CI/CD)**

```bash
export ANDROID_KEYSTORE_PATH=/path/to/release.keystore
export ANDROID_KEYSTORE_PASSWORD=your-store-password
export ANDROID_KEY_ALIAS=release-key
export ANDROID_KEY_PASSWORD=your-key-password
```

### Generate Release APK

```bash
cd app/android
./gradlew assembleRelease
```

### Output Location

```
app/android/app/build/outputs/apk/release/app-release.apk
```

### Verify the Build

```bash
# Check APK signature
jarsigner -verify -verbose -certs app/android/app/build/outputs/apk/release/app-release.apk

# Check APK contents
unzip -l app/android/app/build/outputs/apk/release/app-release.apk | head -20
```

### Build Optimization

The release build includes:

- **Hermes** JavaScript engine (faster startup, smaller bundle)
- **R8** code shrinking (enabled via `android.enableMinifyInReleaseBuilds=true`)
- **Resource shrinking** (removes unused resources)
- **PNG crunching** (compresses PNG assets)
- **ProGuard** rules in `android/app/proguard-rules.pro`

---

## Project Structure

```
app/android/
├── app/
│   ├── build/                          # Build outputs (APKs, intermediates)
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml     # App manifest
│   │   │   ├── java/                   # Native Java/Kotlin code
│   │   │   └── res/                    # Resources (icons, strings)
│   │   ├── debug/
│   │   │   └── AndroidManifest.xml     # Debug-only manifest overrides
│   │   └── debugOptimized/
│   │       └── AndroidManifest.xml     # Optimized debug manifest
│   ├── build.gradle                    # App-level Gradle config
│   ├── proguard-rules.pro              # ProGuard/R8 rules
│   └── debug.keystore                  # Debug signing key
├── build.gradle                        # Project-level Gradle config
├── settings.gradle                     # Module settings
├── gradle.properties                   # Gradle properties
├── gradlew / gradlew.bat              # Gradle wrapper scripts
├── gradle/wrapper/
│   ├── gradle-wrapper.jar             # Gradle wrapper binary
│   └── gradle-wrapper.properties       # Gradle version config
└── .gitignore                          # Android-specific ignores
```

### Key Configuration Files

| File | Purpose |
|------|---------|
| `android/app/build.gradle` | App build config (SDK versions, signing, build types) |
| `android/build.gradle` | Project-level build config (plugins, repositories) |
| `android/gradle.properties` | Gradle JVM args, AndroidX, Hermes, architecture flags |
| `android/settings.gradle` | Module includes, React Native plugin config |
| `android/app/src/main/AndroidManifest.xml` | App permissions, activities, intent filters |

---

## Deployment

### Version Updates

Update the version in `app/app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

Then regenerate the native project:

```bash
npx expo prebuild --platform android --clean
```

### Build Verification Checklist

- [ ] App builds successfully (`./gradlew assembleRelease`)
- [ ] APK is signed (`jarsigner -verify app-release.apk`)
- [ ] Version code and name are correct
- [ ] Environment variables are configured
- [ ] `.env` file is present with correct values
- [ ] App runs on emulator/physical device
- [ ] API connectivity works
- [ ] Push notifications (if configured)

### Distribution

**Direct APK install:**
```bash
adb install app/android/app/build/outputs/apk/release/app-release.apk
```

**Google Play Store:**
1. Generate a signed AAB: `./gradlew bundleRelease`
2. Output: `app/android/app/build/outputs/bundle/release/app-release.aab`
3. Upload to Google Play Console

---

## Troubleshooting

### Gradle Sync Failures

```bash
# Clean and rebuild
cd app/android
./gradlew clean
./gradlew assembleDebug
```

### SDK Version Mismatch

```bash
# Check installed SDK versions
ls $ANDROID_HOME/platforms/
ls $ANDROID_HOME/build-tools/

# Install missing versions via Android Studio SDK Manager
```

### Missing Android SDK

```bash
# Error: "SDK location not found"
# Solution: Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
```

### Java Version Mismatch

```bash
# Check Java version
java -version
# Must be Java 17 or 21

# Set Java version (Ubuntu/Debian)
sudo update-alternatives --config java
```

### Signing Configuration Errors

```bash
# Error: "Keystore was tampered with, or password was incorrect"
# Solution: Verify keystore password
keytool -list -v -keystore release.keystore -storepass your-password
```

### Build Cache Issues

```bash
# Clear Gradle cache
cd app/android
./gradlew cleanBuildCache
rm -rf .gradle/

# Clear npm cache
cd app
npm cache clean --force
rm -rf node_modules
npm install --legacy-peer-deps
npx expo prebuild --platform android --clean
```

### APK Installation Fails

```bash
# Error: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
adb uninstall com.astroshine.mobile
adb install app-release.apk

# Error: "INSTALL_FAILED_NO_MATCHING_ABIS"
# Build for specific architecture:
cd app/android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```
