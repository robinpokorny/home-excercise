# AGENTS.md: Developer Guide & Architecture

This document describes the architectural choices, tools, and processes used to build the Home Exercise Tracker, as well as instructions on how to add new exercises and generate consistent assets.

## Architecture & Tech Stack

- **Framework**: Built with React and TypeScript using Vite.
- **Styling**: Vanilla CSS (`src/index.css`) with CSS variables defining a unified design system. We use a premium dark mode aesthetic with glassmorphism and gradient accents. No external CSS frameworks (like Tailwind) are used to keep the bundle size small and maintain full control over animations.
- **State Management**: React's native `useState` and `useEffect` manage the workout flow, phase transitions (`prep` -> `work` -> `rest`), and pause states.
- **Audio API**: The `WorkoutEngine.ts` utilizes the native Web Audio API to generate beeps and bells on the fly. This prevents the need for external `.mp3` files, ensuring instant playback without loading latency.
- **Storage**: The `storage.ts` service uses `localStorage` to save workout logs and summary metadata (sets completed, skipped exercises).
- **PWA (Progressive Web App)**: Configured via `manifest.json` and meta tags in `index.html` to be installable directly onto an iOS or Android device.

## Creating New Exercises

To add a new exercise to the routine, you must update the configuration and generate a new illustration.

### 1. Code Configuration

1. Open `src/WorkoutEngine.ts`.
2. Locate the `routine` array.
3. Add a new object conforming to the `Exercise` interface:
   ```typescript
   { 
     id: 'new_exercise_id', 
     name: 'Your New Exercise', 
     sets: 3, 
     durationSeconds: 30, 
     image: '/images/new_exercise.png' 
   }
   ```
4. Adjust the order of the array to change where the exercise appears in the workout flow.

### 2. Generating Consistent Imagery

To ensure visual consistency, any new exercise image must follow the same prompt structure used for the existing assets.

If you are using an AI Image Generator tool (like Gemini's `generate_image` or Midjourney), use the following base prompt formula:

> "A flat design vector illustration of a person doing a [INSERT EXERCISE HERE] exercise. Clean, modern, dark background, vibrant neon accents (blue and purple). Suitable for a premium fitness app."

**Example for a Push-up:**
> "A flat design vector illustration of a person doing a push-up exercise. Clean, modern, dark background, vibrant neon accents (blue and purple). Suitable for a premium fitness app."

### 3. Adding the Asset
1. Once the image is generated, crop it to a square aspect ratio (e.g., 512x512) if it isn't already.
2. Save it as a `.png` file.
3. Place the file inside the `public/images/` directory.
4. Ensure the `image` path in your `WorkoutEngine.ts` configuration points to the correct filename.

## Modifying Flow Logic

- **Default Rest Duration**: Configured in `src/App.tsx` via `DEFAULT_REST_TIME` (default 30 seconds).
- **Prep Time**: The time before an exercise begins is configured via `PREP_TIME` (default 5 seconds).
- **Audio Tones**: Frequencies for the tick, start bell, and end bell can be modified inside `AudioController.playTone` within `src/WorkoutEngine.ts`.
