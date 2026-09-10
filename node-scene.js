// ============================================================
// 3D NODE MAP
// A slowly turning map that fills the whole third slide. Drag
// to rotate; it also turns gently on its own.
//
// HOW IT'S PUT TOGETHER (this matters if you edit it):
// Every link node is an ENDPOINT. A branch grows out of the
// centre, passes through two small waypoint dots, and stops at
// the link node — nothing ever continues past one. The loose
// atmospheric specks attach to the centre or to a waypoint,
// never to a link node.
//
// THE ONLY PARTS MEANT TO BE HAND-EDITED ARE THE TWO LISTS
// BELOW, plus the tuning block a little further down.
// ============================================================

// Each one needs a label, a one-line sub-line (shown on hover), a
// link, and a position as [x, y, z]. These sit on the outside of
// the map — roughly 3 to 3.7 away from the centre in total keeps
// them at the edge where an endpoint belongs. The branch that
// reaches each one is drawn automatically.
const REAL_NODES = [
  { label: "Scent descriptions", sub: "notes on things I've smelled and tried to describe", href: "categories/scent-descriptions.html", pos: [-2.9, 1.5, 0.7] },
  { label: "Theories", sub: "half-formed ideas I keep coming back to", href: "categories/theories.html", pos: [2.0, 2.3, -1.1] },
  { label: "Favorites", sub: "things I like, no other reason needed", href: "categories/favorites.html", pos: [3.2, -1.3, 0.9] },
  { label: "Other", sub: "whatever doesn't fit anywhere else", href: "categories/other-1.html", pos: [-2.2, -2.4, -0.6] },
  { label: "Other", sub: "the other other pile", href: "categories/other-2.html", pos: [0.4, -2.9, 1.4] },
  { label: "Test node", sub: "a working sandbox node — safe to repurpose", href: "works/test-node-a.html", pos: [-3.2, -1.1, -1.4] },
  { label: "Test node", sub: "a second sandbox node", href: "works/test-node-b.html", pos: [3.3, 1.6, -1.3] },
];

// Loose specks — atmosphere, not links. Each one is really a tight
// cluster of particles that sprays apart when you point at it.
// They connect themselves to whichever centre or waypoint is
// nearest, so they stay inside the map: keep them within about 2.7
// of the centre. Add, remove, or move them freely.
const DECORATIVE_POINTS = [
  [-1.4, 0.9, 0.5], [0.9, 1.5, -0.6], [1.7, 0.4, 1.0], [-0.8, -1.3, -0.7],
  [0.3, -1.7, 0.6], [-1.9, -0.5, -1.1], [2.1, 1.1, -0.3], [-0.5, 1.9, 1.0],
  [1.2, -1.0, -1.4], [-2.1, 1.4, -0.5], [0.6, 0.6, 1.7], [-1.0, -2.0, 0.9],
  [2.2, -1.6, 0.3], [-1.3, 0.2, 1.8],
];

