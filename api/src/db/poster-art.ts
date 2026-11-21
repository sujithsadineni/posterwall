// Original poster art for the demo data (never copies of real posters): a palette per language,
// shapes placed from a hash of the title, the title and year in big type. 600×900, SVG.

const PALETTES: Record<string, [bg1: string, bg2: string, a: string, b: string]> = {
  english: ["#0F172A", "#1E3A8A", "#38BDF8", "#F59E0B"],
  uk: ["#1F2937", "#7F1D1D", "#F87171", "#E5E7EB"],
  hindi: ["#3B0764", "#9D174D", "#F472B6", "#FDE68A"],
  telugu: ["#431407", "#B45309", "#FBBF24", "#FB7185"],
  tamil: ["#022C22", "#065F46", "#34D399", "#FCD34D"],
};
const LABEL: Record<string, string> = {
  english: "ENGLISH",
  uk: "UK",
  hindi: "HINDI",
  telugu: "TELUGU",
  tamil: "TAMIL",
};

function hash(s: string) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0), h / 4294967296);
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// up to 3 lines of about 12 characters
function lines(title: string) {
  const out: string[] = [];
  for (const word of title.toUpperCase().split(/\s+/)) {
    const last = out.at(-1);
    if (last && (last + " " + word).length <= 12) out[out.length - 1] = `${last} ${word}`;
    else out.push(word);
  }
  return out.slice(0, 3);
}

export function posterSvg(title: string, year: number | null, language: string) {
  const [bg1, bg2, a, b] = PALETTES[language];
  const rnd = hash(title);
  const circles = Array.from({ length: 5 }, (_, i) => {
    const r = 60 + rnd() * 180;
    return `<circle cx="${(rnd() * 600).toFixed(0)}" cy="${(80 + rnd() * 480).toFixed(0)}" r="${r.toFixed(0)}" fill="${i % 2 ? a : b}" opacity="${(0.12 + rnd() * 0.25).toFixed(2)}"/>`;
  }).join("");
  const angle = (rnd() * 40 - 20).toFixed(1);
  const rows = lines(title);
  const size = rows.some((r) => r.length > 9) ? 64 : 84;
  const text = rows
    .map(
      (row, i) =>
        `<text x="300" y="${640 + (i - rows.length + 1) * (size + 6)}" text-anchor="middle" font-size="${size}">${esc(row)}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg2}"/><stop offset="1" stop-color="${bg1}"/></linearGradient></defs>
<rect width="600" height="900" fill="url(#g)"/>${circles}
<rect x="-100" y="430" width="800" height="14" fill="${a}" opacity="0.5" transform="rotate(${angle} 300 437)"/>
<rect x="0" y="560" width="600" height="340" fill="${bg1}" opacity="0.55"/>
<g font-family="Helvetica, Arial, sans-serif" font-weight="800" fill="#FFFFFF" letter-spacing="2">${text}</g>
<text x="300" y="${year ? 730 : 720}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="${b}" letter-spacing="8">${LABEL[language]}${year ? ` · ${year}` : ""}</text>
<text x="300" y="44" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#FFFFFF" opacity="0.6" letter-spacing="4">POSTERWALL ORIGINAL ART</text>
</svg>`;
}
