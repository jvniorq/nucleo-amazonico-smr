import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x061715);
scene.fog = new THREE.FogExp2(0x061715, 0.017);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 180);
camera.position.set(24, 17, 31);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 12;
controls.maxDistance = 62;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(8, 2.4, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.16;

const palette = { acid: 0xb9f33d, warm: 0xff9a3c, metal: 0x6c817a, dark: 0x0a2521, glass: 0x77b5a4, concrete: 0x78837b, water: 0x0c5c57, copper: 0xd36f37 };
const raycastTargets = [], componentGroups = {}, flowParticles = [], animated = [];
const mat = (color, roughness = .65, metalness = .15) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const concreteMat = mat(palette.concrete, .92, 0), metalMat = mat(palette.metal, .32, .72), darkMat = mat(palette.dark, .75, .2);
const acidMat = new THREE.MeshStandardMaterial({ color: palette.acid, emissive: palette.acid, emissiveIntensity: 1.5, roughness: .3 });
const warmMat = new THREE.MeshStandardMaterial({ color: palette.warm, emissive: palette.warm, emissiveIntensity: 1.8, roughness: .28 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: palette.glass, transparent: true, opacity: .15, transmission: .35, roughness: .22, depthWrite: false, side: THREE.DoubleSide });

function mesh(geometry, material, position, cast = true, receive = true) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position); m.castShadow = cast; m.receiveShadow = receive;
  return m;
}
function tagGroup(group, key) {
  componentGroups[key] = group;
  group.traverse(o => { if (o.isMesh) { o.userData.component = key; raycastTargets.push(o); } });
  scene.add(group);
}

scene.add(new THREE.HemisphereLight(0x8ed1c0, 0x07100d, 1.25));
const sun = new THREE.DirectionalLight(0xdfffd2, 3.1);
sun.position.set(-20, 32, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -45; sun.shadow.camera.right = 45; sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -30;
scene.add(sun);
const reactorGlow = new THREE.PointLight(palette.warm, 13, 20, 2);
reactorGlow.position.set(0, 4, 0); scene.add(reactorGlow);

scene.add(mesh(new THREE.CylinderGeometry(38, 41, 1.2, 96), mat(0x112d25, .98, 0), [8, -1.25, 0], false, true));
scene.add(mesh(new THREE.CylinderGeometry(30, 31, .25, 80), mat(0x173b2e, .9, 0), [7, -.52, 0], false, true));
const river = mesh(new THREE.PlaneGeometry(105, 14, 30, 4), new THREE.MeshPhysicalMaterial({ color: palette.water, roughness: .18, metalness: .22, transparent: true, opacity: .77 }), [8, -.51, -24], false, true);
river.rotation.x = -Math.PI / 2; river.rotation.z = -.08; scene.add(river);
for (let i = 0; i < 6; i++) {
  const ring = mesh(new THREE.RingGeometry(12 + i * 4.2, 12.03 + i * 4.2, 96), new THREE.MeshBasicMaterial({ color: 0x79a68c, transparent: true, opacity: .075, side: THREE.DoubleSide }), [7, -.36, 0], false, false);
  ring.rotation.x = -Math.PI / 2; scene.add(ring);
}

const treeTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.08, .12, .75, 5), mat(0x4b3826, 1, 0), 150);
const treeCrowns = new THREE.InstancedMesh(new THREE.ConeGeometry(.42, 1.35, 7), mat(0x245f3c, .95, 0), 150);
const dummy = new THREE.Object3D(); let treeCount = 0;
for (let i = 0; i < 220 && treeCount < 150; i++) {
  const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 16, x = 8 + Math.cos(a) * r, z = Math.sin(a) * r;
  if (z < -18 || (x > 21 && z > -3 && z < 10)) continue;
  const s = .65 + Math.random() * .85;
  dummy.position.set(x, -.15, z); dummy.scale.set(s, s, s); dummy.rotation.y = Math.random() * Math.PI; dummy.updateMatrix(); treeTrunks.setMatrixAt(treeCount, dummy.matrix);
  dummy.position.y = .7 * s; dummy.updateMatrix(); treeCrowns.setMatrixAt(treeCount, dummy.matrix); treeCount++;
}
treeTrunks.count = treeCount; treeCrowns.count = treeCount; scene.add(treeTrunks, treeCrowns);

const reactor = new THREE.Group();
reactor.add(mesh(new THREE.CylinderGeometry(5.3, 5.8, .75, 48), concreteMat, [0, -.05, 0]));
reactor.add(mesh(new THREE.CylinderGeometry(4.15, 4.45, 7.2, 48, 1, true), glassMat, [0, 3.85, 0], false, false));
reactor.add(mesh(new THREE.SphereGeometry(4.18, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), glassMat, [0, 7.42, 0], false, false));
reactor.add(mesh(new THREE.CylinderGeometry(1.35, 1.55, 5.25, 32), metalMat, [0, 3.35, 0]));
reactor.add(mesh(new THREE.SphereGeometry(1.36, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), metalMat, [0, 5.97, 0]));
reactor.add(mesh(new THREE.CylinderGeometry(1.08, 1.08, 1.65, 24), warmMat, [0, 2.1, 0]));
for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; reactor.add(mesh(new THREE.CylinderGeometry(.075, .075, 2.25, 7), acidMat, [Math.cos(a) * .68, 2.1, Math.sin(a) * .68])); }
for (const side of [-1, 1]) {
  reactor.add(mesh(new THREE.CylinderGeometry(.72, .72, 4.3, 20), metalMat, [side * 2.35, 3.6, 0]));
  const connector = mesh(new THREE.TorusGeometry(1.35, .16, 10, 28, Math.PI), mat(palette.copper, .4, .5), [side * 1.2, 4.55, 0]); connector.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2; reactor.add(connector);
}
for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; reactor.add(mesh(new THREE.BoxGeometry(.08, 3.2, .08), mat(0x91a89f, .5, .4), [Math.cos(a) * 4.45, 2.2, Math.sin(a) * 4.45])); }
tagGroup(reactor, 'reactor');

const turbine = new THREE.Group(); turbine.position.set(11.5, 0, 1.3);
turbine.add(mesh(new THREE.BoxGeometry(9.5, .55, 5.4), concreteMat, [0, 0, 0]));
turbine.add(mesh(new THREE.BoxGeometry(9, 5.4, 5), glassMat, [0, 2.9, 0], false, false));
for (const x of [-4.25, 4.25]) for (const z of [-2.25, 2.25]) turbine.add(mesh(new THREE.BoxGeometry(.12, 5.2, .12), metalMat, [x, 2.85, z]));
const shaft = new THREE.Group(); shaft.position.set(-.5, 2.05, 0); shaft.rotation.z = Math.PI / 2;
shaft.add(mesh(new THREE.CylinderGeometry(.26, .26, 7, 16), metalMat, [0, 0, 0]));
for (let i = 0; i < 10; i++) shaft.add(mesh(new THREE.CylinderGeometry(.75 + i * .035, .75 + i * .035, .14, 18), i < 7 ? metalMat : acidMat, [0, -2.7 + i * .55, 0]));
turbine.add(shaft); animated.push({ object: shaft, axis: 'y', speed: 1.9 });
const generatorBody = mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.2, 24), mat(0x314f46, .3, .75), [3.2, 2.05, 0]); generatorBody.rotation.z = Math.PI / 2; turbine.add(generatorBody);
tagGroup(turbine, 'turbina');

const cooling = new THREE.Group(); cooling.position.set(8, 0, -9.5);
cooling.add(mesh(new THREE.BoxGeometry(8, .45, 5.5), concreteMat, [0, 0, 0]));
for (const x of [-2.4, 0, 2.4]) {
  const fan = new THREE.Group(); fan.position.set(x, 1.1, 0); fan.add(mesh(new THREE.CylinderGeometry(1.05, 1.05, .65, 24), darkMat, [0, 0, 0]));
  const blades = new THREE.Group(); blades.position.y = .36;
  for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(.2, .06, .86), metalMat, [0, 0, .42]); b.rotation.y = i * Math.PI * 2 / 5; blades.add(b); }
  fan.add(blades); cooling.add(fan); animated.push({ object: blades, axis: 'y', speed: 1.5 + x * .04 });
}
cooling.add(mesh(new THREE.BoxGeometry(7.2, 1.25, .4), metalMat, [0, 1.05, -1.85]));
tagGroup(cooling, 'enfriamiento');

const grid = new THREE.Group(); grid.position.set(21, 0, 1);
grid.add(mesh(new THREE.BoxGeometry(7.5, .35, 7), concreteMat, [0, 0, 0]));
for (const x of [-2.4, 0, 2.4]) {
  grid.add(mesh(new THREE.BoxGeometry(1.4, 1.65, 1.7), mat(0x385148, .35, .75), [x, .95, 0]));
  for (let f = -1; f <= 1; f++) grid.add(mesh(new THREE.TorusGeometry(.38, .09, 8, 14), metalMat, [x, 1.05 + f * .34, .9]));
}
for (const z of [-2.35, 2.35]) for (const x of [-3, -1, 1, 3]) {
  grid.add(mesh(new THREE.CylinderGeometry(.06, .09, 2.6, 8), metalMat, [x, 1.45, z]));
  grid.add(mesh(new THREE.SphereGeometry(.13, 10, 8), acidMat, [x, 2.8, z]));
}
tagGroup(grid, 'red');

