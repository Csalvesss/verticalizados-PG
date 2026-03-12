import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Design 1200×630 inspirado na imagem fornecida ─────────────────────────
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <clipPath id="left-clip">
      <rect width="600" height="630"/>
    </clipPath>
    <clipPath id="right-clip">
      <rect x="600" width="600" height="630"/>
    </clipPath>
  </defs>

  <!-- ── LEFT PANEL — escuro ─────────────────────────────── -->
  <rect width="600" height="630" fill="#17100a"/>

  <!-- Noise/texture sutil com linhas diagonais -->
  <line x1="0" y1="0" x2="600" y2="630" stroke="#ffffff" stroke-width="0.3" opacity="0.03"/>
  <line x1="100" y1="0" x2="700" y2="630" stroke="#ffffff" stroke-width="0.3" opacity="0.02"/>

  <!-- PG · MJA ESPLANADA  -->
  <text x="50" y="88"
    font-family="Liberation Sans, FreeSans, Arial, sans-serif"
    font-size="15" fill="#666666" letter-spacing="4">PG  ·  MJA ESPLANADA</text>

  <!-- VERTICALI (branco) -->
  <text x="48" y="250"
    font-family="Liberation Sans, FreeSans, Arial, sans-serif"
    font-size="130" font-weight="700" fill="#ffffff"
    letter-spacing="-2">VERTICALI</text>

  <!-- ZADOS (laranja) -->
  <text x="48" y="388"
    font-family="Liberation Sans, FreeSans, Arial, sans-serif"
    font-size="130" font-weight="700" fill="#F07830"
    letter-spacing="-2">ZADOS</text>

  <!-- Underline laranja sob ZADOS -->
  <rect x="48" y="398" width="460" height="6" rx="3" fill="#F07830"/>

  <!-- Tagline -->
  <text x="50" y="460"
    font-family="Liberation Sans, FreeSans, Arial, sans-serif"
    font-size="28" font-weight="700" fill="#e0e0e0">Conectados verticalmente.</text>
  <text x="50" y="498"
    font-family="Liberation Sans, FreeSans, Arial, sans-serif"
    font-size="28" font-weight="700" fill="#e0e0e0">Enraizados na Palavra.</text>

  <!-- URL -->
  <text x="50" y="600"
    font-family="Liberation Sans, FreeSans, Arial, sans-serif"
    font-size="17" fill="#444444">verticalizados-pg.netlify.app</text>

  <!-- ── RIGHT PANEL — laranja ──────────────────────────── -->
  <rect x="600" width="600" height="630" fill="#F07830"/>

  <!-- Linhas decorativas sutis (estilo da imagem de referência) -->
  <line x1="660" y1="110" x2="660" y2="520" stroke="#000000" stroke-width="1.2" opacity="0.18"/>
  <line x1="1140" y1="110" x2="1140" y2="520" stroke="#000000" stroke-width="1.2" opacity="0.12"/>
  <line x1="700" y1="100" x2="700" y2="70"  stroke="#000000" stroke-width="1.5" opacity="0.25"/>
  <line x1="1120" y1="200" x2="1160" y2="200" stroke="#000000" stroke-width="1.5" opacity="0.25"/>
  <line x1="1130" y1="190" x2="1130" y2="150" stroke="#000000" stroke-width="1.5" opacity="0.25"/>

  <!-- VERTICALIZADOS — texto vertical esquerdo do painel laranja -->
  <text
    transform="translate(692 430) rotate(-90)"
    font-family="Liberation Sans, FreeSans, Arial, sans-serif"
    font-size="20" font-weight="700" fill="#000000"
    letter-spacing="5" opacity="0.5">VERTICALIZADOS</text>

  <!-- ── BIBLE ICON centrado no painel direito ──────────── -->
  <!-- Corpo do livro -->
  <rect x="850" y="210" width="140" height="180" rx="6"
    fill="none" stroke="#111111" stroke-width="4"/>
  <!-- Lombada -->
  <rect x="850" y="210" width="25" height="180" rx="4"
    fill="none" stroke="#111111" stroke-width="3"/>
  <!-- Cruz (vertical) -->
  <rect x="912" y="240" width="16" height="80" rx="3" fill="#111111"/>
  <!-- Cruz (horizontal) -->
  <rect x="888" y="268" width="64" height="16" rx="3" fill="#111111"/>
  <!-- Marcador de página -->
  <path d="M908 390 L932 390 L932 430 L920 418 L908 430 Z"
    fill="#111111"/>

  <!-- MJA.ESPLANADA -->
  <text x="920" y="472"
    font-family="Liberation Sans, FreeSans, Arial, sans-serif"
    font-size="18" fill="#111111" text-anchor="middle"
    letter-spacing="3" opacity="0.7">MJA.ESPLANADA</text>
</svg>
`.trim();

const resvg = new Resvg(svg, {
  font: {
    loadSystemFonts: true,
  },
  fitTo: { mode: 'original' },
});

const rendered = resvg.render();
const pngBuffer = rendered.asPng();

const outPath = join(__dirname, '../public/og-image.png');
writeFileSync(outPath, pngBuffer);
console.log(`✅  og-image.png gerado em public/ (${pngBuffer.length} bytes)`);
