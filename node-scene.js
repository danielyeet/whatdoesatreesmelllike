// ============================================================
// 3D NODE MAP
// A slowly turning map that fills the whole third slide. Drag
// to rotate; it also turns gently on its own.
//
// HOW IT'S PUT TOGETHER (this matters if you edit it):
// Every link node is an ENDPOINT. A branch grows out of the
// centre, passes through two waypoints, and stops at the link
// node — nothing ever continues past one.
//
// Nothing in the atmosphere is placed by hand any more. Each
// branch carries a WAKE of specks strung along it, and a SHELL
// of specks is distributed by golden angle so it can't clump or
// lean. Both are generated from the numbers in the tuning block.
// ============================================================

// Each one needs a label, a one-line sub-line (shown on hover), a
// link, and a position as [x, y, z]. These sit on the outside of
// the map — roughly 3 to 3.7 from the centre keeps them at the
// edge where an endpoint belongs.
const REAL_NODES = [
  { label: "Scent descriptions", sub: "notes on things I've smelled and tried to describe", href: "categories/scent-descriptions.html", pos: [-2.9, 1.5, 0.7] },
  { label: "Theories", sub: "half-formed ideas I keep coming back to", href: "categories/theories.html", pos: [2.0, 2.3, -1.1] },
  { label: "Favorites", sub: "things I like, no other reason needed", href: "categories/favorites.html", pos: [3.2, -1.3, 0.9] },
  { label: "Other", sub: "whatever doesn't fit anywhere else", href: "categories/other-1.html", pos: [-2.2, -2.4, -0.6] },
  { label: "Other", sub: "the other other pile", href: "categories/other-2.html", pos: [0.4, -2.9, 1.4] },
  { label: "Test node", sub: "a working sandbox node — safe to repurpose", href: "works/test-node-a.html", pos: [-3.2, -1.1, -1.4] },
  { label: "Test node", sub: "a second sandbox node", href: "works/test-node-b.html", pos: [3.3, 1.6, -1.3] },
];

