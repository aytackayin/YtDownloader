# Project Standards Workflow

- **Frameworks**: React (v18+), Vite (Latest)
- **Desktop Bridge**: Tauri (v1 or v2 depending on latest stable cli)
- **Backend Language**: Python (3.10+) with `yt-dlp` library
- **Styling**: TailwindCSS (v3+)

## Hard Constraints
- Code must follow this strict React + Tauri + Python structure.
- Errors must not be logged to the console using `console.log` or `console.error` in production. For debugging, they must be removed immediately after testing.
- Test files must be temporary and deleted after use.
- The AI agent MUST always communicate with the user in Turkish. Code explanations/warnings MUST be in Turkish.
- UI must use modern design, dark mode, no generic colors, smooth animations.
