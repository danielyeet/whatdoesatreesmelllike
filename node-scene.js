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
// Nothing in the atmosphere is placed by hand. Each branch
// carries a WAKE of specks strung along it, and a CLOUD of
// specks surrounds the whole thing, well past the diagram and
// past the edges of the screen, drifting in and out of view.
// Both are generated from the tuning block below.
//
// Every branch also sways on its own slow cycle, so the map
// moves the way an arm does rather than as one rigid object.
// ============================================================

const REAL_NODES = [
  {
    label: "Scent descriptions", sub: "notes on things I've smelled and tried to describe",
    href: "categories/scent-descriptions.html", pos: [-2.9, 1.5, 0.7],
    preview: { description: "Here I describe things, from scents to houses to notes to anything else." },
  },
  { label: "Theories", sub: "half-formed ideas I keep coming back to", href: "categories/theories.html", pos: [2.0, 2.3, -1.1] },
  { label: "Favorites", sub: "things I like, no other reason needed", href: "categories/favorites.html", pos: [3.2, -1.3, 0.9] },
  { label: "Other", sub: "whatever doesn't fit anywhere else", href: "categories/other-1.html", pos: [-2.2, -2.4, -0.6] },
  { label: "Other", sub: "the other other pile", href: "categories/other-2.html", pos: [0.4, -2.9, 1.4] },
  { label: "Test node", sub: "a working sandbox node — safe to repurpose", href: "works/test-node-a.html", pos: [-3.2, -1.1, -1.4] },
  { label: "Test node", sub: "a second sandbox node", href: "works/test-node-b.html", pos: [3.3, 1.6, -1.3] },
];

