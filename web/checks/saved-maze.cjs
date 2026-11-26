/* saved-maze.cjs // checks that a saved maze reopens exactly, and that a bad record is refused.

   Usage, from web/:  node checks/saved-maze.cjs app/maze-engine.js [seeds]

   For every algorithm on every grid it offers, at five frame shapes, three densities and
   `seeds` seeds (default 3): build the maze, sometimes give it new colors, write its record,
   pass the record through JSON, read it back, and require the reopened maze to equal the
   original: the engine's hash (seed, grid, links, colors, steps), the visit order, and every
   drawing call at two sizes with ends, solution and label shown. Then it damages records in
   thirteen ways and requires each to be refused for its own reason. Exits non-zero on any
   failure. */
'use strict';

var path = require('path');
var M = require(path.resolve(process.argv[2] || 'app/maze-engine.js'));
var SEEDS = process.argv[3] === undefined ? 3 : Number(process.argv[3]);
if (!Number.isInteger(SEEDS) || SEEDS < 1) {
  console.error('usage: node checks/saved-maze.cjs app/maze-engine.js [seeds]  (seeds: a whole number, 1 or more; got ' + JSON.stringify(process.argv[3]) + ')');
  process.exit(2);
}
var ASPECTS = [0.6, 1, 4 / 3, 16 / 9, 2.4];
var DENSITIES = [0.5, 1, 2.5];

/* A 2D context that records every call and every property set, in order. */
function recorder() {
  var log = [];
  var target = {};
  var proxy = new Proxy(target, {
    get: function (t, key) {
      if (key in t) return t[key];
      return function () { log.push(String(key) + '(' + Array.prototype.map.call(arguments, String).join(',') + ')'); };
    },
    set: function (t, key, value) { log.push(String(key) + '=' + String(value)); return true; }
  });
  return { ctx: proxy, log: log };
}
function drawing(work, width, height) {
  var r = recorder();
  work.render(r.ctx, width, height, { ends: true, solution: true, label: true });
  return r.log.join('\n');
}
function json(x) { return JSON.parse(JSON.stringify(x)); }

var failures = 0;
var mazes = 0;
function fail(msg) { failures++; if (failures <= 20) console.log('FAIL ' + msg); }

M.ALGORITHMS.forEach(function (alg) {
  M.TOPOLOGIES.forEach(function (top) {
    if (!M.supports(alg.id, top.id)) return;
    var count = 0;
    ASPECTS.forEach(function (aspect) {
      DENSITIES.forEach(function (density) {
        for (var seed = 1; seed <= SEEDS; seed++) {
          var e = M.create({ seed: seed * 7919 + Math.round(aspect * 100) });
          e.settings.algorithm = alg.id; e.settings.topology = top.id; e.settings.density = density;
          e.newMaze(aspect);
          e.finish();
          if (seed % 2 === 0) e.recolor();
          var w = e.work;
          var name = alg.id + ' x ' + top.id + ' aspect ' + aspect.toFixed(3) + ' density ' + density + ' seed ' + seed;
          var record = json(M.toRecord(w, { frame: 'square', ends: true, solution: seed % 3 === 0, label: false },
            { build: 'test', savedAt: '2026-11-25T00:00:00.000Z' }));
          var back;
          try { back = M.readRecord(record); } catch (err) { fail(name + ': refused: ' + err.message); return; }
          var e2 = M.create({ seed: 1 });
          e2.adopt(back.work);
          if (e2.hash() !== e.hash()) fail(name + ': hash ' + e2.hash() + ' != ' + e.hash());
          var a = w.graph(), b = back.work.graph();
          if (JSON.stringify(a.visitOrder) !== JSON.stringify(b.visitOrder)) fail(name + ': visit order differs');
          if (back.work.solutionLength !== w.solutionLength) fail(name + ': solution length differs');
          if (drawing(back.work, 1200, 800) !== drawing(w, 1200, 800)) fail(name + ': drawing at 1200x800 differs');
          if (drawing(back.work, 2160, 2160) !== drawing(w, 2160, 2160)) fail(name + ': drawing at 2160x2160 differs');
          var ap = back.appearance;
          if (ap.frame !== 'square' || ap.ends !== true || ap.solution !== (seed % 3 === 0) || ap.label !== false) fail(name + ': appearance differs');
          mazes++; count++;
        }
      });
    });
    console.log(alg.id + ' x ' + top.id + ': ' + count + ' saved and reopened');
  });
});

