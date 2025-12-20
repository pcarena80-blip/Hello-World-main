# URBANEASE Project Setup Guide

This project consists of three parts:
1.  **Backend** (Node.js/Express + MongoDB)
2.  **Web Frontend** (Vite + React)
3.  **Mobile App** (React Native / Expo) - Android Studio Integrated

## 1. Prerequisites
-   **Node.js** installed.
-   **MongoDB** installed and running locally (`mongodb://localhost:27017`).
-   **Android Studio** installed (for Mobile App).

## 2. Setting Up the Backend
The backend manages the database and API.

1.  Open a terminal in the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    *   The server will run on `http://localhost:5000`.
    *   Ensure MongoDB is running!

## 3. Running the Web Application
The web app is located in the root directory.

1.  Open a **new terminal** in the root project folder:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open your browser at `http://localhost:3000`.
    *   Login and Signup are now connected to the Backend!

## 4. Running the Mobile Application (Android)
The mobile app is located in the `mobile` folder.

**Option A: Using Android Studio (Recommended)**
1.  Open **Android Studio**.
2.  Select **"Open an existing Android Studio Project"**.
3.  Navigate to `URBANEASE MID/mobile/android` and click OK.
4.  Android Studio will sync gradle and build the project.
5.  Press the **Run** button (green play icon) to launch on an Emulator.

**Option B: Using Command Line**
1.  Open a **new terminal** in the `mobile` folder:
    ```bash
    cd mobile
    npm install
    ```
2.  Start the Metro bundler:
    ```bash
    npm start
    ```
    *   Press `a` to open on Android Emulator (must be running).

## Troubleshooting

### Backend Connection Error (ECONNREFUSED)
If you see errors like `connect ECONNREFUSED 127.0.0.1:27017` in the backend terminal or `http proxy error` in the web terminal:
1.  **MongoDB is not running.**
2.  Start the MongoDB service on your machine.
    *   **Windows**: Open Services (`services.msc`), find "MongoDB Server", right-click and Start. Or run `net start MongoDB` in an Administrator Command Prompt.
3.  Restart the backend server (`npm start` in `backend` folder).

### Mobile Network Error
- Ensure your Android Emulator can reach the backend.
- The app uses `10.0.2.2` to access the host machine's localhost.
- Ensure the backend is running on port 5000. from the Android Emulator. If using a physical device, update `mobile/src/services/api.js` with your machine's LAN IP address.
