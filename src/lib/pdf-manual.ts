import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
  RGB,
  degrees,
} from "pdf-lib";

export interface BrandingInput {
  storeName: string;
  logoBytes?: Uint8Array;
  logoMime?: string; // image/png | image/jpeg
  instagram?: string;
  phone?: string;
  accentHex?: string; // default #007AFF
}

// ---------- color helpers ----------
function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

const BLACK = rgb(0.05, 0.05, 0.05);
const GRAY = rgb(0.45, 0.45, 0.48);
const LIGHT = rgb(0.85, 0.85, 0.88);
const SUBTLE = rgb(0.96, 0.96, 0.97);
const WHITE = rgb(1, 1, 1);

// page A4
const PW = 595.28;
const PH = 841.89;
const MARGIN = 40;

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  accent: RGB;
  branding: BrandingInput;
  logoImg?: any;
  pageNum: number;
  totalPages: number;
}

// ---------- primitives ----------
function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size: number; color?: RGB; maxWidth?: number },
) {
  page.drawText(text, {
    x,
    y,
    size: opts.size,
    font: opts.font,
    color: opts.color ?? BLACK,
    maxWidth: opts.maxWidth,
    lineHeight: opts.size * 1.25,
  });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawWrapped(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  color: RGB = BLACK,
): number {
  const lines = wrapText(text, font, size, maxWidth);
  const lh = size * 1.35;
  lines.forEach((ln, i) => {
    page.drawText(ln, { x, y: y - i * lh, size, font, color });
  });
  return y - lines.length * lh;
}

function drawCheckbox(page: PDFPage, x: number, y: number, size = 10) {
  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    borderColor: BLACK,
    borderWidth: 0.8,
    color: WHITE,
  });
}

function drawDivider(page: PDFPage, y: number, color: RGB = LIGHT) {
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PW - MARGIN, y },
    thickness: 0.5,
    color,
  });
}

// ---------- header / footer ----------
function drawHeader(ctx: Ctx) {
  const { page, font, branding, accent, logoImg } = ctx;
  const y = PH - 28;
  if (logoImg) {
    const maxH = 22;
    const scale = maxH / logoImg.height;
    const w = logoImg.width * scale;
    page.drawImage(logoImg, { x: MARGIN, y: y - maxH + 4, width: w, height: maxH });
  } else {
    page.drawRectangle({
      x: MARGIN,
      y: y - 18,
      width: 48,
      height: 18,
      borderColor: LIGHT,
      borderWidth: 0.6,
    });
    drawText(page, "LOGO", MARGIN + 12, y - 13, { font, size: 8, color: GRAY });
  }
  const sn = branding.storeName || "Sua Loja";
  const tw = font.widthOfTextAtSize(sn, 9);
  page.drawText(sn, {
    x: PW - MARGIN - tw,
    y: y - 12,
    size: 9,
    font,
    color: GRAY,
  });
  // accent strip
  page.drawRectangle({
    x: MARGIN,
    y: y - 24,
    width: PW - MARGIN * 2,
    height: 1.5,
    color: accent,
  });
}

function drawFooter(ctx: Ctx) {
  const { page, font, pageNum, totalPages } = ctx;
  const txt = `${pageNum} / ${totalPages}`;
  const tw = font.widthOfTextAtSize(txt, 8);
  drawText(page, "Manual de Avaliação de iPhone", MARGIN, 20, {
    font,
    size: 8,
    color: GRAY,
  });
  page.drawText(txt, { x: PW - MARGIN - tw, y: 20, size: 8, font, color: GRAY });
}

function newPage(ctx: Ctx): Ctx {
  const page = ctx.doc.addPage([PW, PH]);
  const next = { ...ctx, page, pageNum: ctx.pageNum + 1 };
  drawHeader(next);
  drawFooter(next);
  return next;
}

// =====================================================
// iPhone diagrams — drawn as vector primitives.
// Each function draws inside a bounding box (cx, cy) = top-left of body.
// =====================================================

interface PhoneDims {
  x: number;
  y: number; // top-left of body
  w: number;
  h: number;
}

// All diagram coords use NATIVE pdf-lib semantics: (x, y) = bottom-left, +y is up.
// PhoneDims.y = bottom-left of phone bounding box.

function roundedRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  opts: { stroke?: RGB; fill?: RGB; thickness?: number } = {},
) {
  // SVG path with y-down, then flip via {x:0, y:page.height}.
  // Convert native (x, y=bottom) to SVG top-y = page.height - (y + h).
  const ph = page.getHeight();
  const sy = ph - (y + h); // SVG top y of the rect in flipped space
  const path = `M ${x + r} ${sy}
    L ${x + w - r} ${sy}
    Q ${x + w} ${sy} ${x + w} ${sy + r}
    L ${x + w} ${sy + h - r}
    Q ${x + w} ${sy + h} ${x + w - r} ${sy + h}
    L ${x + r} ${sy + h}
    Q ${x} ${sy + h} ${x} ${sy + h - r}
    L ${x} ${sy + r}
    Q ${x} ${sy} ${x + r} ${sy}
    Z`;
  page.drawSvgPath(path, {
    x: 0,
    y: ph,
    borderColor: opts.stroke ?? BLACK,
    borderWidth: opts.thickness ?? 0.8,
    color: opts.fill,
  });
}

// iPhone FRONT — y = bottom-left
function drawPhoneFront(page: PDFPage, _font: PDFFont, d: PhoneDims, opts: { accent?: RGB; showFrame?: boolean } = {}) {
  const { x, y, w, h } = d;
  const { accent = BLACK, showFrame = true } = opts;
  
  if (showFrame) {
    roundedRect(page, x, y, w, h, w * 0.13, { stroke: accent, thickness: 1.2 });
    const inset = w * 0.04;
    roundedRect(page, x + inset, y + inset, w - inset * 2, h - inset * 2, w * 0.1, {
      stroke: LIGHT,
      thickness: 0.5,
    });
  }

  // Dynamic Island near top
  const diW = w * 0.36;
  const diH = w * 0.085;
  roundedRect(
    page,
    x + (w - diW) / 2,
    y + h - (showFrame ? w * 0.04 + diH + w * 0.04 : diH + w * 0.1),
    diW,
    diH,
    diH / 2,
    { fill: BLACK, stroke: BLACK, thickness: 0.3 },
  );
}

// iPhone BACK — iPhone 17 style: vertical pill with 2 stacked lenses
function drawPhoneBack(page: PDFPage, _font: PDFFont, d: PhoneDims) {
  const { x, y, w, h } = d;
  roundedRect(page, x, y, w, h, w * 0.13, { stroke: BLACK, thickness: 1 });

  // Vertical camera pill at top-left
  const pillW = w * 0.26;
  const pillH = w * 0.58;
  const pillX = x + w * 0.1;
  const pillY = y + h - w * 0.1 - pillH;
  roundedRect(page, pillX, pillY, pillW, pillH, pillW / 2, {
    stroke: BLACK,
    thickness: 0.8,
    fill: SUBTLE,
  });

  // 2 lenses stacked vertically
  const lensR = pillW * 0.32;
  const lensX = pillX + pillW / 2;
  const lensY1 = pillY + pillH - pillW * 0.55; // top
  const lensY2 = lensY1 - lensR * 2.4;          // bottom
  for (const ly of [lensY1, lensY2]) {
    page.drawCircle({
      x: lensX,
      y: ly,
      size: lensR,
      borderColor: BLACK,
      borderWidth: 0.6,
      color: WHITE,
    });
    page.drawCircle({ x: lensX, y: ly, size: lensR * 0.5, color: BLACK });
  }

  // Small flash below lenses
  page.drawCircle({
    x: lensX,
    y: pillY + pillW * 0.5,
    size: lensR * 0.5,
    color: LIGHT,
    borderColor: GRAY,
    borderWidth: 0.4,
  });

  // MagSafe ring (center)
  page.drawCircle({
    x: x + w / 2,
    y: y + h * 0.4,
    size: w * 0.18,
    borderColor: LIGHT,
    borderWidth: 0.4,
  });
  // Apple logo placeholder
  page.drawCircle({
    x: x + w / 2,
    y: y + h * 0.4,
    size: w * 0.05,
    color: SUBTLE,
    borderColor: LIGHT,
    borderWidth: 0.4,
  });
}

// LEFT side — y = bottom-left. Action, Volume+, Volume-, SIM tray.
function drawPhoneLeftSide(page: PDFPage, _font: PDFFont, d: PhoneDims) {
  const { x, y, w, h } = d;
  roundedRect(page, x, y, w, h, w * 0.5, { stroke: BLACK, thickness: 1 });
  const bx = x - 1.2;
  const bw = w + 2.4;
  // Button drawn as thin outlined rounded pill (stroke only, white fill)
  const btn = (by: number, bh: number, fill = WHITE) =>
    roundedRect(page, bx, by, bw, bh, Math.min(bw, bh) / 2, {
      stroke: BLACK,
      thickness: 0.7,
      fill,
    });
  // Action button (small, near top)
  btn(y + h * 0.82, h * 0.05);
  // Volume +
  btn(y + h * 0.68, h * 0.09);
  // Volume -
  btn(y + h * 0.54, h * 0.09);
  // SIM tray slot (thin line lower portion)
  page.drawLine({
    start: { x: x + w * 0.1, y: y + h * 0.28 },
    end: { x: x + w * 0.9, y: y + h * 0.28 },
    thickness: 0.5,
    color: GRAY,
  });
}

