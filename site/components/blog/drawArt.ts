import { SPECTRUM } from "../../lib/motion";
import { artFor } from "../../lib/postArt";

export const ART_W = 960;
export const ART_H = 600;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function windowFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, light = true) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  rr(ctx, x, y, w, h, 16);
  ctx.fillStyle = light ? "#f6f7fb" : "#1b2030";
  ctx.fill();
  ctx.restore();
  ctx.save();
  rr(ctx, x, y, w, h, 16);
  ctx.clip();
  ctx.fillStyle = light ? "#ffffff" : "#242a3c";
  ctx.fillRect(x, y, w, 40);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + 24 + i * 20, y + 20, 6.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function lines(ctx: CanvasRenderingContext2D, x: number, y: number, widths: number[], color: string, gap = 26, h = 10) {
  ctx.fillStyle = color;
  widths.forEach((w, i) => {
    rr(ctx, x, y + i * gap, w, h, h / 2);
    ctx.fill();
  });
}

function shot(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, rot = 0) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  rr(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.fillStyle = "#eef1fb";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.save();
  rr(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w * 0.2, h);
  ctx.restore();
  lines(ctx, -w / 2 + w * 0.3, -h / 2 + h * 0.24, [w * 0.5, w * 0.36, w * 0.44], "#b9c1da", h * 0.2, h * 0.09);
  ctx.restore();
}

function appIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, fill: CanvasGradient | string, letter: string, font: string) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  rr(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.24);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${s * 0.46}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, cx, cy + s * 0.03);
  ctx.textAlign = "left";
}

export function drawPostArt(ctx: CanvasRenderingContext2D, slug: string, font: string, title?: string) {
  const art = artFor(slug);
  const W = ART_W;
  const H = ART_H;
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#151a2c");
  bg.addColorStop(1, "#0a0c14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.72, H * 0.22, 0, W * 0.72, H * 0.22, W * 0.7);
  glow.addColorStop(0, hexA(art.accent, 0.42));
  glow.addColorStop(1, hexA(art.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (let gx = 20; gx < W; gx += 32) for (let gy = 20; gy < H; gy += 32) ctx.fillRect(gx, gy, 2, 2);

  const top = title ? 60 : 90;
  const areaH = title ? 330 : 420;

  if (art.motif === "versus") {
    const ledge = ctx.createLinearGradient(0, 0, 200, 200);
    SPECTRUM.forEach((c, i) => ledge.addColorStop(i / (SPECTRUM.length - 1), c));
    const cy = top + areaH / 2;
    appIcon(ctx, W * 0.3, cy, 190, ledge, "L", font);
    appIcon(ctx, W * 0.7, cy, 190, art.rivalColor ?? art.accent, (art.rival ?? "?").slice(0, 1), font);
    ctx.save();
    ctx.font = `800 64px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.shadowColor = hexA(art.accent, 0.9);
    ctx.shadowBlur = 30;
    ctx.fillText("vs", W / 2, cy);
    ctx.restore();
  } else if (art.motif === "organize") {
    windowFrame(ctx, 150, top, 660, areaH - 20);
    const cols = 4;
    for (let i = 0; i < 8; i++) {
      const x = 190 + (i % cols) * 152;
      const y = top + 70 + Math.floor(i / cols) * (title ? 120 : 160);
      shot(ctx, x, y, 128, title ? 84 : 100, SPECTRUM[i % SPECTRUM.length]);
    }
  } else if (art.motif === "desktop") {
    const wall = ctx.createLinearGradient(140, top, 820, top + areaH);
    wall.addColorStop(0, "#23306e");
    wall.addColorStop(1, "#5a2c69");
    rr(ctx, 140, top, 680, areaH - 20, 18);
    ctx.fillStyle = wall;
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      shot(ctx, 170 + (i % 3) * 96, top + 30 + Math.floor(i / 3) * 74, 76, 52, SPECTRUM[(i * 2) % 6], (i % 2 ? 1 : -1) * 0.08);
    }
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 30;
    rr(ctx, 600, top + 90, 170, 130, 14);
    ctx.fillStyle = "#6fa8ff";
    ctx.fill();
    ctx.restore();
    rr(ctx, 600, top + 70, 80, 40, 10);
    ctx.fillStyle = "#5a92ef";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(470, top + 140);
    ctx.quadraticCurveTo(540, top + 90, 590, top + 150);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (art.motif === "drag") {
    windowFrame(ctx, 120, top + 20, 380, areaH - 60, false);
    lines(ctx, 150, top + 90, [240, 180, 280, 200], "rgba(255,255,255,0.18)", 34, 14);
    windowFrame(ctx, 540, top + 60, 300, areaH - 100);
    lines(ctx, 570, top + 130, [200, 150], "#c9d0e6", 34, 14);
    rr(ctx, 570, top + 210, 240, 70, 14);
    ctx.fillStyle = hexA(art.accent, 0.2);
    ctx.fill();
    ctx.strokeStyle = art.accent;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    shot(ctx, 400, top + 150, 170, 112, art.accent, -0.12);
    ctx.save();
    ctx.translate(540, top + 250);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0a0c14";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 54);
    ctx.lineTo(14, 42);
    ctx.lineTo(26, 66);
    ctx.lineTo(36, 61);
    ctx.lineTo(24, 38);
    ctx.lineTo(42, 38);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  } else {
    windowFrame(ctx, 170, top, 620, areaH - 20);
    lines(ctx, 210, top + 80, [300, 420, 360, 260, 400], "#c3cadf", title ? 44 : 56, 16);
    const bx = 400;
    const by = top + (title ? 110 : 125);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 12; c++) {
        const v = 120 + ((r * 7 + c * 13) % 5) * 22;
        ctx.fillStyle = `rgb(${v}, ${v + 6}, ${v + 20})`;
        ctx.fillRect(bx + c * 26, by + r * 26, 26, 26);
      }
    }
    ctx.strokeStyle = art.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(bx - 8, by - 8, 12 * 26 + 16, 4 * 26 + 16);
  }

  if (title) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `700 26px ${font}`;
    ctx.fillText(art.kind === "compare" ? "Comparison" : "Guide", 60, H - 150);
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 46px ${font}`;
    const words = title.split(" ");
    const out: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > W - 120 && line) {
        out.push(line);
        line = w;
      } else line = test;
    }
    out.push(line);
    out.slice(0, 2).forEach((l, i) => ctx.fillText(l, 60, H - 96 + i * 52));
  }
  ctx.fillStyle = art.accent;
  ctx.fillRect(0, H - 8, W, 8);
}