const city = new THREE.Group(); city.position.set(31, 0, 7);
const cityMaterial = mat(0x24433b, .8, .1);
for (let i = 0; i < 38; i++) {
  const x = (Math.random() - .5) * 13, z = (Math.random() - .5) * 9, h = .5 + Math.random() * 2.7;
  city.add(mesh(new THREE.BoxGeometry(.7 + Math.random() * .8, h, .7 + Math.random() * .8), cityMaterial, [x, h / 2, z]));
  if (i % 2 === 0) city.add(mesh(new THREE.BoxGeometry(.11, .11, .04), acidMat, [x, Math.min(h - .2, .7 + Math.random() * h), z + .55], false, false));
}
city.add(mesh(new THREE.CylinderGeometry(.08, .12, 5.2, 8), metalMat, [0, 2.6, 0]));
city.add(mesh(new THREE.TorusGeometry(.85, .07, 8, 20), acidMat, [0, 4.3, 0]));
tagGroup(city, 'iquitos');

function createFlow(points, color, count = 14) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, .09, 8, false), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .65, transparent: true, opacity: .42 })));
  const dots = [];
  for (let i = 0; i < count; i++) { const dot = mesh(new THREE.SphereGeometry(.12, 8, 8), new THREE.MeshBasicMaterial({ color }), [0, 0, 0], false, false); scene.add(dot); dots.push(dot); }
  flowParticles.push({ curve, dots, speed: .034 + Math.random() * .012, phase: Math.random() });
}
createFlow([[3,4.6,0],[5.5,5.2,.4],[7,3.8,1],[9.2,2.7,1.3]], palette.warm, 16);
createFlow([[13.8,1.3,1.2],[14,1,-3],[11.5,.8,-7],[9.8,1,-8.2]], 0x3ee6d0, 13);
createFlow([[16,2.1,1.3],[18,2.7,1.1],[20,2.4,1]], palette.acid, 12);
createFlow([[24,2.4,1],[27,3,3],[30,2.3,6]], palette.acid, 18);
for (let i = 0; i < 3; i++) {
  const lineCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(23, 2.8, -1 + i * 2), new THREE.Vector3(27, 3.6, 1 + i * 2), new THREE.Vector3(31, 2.7, 4 + i)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(lineCurve, 32, .025, 5, false), new THREE.MeshBasicMaterial({ color: 0x78978c, transparent: true, opacity: .65 })));
}

const components = {
  reactor: { index: '01 / 05', icon: 'R1', kicker: 'ISLA NUCLEAR', title: 'Reactor modular', description: 'El núcleo libera calor mediante fisión controlada. El módulo integra sistemas compactos y múltiples barreras de contención.', a: '120', au: 'MWe', al: 'Potencia simulada', b: '24/7', bu: '', bl: 'Operación continua', camera: [13, 11, 17], target: [0, 3, 0] },
  turbina: { index: '02 / 05', icon: 'T2', kicker: 'CONVERSIÓN DE ENERGÍA', title: 'Turbina + generador', description: 'El vapor mueve la turbina; el eje acciona un generador que convierte movimiento mecánico en electricidad.', a: '60', au: 'Hz', al: 'Frecuencia objetivo', b: '13.8', bu: 'kV', bl: 'Salida ilustrativa', camera: [20, 9, 14], target: [11.5, 2, 1] },
  enfriamiento: { index: '03 / 05', icon: 'C3', kicker: 'CIRCUITO TÉRMICO', title: 'Enfriamiento cerrado', description: 'El condensador recupera el vapor para repetir el ciclo. La propuesta evita representar una descarga directa al río.', a: '3', au: 'ciclos', al: 'Circuitos separados', b: '↻', bu: '', bl: 'Recirculación', camera: [17, 9, -19], target: [8, 1, -9.5] },
  red: { index: '04 / 05', icon: 'G4', kicker: 'SISTEMA ELÉCTRICO', title: 'Subestación local', description: 'Transformadores y protecciones elevan la tensión y sincronizan la energía antes de enviarla a la red urbana.', a: '120', au: 'MWe', al: 'Entrega máxima', b: 'N+1', bu: '', bl: 'Redundancia conceptual', camera: [31, 10, 13], target: [21, 1.5, 1] },
  iquitos: { index: '05 / 05', icon: 'IQ', kicker: 'DESTINO DE LA ENERGÍA', title: 'Escenario Iquitos', description: 'Una red aislada recibe generación firme para hogares, hospitales, comercio e industria. La demanda mostrada es ilustrativa.', a: '110', au: 'MW', al: 'Demanda escenario', b: '10', bu: 'MW', bl: 'Reserva simulada', camera: [41, 11, 18], target: [31, 2, 7] }
};

let selectedKey = 'reactor', cameraGoal = null, targetGoal = null, isNight = true, flowBoost = 1;
const ui = Object.fromEntries(['componentIndex','componentIcon','componentKicker','componentTitle','componentDescription','metricAValue','metricAUnit','metricALabel','metricBValue','metricBUnit','metricBLabel','fpsLabel'].map(id => [id, document.getElementById(id)]));
function selectComponent(key, moveCamera = true) {
  const data = components[key]; if (!data) return;
  selectedKey = key;
  ui.componentIndex.textContent = data.index; ui.componentIcon.textContent = data.icon; ui.componentKicker.textContent = data.kicker; ui.componentTitle.textContent = data.title; ui.componentDescription.textContent = data.description;
  ui.metricAValue.textContent = data.a; ui.metricAUnit.textContent = data.au; ui.metricALabel.textContent = data.al; ui.metricBValue.textContent = data.b; ui.metricBUnit.textContent = data.bu; ui.metricBLabel.textContent = data.bl;
  document.querySelectorAll('.nav-step').forEach(el => el.classList.toggle('active', el.dataset.component === key));
  document.getElementById('insightPanel').classList.remove('hidden'); document.getElementById('heroCopy').classList.add('minimized');
  if (moveCamera) { cameraGoal = new THREE.Vector3(...data.camera); targetGoal = new THREE.Vector3(...data.target); controls.autoRotate = false; }
}

document.querySelectorAll('.nav-step').forEach(button => button.addEventListener('click', () => selectComponent(button.dataset.component)));
document.getElementById('startTour').addEventListener('click', () => selectComponent('reactor'));
document.getElementById('flowButton').addEventListener('click', () => { flowBoost = flowBoost === 1 ? 2.8 : 1; document.getElementById('flowButton').classList.toggle('active', flowBoost > 1); selectComponent('turbina'); });
document.getElementById('closePanel').addEventListener('click', () => { document.getElementById('insightPanel').classList.add('hidden'); document.getElementById('heroCopy').classList.remove('minimized'); });
const aboutDialog = document.getElementById('aboutDialog');
document.getElementById('aboutButton').addEventListener('click', () => aboutDialog.showModal());
document.querySelector('.dialog-close').addEventListener('click', () => aboutDialog.close());
aboutDialog.addEventListener('click', e => { if (e.target === aboutDialog) aboutDialog.close(); });
document.getElementById('themeToggle').addEventListener('click', () => {
  isNight = !isNight; scene.background.set(isNight ? 0x061715 : 0x24483e); scene.fog.color.set(isNight ? 0x061715 : 0x24483e);
  renderer.toneMappingExposure = isNight ? 1.05 : 1.35; sun.intensity = isNight ? 3.1 : 4.2; document.querySelector('#themeToggle span').textContent = isNight ? '☼' : '☾';
});
controls.addEventListener('start', () => { cameraGoal = null; targetGoal = null; controls.autoRotate = false; });

const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
let downPoint = { x: 0, y: 0 };
canvas.addEventListener('pointerdown', e => { downPoint = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', e => {
  if (Math.hypot(e.clientX - downPoint.x, e.clientY - downPoint.y) > 5) return;
  pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = -(e.clientY / innerHeight) * 2 + 1; raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(raycastTargets, false)[0]; if (hit?.object.userData.component) selectComponent(hit.object.userData.component);
});

const hotspots = [...document.querySelectorAll('.hotspot')];
const hotspotPositions = { reactor: new THREE.Vector3(0, 8.5, 0), turbina: new THREE.Vector3(11.5, 5.5, 1), red: new THREE.Vector3(21, 4.2, 1) };
function updateHotspots() {
  hotspots.forEach(el => { const pos = hotspotPositions[el.dataset.hotspot].clone().project(camera); const visible = pos.z < 1 && pos.x > -1.15 && pos.x < 1.15 && pos.y > -1.15 && pos.y < 1.15; el.style.opacity = visible ? (selectedKey === el.dataset.hotspot ? '.2' : '1') : '0'; el.style.left = `${(pos.x * .5 + .5) * innerWidth}px`; el.style.top = `${(-pos.y * .5 + .5) * innerHeight}px`; });
}

