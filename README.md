# JSON Formatter Pro

A fast, private JSON formatter and validator that runs entirely in your browser. Paste, drop, or upload JSON to format, minify, validate, and inspect it. Nothing is uploaded to a server, and your JSON is never stored.

## Features

- Format and beautify JSON with 2, 4, or 8 spaces, or tabs
- Minify JSON for the smallest possible payload
- Validate with clear, line-aware error messages and fix suggestions
- Sort object keys alphabetically
- Choose between pretty-printed and compact arrays
- Toggle nested object and array pretty-printing
- Inspect key statistics: size, lines, keys, objects, arrays, depth, and value types
- Explore data in an expandable tree view
- Copy or download formatted and minified output
- Import `.json` files up to 20 MB via picker or drag and drop
- Switch between light and dark themes with OS preference detection
- Keyboard shortcuts and a responsive layout for desktop and mobile

## Privacy

All parsing and formatting happen locally on your device. JSON content never leaves the browser and is never written to `localStorage`. Only your theme preference is persisted. Large documents are processed in a Web Worker, with a main-thread fallback when workers are unavailable.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- CodeMirror 6
- Lucide icons

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## Scripts

```bash
npm run dev      # Start the development server
npm run build    # Type-check and build for production
npm run lint     # Run Oxlint
npm run preview  # Preview the production build
```

## Keyboard Shortcuts

| Shortcut               | Action                          |
| ---------------------- | ------------------------------- |
| `Ctrl/Cmd + Enter`     | Validate JSON                   |
| `Ctrl/Cmd + Shift + M` | Minify and show minified output |

## Project Structure

```text
src/
  components/       UI components, panels, and primitives
  hooks/            Theme and JSON worker hooks
  lib/json/         Pure parsing, formatting, stats, and file utilities
  types/            Shared TypeScript types
  workers/          Web Worker entry point
```

Formatting logic lives in `src/lib/json/core.ts` and is shared by the worker and the main-thread fallback.