(function () {
  const wrap = document.getElementById("node-scene");
  const canvas = document.getElementById("node-canvas");
  const labelLayer = document.getElementById("node-labels");

  // Safety net: if the 3D library didn't load for any reason (a
  // blocked CDN request, an old browser without WebGL), show a
  // plain list of links instead of a blank, broken-looking box.
  if (typeof THREE === "undefined") {
    const list = document.createElement("div");
    list.className = "node-fallback-list";
    REAL_NODES.forEach((n) => {
      const a = document.createElement("a");
      a.href = n.href;
      a.innerHTML = "<strong>" + n.label + "</strong><span>" + n.sub + "</span>";
      list.appendChild(a);
    });
    wrap.replaceWith(list);
    return;
  }

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING — most of what you'd want to nudge lives here
  // ============================================================
  const IDLE_SPEED = REDUCE_MOTION ? 0 : 0.00045; // slow drift on its own
  const DRAG_SENSITIVITY = 0.0028;
  const MAX_SPIN = 0.045;
  const MAX_TILT = 0.38;        // how far it can be tipped up or down
  const FRAME_V = 4.35;         // how much room the map is given — larger draws it smaller
  const FRAME_H = 4.9;
  const MAX_LOOSE_REACH = 1.7;  // past this, a loose speck floats unconnected
  const PARTICLES_PER_SPECK = 9;
  const SPECK_SIZE = 0.072;
  const REF_PX_PER_UNIT = 94;   // what one scene unit measures on a normal desktop
  const BRANCH_RADIUS = 0.0075; // the resting thickness of a branch
  const BRANCH_RADIUS_EMPH = 0.017; // and its thickness when its node is hovered

  // Monochrome throughout: the map carries hierarchy by weight and
  // darkness, not by hue.
  const COL_INK = new THREE.Color(0x22221a);
  const COL_BRANCH = new THREE.Color(0x807c73);
  const COL_HAIRLINE = new THREE.Color(0xb8b4aa);
  const COL_SPECK = new THREE.Color(0x999590);
  const COL_CENTRE = new THREE.Color(0x1c1c14);
  const COL_CENTRE_HALO = new THREE.Color(0x8d8a80);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Everything lives inside one group so the whole map can be
  // rotated as a single rigid object.
  const rig = new THREE.Group();
  scene.add(rig);

  const hub = new THREE.Vector3(0, 0, 0);
  const branches = [];  // one per link node
  const specks = [];    // the loose clusters
  const hairlines = []; // the thin connections to loose specks

  // ============================================================
  // THE CENTRE
  // A dark, solid core inside two soft shells, so it reads as the
  // source everything grows from rather than just another dot.
  // ============================================================
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.097, 32, 32),
    new THREE.MeshBasicMaterial({ color: COL_CENTRE.clone() })
  );
  rig.add(core);

  function shell(radius, opacity) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 24),
      new THREE.MeshBasicMaterial({ color: COL_CENTRE_HALO.clone(), transparent: true, opacity: opacity, depthWrite: false })
    );
    mesh.userData.baseOpacity = opacity;
    rig.add(mesh);
    return mesh;
  }
  const shellInner = shell(0.23, 0.24);
  const shellOuter = shell(0.5, 0.09);

  // ============================================================
  // BRANCHES — one per link node, each ending at that node
  // ============================================================
  // Every point a loose speck is allowed to connect to. Link nodes
  // are deliberately absent: that's what keeps them final.
  const anchors = [hub.clone()];

  const waypointGeometry = new THREE.SphereGeometry(0.032, 14, 14);

  REAL_NODES.forEach((n, i) => {
    const end = new THREE.Vector3(n.pos[0], n.pos[1], n.pos[2]);
    const length = end.length();

    // Two waypoints, pushed off the straight line so the branch
    // curves. The sideways direction comes from the node's own
    // position, so it's stable — move a node and its branch follows.
    const seed = i * 1.618;
    const axis = new THREE.Vector3(Math.sin(seed * 2.1), Math.cos(seed * 1.3), Math.sin(seed * 0.7 + 2.0));
    const perp = new THREE.Vector3().crossVectors(end, axis);
    if (perp.lengthSq() < 0.0001) perp.set(0, 1, 0);
    perp.normalize();

    const w1 = end.clone().multiplyScalar(0.32).addScaledVector(perp, length * 0.16);
    const w2 = end.clone().multiplyScalar(0.69).addScaledVector(perp, length * 0.095);
    const curve = new THREE.CatmullRomCurve3([hub, w1, w2, end]);

    // A branch is drawn as a tube, not a line: WebGL ignores line
    // thickness on nearly every browser, and thickening is how a
    // hovered branch is meant to stand out.
    function tube(radius, color, opacity) {
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 96, radius, 10, false),
        new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: opacity, depthWrite: false })
      );
      rig.add(mesh);
      return mesh;
    }
    const resting = tube(BRANCH_RADIUS, COL_BRANCH, 0.75);
    const emphasised = tube(BRANCH_RADIUS_EMPH, COL_INK, 0);

    const dots = [w1, w2].map((p, k) => {
      const mesh = new THREE.Mesh(
        waypointGeometry,
        new THREE.MeshBasicMaterial({ color: COL_BRANCH.clone(), transparent: true, opacity: 0.8, depthWrite: false })
      );
      mesh.position.copy(p);
      mesh.scale.setScalar(k === 0 ? 0.95 : 0.78);
      mesh.userData.baseScale = k === 0 ? 0.95 : 0.78;
      rig.add(mesh);
      return mesh;
    });

    anchors.push(w1.clone(), w2.clone());

    // The clickable node itself is plain HTML positioned over the
    // scene each frame — a real link, keyboard-focusable, selectable.
    const anchorObj = new THREE.Object3D();
    anchorObj.position.copy(end);
    rig.add(anchorObj);

    const a = document.createElement("a");
    a.href = n.href;
    a.className = "node3d-label";
    a.innerHTML =
      '<span class="node3d-dot"></span>' +
      '<span class="node3d-text">' + n.label + "</span>" +
      '<span class="node3d-sub">' + n.sub + "</span>";
    labelLayer.appendChild(a);

    n._el = a;
    n._anchor = anchorObj;
    n._index = i;
    branches.push({ curve: curve, resting: resting, emphasised: emphasised, dots: dots, weight: 0 });
  });

  // ============================================================
  // LOOSE SPECKS — clusters that spray apart when pointed at
  // ============================================================
  // Each speck is a handful of particles sitting on top of one
  // another, so at rest it looks like a single dot. Hovering pushes
  // them out along fixed directions and thins them out as they go.
  function speckSprite() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const gradient = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.95)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gradient;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  const sprite = speckSprite();

  const hitGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hitTargets = [];

  DECORATIVE_POINTS.forEach((pos) => {
    const p = new THREE.Vector3(pos[0], pos[1], pos[2]);

    let nearest = anchors[0];
    let nearestDistance = Infinity;
    anchors.forEach((candidate) => {
      const d = p.distanceToSquared(candidate);
      if (d < nearestDistance) { nearestDistance = d; nearest = candidate; }
    });

    // A speck with nothing near it simply floats, unconnected —
    // without this, moving one out to the edge would fling a long
    // line right across the middle of the map.
    let hairline = null;
    if (Math.sqrt(nearestDistance) < MAX_LOOSE_REACH) {
      const mid = nearest.clone().add(p).multiplyScalar(0.5);
      mid.add(new THREE.Vector3((p.z - nearest.z) * 0.12, (p.x - nearest.x) * -0.08, (nearest.y - p.y) * 0.1));
      const curve = new THREE.CatmullRomCurve3([nearest, mid, p]);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
      const material = new THREE.LineBasicMaterial({ color: COL_HAIRLINE.clone(), transparent: true, opacity: 0.34 });
      hairline = new THREE.Line(geometry, material);
      hairline.userData.baseOpacity = 0.34;
      rig.add(hairline);
      hairlines.push(hairline);
    }

    // Where each particle flies to, fixed once so a speck sprays the
    // same way every time rather than jittering differently each hover.
    const directions = [];
    const coords = new Float32Array(PARTICLES_PER_SPECK * 3);
    for (let k = 0; k < PARTICLES_PER_SPECK; k++) {
      const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      if (v.lengthSq() < 0.0001) v.set(1, 0, 0);
      v.normalize().multiplyScalar(0.14 + Math.random() * 0.34);
      directions.push(v);
      coords[k * 3] = p.x;
      coords[k * 3 + 1] = p.y;
      coords[k * 3 + 2] = p.z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(coords, 3));
    const material = new THREE.PointsMaterial({
      color: COL_SPECK.clone(),
      size: SPECK_SIZE,
      sizeAttenuation: true,
      map: sprite,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    rig.add(points);

    const speck = {
      origin: p,
      directions: directions,
      points: points,
      hairline: hairline,
      spray: 0,
      lastSpray: -1,
    };
    specks.push(speck);

    const hit = new THREE.Mesh(hitGeometry, hitMaterial);
    hit.position.copy(p);
    hit.userData.speck = speck;
    rig.add(hit);
    hitTargets.push(hit);
  });

  // ============================================================
  // POINTER — hover, drag, and clicks that survive a drag
  // ============================================================
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-10, -10);

  let rotY = 0, rotX = 0;
  let velY = IDLE_SPEED;
  let velX = 0;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let dragDistance = 0;

  wrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragDistance = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    wrap.classList.add("grabbing");
  });

  window.addEventListener("pointermove", (e) => {
    const rect = wrap.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    dragDistance += Math.abs(dx) + Math.abs(dy);
    velY = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, dx * DRAG_SENSITIVITY));
    velX = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, dy * DRAG_SENSITIVITY));
  });

  function endDrag() {
    dragging = false;
    wrap.classList.remove("grabbing");
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  wrap.addEventListener("pointerleave", () => pointer.set(-10, -10));

  // ============================================================
  // LINK HOVER — its branch thickens, everything else steps back
  // ============================================================
  let activeBranch = -1;

  REAL_NODES.forEach((n) => {
    function on() { activeBranch = n._index; }
    function off() { if (activeBranch === n._index) activeBranch = -1; }
    n._el.addEventListener("pointerenter", on);
    n._el.addEventListener("focus", on);
    n._el.addEventListener("pointerleave", off);
    n._el.addEventListener("blur", off);
    // Rotating the map by dragging across a label shouldn't count as
    // clicking it. detail is 0 for keyboard activation, which must
    // always go through.
    n._el.addEventListener("click", (e) => {
      if (e.detail !== 0 && dragDistance > 6) e.preventDefault();
    });
  });

  // ============================================================
  // SIZING — the scene is full-bleed, so it reframes on every resize
  // ============================================================
  // A narrow screen draws the whole map smaller, which would take the
  // branches below a pixel wide and lose them. The layout stays small;
  // only the pen gets heavier, the way a map redrawn at a smaller
  // scale keeps the same nib.
  let penWeight = 1;

  function repen(weight) {
    branches.forEach((branch) => {
      branch.resting.geometry.dispose();
      branch.emphasised.geometry.dispose();
      branch.resting.geometry = new THREE.TubeGeometry(branch.curve, 96, BRANCH_RADIUS * weight, 10, false);
      branch.emphasised.geometry = new THREE.TubeGeometry(branch.curve, 96, BRANCH_RADIUS_EMPH * weight, 10, false);
    });
  }

  function resize() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);

    const halfFov = Math.tan((camera.fov * Math.PI) / 360);
    const frameH = camera.aspect < 1 ? 4.6 : FRAME_H; // portrait needs the link nodes kept on screen
    const distanceForHeight = FRAME_V / halfFov;
    const distanceForWidth = frameH / (halfFov * camera.aspect);
    camera.position.z = Math.max(distanceForHeight, distanceForWidth);
    camera.lookAt(0, 0, 0);

    const pxPerUnit = (h / 2) / (camera.position.z * halfFov);
    const wanted = Math.min(2, Math.max(1, Math.pow(REF_PX_PER_UNIT / pxPerUnit, 0.75)));
    if (Math.abs(wanted - penWeight) > 0.02) {
      penWeight = wanted;
      repen(penWeight);
    }
  }
  window.addEventListener("resize", resize);
  resize();

  // ============================================================
  // FRAME LOOP
  // ============================================================
  const worldPos = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const scratch = new THREE.Vector3();
  let clock = 0;
  let arrival = 0; // 0 to 1: how much of the way in the map is

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.016;

    // --- how far through the slide-2-to-3 transition we are.
    // thread.js sets this; if that file isn't loaded, the map just
    // stays fully present.
    const target = window.__p23 === undefined ? 1 : window.__p23;
    arrival += (target - arrival) * 0.18;
    wrap.style.opacity = arrival.toFixed(3);
    const scale = 0.93 + 0.07 * arrival;

    // --- rotation: ease back to the slow idle drift after a drag,
    // and let the vertical tilt settle back to level
    if (!dragging) {
      velY += (IDLE_SPEED - velY) * 0.012;
      velX += (0 - velX) * 0.04;
      // Tilt returns to level over roughly ten seconds. Left tilted,
      // the idle turn would keep sweeping nodes across the centre.
      rotX += (0 - rotX) * 0.004;
    }
    rotY += velY;
    rotX = Math.max(-MAX_TILT, Math.min(MAX_TILT, rotX + velX));
    rig.rotation.y = rotY;
    rig.rotation.x = rotX;
    rig.scale.setScalar(scale);
    rig.updateMatrixWorld(true);

    // --- what the pointer is over (loose specks only; the link
    // nodes are HTML and handle their own hover)
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitTargets)[0];
    const hoveredSpeck = hit ? hit.object.userData.speck : null;

    // --- branch weights first, so everything below is reacting to
    // the same frame rather than to the last one
    let strongest = 0, runnerUp = 0;
    branches.forEach((branch, i) => {
      const goal = i === activeBranch ? 1 : 0;
      branch.weight += (goal - branch.weight) * 0.12;
      if (branch.weight > strongest) { runnerUp = strongest; strongest = branch.weight; }
      else if (branch.weight > runnerUp) { runnerUp = branch.weight; }
    });
    // How far anything not being hovered should step back. For a
    // branch, that's the strongest weight among the OTHERS.
    const stepBack = (branch) => (branch.weight >= strongest ? runnerUp : strongest);

    // --- spray: out fast, back slowly, so it reads as a burst
    // scattering rather than something breathing in and out
    specks.forEach((speck) => {
      const goal = speck === hoveredSpeck ? 1 : 0;
      const rate = goal > speck.spray ? 0.17 : 0.045;
      speck.spray += (goal - speck.spray) * rate;
      const s = speck.spray;

      if (Math.abs(s - speck.lastSpray) > 0.0015) {
        const coords = speck.points.geometry.attributes.position;
        for (let k = 0; k < speck.directions.length; k++) {
          scratch.copy(speck.origin).addScaledVector(speck.directions[k], s);
          coords.setXYZ(k, scratch.x, scratch.y, scratch.z);
        }
        coords.needsUpdate = true;
        speck.lastSpray = s;
      }
      // As the particles separate they thin out and shrink, so a
      // sprayed speck disperses instead of just moving apart.
      speck.points.material.size = SPECK_SIZE * penWeight * (1 - 0.4 * s);
      speck.points.material.opacity = 0.9 * (1 - s * 0.95) * (1 - 0.5 * strongest);
      if (speck.hairline) {
        speck.hairline.material.opacity =
          speck.hairline.userData.baseOpacity * (1 - 0.8 * s) * (1 - 0.55 * strongest);
      }
    });

    // --- branch emphasis: the hovered branch thickens and darkens,
    // the rest of the map recedes. No colour change anywhere.
    branches.forEach((branch) => {
      const w = branch.weight;
      const back = stepBack(branch);
      branch.emphasised.material.opacity = 0.88 * w;
      branch.resting.material.opacity = 0.75 * (1 - 0.45 * back);
      branch.resting.material.color.copy(COL_BRANCH).lerp(COL_INK, w);
      branch.dots.forEach((dot) => {
        dot.material.opacity = 0.8 * (1 - 0.5 * back);
        dot.material.color.copy(COL_BRANCH).lerp(COL_INK, w);
        dot.scale.setScalar(dot.userData.baseScale * penWeight * (1 + 0.45 * w));
      });
    });

    // --- the centre breathes, very slightly
    const breathe = REDUCE_MOTION ? 1 : 1 + Math.sin(clock * 0.55) * 0.035;
    shellInner.scale.setScalar(breathe);
    shellOuter.scale.setScalar(1 + (breathe - 1) * 1.8);

    // --- position the HTML link nodes over the scene
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    REAL_NODES.forEach((n, i) => {
      n._anchor.getWorldPosition(worldPos);
      projected.copy(worldPos).project(camera);
      const x = (projected.x * 0.5 + 0.5) * w;
      const y = (-projected.y * 0.5 + 0.5) * h;
      // The extra 12px cancels the label's own padding so the marker
      // lands exactly on the node, whichever side the text is on.
      const flip = x > w * 0.68;
      n._el.classList.toggle("flip", flip);
      n._el.style.transform =
        "translate(" + x + "px," + y + "px)" +
        (flip ? " translate(-100%, -50%) translateX(12px)" : " translate(-12px, -50%)");
      const depth = (projected.z + 1) / 2;
      const back = stepBack(branches[i]);
      n._el.style.opacity = String(Math.max(0.5, 1 - depth * 0.45) * (1 - 0.55 * back));
      n._el.style.zIndex = String(Math.round((1 - depth) * 100));
    });

    if (arrival > 0.004) renderer.render(scene, camera);
  }

  animate();
})();
