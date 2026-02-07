# 🔐 Google OAuth Setup Guide

To enable real "Continue with Google" functionality, you need to create a Client ID in the Google Cloud Console. Follow these steps:

## 1. Create a Project in Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **Subscribely**.

## 2. Configure OAuth Consent Screen
1. Search for **"OAuth consent screen"** in the console.
2. Select **External** and click **Create**.
3. Fill in the required app information:
   - **App name**: Subscribely
   - **User support email**: Your email
   - **Developer contact info**: Your email
4. Click **Save and Continue** until you reach the dashboard.

## 3. Create Credentials (Client ID)
1. Go to the **Credentials** tab.
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. **Application type**: Web application.
4. **Name**: Subscribely Web Client.
5. **Authorized JavaScript origins**:
   - `http://localhost:3000`
6. Click **Create**.

## 4. Add the Client ID to your Project
1. Copy the **Client ID** (it looks like `12345678-abc.apps.googleusercontent.com`).
2. Open your `frontend/.env` file.
3. Replace the placeholder with your real ID:
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=your_real_id_here
   ```
4. **Restart your project** for the changes to take effect.

> [!IMPORTANT]
> Once you add the real Client ID, the "Mock Mode" button will automatically disappear, and the real Google login popup will take its place.
