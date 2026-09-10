// ============================================================
// 3D NODE MAP
//
// THE PART MEANT TO BE HAND-EDITED: the REAL_NODES list below.
// Each needs a label, an optional one-line sub, a link, and a
// position in 3D space as [x, y, z]. A node can also carry a
// `preview` object — if it does, clicking it opens the pop-up
// preview window instead of navigating straight to its page.
// Only "Scent descriptions" has one right now, as a trial.
//
// DECORATIVE_POINTS further down are the small dots that react
// to the cursor but aren't links — pure atmosphere.
// ============================================================

const REAL_NODES = [
  {
    label: "Scent descriptions",
    sub: "notes on things I've smelled and tried to describe",
    href: "categories/scent-descriptions.html",
    pos: [-2.5, 1.1, 0.6],
    preview: {
      description: "Here I describe things, from scents to houses to notes to anything else.",
      buttonLabel: "Enter",
    },
  },
  { label: "Theories", sub: "half-formed ideas I keep coming back to", href: "categories/theories.html", pos: [1.7, 1.7, -0.9] },
  { label: "Favorites", sub: "things I like, no other reason needed", href: "categories/favorites.html", pos: [2.7, -0.5, 0.8] },
  { label: "Other", sub: "whatever doesn't fit anywhere else", href: "categories/other-1.html", pos: [-1.6, -1.8, -0.4] },
  { label: "Other", sub: "the other other pile", href: "categories/other-2.html", pos: [0.3, -2.1, 1.1] },
  { label: "Test node", sub: "a working sandbox node — safe to repurpose", href: "works/test-node-a.html", pos: [-3.0, -0.2, -1.3] },
  { label: "Test node", sub: "a second sandbox node", href: "works/test-node-b.html", pos: [3.1, 0.7, -1.3] },
];

const DECORATIVE_POINTS = [
  [-3.6, 2.3, -1.1], [-0.9, 3.0, 0.8], [1.1, 2.9, 1.6], [3.5, 2.0, -0.6],
  [4.0, 0.1, 1.2], [3.7, -1.8, -0.9], [1.6, -3.0, 0.4], [-0.6, -3.3, -1.0],
  [-2.6, -2.8, 1.0], [-4.0, -0.9, 0.3], [-3.6, 1.0, 1.7], [0.2, 0.4, -2.4],
  [2.0, -0.4, -2.2], [-1.4, 1.9, -1.9],
];
const DECORATIVE_SPREAD = 1.5; // how far outside the core cluster the particles sit

