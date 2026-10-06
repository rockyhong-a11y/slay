import { mkdir, writeFile } from "node:fs/promises";

// Original native vector illustrations for SLAY. No external images or fonts.
const dir = "public/assets";
const defs = `<defs>
  <linearGradient id="steel" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#e3ecf3"/><stop offset=".26" stop-color="#778794"/><stop offset=".48" stop-color="#c4d2dc"/><stop offset=".53" stop-color="#566779"/><stop offset="1" stop-color="#262f3d"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="#fff2b4"/><stop offset=".28" stop-color="#e6b958"/><stop offset=".53" stop-color="#916028"/><stop offset=".7" stop-color="#ebc56d"/><stop offset="1" stop-color="#7f4d20"/></linearGradient>
  <linearGradient id="red" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ed5560"/><stop offset=".5" stop-color="#aa273c"/><stop offset="1" stop-color="#3a1424"/></linearGradient>
  <linearGradient id="leather" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#3c4552"/><stop offset=".4" stop-color="#111824"/><stop offset="1" stop-color="#030711"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e1b782"/><stop offset=".45" stop-color="#a56e40"/><stop offset="1" stop-color="#593720"/></linearGradient>
  <filter id="shadow" x="-35%" y="-35%" width="180%" height="180%"><feDropShadow dx="0" dy="13" stdDeviation="9" flood-color="#000" flood-opacity=".55"/></filter>
</defs>`;
const wrap = (title, art) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384" viewBox="0 0 512 384" role="img"><title>${title}</title>${defs}<g stroke="#0a0c14" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" filter="url(#shadow)">${art}</g></svg>`;
const screw = (x, y, r = 5) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#c2cdd4" stroke="#273240" stroke-width="2"/><path d="M${x - r * 0.5} ${y}h${r}" stroke="#394350" stroke-width="1.5"/>`;
const gear = {
  chair: [
    "Folding steel wrestling chair",
    `<g transform="rotate(-9 256 194)"><path d="M168 76l13 173-40 72M337 77l-10 175 41 67M184 200l155 109M329 197L173 321" fill="none" stroke="#141b27" stroke-width="20"/><path d="M168 76l13 173-40 72M337 77l-10 175 41 67M184 200l155 109M329 197L173 321" fill="none" stroke="url(#steel)" stroke-width="12"/><rect x="147" y="46" width="205" height="111" rx="19" fill="url(#steel)"/><rect x="164" y="62" width="171" height="72" rx="13" fill="url(#leather)"/><path d="M153 204l171-3 35 51-196 12-22-26z" fill="url(#steel)"/><path d="M159 212l157-3 23 34-170 10-16-20z" fill="#344353"/><path d="M183 70h125M171 218l139-3" stroke="#bdc9d2" stroke-width="3" opacity=".55"/>${screw(183, 184)}${screw(327, 183)}<path d="M138 321h11m19 1h13m151-9h12m18 9h12" stroke="#10151e" stroke-width="11"/></g>`,
  ],
  ringbell: [
    "Brass ring bell with wooden striker",
    `<path d="M99 246l227-6 34 38-238 16-27-21z" fill="url(#wood)"/><path d="M112 258l230-7M117 276l228-11" fill="none" stroke="#4c2f1d" stroke-width="3"/><path d="M135 243c-5-18 4-31 21-34 12-71 37-101 68-102 36-1 62 38 74 101 20 5 31 18 25 35-23 26-167 27-188 0z" fill="url(#gold)"/><ellipse cx="228" cy="231" rx="93" ry="22" fill="none" stroke="#ffdea0" stroke-width="3"/><path d="M178 188c8-36 22-58 39-62" fill="none" stroke="#ffe9a5" stroke-width="11" opacity=".6"/><path d="M226 90v20" stroke="url(#steel)" stroke-width="11"/>${screw(226, 85, 11)}<g transform="rotate(-35 362 161)"><rect x="351" y="95" width="20" height="193" rx="9" fill="url(#wood)"/><rect x="314" y="87" width="96" height="42" rx="13" fill="url(#wood)"/><path d="M327 91v35m71-35v35" stroke="#32241a" stroke-width="5"/></g>`,
  ],
  kendostick: [
    "Taped bamboo kendo stick",
    `<g transform="rotate(42 259 188)"><path d="M239 17q17-9 34 0l-4 327q-14 10-28 0z" fill="url(#wood)"/><path d="M250 18l-3 231M261 18l-1 231" stroke="#74502e" stroke-width="3"/><path d="M239 55h34M239 142h32M239 225h30" stroke="#dbbd83" stroke-width="10"/><rect x="237" y="252" width="35" height="83" rx="6" fill="#e2dfe0"/><path d="M239 258l30 16m-30-2 30 16m-30-2 30 16m-30-2 30 16m-30-2 30 16" stroke="#8f939f" stroke-width="3"/><path d="M236 245h38" stroke="#161b26" stroke-width="12"/></g>`,
  ],
  microphone: [
    "Ringside wrestling microphone",
    `<g transform="rotate(32 256 190)"><path d="M218 174l19 151q19 17 39 0l17-151z" fill="url(#leather)"/><path d="M243 208l6 103" stroke="#637482" stroke-width="7"/><rect x="208" y="152" width="96" height="66" rx="7" fill="url(#red)"/><path d="M224 172h30l-21 23h-9m42-23h21v23h-21z" fill="none" stroke="#fff5db" stroke-width="5"/><ellipse cx="256" cy="108" rx="55" ry="57" fill="url(#steel)"/><g fill="none" stroke="#334352" stroke-width="3"><path d="M211 84h90M203 99h107M203 115h108M209 131h96M220 147h73M230 57v96M247 52v107M265 51v108M282 59v93"/></g><path d="M214 155h85" stroke="#090d15" stroke-width="9"/></g>`,
  ],
  icepack: [
    "Corner medical ice pack",
    `<path d="M201 110c-38 13-79 73-68 150 4 42 190 56 231 6 16-73-27-141-63-156z" fill="#2b85a1"/><path d="M186 132c-23 41-38 86-29 119m155-112c24 37 39 79 33 114" stroke="#7fc9d7" stroke-width="8" opacity=".65"/><path d="M184 108l133 1-15 34-102-1z" fill="url(#steel)"/><rect x="187" y="64" width="126" height="56" rx="16" fill="#e4e7df"/><path d="M201 72v34m16-37v37m17-37v37m17-37v37m17-37v37m17-37v37m15-34v32" stroke="#9baead" stroke-width="4"/><circle cx="251" cy="222" r="44" fill="#d5ece9" stroke="#16566e" stroke-width="3"/><path d="M251 193v59m-26-45 51 29m-51 0 51-29" stroke="#31788a" stroke-width="7"/>`,
  ],
  wristtape: [
    "Professional wrestling wrist tape",
    `<ellipse cx="261" cy="219" rx="115" ry="88" fill="#acaead"/><path d="M146 159v57c0 54 231 58 230-2v-60" fill="#dcded8"/><ellipse cx="261" cy="156" rx="115" ry="76" fill="#f6f2de"/><ellipse cx="261" cy="155" rx="62" ry="39" fill="url(#wood)"/><ellipse cx="261" cy="155" rx="48" ry="30" fill="#111a27"/><path d="M153 184c43 39 173 41 216-1m-216 19c43 39 173 41 216-1m-210 22c39 30 161 36 203 0" stroke="#afb6b2" stroke-width="3" fill="none"/><path d="M369 153c46 29 40 89 57 118l-77 33c-7-32-7-49-17-64z" fill="#e6e9de"/><path d="M354 263l66-16m-69 30 69-17" stroke="#babfb7" stroke-width="3"/>`,
  ],
  turnbuckle: [
    "Laced wrestling turnbuckle pad",
    `<path d="M72 135l131 42M63 253l143-31M436 180H317" stroke="#22141d" stroke-width="18"/><path d="M72 131l131 42M63 249l143-31M436 176H317" stroke="url(#red)" stroke-width="12"/><path d="M196 83q55-22 110 1l20 193q-56 33-118 3z" fill="url(#red)"/><path d="M211 96q39-14 78 0l15 165q-36 18-80 4z" fill="none" stroke="#f89194" stroke-width="3" stroke-dasharray="5 7"/><path d="M232 129l42 75-40 21 39-6" fill="none" stroke="#f1d0b4" stroke-width="8"/><path d="M310 109l19 9-15 17 18 10-15 17 19 10-15 17 17 12-14 13" fill="none" stroke="#d5bb9e" stroke-width="4"/>`,
  ],
  ladder: [
    "Steel wrestling ladder",
    `<g transform="rotate(-8 258 190)"><path d="M132 326l86-283h67l83 283" fill="none" stroke="#080f19" stroke-width="21"/><path d="M132 326l86-283h67l83 283" fill="none" stroke="url(#steel)" stroke-width="14"/><path d="M210 71l-8 257m67-257 23 257" stroke="url(#steel)" stroke-width="20"/><path d="M210 78h59m-61 42h66m-67 43h73m-75 44h79m-81 44h85m-86 43h89" stroke="#192331" stroke-width="14"/><path d="M210 75h59m-61 42h66m-67 43h73m-75 44h79m-81 44h85m-86 43h89" stroke="url(#steel)" stroke-width="9"/><path d="M147 281l213-1" stroke="url(#steel)" stroke-width="9"/><path d="M127 327h17m52 1h17m74 1h17m60-1h17" stroke="#0b1017" stroke-width="15"/></g>`,
  ],
  table: [
    "Breakaway wrestling table",
    `<path d="M129 178l7 117 28 18M350 158l14 125 32 9M205 172l8 113m-1-85 148 57" fill="none" stroke="#101720" stroke-width="15"/><path d="M129 178l7 117 28 18M350 158l14 125 32 9M205 172l8 113m-1-85 148 57" fill="none" stroke="url(#steel)" stroke-width="9"/><path d="M81 139l216-60 139 86-228 77-127-79z" fill="url(#wood)"/><path d="M83 140l125 83 226-62v19l-227 66-126-82z" fill="#3d281c"/><path d="M105 139l196-47m-171 62 197-44m-166 65 191-47m-160 68 189-48" stroke="#734928" stroke-width="3" opacity=".6"/><path d="M236 102l-12 55 19 30-22 40" fill="none" stroke="#59371f" stroke-width="3"/>`,
  ],
  ringrope: [
    "Red wrestling ring ropes",
    `<path d="M401 63v261" stroke="#151e2a" stroke-width="31"/><path d="M399 65v257" stroke="url(#steel)" stroke-width="18"/><path d="M81 92l314 32M69 177l326 27M53 266l342 20" stroke="#090e17" stroke-width="20"/><path d="M81 88l314 32M69 173l326 27M53 262l342 20" stroke="url(#red)" stroke-width="14"/><path d="M80 83l312 31M69 168l324 26M53 257l340 19" stroke="#f98287" stroke-width="3"/><path d="M358 94l46 9v36l-46-9zM358 176l46 8v35l-46-8zM358 258l46 6v36l-46-7z" fill="url(#leather)"/>`,
  ],
  stool: [
    "Padded folding corner stool",
    `<path d="M169 160l142 162M324 166L186 324M189 168l158 151M349 165L210 322" stroke="#141a27" stroke-width="16"/><path d="M169 160l142 162M324 166L186 324M189 168l158 151M349 165L210 322" stroke="url(#steel)" stroke-width="10"/><path d="M154 113l140-33 73 45v50l-139 37-74-48z" fill="url(#leather)"/><path d="M154 114l73 42 141-30v-16l-76-37-138 28z" fill="url(#red)"/><path d="M163 116l65 33 124-26" fill="none" stroke="#ee8890" stroke-width="3"/>${screw(260, 251, 9)}<path d="M176 325h19m108 0h19m18-3h17m-155 4h18" stroke="#0e1420" stroke-width="13"/>`,
  ],
  "replica-belt": [
    "Replica championship entrance belt",
    `<path d="M53 138q64-15 147-5 57-40 111 0 73-10 148 5v105q-78 18-148 6-56 42-111 0-77 11-147-6z" fill="url(#leather)"/><path d="M65 150q63-10 135-5 60-33 111 0 71-5 136 5v82q-68 12-136 3-57 34-111 0-74 8-135-3z" fill="none" stroke="#8d683a" stroke-width="3" stroke-dasharray="4 6"/><path d="M198 125q57-35 116 0l11 119q-67 52-138 0z" fill="url(#gold)"/><path d="M211 140q45-27 90 0l9 94q-54 36-108 0z" fill="#201c24" stroke="#e9c76c"/><path d="M216 160l17 13 23-28 22 28 20-13-11 54h-62z" fill="url(#gold)"/><rect x="106" y="151" width="51" height="77" rx="12" fill="url(#gold)"/><rect x="358" y="151" width="51" height="77" rx="12" fill="url(#gold)"/><path d="M131 168v42m-11-22h22M383 168v42m-11-22h22" stroke="#725129" stroke-width="5"/>${screw(75, 173, 4)}${screw(75, 209, 4)}${screw(432, 173, 4)}${screw(432, 209, 4)}`,
  ],
};
await mkdir(`${dir}/equipment`, { recursive: true });
for (const [id, [title, art]] of Object.entries(gear))
  await writeFile(`${dir}/equipment/${id}.svg`, wrap(title, art));