const clock = new THREE.Clock(); let fpsTime = 0, fpsFrames = 0;
function animate() {
  const dt = Math.min(clock.getDelta(), .05), elapsed = clock.elapsedTime;
  if (cameraGoal && targetGoal) {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraGoal.x, 3.3, dt); camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraGoal.y, 3.3, dt); camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraGoal.z, 3.3, dt);
    controls.target.x = THREE.MathUtils.damp(controls.target.x, targetGoal.x, 4, dt); controls.target.y = THREE.MathUtils.damp(controls.target.y, targetGoal.y, 4, dt); controls.target.z = THREE.MathUtils.damp(controls.target.z, targetGoal.z, 4, dt);
    if (camera.position.distanceTo(cameraGoal) < .04) { cameraGoal = null; targetGoal = null; }
  }
  controls.update(); animated.forEach(item => { item.object.rotation[item.axis] += dt * item.speed; });
  reactorGlow.intensity = 11 + Math.sin(elapsed * 2.2) * 2; acidMat.emissiveIntensity = 1.35 + Math.sin(elapsed * 2.6) * .25; river.material.opacity = .72 + Math.sin(elapsed * .6) * .035;
  flowParticles.forEach(flow => flow.dots.forEach((dot, i) => { const t = (elapsed * flow.speed * flowBoost + flow.phase + i / flow.dots.length) % 1; dot.position.copy(flow.curve.getPointAt(t)); const pulse = .65 + Math.sin((t + elapsed) * 10) * .2; dot.scale.setScalar(pulse); }));
  updateHotspots(); renderer.render(scene, camera); fpsFrames++; fpsTime += dt;
  if (fpsTime > .8) { ui.fpsLabel.textContent = `${Math.round(fpsFrames / fpsTime)} FPS`; fpsFrames = 0; fpsTime = 0; }
}
renderer.setAnimationLoop(animate);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) clock.getDelta(); });



/* --- Realistic SMR technical layer: detailed click targets, circuit colors and engineering descriptions --- */
const realismCss = document.createElement('style');
realismCss.textContent = [
  '.tech-legend{position:fixed;z-index:7;left:34px;top:112px;width:255px;padding:14px;border:1px solid rgba(215,244,224,.13);border-radius:5px;background:rgba(5,20,18,.68);backdrop-filter:blur(16px);font:500 8px DM Mono,monospace;letter-spacing:.08em;color:#8fa69d}',
  '.tech-legend h3{margin:0 0 11px;color:#e4f4ee;font:700 10px Manrope,sans-serif;letter-spacing:.08em}.tech-legend p{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:7px 0}.tech-legend i{width:28px;height:3px;border-radius:3px;box-shadow:0 0 14px currentColor}.tech-legend b{color:#c9d9d2;font-weight:500}',
  '.system-facts{margin:17px -4px 0;display:grid;gap:8px}.system-facts article{border:1px solid rgba(215,244,224,.11);background:rgba(7,25,22,.62);border-radius:4px;padding:10px 11px}.system-facts strong{display:block;color:#dceee8;font-size:10px;margin-bottom:5px}.system-facts span{display:block;color:#8aa099;font-size:10px;line-height:1.5}',
  '.subcomponent-note{margin-top:13px;color:#789087;font:500 8px DM Mono,monospace;letter-spacing:.08em;line-height:1.55}.hotspot.detail>span{background:#ff9a3c;color:#1d1309;box-shadow:0 0 0 5px rgba(255,154,60,.14)}.hotspot.detail p{border:1px solid rgba(255,154,60,.18)}',
  '@media(max-width:900px){.tech-legend{display:none}.system-facts{grid-template-columns:1fr 1fr}.system-facts article{padding:8px}.subcomponent-note{display:none}}'
].join('');
document.head.appendChild(realismCss);
const techLegend = document.createElement('div');
techLegend.className = 'tech-legend';
techLegend.innerHTML = '<h3>CIRCUITOS DE PLANTA</h3><p><b>Primario presurizado</b><i style="color:#ff7a3d;background:#ff7a3d"></i></p><p><b>Vapor secundario</b><i style="color:#f5d26a;background:#f5d26a"></i></p><p><b>Condensado/enfriamiento</b><i style="color:#3ee6d0;background:#3ee6d0"></i></p><p><b>Salida eléctrica</b><i style="color:#b9f33d;background:#b9f33d"></i></p>';
document.body.appendChild(techLegend);
document.querySelector('.interaction-hint').innerHTML = '<span class="mouse-icon"></span> CLIC EN VASIJAS, TUBERÍAS, TURBINA O TRANSFORMADORES · ARRASTRA PARA ORBITAR';

const rm = {
  vessel: new THREE.MeshStandardMaterial({ color: 0x8fa39c, roughness: .28, metalness: .78 }),
  cut: new THREE.MeshPhysicalMaterial({ color: 0xa7c9bf, transparent: true, opacity: .16, transmission: .25, roughness: .2, depthWrite: false, side: THREE.DoubleSide }),
  dark: new THREE.MeshStandardMaterial({ color: 0x101615, roughness: .5, metalness: .65 }),
  primary: new THREE.MeshStandardMaterial({ color: 0xff7a3d, emissive: 0xff5622, emissiveIntensity: .75, roughness: .32, metalness: .35 }),
  steam: new THREE.MeshStandardMaterial({ color: 0xf5d26a, emissive: 0xf5d26a, emissiveIntensity: .38, roughness: .24, metalness: .15 }),
  cooling: new THREE.MeshStandardMaterial({ color: 0x3ee6d0, emissive: 0x1cb8a9, emissiveIntensity: .42, roughness: .2, metalness: .2 }),
  electric: new THREE.MeshStandardMaterial({ color: 0xb9f33d, emissive: 0xb9f33d, emissiveIntensity: .7, roughness: .28, metalness: .2 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xd9783b, roughness: .38, metalness: .72 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xcbd8d3, roughness: .45, metalness: .36 })
};
function pipe(points, radius, material, key) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, radius, 12, false), material);
  tube.castShadow = true; tube.receiveShadow = true; tube.userData.component = key;
  raycastTargets.push(tube); scene.add(tube); return tube;
}
function boltRing(group, radius, y, count) {
  for (let i = 0; i < count; i++) { const a = i / count * Math.PI * 2; group.add(mesh(new THREE.CylinderGeometry(.055, .055, .18, 8), rm.ceramic, [Math.cos(a) * radius, y, Math.sin(a) * radius])); }
}
function addHotspot(key, label, pos) {
  const host = document.querySelector('.hotspots'); if (!host || hotspotPositions[key]) return;
  const el = document.createElement('div'); el.className = 'hotspot detail'; el.dataset.hotspot = key; el.innerHTML = '<span>＋</span><p>' + label + '</p>';
  host.appendChild(el); hotspots.push(el); hotspotPositions[key] = new THREE.Vector3(...pos);
}

const containment = new THREE.Group();
containment.add(mesh(new THREE.CylinderGeometry(4.95, 5.25, 8.6, 72, 1, true, Math.PI * .16, Math.PI * 1.68), rm.cut, [0, 4.15, 0], false, false));
containment.add(mesh(new THREE.SphereGeometry(4.95, 72, 18, Math.PI * .16, Math.PI * 1.68, 0, Math.PI / 2), rm.cut, [0, 8.45, 0], false, false));
tagGroup(containment, 'containment');

const vessel = new THREE.Group();
vessel.add(mesh(new THREE.CylinderGeometry(1.18, 1.28, 5.2, 48), rm.vessel, [0, 3.35, 0]));
vessel.add(mesh(new THREE.SphereGeometry(1.18, 48, 14, 0, Math.PI * 2, 0, Math.PI / 2), rm.vessel, [0, 5.95, 0]));
vessel.add(mesh(new THREE.SphereGeometry(1.28, 48, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), rm.vessel, [0, .75, 0]));
boltRing(vessel, 1.32, 5.62, 24); boltRing(vessel, 1.42, 1.05, 24); tagGroup(vessel, 'smrVessel');

const core = new THREE.Group(); core.add(mesh(new THREE.CylinderGeometry(.72, .78, 1.45, 36), warmMat, [0, 2.1, 0]));
for (let ring = 0; ring < 3; ring++) { const n = ring === 0 ? 1 : ring * 8; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = ring * .22; core.add(mesh(new THREE.CylinderGeometry(.035, .035, 1.72, 6), ring === 2 ? acidMat : rm.steam, [Math.cos(a) * r, 2.12, Math.sin(a) * r])); } }
tagGroup(core, 'core');

const rods = new THREE.Group(); rods.add(mesh(new THREE.BoxGeometry(1.7, .16, 1.7), rm.dark, [0, 6.58, 0]));
for (let i = 0; i < 9; i++) { const x = (i % 3 - 1) * .42, z = (Math.floor(i / 3) - 1) * .42; rods.add(mesh(new THREE.CylinderGeometry(.03, .03, 3.9, 8), rm.dark, [x, 4.55, z])); rods.add(mesh(new THREE.CylinderGeometry(.08, .08, .42, 10), rm.ceramic, [x, 6.92, z])); }
tagGroup(rods, 'controlRods');

