// Every algorithm x grid x frame shape x density, several seeds: is each finished maze one perfect maze?
// Usage, from web/: node checks/engine-sweep.cjs app/maze-engine.js [seedsPerCase, default 6] [--legacy]
// Exits 1 if any sweep maze, or under --legacy any maze from a repaired rule, is not perfect.
// The legacy rules' broken mazes are expected and only reported.
const E = require(require('path').resolve(process.argv[2]));
const SEEDS = Number(process.argv[3] || 6);
const ASPECTS = [16 / 9, 4 / 3, 1, 390 / 793];
const DENSITIES = [0.5, 1, 1.5];
let cases = 0, bad = 0, skipped = 0;
const rows = [];
for (const a of E.ALGORITHMS) for (const t of E.TOPOLOGIES) {
  if (!E.supports(a.id, t.id)) { skipped++; rows.push(`${a.id} x ${t.id}: not offered`); continue; }
  let worst = null, n = 0, sizes = new Set(); const t0 = Date.now();
  for (const aspect of ASPECTS) for (const d of DENSITIES) for (let s = 1; s <= SEEDS; s++) {
    const w = E.makeWork({ seed: s * 7919 + Math.round(aspect * 1000) + d * 13, colorSeed: 1, algorithm: a.id, topology: t.id,
      density: d, aspect, colors: E.pickColors(E.mulberry32(s)) });
    let guard = 0; while (w.step() && guard++ < 5e7) {}
    const v = w.verify(); n++; cases++;
    sizes.add(`${w.cols}x${w.rows}`);
    if (!v.perfect || !w.complete || w.topology !== t.id) { bad++; if (!worst) worst = { aspect, d, s, v, topo: w.topology, complete: w.complete }; }
  }
  const t1 = Date.now() - t0;
  rows.push(`${a.id} x ${t.id}: ${n} mazes in ${t1} ms, ${worst ? 'FAIL ' + JSON.stringify(worst) : 'all perfect'} (grids ${[...sizes].slice(0, 6).join(' ')}${sizes.size > 6 ? ' ...' : ''})`);
  console.log(rows[rows.length - 1]);
}
console.log(`${cases} mazes, ${bad} not perfect, ${skipped} combinations not offered`);

// The legacy rules, to show the repairs matter: each legacy rule and its repair on the same seeds.
let repairedBad = 0;
function legacyCandidatesCheck() {
  const out = [];
  for (const t of ['hex', 'radial']) {
    let legacyBad = 0, repairBad = 0;
    for (let s = 1; s <= 40; s++) {
      for (const legacy of [true, false]) {
        const w = E.makeWork({ seed: s, colorSeed: 1, algorithm: 'binaryTree', topology: t, density: 1, aspect: 16 / 9, colors: E.pickColors(E.mulberry32(1)), legacyBinaryTree: legacy });
        while (w.step()) {}
        if (!w.verify().perfect) { if (legacy) legacyBad++; else repairBad++; }
      }
    }
    repairedBad += repairBad;
    out.push(`binaryTree x ${t}, same 40 seeds: legacy rule ${legacyBad} not perfect, repaired rule ${repairBad} not perfect`);
  }
  for (const t of ['rect', 'radial']) {
    let legacyBad = 0, repairBad = 0;
    for (let s = 1; s <= 200; s++) {
      for (const legacy of [true, false]) {
        const w = E.makeWork({ seed: s, colorSeed: 1, algorithm: 'wilson', topology: t, density: 0.5, aspect: 1, colors: E.pickColors(E.mulberry32(1)), legacyWilson: legacy });
        while (w.step()) {}
        if (!w.verify().perfect) { if (legacy) legacyBad++; else repairBad++; }
      }
    }
    repairedBad += repairBad;
    out.push(`wilson x ${t}, same 200 seeds: legacy rule ${legacyBad} not perfect, repaired rule ${repairBad} not perfect`);
  }
  return out;
}
if (process.argv.includes('--legacy')) {
  console.log(legacyCandidatesCheck().join('\n'));
  if (repairedBad) console.log(`FAIL: repaired rules, ${repairedBad} not perfect`);
}
process.exit(bad || repairedBad ? 1 : 0);
