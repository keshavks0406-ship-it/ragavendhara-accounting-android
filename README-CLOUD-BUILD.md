# Raghavendra & Co. Accounting — Cloud APK build

This folder contains the React/TypeScript app and a GitHub Actions workflow at `.github/workflows/android-apk.yml`.

## GitHub upload
1. Extract this ZIP on your computer.
2. Open your private GitHub repository.
3. Choose **Add file → Upload files**.
4. Upload the *contents* of this extracted folder (including the hidden `.github` folder). Do not upload only the ZIP file and do not create an extra enclosing folder in the repository.
5. Commit the upload to the `main` branch.

## Build
The workflow starts automatically after the commit. It can also be started from the repository's **Actions** tab using **Build Android APK → Run workflow**.

## Download
When the workflow finishes successfully, open the completed run and download the artifact named `raghavendra-accounting-debug-apk`. Extract the downloaded artifact ZIP to get `app-debug.apk`.

This workflow creates a debug APK for testing, not a signed Play Store release. Test all accounting, backup/restore, export, and printing features before using it for live records.