const sg = new THREE.Group();
for (const side of [-1, 1]) {
  sg.add(mesh(new THREE.CylinderGeometry(.48, .54, 3.55, 28), rm.ceramic, [side * 2.15, 3.75, .05]));
  for (let j = 0; j < 5; j++) { const t = mesh(new THREE.TorusGeometry(.38, .025, 8, 30), rm.copper, [side * 2.15, 2.55 + j * .47, .05], true, false); t.rotation.x = Math.PI / 2; sg.add(t); }
}
tagGroup(sg, 'steamGenerator');
const prz = new THREE.Group(); prz.add(mesh(new THREE.CylinderGeometry(.34, .38, 2.25, 24), rm.ceramic, [.35, 4.55, 2.22])); prz.add(mesh(new THREE.SphereGeometry(.36, 24, 12), rm.primary, [.35, 5.74, 2.22])); tagGroup(prz, 'pressurizer');
const pumps = new THREE.Group(); for (const side of [-1, 1]) { const p = mesh(new THREE.CylinderGeometry(.32, .32, .7, 18), rm.vessel, [side * 2.72, 2.05, -1.2]); p.rotation.z = Math.PI / 2; pumps.add(p); pumps.add(mesh(new THREE.TorusGeometry(.38, .08, 10, 28), rm.primary, [side * 2.72, 2.05, -1.2])); } tagGroup(pumps, 'primaryPumps');
pipe([[0, 4.9, 0], [1.2, 5.45, -.35], [3.1, 4.9, -.7], [3.1, 2.4, -1.15], [1.1, 2.2, -.6], [0, 2.55, 0]], .12, rm.primary, 'primaryLoop');
pipe([[0, 4.8, 0], [-1.2, 5.38, -.35], [-3.1, 4.85, -.7], [-3.1, 2.4, -1.15], [-1.1, 2.2, -.6], [0, 2.55, 0]], .12, rm.primary, 'primaryLoop');
pipe([[2.3, 5.25, .05], [5.2, 5.85, .45], [8.1, 4.2, 1.15], [9.6, 3.25, 1.28]], .13, rm.steam, 'secondaryLoop');
pipe([[9.4, 1.35, -.25], [9.8, .95, -2.5], [10.2, .92, -6.2], [9.1, 1.12, -8.2]], .12, rm.cooling, 'coolingLoop');
pipe([[15.5, 2.55, 1.3], [17.8, 3.05, 1.1], [20.8, 2.7, 1.0]], .07, rm.electric, 'electricalBus');

const turbineCut = new THREE.Group(); turbineCut.position.set(11.5, 0, 1.3);
for (let i = 0; i < 8; i++) { const d = mesh(new THREE.CylinderGeometry(.78 + i * .045, .78 + i * .045, .12, 24), i < 4 ? rm.steam : rm.vessel, [-2.85 + i * .48, 2.55, 0]); d.rotation.z = Math.PI / 2; turbineCut.add(d); }
const hp = mesh(new THREE.CylinderGeometry(1.05, .86, 2.2, 32, 1, true, 0, Math.PI * 1.55), rm.cut, [-2.18, 2.55, 0], false, false); hp.rotation.z = Math.PI / 2; turbineCut.add(hp);
const lp = mesh(new THREE.CylinderGeometry(1.42, 1.05, 2.65, 32, 1, true, Math.PI * .2, Math.PI * 1.55), rm.cut, [.62, 2.55, 0], false, false); lp.rotation.z = Math.PI / 2; turbineCut.add(lp); tagGroup(turbineCut, 'steamTurbine');
const gen = new THREE.Group(); gen.position.set(11.5, 0, 1.3); const shell = mesh(new THREE.CylinderGeometry(1.32, 1.32, 2.25, 36, 1, true), rm.vessel, [3.35, 2.55, 0]); shell.rotation.z = Math.PI / 2; gen.add(shell); for (let i = 0; i < 5; i++) { const c = mesh(new THREE.TorusGeometry(.93, .04, 8, 34), rm.copper, [2.68 + i * .32, 2.55, 0], true, false); c.rotation.y = Math.PI / 2; gen.add(c); } tagGroup(gen, 'generator');
const cond = new THREE.Group(); cond.position.set(11.5, 0, 1.3); const cs = mesh(new THREE.CylinderGeometry(.72, .72, 3.9, 28), rm.cooling, [-.2, .88, -1.72]); cs.rotation.z = Math.PI / 2; cond.add(cs); tagGroup(cond, 'condenser');

const xfmr = new THREE.Group(); xfmr.position.set(21, 0, 1); for (const x of [-1.6, 0, 1.6]) { xfmr.add(mesh(new THREE.BoxGeometry(.72, 1.55, 1.2), rm.vessel, [x, 1.05, -1.45])); for (let j = 0; j < 4; j++) { const c = mesh(new THREE.TorusGeometry(.32, .035, 8, 22), rm.copper, [x, .65 + j * .27, -.82], true, false); c.rotation.x = Math.PI / 2; xfmr.add(c); } xfmr.add(mesh(new THREE.CylinderGeometry(.09, .09, .78, 10), acidMat, [x, 2.15, -1.45])); } tagGroup(xfmr, 'transformer');
const swy = new THREE.Group(); swy.position.set(21, 0, 1); for (const z of [1.55, 2.65]) for (const x of [-3.2, -1.1, 1.1, 3.2]) { swy.add(mesh(new THREE.CylinderGeometry(.045, .06, 2.4, 8), rm.ceramic, [x, 1.35, z])); swy.add(mesh(new THREE.BoxGeometry(.95, .05, .05), rm.electric, [x + .25, 2.45, z])); swy.add(mesh(new THREE.SphereGeometry(.12, 10, 8), rm.electric, [x, 2.62, z])); } tagGroup(swy, 'switchyard');

createFlow([[1.1,5,0],[3.2,5.3,-.7],[3.2,2.45,-1.2],[.8,2.4,-.4]], 0xff7a3d, 14);
createFlow([[2.25,5.2,.1],[5.4,5.8,.5],[8.6,4.1,1.2],[10.1,3.05,1.3]], 0xf5d26a, 16);
createFlow([[13.5,1.05,-.5],[12.4,.88,-2.1],[10,.9,-6.2],[8.7,1.1,-8.2]], 0x3ee6d0, 14);
createFlow([[15.2,2.55,1.3],[18.3,3.05,1.05],[21,2.7,1],[25,3.3,2.5],[31,2.8,6.4]], 0xb9f33d, 18);

