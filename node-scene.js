// ============================================================
// 3D NODE MAP
// A slowly turning map that fills the whole third slide. Drag
// to rotate; it also turns gently on its own.
//
// HOW IT'S PUT TOGETHER (this matters if you edit it):
// Every link node is an ENDPOINT. A branch grows out of the
// centre, passes through two small waypoint dots, and stops at
// the link node — nothing ever continues past one. The loose
// atmospheric dots attach to the centre or to a waypoint, never
// to a link node.
//
// THE ONLY PARTS MEANT TO BE HAND-EDITED ARE THE TWO LISTS
// BELOW. Everything after them is machinery.
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

// Loose dots — atmosphere, not links. They dissolve when you point
// at them. Each one automatically connects to whichever centre or
// waypoint is nearest, so they stay inside the map: keep them
// within about 2.7 of the centre and they'll never reach out past
// a link node. Add, remove, or move them freely.
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

  // --- Tuning. Most of what you'd want to nudge lives here.
  const IDLE_SPEED = REDUCE_MOTION ? 0 : 0.00045; // slow drift, roughly a full turn every 4 minutes
  const DRAG_SENSITIVITY = 0.0028;
  const MAX_SPIN = 0.045;
  const MAX_TILT = 0.38;  // how far it can be tipped up or down
  const FRAME_V = 3.72;   // how much vertical room the map is given
  const FRAME_H = 4.2;    // and horizontal — smaller numbers fill more of the screen
  const MAX_LOOSE_REACH = 1.7; // past this, a loose dot floats unconnected

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Everything lives inside one group so the whole map can be
  // rotated as a single rigid object.
  const rig = new THREE.Group();
  scene.add(rig);

  const COL_LINE = new THREE.Color(0xdcd8ce);    // loose connections
  const COL_BRANCH = new THREE.Color(0xbfbbae);  // branches that lead to a link
  const COL_DOT = new THREE.Color(0xb5b1a4);
  const COL_ACCENT = new THREE.Color(0x9c6f35);

  const hub = new THREE.Vector3(0, 0, 0);

  // Collected so a single pass at the end of each frame can recolour
  // the entire map at once — that's what a link-node hover does.
  const allLines = [];
  const allDots = [];

  // ============================================================
  // THE CENTRE
  // A solid core with two soft shells around it, so it reads as the
  // source everything grows from rather than just another dot.
  // ============================================================
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 28, 28),
    new THREE.MeshBasicMaterial({ color: COL_ACCENT.clone() })
  );
  rig.add(core);

  function shell(radius, opacity) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 24),
      new THREE.MeshBasicMaterial({ color: COL_ACCENT.clone(), transparent: true, opacity: opacity, depthWrite: false })
    );
    mesh.userData.baseOpacity = opacity;
    rig.add(mesh);
    return mesh;
  }
  const shellInner = shell(0.26, 0.16);
  const shellOuter = shell(0.52, 0.055);

  // ============================================================
  // GEOMETRY HELPERS
  // ============================================================
  function makeLine(points, color, opacity, branchIndex) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
    const material = new THREE.LineBasicMaterial({ color: color.clone(), transparent: true, opacity: opacity });
    const line = new THREE.Line(geometry, material);
    line.userData = { baseColor: color.clone(), baseOpacity: opacity, fade: 1, branchIndex: branchIndex };
    allLines.push(line);
    rig.add(line);
    return line;
  }

  const dotGeometry = new THREE.SphereGeometry(0.042, 12, 12);
  function makeDot(position, scale, opacity, branchIndex) {
    const material = new THREE.MeshBasicMaterial({ color: COL_DOT.clone(), transparent: true, opacity: opacity, depthWrite: false });
    const mesh = new THREE.Mesh(dotGeometry, material);
    mesh.position.copy(position);
    mesh.scale.setScalar(scale);
    mesh.userData = { baseColor: COL_DOT.clone(), baseOpacity: opacity, baseScale: scale, fade: 1, dissolve: 0, branchIndex: branchIndex };
    allDots.push(mesh);
    rig.add(mesh);
    return mesh;
  }

  // ============================================================
  // BRANCHES — one per link node, each ending at that node
  // ============================================================
  // Every point a loose dot is allowed to connect to. Link nodes are
  // deliberately absent from this list: that's what keeps them final.
  const anchors = [hub.clone()];

  REAL_NODES.forEach((n, i) => {
    const end = new THREE.Vector3(n.pos[0], n.pos[1], n.pos[2]);
    const length = end.length();

    // Two waypoints, pushed off the straight line so the branch
    // curves. The sideways direction is derived from the node's own
    // position, so it's stable — move a node and its branch follows.
    const seed = i * 1.618;
    const axis = new THREE.Vector3(Math.sin(seed * 2.1), Math.cos(seed * 1.3), Math.sin(seed * 0.7 + 2.0));
    const perp = new THREE.Vector3().crossVectors(end, axis);
    if (perp.lengthSq() < 0.0001) perp.set(0, 1, 0);
    perp.normalize();

    const w1 = end.clone().multiplyScalar(0.32).addScaledVector(perp, length * 0.16);
    const w2 = end.clone().multiplyScalar(0.69).addScaledVector(perp, length * 0.095);

    makeLine([hub, w1, w2, end], COL_BRANCH, 0.55, i);
    makeDot(w1, 0.85, 0.7, i);
    makeDot(w2, 0.7, 0.6, i);
    anchors.push(w1.clone(), w2.clone());

    // The clickable node itself is plain HTML positioned over the
    // scene each frame — a real link, keyboard-focusable, selectable.
    const anchorObj = new THREE.Object3D();
    anchorObj.position.copy(end);
    rig.add(anchorObj);
    n._anchor = anchorObj;
    n._index = i;

    const a = document.createElement("a");
    a.href = n.href;
    a.className = "node3d-label";
    a.innerHTML =
      '<span class="node3d-dot"></span>' +
      '<span class="node3d-text">' + n.label + "</span>" +
      '<span class="node3d-sub">' + n.sub + "</span>";
    labelLayer.appendChild(a);
    n._el = a;
  });

  // ============================================================
  // LOOSE DOTS — attach to the nearest centre or waypoint
  // ============================================================
  // A pointer-sized invisible sphere sits over each one. Without it,
  // a dot that shrinks as it dissolves would slip out from under the
  // cursor, re-form, and flicker.
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

    // A dot with nothing near it simply floats, unconnected — without
    // this, moving one out to the edge would fling a long line right
    // across the middle of the map.
    let line = null;
    if (Math.sqrt(nearestDistance) < MAX_LOOSE_REACH) {
      // A slight bow in the connecting line, rather than dead straight.
      const mid = nearest.clone().add(p).multiplyScalar(0.5);
      mid.add(new THREE.Vector3((p.z - nearest.z) * 0.12, (p.x - nearest.x) * -0.08, (nearest.y - p.y) * 0.1));
      line = makeLine([nearest, mid, p], COL_LINE, 0.3, -1);
    }

    const dot = makeDot(p, 1, 0.8, -1);

    const hit = new THREE.Mesh(hitGeometry, hitMaterial);
    hit.position.copy(p);
    hit.userData = { dot: dot, line: line };
    rig.add(hit);
    hitTargets.push(hit);
  });

  // ============================================================
  // POINTER — hover, drag, and clicks that survive a drag
  // ============================================================
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-10, -10);
  let hovered = null;

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
  // LINK HOVER — recolours the whole map
  // ============================================================
  let tint = 0;
  let tintTarget = 0;
  let activeBranch = -1;

  REAL_NODES.forEach((n) => {
    function on() { tintTarget = 1; activeBranch = n._index; }
    function off() { tintTarget = 0; activeBranch = -1; }
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
  function resize() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);

    const halfFov = Math.tan((camera.fov * Math.PI) / 360);
    const frameH = camera.aspect < 1 ? 4.05 : FRAME_H; // portrait needs the link nodes kept on screen
    const distanceForHeight = FRAME_V / halfFov;
    const distanceForWidth = frameH / (halfFov * camera.aspect);
    camera.position.z = Math.max(distanceForHeight, distanceForWidth);
    camera.lookAt(0, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // ============================================================
  // FRAME LOOP
  // ============================================================
  const worldPos = new THREE.Vector3();
  const projected = new THREE.Vector3();
  let clock = 0;

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.016;

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
    rig.updateMatrixWorld(true);

    // --- what the pointer is over (loose dots only; the link nodes
    // are HTML and handle their own hover)
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitTargets)[0];
    hovered = hit ? hit.object : null;

    // --- dissolve: a pointed-at loose dot fades away and contracts
    // to nothing, taking its connecting line most of the way with it
    hitTargets.forEach((target) => {
      const dot = target.userData.dot;
      const goal = target === hovered ? 1 : 0;
      dot.userData.dissolve += (goal - dot.userData.dissolve) * 0.09;
      const d = dot.userData.dissolve;
      dot.userData.fade = 1 - d;
      dot.scale.setScalar(dot.userData.baseScale * (1 - 0.8 * d));
      if (target.userData.line) target.userData.line.userData.fade = 1 - 0.75 * d;
    });

    // --- one pass to recolour everything at once
    tint += (tintTarget - tint) * 0.06;
    const lit = tint > 0.002;

    allLines.forEach((line) => {
      const u = line.userData;
      const amount = lit ? tint * (u.branchIndex === activeBranch && activeBranch >= 0 ? 1 : 0.6) : 0;
      line.material.color.copy(u.baseColor).lerp(COL_ACCENT, amount);
      line.material.opacity = Math.min(1, u.baseOpacity * u.fade * (1 + amount * 0.5));
    });

    allDots.forEach((dot) => {
      const u = dot.userData;
      const amount = lit ? tint * (u.branchIndex === activeBranch && activeBranch >= 0 ? 1 : 0.6) : 0;
      dot.material.color.copy(u.baseColor).lerp(COL_ACCENT, amount);
      dot.material.opacity = Math.min(1, u.baseOpacity * u.fade * (1 + amount * 0.4));
    });

    // --- the centre breathes, very slightly, and brightens with the
    // rest of the map
    const breathe = REDUCE_MOTION ? 1 : 1 + Math.sin(clock * 0.55) * 0.035;
    shellInner.scale.setScalar(breathe);
    shellOuter.scale.setScalar(1 + (breathe - 1) * 1.8);
    shellInner.material.opacity = shellInner.userData.baseOpacity * (1 + tint * 1.1);
    shellOuter.material.opacity = shellOuter.userData.baseOpacity * (1 + tint * 1.4);

    // --- position the HTML link nodes over the scene
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    REAL_NODES.forEach((n) => {
      n._anchor.getWorldPosition(worldPos);
      projected.copy(worldPos).project(camera);
      const x = (projected.x * 0.5 + 0.5) * w;
      const y = (-projected.y * 0.5 + 0.5) * h;
      // The extra 10.5px cancels the label's own padding so the small
      // dot lands exactly on the node, whichever side the text is on.
      const flip = x > w * 0.68;
      n._el.classList.toggle("flip", flip);
      n._el.style.transform =
        "translate(" + x + "px," + y + "px)" +
        (flip ? " translate(-100%, -50%) translateX(10.5px)" : " translate(-10.5px, -50%)");
      const depth = (projected.z + 1) / 2;
      n._el.style.opacity = String(Math.max(0.45, 1 - depth * 0.55));
      n._el.style.zIndex = String(Math.round((1 - depth) * 100));
    });

    renderer.render(scene, camera);
  }
  animate();
})();
