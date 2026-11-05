# Raghavendra & Co. Accounting — Android offline build

This project keeps the existing React/TypeScript accounting screens and packages them as an Android app with Capacitor.

## What this Android setup provides

- Installable Android app package (APK), with the web app bundled inside the APK.
- Local SQLite database on Android; no internet connection or server is required for accounting entries.
- Browser/PWA development continues to use localStorage.
- One-time migration of existing `raghavendra_co_books_v2` browser data into SQLite on the first native launch.
- Full JSON backup and restore. The Android backup action opens the native share sheet so the file can be saved to local storage, USB/nearby transfer apps, or another device.
- Each phone has its own independent database. To move data between phones, create a backup on the source phone and restore it on the destination phone. Restore replaces the destination phone's current accounting data; export a backup first if that data must be retained.
- Excel export remains available.

## Requirements

- Node.js 20 or newer (Node 22 recommended)
- npm
- Android Studio with Android SDK installed
- JDK 17 (normally installed/configured by current Android Studio)

## Install dependencies and create Android project

From this folder:

```bash
npm install
npx cap add android
```

The `android/` folder is generated locally by Capacitor and is intentionally not included in this source archive.

## Build and open in Android Studio

```bash
npm run android:sync
npm run android:open
```

In Android Studio, wait for Gradle sync, select a connected Android phone or emulator, and press Run. The first Android build needs internet to download Gradle/Maven/npm dependencies. The installed application itself is designed to work offline.

## Build a debug APK

```bash
npm run android:build:debug
```

APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a phone using Android Studio, `adb install`, or copy the APK to the phone and open it. Android may ask you to allow installation from that file manager/browser.

## Build a signed release APK

Create a signing key in Android Studio (Build > Generate Signed Bundle / APK), choose APK, and follow the signing wizard. Keep the keystore and passwords in a secure place; losing them can prevent future updates from installing over the existing app.

## Manual transfer between phones

1. On the source phone, open **Backup & Restore** and choose **Download Backup (.json)**.
2. In the Android share sheet, save the JSON file or send it to the destination phone using USB, Bluetooth, Quick Share, or another file-transfer method.
3. On the destination phone, open **Backup & Restore**, select the JSON file, and confirm the restore.
4. Check the company details, invoice sequence, masters, sales, purchases, receipts, payments, and ledgers before continuing work.

Do not restore an old backup over newer transactions unless that replacement is intended. Keep more than one copy of important backups.

## Important operational notes

- There is no live multi-device synchronization. The phones are separate books until a backup is manually transferred and restored.
- Do not edit the same accounting period independently on two phones and then restore one over the other: the current backup format is a full replacement, not a merge.
- SQLite is currently configured without database encryption. Protect the phone with Android screen lock and keep backup files private. A future production-hardening step should add encrypted backups/database protection and a tested restore-confirmation workflow.
- Validate invoice printing, PDF/print output, and Excel file sharing on the target Android devices before using the app for live statutory/accounting records.
- Keep the existing original project and all pre-conversion backups until the Android version has been fully tested.

## Useful commands

```bash
npm run dev             # browser development
npm run build           # production web bundle
npm run lint            # TypeScript check
npm run android:sync    # build web assets and sync Capacitor Android project
npm run android:open    # open Android Studio project
npm run android:run     # build and run on a connected device
```
