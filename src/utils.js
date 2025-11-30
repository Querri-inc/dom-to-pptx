// src/utils.js

export function parseColor(str) {
  if (!str || str === "transparent" || str.startsWith("rgba(0, 0, 0, 0)")) return null;
  const rgb = str.match(/\d+/g);
  if (!rgb || rgb.length < 3) return null;
  // Convert RGB to Hex
  return ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2]))
    .toString(16).slice(1).toUpperCase();
}

export function getTextStyle(style, scale) {
  return {
    color: parseColor(style.color) || "000000",
    fontFace: style.fontFamily.split(",")[0].replace(/['"]/g, ""),
    fontSize: parseFloat(style.fontSize) * 0.75 * scale,
    bold: parseInt(style.fontWeight) >= 600,
  };
}

export function isTextContainer(node) {
  const hasText = node.textContent.trim().length > 0;
  if (!hasText) return false;
  const children = Array.from(node.children);
  if (children.length === 0) return true;
  // Check if children are inline elements
  const isInline = (el) => 
    window.getComputedStyle(el).display.includes("inline") || 
    ["SPAN", "B", "STRONG", "EM"].includes(el.tagName);
  return children.every(isInline);
}

export function getVisibleShadow(shadowStr, scale) {
  if (!shadowStr || shadowStr === "none") return null;
  const shadows = shadowStr.split(/,(?![^(]*\))/);
  
  for (let s of shadows) {
    s = s.trim();
    if (s.startsWith("rgba(0, 0, 0, 0)")) continue;

    const match = s.match(/(rgba?\([^\)]+\)|#[0-9a-fA-F]+)\s+(-?[\d\.]+)px\s+(-?[\d\.]+)px\s+([\d\.]+)px/);
    if (match) {
      const colorStr = match[1];
      const x = parseFloat(match[2]);
      const y = parseFloat(match[3]);
      const blur = parseFloat(match[4]);
      
      const distance = Math.sqrt(x*x + y*y);
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      let opacity = 0.4;
      if (colorStr.includes('rgba')) {
          const alphaMatch = colorStr.match(/, ([0-9.]+)\)/);
          if (alphaMatch) opacity = parseFloat(alphaMatch[1]);
      }

      return {
        type: "outer",
        angle: angle,
        blur: blur * 0.75 * scale,
        offset: distance * 0.75 * scale,
        color: parseColor(colorStr) || "000000",
        opacity: opacity,
      };
    }
  }
  return null;
}

export function generateGradientSVG(w, h, bgString, radius, border) {
    try {
      const match = bgString.match(/linear-gradient\((.*)\)/);
      if (!match) return null;
      const content = match[1];
      // Basic gradient parsing logic (simplified from your script)
      const parts = content.split(/,(?![^(]*\))/).map((p) => p.trim());
      
      let x1 = "0%", y1 = "0%", x2 = "0%", y2 = "100%";
      let stopsStartIdx = 0;
      
      if (parts[0].includes("to right")) { x1 = "0%"; x2 = "100%"; y2 = "0%"; stopsStartIdx = 1; }
      else if (parts[0].includes("to left")) { x1 = "100%"; x2 = "0%"; y2 = "0%"; stopsStartIdx = 1; }
      // Add other directions as needed...

      let stopsXML = "";
      const stopParts = parts.slice(stopsStartIdx);
      stopParts.forEach((part, idx) => {
        let color = part;
        let offset = Math.round((idx / (stopParts.length - 1)) * 100) + "%";
        // Simple regex to separate color from percentage
        const posMatch = part.match(/(.*?)\s+(\d+(\.\d+)?%?)$/);
        if (posMatch) { color = posMatch[1]; offset = posMatch[2]; }
        
        let opacity = 1;
        if (color.includes("rgba")) {
           // extract alpha
           const rgba = color.match(/[\d\.]+/g);
           if(rgba && rgba.length > 3) { opacity = rgba[3]; color = `rgb(${rgba[0]},${rgba[1]},${rgba[2]})`; }
        }
        stopsXML += `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`;
      });

      let strokeAttr = "";
      if (border) { strokeAttr = `stroke="#${border.color}" stroke-width="${border.width}"`; }

      const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
              <defs><linearGradient id="grad" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsXML}</linearGradient></defs>
              <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="url(#grad)" ${strokeAttr} />
          </svg>`;
      return "data:image/svg+xml;base64," + btoa(svg);
    } catch (e) { return null; }
}