(function () {
  const wrap = document.getElementById("node-scene");
  const canvas = document.getElementById("node-canvas");
  const labelLayer = document.getElementById("node-labels");

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

  // --- Tuning constants ---------------------------------------------
  const IDLE_SPEED = REDUCE_MOTION ? 0 : 0.0016;
  const PROX_RADIUS = 170;        // px — how close the cursor needs to be to start affecting an arm
  const ZIGZAG_FREQ = 16;         // how many zigzag peaks along an arm at full proximity
  const ZIGZAG_AMP = 0.22;        // how far the zigzag deviates from the smooth line
  const BOLD_OPACITY_BOOST = 0.16; // kept deliberately modest — this is the "less strong" bolding
  const BOLD_COLOR_MIX = 0.5;
  const CONVERGE_RADIUS = 1.7;    // local-space units a particle will travel to join a hovered arm

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 9.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);

  const rig = new THREE.Group();
  scene.add(rig);

  const LINE_COLOR = new THREE.Color(0xe0ddd2);
  const LINE_COLOR_REAL = new THREE.Color(0xb0ac9f);
  const DOT_COLOR = new THREE.Color(0xc7c3b6);
  const HOVER_COLOR = new THREE.Color(0x9c6f35);

  const hub = new THREE.Vector3(0, 0, 0);
  rig.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), new THREE.MeshBasicMaterial({ color: 0xa19d92 })));

  function triWave(x) {
    const f = x - Math.floor(x);
    return f < 0.5 ? 4 * f - 1 : 3 - 4 * f;
  }

  function computeCurve(a, b) {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const off = new THREE.Vector3((b.z - a.z) * 0.14, (b.x - a.x) * -0.09, (a.y - b.y) * 0.11);
    mid.add(off);
    const dir = b.clone().sub(a).normalize();
    let perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    if (perp.lengthSq() < 0.0001) perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0));
    perp.normalize();
    return { curve: new THREE.CatmullRomCurve3([a, mid, b]), perp };
  }

  function writeWiggle(geometry, points, perp, proximity, time, segments) {
    const arr = geometry.attributes.position.array;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const edgeFade = Math.sin(Math.PI * t);
      const wiggle = triWave(t * ZIGZAG_FREQ + time * 1.4) * ZIGZAG_AMP * proximity * edgeFade;
      const p = points[i];
      arr[i * 3] = p.x + perp.x * wiggle;
      arr[i * 3 + 1] = p.y + perp.y * wiggle;
      arr[i * 3 + 2] = p.z + perp.z * wiggle;
    }
    geometry.attributes.position.needsUpdate = true;
  }

  // An arm whose two ends never move (used for the real, clickable nodes) —
  // the base curve only needs to be computed once.
  function buildStaticArm(a, b, color, baseOpacity) {
    const SEGMENTS = 36;
    const { curve, perp } = computeCurve(a, b);
    const basePoints = curve.getPoints(SEGMENTS);
    const positions = new Float32Array((SEGMENTS + 1) * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const baseColor = color.clone();
    const material = new THREE.LineBasicMaterial({ color: color.clone(), transparent: true, opacity: baseOpacity });
    const line = new THREE.Line(geometry, material);
    const state = { proximity: 0, basePoints };

    function update(targetProximity, time) {
      state.proximity += (targetProximity - state.proximity) * 0.15;
      writeWiggle(geometry, basePoints, perp, state.proximity, time, SEGMENTS);
      material.opacity = baseOpacity + state.proximity * BOLD_OPACITY_BOOST;
      material.color.copy(baseColor).lerp(HOVER_COLOR, state.proximity * BOLD_COLOR_MIX);
    }
    return { object: line, state, update };
  }

  // An arm whose start point can move (used for decorative particles,
  // since they can drift toward a hovered arm) — recomputed each frame.
  function buildDynamicArm(getA, getB, color, baseOpacity) {
    const SEGMENTS = 28;
    const positions = new Float32Array((SEGMENTS + 1) * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const baseColor = color.clone();
    const material = new THREE.LineBasicMaterial({ color: color.clone(), transparent: true, opacity: baseOpacity });
    const line = new THREE.Line(geometry, material);
    const state = { proximity: 0 };

    function update(targetProximity, time) {
      const a = getA(), b = getB();
      const { curve, perp } = computeCurve(a, b);
      const pts = curve.getPoints(SEGMENTS);
      state.proximity += (targetProximity - state.proximity) * 0.15;
      writeWiggle(geometry, pts, perp, state.proximity, time, SEGMENTS);
      material.opacity = baseOpacity + state.proximity * BOLD_OPACITY_BOOST;
      material.color.copy(baseColor).lerp(HOVER_COLOR, state.proximity * BOLD_COLOR_MIX);
    }
    return { object: line, state, update };
  }

  // --- Real nodes ------------------------------------------------
  REAL_NODES.forEach((n) => {
    const localPos = new THREE.Vector3(...n.pos);
    const armObj = buildStaticArm(hub, localPos, LINE_COLOR_REAL, 0.42);
    rig.add(armObj.object);
    n._arm = armObj;

    const anchor = new THREE.Object3D();
    anchor.position.copy(localPos);
    rig.add(anchor);
    n._anchor = anchor;

    const a = document.createElement("a");
    a.href = n.href;
    a.className = "node3d-label";
    a.innerHTML =
      '<span class="node3d-dot"></span>' +
      '<span class="node3d-text">' + n.label + "</span>" +
      '<span class="node3d-sub">' + n.sub + "</span>";
    labelLayer.appendChild(a);
    n._el = a;
    n._hovered = false;

    a.addEventListener("pointerenter", () => { n._hovered = true; });
    a.addEventListener("pointerleave", () => { n._hovered = false; });
    a.addEventListener("click", (e) => {
      if (n.preview) {
        e.preventDefault();
        openPreview(n);
      }
    });
  });

  // --- Decorative particles ---------------------------------------
  const decoratives = [];
  const decoGeometry = new THREE.SphereGeometry(0.045, 10, 10);
  DECORATIVE_POINTS.forEach((pos, i) => {
    const restPos = new THREE.Vector3(pos[0] * DECORATIVE_SPREAD, pos[1] * DECORATIVE_SPREAD, pos[2] * DECORATIVE_SPREAD);
    const material = new THREE.MeshBasicMaterial({ color: DOT_COLOR.clone(), transparent: true, opacity: 0.55 });
    const mesh = new THREE.Mesh(decoGeometry, material);
    mesh.position.copy(restPos);
    rig.add(mesh);

    const targetPos = i % 3 === 0 ? hub : new THREE.Vector3(...REAL_NODES[i % REAL_NODES.length].pos);
    const arm = buildDynamicArm(() => mesh.position, () => targetPos, LINE_COLOR, 0.14);
    rig.add(arm.object);

    decoratives.push({ mesh, restPos, arm, attractLerp: 0 });
  });

  // --- Mouse tracking + drag-to-rotate (hand-rolled, no extra library) ---
  let mouseX = -9999, mouseY = -9999;
  let rotY = 0, rotX = 0;
  let velY = IDLE_SPEED, velX = 0;
  let dragging = false, lastX = 0, lastY = 0;

  wrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    wrap.classList.add("grabbing");
    wrap.setPointerCapture(e.pointerId);
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
    wrap.classList.remove("grabbing");
  });
  wrap.addEventListener("pointermove", (e) => {
    const r = wrap.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = dx * 0.004;
      velX = dy * 0.004;
    }
  });
  wrap.addEventListener("pointerleave", () => { mouseX = -9999; mouseY = -9999; });

  // --- Resize -------------------------------------------------------
  function onResize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  // --- Pop-up preview window (trial: Scent descriptions only) ------
  let modalOpen = false;
  let activeModal = null;

  function openPreview(node) {
    if (modalOpen) return;
    modalOpen = true;
    document.body.classList.add("preview-open");

    const originX = node._lastScreenX || window.innerWidth / 2;
    const originY = node._lastScreenY || window.innerHeight / 2;
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const angle = (Math.atan2(cx - originX, -(cy - originY)) * 180) / Math.PI;

    const backdrop = document.createElement("div");
    backdrop.className = "node-preview-backdrop";
    backdrop.addEventListener("click", closePreview);

    const layer = document.createElement("div");
    layer.className = "node-preview-layer";
    const arm = document.createElement("div");
    arm.className = "node-preview-arm";
    arm.style.left = originX + "px";
    arm.style.top = originY + "px";
    arm.style.setProperty("--arm-angle", angle + "deg");
    layer.appendChild(arm);

    const modal = document.createElement("div");
    modal.className = "node-preview-modal";
    modal.innerHTML =
      '<button class="node-preview-close" type="button" aria-label="Close preview">Close</button>' +
      '<div class="node-preview-media"></div>' +
      '<p class="node-preview-desc">' + node.preview.description + "</p>" +
      '<a class="node-preview-button" href="' + node.href + '">' + (node.preview.buttonLabel || "Enter") + "</a>";
    modal.style.left = originX + "px";
    modal.style.top = originY + "px";
    modal.style.transform = "translate(-50%, -50%) scale(0.06)";
    modal.style.opacity = "0";

    document.body.appendChild(backdrop);
    document.body.appendChild(layer);
    document.body.appendChild(modal);

    void modal.offsetWidth; // force reflow so the start state registers before animating

    requestAnimationFrame(() => {
      arm.classList.add("open");
      modal.style.left = "50%";
      modal.style.top = "50%";
      modal.style.transform = "translate(-50%, -50%) scale(1)";
      modal.style.opacity = "1";
    });

    modal.querySelector(".node-preview-close").addEventListener("click", closePreview);
    activeModal = { modal, arm, backdrop, layer, originX, originY };
  }

  function closePreview() {
    if (!modalOpen || !activeModal) return;
    const { modal, arm, backdrop, layer, originX, originY } = activeModal;
    modal.style.left = originX + "px";
    modal.style.top = originY + "px";
    modal.style.transform = "translate(-50%, -50%) scale(0.06)";
    modal.style.opacity = "0";
    arm.classList.remove("open");
    document.body.classList.remove("preview-open");
    modalOpen = false;
    setTimeout(() => {
      modal.remove();
      layer.remove();
      backdrop.remove();
    }, 700);
    activeModal = null;
  }

  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && modalOpen) closePreview(); });

  // --- Animate --------------------------------------------------------
  const worldPos = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() / 1000;

    const anyRealHovered = REAL_NODES.some((n) => n._hovered);
    const spinPaused = anyRealHovered || modalOpen;
    if (!dragging) {
      velY += ((spinPaused ? 0 : IDLE_SPEED) - velY) * 0.04;
      velX += (0 - velX) * 0.05;
    }
    rotY += velY;
    rotX = Math.max(-0.6, Math.min(0.6, rotX + velX));
    rig.rotation.y = rotY;
    rig.rotation.x = rotX;

    // decorative particles: convergence uses local-space math only, so it
    // doesn't need an up-to-date world matrix — safe to do before the update.
    let hoveredArmState = null;
    REAL_NODES.forEach((n) => { if (n._hovered) hoveredArmState = n._arm.state; });

    if (!modalOpen) {
      decoratives.forEach((d) => {
        let targetLerp = 0, nearestPoint = null;
        if (hoveredArmState) {
          let nearestDist = Infinity;
          for (const pt of hoveredArmState.basePoints) {
            const dd = pt.distanceTo(d.restPos);
            if (dd < nearestDist) { nearestDist = dd; nearestPoint = pt; }
          }
          if (nearestDist < CONVERGE_RADIUS) targetLerp = 1 - nearestDist / CONVERGE_RADIUS;
        }
        d.attractLerp += (targetLerp - d.attractLerp) * 0.08;
        if (d.attractLerp > 0.002 && nearestPoint) {
          d.mesh.position.copy(d.restPos).lerp(nearestPoint, d.attractLerp * 0.85);
        } else {
          d.mesh.position.lerp(d.restPos, 0.08);
        }
      });
    }

    rig.updateMatrixWorld(true);
    const rect = wrap.getBoundingClientRect();

    REAL_NODES.forEach((n) => {
      n._anchor.getWorldPosition(worldPos);
      const v = worldPos.clone().project(camera);
      const localX = (v.x * 0.5 + 0.5) * wrap.clientWidth;
      const localY = (-v.y * 0.5 + 0.5) * wrap.clientHeight;
      n._el.style.transform = "translate(" + localX + "px," + localY + "px)";
      const depth = (v.z + 1) / 2;
      n._el.style.opacity = String(Math.max(0.5, 1 - depth * 0.5));
      n._el.style.zIndex = String(Math.round((1 - depth) * 100));
      n._lastScreenX = rect.left + localX;
      n._lastScreenY = rect.top + localY;

      const dist = Math.hypot(mouseX - localX, mouseY - localY);
      const distProx = Math.max(0, 1 - dist / PROX_RADIUS);
      n._arm.update(Math.max(distProx, n._hovered ? 1 : 0), time);
    });

    if (!modalOpen) {
      decoratives.forEach((d) => {
        d.mesh.getWorldPosition(worldPos);
        const v = worldPos.clone().project(camera);
        const localX = (v.x * 0.5 + 0.5) * wrap.clientWidth;
        const localY = (-v.y * 0.5 + 0.5) * wrap.clientHeight;
        const dist = Math.hypot(mouseX - localX, mouseY - localY);
        d.arm.update(Math.max(0, 1 - dist / PROX_RADIUS), time);
      });
    }

    renderer.render(scene, camera);
  }
  animate();
})();