// RIGHT side — Power (top), Camera Control (lower).
function drawPhoneRightSide(page: PDFPage, _font: PDFFont, d: PhoneDims) {
  const { x, y, w, h } = d;
  roundedRect(page, x, y, w, h, w * 0.5, { stroke: BLACK, thickness: 1 });
  const bx = x - 1.2;
  const bw = w + 2.4;
  const btn = (by: number, bh: number, fill = WHITE) =>
    roundedRect(page, bx, by, bw, bh, Math.min(bw, bh) / 2, {
      stroke: BLACK,
      thickness: 0.7,
      fill,
    });
  // Power
  btn(y + h * 0.7, h * 0.15);
  // Camera Control (lower)
  btn(y + h * 0.48, h * 0.07, SUBTLE);
}

// BASE — y = bottom-left. Horizontal bar.
function drawPhoneBase(page: PDFPage, _font: PDFFont, d: PhoneDims) {
  const { x, y, w, h } = d;
  roundedRect(page, x, y, w, h, h * 0.5, { stroke: BLACK, thickness: 1 });
  // USB-C centered
  const usbW = w * 0.1;
  const usbH = h * 0.4;
  roundedRect(
    page,
    x + (w - usbW) / 2,
    y + (h - usbH) / 2,
    usbW,
    usbH,
    usbH * 0.4,
    { stroke: BLACK, thickness: 0.7, fill: SUBTLE },
  );
  // Speaker grille left (row of dots)
  for (let i = 0; i < 5; i++) {
    page.drawCircle({
      x: x + w * 0.12 + i * 5,
      y: y + h / 2,
      size: 0.9,
      color: GRAY,
    });
  }
  // Speaker grille right
  for (let i = 0; i < 5; i++) {
    page.drawCircle({
      x: x + w * 0.68 + i * 5,
      y: y + h / 2,
      size: 0.9,
      color: GRAY,
    });
  }
}



// Callout line with label
function callout(
  page: PDFPage,
  font: PDFFont,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  label: string,
  align: "left" | "right" = "right",
  size = 7.5,
) {
  page.drawLine({
    start: { x: fromX, y: fromY },
    end: { x: toX, y: toY },
    thickness: 0.5,
    color: GRAY,
  });
  page.drawCircle({ x: fromX, y: fromY, size: 1.2, color: GRAY });
  const tw = font.widthOfTextAtSize(label, size);
  const tx = align === "right" ? toX + 3 : toX - tw - 3;
  page.drawText(label, { x: tx, y: toY - 2, size, font, color: BLACK });
}

// =====================================================
// PAGES
// =====================================================

