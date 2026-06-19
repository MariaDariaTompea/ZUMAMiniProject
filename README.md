# ZUMA: Web Edition 🐸🔮

Welcome to our custom-built, modern web adaptation of the classic puzzle game ZUMA! This project was developed entirely from scratch using HTML5, JavaScript, and the **Phaser 3** game framework. 

## Development Progress: JUNE

During the month of June, we accomplished a massive amount of core gameplay programming and engine architecture. Here is a breakdown of what we built:

- **Physics & Spline Paths**: Implemented a robust bezier spline system to perfectly guide the chain of balls along complex curves and tracks.
- **Dynamic Chain Logic**: Engineered the ball collision, precise spacing, and complex chain-merging logic. When you destroy balls in the middle of a chain, if the colors on both sides match, they dynamically pull together with a magnetic force!
- **Zuma Mode!**: Added the exhilarating "Zuma" mode! When the Zuma gauge fills up, the entire chain slams into reverse! Balls that get pushed all the way back into the spawning hole are permanently destroyed and explode into particles, rewarding the player with massive bonus points!
- **Level Progression System**: Programmed a dynamic level generator and coded the math for 10 uniquely challenging map layouts (ranging from simple loops to chaotic overlapping mazes). 
- **Polished Aesthetics**: Integrated beautiful custom art assets, 3D shading on the spheres, particle explosions when balls shatter, and a dynamically rotating frog shooter!

### Screenshots of our Progress

Here is a look at our development journey and testing phases:

![Early Prototype](photos/Screenshot%202026-06-19%20214619.png)
*Early prototype testing the chain generation and physics.*

![Spline Tuning](photos/Screenshot%202026-06-19%20214729.png)
*Fine-tuning the spline curves and frog rotation logic.*

![Art Integration](photos/Screenshot%202026-06-19%20215539.png)
*Integrating our first beautiful custom lilypad map asset!*

![Zuma Mode](photos/Screenshot%202026-06-19%20223851.png)
*Testing the intense Zuma pushback mechanics and speed multipliers.*

![Overlapping Paths](photos/Screenshot%202026-06-19%20223907.png)
*A look at the ball spacing, collision scaling, and overlap mechanics.*

![Level Generator](photos/Screenshot%202026-06-19%20225251.png)
*The custom Level Generator tool we built to extract exact 1-to-1 matching art templates.*

## How to Play Locally

1. Clone or download this repository.
2. Due to browser security rules (CORS), you must run a local web server (e.g., `python -m http.server 8080` or using a VSCode Live Server extension).
3. Open the local address in your web browser and enjoy!