/* ---- refusals: each damaged record must be refused for its own reason ------------------ */
var base = M.create({ seed: 4242 });
base.settings.algorithm = 'kruskal'; base.settings.topology = 'hex'; base.settings.density = 1;
base.newMaze(1.2); base.finish();
var good = json(M.toRecord(base.work, { frame: 'free', ends: false, solution: false, label: true }, { build: 'test', savedAt: 'x' }));
/* Seal a hand-edited record again with the engine's check rule (canonical JSON, two FNV-1a
   hashes), so the edit itself, not the check, is what readRecord meets. */
function reseal(r) {
  function canonical(v) {
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canonical(v[k]); }).join(',') + '}';
    return JSON.stringify(v);
  }
  var s = canonical(r.maze), h1 = 2166136261, h2 = 0x811C9DC5 ^ 0x5BD1E995;
  for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 ^ c, 16777619) >>> 0; }
  r.check = ('0000000' + h1.toString(16)).slice(-8) + ('0000000' + h2.toString(16)).slice(-8);
  return r;
}
var cases = [
  ['not a record', function (r) { r.format = 'something else'; }, false, 'not a saved maze'],
  ['newer version', function (r) { r.version = 2; }, false, 'newer version'],
  ['damaged bytes', function (r) { r.maze.graph.links[3] = r.maze.graph.links[4]; }, false, 'damaged'],
  ['a link removed', function (r) { r.maze.graph.links.pop(); }, true, 'perfect maze'],
  ['a link between distant cells', function (r) { r.maze.graph.links[0] = '0,0|5,5'; }, true, 'neighboring cells'],
  ['a link twice', function (r) { r.maze.graph.links[1] = r.maze.graph.links[0]; }, true, 'neighboring cells once'],
  ['a cell reached twice', function (r) { r.maze.graph.visitOrder[1] = r.maze.graph.visitOrder[0]; }, true, 'each cell once'],
  ['the wrong cell count', function (r) { r.maze.graph.visitOrder.pop(); }, true, 'cells; this grid has'],
  ['an unknown algorithm', function (r) { r.maze.recipe.algorithm = 'growingTree'; }, true, 'does not have'],
  ['a different grid size', function (r) { r.maze.geometry.cols += 1; }, true, 'differently'],
  ['missing colors', function (r) { r.maze.appearance.colors.c2 = [1, 2]; }, true, 'no colors'],
  ['an unknown density', function (r) { r.maze.recipe.density = 1.1; }, true, 'unknown density'],
  ['no graph', function (r) { delete r.maze.graph; }, true, 'no graph']
];
var refused = 0;
cases.forEach(function (c) {
  var r = json(good);
  c[1](r);
  if (c[2]) reseal(r);
  try { M.readRecord(r); fail('refusal "' + c[0] + '": accepted'); }
  catch (err) {
    if (err.message.indexOf(c[3]) < 0) fail('refusal "' + c[0] + '": refused for another reason: ' + err.message);
    else refused++;
  }
});
/* An incomplete maze cannot be saved. */
var building = M.create({ seed: 5 }); building.newMaze(1);
try { M.toRecord(building.work, {}); fail('an incomplete maze was saved'); }
catch (err) { if (err.message.indexOf('complete') < 0) fail('incomplete maze refused for another reason: ' + err.message); else refused++; }
/* The graph, not the seed, is the saved maze: a changed seed (resealed) still reopens the same links. */
var seedless = reseal((function () { var r = json(good); r.maze.recipe.seed = 1; return r; })());
var reopened = M.readRecord(seedless).work;
if (reopened.sortedLinks().join() !== base.work.sortedLinks().join()) fail('a changed seed changed the reopened links');
/* The unchanged record is accepted. */
try { M.readRecord(json(good)); } catch (err) { fail('the good record was refused: ' + err.message); }
/* Control: the comparison sees a real difference. Two cells' visit order swapped is still a
   valid record, but it colors the fields differently, so its drawing must differ. */
var swapped = json(good);
var vo = swapped.maze.graph.visitOrder;
var t0 = vo[0]; vo[0] = vo[vo.length - 1]; vo[vo.length - 1] = t0;
var swappedWork = M.readRecord(reseal(swapped)).work;
if (drawing(swappedWork, 1200, 800) === drawing(base.work, 1200, 800)) fail('control: a changed visit order drew the same');
else console.log('control: a changed visit order is seen by the drawing comparison');

console.log(mazes + ' mazes saved and reopened exactly; ' + refused + ' of ' + (cases.length + 1) + ' bad records refused for their own reason');
if (failures) { console.log(failures + ' failures'); process.exit(1); }