function pageCover(ctx: Ctx) {
  const { page, font, bold, accent, branding, logoImg } = ctx;
  
  // Apple-style Gradient / Minimal background
  page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: WHITE });
  
  // Top branding area
  if (logoImg) {
    const maxH = 40;
    const scale = maxH / logoImg.height;
    const w = logoImg.width * scale;
    page.drawImage(logoImg, { x: MARGIN, y: PH - MARGIN - maxH, width: w, height: maxH });
  }
  
  const sn = branding.storeName || "Sua Loja";
  const tw_sn = bold.widthOfTextAtSize(sn, 14);
  page.drawText(sn, {
    x: PW - MARGIN - tw_sn,
    y: PH - MARGIN - 25,
    size: 14,
    font: bold,
    color: BLACK,
  });

  // Main Title - Centered Apple Style
  const title1 = "Manual de Avaliação";
  const title2 = "de iPhone";
  const t1w = bold.widthOfTextAtSize(title1, 42);
  const t2w = bold.widthOfTextAtSize(title2, 42);
  
  drawText(page, title1, (PW - t1w) / 2, PH - 200, {
    font: bold,
    size: 42,
  });
  drawText(page, title2, (PW - t2w) / 2, PH - 250, { 
    font: bold, 
    size: 42, 
    color: accent 
  });

  // iPhone Frame Drawing (The "iPhone" requested by user)
  const phoneW = 200;
  const phoneH = 410;
  const px = (PW - phoneW) / 2;
  const py = PH - 680;
  
  // Draw a sleek iPhone frame
  drawPhoneFront(page, font, { x: px, y: py, w: phoneW, h: phoneH }, { accent, showFrame: true });
  
  // Subtitle below phone
  const subtitle = "Guia oficial para avaliação e troca";
  const sw = font.widthOfTextAtSize(subtitle, 14);
  drawText(page, subtitle, (PW - sw) / 2, py - 40, { font, size: 14, color: GRAY });
  // Info card
  const cardY = PH - 780; // Moved lower
  page.drawRectangle({
    x: MARGIN,
    y: cardY,
    width: PW - MARGIN * 2,
    height: 80,
    color: SUBTLE,
    borderColor: LIGHT,
    borderWidth: 0.6,
  });
  const labels = ["Cliente:", "Modelo:"];
  labels.forEach((l, i) => {
    const yy = cardY + 50 - i * 25;
    drawText(page, l, MARGIN + 16, yy, { font: bold, size: 10 });
    page.drawLine({
      start: { x: MARGIN + 80, y: yy - 2 },
      end: { x: PW - MARGIN - 16, y: yy - 2 },
      thickness: 0.5,
      color: GRAY,
    });
  });

  // Contact (if any) at the very bottom
  if (branding.instagram || branding.phone) {
    let cx = MARGIN;
    if (branding.instagram) {
      drawText(page, `Instagram: @${branding.instagram.replace(/^@/, "")}`, cx, 40, {
        font,
        size: 9,
        color: GRAY,
      });
      cx += 180;
    }
    if (branding.phone) {
      drawText(page, `WhatsApp: ${branding.phone}`, cx, 40, { font, size: 9, color: GRAY });
    }
  }
}

function pageHowToUse(ctx: Ctx) {
  const { page, font, bold, accent } = ctx;
  drawText(page, "Como usar", MARGIN, PH - 80, { font: bold, size: 22 });
  drawText(
    page,
    "Apenas 2 passos para a sua avaliação ser feita corretamente.",
    MARGIN,
    PH - 105,
    { font, size: 11, color: GRAY },
  );

  const steps = [
    {
      n: "1",
      title: "Grave o vídeo do aparelho",
      body:
        "Siga o roteiro da próxima página, mostrando frente, verso, laterais e base do iPhone. O vídeo deve ter entre 2 e 3 minutos, com boa iluminação. Envie o vídeo junto com este manual preenchido.",
    },
    {
      n: "2",
      title: "Rode o app JCID Doctor",
      body:
        "Instale o app JCID Doctor pela App Store, rode o teste completo do iPhone (bateria, Face ID, câmeras, sensores, originalidade de peças) e envie um print/captura do relatório final.",
    },
  ];

  let yy = PH - 160;
  for (const s of steps) {
    page.drawCircle({ x: MARGIN + 18, y: yy - 18, size: 18, color: accent });
    page.drawText(s.n, {
      x: MARGIN + 13,
      y: yy - 23,
      size: 18,
      font: bold,
      color: WHITE,
    });
    drawText(page, s.title, MARGIN + 50, yy - 10, { font: bold, size: 14 });
    drawWrapped(page, s.body, MARGIN + 50, yy - 30, font, 10.5, PW - MARGIN * 2 - 50, GRAY);
    yy -= 95;
  }

  // Warning
  drawDivider(page, yy);
  yy -= 25;
  page.drawRectangle({
    x: MARGIN,
    y: yy - 70,
    width: PW - MARGIN * 2,
    height: 70,
    color: rgb(1, 0.97, 0.9),
    borderColor: rgb(0.95, 0.7, 0.2),
    borderWidth: 0.6,
  });
  drawText(page, "Importante antes de enviar para avaliação", MARGIN + 16, yy - 18, {
    font: bold,
    size: 11,
  });
  drawWrapped(
    page,
    "Desative o Buscar (Find My iPhone) antes de gravar o vídeo e rodar o JCID Doctor — sem isso a avaliação não pode ser concluída. Veja como na última página deste manual.",
    MARGIN + 16,
    yy - 35,
    font,
    9.5,
    PW - MARGIN * 2 - 32,
    rgb(0.4, 0.25, 0),
  );
}

