# ZUMA: Web Edition 🐸🔮

Welcome to our custom-built, modern web adaptation of the classic puzzle game ZUMA! This project was developed entirely from scratch using HTML5, JavaScript, and the **Phaser 3** game framework. 

---

## 🚀 Key Features & Development Progress

We have built a fully featured, performance-optimized, and aesthetically polished Zuma game engine. Here is a breakdown of the core systems we engineered:

### 1. Responsive Screen Scaling & Layout
- Styled a responsive wrapper using CSS `min()` constraints (`width: min(95vw, calc((95vh - 60px) * 4 / 3));`) to ensure the game fits any viewport size without image distortion or stretching.
- Maintains the exact 4:3 aspect ratio of the Phaser canvas while scaling.

### 2. Glassmorphic HTML Status Bar
- Moved the status displays out of the Phaser canvas into a modern glassmorphic HTML/CSS status bar sitting strictly **above** the game screen.
- Features:
  - **Left**: Live score and lives counter (using glowing 💚 heart emojis).
  - **Center**: A sleek, CSS-animated Zuma progress bar that updates dynamically and triggers a glowing pulsing effect when Zuma mode is active.
  - **Right**: A stylized "MENU" button to pause the game.

### 3. Pause & Overlay Menu System
- Created HTML/CSS overlays for various game states:
  - **Pause Menu**: Resume, Restart Level, or Exit Game.
  - **Try Again**: Displays remaining lives and lets you retry the level.
  - **Game Over**: Shows final score and lets you start a new run.
  - **Level Completed**: Advances to the next level.
- Pausing freezes all Phaser physics, updates, and mouse rotations.
- Integrated a global **Escape key** shortcut to easily toggle the Pause Menu.

### 4. Lives & Retry System
- Players start with **3 lives**.
- If balls reach the skull portal (Level Loss), the game decrements a life.
- If lives remain, the player can click "Try Again" to restart the current level, **keeping their accumulated score**.
- If lives reach 0, the Game Over overlay is triggered.

### 5. Board Clear Win Condition (Bug Fix)
- Resolved a bug where clearing the board of all balls before reaching the target score left the game in a deadlock.
- The game now dynamically checks if all balls are cleared. Doing so instantly awards victory, allowing you to advance.

### 6. Arcade Physics Migration
- Migrated manual geometry loops to the native **Phaser 3 Arcade Physics Engine** for fired projectiles and collision detection.
- Projectiles travel at Snappy Zuma speed ($950\text{ px/sec}$) handled directly by Phaser's kinematic velocity system.
- Overlap detection uses optimized native browser physics callbacks, preventing $O(N^2)$ distance polling.

### 7. Realistic Insertion Physics
- Refactored insertion logic to determine exactly where a projectile hits a chain ball.
- Using a **vector dot product** against the path's **tangent line** at the point of contact:
  - **Dot Product > 0 (front hit)**: The ball is inserted in front of the target, pushing the target and everything behind it backward.
  - **Dot Product < 0 (back hit)**: The ball is inserted behind the target, pushing the trailing tail backward.
- This creates the exact "snap-in" feel of the original Zuma Deluxe.

### 8. Interactive Spline Path Designer (`editor.html`)
- Built a visual, web-based tool to design, edit, and export custom tracks:
  - **Mathematical Presets**: Generate Classic Inward/Outward Spirals, Zig-zag waves, or Lemniscate Double Loops instantly using slider variables.
  - **Node Drag-and-Drop**: Add control points by clicking, reposition them by dragging, and delete them by right-clicking.
  - **Proximity Alerts**: Warns if a track passes too close to the frog shooter, preventing unplayable paths.
  - **Rolling Ball Simulation**: Run a live test of colored balls rolling along your spline at constant speed.
  - **Instant Code Export**: Copy-paste your custom points array straight into `levels.js`.

### 9. 50 Dynamic Levels & Corner-Rounding
- Programmed **50 unique levels** inside `levels.js`:
  - **Levels 1–15**: Round and circular spirals/nested rings.
  - **Levels 16–30**: Square and rectangular configurations with a custom **corner-rounding algorithm** that smoothens sharp corners into beautiful beveled paths.
  - **Levels 31–40**: Hexagonal and polygonal structures.
  - **Levels 41–50**: Overlapping crossover tracks.

### 10. 3D Bridge Overlay & Depth System
- Added a layered rendering pipeline that supports background assets (`back.png`) and optional transparent overlays (`front.png`).
- Set depth z-indexing (Background = 0, Chain/Balls = 2, Projectiles = 3, Shooter = 4, Bridges/Foreground = 5).
- This allows balls, chains, and flying projectiles to seamlessly slide **underneath** wooden bridges, tree arches, and caves.

### 11. Procedural Map Fallbacks
- Added a fallback renderer in `BootScene.js` that procedurally draws a dark forest green background and textured stone pathways if the custom asset folder is missing, ensuring all 50 levels are immediately playable out-of-the-box.

---

## 🖼️ Gallery & Screenshots of Our Journey

Here is a look at our development progression and testing phases:

### 1. Prototyping Phase
![Early Prototype](photos/Screenshot%202026-06-19%20214619.png)
*Early prototype testing the chain generation and spacing.*

![Spline Tuning](photos/Screenshot%202026-06-19%20214729.png)
*Fine-tuning the spline curves and frog rotation logic.*

---

### 2. Zuma Mode & Physics Optimizations
![Zuma Mode](photos/Screenshot%202026-06-19%20223851.png)
*Testing the intense Zuma pushback mechanics and speed multipliers.*

![Level Generator](photos/Screenshot%202026-06-19%20225251.png)
*The custom Level Generator tool we built to extract exact 1-to-1 matching templates.*

---

### 3. Modern Asset & Design Integration
![Level 1 Gameplay](photos/Screenshot%202026-06-20%20160534.png)
*Procedural green forest level fallback rendering showing the portal nodes.*

![Custom Art & Layering](photos/Screenshot%202026-06-20%20193846.png)
*Integrating high-quality custom backgrounds (`back.png`) and bridge overlays (`front.png`) so balls roll underneath.*

- **High-Resolution Custom Ball Assets**: Integrated custom high-resolution (**176 × 176 pixels**) ball designs for the red and green balls (`red_normal.png` and `green_normal.png`). These are automatically downscaled to 44px in-game to preserve details on high-DPI displays.

---

## 🕹️ How to Play & Design Locally

1. Clone or download this repository.
2. Because of browser security (CORS) rules for loading images and scripts, you must run a local web server in the directory:
   - **Python**: Run `python -m http.server 8080`
   - **VSCode**: Right-click and choose "Open with Live Server".
3. Open your browser and navigate to:
   - **Play the Game**: [http://localhost:8080/index.html](http://localhost:8080/index.html)
   - **Visual Path Editor**: [http://localhost:8080/editor.html](http://localhost:8080/editor.html)