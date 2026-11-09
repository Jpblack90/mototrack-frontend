import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

// Toda la paleta fija de Tailwind (22 familias de color con escala numérica)
const PALETTE_REGEX = /\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;

// Black y white con opacidad (ej. bg-black/50, text-white/80)
const OPACITY_BLACK_WHITE_REGEX = /\b(?:[a-z0-9-]+-)?(black|white)\/\d+\b/g;

// Primitivas de UI con overlays de telón de fondo modales justificados (shadcn / Radix)
const JUSTIFIED_OVERLAY_FILES = new Set([
  'src/components/ui/alert-dialog.jsx',
  'src/components/ui/dialog.jsx',
  'src/components/ui/sheet.jsx',
]);

let violations = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanDirectory(fullPath);
      }
    } else if (/\.(jsx?|css)$/.test(entry.name)) {
      const relPath = `src/${path.relative(srcDir, fullPath).replace(/\\/g, '/')}`;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const lineMatches = [];

        // 1. Verificar paleta Tailwind completa
        const paletteMatches = line.match(PALETTE_REGEX);
        if (paletteMatches) {
          lineMatches.push(...paletteMatches);
        }

        // 2. Verificar black/white con opacidad (excluyendo overlays justificados de shadcn)
        const bwMatches = line.match(OPACITY_BLACK_WHITE_REGEX);
        if (bwMatches) {
          const isJustifiedOverlay =
            JUSTIFIED_OVERLAY_FILES.has(relPath) &&
            line.includes('fixed inset-0') &&
            line.includes('bg-black/');

          if (!isJustifiedOverlay) {
            lineMatches.push(...bwMatches);
          }
        }

        if (lineMatches.length > 0) {
          violations.push({
            file: relPath,
            line: index + 1,
            matches: [...new Set(lineMatches)].join(', '),
            text: line.trim(),
          });
        }
      });
    }
  }
}

scanDirectory(srcDir);

if (violations.length > 0) {
  console.error(`Se encontraron ${violations.length} violaciones de clases de paleta fija o colores sin tokens:`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.matches}] -> ${v.text}`);
  }
  process.exit(1);
}

process.exit(0);