function pageVideoScript(ctx: Ctx) {
  const { page, font, bold, accent } = ctx;
  drawText(page, "Como gravar o vídeo", MARGIN, PH - 80, { font: bold, size: 22 });
  drawText(
    page,
    "Mostre o aparelho seguindo a ordem abaixo. Tempo total: 2 a 3 minutos.",
    MARGIN,
    PH - 105,
    { font, size: 11, color: GRAY },
  );

  // Top of diagram row
  const diagTop = PH - 145;
  const phoneH = 120;
  const phoneW = 60;
  const sideW = 14;
  const baseW = 60;
  const baseH = 14;
  const diagBottom = diagTop - phoneH;
  const labelY = diagBottom - 12;
  const subLabelY = diagBottom - 22;

  // Five columns, evenly spaced
  const colCount = 5;
  const colW = (PW - MARGIN * 2) / colCount;
  const colCenters = Array.from({ length: colCount }, (_, i) => MARGIN + colW * (i + 0.5));

  // 1. Front
  drawPhoneFront(page, font, {
    x: colCenters[0] - phoneW / 2,
    y: diagBottom,
    w: phoneW,
    h: phoneH,
  });
  centerLabel(page, "1. Frente", colCenters[0], labelY, bold, 9);
  centerLabel(page, "15 seg", colCenters[0], subLabelY, font, 8, GRAY);

  // 2. Back
  drawPhoneBack(page, font, {
    x: colCenters[1] - phoneW / 2,
    y: diagBottom,
    w: phoneW,
    h: phoneH,
  });
  centerLabel(page, "2. Verso", colCenters[1], labelY, bold, 9);
  centerLabel(page, "20 seg", colCenters[1], subLabelY, font, 8, GRAY);

  // 3. Left side
  drawPhoneLeftSide(page, font, {
    x: colCenters[2] - sideW / 2,
    y: diagBottom,
    w: sideW,
    h: phoneH,
  });
  centerLabel(page, "3. Esquerda", colCenters[2], labelY, bold, 9);
  centerLabel(page, "15 seg", colCenters[2], subLabelY, font, 8, GRAY);

  // 4. Right side
  drawPhoneRightSide(page, font, {
    x: colCenters[3] - sideW / 2,
    y: diagBottom,
    w: sideW,
    h: phoneH,
  });
  centerLabel(page, "4. Direita", colCenters[3], labelY, bold, 9);
  centerLabel(page, "15 seg", colCenters[3], subLabelY, font, 8, GRAY);

  // 5. Base — horizontal, centered vertically
  drawPhoneBase(page, font, {
    x: colCenters[4] - baseW / 2,
    y: diagBottom + (phoneH - baseH) / 2,
    w: baseW,
    h: baseH,
  });
  centerLabel(page, "5. Base", colCenters[4], labelY, bold, 9);
  centerLabel(page, "10 seg", colCenters[4], subLabelY, font, 8, GRAY);

  // Detailed instructions
  let yy = subLabelY - 25;
  drawDivider(page, yy);
  yy -= 22;

  const sections = [
    {
      t: "1. Frente - 15s",
      b: "Tela ligada e desligada. Aproxime nas bordas e cantos para mostrar trincas, lascas ou levantamento. Mostre a Dynamic Island / notch e a câmera frontal.",
    },
    {
      t: "2. Verso - 20s",
      b: "Mostre toda a traseira com luz incidindo de lado para revelar riscos. Aproxime no módulo de câmeras (cada lente), no flash e na região do MagSafe.",
    },
    {
      t: "3. Lateral esquerda - 15s",
      b: "Mostre o Action Button (ou switch mute), volume + e volume -. Pressione cada um. Mostre a bandeja do SIM.",
    },
    {
      t: "4. Lateral direita - 15s",
      b: "Mostre o botão lateral (power) e o Camera Control (se houver). Pressione cada um.",
    },
    {
      t: "5. Base - 10s",
      b: "Mostre o conector USB-C / Lightning, alto-falantes e microfones. Confirme que não há resíduos no conector.",
    },
    {
      t: "Por último - IMEI",
      b: "Vá em Ajustes -> Geral -> Sobre e role até IMEI. Filme a tela mostrando o IMEI por uns 5 segundos.",
    },
  ];

  for (const s of sections) {
    drawText(page, "•", MARGIN, yy, { font: bold, size: 11, color: accent });
    drawText(page, s.t, MARGIN + 12, yy, { font: bold, size: 9.5 });
    yy = drawWrapped(page, s.b, MARGIN + 12, yy - 12, font, 9, PW - MARGIN * 2 - 12, GRAY);
    yy -= 6;
  }
}

