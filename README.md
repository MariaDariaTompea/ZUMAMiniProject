# ZUMA: Web Edition 🐸🔮

Welcome to our custom-built, modern web adaptation of the classic puzzle game ZUMA! This project was developed entirely from scratch using HTML5, JavaScript, and the **Phaser 3** game framework. 

---

## 🚀 Key Features & Development Progress

We have built a fully featured, performance-optimized, and aesthetically polished Zuma game engine. Here is a breakdown of the core systems we engineered:

### 1. Arcade Physics Migration
- Migrated manual geometry loops to the native **Phaser 3 Arcade Physics Engine** for fired projectiles and collision detection.
- Projectiles now travel Snappy Zuma speed ($950\text{ px/sec}$) handled directly by Phaser's kinematic velocity system.
- Overlap detection uses optimized native browser physics callbacks, preventing $O(N^2)$ distance polling.

### 2. Realistic Insertion Physics
- Refactored insertion logic to determine exactly where a projectile hits a chain ball.
- Using a **vector dot product** against the path's **tangent line** at the point of contact:
  - **Dot Product > 0 (front hit)**: The ball is inserted in front of the target, pushing the target and everything behind it backward.
  - **Dot Product < 0 (back hit)**: The ball is inserted behind the target, pushing the trailing tail backward.
- This creates the exact "snap-in" feel of the original Zuma Deluxe.

### 3. Interactive Spline Path Designer (`editor.html`)
- Built a visual, web-based tool to design, edit, and export custom tracks:
  - **Mathematical Presets**: Generate Classic Inward/Outward Spirals, Zig-zag waves, or Lemniscate Double Loops instantly using slider variables.
  - **Node Drag-and-Drop**: Add control points by clicking, reposition them by dragging, and delete them by right-clicking.
  - **Proximity Alerts**: Warns if a track passes too close to the frog shooter, preventing unplayable paths.
  - **Rolling Ball Simulation**: Run a live test of colored balls rolling along your spline at constant speed.
  - **Instant Code Export**: Copy-paste your custom points array straight into `levels.js`.

### 4. 50 Dynamic Levels & Corner-Rounding
- Programmed **50 unique levels** inside `levels.js`:
  - **Levels 1–15**: Round and circular spirals/nested rings.
  - **Levels 16–30**: Square and rectangular configurations with a custom **corner-rounding algorithm** that smoothens sharp corners into beautiful beveled paths.
  - **Levels 31–40**: Hexagonal and polygonal structures.
  - **Levels 41–50**: Overlapping crossover tracks.

### 5. 3D Bridge Overlay & Depth System
- Added a layered rendering pipeline that supports background assets (`back.png`) and optional transparent overlays (`front.png`).
- Set depth z-indexing (Background = 0, Chain/Balls = 2, Projectiles = 3, Shooter = 4, Bridges/Foreground = 5).
- This allows balls, chains, and flying projectiles to seamlessly slide **underneath** wooden bridges, tree arches, and caves.

### 6. Procedural Map Fallbacks
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

---

## 🕹️ How to Play & Design Locally

1. Clone or download this repository.
2. Because of browser security (CORS) rules for loading images and scripts, you must run a local web server in the directory:
   - **Python**: Run `python -m http.server 8080`
   - **VSCode**: Right-click and choose "Open with Live Server".
3. Open your browser and navigate to:
   - **Play the Game**: [http://localhost:8080/index.html](http://localhost:8080/index.html)
   - **Visual Path Editor**: [http://localhost:8080/editor.html](http://localhost:8080/editor.html)