// PLACEHOLDERS — replace or empty this list. The faint grey words
// floating in the map: not links, not clickable, just things the map
// is "about". They sit on fixed points of their own, so they don't
// drift with the cloud.
const ATMOSPHERE_LABELS = [
  "SLOW", "ROOTS", "AFTER RAIN", "MARGINALIA", "SMOKE", "REPETITION",
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

  // ============================================================
  // TUNING
  // ============================================================
  const IDLE_SPEED = REDUCE_MOTION ? 0 : 0.00018;
  const DRAG_SENSITIVITY = 0.0026;
  const MAX_SPIN = 0.04;
  const MAX_TILT = 0.38;
  const FRAME_V = 4.35;         // room the map is given — larger draws it smaller
  const FRAME_H = 4.9;

  // Sway is disabled — the map spins as a rigid whole, nothing sways
  // independently. Set this back above 0 to bring it back.
  const SWAY = 0;               // tip wander, as a fraction of branch length
  const SWAY_PERIOD = [6, 10];  // seconds per cycle, picked per branch
  const SWAY_TAPER = 1.6;       // >1 keeps the movement out at the tip

  // The corrugation the cursor drags across a branch: a sharp zigzag
  // whose height and position are re-rolled several times a second,
  // so it reads as jitter and not as a wave travelling along a wire.
  const CORR_REACH = 0.95;      // how near the cursor has to be, in scene units
  const CORR_HEIGHT = 0.012;    // how far it throws the line at the very centre of it
  const CORR_PITCH = 18;        // corrugations along the length of a branch
  const CORR_ROLL_MS = 70;      // how often the jitter is re-rolled

  const WAKE_PER_BRANCH = 7;
  const WAKE_OFFSET = 0.17;
  const WAKE_BIAS = 1.45;
  const WAKE_FROM = 0.19;
  const WAKE_TO = 0.95;
  const PARTICLES_PER_SPECK = 9;

  const CLOUD_COUNT = 240;
  const CLOUD_INNER = 2.6;      // starts outside the diagram
  const CLOUD_OUTER = 7.4;      // and runs well past the edges of the screen
  const CLOUD_DEPTH = 1.45;     // extra spread along z, out of the diagram's plane
  const CLOUD_LIFE = [11, 27];  // seconds for one fade-in, hold, fade-out
  const GHOST_RADIUS = 2.95;
  const CONVERGE_REACH = 1.7;   // how far a cloud particle will travel to join a hovered branch

  const SPECK_SIZE = 0.072;
  const BRANCH_RADIUS = 0.0075;
  const BRANCH_RADIUS_EMPH = 0.012; // was 0.017 — a smaller jump from resting to hovered
  const TUBE_SEGMENTS = 96;
  const TUBE_SIDES = 8;
  const REF_PX_PER_UNIT = 94;

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
  // SPECK RENDERING
  // Both particle systems are single batches with per-particle
  // size and per-particle opacity, which the stock points material
  // can't do — hence the small shader. One draw call each, so the
  // counts can go up without the cost going up with them.
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

  const VERT = [
    "attribute float aSize;",
    "attribute float aFade;",
    "attribute float aTint;",
    "uniform float uScale;",
    "uniform float uMaxSize;",
    "varying float vFade;",
    "varying float vTint;",
    "void main() {",
    "  vFade = aFade;",
    "  vTint = aTint;",
    "  vec4 mv = modelViewMatrix * vec4( position, 1.0 );",
    "  gl_PointSize = min( aSize * ( uScale / max( 0.0001, - mv.z ) ), uMaxSize );",
    "  gl_Position = projectionMatrix * mv;",
    "}",
  ].join("\n");

  const FRAG = [
    "uniform sampler2D uMap;",
    "uniform vec3 uBase;",
    "uniform vec3 uInk;",
    "varying float vFade;",
    "varying float vTint;",
    "void main() {",
    "  float a = texture2D( uMap, gl_PointCoord ).a * vFade;",
    "  if ( a < 0.004 ) discard;",
    "  gl_FragColor = vec4( mix( uBase, uInk, vTint ), a );",
    "}",
  ].join("\n");

  function speckMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: sprite },
        uScale: { value: 400 },
        // Without a ceiling, a speck that drifts close to the camera
        // balloons into a blob and pulls the eye straight to it.
        uMaxSize: { value: 20 },
        uBase: { value: COL_SPECK.clone() },
        uInk: { value: COL_INK.clone() },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
    });
  }

  function speckBatch(count, reach) {
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    const size = new THREE.BufferAttribute(new Float32Array(count), 1);
    const fade = new THREE.BufferAttribute(new Float32Array(count), 1);
    const tint = new THREE.BufferAttribute(new Float32Array(count), 1);
    position.setUsage(THREE.DynamicDrawUsage);
    size.setUsage(THREE.DynamicDrawUsage);
    fade.setUsage(THREE.DynamicDrawUsage);
    tint.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", position);
    geometry.setAttribute("aSize", size);
    geometry.setAttribute("aFade", fade);
    geometry.setAttribute("aTint", tint);
    // Set once and left alone: the positions change every frame, and
    // recomputing this each time would cost more than the loose fit.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), reach);
    const points = new THREE.Points(geometry, speckMaterial());
    points.frustumCulled = false;
    rig.add(points);
    return { points: points, position: position, size: size, fade: fade, tint: tint };
  }

  // ============================================================
  // BRANCHES
  // ============================================================
  const waypointGeometry = new THREE.SphereGeometry(0.032, 14, 14);
  const wakeSpecks = [];

  REAL_NODES.forEach((n, i) => {
    const end = new THREE.Vector3(n.pos[0], n.pos[1], n.pos[2]);
    const length = end.length();

    const seed = i * 1.618;
    const axis = new THREE.Vector3(Math.sin(seed * 2.1), Math.cos(seed * 1.3), Math.sin(seed * 0.7 + 2.0));
    const perp = new THREE.Vector3().crossVectors(end, axis);
    if (perp.lengthSq() < 0.0001) perp.set(0, 1, 0);
    perp.normalize();
    // A second direction across the branch, so it can sway in a
    // circle rather than only side to side.
    const perp2 = new THREE.Vector3().crossVectors(end, perp).normalize();

    const w1 = end.clone().multiplyScalar(0.32).addScaledVector(perp, length * 0.16);
    const w2 = end.clone().multiplyScalar(0.69).addScaledVector(perp, length * 0.095);
    const curve = new THREE.CatmullRomCurve3([hub, w1, w2, end]);

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

    const dots = [
      { mesh: null, base: w1.clone(), t: 0.32, scale: 0.95 },
      { mesh: null, base: w2.clone(), t: 0.69, scale: 0.78 },
    ];
    dots.forEach((dot) => {
      dot.mesh = new THREE.Mesh(
        waypointGeometry,
        new THREE.MeshBasicMaterial({ color: COL_BRANCH.clone(), transparent: true, opacity: 0.8, depthWrite: false })
      );
      dot.mesh.position.copy(dot.base);
      rig.add(dot.mesh);
    });

    // The wake: specks strung along the branch itself, crowded toward
    // the centre and drifting further off-line as they go out. Their
    // positions come from the branch, so they can't be lopsided, and
    // they ride the sway with it.
    for (let k = 1; k <= WAKE_PER_BRANCH; k++) {
      const t = WAKE_FROM + (WAKE_TO - WAKE_FROM) * Math.pow(k / (WAKE_PER_BRANCH + 1), WAKE_BIAS);
      const on = curve.getPoint(t);
      const side = k % 2 === 0 ? 1 : -1;
      on.addScaledVector(perp, WAKE_OFFSET * side * (0.35 + t * 1.1));

      const directions = [];
      for (let q = 0; q < PARTICLES_PER_SPECK; q++) {
        const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        if (v.lengthSq() < 0.0001) v.set(1, 0, 0);
        v.normalize().multiplyScalar(0.14 + Math.random() * 0.34);
        directions.push(v);
      }
      wakeSpecks.push({
        base: on, t: t, branchIndex: i, directions: directions,
        scale: 0.62 + 0.5 * (1 - t), spray: 0,
      });
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
    n._end = end.clone();
    n._index = i;

    const period1 = SWAY_PERIOD[0] + Math.random() * (SWAY_PERIOD[1] - SWAY_PERIOD[0]);
    const period2 = SWAY_PERIOD[0] + Math.random() * (SWAY_PERIOD[1] - SWAY_PERIOD[0]);
    branches.push({
      curve: curve, resting: resting, emphasised: emphasised, dots: dots, weight: 0,
      samplePoints: curve.getPoints(48), // for the converge effect below to search against
      swayA: perp.clone(), swayB: perp2,
      amp: SWAY * length,
      w1: (Math.PI * 2) / period1, w2: (Math.PI * 2) / period2,
      p1: Math.random() * Math.PI * 2, p2: Math.random() * Math.PI * 2,
      jitterAmp: 0, jitterPhase: 0,
    });
  });

  const wake = speckBatch(wakeSpecks.length * PARTICLES_PER_SPECK, 12);

  // ============================================================
  // THE CLOUD — out past the diagram and past the frame
  // ============================================================
  const cloud = speckBatch(CLOUD_COUNT, CLOUD_OUTER * 1.6);
  const cloudParticles = [];

  function placeCloudParticle(particle) {
    // Uniform on a sphere, then pulled out along z so the cloud is a
    // volume the diagram sits inside rather than a ring around it.
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const ring = Math.sqrt(Math.max(0, 1 - u * u));
    const radius = CLOUD_INNER + Math.pow(Math.random(), 0.65) * (CLOUD_OUTER - CLOUD_INNER);
    particle.x = Math.cos(theta) * ring * radius;
    particle.y = u * radius;
    particle.z = Math.sin(theta) * ring * radius * CLOUD_DEPTH;
    // Near the centre they read larger, further out smaller.
    const reach = Math.sqrt(particle.x * particle.x + particle.y * particle.y + particle.z * particle.z);
    const nearness = Math.max(0, Math.min(1, 1 - (reach - CLOUD_INNER) / (CLOUD_OUTER - CLOUD_INNER)));
    particle.size = SPECK_SIZE * (0.42 + 0.78 * nearness * nearness);
  }

  for (let i = 0; i < CLOUD_COUNT; i++) {
    const particle = { x: 0, y: 0, z: 0, size: 0, life: 0, rate: 0, converge: 0, nx: 0, ny: 0, nz: 0 };
    placeCloudParticle(particle);
    particle.rate = 1 / (CLOUD_LIFE[0] + Math.random() * (CLOUD_LIFE[1] - CLOUD_LIFE[0]));
    particle.life = Math.random(); // scattered through their cycles at the start
    particle.nx = particle.x; particle.ny = particle.y; particle.nz = particle.z;
    cloudParticles.push(particle);
  }

  // ============================================================
  // THE GREY WORDS — on fixed points, so they hold still
  // ============================================================
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  ATMOSPHERE_LABELS.forEach((word, i) => {
    const count = Math.max(1, ATMOSPHERE_LABELS.length);
    const u = 1 - ((i + 0.5) / count) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - u * u));
    const theta = i * GOLDEN_ANGLE * 2.5;
    const p = new THREE.Vector3(Math.cos(theta) * ring, u, Math.sin(theta) * ring).multiplyScalar(GHOST_RADIUS);
    const anchorObj = new THREE.Object3D();
    anchorObj.position.copy(p);
    rig.add(anchorObj);
    const el = document.createElement("div");
    el.className = "node3d-ghost";
    el.textContent = word;
    labelLayer.appendChild(el);
    ghosts.push({ el: el, anchor: anchorObj });
  });

  // ============================================================
  // POINTER
  // ============================================================
  const raycaster = new THREE.Raycaster();
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
      if (e.detail !== 0 && dragDistance > 6) { e.preventDefault(); return; }
      if (n.preview) { e.preventDefault(); openPreview(n); }
    });
  });

  // ============================================================
  // SIZING
  // ============================================================
  let penWeight = 1;

  function prepareTube(mesh) {
    mesh.userData.base = new Float32Array(mesh.geometry.attributes.position.array);
    mesh.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
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

    // Matches the convention the stock points material uses, so the
    // sizes in the tuning block keep meaning what they meant.
    const scale = h * renderer.getPixelRatio() * 0.5;
    const ceiling = 9 * renderer.getPixelRatio();
    wake.points.material.uniforms.uScale.value = scale;
    cloud.points.material.uniforms.uScale.value = scale;
    wake.points.material.uniforms.uMaxSize.value = ceiling;
    cloud.points.material.uniforms.uMaxSize.value = ceiling;

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
  // NODE CLICK PREVIEW (trial: Scent descriptions)
  // Opens from the clicked node's screen position, on a layer that
  // sits visually forward of the map, while the rest of the page
  // defocuses behind it. See openPreview() usage in the click
  // handler above.
  // ============================================================
  let previewOpen = false;
  let activePreview = null;

  function openPreview(node) {
    if (previewOpen) return;
    previewOpen = true;
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
      '<a class="node-preview-button" href="' + node.href + '">Enter</a>';
    modal.style.left = originX + "px";
    modal.style.top = originY + "px";
    modal.style.transform = "translate(-50%, -50%) scale(0.06)";
    modal.style.opacity = "0";

    document.body.appendChild(backdrop);
    document.body.appendChild(layer);
    document.body.appendChild(modal);
    void modal.offsetWidth; // force layout so the start state registers before animating

    requestAnimationFrame(() => {
      arm.classList.add("open");
      modal.style.left = "50%";
      modal.style.top = "50%";
      modal.style.transform = "translate(-50%, -50%) scale(1)";
      modal.style.opacity = "1";
    });

    modal.querySelector(".node-preview-close").addEventListener("click", closePreview);
    activePreview = { modal, arm, backdrop, layer, originX, originY };
  }

  function closePreview() {
    if (!previewOpen || !activePreview) return;
    const { modal, arm, backdrop, layer, originX, originY } = activePreview;
    modal.style.left = originX + "px";
    modal.style.top = originY + "px";
    modal.style.transform = "translate(-50%, -50%) scale(0.06)";
    modal.style.opacity = "0";
    arm.classList.remove("open");
    document.body.classList.remove("preview-open");
    previewOpen = false;
    setTimeout(() => { modal.remove(); layer.remove(); backdrop.remove(); }, 700);
    activePreview = null;
  }
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && previewOpen) closePreview(); });

  // ============================================================
  // FRAME LOOP
  // ============================================================
  const worldPos = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const scratch = new THREE.Vector3();
  const swayVec = new THREE.Vector3();
  const invRig = new THREE.Matrix4();
  const rayOrigin = new THREE.Vector3();
  const rayDir = new THREE.Vector3();
  const corrAxis = new THREE.Vector3();
  const field = [];

  let clock = 0;
  let arrival = 0;
  let lastRoll = 0;
  let lastFrame = performance.now();

  // A triangle wave: sharp corners rather than a rolling curve, which
  // is the difference between corrugated and merely wavy.
  function zigzag(x) {
    const f = x - Math.floor(x);
    return 4 * Math.abs(f - 0.5) - 1;
  }

  // Where a point at t along this branch has been carried to.
  function swayAt(branch, t, out) {
    const taper = Math.pow(t, SWAY_TAPER) * branch.amp;
    const a = Math.sin(clock * branch.w1 + branch.p1) * taper;
    const b = Math.sin(clock * branch.w2 + branch.p2) * taper;
    out.set(0, 0, 0).addScaledVector(branch.swayA, a).addScaledVector(branch.swayB, b);
    return out;
  }

  const perRing = TUBE_SIDES + 1;
  function bendTube(branch, mesh) {
    const base = mesh.userData.base;
    const attr = mesh.geometry.attributes.position;
    const array = attr.array;

    for (let ring = 0; ring <= TUBE_SEGMENTS; ring++) {
      const t = ring / TUBE_SEGMENTS;
      swayAt(branch, t, swayVec);

      // the cursor's corrugation, only near where it is pointing
      let corr = 0;
      if (branch.jitterAmp > 0) {
        const i0 = ring * perRing * 3;
        scratch.set(base[i0], base[i0 + 1], base[i0 + 2]).sub(rayOrigin);
        const along = scratch.dot(rayDir);
        if (along > 0) {
          scratch.addScaledVector(rayDir, -along);
          const d = scratch.length();
          if (d < CORR_REACH) {
            const falloff = 1 - d / CORR_REACH;
            corr = CORR_HEIGHT * penWeight * falloff * falloff * branch.jitterAmp *
              zigzag(t * CORR_PITCH + branch.jitterPhase);
          }
        }
      }

      const ox = swayVec.x + corrAxis.x * corr;
      const oy = swayVec.y + corrAxis.y * corr;
      const oz = swayVec.z + corrAxis.z * corr;
      for (let j = 0; j < perRing; j++) {
        const idx = (ring * perRing + j) * 3;
        array[idx] = base[idx] + ox;
        array[idx + 1] = base[idx + 1] + oy;
        array[idx + 2] = base[idx + 2] + oz;
      }
    }
    attr.needsUpdate = true;
  }

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, (now - lastFrame) / 1000) || 0.016;
    lastFrame = now;
    clock += dt;

    const target = window.__p23 === undefined ? 1 : window.__p23;
    arrival += (target - arrival) * 0.18;
    wrap.style.opacity = arrival.toFixed(3);

    if (!dragging) {
      // Hovering a node, or having its preview window open, holds the
      // whole map still rather than letting it keep drifting under you.
      const idle = (activeBranch >= 0 || previewOpen) ? 0 : IDLE_SPEED;
      velY += (idle - velY) * 0.012;
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
    const hit = raycaster.intersectObject(wake.points)[0];
    const hovered = hit ? Math.floor(hit.index / PARTICLES_PER_SPECK) : -1;

    let strongest = 0, runnerUp = 0;
    branches.forEach((branch, i) => {
      const goal = i === activeBranch ? 1 : 0;
      branch.weight += (goal - branch.weight) * 0.12;
      if (branch.weight > strongest) { runnerUp = strongest; strongest = branch.weight; }
      else if (branch.weight > runnerUp) { runnerUp = branch.weight; }
    });
    const stepBack = (branch) => (branch.weight >= strongest ? runnerUp : strongest);

    // --- re-roll the jitter a few times a second, and work out where
    // the cursor is pointing inside the map's own frame of reference
    invRig.copy(rig.matrixWorld).invert();
    if (pointerLive && arrival > 0.5 && !REDUCE_MOTION) {
      rayOrigin.copy(raycaster.ray.origin).applyMatrix4(invRig);
      rayDir.copy(raycaster.ray.direction).transformDirection(invRig);
    } else {
      rayOrigin.set(0, 0, 9999);
      rayDir.set(0, 0, 1);
    }
    corrAxis.set(0, 1, 0).transformDirection(invRig);
    if (now - lastRoll > CORR_ROLL_MS) {
      lastRoll = now;
      branches.forEach((branch) => {
        branch.jitterAmp = REDUCE_MOTION ? 0 : 0.35 + Math.random() * 0.65;
        branch.jitterPhase = Math.random() * 10;
      });
    }

    // --- every branch bends every frame now: the sway is always on
    branches.forEach((branch) => {
      bendTube(branch, branch.resting);
      if (branch.weight > 0.02) bendTube(branch, branch.emphasised);
      branch.dots.forEach((dot) => {
        swayAt(branch, dot.t, swayVec);
        dot.mesh.position.copy(dot.base).add(swayVec);
      });
    });
    REAL_NODES.forEach((n, i) => {
      swayAt(branches[i], 1, swayVec);
      n._anchor.position.copy(n._end).add(swayVec);
    });
    rig.updateMatrixWorld(true);

    // --- the wake rides the sway, and sprays where it is pointed at
    if (!previewOpen) {
    for (let s = 0; s < wakeSpecks.length; s++) {
      const speck = wakeSpecks[s];
      const goal = s === hovered ? 1 : 0;
      const rate = goal > speck.spray ? 0.17 : 0.045;
      speck.spray += (goal - speck.spray) * rate;

      const branch = branches[speck.branchIndex];
      swayAt(branch, speck.t, swayVec);
      const mine = branch.weight;
      const back = stepBack(branch);
      const size = SPECK_SIZE * speck.scale * penWeight * (1 - 0.4 * speck.spray);
      const alpha = 0.9 * (1 - speck.spray * 0.95) * (1 - 0.5 * back) * (1 + 0.35 * mine);

      for (let q = 0; q < PARTICLES_PER_SPECK; q++) {
        const idx = s * PARTICLES_PER_SPECK + q;
        const dir = speck.directions[q];
        wake.position.setXYZ(idx,
          speck.base.x + swayVec.x + dir.x * speck.spray,
          speck.base.y + swayVec.y + dir.y * speck.spray,
          speck.base.z + swayVec.z + dir.z * speck.spray);
        wake.size.array[idx] = size;
        wake.fade.array[idx] = alpha;
        wake.tint.array[idx] = mine;
      }
    }
    wake.position.needsUpdate = true;
    wake.size.needsUpdate = true;
    wake.fade.needsUpdate = true;
    wake.tint.needsUpdate = true;
    }

    // --- the cloud: each speck fades up, holds, fades away, and comes
    // back somewhere else entirely. Slowly enough that you shouldn't
    // catch any one of them doing it. Hovering a node's branch pulls
    // nearby specks in against it — that gathering is what reads as
    // the branch going bold, more than the branch's own thickness does.
    if (!previewOpen) {
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const particle = cloudParticles[i];
      particle.life += particle.rate * dt;
      if (particle.life >= 1) {
        particle.life -= 1;
        placeCloudParticle(particle);
        particle.rate = 1 / (CLOUD_LIFE[0] + Math.random() * (CLOUD_LIFE[1] - CLOUD_LIFE[0]));
      }

      let targetConverge = 0;
      if (activeBranch >= 0) {
        const pts = branches[activeBranch].samplePoints;
        let nearestD2 = Infinity, nx = particle.x, ny = particle.y, nz = particle.z;
        for (let k = 0; k < pts.length; k++) {
          const dx = pts[k].x - particle.x, dy = pts[k].y - particle.y, dz = pts[k].z - particle.z;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < nearestD2) { nearestD2 = d2; nx = pts[k].x; ny = pts[k].y; nz = pts[k].z; }
        }
        const dist = Math.sqrt(nearestD2);
        if (dist < CONVERGE_REACH) {
          targetConverge = 1 - dist / CONVERGE_REACH;
          particle.nx = nx; particle.ny = ny; particle.nz = nz;
        }
      }
      particle.converge += (targetConverge - particle.converge) * 0.07;

      const l = particle.life;
      // in over the first third, out over the last third
      let visible;
      if (l < 0.33) visible = l / 0.33;
      else if (l > 0.67) visible = (1 - l) / 0.33;
      else visible = 1;
      visible = visible * visible * (3 - 2 * visible);

      const pull = particle.converge * 0.82;
      cloud.position.setXYZ(i,
        particle.x + (particle.nx - particle.x) * pull,
        particle.y + (particle.ny - particle.y) * pull,
        particle.z + (particle.nz - particle.z) * pull);
      cloud.size.array[i] = particle.size * penWeight;
      cloud.fade.array[i] = 0.62 * visible * (1 - 0.5 * strongest) + particle.converge * 0.3;
    }
    cloud.position.needsUpdate = true;
    cloud.size.needsUpdate = true;
    cloud.fade.needsUpdate = true;
    }

    branches.forEach((branch) => {
      const w = branch.weight;
      const back = stepBack(branch);
      branch.emphasised.material.opacity = 0.6 * w;   // was 0.88 — less emphatic
      branch.resting.material.opacity = 0.78 * (1 - 0.45 * back);
      branch.resting.material.color.copy(COL_BRANCH).lerp(COL_INK, w * 0.6); // was a full lerp to w
      branch.dots.forEach((dot) => {
        dot.mesh.material.opacity = 0.8 * (1 - 0.5 * back);
        dot.mesh.material.color.copy(COL_BRANCH).lerp(COL_INK, w);
        dot.mesh.scale.setScalar(dot.scale * penWeight * (1 + 0.45 * w));
      });
    });

    const breathe = REDUCE_MOTION ? 1 : 1 + Math.sin(clock * 0.55) * 0.035;
    shellInner.scale.setScalar(breathe);
    shellOuter.scale.setScalar(1 + (breathe - 1) * 1.8);

    // --- place the HTML labels, and publish where the map's masses
    // are so paper.js can bend the grid around them
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const rect = wrap.getBoundingClientRect();
    field.length = 0;

    REAL_NODES.forEach((n, i) => {
      n._anchor.getWorldPosition(worldPos);
      projected.copy(worldPos).project(camera);
      const x = (projected.x * 0.5 + 0.5) * w;
      const y = (-projected.y * 0.5 + 0.5) * h;
      n._lastScreenX = rect.left + x;
      n._lastScreenY = rect.top + y;
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
      const depth = (projected.z + 1) / 2;
      ghost.el.style.transform =
        "translate(" + ((projected.x * 0.5 + 0.5) * w) + "px," + ((-projected.y * 0.5 + 0.5) * h) + "px)" +
        " translate(14px, -50%)";
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

  requestAnimationFrame(animate);
})();