function centerLabel(
  page: PDFPage,
  text: string,
  cx: number,
  y: number,
  font: PDFFont,
  size: number,
  color: RGB = BLACK,
) {
  const tw = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - tw / 2, y, size, font, color });
}

function pageButtonsDiagram(ctx: Ctx) {
  const { page, font, bold, accent } = ctx;
  drawText(page, "Botões físicos", MARGIN, PH - 80, { font: bold, size: 22 });
  drawText(
    page,
    "Teste cada botão durante a gravação do vídeo. Marque OK se estiver funcionando.",
    MARGIN,
    PH - 105,
    { font, size: 11, color: GRAY },
  );

  // Large phone front in center — y = bottom-left
  const phoneW = 150;
  const phoneH = 310;
  const px = (PW - phoneW) / 2;
  const pyBottom = PH - 470; // bottom of phone; top = PH-160
  drawPhoneFront(page, font, { x: px, y: pyBottom, w: phoneW, h: phoneH });

  // Left side buttons (drawn as black bars sticking out of left edge)
  const leftBtns = [
    { y: pyBottom + phoneH * 0.78, label: "Action Button", desc: "Pressione e segure" },
    { y: pyBottom + phoneH * 0.66, label: "Volume +", desc: "Pressione 1x" },
    { y: pyBottom + phoneH * 0.58, label: "Volume -", desc: "Pressione 1x" },
  ];
  leftBtns.forEach((b) => {
    page.drawRectangle({ x: px - 4, y: b.y, width: 5, height: 10, color: BLACK });
    callout(page, font, px - 4, b.y + 5, px - 70, b.y + 5, b.label, "left", 8);
    const dw = font.widthOfTextAtSize(b.desc, 7);
    page.drawText(b.desc, {
      x: px - 70 - dw,
      y: b.y - 4,
      size: 7,
      font,
      color: GRAY,
    });
  });

  // Right side buttons
  const rightBtns = [
    { y: pyBottom + phoneH * 0.72, label: "Botão lateral (Power)", desc: "Liga/desliga, screenshot" },
    { y: pyBottom + phoneH * 0.55, label: "Camera Control", desc: "Pressione (15/16 Pro)" },
  ];
  rightBtns.forEach((b) => {
    page.drawRectangle({ x: px + phoneW - 1, y: b.y, width: 5, height: 14, color: BLACK });
    callout(page, font, px + phoneW + 4, b.y + 7, px + phoneW + 60, b.y + 7, b.label, "right", 8);
    page.drawText(b.desc, {
      x: px + phoneW + 63,
      y: b.y - 4,
      size: 7,
      font,
      color: GRAY,
    });
  });

  // Checklist below the phone
  let yy = pyBottom - 25;
  drawDivider(page, yy + 12);
  drawText(page, "Checklist dos botões", MARGIN, yy, { font: bold, size: 12 });
  yy -= 22;
  const items = [
    "Action Button / switch mute alterna corretamente",
    "Volume + aumenta o volume",
    "Volume - diminui o volume",
    "Botão lateral liga/desliga a tela",
    "Botão lateral + Volume + tira screenshot",
    "Camera Control responde ao toque (modelos Pro)",
    "Bandeja do SIM abre sem trava",
  ];
  for (const it of items) {
    drawCheckbox(page, MARGIN, yy, 10);
    drawText(page, it, MARGIN + 18, yy + 1, { font, size: 9.5 });
    yy -= 18;
  }
}

