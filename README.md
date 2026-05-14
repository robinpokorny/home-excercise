# Home Exercise Tracker PWA

A beautiful, minimal, and guided daily fitness tracker built as a Progressive Web App (PWA). It is designed to be pinned directly to an iPhone home screen, offering a native app-like experience with premium dark mode aesthetics and intelligent audio/visual cues.

## Features

- **Guided Daily Routine**: A pre-configured list of exercises to get you moving.
  - Plank (4 x 30s)
  - Hollow Body Hold (3 x 20s)
  - Lunge Left Leg (2 x 20s)
  - Lunge Right Leg (2 x 20s)
  - Hip Movement (1 x 60s)
- **Rest Phase Management**: Built-in 30s recovery periods between sets and exercises, with intuitive on-the-fly controls (+10s, -10s, Skip).
- **Navigation Controls**: Easily skip forward to the next exercise or skip backward if you accidentally missed a tap.
- **Smart Audio Cues**: Utilizes the native Web Audio API to play start bells, end bells, and preparation ticks—without needing to load external `.mp3` files.
- **On-Device Logging**: Track how you felt with a post-workout star rating. Logs are kept privately in your browser's `localStorage` and display exactly how many sets you completed versus skipped.
- **Premium Design**: Hand-crafted CSS using glassmorphism, dynamic gradients, and smooth micro-animations.

## Installation & Setup (Local Development)

To run the application locally on your machine and test it on your devices:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   To test it on your phone, you need to expose the local server to your network.
   ```bash
   npm run dev -- --host
   ```

3. **Install on iOS (iPhone)**:
   - Ensure your iPhone is on the **same Wi-Fi network** as your computer.
   - Open **Safari** on your iPhone.
   - Type in the `Network` address printed in your terminal (e.g., `http://192.168.x.x:5173`).
   - Tap the **Share** icon at the bottom of Safari (the square with an arrow pointing up).
   - Scroll down and tap **Add to Home Screen**.
   - Launch the app from your home screen.

*Note: iOS requires a physical tap on the screen to unlock the Web Audio API. Tapping the "Start Workout" button serves as this interaction.*

## Architecture & Contributions

For information regarding the architecture, state management, or instructions on how to add new exercises and generate consistent images, please refer to the [AGENTS.md](./AGENTS.md) file.
