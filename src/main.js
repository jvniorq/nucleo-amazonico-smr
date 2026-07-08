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
