# dom-to-pptx

**The High-Fidelity HTML to PowerPoint Converter.**

Most HTML-to-PPTX libraries fail when faced with modern web design. They break on gradients, misalign text, ignore rounded corners, or simply take a screenshot (which isn't editable). 

**dom-to-pptx** is different. It is a **Coordinate Scraper & Style Engine** that traverses your DOM, calculates the exact computed styles of every element (Flexbox/Grid positions, complex gradients, shadows), and mathematically maps them to native PowerPoint shapes and text boxes. The result is a fully editable, vector-sharp presentation that looks exactly like your web view.

## Features

### 🎨 Advanced Visual Fidelity
- **Complex Gradients:** Includes a built-in CSS Gradient Parser that converts `linear-gradient` strings (with multiple stops, angles, and transparency) into vector SVGs for perfect rendering.
- **Mathematically Accurate Shadows:** Converts CSS Cartesian shadows (`x`, `y`, `blur`) into PowerPoint's Polar coordinate system (`angle`, `distance`) for 1:1 depth matching.
- **Anti-Halo Image Processing:** Uses off-screen HTML5 Canvas with `source-in` composite masking to render rounded images without the ugly white "halo" artifacts found in other libraries.

### 📐 Smart Layout & Typography
- **Auto-Scaling Engine:** Build your slide in HTML at **1920x1080** (or any aspect ratio). The library automatically calculates the scaling factor to fit it perfectly into a standard 16:9 PowerPoint slide (10 x 5.625 inches) with auto-centering.
- **Rich Text Blocks:** Handles mixed-style text (e.g., **bold** spans inside a normal paragraph) while sanitizing HTML source code whitespace (newlines/tabs) to prevent jagged text alignment.
- **Font Stack Normalization:** Automatically maps web-only fonts (like `ui-sans-serif`, `system-ui`) to safe system fonts (`Arial`, `Calibri`) to ensure the file opens correctly on any computer.
- **Text Transformations:** Supports CSS `text-transform: uppercase/lowercase` and `letter-spacing` (converted to PT).

### ⚡ Technical Capabilities
- **Z-Index Handling:** Respects DOM order for correct layering of elements.
- **Border Radius Math:** Calculates perfect corner rounding percentages based on element dimensions.
- **Client-Side:** Runs entirely in the browser. No server required.

## Installation

```bash
npm install dom-to-pptx
```

## Usage

This library is intended for use in the browser (React, Vue, Svelte, Vanilla JS, etc.).

### 1. Basic Example

```javascript
import { exportToPptx } from 'dom-to-pptx';

document.getElementById('download-btn').addEventListener('click', async () => {
  // Pass the CSS selector of the container you want to turn into a slide
  await exportToPptx('#slide-container', { 
    fileName: 'dashboard-report.pptx' 
  });
});
```

### 2. Recommended HTML Structure
For the best results, treat your container as a fixed-size canvas. We recommend building your slide at **1920x1080px**. The library will handle the downscaling.

```html
<!-- Container (16:9 Aspect Ratio) -->
<!-- The library will capture this background color/gradient automatically -->
<div id="slide-container" class="w-[1920px] h-[1080px] relative overflow-hidden bg-slate-50 font-sans">
    
    <!-- Background Gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100"></div>

    <!-- Content -->
    <div class="absolute top-[100px] left-[100px] w-[800px]">
        <h1 class="text-6xl font-bold text-slate-800 drop-shadow-md">
            Quarterly Report
        </h1>
        <p class="text-2xl text-slate-600 mt-4">
            Analysis of <span class="font-bold text-blue-600">renewable energy</span> trends.
        </p>
    </div>

    <!-- Rounded Image with Shadow (Renders perfectly without white edges) -->
    <div class="absolute top-[100px] right-[100px] w-[600px] h-[400px] rounded-2xl shadow-2xl overflow-hidden">
        <img 
            src="https://example.com/image.jpg" 
            class="w-full h-full object-cover"
        />
    </div>

</div>
```

## API

### `exportToPptx(elementOrSelector, options)`

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `elementOrSelector` | `string` \| `HTMLElement` | The DOM node (or ID selector) to convert. |
| `options` | `object` | Configuration object. |

**Options Object:**

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `fileName` | `string` | `"slide.pptx"` | The name of the downloaded file. |
| `backgroundColor` | `string` | `null` | Force a background color for the slide (hex). |

## Important Notes

1.  **CORS Images:** Because this library uses HTML5 Canvas to process rounded images, any external images must be served with `Access-Control-Allow-Origin: *` headers. If an image is "tainted" (CORS blocked), the browser will refuse to read its data, and it may appear blank in the PPTX.
2.  **Layout System:** The library does not "read" Flexbox or Grid definitions directly. Instead, it lets the browser render the layout, measures the final `x, y, width, height` (BoundingBox) of every element, and places them absolutely on the slide. This ensures 100% visual accuracy regardless of the layout method used.
3.  **Fonts:** PPTX files use the fonts installed on the viewer's OS. If you use a web font like "Inter", and the user doesn't have it installed, PowerPoint will fallback to Arial.

## License

MIT © [Atharva Dharmendra Jagtap](https://github.com/atharva9167j)

## Acknowledgements

This project is built on top of [PptxGenJS](https://github.com/gitbrent/PptxGenJS). Huge thanks to the PptxGenJS maintainers and all contributors — dom-to-pptx leverages and extends their excellent work on PPTX generation.