// PLACEHOLDERS — replace or empty this list. These are the faint
// grey words floating in the map: not links, not clickable, just
// things the map is "about". They're handed out to shell specks in
// order, spaced evenly around it. An empty list is fine.
const ATMOSPHERE_LABELS = [
  "SLOW", "ROOTS", "AFTER RAIN", "MARGINALIA", "SMOKE", "REPETITION",
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
  // TUNING
  // ============================================================
  const IDLE_SPEED = REDUCE_MOTION ? 0 : 0.00018; // the drift on its own
  const DRAG_SENSITIVITY = 0.0026;
  const MAX_SPIN = 0.04;
  const MAX_TILT = 0.38;
  const FRAME_V = 4.35;         // room the map is given — larger draws it smaller
  const FRAME_H = 4.9;

  const WAKE_PER_BRANCH = 7;    // specks strung along each branch
  const WAKE_OFFSET = 0.17;     // how far the wake sits off its branch
  const WAKE_BIAS = 1.45;       // >1 crowds them toward the centre
  const WAKE_FROM = 0.19;       // but never closer in than this, or they silt up the hub
  const WAKE_TO = 0.95;
  const SHELL_COUNT = 26;       // specks in the surrounding shell
  const SHELL_RADIUS = 2.4;
  const PARTICLES_PER_SPECK = 9;
  const SPECK_SIZE = 0.072;

  const BRANCH_RADIUS = 0.0075;
  const BRANCH_RADIUS_EMPH = 0.017;
  const TUBE_SEGMENTS = 96;
  const TUBE_SIDES = 10;
  const REF_PX_PER_UNIT = 94;   // the screen the weights above are tuned for

  // The oscilloscope shake the cursor drags across the branches.
  const SHAKE_REACH = 0.95;     // how near the cursor has to be, in scene units
  const SHAKE_AMPLITUDE = 0.05; // how far a line is thrown at the very centre of it
  const SHAKE_WAVES = 90;       // oscillations along the length of a branch
  const SHAKE_SPEED = 26;       // and how fast they travel

  const COL_INK = new THREE.Color(0x22221a);
  const COL_BRANCH = new THREE.Color(0x807c73);
  const COL_SPECK = new THREE.Color(0x999590);
  const COL_CENTRE = new THREE.Color(0x1c1c14);
  const COL_CENTRE_HALO = new THREE.Color(0x8d8a80);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const rig = new THREE.Group();
  scene.add(rig);

  const hub = new THREE.Vector3(0, 0, 0);
  const branches = [];
  const specks = [];
  const ghosts = [];

  // ============================================================
  // THE CENTRE
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
  // SPECKS — a cluster of particles that sprays apart on hover
  // ============================================================
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
  const speckClouds = [];

  function makeSpeck(position, branchIndex, scale) {
    const directions = [];
    const coords = new Float32Array(PARTICLES_PER_SPECK * 3);
    for (let k = 0; k < PARTICLES_PER_SPECK; k++) {
      const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      if (v.lengthSq() < 0.0001) v.set(1, 0, 0);
      v.normalize().multiplyScalar(0.14 + Math.random() * 0.34);
      directions.push(v);
      coords[k * 3] = position.x;
      coords[k * 3 + 1] = position.y;
      coords[k * 3 + 2] = position.z;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(coords, 3));
    const material = new THREE.PointsMaterial({
      color: COL_SPECK.clone(), size: SPECK_SIZE * scale, sizeAttenuation: true,
      map: sprite, transparent: true, opacity: 0.9, depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    rig.add(points);

    const speck = {
      origin: position.clone(), directions: directions, points: points,
      branchIndex: branchIndex, scale: scale, spray: 0, lastSpray: -1,
    };
    points.userData.speck = speck;
    specks.push(speck);
    speckClouds.push(points);
    return speck;
  }

  // ============================================================
  // BRANCHES, EACH WITH ITS WAKE
  // ============================================================
  const waypointGeometry = new THREE.SphereGeometry(0.032, 14, 14);

  REAL_NODES.forEach((n, i) => {
    const end = new THREE.Vector3(n.pos[0], n.pos[1], n.pos[2]);
    const length = end.length();

    const seed = i * 1.618;
    const axis = new THREE.Vector3(Math.sin(seed * 2.1), Math.cos(seed * 1.3), Math.sin(seed * 0.7 + 2.0));
    const perp = new THREE.Vector3().crossVectors(end, axis);
    if (perp.lengthSq() < 0.0001) perp.set(0, 1, 0);
    perp.normalize();

    const w1 = end.clone().multiplyScalar(0.32).addScaledVector(perp, length * 0.16);
    const w2 = end.clone().multiplyScalar(0.69).addScaledVector(perp, length * 0.095);
    const curve = new THREE.CatmullRomCurve3([hub, w1, w2, end]);

    // A branch is a tube, not a line: WebGL ignores line thickness on
    // nearly every browser, and thickening is how a hovered branch is
    // meant to stand out.
    function tube(radius, color, opacity) {
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, TUBE_SEGMENTS, radius, TUBE_SIDES, false),
        new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: opacity, depthWrite: false })
      );
      rig.add(mesh);
      return mesh;
    }
    const resting = tube(BRANCH_RADIUS, COL_BRANCH, 0.78);
    const emphasised = tube(BRANCH_RADIUS_EMPH, COL_INK, 0);

    const dots = [w1, w2].map((p, k) => {
      const mesh = new THREE.Mesh(
        waypointGeometry,
        new THREE.MeshBasicMaterial({ color: COL_BRANCH.clone(), transparent: true, opacity: 0.8, depthWrite: false })
      );
      mesh.position.copy(p);
      mesh.userData.baseScale = k === 0 ? 0.95 : 0.78;
      rig.add(mesh);
      return mesh;
    });

    // The wake: specks strung along the branch itself, crowded toward
    // the centre and drifting further off-line as they go out. Their
    // positions come from the branch, so they can't be lopsided —
    // move the node and the whole wake follows it.
    for (let k = 1; k <= WAKE_PER_BRANCH; k++) {
      const t = WAKE_FROM + (WAKE_TO - WAKE_FROM) * Math.pow(k / (WAKE_PER_BRANCH + 1), WAKE_BIAS);
      const on = curve.getPoint(t);
      const side = (k % 2 === 0 ? 1 : -1);
      on.addScaledVector(perp, WAKE_OFFSET * side * (0.35 + t * 1.1));
      makeSpeck(on, i, 0.62 + 0.5 * (1 - t));
    }

    const anchorObj = new THREE.Object3D();
    anchorObj.position.copy(end);
    rig.add(anchorObj);

    const a = document.createElement("a");
    a.href = n.href;
    a.className = "node3d-label";
    a.innerHTML =
      '<span class="node3d-mark"></span>' +
      '<span class="node3d-text">' + n.label + "</span>" +
      '<span class="node3d-sub">' + n.sub + "</span>";
    labelLayer.appendChild(a);

    n._el = a;
    n._anchor = anchorObj;
    n._index = i;
    branches.push({ curve: curve, resting: resting, emphasised: emphasised, dots: dots, weight: 0 });
  });

  // ============================================================
  // THE SHELL — golden angle, so it is even by construction
  // ============================================================
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const labelStride = ATMOSPHERE_LABELS.length ? SHELL_COUNT / ATMOSPHERE_LABELS.length : 0;
  let labelsPlaced = 0;

  for (let i = 0; i < SHELL_COUNT; i++) {
    const y = 1 - (i / (SHELL_COUNT - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN_ANGLE;
    // A little in-and-out so it reads as a cloud rather than a ball.
    const radius = SHELL_RADIUS * (0.86 + 0.28 * ((i * 7919) % 100) / 100);
    const p = new THREE.Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring).multiplyScalar(radius);
    const speck = makeSpeck(p, -1, 0.8);

    if (labelStride && labelsPlaced < ATMOSPHERE_LABELS.length && i >= labelsPlaced * labelStride) {
      const ghost = document.createElement("div");
      ghost.className = "node3d-ghost";
      ghost.textContent = ATMOSPHERE_LABELS[labelsPlaced];
      labelLayer.appendChild(ghost);
      const anchorObj = new THREE.Object3D();
      anchorObj.position.copy(p);
      rig.add(anchorObj);
      ghosts.push({ el: ghost, anchor: anchorObj });
      labelsPlaced++;
    }
  }

  // ============================================================
  // POINTER
  // ============================================================
  const raycaster = new THREE.Raycaster();
  // Generous enough that a speck stays caught while it sprays apart,
  // which is what stops it flickering back and forth under the cursor.
  raycaster.params.Points.threshold = 0.26;
  const pointer = new THREE.Vector2(-10, -10);
  let pointerLive = false;

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
    pointerLive = Math.abs(pointer.x) < 1.2 && Math.abs(pointer.y) < 1.2;

    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    dragDistance += Math.abs(dx) + Math.abs(dy);
    velY = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, dx * DRAG_SENSITIVITY));
    velX = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, dy * DRAG_SENSITIVITY));
  });

  function endDrag() { dragging = false; wrap.classList.remove("grabbing"); }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  wrap.addEventListener("pointerleave", () => { pointer.set(-10, -10); pointerLive = false; });

  let activeBranch = -1;
  REAL_NODES.forEach((n) => {
    function on() { activeBranch = n._index; }
    function off() { if (activeBranch === n._index) activeBranch = -1; }
    n._el.addEventListener("pointerenter", on);
    n._el.addEventListener("focus", on);
    n._el.addEventListener("pointerleave", off);
    n._el.addEventListener("blur", off);
    n._el.addEventListener("click", (e) => {
      if (e.detail !== 0 && dragDistance > 6) e.preventDefault();
    });
  });

  // ============================================================
  // SIZING
  // ============================================================
  // A narrow screen draws the whole map smaller, which would take the
  // branches below a pixel wide and lose them. The layout still
  // shrinks; only the pen gets heavier.
  let penWeight = 1;
  let pxPerUnit = REF_PX_PER_UNIT;

  function prepareTube(mesh) {
    const attr = mesh.geometry.attributes.position;
    mesh.userData.base = new Float32Array(attr.array);
    mesh.userData.rings = TUBE_SEGMENTS + 1;
    mesh.userData.perRing = TUBE_SIDES + 1;
    mesh.userData.shaking = false;
  }

  function repen(weight) {
    branches.forEach((branch) => {
      branch.resting.geometry.dispose();
      branch.emphasised.geometry.dispose();
      branch.resting.geometry = new THREE.TubeGeometry(branch.curve, TUBE_SEGMENTS, BRANCH_RADIUS * weight, TUBE_SIDES, false);
      branch.emphasised.geometry = new THREE.TubeGeometry(branch.curve, TUBE_SEGMENTS, BRANCH_RADIUS_EMPH * weight, TUBE_SIDES, false);
      prepareTube(branch.resting);
      prepareTube(branch.emphasised);
    });
  }
  branches.forEach((b) => { prepareTube(b.resting); prepareTube(b.emphasised); });

  function resize() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);

    const halfFov = Math.tan((camera.fov * Math.PI) / 360);
    const frameH = camera.aspect < 1 ? 4.6 : FRAME_H;
    camera.position.z = Math.max(FRAME_V / halfFov, frameH / (halfFov * camera.aspect));
    camera.lookAt(0, 0, 0);

    pxPerUnit = (h / 2) / (camera.position.z * halfFov);
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
  const invRig = new THREE.Matrix4();
  const rayOrigin = new THREE.Vector3();
  const rayDir = new THREE.Vector3();
  const shakeAxis = new THREE.Vector3();
  const ringPoint = new THREE.Vector3();
  const ringAmp = new Float32Array(TUBE_SEGMENTS + 1);
  const field = [];
  let clock = 0;
  let arrival = 0;

  function shakeTube(mesh) {
    const base = mesh.userData.base;
    const perRing = mesh.userData.perRing;
    const attr = mesh.geometry.attributes.position;
    const array = attr.array;
    let touched = false;

    for (let ring = 0; ring <= TUBE_SEGMENTS; ring++) {
      const i0 = ring * perRing * 3;
      ringPoint.set(base[i0], base[i0 + 1], base[i0 + 2]);
      scratch.copy(ringPoint).sub(rayOrigin);
      const along = scratch.dot(rayDir);
      let amp = 0;
      if (along > 0) {
        scratch.addScaledVector(rayDir, -along);
        const d = scratch.length();
        if (d < SHAKE_REACH) {
          const falloff = 1 - d / SHAKE_REACH;
          amp = SHAKE_AMPLITUDE * penWeight * falloff * falloff;
        }
      }
      ringAmp[ring] = amp;
      if (amp > 0.0004) touched = true;
    }

    if (!touched && !mesh.userData.shaking) return;

    for (let ring = 0; ring <= TUBE_SEGMENTS; ring++) {
      const t = ring / TUBE_SEGMENTS;
      const offset = ringAmp[ring] * Math.sin(t * SHAKE_WAVES + clock * SHAKE_SPEED);
      for (let j = 0; j < perRing; j++) {
        const idx = (ring * perRing + j) * 3;
        array[idx] = base[idx] + shakeAxis.x * offset;
        array[idx + 1] = base[idx + 1] + shakeAxis.y * offset;
        array[idx + 2] = base[idx + 2] + shakeAxis.z * offset;
      }
    }
    attr.needsUpdate = true;
    mesh.userData.shaking = touched;
  }

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.016;

    const target = window.__p23 === undefined ? 1 : window.__p23;
    arrival += (target - arrival) * 0.18;
    wrap.style.opacity = arrival.toFixed(3);

    if (!dragging) {
      velY += (IDLE_SPEED - velY) * 0.012;
      velX += (0 - velX) * 0.04;
      rotX += (0 - rotX) * 0.004;
    }
    rotY += velY;
    rotX = Math.max(-MAX_TILT, Math.min(MAX_TILT, rotX + velX));
    rig.rotation.y = rotY;
    rig.rotation.x = rotX;
    rig.scale.setScalar(0.93 + 0.07 * arrival);
    rig.updateMatrixWorld(true);

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(speckClouds)[0];
    const hoveredSpeck = hit ? hit.object.userData.speck : null;

    let strongest = 0, runnerUp = 0;
    branches.forEach((branch, i) => {
      const goal = i === activeBranch ? 1 : 0;
      branch.weight += (goal - branch.weight) * 0.12;
      if (branch.weight > strongest) { runnerUp = strongest; strongest = branch.weight; }
      else if (branch.weight > runnerUp) { runnerUp = branch.weight; }
    });
    const stepBack = (branch) => (branch.weight >= strongest ? runnerUp : strongest);

    // --- the cursor drags a high-frequency wobble across whatever
    // branch it comes near, strongest right under the pointer
    if (arrival > 0.5 && !REDUCE_MOTION) {
      invRig.copy(rig.matrixWorld).invert();
      if (pointerLive) {
        rayOrigin.copy(raycaster.ray.origin).applyMatrix4(invRig);
        rayDir.copy(raycaster.ray.direction).transformDirection(invRig);
      } else {
        // Pointed away from everything, so the same pass settles any
        // branch still mid-wobble back onto its true line.
        rayOrigin.set(0, 0, 9999);
        rayDir.set(0, 0, 1);
      }
      shakeAxis.set(0, 1, 0).transformDirection(invRig);
      branches.forEach((branch) => {
        shakeTube(branch.resting);
        if (branch.weight > 0.02) shakeTube(branch.emphasised);
      });
    }

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
      const mine = speck.branchIndex >= 0 ? branches[speck.branchIndex].weight : 0;
      const back = speck.branchIndex >= 0 ? stepBack(branches[speck.branchIndex]) : strongest;
      speck.points.material.size = SPECK_SIZE * speck.scale * penWeight * (1 - 0.4 * s);
      speck.points.material.opacity = 0.9 * (1 - s * 0.95) * (1 - 0.5 * back) * (1 + 0.35 * mine);
      speck.points.material.color.copy(COL_SPECK).lerp(COL_INK, mine);
    });

    branches.forEach((branch) => {
      const w = branch.weight;
      const back = stepBack(branch);
      branch.emphasised.material.opacity = 0.88 * w;
      branch.resting.material.opacity = 0.78 * (1 - 0.45 * back);
      branch.resting.material.color.copy(COL_BRANCH).lerp(COL_INK, w);
      branch.dots.forEach((dot) => {
        dot.material.opacity = 0.8 * (1 - 0.5 * back);
        dot.material.color.copy(COL_BRANCH).lerp(COL_INK, w);
        dot.scale.setScalar(dot.userData.baseScale * penWeight * (1 + 0.45 * w));
      });
    });

    const breathe = REDUCE_MOTION ? 1 : 1 + Math.sin(clock * 0.55) * 0.035;
    shellInner.scale.setScalar(breathe);
    shellOuter.scale.setScalar(1 + (breathe - 1) * 1.8);

    // --- place the HTML labels, and publish where the map's masses
    // are so paper.js can bend the grid around them
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    field.length = 0;

    REAL_NODES.forEach((n, i) => {
      n._anchor.getWorldPosition(worldPos);
      projected.copy(worldPos).project(camera);
      const x = (projected.x * 0.5 + 0.5) * w;
      const y = (-projected.y * 0.5 + 0.5) * h;
      const flip = x > w * 0.68;
      n._el.classList.toggle("flip", flip);
      n._el.style.transform =
        "translate(" + x + "px," + y + "px)" +
        (flip ? " translate(-100%, -50%) translateX(13px)" : " translate(-13px, -50%)");
      const depth = (projected.z + 1) / 2;
      const back = stepBack(branches[i]);
      n._el.style.opacity = String(Math.max(0.5, 1 - depth * 0.45) * (1 - 0.55 * back));
      n._el.style.zIndex = String(Math.round((1 - depth) * 100));
      field.push({ x: x, y: y, r: 78 * penWeight, s: 7 });
    });

    ghosts.forEach((ghost) => {
      ghost.anchor.getWorldPosition(worldPos);
      projected.copy(worldPos).project(camera);
      const x = (projected.x * 0.5 + 0.5) * w;
      const y = (-projected.y * 0.5 + 0.5) * h;
      const depth = (projected.z + 1) / 2;
      ghost.el.style.transform = "translate(" + x + "px," + y + "px) translate(14px, -50%)";
      ghost.el.style.opacity = String((0.34 + (1 - depth) * 0.4) * (1 - 0.55 * strongest));
    });

    core.getWorldPosition(worldPos);
    projected.copy(worldPos).project(camera);
    field.push({
      x: (projected.x * 0.5 + 0.5) * w,
      y: (-projected.y * 0.5 + 0.5) * h,
      r: 210 * penWeight, s: 17,
    });
    window.__mapField = field;

    if (arrival > 0.004) renderer.render(scene, camera);
  }

  animate();
})();
