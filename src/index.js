// src/index.js
import PptxGenJS from "pptxgenjs";
import { parseColor, getTextStyle, isTextContainer, getVisibleShadow, generateGradientSVG } from "./utils.js";
import { getProcessedImage } from "./image-processor.js";

const PPI = 96;
const PX_TO_INCH = 1 / PPI;

/**
 * Converts a DOM element to a PPTX file.
 * @param {HTMLElement | string} elementOrSelector - The root element to convert.
 * @param {Object} options - { fileName: string }
 */
export async function exportToPptx(elementOrSelector, options = {}) {
  const root = typeof elementOrSelector === "string" 
    ? document.querySelector(elementOrSelector) 
    : elementOrSelector;

  if (!root) throw new Error("Root element not found");

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9"; // Default
  const slide = pptx.addSlide();

  // Use the dimensions of the root element to calculate scaling
  const rootRect = root.getBoundingClientRect();
  
  // Standard PPTX 16:9 dimensions in inches
  const PPTX_WIDTH_IN = 10;
  const PPTX_HEIGHT_IN = 5.625;

  const contentWidthIn = rootRect.width * PX_TO_INCH;
  const contentHeightIn = rootRect.height * PX_TO_INCH;
  
  // Scale content to fit within the slide
  const scale = Math.min(
    PPTX_WIDTH_IN / contentWidthIn,
    PPTX_HEIGHT_IN / contentHeightIn
  );

  const layoutConfig = {
    rootX: rootRect.x,
    rootY: rootRect.y,
    scale: scale,
    // Center the content
    offX: (PPTX_WIDTH_IN - contentWidthIn * scale) / 2,
    offY: (PPTX_HEIGHT_IN - contentHeightIn * scale) / 2,
  };

  await processNode(root, pptx, slide, layoutConfig);
  
  const fileName = options.fileName || "export.pptx";
  pptx.writeFile({ fileName });
}

async function processNode(node, pptx, slide, config) {
  if (node.nodeType !== 1) return; // Element nodes only
  
  const style = window.getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return;

  const rect = node.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const x = config.offX + (rect.x - config.rootX) * PX_TO_INCH * config.scale;
  const y = config.offY + (rect.y - config.rootY) * PX_TO_INCH * config.scale;
  const w = rect.width * PX_TO_INCH * config.scale;
  const h = rect.height * PX_TO_INCH * config.scale;

  // --- 1. Detect Image Wrapper ---
  let isImageWrapper = false;
  const imgChild = Array.from(node.children).find(c => c.tagName === 'IMG');
  if (imgChild) {
      const imgRect = imgChild.getBoundingClientRect();
      if (Math.abs(imgRect.width - rect.width) < 2 && Math.abs(imgRect.height - rect.height) < 2) {
          isImageWrapper = true;
      }
  }

  // --- 2. Backgrounds & Borders ---
  let bgColor = parseColor(style.backgroundColor);
  if (isImageWrapper && bgColor) bgColor = null; // Prevent halo

  const hasGradient = style.backgroundImage && style.backgroundImage.includes("linear-gradient");
  const borderColor = parseColor(style.borderColor);
  const borderWidth = parseFloat(style.borderWidth);
  const hasBorder = borderWidth > 0 && borderColor;
  const shadowStr = style.boxShadow;
  const hasShadow = shadowStr && shadowStr !== "none";
  const borderRadius = parseFloat(style.borderRadius) || 0;

  if (hasGradient) {
    const svgData = generateGradientSVG(rect.width, rect.height, style.backgroundImage, borderRadius, hasBorder ? { color: borderColor, width: borderWidth } : null);
    if (svgData) slide.addImage({ data: svgData, x, y, w, h });
  } else if (bgColor || hasBorder || hasShadow) {
    const isCircle = borderRadius >= Math.min(rect.width, rect.height) / 2 - 1;

    const shapeOpts = {
      x, y, w, h,
      fill: bgColor ? { color: bgColor } : null,
      line: hasBorder ? { color: borderColor, width: borderWidth * 0.75 * config.scale } : null,
    };

    if (hasShadow) {
      const shadow = getVisibleShadow(shadowStr, config.scale);
      if (shadow) shapeOpts.shadow = shadow;
      
      // Fix for shadow on transparent background (needed for PPTX to render shadow)
      if (!bgColor && !hasBorder) {
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
             shapeOpts.fill = { color: parseColor(style.backgroundColor) };
        }
      }
    }

    if (isCircle) {
      slide.addShape(pptx.ShapeType.ellipse, shapeOpts);
    } else if (borderRadius > 0) {
      const radiusFactor = Math.min(1, borderRadius / (Math.min(rect.width, rect.height) / 1.75));
      shapeOpts.rectRadius = radiusFactor;
      slide.addShape(pptx.ShapeType.roundRect, shapeOpts);
    } else {
      slide.addShape(pptx.ShapeType.rect, shapeOpts);
    }
  }

  // --- 3. Process Image ---
  if (node.tagName === "IMG") {
    let effectiveRadius = borderRadius;
    // Check parent clipping if current img has no radius
    if (effectiveRadius === 0) {
        const parentStyle = window.getComputedStyle(node.parentElement);
        if (parentStyle.overflow !== 'visible') {
            effectiveRadius = parseFloat(parentStyle.borderRadius) || 0;
        }
    }

    const processedImage = await getProcessedImage(node.src, rect.width, rect.height, effectiveRadius);
    if (processedImage) {
      slide.addImage({ data: processedImage, x, y, w, h });
    }
    return; // Don't process children of IMG
  }

  // --- 4. Process Text ---
  if (isTextContainer(node)) {
    const textParts = [];
    node.childNodes.forEach((child, index) => {
      let textVal = child.nodeType === 3 ? child.nodeValue : child.textContent;
      let nodeStyle = child.nodeType === 1 ? window.getComputedStyle(child) : style;
      
      textVal = textVal.replace(/[\n\r\t]+/g, " ").replace(/\s{2,}/g, " ");
      if (index === 0) textVal = textVal.trimStart();
      if (index === node.childNodes.length - 1) textVal = textVal.trimEnd();

      if (nodeStyle.textTransform === "uppercase") textVal = textVal.toUpperCase();
      if (nodeStyle.textTransform === "lowercase") textVal = textVal.toLowerCase();

      if (textVal.length > 0) {
        textParts.push({ text: textVal, options: getTextStyle(nodeStyle, config.scale) });
      }
    });

    if (textParts.length > 0) {
      let align = style.textAlign || "left";
      if (align === "start") align = "left";
      if (align === "end") align = "right";
      
      let valign = "top";
      if (style.alignItems === "center") valign = "middle"; // Flex approximation
      
      slide.addText(textParts, { x, y, w, h, align, valign, margin: 0, wrap: true, autoFit: false });
    }
    return;
  }

  // Recursive call
  for (const child of node.children) {
    await processNode(child, pptx, slide, config);
  }
}