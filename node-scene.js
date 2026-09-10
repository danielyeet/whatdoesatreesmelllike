// ============================================================
// 3D NODE MAP
// Draws the "bodies of work" as dots in a small rotatable 3D
// scene. Drag with the mouse to rotate; it also turns gently on
// its own.
//
// THE ONLY PART MEANT TO BE HAND-EDITED IS RIGHT BELOW: the
// REAL_NODES list. Each one needs a label, an optional one-line
// sub-line, a link, and a position in 3D space as [x, y, z] —
// roughly -3 to 3 on each axis keeps it comfortably in view.
// The connecting line to the center is drawn automatically.
//
// DECORATIVE_POINTS further down are the small dots that light
// up on hover but aren't links — pure atmosphere. Add, remove,
// or move [x, y, z] entries freely; nothing else needs to change.
//
// Everything after that is the machinery (rendering, rotation,
// hover glow) — you shouldn't need to touch it.
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

// ============================================================
// Setup
// ============================================================
const wrap = document.getElementById("node-scene");
const canvas = document.getElementById("node-canvas");
const labelLayer = document.getElementById("node-labels");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
camera.position.set(0, 0, 9.2);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);

const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.enableZoom = false;
controls.rotateSpeed = 0.45;
controls.autoRotate = !REDUCE_MOTION;
controls.autoRotateSpeed = 0.3; // slow and gentle

wrap.addEventListener("pointerdown", () => wrap.classList.add("grabbing"));
window.addEventListener("pointerup", () => wrap.classList.remove("grabbing"));

const LINE_COLOR = new THREE.Color(0x3a3a3a);
const LINE_COLOR_REAL = new THREE.Color(0x4c4c48);
const DOT_COLOR = new THREE.Color(0x4a4a4a);
const HOVER_COLOR = new THREE.Color(0xc6924b);

const hub = new THREE.Vector3(0, 0, 0);
scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), new THREE.MeshBasicMaterial({ color: 0x555555 })));

// A gently curved line rather than a perfectly straight one — a
// small deliberate offset at the midpoint, smoothed into a curve.
function curvedLine(a, b, color, opacity) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const offset = new THREE.Vector3((b.z - a.z) * 0.14, (b.x - a.x) * -0.09, (a.y - b.y) * 0.11);
  mid.add(offset);
  const curve = new THREE.CatmullRomCurve3([a, mid, b]);
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Line(geometry, material);
}

// --- Real nodes: the line is drawn in 3D, but the clickable dot
// and label are plain HTML, positioned over the scene each frame —
// that keeps them fully accessible (real links, keyboard-focusable).
REAL_NODES.forEach((n) => {
  n._vec = new THREE.Vector3(...n.pos);
  scene.add(curvedLine(hub, n._vec, LINE_COLOR_REAL, 0.6));

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

// --- Decorative nodes: small spheres, not links, that glow on
// hover via raycasting, along with the line connecting them.
const decoGeometry = new THREE.SphereGeometry(0.045, 10, 10);
const decorativeMeshes = [];
DECORATIVE_POINTS.forEach((pos, i) => {
  const p = new THREE.Vector3(...pos);
  const material = new THREE.MeshBasicMaterial({ color: DOT_COLOR.clone(), transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(decoGeometry, material);
  mesh.position.copy(p);
  scene.add(mesh);

  const target = i % 3 === 0 ? hub : REAL_NODES[i % REAL_NODES.length]._vec;
  const line = curvedLine(p, target, LINE_COLOR, 0.22);
  scene.add(line);

  mesh.userData.hover = 0;
  mesh.userData.line = line;
  decorativeMeshes.push(mesh);
});

// --- Hover raycasting (decorative nodes only)
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-10, -10);
let hovered = null;

wrap.addEventListener("pointermove", (e) => {
  const rect = wrap.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
});
wrap.addEventListener("pointerleave", () => pointer.set(-10, -10));

// --- Resize
function onResize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener("resize", onResize);

// --- Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(decorativeMeshes)[0];
  hovered = hit ? hit.object : null;

  decorativeMeshes.forEach((m) => {
    const target = m === hovered ? 1 : 0;
    m.userData.hover += (target - m.userData.hover) * 0.12; // gentle lerp, not a snap
    m.material.color.copy(DOT_COLOR).lerp(HOVER_COLOR, m.userData.hover);
    m.scale.setScalar(1 + m.userData.hover * 1.8);
    m.userData.line.material.color.copy(LINE_COLOR).lerp(HOVER_COLOR, m.userData.hover);
    m.userData.line.material.opacity = 0.22 + m.userData.hover * 0.55;
  });

  REAL_NODES.forEach((n) => {
    const v = n._vec.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * wrap.clientWidth;
    const y = (-v.y * 0.5 + 0.5) * wrap.clientHeight;
    n._el.style.transform = "translate(" + x + "px," + y + "px)";
    const depth = (v.z + 1) / 2;
    n._el.style.opacity = String(Math.max(0.45, 1 - depth * 0.6));
    n._el.style.zIndex = String(Math.round((1 - depth) * 100));
  });

  renderer.render(scene, camera);
}
animate();