Object.assign(components, {
  reactor:{index:'01 / 05',icon:'SMR',kicker:'ISLA NUCLEAR · SMR INTEGRAL',title:'Módulo SMR integral',description:'Cutaway con contención, vasija de presión, núcleo, barras de control, generadores de vapor internos, presurizador y bombas del primario.',a:'120',au:'MWe',al:'Potencia eléctrica conceptual',b:'3',bu:'barreras',bl:'Combustible · vasija · contención',camera:[12,10,15],target:[0,3.9,0]},
  containment:{index:'SMR / CNT',icon:'CNT',kicker:'BARRERA FINAL',title:'Contención del módulo',description:'Estructura envolvente diseñada para confinamiento físico. Se muestra cortada para observar equipos internos.',a:'3ª',au:'barrera',al:'Confinamiento externo',b:'CUT',bu:'away',bl:'Corte visual didáctico',camera:[10,9,13],target:[0,4.4,0]},
  smrVessel:{index:'SMR / RPV',icon:'RPV',kicker:'REACTOR PRESSURE VESSEL',title:'Vasija de presión',description:'Recipiente robusto que aloja núcleo y refrigerante primario presurizado dentro del módulo SMR.',a:'PWR',au:'tipo',al:'Arquitectura conceptual',b:'1',bu:'módulo',bl:'Unidad compacta',camera:[7,6.5,9],target:[0,3.6,0]},
  core:{index:'SMR / CORE',icon:'CORE',kicker:'NÚCLEO Y COMBUSTIBLE',title:'Núcleo de combustible',description:'Zona donde se libera calor por fisión controlada. El brillo muestra calor útil, no radiación visible.',a:'~300',au:'MWt',al:'Térmica ilustrativa',b:'UO₂',bu:'',bl:'Combustible típico',camera:[5.5,5,6],target:[0,2.1,0]},
  controlRods:{index:'SMR / CRD',icon:'CRD',kicker:'CONTROL Y PARADA',title:'Barras de control',description:'Absorben neutrones para modular potencia o detener la reacción mediante inserción rápida.',a:'SCRAM',au:'',al:'Parada rápida',b:'B₄C',bu:'',bl:'Absorbente típico',camera:[6,7.8,6],target:[0,5.2,0]},
  steamGenerator:{index:'SMR / SG',icon:'SG',kicker:'INTERCAMBIO TÉRMICO',title:'Generadores de vapor internos',description:'Separan el circuito primario del secundario y producen vapor limpio hacia turbina.',a:'2',au:'lazos',al:'Intercambiadores',b:'0',bu:'mezcla',bl:'Circuitos separados',camera:[8,6,7],target:[1.7,3.8,0]},
  pressurizer:{index:'SMR / PRZ',icon:'PRZ',kicker:'PRESIÓN DEL PRIMARIO',title:'Presurizador',description:'Mantiene presión alta para evitar ebullición en la vasija durante operación normal.',a:'15',au:'MPa',al:'Orden PWR',b:'ΔP',bu:'',bl:'Control de presión',camera:[7,7,8],target:[.35,4.8,2.2]},
  primaryPumps:{index:'SMR / RCP',icon:'RCP',kicker:'RECIRCULACIÓN',title:'Bombas del primario',description:'Impulsan agua presurizada por núcleo y generadores de vapor. En diseños SMR pueden integrarse.',a:'N+1',au:'',al:'Redundancia',b:'↻',bu:'',bl:'Flujo cerrado',camera:[8,5,6],target:[2.6,2.1,-1.1]},
  primaryLoop:{index:'CIR / PRI',icon:'PRI',kicker:'CIRCUITO PRIMARIO',title:'Lazo primario presurizado',description:'Transporta calor desde el núcleo al generador de vapor sin mezclarse con el secundario. Color naranja.',a:'cerrado',au:'',al:'Sin descarga externa',b:'hot',bu:'leg',bl:'Rama caliente/fría',camera:[11,7,10],target:[1.7,3.8,-.5]},
  turbina:{index:'02 / 05',icon:'T-G',kicker:'TURBINA · GENERADOR · CONDENSADOR',title:'Isla de potencia',description:'El vapor secundario expande en turbinas, mueve el eje, alimenta el generador y luego se condensa.',a:'60',au:'Hz',al:'Frecuencia objetivo',b:'13.8',bu:'kV',bl:'Salida ilustrativa',camera:[21,8,12],target:[12.2,2.3,.2]},
  steamTurbine:{index:'TUR / HP-LP',icon:'TUR',kicker:'EXPANSIÓN DEL VAPOR',title:'Tren de turbina HP/LP',description:'Etapas de alta y baja presión extraen trabajo mecánico del vapor sobre un eje común.',a:'rpm',au:'',al:'Movimiento mecánico',b:'HP/LP',bu:'',bl:'Etapas visibles',camera:[18,6,9],target:[10.3,2.5,1.3]},
  generator:{index:'ELC / GEN',icon:'GEN',kicker:'INDUCCIÓN ELECTROMAGNÉTICA',title:'Generador síncrono',description:'Convierte el giro de la turbina en electricidad alterna mediante campo magnético y bobinas.',a:'MVA',au:'',al:'Potencia aparente',b:'60',bu:'Hz',bl:'Sincronización',camera:[20,6,8],target:[14.8,2.5,1.3]},
  condenser:{index:'CIR / COND',icon:'COND',kicker:'RETORNO DEL CICLO',title:'Condensador',description:'Convierte vapor agotado en agua y mantiene baja presión para mejorar rendimiento de turbina.',a:'vacío',au:'',al:'Baja presión',b:'↻',bu:'',bl:'Retorno de agua',camera:[18,5,-5],target:[11.3,.9,-.5]},
  secondaryLoop:{index:'CIR / SEC',icon:'SEC',kicker:'CIRCUITO SECUNDARIO',title:'Vapor hacia turbina',description:'Vapor limpio generado por intercambio térmico; no entra en contacto con el núcleo.',a:'vapor',au:'',al:'Flujo amarillo',b:'separado',bu:'',bl:'Aislado del primario',camera:[16,7,9],target:[7.4,4.8,1]},
  coolingLoop:{index:'CIR / CLG',icon:'CLG',kicker:'ENFRIAMIENTO',title:'Condensado y enfriamiento',description:'Extrae calor del condensador y recircula; requeriría análisis hídrico y térmico real.',a:'cerrado',au:'',al:'Representación',b:'ΔT',bu:'',bl:'Control térmico',camera:[18,7,-16],target:[9.7,1,-7]},
  red:{index:'04 / 05',icon:'GRID',kicker:'SISTEMA ELÉCTRICO',title:'Subestación y evacuación',description:'Transformadores, interruptores, aisladores, barras y líneas de salida para una red aislada.',a:'13.8→',au:'kV',al:'Elevación conceptual',b:'N-1',bu:'',bl:'Resiliencia',camera:[31,9,13],target:[21.2,1.7,1]},
  transformer:{index:'ELC / XFMR',icon:'XFMR',kicker:'TRANSFORMACIÓN DE TENSIÓN',title:'Transformador elevador',description:'Eleva tensión para transportar potencia con menos pérdidas. Las bobinas muestran devanados.',a:'step-up',au:'',al:'Aumenta tensión',b:'óleo',bu:'',bl:'Aislamiento típico',camera:[29,7,8],target:[21,1.4,-.6]},
  switchyard:{index:'ELC / SWY',icon:'SWY',kicker:'PROTECCIÓN Y MANIOBRA',title:'Patio de llaves',description:'Interruptores y seccionadores conectan, aíslan y protegen los circuitos de salida.',a:'relés',au:'',al:'Protección',b:'bus',bu:'',bl:'Barras colectoras',camera:[30,7,10],target:[21,1.8,3]},
  electricalBus:{index:'ELC / BUS',icon:'BUS',kicker:'BARRA ELÉCTRICA',title:'Bus de salida',description:'Camino principal de potencia desde generador hacia transformadores y líneas. Color verde.',a:'MW',au:'',al:'Potencia activa',b:'Mvar',bu:'',bl:'Reactiva/voltaje',camera:[28,7,10],target:[19.5,2.5,1]},
  iquitos:{index:'05 / 05',icon:'IQ',kicker:'CARGA AISLADA AMAZÓNICA',title:'Iquitos como destino energético',description:'Representa carga urbana, hospitales, bombeo, frío industrial y servicios críticos.',a:'110',au:'MW',al:'Demanda escenario',b:'micro',bu:'grid',bl:'Red aislada conceptual',camera:[41,11,18],target:[31,2,7]}
});
const facts = {reactor:[['Qué mirar','Contención transparente, vasija, núcleo, barras, generadores de vapor y lazos primarios.'],['Ruta energética','Nuclear → calor → vapor → turbina → generador → transformador → red.']],containment:[['Función','Barrera física final de confinamiento.'],['Visual','Cortada para mostrar el interior.']],smrVessel:[['Función','Contener núcleo y refrigerante presurizado.'],['Realismo','Equivale a la RPV de un PWR.']],core:[['Función','Generar calor por fisión controlada.'],['Seguridad','Controlado por barras, refrigeración y protección.']],controlRods:[['Función','Absorber neutrones y detener potencia.'],['Operación','Inserción rápida tipo SCRAM.']],steamGenerator:[['Función','Transferir calor al secundario.'],['Clave','Separa primario de vapor de turbina.']],pressurizer:[['Función','Regular presión del primario.'],['Clave','Evita ebullición en vasija.']],primaryPumps:[['Función','Recircular refrigerante primario.'],['SMR','Puede estar integrado al módulo.']],primaryLoop:[['Función','Transportar calor sin mezclar circuitos.'],['Color','Naranja: primario caliente/frío.']],turbina:[['Función','Convertir vapor en giro mecánico.'],['Ruta','Luego acciona el generador.']],steamTurbine:[['Función','Extraer trabajo del vapor.'],['Visual','Discos representan etapas HP/LP.']],generator:[['Función','Convertir giro en electricidad AC.'],['Control','Sincroniza frecuencia, fase y tensión.']],condenser:[['Función','Condensar vapor agotado.'],['Eficiencia','Mejora rendimiento con baja presión.']],secondaryLoop:[['Función','Llevar vapor limpio a turbina.'],['Separación','No toca el núcleo.']],coolingLoop:[['Función','Extraer calor residual.'],['Ambiental','Requiere evaluación hídrica real.']],red:[['Función','Elevar, proteger y despachar energía.'],['Contexto','Orientado a red aislada amazónica.']],transformer:[['Función','Elevar tensión y reducir pérdidas.'],['Visual','Bobinas representan devanados.']],switchyard:[['Función','Maniobra y protección eléctrica.'],['Operación','Aísla fallas sin apagar toda la planta.']],electricalBus:[['Función','Camino de potencia sincronizada.'],['Color','Verde: salida eléctrica.']],iquitos:[['Función','Representar demanda y servicios críticos.'],['Nota','Valores ilustrativos, no estudio de red.']]};
function ensureFacts(){const p=document.getElementById('insightPanel');let f=document.getElementById('systemFacts');if(!f){f=document.createElement('div');f.id='systemFacts';f.className='system-facts';p.insertBefore(f,p.querySelector('.status-line'));const n=document.createElement('p');n.className='subcomponent-note';n.textContent='Tip: haz clic en piezas internas, tuberías, condensador, generador o transformadores para ver su función.';p.insertBefore(n,p.querySelector('.status-line'));}return f;}
function renderFacts(){const f=ensureFacts();const rows=facts[selectedKey]||facts.reactor;f.innerHTML=rows.map(r=>'<article><strong>'+r[0]+'</strong><span>'+r[1]+'</span></article>').join('');}
function renderSoon(){setTimeout(renderFacts,0);} canvas.addEventListener('pointerup',renderSoon); document.querySelectorAll('.nav-step,#startTour,#flowButton').forEach(el=>el.addEventListener('click',renderSoon));
addHotspot('smrVessel','VASIJA<br><b>RPV</b>',[0,6.35,0]); addHotspot('core','NÚCLEO<br><b>COMBUSTIBLE</b>',[0,3.25,0]); addHotspot('steamGenerator','INTERCAMBIO<br><b>GEN. VAPOR</b>',[2.4,5.75,.1]); addHotspot('primaryLoop','PRIMARIO<br><b>PRESURIZADO</b>',[3.3,4.45,-.8]); addHotspot('steamTurbine','TURBINA<br><b>HP/LP</b>',[10.8,4.55,1.3]); addHotspot('condenser','CONDENSADOR<br><b>RETORNO</b>',[11.3,1.8,-.4]); addHotspot('generator','GENERADOR<br><b>AC</b>',[14.9,4.1,1.3]); addHotspot('transformer','TRANSFORMADOR<br><b>STEP-UP</b>',[21,3.3,-.5]); addHotspot('switchyard','PATIO<br><b>DE LLAVES</b>',[21,3.4,3.2]);
renderFacts(); selectComponent('reactor', false);