function pageAesthetic(ctx: Ctx) {
  const { page, font, bold, accent } = ctx;
  drawText(page, "Checklist estético externo", MARGIN, PH - 80, { font: bold, size: 22 });
  drawText(
    page,
    "Marque o estado de cada face. Use o vídeo como referência.",
    MARGIN,
    PH - 105,
    { font, size: 11, color: GRAY },
  );

  const faces: Array<{
    label: string;
    draw: (page: PDFPage, font: PDFFont, d: PhoneDims) => void;
    w: number;
    h: number;
  }> = [
    { label: "Frente", draw: drawPhoneFront, w: 40, h: 80 },
    { label: "Verso", draw: drawPhoneBack, w: 40, h: 80 },
    { label: "Lateral esquerda", draw: drawPhoneLeftSide, w: 10, h: 80 },
    { label: "Lateral direita", draw: drawPhoneRightSide, w: 10, h: 80 },
    { label: "Base", draw: drawPhoneBase, w: 50, h: 14 },
  ];

  const states = ["OK", "Risco leve", "Risco profundo", "Amassado", "Trinca"];

  let yy = PH - 145;
  for (const f of faces) {
    // Card
    const cardH = 95;
    page.drawRectangle({
      x: MARGIN,
      y: yy - cardH,
      width: PW - MARGIN * 2,
      height: cardH,
      borderColor: LIGHT,
      borderWidth: 0.5,
      color: WHITE,
    });
    // diagram — d.y = bottom-left of phone box
    const dx = MARGIN + 20;
    const dy =
      f.label === "Base"
        ? yy - cardH / 2 - f.h / 2
        : yy - cardH + (cardH - f.h) / 2;
    f.draw(page, font, { x: dx, y: dy, w: f.w, h: f.h });

    // label
    drawText(page, f.label, MARGIN + 90, yy - 18, { font: bold, size: 12 });

    // checkboxes
    let cx = MARGIN + 90;
    let cy = yy - 38;
    states.forEach((s, i) => {
      const xx = cx + (i % 3) * 130;
      const yyc = cy - Math.floor(i / 3) * 20;
      drawCheckbox(page, xx, yyc, 9);
      drawText(page, s, xx + 14, yyc, { font, size: 9 });
    });

    // observation line
    drawText(page, "Obs:", MARGIN + 90, yy - cardH + 14, { font: bold, size: 8.5 });
    page.drawLine({
      start: { x: MARGIN + 115, y: yy - cardH + 13 },
      end: { x: PW - MARGIN - 16, y: yy - cardH + 13 },
      thickness: 0.4,
      color: GRAY,
    });

    yy -= cardH + 10;
  }
}

function pageJcid(ctx: Ctx) {
  const { page, font, bold, accent } = ctx;
  drawText(page, "Testes funcionais — JCID Doctor", MARGIN, PH - 80, {
    font: bold,
    size: 22,
  });
  drawText(
    page,
    "App gratuito que roda um diagnóstico completo do iPhone.",
    MARGIN,
    PH - 105,
    { font, size: 11, color: GRAY },
  );

  // Steps
  let yy = PH - 145;
  drawText(page, "1. Instalar", MARGIN, yy, { font: bold, size: 12 });
  yy -= 16;
  yy = drawWrapped(
    page,
    "Baixe o app JCID Doctor na App Store. Link:",
    MARGIN,
    yy,
    font,
    10,
    PW - MARGIN * 2,
    GRAY,
  );
  drawText(
    page,
    "https://apps.apple.com/fr/app/jcid-doctor/id6754861928",
    MARGIN,
    yy - 6,
    { font, size: 9.5, color: accent },
  );
  yy -= 30;

  drawText(page, "2. Rodar o teste completo", MARGIN, yy, { font: bold, size: 12 });
  yy -= 16;
  yy = drawWrapped(
    page,
    'Abra o app, selecione "Teste completo" (ou equivalente) e siga as instruções na tela. O teste pode pedir para tocar em áreas da tela, falar no microfone, usar o Face ID, abrir as câmeras, etc. Execute tudo até o fim.',
    MARGIN,
    yy,
    font,
    10,
    PW - MARGIN * 2,
    GRAY,
  );
  yy -= 14;

  drawText(page, "3. O que o relatório deve mostrar", MARGIN, yy, { font: bold, size: 12 });
  yy -= 20;
  const checks = [
    "Saúde da bateria (% e ciclos)",
    "Originalidade da bateria, tela e câmera (peças não trocadas)",
    "Face ID funcionando",
    "Câmeras (frontal, principal, ultra-wide, tele) sem falha",
    "Microfones e alto-falantes OK",
    "Sensores (giroscópio, acelerômetro, proximidade, luz) OK",
    "Conectividade (Wi-Fi, Bluetooth, GPS) OK",
    "True Tone e brilho automático OK",
    "Conector de carga e carregamento sem fio funcionando",
  ];
  for (const c of checks) {
    drawCheckbox(page, MARGIN, yy, 9);
    drawText(page, c, MARGIN + 16, yy, { font, size: 9.5 });
    yy -= 16;
  }

  yy -= 10;
  // Print box
  page.drawRectangle({
    x: MARGIN,
    y: yy - 70,
    width: PW - MARGIN * 2,
    height: 70,
    color: SUBTLE,
    borderColor: LIGHT,
    borderWidth: 0.6,
  });
  drawText(page, "4. Envie o print do relatório final", MARGIN + 16, yy - 18, {
    font: bold,
    size: 11,
  });
  drawWrapped(
    page,
    "Tire uma captura de tela do resumo do relatório do JCID Doctor e envie junto com o vídeo. Sem o print do relatório a avaliação não pode ser concluída.",
    MARGIN + 16,
    yy - 35,
    font,
    9.5,
    PW - MARGIN * 2 - 32,
    GRAY,
  );
}

