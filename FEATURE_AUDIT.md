# PixelMint Feature Audit: Current Capabilities vs. EZGIF Benchmark

**Project:** PixelMint Media Suite  
**Date:** October 2026  
**Auditor:** Senior Product & Reverse-Engineering Team  
**Scope:** Rigorous comparison between EZGIF public features and PixelMint's current working client-side implementation.

---

## 1. Executive Summary

PixelMint delivers 7 core client-side media workstations built on a unified Vite + JavaScript architecture using `gifenc`, `omggif`, and HTML5 Canvas APIs. All 7 tools are functional with real file processing, client-side decoding/encoding, and inter-tool pipeline chaining.

This audit distinguishes what is **fully working**, what is **partially implemented**, and what is **missing from EZGIF** for future roadmap development.

---

## 2. Core Workstations Audit Matrix

| Workstation / Tool | Status in PixelMint | Implemented Capabilities | Features Missing vs. EZGIF |
| :--- | :---: | :--- | :--- |
| **GIF Maker** (`/maker`) | **Fully Functional** | • Multi-frame drag-and-drop / file picker<br>• Frame reel display & individual frame delay<br>• Global delay slider with dynamic FPS calculator<br>• NeuQuant palette quantization (256, 128, 64, 32)<br>• Floyd-Steinberg dithering vs None<br>• Infinite loop or custom loop count<br>• Real-time animated GIF encoding via `gifenc`<br>• Pipeline chaining into other tools | • Crossfade frame transitions<br>• Cadence filtering ("Skip every Nth frame")<br>• Canvas gravity alignment for mixed frame sizes |
| **Video to GIF** (`/video-to-gif`) | **Fully Functional** | • HTML5 `<video>` preview player with metadata display<br>• Precise Start / End trimming in seconds with "Current Pos" capture buttons<br>• Resolution presets (Original, 640px, 480px, 320px, 240px)<br>• Framerate controls (5, 10, 15, 20 FPS)<br>• Hardware-accelerated frame extraction to canvas<br>• Floyd-Steinberg dithering & color quantization<br>• Instant download & pipeline chaining | • Video stabilization<br>• Audio track joiner/extractor<br>• Remote URL ingestion (restricted by browser CORS policies) |
| **Image & GIF Resizer** (`/resize`) | **Fully Functional** | • Handles static images (PNG, JPG, WebP) and animated GIFs<br>• Preserves animation cycles & frame delays<br>• Proportional fit, stretch, or center-and-crop modes<br>• Aspect ratio lock toggle<br>• Quick percentage presets (25%, 50%, 75%, 150%, 200%)<br>• Bicubic canvas resampling<br>• Download & chaining | • Canvas border expansion with color fill<br>• Coalesce unoptimize flag |
| **Image & GIF Cropper** (`/crop`) | **Fully Functional** | • Interactive PointerEvent marquee selection with 4 corner drag handles<br>• Bi-directional coordinate binding (X, Y, Width, Height)<br>• Aspect ratio presets: Free, 1:1, 16:9, 4:3, 9:16, 3:2<br>• Multi-frame GIF cropping preserving animation<br>• Download & chaining | • Direct SVG `viewBox` vector crop without rasterization<br>• Automatic transparent border trimming |
| **GIF Optimizer** (`/optimize`) | **Fully Functional** | • Color reduction (128, 64, 32, 256 colors)<br>• Frame decimation (keep all, drop every 2nd frame, or drop 2 of every 3 frames while adjusting delay)<br>• Resolution scaling (100%, 80%, 65%, 50%)<br>• Floyd-Steinberg vs No Dither toggle<br>• File size savings calculation (-% saved pill)<br>• Download & chaining | • Gifsicle WASM LZW lossy noise dictionary compression (ezgif default)<br>• Transparency optimization fuzz factor |
| **Effects Studio** (`/effects`) | **Fully Functional** | • Real-time live canvas preview<br>• One-click presets (Original, Grayscale, Vintage Sepia, Invert, Vibrant Pop, Cool Mint)<br>• Brightness (20%-200%), Contrast, Saturation, Hue Shift (-180° to +180°)<br>• 90° Clockwise and Counter-Clockwise rotation<br>• Horizontal and Vertical mirroring / flip<br>• Animation playback speed multiplier (0.5x to 2.0x)<br>• Animation frame reversal<br>• Multi-frame GIF rendering & chaining | • Look-Up Table (LUT) photo filters (Gotham, Nashville)<br>• Convolution matrix filters (Oil paint, Emboss, Sharpen)<br>• Color tinting hex overlay |
| **Batch Format Converter** (`/converter`) | **Fully Functional** | • Batch multi-file drag-and-drop queue<br>• WebP, PNG, JPG, GIF conversion<br>• Quality factor slider (10% - 100%)<br>• Background color picker for transparent alpha flattening (essential when converting PNG to JPG)<br>• Individual converted file download<br>• Download all converted queue button | • Client-side streaming ZIP archive packaging<br>• Exotic formats (AVIF, JPEG XL, HEIC/HEIF, RAW camera files) |

---

## 3. EZGIF Tools Currently Outside PixelMint Scope

The following tools from EZGIF are not yet implemented in PixelMint and are cataloged here for future phases:

1. **GIF Splitter / Frame Decompiler:** Extracting individual frames into downloadable PNG sequences.
2. **Add Text / Watermark:** Overlaying custom typography, memes, or watermark logos onto static or animated media.
3. **Animated WebP / APNG / AVIF Dedicated Builders:** Dedicated creation suites for modern animated formats.
4. **Video to Video Tools:** Video cutter, reverser, speed changer that outputs MP4/WebM files (requires WASM FFmpeg build).
5. **Sprite Sheet Cutter:** Slicing tiled game sprites into individual animation frames.
6. **QR & Barcode Generator:** Standalone utility generators.

---

## 4. Architectural Differences vs. EZGIF

| Architectural Dimension | EZGIF (Benchmark) | PixelMint (Implementation) |
| :--- | :--- | :--- |
| **Processing Engine** | Server-side queuing (Perl/C binaries + ImageMagick/FFmpeg); files uploaded to remote servers and held for 1 hour. | **100% In-Browser Execution** using WebAssembly, `gifenc`, `omggif`, and HTML5 Canvas APIs. Media never leaves user RAM. |
| **Advertising & Layout Shift** | Cluttered with third-party ad networks (300x250, 300x600 skyscraper banners) causing Cumulative Layout Shifts (CLS). | **Clean Utility Interface** with zero advertisements, zero layout shifts, and dark/light themes. |
| **Mobile Experience** | Desktop tabular navigation wrapping into 4-5 dense rows on mobile viewports. Small touch targets. | Responsive mobile bottom navigation bar, touch-friendly drag handles, and thumb-friendly controls. |
| **Pipeline Inter-Tool Chaining** | Requires server session state and re-downloading/re-uploading intermediate temporary files. | In-memory Blob URL handoff between all 7 workstations with zero network transmission. |