/* --- Guided PWR-reference interface layer --- */
const refStyle=document.createElement('style');
refStyle.textContent='.ref-card{position:fixed;z-index:12;left:18px;right:18px;bottom:86px;max-width:720px;margin:auto;overflow:hidden;border-radius:8px;background:rgba(8,38,42,.84);border:1px solid rgba(95,220,235,.32);box-shadow:0 24px 80px rgba(0,0,0,.34);backdrop-filter:blur(16px)}.ref-card header{display:flex;justify-content:space-between;background:#18a7b8;color:white;padding:9px 14px;font:800 15px Manrope,sans-serif;text-transform:uppercase}.ref-card p{margin:0;padding:13px 16px;color:#e9fbff;font-size:13px;line-height:1.55}.ref-controls{position:fixed;z-index:13;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:rgba(5,20,22,.62);border:1px solid rgba(95,220,235,.25);backdrop-filter:blur(16px)}.ref-controls button{min-width:44px;height:44px;border:0;border-radius:7px;background:#18a7b8;color:white;font:900 18px DM Mono,monospace}.ref-controls button.wide{min-width:104px;font-size:10px;letter-spacing:.08em}.ref-view{min-width:155px;text-align:center;color:white;font:800 12px Manrope,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ref-label{position:fixed;z-index:7;pointer-events:none;transform:translate(-50%,-50%);background:rgba(255,255,255,.92);color:#092325;border-radius:999px;padding:5px 9px;font:900 9px DM Mono,monospace;letter-spacing:.06em;box-shadow:0 8px 24px rgba(0,0,0,.18);transition:opacity .2s}.ref-label:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#f35d42;margin-right:7px}.system-nav{bottom:82px;opacity:.25}.system-nav:hover{opacity:1}.interaction-hint{display:none}@media(max-width:900px){.ref-card{bottom:82px}.ref-card p{font-size:11px}.ref-controls{gap:8px}.ref-view,.ref-label{display:none}.system-nav,.insight-panel{display:none}}';
document.head.appendChild(refStyle);
Object.assign(components,{coolingTower:{index:'CLG / TWR',icon:'TWR',kicker:'RECHAZO DE CALOR',title:'Torres de enfriamiento',description:'Torres hiperbólicas que representan el rechazo de calor del ciclo. En una planta real dependen de clima, agua disponible, permisos ambientales y perfil de operación.',a:'ΔT',au:'',al:'Gradiente térmico',b:'H₂O',bu:'',bl:'Recirculación',camera:[18,11,-27],target:[8,4,-18]}});
function tower(x,z,s){const g=new THREE.CylinderGeometry(1.9*s,2.6*s,8.5*s,64,1,true);const m=new THREE.MeshStandardMaterial({color:0xd8ddd8,roughness:.85,transparent:true,opacity:.62,side:THREE.DoubleSide});const t=new THREE.Mesh(g,m);t.position.set(x,3.8*s,z);t.userData.component='coolingTower';t.castShadow=true;t.receiveShadow=true;raycastTargets.push(t);scene.add(t);const r=mesh(new THREE.TorusGeometry(1.92*s,.06*s,10,64),metalMat,[x,8.05*s,z],true,false);r.userData.component='coolingTower';raycastTargets.push(r);scene.add(r)}
tower(3.4,-20,1.05);tower(12.8,-19.2,.95);
function label(k,l,p){const e=document.createElement('div');e.className='ref-label';e.textContent=l;document.body.appendChild(e);return{k,el:e,pos:new THREE.Vector3(...p)}}
const refLabels=[label('smrVessel','REACTOR / RPV',[0,6.8,0]),label('steamGenerator','GENERADOR DE VAPOR',[2.2,6.25,.1]),label('primaryPumps','BOMBA PRIMARIA',[2.8,2.85,-1.2]),label('pressurizer','PRESURIZADOR',[.35,6.35,2.2]),label('steamTurbine','TURBINA HP/LP',[10.8,4.85,1.3]),label('generator','GENERADOR',[14.9,4.45,1.3]),label('condenser','CONDENSADOR',[11.3,2.05,-.4]),label('coolingTower','TORRES DE ENFRIAMIENTO',[8,9.8,-19.5]),label('transformer','TRANSFORMADOR',[21,3.65,-.5]),label('switchyard','PATIO DE LLAVES',[21,3.75,3.2])];
let refNames=true;function syncLabels(){refLabels.forEach(o=>{const p=o.pos.clone().project(camera),v=refNames&&p.z<1&&p.x>-1.08&&p.x<1.08&&p.y>-1.08&&p.y<1.08;o.el.style.opacity=v?'1':'0';o.el.style.left=((p.x*.5+.5)*innerWidth)+'px';o.el.style.top=((-p.y*.5+.5)*innerHeight)+'px'})}
const card=document.createElement('section');card.className='ref-card';card.innerHTML='<header><b id="refTitle">MÓDULO SMR</b><span>OPEN ◇</span></header><p id="refText"></p>';document.body.appendChild(card);
const refControls=document.createElement('div');refControls.className='ref-controls';refControls.innerHTML='<button id="refPrev">‹</button><div class="ref-view" id="refView">Módulo SMR</div><button id="refNext">›</button><button class="wide" id="refNames">NOMBRES</button><button class="wide" id="refLoops">LOOPS</button><button id="refHome">⌂</button>';document.body.appendChild(refControls);
const views=['reactor','containment','smrVessel','core','controlRods','steamGenerator','primaryPumps','pressurizer','primaryLoop','steamTurbine','generator','condenser','coolingTower','transformer','switchyard','iquitos'];
function syncCard(){const d=components[selectedKey]||components.reactor;document.getElementById('refTitle').textContent=(d.title||selectedKey).toUpperCase();document.getElementById('refText').textContent=d.description||'';document.getElementById('refView').textContent=d.title||selectedKey}
function go(n){let i=views.indexOf(selectedKey);if(i<0)i=0;selectComponent(views[(i+n+views.length)%views.length]);syncCard()}
document.getElementById('refPrev').onclick=()=>go(-1);document.getElementById('refNext').onclick=()=>go(1);document.getElementById('refHome').onclick=()=>{cameraGoal=new THREE.Vector3(28,18,34);targetGoal=new THREE.Vector3(10,3,-3);controls.autoRotate=false};document.getElementById('refNames').onclick=e=>{refNames=!refNames;e.currentTarget.style.opacity=refNames?'1':'.45'};document.getElementById('refLoops').onclick=e=>{const off=e.currentTarget.dataset.off!=='1';e.currentTarget.dataset.off=off?'1':'0';e.currentTarget.style.opacity=off?'.45':'1';flowParticles.forEach(f=>f.dots.forEach(d=>d.visible=!off))};
canvas.addEventListener('pointerup',()=>setTimeout(syncCard,0));document.querySelectorAll('.nav-step,#startTour,#flowButton').forEach(el=>el.addEventListener('click',()=>setTimeout(syncCard,0)));
const oldHot=updateHotspots;updateHotspots=function(){oldHot();syncLabels()};if(typeof addHotspot==='function')addHotspot('coolingTower','TORRES<br><b>ENFRIAMIENTO</b>',[8,9.4,-19.5]);syncCard();


