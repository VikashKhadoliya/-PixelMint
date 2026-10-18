# Open Source Asset Attribution & Licensing

This document provides licensing compliance, provenance, and attribution details for external graphic assets utilized within PixelMint.

---

## Oxygen Icons Project

- **Project Name:** Oxygen Icons (KDE)
- **Upstream Repository:** [KDE Frameworks Oxygen Icons](https://invent.kde.org/frameworks/oxygen-icons5)
- **Local Source Directory:** `assets/icon-sources/oxygen-icons`
- **Active Asset Directory:** `public/icons/`
- **Authors & Contributors:** KDE Oxygen Team (see [`public/icons/OXYGEN-AUTHORS.txt`](/public/icons/OXYGEN-AUTHORS.txt) for the full roster including Nuno Pinheiro, David Vignoni, Kenneth Wimer, David Miller, Riccardo Iaconelli, and others).
- **License:** GNU Lesser General Public License version 3 or later (LGPLv3+) with the **Section 5 Artwork Exception**.

### LGPL Section 5 Artwork Exception
The Oxygen Icon library is licensed under the GNU LGPLv3 with the following special exception:
> *"The Oxygen icon artists grant permission to use the Oxygen icons in graphical user interfaces of any computer software without restricting the license of that software, provided that the source of the icons is attributed in the documentation or 'About' box."*

---

## Selected Assets & UI Element Mapping

Only the exact selected icons needed by PixelMint were extracted and placed into `public/icons/`. The bulk source repository (`assets/icon-sources/oxygen-icons`, containing over 14,000 files) is excluded from production bundles.

| Tool / Component | Oxygen Source Path | Copied Public Asset | UI Locations |
| :--- | :--- | :--- | :--- |
| **GIF Maker** | `scalable/actions/tool-animator.svgz`<br>`64x64/actions/tool-animator.png` | `public/icons/tool-animator.png`<br>`public/icons/tool-animator.svg` | Desktop navigation tab, Mobile bottom bar, Tool hero header, "Generate Animated GIF" action button |
| **Video to GIF** | `scalable/devices/camera-video.svgz`<br>`64x64/devices/camera-video.png` | `public/icons/camera-video.png`<br>`public/icons/camera-video.svg` | Desktop navigation tab, Mobile bottom bar, Tool hero header, "Convert to GIF" action button |
| **Resizer** | `scalable/actions/transform-scale.svgz`<br>`64x64/actions/transform-scale.png` | `public/icons/transform-scale.png`<br>`public/icons/transform-scale.svg` | Desktop navigation tab, Mobile bottom bar, Tool hero header, "Resize Image" action button, Pipeline chaining buttons |
| **Cropper** | `scalable/actions/transform-crop.svgz`<br>`64x64/actions/transform-crop-and-resize.png` | `public/icons/transform-crop.png`<br>`public/icons/transform-crop.svg` | Desktop navigation tab, Mobile bottom bar, Tool hero header, "Crop Media" action button, Pipeline chaining buttons |
| **Optimizer** | `scalable/actions/speedometer.svgz`<br>`64x64/actions/speedometer.png` | `public/icons/speedometer.png`<br>`public/icons/speedometer.svg` | Desktop navigation tab, Mobile bottom bar, Tool hero header, "Optimize & Compress GIF" action button, Pipeline chaining buttons |
| **Effects Studio** | `scalable/actions/tools-wizard.svgz`<br>`64x64/actions/tools-wizard.png` | `public/icons/tools-wizard.png`<br>`public/icons/tools-wizard.svg` | Desktop navigation tab, Mobile bottom bar, Tool hero header, "Apply Effects" action button, Pipeline chaining buttons |
| **Format Converter** | `scalable/actions/view-refresh.svgz`<br>`64x64/actions/view-refresh.png` | `public/icons/view-refresh.png`<br>`public/icons/view-refresh.svg` | Desktop navigation tab, Mobile bottom bar, Tool hero header, "Convert All" action button, Pipeline chaining buttons |

---

## Attribution Notice Location in Application
- **Application Footer:** Displayed in `index.html` within `.attribution-card` with direct hyperlinks to KDE Oxygen upstream repository, license terms (`/icons/OXYGEN-LICENSE.txt`), and author credits (`/icons/OXYGEN-AUTHORS.txt`).
- **Interface Controls:** Small interface controls (upload/download buttons, checkboxes, range sliders) utilize standard inline SVG vectors to preserve crispness across devices without inflating runtime bundle size.
