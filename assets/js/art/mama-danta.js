(() => {
  "use strict";

  const visual = window.BTMMVisual;
  if (!visual) throw new Error("BTMMVisual debe cargarse antes de mama-danta.js.");

  const TAU_LOCAL = Math.PI * 2;

  function ellipse(g, x, y, rx, ry, rotation = 0) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, rotation, 0, TAU_LOCAL);
  }

  function roundedRect(g, x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width) * 0.45, Math.abs(height) * 0.45);
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + width - r, y);
    g.quadraticCurveTo(x + width, y, x + width, y + r);
    g.lineTo(x + width, y + height - r);
    g.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    g.lineTo(x + r, y + height);
    g.quadraticCurveTo(x, y + height, x, y + height - r);
    g.lineTo(x, y + r);
    g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }

  function drawEar(g, x, y, u, rotation, palette) {
    g.save();
    g.translate(x, y);
    g.rotate(rotation);
    g.fillStyle = palette.earOuter;
    ellipse(g, 0, 0, u * 0.21, u * 0.3);
    g.fill();
    g.fillStyle = palette.earInner;
    ellipse(g, 0, -u * 0.015, u * 0.105, u * 0.175);
    g.fill();
    g.strokeStyle = palette.outline;
    g.lineWidth = u * 0.045;
    ellipse(g, 0, 0, u * 0.21, u * 0.3);
    g.stroke();
    g.restore();
  }

  function drawLeaf(g, x, y, u, palette, sway) {
    g.save();
    g.translate(x, y);
    g.rotate(-0.32 + sway);
    g.strokeStyle = palette.leafDark;
    g.lineWidth = u * 0.035;
    g.beginPath();
    g.moveTo(0, u * 0.1);
    g.lineTo(u * 0.04, -u * 0.18);
    g.stroke();

    g.fillStyle = palette.leaf;
    g.beginPath();
    g.moveTo(u * 0.035, -u * 0.16);
    g.quadraticCurveTo(u * 0.24, -u * 0.31, u * 0.31, -u * 0.08);
    g.quadraticCurveTo(u * 0.18, u * 0.05, u * 0.035, -u * 0.16);
    g.fill();
    g.restore();
  }

  function paletteFor(options, config) {
    const night = Boolean(options?.night);
    const base = config?.palette || {};
    return {
      body: night ? "#625a55" : (base.cocoa || "#716258"),
      bodyShade: night ? "#48423f" : "#554942",
      bodyLight: night ? "#7a7069" : (base.cocoaLight || "#a18f82"),
      cream: night ? "#b8aa9c" : (base.cream || "#ead9c6"),
      blush: base.blush || "#eaa9a8",
      eye: night ? "#171413" : "#241c1a",
      shine: "#fffdf8",
      outline: night ? "rgba(18,17,16,.82)" : "rgba(52,42,40,.78)",
      earOuter: night ? "#403b38" : "#594f49",
      earInner: night ? "#d8c8bc" : "#f4e5d9",
      leaf: base.leaf || "#65a96d",
      leafDark: base.leafDark || "#3d7650"
    };
  }

  function drawCuteMama(g, x, y, size, face, options = {}, context = {}) {
    const config = context.config || {};
    const palette = paletteFor(options, config);
    const reducedMotion = Boolean(config.accessibility?.reducedMotion);
    const u = size * 0.12;
    const depth = options.depth ?? 1;
    const depthScale = 0.78 + depth * 0.22;
    const anim = options.animTime || 0;
    const speed = Math.abs(options.speed || 0);
    const mood = options.mood || "neutral";
    const moving = speed > 0.05;

    const bounce = reducedMotion ? 0 : Math.sin(anim * 3.5) * u * (moving ? 0.045 : 0.018);
    const step = reducedMotion ? 0 : Math.sin(anim * Math.max(2.8, speed * 2.1)) * u * 0.12;
    const earSway = reducedMotion ? 0 : Math.sin(anim * 2.6) * 0.055;
    const leafSway = reducedMotion ? 0 : Math.sin(anim * 2.1) * 0.09;
    const blink = Math.sin(anim * 0.8 + 1.6) > 0.985 ? 0.18 : 1;
    const tiredScale = mood === "cansada" ? 0.62 : 1;
    const eyeScaleY = Math.min(blink, tiredScale);
    const blushAlpha = mood === "asustada" ? 0.09 : 0.22;

    g.save();
    g.translate(x, y + bounce);
    g.scale((face || 1) * depthScale, depthScale);
    g.lineJoin = "round";
    g.lineCap = "round";

    const legs = [
      { x: -u * 0.78, y: -u * 0.37, offset: -step * 0.32, back: true },
      { x: -u * 0.28, y: -u * 0.34, offset: step * 0.16, back: true },
      { x: u * 0.38, y: -u * 0.4, offset: step * 0.42, back: false },
      { x: u * 0.8, y: -u * 0.35, offset: -step * 0.2, back: false }
    ];

    for (const leg of legs) {
      g.fillStyle = leg.back ? palette.bodyShade : palette.body;
      roundedRect(g, leg.x, leg.y + leg.offset, u * 0.34, u * 0.82, u * 0.13);
      g.fill();
      g.fillStyle = palette.cream;
      roundedRect(g, leg.x + u * 0.07, leg.y + u * 0.58 + leg.offset, u * 0.2, u * 0.18, u * 0.07);
      g.fill();
      g.strokeStyle = palette.outline;
      g.lineWidth = u * 0.045;
      roundedRect(g, leg.x, leg.y + leg.offset, u * 0.34, u * 0.82, u * 0.13);
      g.stroke();
    }

    const bodyGradient = g.createLinearGradient(-u * 1.25, -u * 1.5, u * 1.35, u * 0.15);
    bodyGradient.addColorStop(0, palette.bodyLight);
    bodyGradient.addColorStop(0.48, palette.body);
    bodyGradient.addColorStop(1, palette.bodyShade);
    g.fillStyle = bodyGradient;
    ellipse(g, -u * 0.08, -u * 0.87, u * 1.42, u * 0.94, -0.03);
    g.fill();

    g.fillStyle = palette.cream;
    ellipse(g, u * 0.16, -u * 0.56, u * 0.72, u * 0.38, 0.02);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.13)";
    ellipse(g, -u * 0.48, -u * 1.18, u * 0.5, u * 0.22, -0.05);
    g.fill();

    g.strokeStyle = palette.bodyShade;
    g.lineWidth = u * 0.095;
    g.beginPath();
    g.moveTo(-u * 1.28, -u * 0.83);
    g.quadraticCurveTo(-u * 1.42, -u * 0.69, -u * 1.31, -u * 0.5);
    g.stroke();

    drawEar(g, u * 0.52, -u * 1.63, u, -0.2 - earSway, palette);
    drawEar(g, u * 1.08, -u * 1.57, u, 0.12 + earSway, palette);

    const headGradient = g.createLinearGradient(u * 0.25, -u * 1.65, u * 1.85, -u * 0.35);
    headGradient.addColorStop(0, palette.bodyLight);
    headGradient.addColorStop(0.55, palette.body);
    headGradient.addColorStop(1, palette.bodyShade);
    g.fillStyle = headGradient;
    ellipse(g, u * 0.98, -u * 1.04, u * 0.82, u * 0.67, 0.08);
    g.fill();

    g.fillStyle = palette.cream;
    g.beginPath();
    g.moveTo(u * 1.21, -u * 1.14);
    g.quadraticCurveTo(u * 1.68, -u * 1.19, u * 1.79, -u * 0.91);
    g.quadraticCurveTo(u * 1.85, -u * 0.63, u * 1.57, -u * 0.48);
    g.quadraticCurveTo(u * 1.35, -u * 0.4, u * 1.12, -u * 0.57);
    g.quadraticCurveTo(u * 1.01, -u * 0.78, u * 1.03, -u * 1.02);
    g.closePath();
    g.fill();

    g.fillStyle = palette.eye;
    ellipse(g, u * 1.59, -u * 0.67, u * 0.09, u * 0.062);
    g.fill();
    ellipse(g, u * 1.45, -u * 0.69, u * 0.075, u * 0.052);
    g.fill();

    g.save();
    g.translate(u * 1.12, -u * 1.05);
    g.scale(1, eyeScaleY);
    g.fillStyle = palette.eye;
    ellipse(g, 0, 0, u * 0.135, u * 0.175);
    g.fill();
    g.restore();

    g.save();
    g.translate(u * 0.78, -u * 1.1);
    g.scale(1, eyeScaleY);
    g.fillStyle = palette.eye;
    ellipse(g, 0, 0, u * 0.105, u * 0.145);
    g.fill();
    g.restore();

    if (eyeScaleY > 0.35) {
      g.fillStyle = palette.shine;
      ellipse(g, u * 1.165, -u * 1.115, u * 0.052, u * 0.052);
      g.fill();
      ellipse(g, u * 0.82, -u * 1.15, u * 0.04, u * 0.04);
      g.fill();
    }

    g.fillStyle = `rgba(234,169,168,${blushAlpha})`;
    ellipse(g, u * 1.08, -u * 0.79, u * 0.18, u * 0.09);
    g.fill();
    ellipse(g, u * 0.72, -u * 0.84, u * 0.145, u * 0.075);
    g.fill();

    g.strokeStyle = "#65483f";
    g.lineWidth = u * 0.045;
    g.beginPath();
    g.moveTo(u * 1.22, -u * 0.59);
    g.quadraticCurveTo(u * 1.35, -u * 0.48, u * 1.49, -u * 0.59);
    g.stroke();

    drawLeaf(g, u * 0.8, -u * 1.69, u, palette, leafSway);

    g.strokeStyle = palette.outline;
    g.lineWidth = u * 0.052;
    ellipse(g, -u * 0.08, -u * 0.87, u * 1.42, u * 0.94, -0.03);
    g.stroke();
    ellipse(g, u * 0.98, -u * 1.04, u * 0.82, u * 0.67, 0.08);
    g.stroke();
    g.beginPath();
    g.moveTo(u * 1.21, -u * 1.14);
    g.quadraticCurveTo(u * 1.68, -u * 1.19, u * 1.79, -u * 0.91);
    g.quadraticCurveTo(u * 1.85, -u * 0.63, u * 1.57, -u * 0.48);
    g.quadraticCurveTo(u * 1.35, -u * 0.4, u * 1.12, -u * 0.57);
    g.quadraticCurveTo(u * 1.01, -u * 0.78, u * 1.03, -u * 1.02);
    g.closePath();
    g.stroke();

    if (mood === "asustada") {
      g.fillStyle = "#fff7e7";
      g.font = `bold ${u * 0.5}px system-ui`;
      g.textAlign = "center";
      g.fillText("!", u * 0.94, -u * 1.92);
    } else if (mood === "comiendo") {
      g.fillStyle = palette.leaf;
      ellipse(g, u * 1.72, -u * 0.49, u * 0.14, u * 0.07, -0.3);
      g.fill();
    } else if (mood === "protectora") {
      g.strokeStyle = "rgba(243,184,95,.75)";
      g.lineWidth = u * 0.06;
      ellipse(g, 0, -u * 0.78, u * 1.63, u * 1.16);
      g.stroke();
    }

    g.restore();
  }

  visual.register("tapir.adult", drawCuteMama);
})();
