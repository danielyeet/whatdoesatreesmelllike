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

// Positions are a Fibonacci sphere: seven points spaced as evenly as
// seven points can be on a sphere, rather than the near-flat ring they
// used to be. z now carries as much of the arrangement as x and y do,
// so branches genuinely leave the centre in every direction.
//
// If you move one by hand, keep it roughly 3.2 to 3.7 from the centre,
// and keep its y clear of 0 — a node sitting on the equator slides
// straight across the middle of the screen on every rotation.
const REAL_NODES = [
  {
    label: "Scent descriptions", sub: "notes on things I've smelled and tried to describe",
    href: "categories/scent-descriptions.html", pos: [1.57, 2.62, 0.0],
    preview: { description: "Here I describe things, from scents to houses to notes to anything else." },
  },
  { label: "Theories", sub: "half-formed ideas I keep coming back to", href: "categories/theories.html", pos: [-2.09, 1.97, 1.91] },
  { label: "Favorites", sub: "things I like, no other reason needed", href: "categories/favorites.html", pos: [0.27, 0.93, -3.1] },
  { label: "Other", sub: "whatever doesn't fit anywhere else", href: "categories/other-1.html", pos: [1.78, 1.0, 2.33] },
  { label: "Other", sub: "the other other pile", href: "categories/other-2.html", pos: [-3.25, -0.99, -0.57] },
  { label: "Test node", sub: "a working sandbox node — safe to repurpose", href: "works/test-node-a.html", pos: [2.26, -1.86, -1.43] },
  { label: "Test node", sub: "a second sandbox node", href: "works/test-node-b.html", pos: [-0.4, -2.62, 1.52] },
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
      // Built as elements with their text set separately, rather than by
      // pasting the label into a string of HTML. Pasted text stops being
      // text the moment it contains a character HTML cares about — a "<"
      // or a quote in a label would break the markup around it — and the
      // whole point of REAL_NODES is that you can write anything in it.
      const strong = document.createElement("strong");
      strong.textContent = n.label;
      const span = document.createElement("span");
      span.textContent = n.sub;
      a.append(strong, span);
      list.appendChild(a);
    });
    wrap.replaceWith(list);
    return;
  }

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // TUNING
  // ============================================================
  const IDLE_SPEED = REDUCE_MOTION ? 0 : 0.00024; // was 0.00018 — a slightly quicker drift
  const DRAG_SENSITIVITY = 0.0026;
  const MAX_SPIN = 0.04;
  // No tilt limit any more: the map turns freely in every direction.
  const EMERGE_STAGGER = 0.35;  // how much later the last branch leaves than the first
  const EMERGE_OVERSHOOT = 1.15;// >0 gives them a slight sail past their mark
  // A touch more room than before: turning freely means a node can now
  // swing to the top or bottom of its arc while also sitting near the
  // camera, which throws it further out than the old limited tilt ever
  // could. This keeps the worst case comfortably on screen.
  const FRAME_V = 4.5;          // room the map is given — larger draws it smaller
  const FRAME_H = 4.9;

  // Sway is disabled — the map spins as a rigid whole, nothing sways
  // independently. Set this back above 0 to bring it back.
  const SWAY = 0;               // tip wander, as a fraction of branch length
  const SWAY_PERIOD = [6, 10];  // seconds per cycle, picked per branch
  const SWAY_TAPER = 1.6;       // >1 keeps the movement out at the tip

  // The corrugation the cursor drags across a branch: a sharp zigzag
  // whose height and position are re-rolled several times a second,
  // so it reads as jitter and not as a wave travelling along a wire.
  const CORR_REACH = 1.15;      // how near the cursor has to be, in scene units
  const CORR_HEIGHT = 0.034;    // how far it throws the line at the very centre of it
  const CORR_PITCH = 34;        // corrugations along the length of a branch
  const CORR_ROLL_MS = 45;      // how often the jitter is re-rolled

  const WAKE_PER_BRANCH = 7;
  const WAKE_OFFSET = 0.17;
  const WAKE_BIAS = 1.45;
  const WAKE_FROM = 0.19;
  const WAKE_TO = 0.95;
  const PARTICLES_PER_SPECK = 9;

  // The drifting background specks are off. The machinery is left in
  // place — put a count back here to bring them back.
  const CLOUD_COUNT = 0;
  const CLOUD_INNER = 2.6;      // starts outside the diagram
  const CLOUD_OUTER = 7.4;      // and runs well past the edges of the screen
  const CLOUD_DEPTH = 1.45;     // extra spread along z, out of the diagram's plane
  const CLOUD_LIFE = [11, 27];  // seconds for one fade-in, hold, fade-out
  const CONVERGE_REACH = 1.7;   // how far a cloud particle will travel to join a hovered branch

  const SPECK_SIZE = 0.072;
  const BRANCH_RADIUS = 0.0075;
  const BRANCH_RADIUS_EMPH = 0.012; // was 0.017 — a smaller jump from resting to hovered
  const TUBE_SEGMENTS = 96;
  const TUBE_SIDES = 8;
  const REF_PX_PER_UNIT = 94;

  // A short tapered collar at the hub end of every branch, widening
  // from the tube's own thin radius out to something the core and its
  // halo can absorb — without it a branch reads as a wire poked into a
  // ball rather than something growing out of it.
  const ROOT_FLARE_RADIUS = 0.085; // how wide it gets at the hub end
  const ROOT_FLARE_LENGTH = 0.24;  // how far out it reaches before handing off to the plain tube

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

  // ============================================================
  // THE CENTRE
  // ============================================================
  // CORE_RADIUS is the solid dark sphere at the middle; the two shells
  // are the soft halo around it. Change the first number and the others
  // follow — they're written as multiples of it on purpose.
  const CORE_RADIUS = 0.16;     // was 0.097 — a more present centre
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(CORE_RADIUS, 32, 32),
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
  const shellInner = shell(CORE_RADIUS * 2.37, 0.24);
  const shellOuter = shell(CORE_RADIUS * 5.15, 0.09);

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

    // A short tapered collar at the hub end, widening from the tube's
    // own thin radius out to something the core's halo can absorb —
    // otherwise a branch reads as a wire poked into a ball rather than
    // something growing out of it. Open-ended: both its ends are meant
    // to disappear, one into the core, one into the tube.
    const rootFlare = new THREE.Mesh(
      new THREE.CylinderGeometry(BRANCH_RADIUS, ROOT_FLARE_RADIUS, ROOT_FLARE_LENGTH, 12, 1, true)
        .translate(0, ROOT_FLARE_LENGTH / 2, 0),
      new THREE.MeshBasicMaterial({ color: COL_BRANCH.clone(), transparent: true, opacity: 0.78, depthWrite: false })
    );
    rootFlare.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(0));
    rig.add(rootFlare);

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

    // The wake: specks scattered around the branch, crowded toward the
    // centre and drifting further off it as they go out. Their positions
    // come from the branch, so they can't be lopsided, and they ride the
    // sway with it.
    //
    // They sit at a random angle all the way around the branch rather
    // than being nudged to one side of it: perp and perp2 are the two
    // directions across the branch, so a sine and cosine of one random
    // angle places a speck anywhere on the ring around it. Offsetting
    // along perp alone — which is what this used to do — left every
    // speck on a single flat plane through the branch, and the map
    // gave that away the moment it turned.
    for (let k = 1; k <= WAKE_PER_BRANCH; k++) {
      const even = WAKE_FROM + (WAKE_TO - WAKE_FROM) * Math.pow(k / (WAKE_PER_BRANCH + 1), WAKE_BIAS);
      // A little scatter along the branch too, so they don't read as
      // evenly spaced rings once they're no longer in a line.
      const t = Math.min(0.99, Math.max(0.05, even + (Math.random() - 0.5) * 0.06));
      const onCurve = curve.getPoint(t);
      const angle = Math.random() * Math.PI * 2;
      const spread = WAKE_OFFSET * (0.35 + t * 1.1) * (0.5 + Math.random() * 0.95);
      const on = onCurve.clone()
        .addScaledVector(perp, Math.cos(angle) * spread)
        .addScaledVector(perp2, Math.sin(angle) * spread);

      const directions = [];
      for (let q = 0; q < PARTICLES_PER_SPECK; q++) {
        const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        if (v.lengthSq() < 0.0001) v.set(1, 0, 0);
        v.normalize().multiplyScalar(0.14 + Math.random() * 0.34);
        directions.push(v);
      }
      wakeSpecks.push({
        base: on, onCurve: onCurve, t: t, branchIndex: i, directions: directions,
        scale: 0.62 + 0.5 * (1 - t), spray: 0, converge: 0,
      });
    }

    const anchorObj = new THREE.Object3D();
    anchorObj.position.copy(end);
    rig.add(anchorObj);

    const a = document.createElement("a");
    a.href = n.href;
    a.className = "node3d-label";
    // Elements built and filled with textContent rather than pasted into
    // a string of HTML — see the note on the fallback list above.
    const mark = document.createElement("span");
    mark.className = "node3d-mark";
    const textEl = document.createElement("span");
    textEl.className = "node3d-text";
    textEl.textContent = n.label;
    const subEl = document.createElement("span");
    subEl.className = "node3d-sub";
    subEl.textContent = n.sub;
    a.append(mark, textEl, subEl);
    labelLayer.appendChild(a);

    n._el = a;
    n._anchor = anchorObj;
    n._end = end.clone();
    n._index = i;

    const period1 = SWAY_PERIOD[0] + Math.random() * (SWAY_PERIOD[1] - SWAY_PERIOD[0]);
    const period2 = SWAY_PERIOD[0] + Math.random() * (SWAY_PERIOD[1] - SWAY_PERIOD[0]);
    branches.push({
      emerge: 0,
      curve: curve, resting: resting, emphasised: emphasised, rootFlare: rootFlare, dots: dots, weight: 0,
      samplePoints: curve.getPoints(48), // for the converge effect below to search against
      armSamples: curve.getPoints(64),   // a finer trace, for the preview arm
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
  const cloud = CLOUD_COUNT > 0 ? speckBatch(CLOUD_COUNT, CLOUD_OUTER * 1.6) : null;
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
    if (cloud) {
      cloud.points.material.uniforms.uScale.value = scale;
      cloud.points.material.uniforms.uMaxSize.value = 9 * renderer.getPixelRatio();
    }
    const ceiling = 9 * renderer.getPixelRatio();
    wake.points.material.uniforms.uScale.value = scale;
    wake.points.material.uniforms.uMaxSize.value = ceiling;

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
  //
  // The arm that reaches the window IS the node's own branch — not a
  // second curve drawn alongside it, which is what it used to be and
  // why two lines appeared. While the window is open the 3D tube for
  // that branch is faded out and an SVG ribbon takes its place,
  // traced from the very same curve (projected to the screen every
  // frame, sway included), then carried on past the node and out to
  // the window along the tangent it was already travelling — so
  // there is no kink where the branch ends and the reach begins.
  //
  // The ribbon is a filled shape rather than a stroked line so it can
  // taper: thin and pale where it leaves the centre, full weight
  // where it docks against the window. The fade runs the same way, so
  // the arm reads as coming forward out of the background rather than
  // lying flat across it.
  // ============================================================
  const SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    for (const key in attrs) el.setAttribute(key, attrs[key]);
    return el;
  }

  const PREVIEW_MARGIN = 64;
  const ARM_WIDTH_HUB = 0.62;   // half-width where it leaves the centre
  const ARM_WIDTH_DOCK = 2.6;   // and where it meets the window
  const ARM_REACH_STEPS = 20;   // how finely the last stretch is drawn
  const ARM_MARK_GAP = 13;      // how far off the window the end mark stands
  const DOCK_BAR = 34;          // the notch it lands in, on the window's edge

  let previewOpen = false;
  let previewNodeIndex = -1;
  let activePreview = null;
  let armIndex = -1;            // the branch currently standing in as the arm
  let armMix = 0;               // 0 = drawn as its 3D tube, 1 = drawn as the ribbon

  function openPreview(node) {
    if (previewOpen) return;
    previewOpen = true;
    previewNodeIndex = node._index;
    armIndex = node._index;
    document.body.classList.add("preview-open");

    const originX = node._lastScreenX || window.innerWidth / 2;
    const originY = node._lastScreenY || window.innerHeight / 2;
    const onLeft = originX < window.innerWidth / 2;

    const backdrop = document.createElement("div");
    backdrop.className = "node-preview-backdrop";
    backdrop.addEventListener("click", closePreview);
    document.body.appendChild(backdrop); // it was being built and never added

    const modal = document.createElement("div");
    modal.className = "node-preview-modal dark-surface";
    // The fixed chrome (close button, image placeholder) is a constant
    // string, so it's safe to set as markup in one go. The two pieces
    // that come from REAL_NODES — the description and the link — are
    // attached afterwards as text and as a property, so a quote or an
    // angle bracket in either one stays harmless punctuation instead of
    // breaking the window it's being written into.
    modal.innerHTML =
      '<button class="node-preview-close" type="button" aria-label="Close preview">' +
        '<span class="node-preview-close-mark" aria-hidden="true"></span>' +
        '<span class="node-preview-close-word">Close</span>' +
      "</button>" +
      '<div class="node-preview-media"></div>';

    const desc = document.createElement("p");
    desc.className = "node-preview-desc";
    desc.textContent = node.preview.description;

    const enter = document.createElement("a");
    enter.className = "node-preview-button";
    enter.href = node.href;
    enter.textContent = "Enter";

    modal.append(desc, enter);
    modal.style.left = originX + "px";
    modal.style.top = originY + "px";
    modal.style.transform = "translate(-50%, -50%) scale(0.06)";
    modal.style.opacity = "0";
    document.body.appendChild(modal);

    const modalWidth = Math.min(480, window.innerWidth * 0.88); // matches the CSS width rule exactly
    const finalLeft = onLeft ? PREVIEW_MARGIN : window.innerWidth - PREVIEW_MARGIN - modalWidth;
    // The arm now reaches the window's edge instead of stopping short.
    const dockX = onLeft ? finalLeft + modalWidth : finalLeft;
    const dockY = window.innerHeight / 2;

    const svg = svgEl("svg", { class: "node-preview-arm-svg", "aria-hidden": "true" });
    const defs = svgEl("defs", {});
    const gradientId = "arm-fade-" + Math.random().toString(36).slice(2, 8);
    const gradient = svgEl("linearGradient", { id: gradientId, gradientUnits: "userSpaceOnUse" });
    // All but gone at the centre, full ink at the window.
    [
      // It recedes toward the centre but never disappears into it —
      // the arm has to stay readable all the way back to the hub.
      { offset: "0", color: "#8b877e", opacity: "0.34" },
      { offset: "0.3", color: "#77736a", opacity: "0.48" },
      { offset: "0.62", color: "#524f47", opacity: "0.72" },
      { offset: "0.85", color: "#33332b", opacity: "0.9" },
      { offset: "1", color: "#22221a", opacity: "1" },
    ].forEach((stop) => {
      gradient.appendChild(svgEl("stop", {
        offset: stop.offset, "stop-color": stop.color, "stop-opacity": stop.opacity,
      }));
    });
    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Anything of the arm that falls behind the window is cut away —
    // white shows, black hides, and the black rectangle tracks the
    // window as it flies in. Only the ribbon is masked: the fittings
    // at the dock sit on the window's edge on purpose.
    const maskId = "arm-cut-" + Math.random().toString(36).slice(2, 8);
    const mask = svgEl("mask", { id: maskId, maskUnits: "userSpaceOnUse" });
    const maskShow = svgEl("rect", { x: 0, y: 0, fill: "#fff" });
    const maskCut = svgEl("rect", { fill: "#000" });
    mask.appendChild(maskShow);
    mask.appendChild(maskCut);
    defs.appendChild(mask);

    const ribbon = svgEl("path", { class: "node-preview-arm-path", mask: "url(#" + maskId + ")" });
    ribbon.style.fill = "url(#" + gradientId + ")";
    ribbon.style.stroke = "none";
    svg.appendChild(ribbon);

    // Where the arm meets the window: a notch in the edge, a short
    // stub, and the same registration mark the nodes themselves use —
    // so it reads as docked into the window rather than pointing at it.
    const dockStub = svgEl("line", { class: "node-preview-dock-stub" });
    const dockLine = svgEl("line", { class: "node-preview-dock-bar" });
    const dockMark = svgEl("rect", { class: "node-preview-dock-mark", width: 11, height: 11 });
    const dockDot = svgEl("rect", { class: "node-preview-dock-dot", width: 3, height: 3 });
    svg.appendChild(dockStub);
    svg.appendChild(dockLine);
    svg.appendChild(dockMark);
    svg.appendChild(dockDot);
    document.body.appendChild(svg);

    void modal.offsetWidth; // force layout so the start state registers before animating

    requestAnimationFrame(() => {
      modal.style.left = finalLeft + "px";
      modal.style.top = "50%";
      modal.style.transform = "translate(0%, -50%) scale(1)";
      modal.style.opacity = "1";
    });

    modal.querySelector(".node-preview-close").addEventListener("click", closePreview);
    activePreview = {
      modal: modal, svg: svg, ribbon: ribbon, gradient: gradient,
      dockStub: dockStub, dockLine: dockLine, dockMark: dockMark, dockDot: dockDot,
      maskShow: maskShow, maskCut: maskCut,
      backdrop: backdrop, originX: originX, originY: originY,
      dockX: dockX, dockY: dockY, onLeft: onLeft,
    };
  }

  function closePreview() {
    if (!previewOpen || !activePreview) return;
    const preview = activePreview;
    preview.modal.style.left = preview.originX + "px";
    preview.modal.style.top = preview.originY + "px";
    preview.modal.style.transform = "translate(-50%, -50%) scale(0.06)";
    preview.modal.style.opacity = "0";
    document.body.classList.remove("preview-open");
    previewOpen = false;
    previewNodeIndex = -1;
    // activePreview is deliberately kept until the elements are gone,
    // so the frame loop can keep easing the ribbon out while the tube
    // fades back in underneath it. Dropping it here showed both at
    // once on the way out — the same doubling, in reverse.
    setTimeout(() => {
      preview.modal.remove();
      preview.svg.remove();
      preview.backdrop.remove();
      if (activePreview === preview) activePreview = null;
    }, 700);
  }
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && previewOpen) closePreview(); });

  // ------------------------------------------------------------
  // Tracing the arm, every frame
  // ------------------------------------------------------------
  const armPoints = [];

  function armRibbonPath(points, reveal) {
    const count = points.length;
    const shown = Math.max(3, Math.round(count * reveal));
    const left = [], right = [];
    for (let i = 0; i < shown; i++) {
      const p = points[i];
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(count - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y;
      const len = Math.hypot(tx, ty) || 1;
      tx /= len; ty /= len;
      const s = i / (count - 1);
      const half = ARM_WIDTH_HUB + (ARM_WIDTH_DOCK - ARM_WIDTH_HUB) * Math.pow(s, 1.35);
      left.push({ x: p.x - ty * half, y: p.y + tx * half });
      right.push({ x: p.x + ty * half, y: p.y - tx * half });
    }
    // One closed outline, drawn with quadratics through the midpoints
    // rather than straight segments between them — that is what takes
    // the faceting out of the edge.
    const loop = left.concat(right.reverse());
    let d = "M " + loop[0].x.toFixed(1) + " " + loop[0].y.toFixed(1);
    for (let i = 1; i <= loop.length; i++) {
      const cur = loop[i % loop.length];
      const next = loop[(i + 1) % loop.length];
      d += " Q " + cur.x.toFixed(1) + " " + cur.y.toFixed(1) +
           " " + ((cur.x + next.x) / 2).toFixed(1) + " " + ((cur.y + next.y) / 2).toFixed(1);
    }
    return d + " Z";
  }

  function updateArm() {
    if (armIndex < 0) return;
    const target = previewOpen ? 1 : 0;
    armMix += (target - armMix) * 0.12;
    if (armMix < 0.002 && !previewOpen) { armMix = 0; armIndex = -1; return; }
    if (!activePreview) return;

    const preview = activePreview;
    const branch = branches[armIndex];
    const rect = wrap.getBoundingClientRect();
    const sample = branch.armSamples;
    armPoints.length = 0;

    // 1. the branch itself, exactly as it is being drawn in 3D
    for (let i = 0; i < sample.length; i++) {
      const t = i / (sample.length - 1);
      swayAt(branch, t, swayVec);
      scratch.copy(sample[i]).multiplyScalar(branch.emerge).add(swayVec).applyMatrix4(rig.matrixWorld);
      projected.copy(scratch).project(camera);
      armPoints.push({
        x: rect.left + (projected.x * 0.5 + 0.5) * wrap.clientWidth,
        y: rect.top + (-projected.y * 0.5 + 0.5) * wrap.clientHeight,
      });
    }

    // 2. carried on to the window, leaving the node along the
    // direction the branch was already going
    const markX = preview.dockX + (preview.onLeft ? 1 : -1) * ARM_MARK_GAP;
    const tip = armPoints[armPoints.length - 1];
    const before = armPoints[armPoints.length - 2] || tip;
    let tx = tip.x - before.x, ty = tip.y - before.y;
    const tlen = Math.hypot(tx, ty) || 1;
    tx /= tlen; ty /= tlen;

    const span = Math.hypot(markX - tip.x, preview.dockY - tip.y);
    const lead = Math.max(60, span * 0.42);
    const c1x = tip.x + tx * lead, c1y = tip.y + ty * lead;
    const c2x = markX + (preview.onLeft ? 1 : -1) * lead * 0.9;
    const c2y = preview.dockY;

    for (let k = 1; k <= ARM_REACH_STEPS; k++) {
      const u = k / ARM_REACH_STEPS;
      const m = 1 - u;
      armPoints.push({
        x: m * m * m * tip.x + 3 * m * m * u * c1x + 3 * m * u * u * c2x + u * u * u * markX,
        y: m * m * m * tip.y + 3 * m * m * u * c1y + 3 * m * u * u * c2y + u * u * u * preview.dockY,
      });
    }

    // the reach draws itself out; the branch part is there from the start
    const branchShare = sample.length / armPoints.length;
    const reveal = branchShare + (1 - branchShare) * Math.min(1, armMix * 1.25);
    preview.ribbon.setAttribute("d", armRibbonPath(armPoints, reveal));

    const hubPoint = armPoints[0];
    preview.gradient.setAttribute("x1", hubPoint.x);
    preview.gradient.setAttribute("y1", hubPoint.y);
    preview.gradient.setAttribute("x2", markX);
    preview.gradient.setAttribute("y2", preview.dockY);

    const docked = Math.max(0, (armMix - 0.55) / 0.45);
    preview.dockLine.setAttribute("x1", preview.dockX);
    preview.dockLine.setAttribute("x2", preview.dockX);
    preview.dockLine.setAttribute("y1", preview.dockY - (DOCK_BAR / 2) * docked);
    preview.dockLine.setAttribute("y2", preview.dockY + (DOCK_BAR / 2) * docked);
    preview.dockStub.setAttribute("x1", markX);
    preview.dockStub.setAttribute("y1", preview.dockY);
    preview.dockStub.setAttribute("x2", preview.dockX);
    preview.dockStub.setAttribute("y2", preview.dockY);
    preview.dockMark.setAttribute("x", markX - 5.5);
    preview.dockMark.setAttribute("y", preview.dockY - 5.5);
    preview.dockDot.setAttribute("x", markX - 1.5);
    preview.dockDot.setAttribute("y", preview.dockY - 1.5);

    // keep the cut-out sitting exactly on the window, wherever it has
    // animated to this frame
    const box = preview.modal.getBoundingClientRect();
    preview.maskShow.setAttribute("width", window.innerWidth);
    preview.maskShow.setAttribute("height", window.innerHeight);
    preview.maskCut.setAttribute("x", box.left);
    preview.maskCut.setAttribute("y", box.top);
    preview.maskCut.setAttribute("width", Math.max(0, box.width));
    preview.maskCut.setAttribute("height", Math.max(0, box.height));

    preview.svg.style.opacity = String(Math.min(1, armMix * 1.4));
    preview.dockStub.style.opacity = String(docked);
    preview.dockMark.style.opacity = String(docked);
    preview.dockDot.style.opacity = String(docked);
  }

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
  const readout = {};
  const readoutNodes = [];
  const mapRadius = REAL_NODES.reduce(function (m, n) {
    return Math.max(m, Math.hypot(n.pos[0], n.pos[1], n.pos[2]));
  }, 0);
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
    // SWAY is 0 right now, which makes branch.amp 0 for every branch --
    // skip the two Math.sin() calls in that case rather than computing
    // a result that gets multiplied away to nothing. If SWAY is raised
    // above 0 later this stops applying automatically, no other change
    // needed.
    if (branch.amp === 0) return out.set(0, 0, 0);
    const taper = Math.pow(t, SWAY_TAPER) * branch.amp;
    const a = Math.sin(clock * branch.w1 + branch.p1) * taper;
    const b = Math.sin(clock * branch.w2 + branch.p2) * taper;
    out.set(0, 0, 0).addScaledVector(branch.swayA, a).addScaledVector(branch.swayB, b);
    return out;
  }

  // A node's distance from the camera barely moves projected.z off the
  // far end of its -1..1 range for a scene this small sitting this far
  // from the near/far planes -- raw NDC depth is nearly identical for
  // every node, so it was never actually distinguishing near from far
  // for label fade, z-index stacking, or the chromatogram's per-node
  // height. The camera sits on the Z axis looking straight at the
  // origin with no rotation of its own, so distance-from-camera is
  // just camera.position.z - worldPos.z, and camera.position.z cancels
  // out entirely once that's normalised against the map's own radius —
  // cheaper than going through the camera matrix, too.
  function viewDepth(worldPos) {
    return Math.min(1, Math.max(0, 0.5 - worldPos.z / (2 * mapRadius)));
  }

  const perRing = TUBE_SIDES + 1;
  // Ease with a little sail past the mark at the end, so a branch
  // arrives like something thrown rather than something slid.
  function emergeEase(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const c1 = EMERGE_OVERSHOOT, c3 = c1 + 1, p = t - 1;
    return 1 + c3 * p * p * p + c1 * p * p;
  }

  function bendTube(branch, mesh) {
    const base = mesh.userData.base;
    const em = branch.emerge;
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
          // Compare squared distance first so the sqrt only runs for
          // rings actually within reach, not for every ring of every
          // branch on every frame.
          const d2 = scratch.lengthSq();
          if (d2 < CORR_REACH * CORR_REACH) {
            const d = Math.sqrt(d2);
            const falloff = 1 - d / CORR_REACH;
            const phase = t * CORR_PITCH + branch.jitterPhase;
            // a second, differently-tuned zigzag riding on the first so
            // the spikes come out uneven rather than one clean wave
            const irregular = 0.5 + 0.5 * Math.abs(zigzag(t * CORR_PITCH * 0.43 + branch.jitterPhase * 1.9));
            corr = CORR_HEIGHT * penWeight * falloff * falloff * branch.jitterAmp * irregular * zigzag(phase);
          }
        }
      }

      const ox = swayVec.x + corrAxis.x * corr;
      const oy = swayVec.y + corrAxis.y * corr;
      const oz = swayVec.z + corrAxis.z * corr;
      for (let j = 0; j < perRing; j++) {
        const idx = (ring * perRing + j) * 3;
        array[idx] = base[idx] * em + ox;
        array[idx + 1] = base[idx + 1] * em + oy;
        array[idx + 2] = base[idx + 2] * em + oz;
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
      // No easing back to level, and no clamp below: wherever you turn
      // it to is where it stays, all the way round on either axis.
    }
    rotY += velY;
    rotX += velX;
    rig.rotation.y = rotY;
    rig.rotation.x = rotX;
    rig.updateMatrixWorld(true);

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(wake.points)[0];
    const hovered = hit ? Math.floor(hit.index / PARTICLES_PER_SPECK) : -1;

    let strongest = 0, runnerUp = 0;
    branches.forEach((branch, i) => {
      const goal = (i === activeBranch || (previewOpen && i === previewNodeIndex)) ? 1 : 0;
      branch.weight += (goal - branch.weight) * 0.12;
      if (branch.weight > strongest) { runnerUp = strongest; strongest = branch.weight; }
      else if (branch.weight > runnerUp) { runnerUp = branch.weight; }
    });
    const stepBack = (branch) => (branch.weight >= strongest ? runnerUp : strongest);

    // --- re-roll the jitter a few times a second, and work out where
    // the cursor is pointing inside the map's own frame of reference
    invRig.copy(rig.matrixWorld).invert();
    const rayLive = pointerLive && arrival > 0.5 && !REDUCE_MOTION;
    if (rayLive) {
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
    // --- how far out of the centre each branch has travelled. They
    // leave one after another rather than all at once, which is what
    // makes it read as escaping rather than as one object scaling up.
    const stagger = EMERGE_STAGGER / Math.max(1, branches.length - 1);
    branches.forEach((branch, i) => {
      branch.emerge = emergeEase((arrival - i * stagger) / (1 - EMERGE_STAGGER));
    });

    branches.forEach((branch) => {
      // Nothing can be moving this tube: it's done emerging, sway is
      // structurally off (amp is 0 unless SWAY is raised above 0), and
      // with the ray parked, corrugation is provably zero too -- so the
      // vertex buffer already holds the right positions from the last
      // frame that actually changed something, and redoing that work
      // (plus the GPU re-upload it triggers) here would be pure waste,
      // every frame, forever, for every branch. Real cost on modest
      // hardware even though nothing about it is visible.
      const settled = branch.emerge >= 0.9995 && branch.amp === 0 && !rayLive;
      if (!settled) bendTube(branch, branch.resting);
      if (branch.weight > 0.02) bendTube(branch, branch.emphasised);
      branch.dots.forEach((dot) => {
        swayAt(branch, dot.t, swayVec);
        dot.mesh.position.copy(dot.base).multiplyScalar(branch.emerge).add(swayVec);
      });
    });
    REAL_NODES.forEach((n, i) => {
      swayAt(branches[i], 1, swayVec);
      n._anchor.position.copy(n._end).multiplyScalar(branches[i].emerge).add(swayVec);
    });
    rig.updateMatrixWorld(true);

    // --- the wake rides the sway, and sprays where it is pointed at
    if (!previewOpen) {
    for (let s = 0; s < wakeSpecks.length; s++) {
      const speck = wakeSpecks[s];
      // A speck on the active branch converges onto the line instead —
      // letting it also spray apart from a direct hover hit at the same
      // time was what made it look like it was gathering into itself
      // rather than into the branch.
      const onActiveBranch = speck.branchIndex === activeBranch;
      const goal = (s === hovered && !onActiveBranch) ? 1 : 0;
      const rate = goal > speck.spray ? 0.17 : 0.045;
      speck.spray += (goal - speck.spray) * rate;

      const branch = branches[speck.branchIndex];
      const convergeGoal = onActiveBranch ? 1 : 0;
      speck.converge += (convergeGoal - speck.converge) * 0.1;

      swayAt(branch, speck.t, swayVec);
      const mine = branch.weight;
      const back = stepBack(branch);
      const size = SPECK_SIZE * speck.scale * penWeight * (1 - 0.4 * speck.spray);
      const alpha = 0.9 * (1 - speck.spray * 0.95) * (1 - 0.5 * back) * (1 + 0.35 * mine);

      // blended between its resting offset and sitting exactly on the
      // curve, so it visibly gathers into the branch when hovered
      const bx = speck.base.x + (speck.onCurve.x - speck.base.x) * speck.converge;
      const by = speck.base.y + (speck.onCurve.y - speck.base.y) * speck.converge;
      const bz = speck.base.z + (speck.onCurve.z - speck.base.z) * speck.converge;
      const em = branches[speck.branchIndex].emerge;

      for (let q = 0; q < PARTICLES_PER_SPECK; q++) {
        const idx = s * PARTICLES_PER_SPECK + q;
        const dir = speck.directions[q];
        wake.position.setXYZ(idx,
          bx * em + swayVec.x + dir.x * speck.spray,
          by * em + swayVec.y + dir.y * speck.spray,
          bz * em + swayVec.z + dir.z * speck.spray);
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
    if (cloud && !previewOpen) {
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

    branches.forEach((branch, i) => {
      const w = branch.weight;
      const back = stepBack(branch);
      // While its window is open this branch is being drawn as the SVG
      // ribbon instead. Fading rather than switching keeps the
      // hand-over from being a visible pop.
      const held = 1 - (i === armIndex ? armMix : 0);
      branch.emphasised.material.opacity = 0.6 * w * held;
      branch.resting.material.opacity = 0.78 * (1 - 0.45 * back) * held;
      branch.resting.material.color.copy(COL_BRANCH).lerp(COL_INK, w * 0.6); // was a full lerp to w
      // The root collar fades and darkens exactly like the resting tube
      // it hands off to, and grows in with the same emerge as the rest
      // of the branch rather than sitting there at full size early.
      branch.rootFlare.material.opacity = branch.resting.material.opacity;
      branch.rootFlare.material.color.copy(branch.resting.material.color);
      branch.rootFlare.scale.setScalar(penWeight * branch.emerge);
      branch.dots.forEach((dot) => {
        // On hover they shrink away into the curve they already sit on,
        // so a hovered branch reads as one unbroken line rather than a
        // beaded one. They fade slightly ahead of shrinking, so the
        // last of them isn't a hard dot popping out of existence.
        dot.mesh.material.opacity = 0.8 * (1 - 0.5 * back) * (1 - w * 0.96);
        dot.mesh.material.color.copy(COL_BRANCH).lerp(COL_INK, w);
        dot.mesh.scale.setScalar(dot.scale * penWeight * Math.max(0.02, 1 - w * 0.94));
      });
    });

    // The centre is the first thing here and the thing the rest leaves
    // from, so it lands early and swells briefly as they go.
    const coreIn = emergeEase(Math.min(1, arrival / 0.34));
    const launch = Math.max(0, Math.min(1, (arrival - 0.1) / 0.35)) * (1 - Math.min(1, Math.max(0, (arrival - 0.45) / 0.4)));
    const breathe = REDUCE_MOTION ? 1 : 1 + Math.sin(clock * 0.55) * 0.035;
    core.scale.setScalar(coreIn * (1 + launch * 0.5));
    shellInner.scale.setScalar(coreIn * (breathe + launch * 0.8));
    shellOuter.scale.setScalar(coreIn * (1 + (breathe - 1) * 1.8 + launch * 1.3));

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
      const depth = viewDepth(worldPos);
      const back = stepBack(branches[i]);
      n._el.style.opacity = String(Math.max(0.5, 1 - depth * 0.45) * (1 - 0.55 * back));
      n._el.style.zIndex = String(Math.round((1 - depth) * 100));
      field.push({ x: x, y: y, r: 78 * penWeight, s: 7 });
      readoutNodes[i] = readoutNodes[i] || {};
      const rn = readoutNodes[i];
      rn.x = x; rn.y = y; rn.depth = depth; rn.label = n.label;
      rn.wx = worldPos.x; rn.wy = worldPos.y; rn.wz = worldPos.z;
      rn.px = n._end.x; rn.py = n._end.y; rn.pz = n._end.z;
    });

    core.getWorldPosition(worldPos);
    projected.copy(worldPos).project(camera);
    field.push({
      x: (projected.x * 0.5 + 0.5) * w,
      y: (-projected.y * 0.5 + 0.5) * h,
      r: 210 * penWeight, s: 17,
    });
    window.__mapField = field;

    // Everything extras.js needs in order to draw alongside the map,
    // so that file can be deleted outright without touching this one.
    readout.hubX = (projected.x * 0.5 + 0.5) * w;
    readout.hubY = (-projected.y * 0.5 + 0.5) * h;
    readout.nodes = readoutNodes;
    readout.arrival = arrival;
    readout.previewOpen = previewOpen;
    readout.radius = mapRadius;
    readout.activeIndex = activeBranch; // which node (if any) is currently hovered/focused
    window.__mapReadout = readout;

    updateArm();

    if (arrival > 0.004) renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
