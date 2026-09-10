// ============================================================
// 3D NODE MAP
//
// THE PART MEANT TO BE HAND-EDITED: the REAL_NODES list below.
// Each needs a label, a one-line sub, a link, and a position in
// 3D space as [x, y, z] — roughly -3 to 3 on each axis keeps it
// comfortably in view. DECORATIVE_POINTS further down are the
// small dots that aren't links — pure atmosphere, and they'll
// drift toward whichever real node's arm you're hovering.
// ============================================================

const REAL_NODES = [
  { label: "Scent descriptions", sub: "notes on things I've smelled and tried to describe", href: "categories/scent-descriptions.html", pos: [-2.5, 1.1, 0.6] },
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

  // --- Tuning ---------------------------------------------------
  const IDLE_SPEED = REDUCE_MOTION ? 0 : 0.0016;
  const SEGMENTS = 36;
  const WINDOW_START = 0.72;   // the ripple only touches roughly the last 28% of an arm, nearest the node
  const ZIGZAG_FREQ = 40;      // dense — many peaks packed into that small window
  const ZIGZAG_AMP = 0.18;
  const CONVERGE_RADIUS = 1.7;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 9.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);

  const rig = new THREE.Group();
  scene.add(rig);

  const LINE_COLOR = new THREE.Color(0xd6d3c9);
  const LINE_COLOR_REAL = new THREE.Color(0xb5b1a4);
  const DOT_COLOR = new THREE.Color(0xb5b1a4);
  const HOVER_COLOR = new THREE.Color(0x9c6f35);

  const hub = new THREE.Vector3(0, 0, 0);
  rig.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), new THREE.MeshBasicMaterial({ color: 0xa19d92 })));

  function triWave(x) {
    const f = x - Math.floor(x);
    return f < 0.5 ? 4 * f - 1 : 3 - 4 * f;
  }
  function smoothstep(edge0, edge1, x) {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
  function curvePoints(a, b) {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const off = new THREE.Vector3((b.z - a.z) * 0.14, (b.x - a.x) * -0.09, (a.y - b.y) * 0.11);
    mid.add(off);
    return new THREE.CatmullRomCurve3([a, mid, b]).getPoints(SEGMENTS);
  }

  // --- Real nodes: static geometry at rest. The only motion an arm
  // ever gets is a ripple confined to its outer end, and only while
  // that node is actually hovered. Nothing sways on its own.
  REAL_NODES.forEach((n) => {
    const localPos = new THREE.Vector3(...n.pos);
    const basePoints = curvePoints(hub, localPos);
    const dir = localPos.clone().sub(hub).normalize();
    let perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    if (perp.lengthSq() < 0.0001) perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0));
    perp.normalize();

    const positions = new Float32Array((SEGMENTS + 1) * 3);
    basePoints.forEach((p, i) => { positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z; });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: LINE_COLOR_REAL.clone(), transparent: true, opacity: 0.7 });
    const line = new THREE.Line(geometry, material);
    rig.add(line);

    n._armBasePoints = basePoints;
    n._armPerp = perp;
    n._armGeometry = geometry;
    n._armMaterial = material;
    n._hoverIntensity = 0;
    n._hovered = false;

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

    a.addEventListener("pointerenter", () => { n._hovered = true; });
    a.addEventListener("pointerleave", () => { n._hovered = false; });
    a.addEventListener("click", (e) => {
      e.preventDefault();
      openPreview(n);
    });
  });

  // --- Decorative particles: sit still. They only ever move to
  // gather toward whichever real node's arm is currently hovered,
  // and they snap exactly back to rest afterward — no lingering drift.
  const decoGeometry = new THREE.SphereGeometry(0.045, 10, 10);
  const decoratives = [];
  DECORATIVE_POINTS.forEach((pos, i) => {
    const restPos = new THREE.Vector3(...pos);
    const material = new THREE.MeshBasicMaterial({ color: DOT_COLOR.clone(), transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(decoGeometry, material);
    mesh.position.copy(restPos);
    rig.add(mesh);

    const targetPos = i % 3 === 0 ? hub : new THREE.Vector3(...REAL_NODES[i % REAL_NODES.length].pos);
    const lineMaterial = new THREE.LineBasicMaterial({ color: LINE_COLOR, transparent: true, opacity: 0.35 });
    const lineGeometry = new THREE.BufferGeometry();
    const line = new THREE.Line(lineGeometry, lineMaterial);
    rig.add(line);

    function rebuildLine(fromPos) {
      lineGeometry.setFromPoints(curvePoints(fromPos, targetPos));
    }
    rebuildLine(restPos);

    decoratives.push({ mesh, restPos, targetPos, attractLerp: 0, rebuildLine });
  });

  // --- Drag-to-rotate (hand-rolled, unchanged from before)
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
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velY = dx * 0.004;
    velX = dy * 0.004;
  });

  function onResize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  // --- Simple click-to-preview popup (deliberately minimal for now) --
  let modalOpen = false;
  let activeModal = null;

  function openPreview(node) {
    if (modalOpen) return;
    modalOpen = true;
    document.body.classList.add("preview-open");

    const originX = node._lastScreenX || window.innerWidth / 2;
    const originY = node._lastScreenY || window.innerHeight / 2;

    const backdrop = document.createElement("div");
    backdrop.className = "node-preview-backdrop";
    backdrop.addEventListener("click", closePreview);

    const modal = document.createElement("div");
    modal.className = "node-preview-modal";
    modal.innerHTML =
      '<button class="node-preview-close" type="button" aria-label="Close">Close</button>' +
      '<div class="node-preview-media"></div>' +
      '<h3 class="node-preview-title">' + node.label + "</h3>" +
      '<p class="node-preview-desc">' + node.sub + "</p>" +
      '<a class="node-preview-button" href="' + node.href + '">Enter</a>';
    modal.style.left = originX + "px";
    modal.style.top = originY + "px";
    modal.style.transform = "translate(-50%, -50%) scale(0.08)";
    modal.style.opacity = "0";

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    void modal.offsetWidth;

    requestAnimationFrame(() => {
      backdrop.classList.add("open");
      modal.style.left = "50%";
      modal.style.top = "50%";
      modal.style.transform = "translate(-50%, -50%) scale(1)";
      modal.style.opacity = "1";
    });

    modal.querySelector(".node-preview-close").addEventListener("click", closePreview);
    activeModal = { modal, backdrop, originX, originY };
  }

  function closePreview() {
    if (!modalOpen || !activeModal) return;
    const { modal, backdrop, originX, originY } = activeModal;
    modal.style.left = originX + "px";
    modal.style.top = originY + "px";
    modal.style.transform = "translate(-50%, -50%) scale(0.08)";
    modal.style.opacity = "0";
    backdrop.classList.remove("open");
    document.body.classList.remove("preview-open");
    modalOpen = false;
    setTimeout(() => { modal.remove(); backdrop.remove(); }, 550);
    activeModal = null;
  }
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && modalOpen) closePreview(); });

  // --- Animate --------------------------------------------------------
  const worldPos = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() / 1000;

    const anyHovered = REAL_NODES.some((n) => n._hovered);
    if (!dragging) {
      velY += ((anyHovered || modalOpen ? 0 : IDLE_SPEED) - velY) * 0.04;
      velX += (0 - velX) * 0.05;
    }
    rotY += velY;
    rotX = Math.max(-0.6, Math.min(0.6, rotX + velX));
    rig.rotation.y = rotY;
    rig.rotation.x = rotX;

    const hoveredNode = REAL_NODES.find((n) => n._hovered) || null;

    if (!modalOpen) {
      decoratives.forEach((d) => {
        let targetLerp = 0, nearestPoint = null;
        if (hoveredNode) {
          let nearestDist = Infinity;
          for (const pt of hoveredNode._armBasePoints) {
            const dd = pt.distanceTo(d.restPos);
            if (dd < nearestDist) { nearestDist = dd; nearestPoint = pt; }
          }
          if (nearestDist < CONVERGE_RADIUS) targetLerp = 1 - nearestDist / CONVERGE_RADIUS;
        }
        d.attractLerp += (targetLerp - d.attractLerp) * 0.08;

        let moved = false;
        if (d.attractLerp > 0.002 && nearestPoint) {
          d.mesh.position.copy(d.restPos).lerp(nearestPoint, d.attractLerp * 0.85);
          moved = true;
        } else if (!d.mesh.position.equals(d.restPos)) {
          if (d.mesh.position.distanceToSquared(d.restPos) < 0.00003) {
            d.mesh.position.copy(d.restPos); // exact snap — no perpetual drift
          } else {
            d.mesh.position.lerp(d.restPos, 0.1);
          }
          moved = true;
        }
        if (moved) d.rebuildLine(d.mesh.position);
      });
    }

    rig.updateMatrixWorld(true);
    const rect = wrap.getBoundingClientRect();

    REAL_NODES.forEach((n) => {
      n._hoverIntensity += ((n._hovered ? 1 : 0) - n._hoverIntensity) * 0.15;
      const arr = n._armGeometry.attributes.position.array;
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const windowT = smoothstep(WINDOW_START, 1.0, t);
        const wiggle = triWave(t * ZIGZAG_FREQ + time * 2.2) * ZIGZAG_AMP * windowT * n._hoverIntensity;
        const p = n._armBasePoints[i];
        arr[i * 3] = p.x + n._armPerp.x * wiggle;
        arr[i * 3 + 1] = p.y + n._armPerp.y * wiggle;
        arr[i * 3 + 2] = p.z + n._armPerp.z * wiggle;
      }
      n._armGeometry.attributes.position.needsUpdate = true;
      n._armMaterial.opacity = 0.7 + n._hoverIntensity * 0.15;
      n._armMaterial.color.copy(LINE_COLOR_REAL).lerp(HOVER_COLOR, n._hoverIntensity * 0.35);

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
    });

    renderer.render(scene, camera);
  }
  animate();
})();
