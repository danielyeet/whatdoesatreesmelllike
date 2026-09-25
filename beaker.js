// ============================================================
// THE BEAKER — Les Abstraits' drip falls into it, on the house's own
// page (abstraits.js) and in its motif on the Houses view (motifs.js).
// One drawing, shared by the two, so they are the same beaker.
//
// The owner, 2026-09-25: "I want the puddle to be more realistic, not
// just a circle of water. I want it to fall into a beaker, once the
// beaker starts overflowing, let it drip from that too" — and then, a
// round later: "fix it so the beaker looks more put together. I want it
// to look more like a diargram than a sketch", and "less filling".
//
// So it is drawn AS A DIAGRAM IS DRAWN: flat, from the side, in one
// weight of line snapped to the pixel — a laboratory beaker with its lip
// flared either side and a pouring spout on one, graduations up the
// inside wall (a long tick every 50 ml, numbered, a short one between),
// ml at the top, and the bench it stands on ruled with the hatching a drawing puts under a
// fixed surface. The liquid is a flat tint with its surface ruled and a
// meniscus turning up at each wall. A drop landing throws up a small
// crown. Full, it OVERFLOWS: a run down the outside from the spout, and a
// bead gathering at the spout's tip and dropping to the bench, where THE
// SPILL lies — a flat lens on the bench line, longer with every drop to
// its most.
//
// window.Beaker.make({ width, fill, spillMost, glass, wet }) gives a
// beaker. It keeps its own time (in milliseconds, whatever clock the
// caller hands it). The caller says where the liquid's surface is
// (`surface(floor)`), tells it when a drop has reached it (`land(now)`),
// and draws it (`draw(c, x, floor, now, a, quiet)`), with (x, floor) the
// middle of its base in whatever coordinates the caller draws in.
// ============================================================
(function () {
  const snap = (v) => Math.round(v) + 0.5;
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  function make(o) {
    const w = o.width, h = Math.round(w * 1.25);
    const fill = o.fill || 16;
    const spillMost = o.spillMost || 50;
    const GLASS = o.glass || "70, 66, 84";
    const WET = o.wet || "104, 92, 132";
    const CAPACITY = 250;                    // what the graduations count to, in ml
    const inner = h - 8;                     // the height the liquid can rise
    let landed = 0, level = 0, spill = 0, spilled = 0, last = 0;
    const crowns = [], spouts = [], rings = [];

    const beaker = {
      get drops() { return landed; },
      get spilled() { return spilled; },
      get level() { return level; },
      height: h,
      width: w,
      /** Where the liquid's surface is, given the floor. */
      surface(floor) { return floor - 3 - inner * level; },
      /** A drop has reached the surface; true if it came over the brim. */
      land(now) {
        landed++;
        crowns.push({ at: now });
        if (landed > fill) {
          spouts.push({ at: now + 180 + Math.random() * 160, hang: 380 + Math.random() * 160 });
          return true;
        }
        return false;
      },
      /** Drops over the spout that fell while nothing was drawn. */
      settle(now) {
        for (let i = spouts.length - 1; i >= 0; i--) {
          if (now - spouts[i].at > spouts[i].hang + 400) { spouts.splice(i, 1); spilled++; }
        }
      },
      draw(c, x, floor, now, a, quiet) {
        const dt = Math.min(0.1, Math.max(0, (now - (last || now)) / 1000));
        last = now;
        const q = quiet == null ? 1 : quiet;
        const glass = (k) => "rgba(" + GLASS + "," + Math.min(1, k * a * q).toFixed(3) + ")";
        const wet = (k) => "rgba(" + WET + "," + Math.min(1, k * a * q).toFixed(3) + ")";
        const want = Math.min(1, landed / fill);
        level += (want - level) * Math.min(1, dt * 3);
        const L = x - w / 2, R = x + w / 2, T = floor - h, B = floor;
        const spoutTip = [R + 6, T - 4];

        c.save();
        c.lineWidth = 1;
        c.lineCap = "butt";
        c.lineJoin = "miter";

        // THE BENCH: a ruled line, the hatching of a fixed surface under
        // it, and a tick at each end.
        const benchL = L - 16, benchR = Math.max(R + 28, spoutTip[0] + spillMost * 2 + 12);
        c.strokeStyle = glass(0.55);
        c.beginPath();
        c.moveTo(benchL, snap(B)); c.lineTo(benchR, snap(B));
        c.moveTo(snap(benchL), B - 3); c.lineTo(snap(benchL), B + 4);
        c.moveTo(snap(benchR), B - 3); c.lineTo(snap(benchR), B + 4);
        c.stroke();
        c.strokeStyle = glass(0.22);
        c.beginPath();
        for (let hx = benchL + 4; hx < benchR - 2; hx += 7) { c.moveTo(hx, B + 7); c.lineTo(hx + 5, B + 1.5); }
        c.stroke();

        // THE SPILL: a flat lens lying on the bench under the spout.
        const wantSpill = spillMost * (1 - Math.exp(-spilled / 6));
        spill += (wantSpill - spill) * Math.min(1, dt * 3);
        if (spill > 0.8) {
          const sx = spoutTip[0] + spill * 0.55, lift = Math.min(3.2, 1 + spill * 0.05);
          c.fillStyle = wet(0.2);
          c.strokeStyle = wet(0.55);
          c.beginPath();
          c.moveTo(sx - spill, B);
          c.bezierCurveTo(sx - spill * 0.6, B - lift, sx + spill * 0.6, B - lift, sx + spill, B);
          c.closePath();
          c.fill(); c.stroke();
          for (let i = rings.length - 1; i >= 0; i--) {
            const k = (now - rings[i].at) / 600;
            if (k >= 1) { rings.splice(i, 1); continue; }
            c.strokeStyle = wet(0.45 * (1 - k));
            const r = 2 + k * 9;
            c.beginPath();
            c.moveTo(spoutTip[0] - r, B - lift - 1); c.lineTo(spoutTip[0] - r * 0.4, B - lift - 1 - r * 0.5);
            c.moveTo(spoutTip[0] + r, B - lift - 1); c.lineTo(spoutTip[0] + r * 0.4, B - lift - 1 - r * 0.5);
            c.stroke();
          }
        }

        // THE LIQUID: a flat tint, its surface ruled, the meniscus
        // turning up at each wall.
        if (level > 0.003) {
          const sy = B - 3 - inner * level;
          c.fillStyle = wet(0.2);
          c.beginPath();
          c.moveTo(L + 1, sy - 2.5);
          c.quadraticCurveTo(L + 1, sy, L + 5, sy);
          c.lineTo(R - 5, sy);
          c.quadraticCurveTo(R - 1, sy, R - 1, sy - 2.5);
          c.lineTo(R - 1, B - 3);
          c.quadraticCurveTo(R - 1, B - 1, R - 3, B - 1);
          c.lineTo(L + 3, B - 1);
          c.quadraticCurveTo(L + 1, B - 1, L + 1, B - 3);
          c.closePath();
          c.fill();
          c.strokeStyle = wet(0.7);
          c.beginPath();
          c.moveTo(L + 1, sy - 2.5); c.quadraticCurveTo(L + 1, sy, L + 5, sy);
          c.lineTo(R - 5, sy); c.quadraticCurveTo(R - 1, sy, R - 1, sy - 2.5);
          c.stroke();
          // A drop landing throws up a small crown.
          for (let i = crowns.length - 1; i >= 0; i--) {
            const k = (now - crowns[i].at) / 450;
            if (k >= 1) { crowns.splice(i, 1); continue; }
            const up = Math.sin(k * Math.PI) * 6, spread = 2 + k * 6;
            c.strokeStyle = wet(0.6 * (1 - k));
            c.beginPath();
            c.moveTo(x - 1.5, sy); c.lineTo(x - spread, sy - up);
            c.moveTo(x, sy); c.lineTo(x, sy - up * 1.2);
            c.moveTo(x + 1.5, sy); c.lineTo(x + spread, sy - up);
            c.stroke();
          }
          // (A pointer at the surface and its reading in ml stood outside
          // the wall for a round; the owner asked for both gone.)
        }

        // THE GLASS: the walls, the base with its corners turned, the lip
        // flared either side, and the spout.
        c.strokeStyle = glass(0.78);
        c.beginPath();
        c.moveTo(snap(L) - 3, snap(T));
        c.lineTo(snap(L), snap(T));
        c.lineTo(snap(L), B - 4);
        c.quadraticCurveTo(snap(L), snap(B), L + 4, snap(B));
        c.lineTo(R - 4, snap(B));
        c.quadraticCurveTo(snap(R), snap(B), snap(R), B - 4);
        c.lineTo(snap(R), T + 3);
        c.quadraticCurveTo(snap(R), T - 1, spoutTip[0], spoutTip[1]);
        c.stroke();
        // The glass's own thickness, a hair inside each wall.
        c.strokeStyle = glass(0.2);
        c.beginPath();
        c.moveTo(snap(L + 2.5), T + 2); c.lineTo(snap(L + 2.5), B - 4);
        c.moveTo(snap(R - 2.5), T + 5); c.lineTo(snap(R - 2.5), B - 4);
        c.stroke();
        // Graduations up the inside of the left wall: a long tick every 50
        // ml, numbered, and a short one between; ml over them.
        c.strokeStyle = glass(0.6);
        c.fillStyle = glass(0.6);
        c.font = Math.max(6, Math.round(w * 0.1)) + "px 'IBM Plex Mono', monospace";
        c.textBaseline = "middle";
        c.beginPath();
        for (let v = 25; v < CAPACITY; v += 25) {
          const gy = snap(B - 3 - inner * (v / CAPACITY));
          const long = v % 50 === 0;
          c.moveTo(L + 3, gy); c.lineTo(L + (long ? 11 : 7), gy);
        }
        c.stroke();
        if (w > 36) {
          for (let v = 50; v < CAPACITY; v += 50) c.fillText(String(v), L + 13, B - 3 - inner * (v / CAPACITY));
          c.fillText("ml", L + 4, T + 7);
        }

        // OVERFLOWING: a run down the outside from the spout, and a bead
        // gathering at the spout's tip and dropping to the bench.
        const over = landed > fill;
        if (over) {
          c.strokeStyle = wet(0.6 * Math.min(1, (landed - fill) / 2));
          c.lineWidth = 1.3;
          c.beginPath();
          c.moveTo(spoutTip[0] - 1, spoutTip[1] + 1);
          c.quadraticCurveTo(R + 2, T + 4, R + 1.5, T + 12);
          c.lineTo(R + 1.5, B - 5);
          c.stroke();
          c.lineWidth = 1;
        }
        for (let i = spouts.length - 1; i >= 0; i--) {
          const d = spouts[i], t = now - d.at;
          if (t < 0) continue;
          if (t < d.hang) {
            const r = 0.8 + 1.8 * ease(t / d.hang);
            c.fillStyle = wet(0.7);
            c.beginPath(); c.arc(spoutTip[0], spoutTip[1] + 1 + r, r, 0, Math.PI * 2); c.fill();
            continue;
          }
          const f = t - d.hang, y = spoutTip[1] + 3 + 0.5 * 0.0018 * f * f;
          if (y >= B - 1) {
            spouts.splice(i, 1);
            spilled++;
            rings.push({ at: now });
            continue;
          }
          c.fillStyle = wet(0.75);
          c.beginPath();
          c.arc(spoutTip[0], y, 2, 0, Math.PI);
          c.lineTo(spoutTip[0], y - 5);
          c.closePath();
          c.fill();
        }
        c.restore();
      },
    };
    return beaker;
  }

  /** A falling drop, as the diagram draws one: a round foot and a
      point, drawn out by how fast it crosses the window. */
  function drop(c, x, y, a, run, way, wet) {
    // `way` is 1 while it crosses the window downwards and -1 while the
    // page carries it up faster than it falls: the point trails behind.
    const len = (5 + Math.min(12, run || 0)) * (way < 0 ? -1 : 1);
    c.fillStyle = "rgba(" + (wet || "104, 92, 132") + "," + Math.min(1, 0.72 * a).toFixed(3) + ")";
    c.beginPath();
    c.arc(x, y, 2.3, way < 0 ? Math.PI : 0, way < 0 ? Math.PI * 2 : Math.PI);
    c.lineTo(x, y - len);
    c.closePath();
    c.fill();
  }

  window.Beaker = { make, drop };
})();