const palettes = [
  {
    id: "rookie-champion",
    top: "ROOKIE",
    bottom: "CHAMPION",
    metal: ["#ffe4b1", "#dca065", "#8b4a2f", "#e7b57a"],
    ink: "#3a1723",
    gem: "#e36c45",
    rank: "I",
  },
  {
    id: "contender-champion",
    top: "CONTENDER",
    bottom: "CHAMPION",
    metal: ["#f9fdff", "#c2d4e6", "#647a98", "#dceafb"],
    ink: "#112c4a",
    gem: "#3d9bdd",
    rank: "II",
  },
  {
    id: "world-champion",
    top: "WORLD",
    bottom: "CHAMPION",
    metal: ["#fff7b9", "#f1c657", "#996222", "#ffe594"],
    ink: "#251327",
    gem: "#d9517b",
    rank: "III",
  },
];
const stars = (cx, cy, r, fill) => {
  let pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      d = i % 2 ? r * 0.44 : r;
    pts.push(`${cx + Math.cos(a) * d},${cy + Math.sin(a) * d}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/>`;
};
const leafSprig = (flip = 1) =>
  `<g transform="translate(700 308) scale(${flip} 1)"><path d="M-60 83q-128-22-136-117" fill="none" stroke="url(#metal)" stroke-width="7"/>${Array.from(
    { length: 7 },
    (_, i) => {
      const y = 52 - i * 17,
        x = -112 - i * 12;
      return `<ellipse cx="${x}" cy="${y}" rx="23" ry="8" transform="rotate(${26 + i * 4} ${x} ${y})" fill="url(#metal)" stroke="${"#725132"}" stroke-width="1"/><ellipse cx="${x - 5}" cy="${y - 19}" rx="9" ry="20" transform="rotate(-25 ${x - 5} ${y - 19})" fill="url(#metal)"/>`;
    },
  ).join("")}</g>`;
await mkdir(`${dir}/belts`, { recursive: true });
for (const p of palettes) {
  const art = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="640" viewBox="0 0 1400 640" role="img"><title>SLAY ${p.top} CHAMPIONSHIP BELT</title>
 <defs><linearGradient id="metal" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${p.metal[0]}"/><stop offset=".27" stop-color="${p.metal[1]}"/><stop offset=".5" stop-color="${p.metal[2]}"/><stop offset=".7" stop-color="${p.metal[3]}"/><stop offset="1" stop-color="${p.metal[2]}"/></linearGradient><linearGradient id="strap" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#31333d"/><stop offset=".34" stop-color="#080b13"/><stop offset=".6" stop-color="#171820"/><stop offset="1" stop-color="#04050b"/></linearGradient><linearGradient id="enamel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.ink}"/><stop offset=".5" stop-color="#080d19"/><stop offset="1" stop-color="${p.ink}"/></linearGradient><radialGradient id="gem"><stop stop-color="#fff"/><stop offset=".25" stop-color="${p.gem}"/><stop offset="1" stop-color="#341523"/></radialGradient><filter id="shadow" x="-20%" y="-50%" width="140%" height="200%"><feDropShadow dx="0" dy="19" stdDeviation="16" flood-color="#000" flood-opacity=".65"/></filter><pattern id="grain" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M1 2l3-1m3 4l3 1M2 9l4-1" stroke="#fff" stroke-opacity=".07" stroke-width="1"/></pattern><pattern id="etch" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 8L8 0l8 8-8 8z" fill="none" stroke="${p.metal[0]}" stroke-opacity=".25" stroke-width="1"/></pattern></defs>
 <g filter="url(#shadow)"><path d="M65 197q165-39 328-5l126-69q167-74 349 0l132 69q175-28 335 5l17 244q-170 39-352 10l-136 71q-164 64-342 0l-129-71q-179 34-330-10z" fill="url(#strap)" stroke="#06080d" stroke-width="7"/>
 <path d="M65 197q165-39 328-5l126-69q167-74 349 0l132 69q175-28 335 5l17 244q-170 39-352 10l-136 71q-164 64-342 0l-129-71q-179 34-330-10z" fill="url(#grain)"/>
 <path d="M83 212q168-33 314-3l129-70q163-70 335 0l135 70q166-26 322 2l15 216q-166 33-336 6l-140 72q-155 60-328 0l-133-72q-177 29-316-4z" fill="none" stroke="${p.metal[1]}" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="5 7"/>
 ${[125, 167, 1227, 1269].flatMap((x) => [241, 283, 325, 367, 409].map((y) => `<circle cx="${x}" cy="${y}" r="8" fill="url(#metal)" stroke="#0c0e13" stroke-width="3"/><circle cx="${x}" cy="${y}" r="2" fill="#35313c"/>`)).join("")}
 ${[269, 1121]
   .map(
     (x, i) =>
       `<g transform="translate(${x} 316) rotate(${i ? 7 : -7})"><rect x="-65" y="-103" width="130" height="210" rx="35" fill="url(#metal)" stroke="#674c32" stroke-width="4"/><rect x="-53" y="-89" width="106" height="183" rx="27" fill="url(#enamel)" stroke="${p.metal[0]}" stroke-width="3"/><rect x="-43" y="-79" width="86" height="163" rx="22" fill="url(#etch)"/>${stars(0, -18, 37, "url(#metal)")}<path d="M-26 37h52m-21-6v24m-11-24v24" fill="none" stroke="url(#metal)" stroke-width="5"/>${[
         [-46, -69],
         [46, -69],
         [-46, 69],
         [46, 69],
       ]
         .map(
           ([a, b]) =>
             `<circle cx="${a}" cy="${b}" r="5" fill="url(#gem)" stroke="${p.metal[0]}" stroke-width="2"/>`,
         )
         .join("")}</g>`,
   )
   .join("")}
 ${[391, 999].map((x, i) => `<g transform="translate(${x} 317) rotate(${i ? 5 : -5})"><rect x="-32" y="-82" width="64" height="167" rx="19" fill="url(#metal)" stroke="#4b3a2b" stroke-width="3"/><rect x="-23" y="-71" width="46" height="145" rx="12" fill="url(#enamel)"/><path d="M0-48l16 24L0 0l-16-24zM0 6l16 24L0 54l-16-24z" fill="url(#metal)"/><circle cy="-60" r="4" fill="url(#gem)"/><circle cy="64" r="4" fill="url(#gem)"/></g>`).join("")}
 <path d="M477 175Q700 72 923 175l19 257Q700 572 458 432z" fill="url(#metal)" stroke="#5f4227" stroke-width="5"/>
 <path d="M491 188Q700 92 909 188l17 233Q700 552 474 421z" fill="none" stroke="${p.metal[0]}" stroke-width="5"/>
 <path d="M506 199Q700 109 894 199l17 212Q700 529 489 411z" fill="url(#enamel)" stroke="${p.metal[2]}" stroke-width="5"/>
 <path d="M518 207Q700 126 882 207l16 197Q700 513 503 404z" fill="url(#etch)" stroke="${p.metal[1]}" stroke-width="2"/>
 ${Array.from({ length: 17 }, (_, i) => {
   let x = 518 + i * 22.75,
     y = 192 - 52 * Math.sin((i / 16) * Math.PI);
   return `<circle cx="${x}" cy="${y}" r="4.4" fill="url(#gem)" stroke="${p.metal[0]}" stroke-width="1.8"/>`;
 }).join("")}
 ${Array.from({ length: 17 }, (_, i) => {
   let x = 501 + i * 24.8,
     y = 415 + 61 * Math.sin((i / 16) * Math.PI);
   return `<circle cx="${x}" cy="${y}" r="4.4" fill="url(#gem)" stroke="${p.metal[0]}" stroke-width="1.8"/>`;
 }).join("")}
 <path d="M567 198q133-51 266 0l-11 42q-122-36-244 0z" fill="url(#metal)" stroke="${p.metal[2]}" stroke-width="3"/>
 <text x="700" y="217" fill="${p.ink}" font-family="Arial,sans-serif" font-size="26" font-weight="900" text-anchor="middle" letter-spacing="5">${p.top}</text>
 ${leafSprig(1)}${leafSprig(-1)}
 <circle cx="700" cy="311" r="74" fill="url(#metal)" stroke="${p.metal[0]}" stroke-width="3"/>
 <circle cx="700" cy="311" r="65" fill="url(#enamel)" stroke="${p.metal[2]}" stroke-width="3"/>
 <path d="M656 276l20 12 24-32 24 32 20-12-11 34h-66z" fill="url(#metal)"/>
 <text x="700" y="346" fill="${p.metal[0]}" font-family="Arial Black,Arial,sans-serif" font-size="43" font-weight="900" font-style="italic" text-anchor="middle" letter-spacing="-3">SLAY</text>
 <path d="M567 390q133 53 266 0l-12 46q-121 53-242 0z" fill="url(#metal)" stroke="${p.metal[2]}" stroke-width="3"/>
 <text x="700" y="428" fill="${p.ink}" font-family="Arial,sans-serif" font-size="23" font-weight="900" text-anchor="middle" letter-spacing="3">${p.bottom}</text>
 ${stars(530, 294, 17, "url(#metal)")}${stars(870, 294, 17, "url(#metal)")}
 <path d="M675 463h50" stroke="${p.metal[0]}" stroke-width="2"/><text x="700" y="486" fill="${p.metal[0]}" font-family="Georgia,serif" font-size="21" text-anchor="middle">${p.rank}</text>
 <path d="M504 182q92-47 176-54" stroke="#fff" stroke-opacity=".5" stroke-width="4" fill="none"/>
 </g></svg>`;
  await writeFile(`${dir}/belts/${p.id}.svg`, art);
}
console.log(
  `Created ${Object.keys(gear).length} wrestling props and ${palettes.length} championship belts.`,
);