function pageFindMy(ctx: Ctx) {
  const { page, font, bold, accent } = ctx;
  drawText(page, "Desativar o Buscar (Find My)", MARGIN, PH - 80, {
    font: bold,
    size: 22,
  });
  drawText(
    page,
    "Passo obrigatório antes da avaliação.",
    MARGIN,
    PH - 105,
    { font, size: 11, color: GRAY },
  );

  // Warning
  page.drawRectangle({
    x: MARGIN,
    y: PH - 170,
    width: PW - MARGIN * 2,
    height: 50,
    color: rgb(1, 0.94, 0.94),
    borderColor: rgb(0.85, 0.3, 0.3),
    borderWidth: 0.6,
  });
  drawText(
    page,
    "Sem desativar o Buscar, a loja não consegue verificar a originalidade das peças nem confirmar que o aparelho está livre. A avaliação não pode ser concluída.",
    MARGIN + 16,
    PH - 145,
    { font, size: 10, color: rgb(0.5, 0.1, 0.1), maxWidth: PW - MARGIN * 2 - 32 },
  );

  // Steps
  let yy = PH - 200;
  drawText(page, "Passo a passo no iPhone", MARGIN, yy, { font: bold, size: 13 });
  yy -= 24;

  const steps = [
    'Abra o app "Ajustes" no iPhone.',
    "Toque no seu nome no topo da tela.",
    'Toque em "Buscar".',
    'Toque em "Buscar iPhone".',
    'Desative a chave "Buscar iPhone".',
    "Digite a senha do seu Apple ID para confirmar.",
    'Pronto. A chave deve aparecer cinza (desativada).',
  ];

  for (let i = 0; i < steps.length; i++) {
    page.drawCircle({ x: MARGIN + 10, y: yy - 5, size: 9, color: accent });
    page.drawText(String(i + 1), {
      x: MARGIN + 7,
      y: yy - 8,
      size: 9,
      font: bold,
      color: WHITE,
    });
    drawWrapped(page, steps[i], MARGIN + 30, yy, font, 11, PW - MARGIN * 2 - 30);
    yy -= 28;
  }

  yy -= 10;
  drawDivider(page, yy);
  yy -= 25;
  drawText(page, "Esqueceu a senha do Apple ID?", MARGIN, yy, { font: bold, size: 11 });
  yy -= 16;
  drawWrapped(
    page,
    "Acesse iforgot.apple.com pelo navegador para recuperar. Sem a senha do Apple ID não é possível desativar o Buscar.",
    MARGIN,
    yy,
    font,
    10,
    PW - MARGIN * 2,
    GRAY,
  );
}

// =====================================================
// MAIN
// =====================================================

export async function generateManualPdf(branding: BrandingInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const accent = hexToRgb(branding.accentHex || "#007AFF");

  let logoImg: any | undefined;
  if (branding.logoBytes && branding.logoMime) {
    try {
      if (branding.logoMime.includes("png")) {
        logoImg = await doc.embedPng(branding.logoBytes);
      } else if (branding.logoMime.includes("jpeg") || branding.logoMime.includes("jpg")) {
        logoImg = await doc.embedJpg(branding.logoBytes);
      }
    } catch {
      logoImg = undefined;
    }
  }

  const totalPages = 7;
  const ctxBase: Ctx = {
    doc,
    page: null as any,
    font,
    bold,
    accent,
    branding,
    logoImg,
    pageNum: 0,
    totalPages,
  };

  // Cover (no header/footer)
  const coverPage = doc.addPage([PW, PH]);
  const coverCtx: Ctx = { ...ctxBase, page: coverPage, pageNum: 1 };
  pageCover(coverCtx);

  // Helper to build subsequent pages
  const build = (drawer: (c: Ctx) => void, n: number) => {
    const p = doc.addPage([PW, PH]);
    const c: Ctx = { ...ctxBase, page: p, pageNum: n };
    drawHeader(c);
    drawFooter(c);
    drawer(c);
  };

  build(pageHowToUse, 2);
  build(pageVideoScript, 3);
  build(pageButtonsDiagram, 4);
  build(pageAesthetic, 5);
  build(pageJcid, 6);
  build(pageFindMy, 7);

  return await doc.save();
}