/* --- NuScale-style integral SMR vessel upgrade: compact module, no cooling towers as hero object --- */
{
  const smrKeysToHide = ['reactor','containment','smrVessel','core','controlRods','steamGenerator','pressurizer','primaryPumps'];
  smrKeysToHide.forEach(key => componentGroups[key]?.traverse(o => { o.visible = false; o.userData.hiddenLegacySmr = true; }));
  scene.traverse(o => {
    const key = o.userData?.component;
    if (['primaryLoop','secondaryLoop','coolingTower'].includes(key)) o.visible = false;
  });
  if (Array.isArray(views)) {
    let idx;
    while ((idx = views.indexOf('coolingTower')) >= 0) views.splice(idx, 1);
  }
  delete components.coolingTower;
  refLabels?.filter(o => o.k === 'coolingTower').forEach(o => { o.el.style.display = 'none'; });
  document.querySelectorAll('[data-hotspot="coolingTower"]').forEach(el => { el.style.display = 'none'; });

  const smrMetal = new THREE.MeshStandardMaterial({ color: 0xb9c8c7, roughness: .26, metalness: .82 });
  const smrDark = new THREE.MeshStandardMaterial({ color: 0x24313a, roughness: .38, metalness: .74 });
  const smrBlack = new THREE.MeshStandardMaterial({ color: 0x10171b, roughness: .5, metalness: .66 });
  const smrWater = new THREE.MeshPhysicalMaterial({ color: 0x51d8ef, emissive: 0x18a9d2, emissiveIntensity: .45, transparent: true, opacity: .42, transmission: .22, roughness: .12, depthWrite: false });
  const smrGlass = new THREE.MeshPhysicalMaterial({ color: 0x9fe4f2, transparent: true, opacity: .22, transmission: .38, roughness: .16, depthWrite: false, side: THREE.DoubleSide });
  const smrSteam = new THREE.MeshStandardMaterial({ color: 0xdccaa6, roughness: .24, metalness: .55, emissive: 0xffc979, emissiveIntensity: .08 });
  const smrOrange = new THREE.MeshBasicMaterial({ color: 0xff8a18 });

  function cylBetween(a, b, radius, material, radial = 10) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mid = start.clone().add(end).multiplyScalar(.5);
    const dir = end.clone().sub(start);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), radial), material);
    c.position.copy(mid);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    c.castShadow = true; c.receiveShadow = true;
    return c;
  }
  function addBolts(group, y, radius, count, size = .04) {
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2;
      group.add(mesh(new THREE.CylinderGeometry(size, size, .13, 8), smrMetal, [Math.cos(a) * radius, y, Math.sin(a) * radius]));
    }
  }
  function hideOldLabel(key) {
    refLabels?.filter(o => o.k === key).forEach(o => { o.el.style.display = 'none'; });
  }
  function upsertLabel(key, text, pos) {
    let existing = refLabels?.find(o => o.k === key && o.el.style.display !== 'none');
    if (!existing && typeof label === 'function') {
      existing = label(key, text, pos);
      refLabels.push(existing);
    }
    if (existing) {
      existing.el.style.display = '';
      existing.el.textContent = text;
      existing.pos.set(...pos);
    }
  }

  const containment2 = new THREE.Group();
  containment2.add(mesh(new THREE.CylinderGeometry(1.82, 1.98, 11.2, 96, 1, true, Math.PI * .12, Math.PI * 1.66), smrGlass, [0, 5.7, 0], false, false));
  containment2.add(mesh(new THREE.SphereGeometry(1.82, 96, 20, Math.PI * .12, Math.PI * 1.66, 0, Math.PI / 2), smrGlass, [0, 11.3, 0], false, false));
  containment2.add(mesh(new THREE.CylinderGeometry(1.98, 2.08, .42, 96), smrBlack, [0, .18, 0]));
  addBolts(containment2, .45, 1.88, 42, .035);
  tagGroup(containment2, 'containment');

  const vessel2 = new THREE.Group();
  vessel2.add(mesh(new THREE.CylinderGeometry(1.12, 1.28, 9.9, 96, 1, true, Math.PI * .10, Math.PI * 1.62), smrMetal, [0, 5.3, 0]));
  vessel2.add(mesh(new THREE.SphereGeometry(1.12, 96, 18, Math.PI * .10, Math.PI * 1.62, 0, Math.PI / 2), smrDark, [0, 10.25, 0]));
  vessel2.add(mesh(new THREE.SphereGeometry(1.28, 96, 18, Math.PI * .10, Math.PI * 1.62, Math.PI / 2, Math.PI / 2), smrDark, [0, .35, 0]));
  vessel2.add(mesh(new THREE.CylinderGeometry(1.36, 1.36, .2, 96), smrBlack, [0, 8.1, 0]));
  vessel2.add(mesh(new THREE.CylinderGeometry(1.42, 1.42, .18, 96), smrBlack, [0, 1.2, 0]));
  for (const y of [1.2, 8.1]) addBolts(vessel2, y + .16, 1.45, 36, .035);
  for (const side of [-1, 1]) {
    const nozzle = mesh(new THREE.CylinderGeometry(.18, .18, .72, 24), smrMetal, [side * 1.38, 4.15, .06]);
    nozzle.rotation.z = Math.PI / 2; vessel2.add(nozzle);
    const cap = mesh(new THREE.CylinderGeometry(.26, .26, .1, 24), smrMetal, [side * 1.76, 4.15, .06]);
    cap.rotation.z = Math.PI / 2; vessel2.add(cap);
  }
  tagGroup(vessel2, 'smrVessel');

  const riser2 = new THREE.Group();
  riser2.add(mesh(new THREE.CylinderGeometry(.34, .42, 6.55, 40), smrWater, [0, 4.65, 0], false, false));
  riser2.add(mesh(new THREE.CylinderGeometry(.04, .04, 6.75, 12), acidMat, [0, 4.7, 0], false, false));
  riser2.add(mesh(new THREE.TorusGeometry(.45, .035, 12, 48), rm.cooling, [0, 7.9, 0], true, false));
  tagGroup(riser2, 'riser');

  const core2 = new THREE.Group();
  core2.add(mesh(new THREE.CylinderGeometry(.56, .64, 1.45, 48), warmMat, [0, 1.35, 0]));
  for (let ring = 0; ring < 4; ring++) {
    const n = ring === 0 ? 1 : ring * 8;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, r = ring * .14;
      core2.add(mesh(new THREE.CylinderGeometry(.028, .028, 1.58, 6), ring > 2 ? acidMat : smrSteam, [Math.cos(a) * r, 1.38, Math.sin(a) * r]));
    }
  }
  tagGroup(core2, 'core');

  const reflector2 = new THREE.Group();
  reflector2.add(mesh(new THREE.CylinderGeometry(.78, .82, 1.68, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x8cb2c2, transparent: true, opacity: .28, roughness: .18, side: THREE.DoubleSide }), [0, 1.45, 0], false, false));
  tagGroup(reflector2, 'neutronReflector');

  const rods2 = new THREE.Group();
  rods2.add(mesh(new THREE.BoxGeometry(1.04, .14, 1.04), smrBlack, [0, 9.65, 0]));
  for (let i = 0; i < 17; i++) {
    const a = i / 17 * Math.PI * 2, r = i % 4 === 0 ? .18 : .44;
    rods2.add(mesh(new THREE.CylinderGeometry(.018, .018, 7.8, 8), smrBlack, [Math.cos(a) * r, 5.45, Math.sin(a) * r]));
    rods2.add(mesh(new THREE.CylinderGeometry(.055, .055, .28, 10), smrMetal, [Math.cos(a) * r, 9.93, Math.sin(a) * r]));
  }
  tagGroup(rods2, 'controlRods');

  const sg2 = new THREE.Group();
  for (const side of [-1, 1]) {
    sg2.add(mesh(new THREE.BoxGeometry(.24, 4.45, .88), new THREE.MeshStandardMaterial({ color: 0x8b9897, roughness: .34, metalness: .78 }), [side * .78, 4.75, .18]));
    for (let i = 0; i < 14; i++) {
      const z = -.18 + (i % 7) * .06;
      const x = side * (.66 + Math.floor(i / 7) * .09);
      sg2.add(mesh(new THREE.CylinderGeometry(.014, .014, 4.55, 8), smrSteam, [x, 4.75, z]));
    }
    const uTube = new THREE.Mesh(new THREE.TorusGeometry(.46, .035, 12, 48, Math.PI), smrSteam);
    uTube.position.set(side * .58, 6.95, .18); uTube.rotation.z = side > 0 ? Math.PI : 0; sg2.add(uTube);
  }
  tagGroup(sg2, 'steamGenerator');
  tagGroup(sg2.clone(), 'tubeBundle');

  const press2 = new THREE.Group();
  press2.add(mesh(new THREE.CylinderGeometry(.18, .22, 2.25, 24), smrWater, [.57, 7.25, .55], false, false));
  press2.add(mesh(new THREE.SphereGeometry(.22, 24, 12), rm.primary, [.57, 8.42, .55]));
  tagGroup(press2, 'pressurizer');

  const platform = new THREE.Group();
  platform.add(mesh(new THREE.BoxGeometry(3.5, .12, 2.6), smrDark, [0, 11.12, 0]));
  for (const x of [-1.55, 1.55]) for (const z of [-1.15, 1.15]) platform.add(cylBetween([x, 10.98, z], [x, 12.05, z], .025, smrBlack));
  for (const z of [-1.15, 1.15]) platform.add(cylBetween([-1.7, 11.84, z], [1.7, 11.84, z], .025, smrBlack));
  for (const x of [-1.55, 1.55]) platform.add(cylBetween([x, 11.84, -1.25], [x, 11.84, 1.25], .025, smrBlack));
  for (const x of [-1.1, 1.1]) { platform.add(cylBetween([x, 8.9, .95], [x, 11.15, .95], .035, smrBlack)); platform.add(cylBetween([x, 8.9, -.95], [x, 11.15, -.95], .035, smrBlack)); }
  tagGroup(platform, 'supportTrunnion');

  const steamLine2 = pipe([[.42,10.1,0],[.42,11.7,.55],[1.15,12.15,.55],[2.75,12.15,.55]], .08, smrSteam, 'steamLine');
  const feedLine2 = pipe([[-.42,10.0,0],[-.42,11.65,-.55],[-1.15,12.05,-.55],[-2.55,12.05,-.55]], .065, rm.cooling, 'feedwaterLine');
  steamLine2.visible = true; feedLine2.visible = true;

  const moduleShadow = new THREE.Group();
  moduleShadow.add(mesh(new THREE.CylinderGeometry(2.2, 2.35, .28, 96), new THREE.MeshStandardMaterial({ color: 0x1b2f2f, roughness: .8, metalness: .15 }), [0, -.02, 0]));
  tagGroup(moduleShadow, 'reactor');

  components.reactor = { index:'01 / 06', icon:'SMR', kicker:'MÓDULO INTEGRAL · CIRCULACIÓN NATURAL', title:'SMR integral tipo NuScale', description:'Vasija vertical compacta con contención, reactor pressure vessel, riser, núcleo, reflector, barras de control, generadores de vapor internos y líneas superiores de vapor/feedwater.', a:'≤300', au:'MWe', al:'Rango SMR de referencia', b:'NAT', bu:'circ', bl:'Circulación natural conceptual', camera:[5.8,8.2,15.2], target:[0,5.8,0] };
  Object.assign(components, {
    riser:{index:'SMR / RISER',icon:'RIS',kicker:'CIRCULACIÓN NATURAL',title:'Riser central',description:'Columna ascendente: el refrigerante caliente sube por diferencia de densidad y sostiene la circulación natural dentro del módulo.',a:'↑',au:'flujo',al:'Ascenso caliente',b:'sin',bu:'bomba',bl:'Concepto natural',camera:[4.8,7.4,10.5],target:[0,4.8,0]},
    neutronReflector:{index:'SMR / REFL',icon:'REF',kicker:'ECONOMÍA NEUTRÓNICA',title:'Reflector neutrónico',description:'Anillo alrededor del combustible que ayuda a devolver neutrones hacia el núcleo y mejora eficiencia del diseño.',a:'core',au:'',al:'Alrededor del núcleo',b:'η',bu:'',bl:'Mejora uso de neutrones',camera:[4.3,4.4,8.4],target:[0,1.55,0]},
    tubeBundle:{index:'SMR / HX',icon:'HX',kicker:'HEAT-EXCHANGE TUBE BUNDLE',title:'Haz de tubos de intercambio',description:'Conjunto de tubos verticales del generador de vapor; transfiere calor al circuito secundario sin mezclarlo con el primario.',a:'0',au:'mezcla',al:'Separación de circuitos',b:'HX',bu:'',bl:'Intercambio térmico',camera:[4.7,6.2,9.1],target:[.75,4.9,.1]},
    steamLine:{index:'SEC / STM',icon:'STM',kicker:'STEAM LINE',title:'Línea de vapor',description:'Salida superior del vapor secundario hacia la turbina/generador. En esta vista se muestra como tubería superior beige.',a:'vapor',au:'',al:'Hacia turbina',b:'↑',bu:'',bl:'Salida superior',camera:[4.6,11.6,8.8],target:[.9,11.55,.4]},
    feedwaterLine:{index:'SEC / FWD',icon:'FWD',kicker:'FEEDWATER LINE',title:'Línea de agua de alimentación',description:'Retorno de agua al generador de vapor para cerrar el ciclo secundario después del condensador.',a:'agua',au:'',al:'Retorno secundario',b:'↻',bu:'',bl:'Ciclo cerrado',camera:[-4.8,11.4,8.8],target:[-.9,11.5,-.4]},
    supportTrunnion:{index:'SMR / SUP',icon:'SUP',kicker:'SOPORTE Y PLATAFORMA',title:'Soporte superior y plataforma',description:'Estructura superior para tuberías, acceso e instrumentación; representa el aspecto industrial compacto del módulo.',a:'modular',au:'',al:'Montaje de fábrica',b:'transport',bu:'',bl:'Transportable',camera:[5.6,12.4,9.7],target:[0,10.9,0]}
  });
  components.containment.camera = [5.8,8.1,13.7]; components.containment.target = [0,5.9,0]; components.containment.title = 'Containment vessel'; components.containment.description = 'Vasija externa de contención del módulo integral. Se ve semitransparente/cortada para observar el reactor interior.';
  components.smrVessel.camera = [4.8,7.5,10.8]; components.smrVessel.target = [0,5.1,0]; components.smrVessel.title = 'Reactor pressure vessel'; components.smrVessel.description = 'Vasija de presión interna que aloja núcleo, riser y refrigerante primario en configuración compacta vertical.';
  components.core.camera = [4.3,3.6,7.7]; components.core.target = [0,1.4,0]; components.core.title = 'Reactor core / fuel assembly'; components.core.description = 'Zona inferior del módulo con arreglos de combustible. La escala visual enfatiza combustible, reflector y barras de control.';
  components.controlRods.camera = [4.7,8.8,8.6]; components.controlRods.target = [0,5.8,0]; components.controlRods.title = 'Control rods'; components.controlRods.description = 'Barras verticales de control y parada que descienden desde la parte superior hacia el núcleo.';
  components.steamGenerator.camera = [5.2,6.4,9.3]; components.steamGenerator.target = [.75,5,0]; components.steamGenerator.title = 'Steam generator interno'; components.steamGenerator.description = 'Generadores de vapor integrados al módulo, a los lados del riser, con haces de tubos de intercambio.';
  components.pressurizer.camera = [4.8,8.6,8.8]; components.pressurizer.target = [.55,7.8,.55]; components.pressurizer.title = 'Pressurizer interno'; components.pressurizer.description = 'Volumen presurizador integrado para mantener el primario en condiciones de operación estable.';
  facts.reactor = [['Qué cambió','La escena ahora representa un SMR integral vertical tipo NuScale, no una central PWR con torres.'],['Componentes visibles','Containment vessel, RPV, riser, steam generator, tube bundle, pressurizer, control rods, reflector, fuel assembly y líneas superiores.']];
  facts.riser = [['Función','Permite circulación natural del refrigerante por diferencia de densidad.'],['Clave SMR','Reduce dependencia visual de bombas externas grandes.']];
  facts.neutronReflector = [['Función','Rodea el núcleo y ayuda a mejorar economía neutrónica.'],['Ubicación','Anillo inferior alrededor del combustible.']];
  facts.tubeBundle = [['Función','Transferir calor al secundario dentro del generador de vapor.'],['Separación','Primario y secundario no se mezclan.']];
  facts.steamLine = [['Función','Lleva vapor secundario hacia turbina.'],['Visual','Tubería superior beige, como en el esquema de referencia.']];
  facts.feedwaterLine = [['Función','Retorna agua de alimentación al generador de vapor.'],['Visual','Tubería superior de retorno.']];
  facts.supportTrunnion = [['Función','Soporte, plataforma e instrumentación superior.'],['SMR','Refuerza el aspecto modular/transportable.']];

  ['smrVessel','steamGenerator','primaryPumps','pressurizer','steamTurbine','generator','condenser','transformer','switchyard'].forEach(hideOldLabel);
  upsertLabel('containment','CONTAINMENT VESSEL',[0,9.25,-.45]);
  upsertLabel('smrVessel','REACTOR PRESSURE VESSEL',[0,6.45,.55]);
  upsertLabel('steamGenerator','STEAM GENERATOR',[.98,5.85,.35]);
  upsertLabel('tubeBundle','HEAT-EXCHANGE TUBE BUNDLE',[1.05,4.35,.55]);
  upsertLabel('riser','RISER',[0,6.25,0]);
  upsertLabel('pressurizer','PRESSURIZER',[.58,8.55,.62]);
  upsertLabel('controlRods','CONTROL RODS',[0,8.85,.22]);
  upsertLabel('core','REACTOR CORE / FUEL ASSEMBLY',[0,2.1,.45]);
  upsertLabel('neutronReflector','NEUTRON REFLECTOR',[0,1.75,.75]);
  upsertLabel('steamLine','STEAM LINE',[1.65,12.25,.55]);
  upsertLabel('feedwaterLine','FEEDWATER LINE',[-1.65,12.15,-.55]);

  addHotspot('riser','RISER<br><b>CIRCULACIÓN</b>',[0,6.5,0]);
  addHotspot('tubeBundle','TUBOS<br><b>HX</b>',[1.02,5.15,.4]);
  addHotspot('steamLine','STEAM<br><b>LINE</b>',[1.7,12.2,.55]);
  addHotspot('feedwaterLine','FEEDWATER<br><b>LINE</b>',[-1.7,12.1,-.55]);
  addHotspot('neutronReflector','NEUTRON<br><b>REFLECTOR</b>',[0,1.9,.75]);
  addHotspot('supportTrunnion','SUPPORT<br><b>TRUNNION</b>',[0,11.55,0]);

  if (Array.isArray(views)) {
    const insert = ['riser','tubeBundle','steamLine','feedwaterLine','neutronReflector','supportTrunnion'];
    const anchor = Math.max(1, views.indexOf('steamGenerator') + 1);
    insert.forEach((key, offset) => { if (!views.includes(key)) views.splice(anchor + offset, 0, key); });
  }
  const legendTitle = techLegend?.querySelector('h3');
  if (legendTitle) legendTitle.textContent = 'SMR INTEGRAL · CIRCUITOS';
  const refTitle = document.getElementById('refTitle');
  if (refTitle) refTitle.textContent = 'SMR INTEGRAL TIPO NUSCALE';
  camera.position.set(5.8, 8.2, 15.2);
  controls.target.set(0, 5.8, 0);
  controls.minDistance = 5.5;
  controls.maxDistance = 42;
  selectComponent('reactor', false);
  renderFacts();
  syncCard();
}


/* --- SMR integral framing tune: show full vertical module on first load --- */
{
  if (components.reactor) {
    components.reactor.camera = [7.2, 8.6, 22.5];
    components.reactor.target = [0, 5.75, 0];
  }
  controls.minDistance = 7.5;
  controls.maxDistance = 46;
  camera.position.set(7.2, 8.6, 22.5);
  controls.target.set(0, 5.75, 0);
  selectComponent('reactor', false);
  syncCard();
}
