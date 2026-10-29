/* stce-3d.js — موديلات 3D التفاعلية لمنصة STCE
 * ملف منفصل بيتضاف على المنصة بسطر واحد:
 *   <script type="module" src="stce-3d.js"></script>
 * لازم يتحط بعد سكريبت الـ 3D القديم، عشان يستبدل window.__stceModule3DOpen.
 * المحرك بيتحمّل أول مرة المتدرب يفتح موديل بس، فمش بيبطّأ المنصة.
 */
if(typeof window.__stceModule3DOpen === 'function' && !window.__stceModule3DOpenLegacy) window.__stceModule3DOpenLegacy = window.__stceModule3DOpen;

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.172.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/controls/OrbitControls.js/+esm';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/environments/RoomEnvironment.js/+esm';

/* ---------- واجهة العرض (بتتعمل مرة واحدة جوه المنصة) ---------- */
const root3d = document.createElement('div');
root3d.id = 's3d-root'; root3d.hidden = true; root3d.setAttribute('dir', 'rtl');
root3d.innerHTML = `
<div class="s3d-box" role="dialog" aria-modal="true" aria-labelledby="s3d-title">
  <div class="s3d-head">
    <div class="s3d-titles"><div class="s3d-eyebrow">موديل 3D تفاعلي</div><h2 id="s3d-title"></h2></div>
    <button class="s3d-btn s3d-close" id="s3d-close" type="button" aria-label="إغلاق">✕</button>
  </div>
  <nav class="s3d-tabs" id="s3d-tabs" role="tablist"></nav>
  <div class="s3d-main">
    <div class="s3d-stagecol">
      <section class="s3d-stage" id="s3d-stage">
        <div id="s3d-canvasHost"></div>
        <div id="s3d-markers"></div>
        <div class="s3d-hud">
          <button class="s3d-btn" id="s3d-resetBtn" type="button">إعادة الضبط</button>
          <div class="s3d-phase" id="s3d-phase" hidden><b id="s3d-phaseName"></b><span class="s3d-deg">زاوية الكرنك <span id="s3d-phaseDeg">0°</span></span></div>
        </div>
        <div class="s3d-toast" id="s3d-toast" role="status" hidden></div>
        <div class="s3d-hint" id="s3d-hint"></div>
      </section>
      <div class="s3d-enginebar" id="s3d-engineBar" hidden>
        <button class="s3d-btn s3d-primary" id="s3d-runBtn" type="button">إيقاف الموتور</button>
        <label for="s3d-speed">السرعة <input type="range" id="s3d-speed" min="0" max="9" step="1" value="1"></label>
        <span class="s3d-rpm" id="s3d-rpm"></span>
      </div>
    </div>
    <div class="s3d-side">
      <section class="s3d-card" aria-live="polite">
        <div class="s3d-stepmeta">الخطوة <span id="s3d-stepNo">1</span> من <span id="s3d-stepCount">1</span></div>
        <h3 id="s3d-stepTitle"></h3>
        <p id="s3d-stepText"></p>
        <div class="s3d-stepnav">
          <button class="s3d-btn" id="s3d-prevBtn" type="button">السابق</button>
          <div class="s3d-dots" id="s3d-dots"></div>
          <button class="s3d-btn s3d-primary" id="s3d-nextBtn" type="button">التالي</button>
        </div>
      </section>
      <section class="s3d-card"><h4>القطع</h4><ol class="s3d-parts" id="s3d-parts"></ol></section>
    </div>
  </div>
</div>`;
const styleEl = document.createElement('style'); styleEl.textContent = `
#s3d-root{--bg:#0b1220;--surface:#151e2e;--fg:#e8edf3;--muted:#95a2b3;--line:#273246;--accent:#f0b429;--accent-ink:#1b1405;--accent-soft:#3a2d10;--mk-bg:rgba(18,25,35,.9);
  position:fixed;inset:0;z-index:2147483000;background:rgba(4,8,16,.88);overflow:auto;-webkit-overflow-scrolling:touch;font-family:'Cairo',Tahoma,sans-serif;color:var(--fg);line-height:1.7;font-size:15px;
  padding:max(12px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px))}
#s3d-root[hidden]{display:none!important}
#s3d-root *{box-sizing:border-box}
#s3d-root [hidden]{display:none!important}
#s3d-root .s3d-box{max-width:1180px;margin:0 auto;background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:14px;display:grid;gap:12px}
#s3d-root .s3d-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#s3d-root .s3d-eyebrow{font-size:12px;color:var(--accent)}
#s3d-root h2{margin:0;font-size:clamp(17px,4vw,22px);line-height:1.4;color:var(--fg);font-weight:700}
#s3d-root .s3d-tabs{display:flex;gap:8px;flex-wrap:wrap}
#s3d-root .s3d-tabs:empty{display:none}
#s3d-root .s3d-tab{font:inherit;cursor:pointer;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:10px;padding:6px 14px}
#s3d-root .s3d-tab[aria-selected="true"]{border-color:var(--accent);background:var(--accent-soft)}
#s3d-root .s3d-main{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media (min-width:920px){#s3d-root .s3d-main{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:start}}
#s3d-root .s3d-stagecol{display:grid;gap:10px;min-width:0}
#s3d-root .s3d-stage{position:relative;height:min(62vh,560px,max(340px,110vw));border-radius:14px;overflow:hidden;background:radial-gradient(120% 90% at 50% 18%,#2a374b,#121923);touch-action:none}
#s3d-canvasHost,#s3d-canvasHost canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#s3d-markers{position:absolute;inset:0;pointer-events:none}
#s3d-root .s3d-mk{position:absolute;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:2px solid var(--accent);background:var(--mk-bg);color:var(--fg);font:700 13px/22px monospace;text-align:center;padding:0;cursor:pointer;pointer-events:auto}
#s3d-root .s3d-mk.s3d-sel{background:var(--accent);color:var(--accent-ink);z-index:2}
#s3d-root .s3d-mk.s3d-back{opacity:.45}
#s3d-root .s3d-mk-tag{position:absolute;left:0;top:0;pointer-events:none;white-space:nowrap;background:var(--accent);color:var(--accent-ink);font-size:13px;font-weight:700;padding:3px 10px;border-radius:8px;transform:translate(-50%,-150%);z-index:3}
#s3d-root .s3d-hud{position:absolute;inset:10px 10px auto 10px;display:flex;justify-content:space-between;gap:8px;pointer-events:none}
#s3d-root .s3d-hud>*{pointer-events:auto}
#s3d-root .s3d-btn{font:inherit;font-size:14px;cursor:pointer;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:10px;padding:6px 12px;white-space:nowrap}
#s3d-root .s3d-btn:disabled{opacity:.4;cursor:default}
#s3d-root .s3d-btn:focus-visible,#s3d-root .s3d-mk:focus-visible,#s3d-root .s3d-part:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
#s3d-root .s3d-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700}
#s3d-root .s3d-close{font-size:16px;padding:4px 12px}
#s3d-root .s3d-phase{background:var(--mk-bg);border:1px solid var(--line);border-radius:10px;padding:5px 11px;font-size:13px;display:grid;line-height:1.45;white-space:nowrap}
#s3d-root .s3d-phase b{color:var(--accent)}
#s3d-root .s3d-deg{color:var(--muted);font-size:12px}
#s3d-root .s3d-hint{position:absolute;inset:auto 12px 10px 12px;text-align:center;font-size:12px;opacity:.75;pointer-events:none}
#s3d-root .s3d-toast{position:absolute;inset:auto 12px 40px 12px;margin-inline:auto;max-width:420px;text-align:center;background:var(--accent);color:var(--accent-ink);font-weight:700;font-size:13.5px;border-radius:10px;padding:7px 12px;pointer-events:none}
#s3d-root .s3d-enginebar{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 14px}
#s3d-root .s3d-enginebar label{display:flex;align-items:center;gap:10px;flex:1 1 180px}
#s3d-root .s3d-enginebar input{flex:1;min-width:0;accent-color:var(--accent)}
#s3d-root .s3d-rpm{color:var(--muted);font-size:13px;white-space:nowrap}
#s3d-root .s3d-side{display:grid;gap:12px;min-width:0}
#s3d-root .s3d-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;gap:8px;min-width:0}
#s3d-root .s3d-stepmeta{font-size:12.5px;color:var(--muted)}
#s3d-root .s3d-card h3{margin:0;font-size:18px;line-height:1.4;color:var(--fg)}
#s3d-root .s3d-card h4{margin:0;font-size:14px;color:var(--muted)}
#s3d-root .s3d-card p{margin:0;color:var(--fg)}
#s3d-root .s3d-stepnav{display:flex;align-items:center;justify-content:space-between;gap:10px}
#s3d-root .s3d-dots{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
#s3d-root .s3d-dot{width:10px;height:10px;border-radius:50%;border:0;padding:0;background:var(--line);cursor:pointer}
#s3d-root .s3d-dot[aria-current="true"]{background:var(--accent);width:22px;border-radius:6px}
#s3d-root .s3d-parts{list-style:none;margin:0;padding:0;display:grid;gap:4px}
#s3d-root .s3d-part{font:inherit;width:100%;cursor:pointer;display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;align-items:start;text-align:start;background:transparent;border:1px solid transparent;border-radius:10px;padding:7px 8px;color:var(--fg)}
#s3d-root .s3d-part.s3d-sel{border-color:var(--accent);background:var(--accent-soft)}
#s3d-root .s3d-n{width:26px;height:26px;border-radius:50%;border:2px solid var(--accent);font:700 13px/22px monospace;text-align:center}
#s3d-root .s3d-part.s3d-sel .s3d-n{background:var(--accent);color:var(--accent-ink)}
#s3d-root .s3d-part b{font-weight:700;display:block;line-height:1.4}
#s3d-root .s3d-part span{color:var(--muted);font-size:13px;line-height:1.5}
#s3d-root .s3d-err{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px}
`;
document.head.appendChild(styleEl); document.body.appendChild(root3d);
const $ = id => document.getElementById('s3d-' + id);
const stageEl = $('stage'), host = $('canvasHost'), markerLayer = $('markers');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GOLD = new THREE.Color(0xffc23a);

/* ---------- محرك العرض ---------- */
let renderer, scene, camera, controls, userMoved = false, engineReady = false;
function initEngine(){
if(engineReady) return true;
try{
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
}catch(e){
  stageEl.insertAdjacentHTML('beforeend', '<div class="s3d-err">الجهاز ده مش بيدعم عرض 3D (WebGL). جرّب من متصفح Chrome أو من الكمبيوتر.</div>');
  return false;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.HemisphereLight(0xffffff, 0x3d475a, 0.9));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.1); keyLight.position.set(3, 8, 5); scene.add(keyLight);
keyLight.castShadow = true; keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.bias = -.0005; keyLight.shadow.normalBias = .02;
Object.assign(keyLight.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: .5, far: 20 });
const rimLight = new THREE.DirectionalLight(0xbcd4ff, 0.8); rimLight.position.set(-6, 3, -5); scene.add(rimLight);
camera = new THREE.PerspectiveCamera(38, 1, 0.05, 200);
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.enablePan = false; controls.rotateSpeed = 0.8;
controls.autoRotateSpeed = 0.5;
controls.addEventListener('start', () => { controls.autoRotate = false; userMoved = true; });
new ResizeObserver(() => { if(root3d.hidden) return; const before = camera.aspect; resize(); if(Math.abs(before - camera.aspect) > .05) fit(); }).observe(host);
wirePicking();
engineReady = true; return true;
}

/* ---------- أدوات بناء القطع ---------- */
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.shared = true; return t;
})();
function M(color, o = {}){
  const opacity = o.opacity ?? 1;
  return new THREE.MeshStandardMaterial({ color, roughness: o.r ?? .55, metalness: o.m ?? .1,
    transparent: opacity < 1, opacity, depthWrite: o.depthWrite ?? (opacity >= 1),
    side: o.side ?? THREE.FrontSide, emissive: 0x000000 });
}
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const cyl = (rt, rb, h, m, seg = 32, open = false) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), m);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (cur, target, dt, k = 5) => cur + (target - cur) * Math.min(1, dt * k);
function baseE(m){ if(!m.userData.baseE){ m.userData.baseE = m.emissive.clone(); m.userData.baseI = m.emissiveIntensity; } return m.userData.baseE; }

function textSprite(text, color, scale = .22){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.font = 'bold 84px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(10,14,20,.85)'; g.strokeText(text, 64, 68); g.fillStyle = color; g.fillText(text, 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.setScalar(scale); return s;
}
function polyPath(pts){ const p = new THREE.CurvePath(); for(let i = 0; i < pts.length - 1; i++) p.add(new THREE.LineCurve3(pts[i], pts[i + 1])); return p; }
function wireMesh(pts, color, r = .034){
  const path = polyPath(pts);
  return new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(24, (pts.length - 1) * 24), r, 10, false), M(color, { r: .45 }));
}
function shadowPlane(w, d){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x000000, transparent: true, opacity: .45, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.userData.noFit = true; return m;
}

class Flow{
  constructor(parent, path, { color = 0xffd34d, count = 16, speed = 1, size = .05 } = {}){
    this.path = path; this.len = path.getLength(); this.speed = speed; this.level = 0; this.target = 0; this.items = [];
    const geo = new THREE.SphereGeometry(size, 12, 8), mat = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    for(let i = 0; i < count; i++){ const m = new THREE.Mesh(geo, mat); m.userData.t = i / count; m.visible = false; parent.add(m); this.items.push(m); }
  }
  update(dt){
    this.level = ease(this.level, this.target, dt, 4);
    const vis = this.level > .04;
    for(const m of this.items){
      m.visible = vis; if(!vis) continue;
      m.userData.t = (m.userData.t + dt * this.speed * Math.max(.25, this.level) / this.len) % 1;
      m.position.copy(this.path.getPointAt(m.userData.t)); m.scale.setScalar(this.level);
    }
  }
}

function makeCtx(){
  const root = new THREE.Group(), parts = {}, order = [];
  function part(id, obj, anchor, label, desc){
    const mats = [];
    obj.traverse(o => { if(o.isMesh){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if(m.emissive && !mats.includes(m)){ baseE(m); mats.push(m); } }); } });
    const a = new THREE.Object3D(); a.position.copy(anchor); obj.add(a);
    parts[id] = { obj, anchor: a, mats, label, desc }; order.push(id); return obj;
  }
  return { root, parts, order, part };
}

/* ---------- مكتبة القطع ---------- */
function makeBoard(){
  const g = new THREE.Group();
  const top = at(box(4.6, .14, 3.2, M(0xc89f6a, { r: .8 })), 0, -.07, 0); top.userData.receiver = true; g.add(top);
  g.add(at(shadowPlane(7, 5.2), 0, -.16, 0));
  return g;
}
function makeBattery(){
  const g = new THREE.Group();
  g.add(at(box(.52, .06, 1.0, M(0x3a414d, { r: .7 })), 0, .03, 0));
  const body = cyl(.2, .2, .8, M(0x2c6fd6, { r: .35, m: .2 })); body.rotation.x = Math.PI / 2; g.add(at(body, 0, .26, 0));
  const band = cyl(.205, .205, .2, M(0xd9a441, { r: .3, m: .7 })); band.rotation.x = Math.PI / 2; g.add(at(band, 0, .26, -.3));
  const pos = cyl(.07, .07, .1, M(0xd3d8de, { m: .9, r: .25 })); pos.rotation.x = Math.PI / 2; g.add(at(pos, 0, .26, -.45));
  g.add(at(textSprite('+', '#ff7a6b'), 0, .58, -.36));
  g.add(at(textSprite('−', '#9cc2ff'), 0, .58, .36));
  g.add(at(textSprite('12V', '#ffffff', .3), 0, .56, 0));
  const neg = cyl(.09, .09, .04, M(0x9aa3af, { m: .9, r: .3 })); neg.rotation.x = Math.PI / 2; g.add(at(neg, 0, .26, .42));
  return { group: g, plus: V(0, .26, -.5), minus: V(0, .26, .44) };
}
function makeSwitch(){
  const g = new THREE.Group();
  g.add(at(box(.86, .08, .4, M(0x353c48, { r: .6 })), 0, .04, 0));
  const metal = M(0xd3d8de, { m: .9, r: .25 }), brass = M(0xd9a441, { m: .85, r: .3 });
  [-.28, .28].forEach(x => g.add(at(box(.07, .2, .14, metal), x, .18, 0)));
  [-.38, .38].forEach(x => g.add(at(cyl(.04, .04, .06, brass, 12), x, .11, 0)));
  const pivot = new THREE.Group(); pivot.position.set(-.28, .27, 0);
  pivot.add(at(box(.62, .04, .1, metal), .31, 0, 0));
  pivot.add(at(cyl(.045, .045, .26, M(0xd64545, { r: .4 })), .6, .13, 0));
  g.add(pivot);
  let a = 1.0, target = 1.0;
  return { group: g, tL: V(-.38, .14, 0), tR: V(.38, .14, 0), set(on){ target = on ? 0 : 1.0; }, update(dt){ a = ease(a, target, dt, 7); pivot.rotation.z = a; } };
}
function makeLamp(){
  const g = new THREE.Group();
  g.add(at(box(.62, .05, .26, M(0x353c48, { r: .6 })), 0, .025, 0));
  const brass = M(0xd9a441, { m: .85, r: .3 });
  [-.25, .25].forEach(x => g.add(at(cyl(.04, .04, .06, brass, 12), x, .08, 0)));
  g.add(at(cyl(.15, .17, .07, M(0x4a5262, { r: .6 })), 0, .085, 0));
  const bulb = new THREE.Group(); g.add(bulb);
  bulb.add(at(cyl(.11, .13, .16, M(0xb9c0c9, { m: .85, r: .3 })), 0, .2, 0));
  const glassM = M(0xfff4d6, { r: .08, m: 0, opacity: .42 });
  bulb.add(at(new THREE.Mesh(new THREE.SphereGeometry(.21, 32, 24), glassM), 0, .46, 0));
  const filM = M(0x8a6a3a, { m: .3, r: .4 });
  bulb.add(at(new THREE.Mesh(new THREE.TorusGeometry(.065, .014, 8, 24, Math.PI), filM), 0, .43, 0));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc65a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.set(0, .46, 0); bulb.add(glow);
  const light = new THREE.PointLight(0xffc06a, 0, 3.2, 2); light.position.set(0, .46, 0); bulb.add(light);
  let level = 0, target = 0, lift = 0, liftT = 0;
  return {
    group: g, tL: V(-.25, .1, 0), tR: V(.25, .1, 0),
    set(l){ target = l; }, out(v){ liftT = v ? 1 : 0; },
    update(dt){
      level = ease(level, target, dt, 6); lift = ease(lift, liftT, dt, 5);
      bulb.position.y = lift * .7; bulb.rotation.x = lift * .3;
      baseE(glassM).setRGB(1, .72, .32).multiplyScalar(level * .9); glassM.userData.baseI = 1;
      baseE(filM).setRGB(1, .8, .4).multiplyScalar(level); filM.userData.baseI = 3;
      glow.material.opacity = level * .95; glow.scale.setScalar(.3 + 1.1 * level);
      light.intensity = 4 * level;
    }
  };
}
function makeMeter(unit){
  const g = new THREE.Group();
  g.add(at(box(.6, .14, .82, M(0xf2b51e, { r: .5 })), 0, .07, 0));
  g.add(at(box(.5, .02, .3, M(0x20252d, { r: .6 })), 0, .15, -.17));
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(.44, .22), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.rotation.x = -Math.PI / 2; g.add(at(screen, 0, .162, -.17));
  const dial = cyl(.11, .11, .05, M(0x2b3038, { r: .5 })); g.add(at(dial, 0, .165, .12));
  g.add(at(box(.03, .02, .1, M(0xffffff)), 0, .195, .08));
  g.add(at(cyl(.035, .035, .05, M(0xd23a2e)), -.15, .165, .33));
  g.add(at(cyl(.035, .035, .05, M(0x111418)), .15, .165, .33));
  g.add(at(textSprite(unit, '#ffffff', .2), .22, .3, .12));
  function setText(s){
    const x = c.getContext('2d'); x.fillStyle = '#b9cba0'; x.fillRect(0, 0, 256, 128);
    x.fillStyle = '#18200f'; x.font = 'bold 64px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(s, 128, 68); tex.needsUpdate = true;
  }
  setText('0.00');
  return { group: g, setText, red: V(-.15, .19, .33), black: V(.15, .19, .33) };
}

/* ---------- الموديلات ---------- */
const WY = .05;
const P = (x, z) => V(x, WY, z);

// سلك مقوّس بين نقطتين (زي السلك الحقيقي اللي مرفوع عن اللوحة)
function arch(a, b, h = .22){ return new THREE.QuadraticBezierCurve3(a, a.clone().add(b).multiplyScalar(.5).add(V(0, h, 0)), b); }
function wireOn(group, curve, color, r = .03){ const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 10, false), M(color, { r: .45 })); group.add(m); return m; }
function chain(...curves){ const p = new THREE.CurvePath(); curves.forEach(c => p.add(c)); return p; }
const line = (a, b) => new THREE.LineCurve3(a, b);
function termOf(obj, local){ obj.updateMatrixWorld(true); return obj.localToWorld(local.clone()); }

function buildSeries(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(makeBoard());
  const bat = makeBattery(); at(bat.group, -1.75, 0, 0); root.add(bat.group);
  const l1 = makeLamp(); at(l1.group, -.6, 0, -1); root.add(l1.group);
  const l2 = makeLamp(); at(l2.group, .7, 0, -1); root.add(l2.group);
  const am = makeMeter('A'); at(am.group, 1.65, 0, -.15); root.add(am.group);
  const sw = makeSwitch(); at(sw.group, .1, 0, 1); root.add(sw.group);
  const bP = termOf(bat.group, bat.plus), bN = termOf(bat.group, bat.minus);
  const a1 = termOf(l1.group, l1.tL), b1 = termOf(l1.group, l1.tR), a2 = termOf(l2.group, l2.tL), b2 = termOf(l2.group, l2.tR);
  const mR = termOf(am.group, am.red), mB = termOf(am.group, am.black);
  const sR = termOf(sw.group, sw.tR), sL = termOf(sw.group, sw.tL);
  const w = [arch(bP, a1), arch(b1, a2, .18), arch(b2, mR, .3), arch(mB, sR, .3), arch(sL, bN, .26)];
  const wires = new THREE.Group(); root.add(wires);
  w.forEach((c, i) => wireOn(wires, c, i < 3 ? 0xd0473a : 0x2b2f38));
  part('battery', bat.group, V(0, .62, 0), 'البطارية', 'مصدر جهد 12 فولت. التيار بيطلع من الموجب (+).');
  part('switch', sw.group, V(0, .55, 0), 'المفتاح', 'دوس عليه في الموديل عشان تقفله أو تفتحه.');
  part('lamp1', l1.group, V(0, .72, 0), 'اللمبة الأولى', 'دوس عليها عشان تشيلها أو ترجّعها.');
  part('lamp2', l2.group, V(0, .72, 0), 'اللمبة التانية', 'بعد الأولى على طول، في نفس المسار.');
  part('ammeter', am.group, V(0, .36, -.1), 'الأميتر', 'بيقيس شدة التيار، ومتوصل توالي.');
  part('wire', wires, w[3].getPoint(.5), 'الأسلاك', 'مسار واحد بس للتيار، من غير تفريعات.');
  const flow = new Flow(root, chain(w[0], line(a1, b1), w[1], line(a2, b2), w[2], line(mR, mB), w[3], line(sR, sL), w[4], line(bN, bP)), { count: 30, speed: 1.2 });
  const st = { sw: 0, out1: 0, out2: 0 };
  function derive(){
    const closed = st.sw && !st.out1 && !st.out2;
    sw.set(!!st.sw); l1.set(closed ? .42 : 0); l2.set(closed ? .42 : 0); l1.out(st.out1); l2.out(st.out2);
    flow.target = closed ? 1 : 0; am.setText(closed ? '0.25' : '0.00');
    return closed;
  }
  const lampTap = (k, name) => () => { st[k] = st[k] ? 0 : 1; const c = derive(); return st[k] ? `${name} اتشالت، والدائرة كلها فصلت.` : (c ? `${name} رجعت، والتيار رجع يمشي.` : `${name} رجعت مكانها.`); };
  ctx.parts.switch.tap = () => { st.sw = st.sw ? 0 : 1; const c = derive(); return st.sw ? (c ? 'المفتاح اتقفل: التيار ماشي واللمبتين نوّروا.' : 'المفتاح اتقفل، بس فيه لمبة مشالة فالدائرة لسه مفتوحة.') : 'المفتاح اتفتح: الدائرة فصلت.'; };
  ctx.parts.lamp1.tap = lampTap('out1', 'اللمبة الأولى');
  ctx.parts.lamp2.tap = lampTap('out2', 'اللمبة التانية');
  return {
    ...ctx, view: V(.3, 1.3, 1.5), sway: true, hint: 'دوس على المفتاح أو اللمبة · صباعين للتقريب',
    steps: [
      { title: 'مكونات دائرة التوالي', text: 'بطارية 12 فولت، ولمبتين، وأميتر، ومفتاح. كلهم متوصلين ورا بعض في مسار واحد بس، زي حبات السبحة. الموديل تفاعلي: دوس على المفتاح أو على أي لمبة.', s: { sw: 0, out1: 0, out2: 0 } },
      { title: 'اقفل المفتاح', text: 'لما المفتاح يتقفل، التيار بيطلع من القطب الموجب ويعدّي على اللمبتين واحدة ورا التانية والأميتر ويرجع للسالب. النقط الصفرا بتوري اتجاه التيار.', focus: 'switch', s: { sw: 1, out1: 0, out2: 0 } },
      { title: 'تيار واحد في كل الدائرة', text: 'الأميتر بيقرا 0.25 أمبير، ونفس القراية في أي حتة في الدائرة. والجهد بيتقسم: كل لمبة واخدة 6 فولت بس، عشان كده نورهم أضعف.', focus: 'ammeter', s: { sw: 1, out1: 0, out2: 0 } },
      { title: 'لو لمبة اتشالت', text: 'شيل لمبة واحدة والدائرة كلها تفصل، والتانية تطفى، والأميتر يقرا صفر. جرّب ترجّعها بالدوس عليها. ده عيب التوالي، وعشان كده نور البيت مش بيتوصل بالطريقة دي.', focus: 'lamp2', s: { sw: 1, out1: 0, out2: 1 } }
    ],
    apply(s){ Object.assign(st, s); derive(); },
    update(dt){ sw.update(dt); l1.update(dt); l2.update(dt); flow.update(dt); }
  };
}

function buildParallel(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(makeBoard());
  const bat = makeBattery(); at(bat.group, -1.8, 0, 0); root.add(bat.group);
  const sw = makeSwitch(); at(sw.group, -.85, 0, -1.05); root.add(sw.group);
  const xs = [.4, 1.35];
  const lamps = xs.map(x => { const l = makeLamp(); at(l.group, x, 0, 0); l.group.rotation.y = Math.PI / 2; root.add(l.group); return l; });
  const vm = makeMeter('V'); at(vm.group, 2.1, 0, .05); root.add(vm.group);
  // قضبان التوصيل: واحد للموجب ورا وواحد للسالب قدام
  const bars = new THREE.Group(); root.add(bars);
  const brass = () => M(0xd9a441, { m: .85, r: .3 });
  const ZT = -1.15, ZB = 1.15, X0 = -.15, X1 = 1.75, BY = .09;
  bars.add(at(box(X1 - X0, .06, .1, brass()), (X0 + X1) / 2, .06, ZT));
  bars.add(at(box(X1 - X0, .06, .1, M(0x6f7782, { m: .85, r: .3 })), (X0 + X1) / 2, .06, ZB));
  bars.add(at(textSprite('+', '#ff7a6b', .2), X1 + .12, .25, ZT));
  bars.add(at(textSprite('−', '#9cc2ff', .2), X1 + .12, .25, ZB));
  const bP = termOf(bat.group, bat.plus), bN = termOf(bat.group, bat.minus);
  const sL = termOf(sw.group, sw.tL), sR = termOf(sw.group, sw.tR);
  const T = x => V(x, BY, ZT), B = x => V(x, BY, ZB);
  const ins = lamps.map(l => termOf(l.group, l.tR)), outs = lamps.map(l => termOf(l.group, l.tL));
  const wires = new THREE.Group(); root.add(wires);
  const cBat = arch(bP, sL, .24), cSw = arch(sR, T(X0), .2), cRet = arch(B(X0), bN, .26);
  wireOn(wires, cBat, 0xd0473a); wireOn(wires, cSw, 0xd0473a); wireOn(wires, cRet, 0x2b2f38);
  const cIn = xs.map((x, i) => arch(T(x), ins[i], .2)), cOut = xs.map((x, i) => arch(outs[i], B(x), .2));
  cIn.forEach(c => wireOn(wires, c, 0xd0473a)); cOut.forEach(c => wireOn(wires, c, 0x2b2f38));
  const vT = termOf(vm.group, vm.red), vB = termOf(vm.group, vm.black);
  wireOn(root, arch(vT, ins[1], .35), 0xd23a2e, .018); wireOn(root, arch(vB, outs[1], .35), 0x1d2128, .018);
  part('battery', bat.group, V(0, .62, 0), 'البطارية', 'مصدر جهد 12 فولت.');
  part('switch', sw.group, V(0, .55, 0), 'المفتاح', 'على الخط الرئيسي، فبيتحكم في الفرعين مع بعض. دوس عليه.');
  part('lamp1', lamps[0].group, V(0, .72, 0), 'لمبة الفرع الأول', 'ليها مسار لوحدها بين القضيبين. دوس عليها.');
  part('lamp2', lamps[1].group, V(0, .72, 0), 'لمبة الفرع التاني', 'مسار تاني مستقل عن الأول.');
  part('voltmeter', vm.group, V(0, .36, -.1), 'الفولتميتر', 'بيقيس الجهد، ومتوصل توازي على طرفين اللمبة التانية.');
  part('rails', bars, V(.8, .12, ZT), 'قضبان التوصيل', 'قضيب موجب وقضيب سالب، وكل فرع بيتوصل بينهم.');
  const paths = xs.map((x, i) => chain(cBat, line(sL, sR), cSw, line(T(X0), T(x)), cIn[i], line(ins[i], outs[i]), cOut[i], line(B(x), B(X0)), cRet, line(bN, bP)));
  const flows = paths.map(p => new Flow(root, p, { count: 26, speed: 1.2 }));
  const st = { sw: 0, out1: 0, out2: 0 };
  function derive(){
    const on = [st.sw && !st.out1, st.sw && !st.out2];
    sw.set(!!st.sw); lamps.forEach((l, i) => { l.set(on[i] ? 1 : 0); l.out(i ? st.out2 : st.out1); flows[i].target = on[i] ? 1 : 0; });
    vm.setText(st.sw ? '12.0' : '0.0');
    return on;
  }
  const lampTap = (k, i, name) => () => { st[k] = st[k] ? 0 : 1; const on = derive(); return st[k] ? `${name} اتشالت، والتانية ${on[1 - i] ? 'لسه منوّرة' : 'زي ما هي'}.` : `${name} رجعت مكانها.`; };
  ctx.parts.switch.tap = () => { st.sw = st.sw ? 0 : 1; derive(); return st.sw ? 'المفتاح اتقفل: التيار اتقسم على الفرعين.' : 'المفتاح اتفتح: الفرعين فصلوا مع بعض.'; };
  ctx.parts.lamp1.tap = lampTap('out1', 0, 'لمبة الفرع الأول');
  ctx.parts.lamp2.tap = lampTap('out2', 1, 'لمبة الفرع التاني');
  return {
    ...ctx, view: V(.3, 1.3, 1.5), sway: true, hint: 'دوس على المفتاح أو اللمبة · صباعين للتقريب',
    steps: [
      { title: 'مكونات دائرة التوازي', text: 'نفس البطارية والمفتاح واللمبتين، بس كل لمبة على فرع لوحدها بين قضيبين: قضيب موجب ورا وقضيب سالب قدام. وفيه فولتميتر على اللمبة التانية. دوس على المفتاح أو على أي لمبة.', s: { sw: 0, out1: 0, out2: 0 } },
      { title: 'اقفل المفتاح', text: 'التيار بيتقسم على الفرعين، وكل لمبة بتنوّر بكامل قوتها، أقوى من اللمبتين في دائرة التوالي.', focus: 'switch', s: { sw: 1, out1: 0, out2: 0 } },
      { title: 'نفس الجهد على كل فرع', text: 'الفولتميتر بيقرا 12 فولت، ونفس القراية على الفرع الأول. يعني كل لمبة واخدة جهد البطارية كله.', focus: 'voltmeter', s: { sw: 1, out1: 0, out2: 0 } },
      { title: 'لو لمبة اتشالت', text: 'شيل لمبة، والتانية تفضل منوّرة لأن فرعها لسه مقفول. جرّب تشيل الأولى كمان. وده السبب إن توصيلات البيوت كلها توازي.', focus: 'lamp2', s: { sw: 1, out1: 0, out2: 1 } }
    ],
    apply(s){ Object.assign(st, s); derive(); },
    update(dt){ sw.update(dt); lamps.forEach(l => l.update(dt)); flows.forEach(f => f.update(dt)); }
  };
}

function buildEngine(){
  const ctx = makeCtx(), { root, part } = ctx;
  const R = .35, L = 1.1, HEAD_Y = 1.95;
  const steel = () => M(0xb7bec8, { m: .85, r: .3 });
  root.add(at(shadowPlane(4, 3), 0, -.62, 0));
  // علبة الكرنك والكراسي
  root.add(at(box(1.7, 1.1, 1.0, M(0x6b7686, { r: .5, m: .3, opacity: .16 })), 0, -.05, 0));
  [-.5, .5].forEach(z => root.add(at(box(.5, .5, .1, M(0x5d6878, { r: .5, m: .4 })), 0, -.32, z)));
  // عمود الكرنك
  const crank = new THREE.Group();
  const j = cyl(.12, .12, 1.1, steel()); j.rotation.x = Math.PI / 2; crank.add(j);
  const webM = M(0x8c95a3, { m: .8, r: .35 });
  [-.17, .17].forEach(z => { crank.add(at(box(.28, .64, .08, webM), 0, .12, z)); crank.add(at(box(.66, .3, .08, webM), 0, -.22, z)); });
  const pin = cyl(.09, .09, .42, steel()); pin.rotation.x = Math.PI / 2; crank.add(at(pin, 0, R, 0));
  const stub = cyl(.1, .1, .2, steel()); stub.rotation.x = Math.PI / 2; crank.add(at(stub, 0, 0, .62));
  const fly = new THREE.Group(); fly.position.z = .7; crank.add(fly);
  const disc = cyl(.72, .72, .09, M(0x59626f, { m: .8, r: .35 }), 56); disc.rotation.x = Math.PI / 2; fly.add(disc);
  const teeth = new THREE.Mesh(new THREE.TorusGeometry(.72, .035, 8, 64), M(0x8c95a3, { m: .85, r: .3 })); fly.add(teeth);
  fly.add(at(box(.09, .62, .02, M(0xf4f1e6, { r: .5 })), 0, .36, .05));
  root.add(crank);
  part('crank', crank, V(0, -.3, .3), 'عمود الكرنك', 'بيحوّل حركة المكبس لدوران.');
  part('flywheel', fly, V(0, .78, .06), 'الحدّافة', 'عجلة تقيلة بتخلّي الدوران منتظم. دوس عليها عشان توقّف الموتور أو تشغّله.');
  // ذراع التوصيل
  const rod = new THREE.Group();
  const rodM = M(0x9aa3af, { m: .85, r: .3 });
  rod.add(at(box(.11, L - .14, .08, rodM), 0, L / 2, 0));
  const big = cyl(.15, .15, .12, rodM); big.rotation.x = Math.PI / 2; rod.add(big);
  const small = cyl(.085, .085, .1, rodM); small.rotation.x = Math.PI / 2; rod.add(at(small, 0, L, 0));
  root.add(rod);
  part('rod', rod, V(0, L * .45, .08), 'ذراع التوصيل', 'بيربط المكبس بعمود الكرنك.');
  // المكبس
  const piston = new THREE.Group();
  piston.add(at(cyl(.43, .43, .42, M(0xc9ced6, { m: .75, r: .28 }), 40), 0, .12, 0));
  [.22, .28].forEach(y => { const ring = new THREE.Mesh(new THREE.TorusGeometry(.432, .012, 8, 48), M(0x3a3f47, { r: .5 })); ring.rotation.x = Math.PI / 2; piston.add(at(ring, 0, y, 0)); });
  const wp = cyl(.06, .06, .5, steel()); wp.rotation.x = Math.PI / 2; piston.add(wp);
  root.add(piston);
  part('piston', piston, V(0, .3, .44), 'المكبس (البستم)', 'بيطلع وينزل جوه السلندر.');
  // السلندر والراس
  const bore = cyl(.47, .47, 1.5, M(0xaecbff, { r: .1, m: 0, opacity: .16, side: THREE.DoubleSide }), 48, true);
  root.add(at(bore, 0, 1.2, 0));
  const rimM = M(0x7d8794, { m: .7, r: .35 });
  [.45, HEAD_Y].forEach(y => { const t = new THREE.Mesh(new THREE.TorusGeometry(.48, .025, 8, 48), rimM); t.rotation.x = Math.PI / 2; root.add(at(t, 0, y, 0)); });
  part('cylinder', bore, V(.47, .2, 0), 'السلندر', 'المكان اللي بيحصل فيه الاحتراق.');
  root.add(at(box(1.3, .36, 1.0, M(0x8e98a6, { m: .55, r: .35, opacity: .38 })), 0, HEAD_Y + .18, 0));
  // الصمامات
  function valve(x, color){
    const g = new THREE.Group(); const m = M(color, { m: .8, r: .3 });
    g.add(at(cyl(.03, .03, .55, m), 0, .29, 0));
    g.add(at(cyl(.15, .1, .04, m), 0, 0, 0));
    g.add(at(cyl(.07, .07, .12, M(0x59626f, { m: .6, r: .4 }), 16), 0, .5, 0));
    g.position.set(x, HEAD_Y - .03, 0); root.add(g); return g;
  }
  const vIn = valve(-.22, 0x8fb9ff), vEx = valve(.22, 0xe0a07a);
  part('intake', vIn, V(0, .62, 0), 'صمام السحب', 'بيفتح عشان يدخل خليط الهوا والبنزين.');
  part('exhaust', vEx, V(0, .62, 0), 'صمام العادم', 'بيفتح عشان يطرد الغازات المحروقة.');
  // المجاري
  const portIn = new THREE.QuadraticBezierCurve3(V(-1.35, 2.5, 0), V(-.55, 2.5, 0), V(-.22, 1.98, 0));
  const portEx = new THREE.QuadraticBezierCurve3(V(.22, 1.98, 0), V(.55, 2.5, 0), V(1.35, 2.5, 0));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(portIn, 40, .11, 16, false), M(0x7fa8e8, { opacity: .3, r: .2, side: THREE.DoubleSide })));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(portEx, 40, .11, 16, false), M(0xb9927a, { opacity: .3, r: .2, side: THREE.DoubleSide })));
  // البوجيه
  const plug = new THREE.Group();
  plug.add(at(cyl(.065, .065, .32, M(0xf2f2ee, { r: .3 })), 0, .2, 0));
  plug.add(at(cyl(.11, .11, .09, M(0xb0b7c0, { m: .85, r: .3 }), 6), 0, .02, 0));
  plug.add(at(cyl(.03, .03, .1, M(0xb0b7c0, { m: .85, r: .3 })), 0, .41, 0));
  plug.add(at(cyl(.015, .015, .38, M(0x9aa3af, { m: .9, r: .3 })), 0, -.2, 0));
  plug.position.set(0, 2.36, 0); root.add(plug);
  part('plug', plug, V(0, .52, 0), 'البوجيه', 'بتطلّع الشرارة اللي بتولّع الخليط.');
  // الغاز جوه السلندر + الشرارة + الاحتراق
  const gasM = new THREE.MeshStandardMaterial({ color: 0x5aa9ff, transparent: true, opacity: .3, depthWrite: false, roughness: 1, emissive: 0x000000 });
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 1, 40), gasM); root.add(gas);
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xcfe4ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  spark.position.set(0, HEAD_Y - .06, 0); root.add(spark);
  const fire = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff7a1a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  root.add(fire);
  const fireLight = new THREE.PointLight(0xff8a2a, 0, 4, 2); root.add(fireLight);
  const flowIn = new Flow(root, portIn, { color: 0x7cc0ff, count: 12, speed: .9, size: .04 });
  const flowEx = new Flow(root, portEx, { color: 0xb5bac2, count: 12, speed: .9, size: .04 });
  const COLORS = { intake: new THREE.Color(0x5aa9ff), compression: new THREE.Color(0x3d7fe0), power: new THREE.Color(0xff7a1a), exhaust: new THREE.Color(0x8a909a) };
  const NAMES = { intake: 'شوط السحب', compression: 'شوط الضغط', power: 'شوط القدرة', exhaust: 'شوط العادم' };
  let theta = 0, range = null, running = true, factor = 1, clockT = 0, onRun = null;
  const speed = 75; // درجة في الثانية عند السرعة 1
  const SPEEDS = [.5, 1, 2, 3, 4, 6, 8, 12, 16, 24];
  const rpm = () => Math.round(speed * factor / 6);
  const setRunning = v => { running = v; if(onRun) onRun(running); };
  ctx.parts.flywheel.tap = () => { setRunning(!running); return running ? 'الموتور اشتغل.' : 'الموتور وقف. دوس على الحدّافة تاني عشان يشتغل.'; };
  const strokeOf = p => p < 180 ? 'intake' : p < 360 ? 'compression' : p < 540 ? 'power' : 'exhaust';
  return {
    ...ctx, view: V(1.1, .5, 1.7), engine: true,
    hint: 'دوس على الحدّافة عشان توقّف أو تشغّل · صباعين للتقريب',
    engineCtl: {
      get running(){ return running; }, setRunning, onRun(fn){ onRun = fn; },
      setSpeed(i){ factor = SPEEDS[i] ?? 1; return rpm(); }, rpm
    },
    steps: [
      { title: 'الموتور شغّال', text: 'ده سلندر واحد من موتور بنزين رباعي الأشواط، وهو شغّال قدامك ببطء عشان تشوف كل حركة. حرّك «السرعة» تحت الموديل عشان تسرّعيه، ودوس على الحدّافة أو على زرار الإيقاف عشان توقّفه. الموتور الحقيقي وهو واقف في مكانه بيلف حوالي 800 لفة في الدقيقة.', focus: 'flywheel', s: { range: null } },
      { title: 'شوط السحب', text: 'صمام السحب بيفتح والمكبس بينزل، فخليط الهوا والبنزين (اللون الأزرق) بيتشفط جوه السلندر.', focus: 'intake', s: { range: [0, 180] } },
      { title: 'شوط الضغط', text: 'الصمامين مقفولين والمكبس بيطلع، فبيضغط الخليط في مساحة صغيرة فوق. كل ما الضغط يزيد، الانفجار بيبقى أقوى.', focus: 'piston', s: { range: [180, 360] } },
      { title: 'شوط القدرة', text: 'البوجيه بتطلّع شرارة فالخليط يولّع، والضغط العالي بيزق المكبس لتحت بقوة. ده الشوط الوحيد اللي بيدّي قدرة للعربية.', focus: 'plug', s: { range: [360, 540] } },
      { title: 'شوط العادم', text: 'صمام العادم بيفتح والمكبس بيطلع، فبيطرد الغازات المحروقة (اللون الرمادي) برا السلندر.', focus: 'exhaust', s: { range: [540, 720] } },
      { title: 'الدورة كاملة', text: 'الأربع أشواط ورا بعض. لاحظ إن عمود الكرنك بيلف لفتين كاملتين (720°) في كل دورة، وفيه شوط قدرة واحد بس.', focus: 'crank', s: { range: [0, 720] } }
    ],
    apply(s){ range = s.range; if(range) theta = range[0]; setRunning(true); },
    update(dt){
      clockT += dt;
      if(running){
        theta += dt * speed * factor;
        if(range){ const span = range[1] - range[0]; while(theta >= range[1]) theta -= span; }
        else theta %= 720;
      }
      root.position.x = running && factor >= 4 ? Math.sin(clockT * 95) * .007 * Math.min(1, factor / 12) : 0;
      const phi = ((theta % 720) + 720) % 720, a = THREE.MathUtils.degToRad(phi);
      const px = R * Math.sin(a), py = R * Math.cos(a);
      const yp = py + Math.sqrt(L * L - px * px);
      crank.rotation.z = -a;
      rod.position.set(px, py, 0); rod.rotation.z = -Math.atan2(-px, yp - py);
      piston.position.y = yp;
      const st = strokeOf(phi);
      const lift = (p0) => Math.max(0, Math.sin(Math.PI * (phi - p0) / 180)) * .13;
      vIn.position.y = HEAD_Y - .03 - (st === 'intake' ? lift(0) : 0);
      vEx.position.y = HEAD_Y - .03 - (st === 'exhaust' ? lift(540) : 0);
      const pistonTop = yp + .33, h = Math.max(.02, HEAD_Y - pistonTop);
      gas.scale.y = h; gas.position.y = pistonTop + h / 2;
      gasM.color.copy(COLORS[st]);
      const burn = st === 'power' ? Math.max(0, 1 - (phi - 360) / 180) : 0;
      gasM.opacity = st === 'power' ? .25 + .35 * burn : st === 'compression' ? .3 + .25 * ((phi - 180) / 180) : .28;
      const sp = phi > 352 && phi < 378 ? Math.sin(Math.PI * (phi - 352) / 26) : 0;
      spark.material.opacity = sp; spark.scale.setScalar(.15 + .5 * sp);
      fire.material.opacity = burn * .9; fire.scale.setScalar(.5 + .7 * burn); fire.position.set(0, pistonTop + h / 2, 0);
      fireLight.intensity = 6 * burn; fireLight.position.copy(fire.position);
      flowIn.target = running && st === 'intake' ? 1 : 0; flowEx.target = running && st === 'exhaust' ? 1 : 0;
      flowIn.speed = flowEx.speed = .9 * Math.min(factor, 6);
      flowIn.update(dt); flowEx.update(dt);
      if(current && current.engine){ $('phaseName').textContent = NAMES[st]; $('phaseDeg').textContent = `${Math.round(phi)}°`; }
    }
  };
}

/* ---------- أدوات إضافية للدفعة الأولى ---------- */
// لوحة نص صغيرة (شاشة ميزان، ترمومتر، عداد وقت)
function makePanel(w, h, { bg = '#b9cba0', fg = '#18200f', font = 'bold 60px monospace' } = {}){
  const c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  let last = null;
  function setText(s){
    if(s === last) return; last = s;
    const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, c.width / 2, c.height / 2 + 4); tex.needsUpdate = true;
  }
  setText(''); return { mesh, setText };
}
// عداد بإبرة (مانوميتر)
function makeGauge(ring, min, max, labels, unit){
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#f7f7f2'; x.beginPath(); x.arc(128, 128, 124, 0, Math.PI * 2); x.fill();
  x.lineWidth = 14; x.strokeStyle = ring; x.beginPath(); x.arc(128, 128, 116, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#1b1f26'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const ang = v => (-135 + (v - min) / (max - min) * 270) * Math.PI / 180;
  for(let i = 0; i <= 20; i++){
    const v = min + (max - min) * i / 20, a = ang(v), r1 = 98, r2 = i % 5 ? 88 : 80;
    x.lineWidth = i % 5 ? 2 : 4; x.strokeStyle = '#1b1f26'; x.beginPath();
    x.moveTo(128 + r1 * Math.sin(a), 128 - r1 * Math.cos(a)); x.lineTo(128 + r2 * Math.sin(a), 128 - r2 * Math.cos(a)); x.stroke();
  }
  labels.forEach(v => { const a = ang(v); x.fillText(String(v), 128 + 62 * Math.sin(a), 128 - 62 * Math.cos(a)); });
  x.font = 'bold 22px sans-serif'; x.fillText(unit, 128, 182);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const body = cyl(.27, .27, .1, M(0x2b3038, { m: .6, r: .35 }), 40); body.rotation.x = Math.PI / 2; g.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.24, 48), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.z = .052; g.add(face);
  const needle = new THREE.Group(); needle.position.z = .06;
  needle.add(at(box(.012, .2, .01, new THREE.MeshBasicMaterial({ color: 0xd2261c })), 0, .08, 0));
  needle.add(new THREE.Mesh(new THREE.CircleGeometry(.025, 16), new THREE.MeshBasicMaterial({ color: 0x1b1f26 })));
  g.add(needle);
  let v = min < 0 ? 0 : min, target = v;
  return { group: g, set(t){ target = t; }, get value(){ return v; }, update(dt){ v = ease(v, target, dt, 2.2); needle.rotation.z = -ang(v); } };
}
// جزيئات بتمشي في مسار ولونها بيتغيّر حسب مكانها
class ColorFlow{
  constructor(parent, path, colorAt, { count = 40, speed = 1, size = .045 } = {}){
    this.path = path; this.len = path.getLength(); this.speed = speed; this.level = 0; this.target = 0; this.items = []; this.colorAt = colorAt; this.maxT = 1;
    const geo = new THREE.SphereGeometry(size, 10, 8);
    for(let i = 0; i < count; i++){ const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); m.userData.t = i / count; m.visible = false; parent.add(m); this.items.push(m); }
  }
  update(dt){
    this.level = ease(this.level, this.target, dt, 3);
    const vis = this.level > .04;
    for(const m of this.items){
      m.visible = vis; if(!vis) continue;
      m.userData.t = (m.userData.t + dt * this.speed * Math.max(.25, this.level) / this.len) % 1;
      m.position.copy(this.path.getPointAt(m.userData.t)); m.scale.setScalar(this.level);
      m.material.color.copy(this.colorAt(m.userData.t)); if(m.userData.t > this.maxT) m.visible = false;
    }
  }
}
function segIndexer(path){
  const lens = path.getCurveLengths(), total = lens[lens.length - 1];
  return t => { const d = t * total; let i = 0; while(i < lens.length - 1 && lens[i] < d) i++; const prev = i ? lens[i - 1] : 0; return [i, (d - prev) / Math.max(1e-6, lens[i] - prev)]; };
}
const tube = (curve, r, m, seg = 64) => new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), m);
const CR = pts => new THREE.CatmullRomCurve3(pts, false, 'centripetal');
function helix(cx, cz, r, y0, y1, turns, a0 = 0){
  const pts = []; const n = Math.round(turns * 24);
  for(let i = 0; i <= n; i++){ const f = i / n, a = a0 + f * turns * Math.PI * 2; pts.push(V(cx + r * Math.cos(a), y0 + (y1 - y0) * f, cz + r * Math.sin(a))); }
  return CR(pts);
}
function makeCompressor(scale = 1, cover = true){
  const g = new THREE.Group(); const cm = M(0x4a5566, { m: .55, r: .35 });
  g.add(at(cyl(.42, .42, .55, cm, 40), 0, .33, 0));
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.42, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), cm), 0, .6, 0));
  g.add(at(box(.95, .06, .62, M(0x1f242c, { r: .6 })), 0, .03, 0));
  if(cover) g.add(at(box(.2, .16, .1, M(0x14181e, { r: .6 })), .2, .36, .4));
  g.scale.setScalar(scale); return g;
}
const C = hex => new THREE.Color(hex);

/* ---------- دائرة التبريد الكاملة ---------- */
function buildCycle(opts = {}){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(3.7, .1, 2.5, M(0x7a8596, { r: .7, m: .2 })), 0, -.05, 0));
  root.add(at(shadowPlane(5.6, 4.2), 0, -.11, 0));
  const copper = () => M(0xd98c5f, { m: .85, r: .3 });
  const comp = makeCompressor(); at(comp, -1.25, 0, .45); root.add(comp);
  // المكثف: ماسورة متعرّجة + زعانف
  const cond = new THREE.Group(); root.add(cond);
  const rows = [1.9, 1.6, 1.3, 1.0, .7], XA = -1.0, XB = 1.1, ZC = -.75, rr = .15;
  const cp = [];
  rows.forEach((y, i) => {
    const [xs, xe] = i % 2 ? [XB, XA] : [XA, XB];
    for(let k = 0; k <= 8; k++) cp.push(V(xs + (xe - xs) * k / 8, y, ZC));
    if(i < rows.length - 1){ const s = i % 2 ? -1 : 1, cy = (y + rows[i + 1]) / 2; for(let k = 1; k < 8; k++){ const f = Math.PI / 2 - Math.PI * k / 8; cp.push(V(xe + s * rr * Math.cos(f), cy + rr * Math.sin(f), ZC)); } }
  });
  const condCurve = CR(cp);
  const condTubeM = copper(); cond.add(tube(condCurve, .035, condTubeM, 400));
  const finM = M(0xa9b2bf, { m: .7, r: .35 });
  for(let x = XA + .05; x < XB; x += .12) cond.add(at(box(.012, 1.45, .14, finM), x, 1.3, ZC));
  [XA - .2, XB + .2].forEach(x => cond.add(at(box(.04, 1.55, .18, M(0x59626f, { m: .6, r: .4 })), x, 1.3, ZC)));
  // المروحة
  const fan = new THREE.Group(); fan.position.set(.05, 1.3, ZC + .38); root.add(fan);
  const ringT = new THREE.Mesh(new THREE.TorusGeometry(.42, .03, 8, 48), M(0x3b4250, { r: .5 })); fan.add(ringT);
  const rotor = new THREE.Group(); fan.add(rotor);
  const hub = cyl(.07, .07, .08, M(0x2b3038)); hub.rotation.x = Math.PI / 2; rotor.add(hub);
  for(let i = 0; i < 4; i++){ const b = box(.12, .36, .015, M(0x4f8fd9, { r: .5 })); b.position.y = .2; const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; b.rotation.y = .5; arm.add(b); rotor.add(arm); }
  // الفلتر والماسورة الشعرية
  const drier = cyl(.07, .07, .38, M(0xc9a35a, { m: .8, r: .3 })); drier.rotation.x = Math.PI / 2; at(drier, 1.38, .55, -.5); root.add(drier);
  const capCurve = new THREE.CurvePath();
  capCurve.add(CR([V(1.38, .55, -.31), V(1.4, .58, -.15), V(1.52, .62, 0)]));
  const capHelix = helix(1.4, 0, .12, .62, 1.5, 6);
  capCurve.add(capHelix);
  capCurve.add(CR([capHelix.getPoint(1), V(1.25, 1.62, .3), V(.81, 1.42, .55)]));
  const capMesh = new THREE.Group(); root.add(capMesh);
  capCurve.curves.forEach(c => capMesh.add(tube(c, .014, M(0xe0a070, { m: .85, r: .3 }), 200)));
  // المبخر حوالين خزان المية
  const TX = .35, TZ = .55;
  const waterM = M(0x4d9be8, { opacity: .45, r: .1, m: 0 });
  const water = at(cyl(.4, .4, 1.0, waterM, 40), TX, .95, TZ); root.add(water);
  root.add(at(cyl(.44, .44, .06, M(0xc9ced6, { m: .85, r: .3 }), 40), TX, 1.5, TZ));
  root.add(at(cyl(.44, .44, .06, M(0xc9ced6, { m: .85, r: .3 }), 40), TX, .42, TZ));
  const evapCurve = helix(TX, TZ, .46, 1.42, .52, 5);
  const evapM = M(0xd98c5f, { m: .85, r: .3 });
  const evap = tube(evapCurve, .035, evapM, 500); root.add(evap);
  const tPanel = makePanel(.42, .2, { bg: '#0d1b2a', fg: '#7fd3ff', font: 'bold 64px monospace' });
  tPanel.mesh.position.set(TX, 1.68, TZ); root.add(tPanel.mesh);
  // خط الطرد وخط السحب
  const disCurve = CR([V(-1.12, .95, .45), V(-1.08, 1.4, .25), V(-1.15, 1.9, -.35), V(-1.0, 1.9, ZC)]);
  const sucCurve = CR([evapCurve.getPoint(1), V(.95, .3, .95), V(-.3, .25, 1.0), V(-1.2, .3, .95), V(-1.6, .45, .55)]);
  const lines = new THREE.Group(); root.add(lines);
  lines.add(tube(disCurve, .04, copper()));
  lines.add(tube(CR([V(XB, .7, ZC), V(1.3, .62, -.74), V(1.38, .55, -.69)]), .035, copper()));
  lines.add(tube(sucCurve, .045, copper(), 120));
  // تسجيل القطع
  part('compressor', comp, V(0, 1.15, 0), 'الضاغط (الكباس)', 'بيشفط الغاز ويضغطه. دوس عليه عشان تشغّل الجهاز أو توقّفه.');
  part('condenser', cond, V(-.6, 2.05, ZC), 'المكثف', 'بيطلّع حرارة الفريون برا، فيتحول من غاز لسائل.');
  part('fan', fan, V(0, .5, .02), 'مروحة المكثف', 'بتسحب الهوا على المكثف عشان يبرد أسرع.');
  part('drier', drier, V(0, .05, .12), 'الفلتر (الدراير)', 'بيمسك الرطوبة والشوائب قبل الماسورة الشعرية.');
  part('capillary', capMesh, V(1.4, 1.55, 0), 'الماسورة الشعرية', 'ماسورة رفيعة جدًا بتقلّل ضغط الفريون فيبرد فجأة.');
  part('evaporator', evap, V(TX + .46, 1.0, TZ + .05), 'المبخر', 'بيسحب الحرارة من المية، فالفريون يغلي ويتحول لغاز.');
  part('lines', lines, V(-.3, .38, 1.0), 'خط الطرد وخط السحب', 'الطرد سخن خارج من الضاغط، والسحب بارد راجع له.');
  // مسار الفريون وألوانه
  const loop = new THREE.CurvePath();
  [disCurve, condCurve, CR([V(XB, .7, ZC), V(1.3, .62, -.74), V(1.38, .55, -.69)]), new THREE.LineCurve3(V(1.38, .55, -.69), V(1.38, .55, -.31)), ...capCurve.curves, evapCurve, sucCurve,
   new THREE.LineCurve3(V(-1.6, .45, .55), V(-1.12, .95, .45))].forEach(c => loop.add(c));
  const idx = segIndexer(loop);
  const HOT = C(0xff4a3a), LIQ = C(0xff9a3a), COLDL = C(0x7fd3ff), EVAP = C(0x3d8bff), SUC = C(0x9fe6ff), tmp = new THREE.Color();
  const colorAt = t => { const [i, f] = idx(t);
    if(i === 0) return HOT; if(i === 1) return tmp.copy(HOT).lerp(LIQ, f); if(i === 2 || i === 3) return LIQ;
    if(i >= 4 && i <= 6) return tmp.copy(LIQ).lerp(COLDL, Math.min(1, (i - 4 + f) / 2)); if(i === 7) return tmp.copy(COLDL).lerp(EVAP, f);
    if(i === 8) return SUC; return tmp.copy(SUC).lerp(HOT, f); };
  const flow = new ColorFlow(root, loop, colorAt, { count: 70, speed: .9, size: .05 });
  // حرارة طالعة من المكثف
  const heat = []; const heatM = new THREE.SpriteMaterial({ map: glowTex, color: 0xff7a3a, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending });
  for(let i = 0; i < 14; i++){ const s = new THREE.Sprite(heatM); s.scale.setScalar(.25); s.userData = { x: XA + Math.random() * (XB - XA), p: Math.random() }; s.visible = false; root.add(s); heat.push(s); }
  let running = true, temp = 25, frost = 0, fault = '', hot = 0, dfrost = 0;
  const lensC = loop.getCurveLengths(), tDrier = lensC[3] / lensC[lensC.length - 1];
  const drierM = drier.material;
  ctx.parts.compressor.tap = () => { running = !running; return running ? 'الضاغط اشتغل: الفريون بدأ يلف والمية هتبرد.' : 'الضاغط وقف: الفريون وقف والمية هتسخن تاني.'; };
  const model = {
    ...ctx, view: V(.7, .75, 1.6), sway: true, hint: 'دوس على الضاغط عشان تشغّل أو توقّف · صباعين للتقريب',
    steps: [
      { title: 'دائرة التبريد في مبرد المية', text: 'دي الدائرة الميكانيكية كلها: ضاغط، ومكثف، وفلتر، وماسورة شعرية، ومبخر ملفوف على خزان المية. النقط الملونة هي الفريون وهو بيلف. الأحمر سخن والأزرق بارد.', s: { run: 1 } },
      { title: 'الضاغط', text: 'الضاغط بيشفط غاز الفريون البارد من خط السحب ويضغطه، فيطلع من خط الطرد غاز سخن جدًا وضغطه عالي (اللون الأحمر).', focus: 'compressor', s: { run: 1 } },
      { title: 'المكثف والمروحة', text: 'الغاز السخن بيلف في المكثف، والمروحة بتسحب منه الحرارة. الفريون بيبرد ويتحول لسائل (اللون البرتقالي). عشان كده ضهر المبرد بيبقى سخن.', focus: 'condenser', s: { run: 1 } },
      { title: 'الفلتر والماسورة الشعرية', text: 'الفلتر بيمسك الرطوبة والشوائب. وبعده الماسورة الشعرية الرفيعة بتقلّل الضغط جامد، فالسائل يبرد فجأة (اللون اللبني).', focus: 'capillary', s: { run: 1 } },
      { title: 'المبخر', text: 'السائل البارد بيغلي جوه المبخر وبيسحب الحرارة من مية الخزان. بص على الشاشة فوق الخزان: درجة المية بتنزل، والمبخر بيعمل طبقة تلج.', focus: 'evaporator', s: { run: 1 } },
      { title: 'الدورة كاملة', text: 'الغاز يرجع للضاغط من خط السحب (اللون السماوي) والدورة تتكرر. دوس على الضاغط عشان توقّف الجهاز، وشوف الفريون بيقف والمية بتسخن.', focus: 'lines', s: { run: 1 } }
    ],
    apply(s){ running = !!s.run; fault = s.fault || ''; if(s.temp !== undefined) temp = s.temp; },
    update(dt){
      flow.target = running ? (fault === 'leak' ? .45 : 1) : 0;
      flow.speed = fault === 'weak' ? .3 : .9; flow.maxT = fault === 'block' ? tDrier : 1;
      flow.update(dt);
      rotor.rotation.z -= dt * 9 * flow.level * (fault === 'fan' ? 0 : 1);
      const tT = running ? ({ '': 8, leak: 18, block: 25, fan: 16, weak: 20 })[fault] : 25;
      temp += (tT - temp) * Math.min(1, dt * .25);
      tPanel.setText(`${Math.round(temp)}°C`);
      frost = ease(frost, running && fault !== 'block' ? Math.min(fault === 'leak' ? .3 : 1, Math.max(0, (25 - temp) / 15)) : 0, dt, 1);
      hot = ease(hot, running && fault === 'fan' ? 1 : 0, dt, 1);
      baseE(condTubeM).setRGB(1, .3, .08).multiplyScalar(hot * .8); condTubeM.userData.baseI = 1;
      dfrost = ease(dfrost, running && fault === 'block' ? 1 : 0, dt, 1);
      baseE(drierM).setRGB(.75, .88, 1).multiplyScalar(dfrost * .6); drierM.userData.baseI = 1; drierM.color.setHex(0xc9a35a).lerp(C(0xeef6ff), dfrost * .7);
      baseE(evapM).setRGB(.75, .88, 1).multiplyScalar(frost * .7); evapM.userData.baseI = 1;
      evapM.color.setHex(0xd98c5f).lerp(C(0xe8f3ff), frost * .8);
      waterM.color.setHex(0x4d9be8).lerp(C(0x1f6fd6), frost);
      comp.position.x = -1.25 + (running ? Math.sin(performance.now() * .09) * .004 : 0);
      heat.forEach(s => { s.visible = flow.level > .2 && fault !== 'block'; if(!s.visible) return; s.userData.p = (s.userData.p + dt * .35) % 1; const p = s.userData.p; s.position.set(s.userData.x, .7 + p * 1.6, ZC - .15); s.material.opacity = (.45 + .45 * hot) * Math.sin(Math.PI * p) * flow.level; });
    }
  };
  if(opts.faults){
    model.hint = 'كل خطوة فيها عطل · دوس على الضاغط · صباعين للتقريب';
    model.steps = [
      { title: 'الجهاز السليم', text: 'قبل ما ندوّر على عطل لازم نعرف الشكل السليم: الفريون بيلف كامل، والمبخر مغطي تلج، والمية بتوصل 8 درجات. في كل خطوة جاية عطل مختلف: لاحظ اللي اتغيّر وفكّر في السبب قبل ما تقرا.', s: { run: 1, fault: '', temp: 10 } },
      { title: 'نقص الفريون (تسريب)', text: 'الفريون قليل (النقط قليلة)، فالتلج بيظهر على أول المبخر بس، والمية مش بتبرد كويس، وضغط السحب واطي. لازم نكشف على التسريب ونصلّحه، وبعدين نفرّغ ونشحن من جديد.', focus: 'evaporator', s: { run: 1, fault: 'leak', temp: 15 } },
      { title: 'انسداد الفلتر أو الماسورة الشعرية', text: 'الفريون واقف عند الفلتر ومش بيعدّي، فالمبخر مش بيبرد خالص، والفلتر نفسه بيعرق أو يعمل تلج، والمكثف بيبقى بارد. بنغيّر الفلتر وننضّف الماسورة الشعرية أو نغيّرها.', focus: 'drier', s: { run: 1, fault: 'block', temp: 22 } },
      { title: 'مروحة المكثف واقفة أو المكثف متسخ', text: 'الحرارة مش عارفة تطلع من المكثف فبيسخن جدًا (بيحمر هنا)، وضغط الطرد بيعلى والتبريد يضعف، والضاغط ممكن يفصل من الأوفرلوود. اختبر موتور المروحة ونضّف المكثف.', focus: 'fan', s: { run: 1, fault: 'fan', temp: 14 } },
      { title: 'ضعف الضاغط', text: 'الضاغط شغال بس ضغطه ضعيف، فالفريون بيلف ببطء، وضغط السحب عالي والطرد واطي، والتبريد ضعيف. بنقيس الضغوط بالمانيفولد، ولو الضاغط ضعيف بيتغيّر.', focus: 'compressor', s: { run: 1, fault: 'weak', temp: 18 } }
    ];
  }
  return model;
}

/* ---------- التفريغ والشحن ---------- */
function buildEvacCharge(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(3.9, .1, 2.5, M(0x7a8596, { r: .7, m: .2 })), 0, -.05, 0));
  root.add(at(shadowPlane(5.8, 4.2), 0, -.11, 0));
  // الثلاجة (الضاغط وماسورة الخدمة)
  const comp = makeCompressor(.85); at(comp, -1.3, 0, .2); root.add(comp);
  const proc = new THREE.Group(); root.add(proc);
  proc.add(tube(CR([V(-1.12, .8, .2), V(-1.0, .95, .2), V(-.98, 1.12, .2)]), .03, M(0xd98c5f, { m: .85, r: .3 })));
  proc.add(at(cyl(.06, .06, .14, M(0xd3a43c, { m: .85, r: .3 }), 6), -.98, 1.18, .2));
  root.add(at(box(.9, 1.3, .1, M(0xdfe3e8, { r: .6 })), -1.35, .7, -.55));
  // المانيفولد
  const man = new THREE.Group(); man.position.set(0, 1.3, .2); root.add(man);
  man.add(at(box(.95, .22, .18, M(0xc9ced6, { m: .85, r: .25 })), 0, 0, 0));
  const low = makeGauge('#2c6fd6', -1, 10, [-1, 0, 2, 4, 6, 8, 10], 'bar'); at(low.group, -.27, .38, 0); man.add(low.group);
  const high = makeGauge('#d23a2e', 0, 35, [0, 5, 10, 15, 20, 25, 30, 35], 'bar'); at(high.group, .27, .38, 0); man.add(high.group);
  const knobL = cyl(.08, .08, .16, M(0x2c6fd6, { r: .4 })); knobL.rotation.z = Math.PI / 2; man.add(at(knobL, -.56, 0, 0));
  const knobH = cyl(.08, .08, .16, M(0xd23a2e, { r: .4 })); knobH.rotation.z = Math.PI / 2; man.add(at(knobH, .56, 0, 0));
  [[-.25, 0x2c6fd6], [0, 0xe8c21e], [.25, 0xd23a2e]].forEach(([x, c]) => man.add(at(cyl(.035, .035, .1, M(c, { m: .5, r: .4 })), x, -.15, 0)));
  // الطرمبة
  const pump = new THREE.Group(); pump.position.set(1.4, 0, .55); root.add(pump);
  pump.add(at(box(.85, .42, .42, M(0x2c6fd6, { r: .45, m: .2 })), 0, .25, 0));
  const motor = cyl(.2, .2, .5, M(0x59626f, { m: .6, r: .4 })); motor.rotation.z = Math.PI / 2; pump.add(at(motor, -.2, .3, 0));
  pump.add(at(box(.5, .05, .06, M(0x1f242c)), .1, .55, 0));
  pump.add(at(cyl(.035, .035, .1, M(0xe8c21e)), .25, .51, .12));
  const pFan = new THREE.Group(); pFan.position.set(-.47, .3, 0); pump.add(pFan);
  for(let i = 0; i < 3; i++){ const b = box(.02, .32, .07, M(0xd3d8de, { m: .7 })); const arm = new THREE.Group(); arm.rotation.x = i * Math.PI / 1.5; arm.add(b); pFan.add(arm); }
  const timer = makePanel(.36, .14, { bg: '#0d1b2a', fg: '#9fe6a0', font: 'bold 70px monospace' }); timer.mesh.position.set(.15, .3, .215); pump.add(timer.mesh);
  // أنبوبة الفريون على الميزان
  const cylG = new THREE.Group(); cylG.position.set(1.3, 0, -.5); root.add(cylG);
  cylG.add(at(box(.6, .08, .6, M(0x2b3038, { r: .5 })), 0, .04, 0));
  const scale = makePanel(.3, .12, { bg: '#0d1b2a', fg: '#ffd34d', font: 'bold 64px monospace' }); scale.mesh.rotation.x = -.6; scale.mesh.position.set(0, .1, .3); cylG.add(scale.mesh);
  cylG.add(at(cyl(.21, .21, .62, M(0x6fc3ff, { r: .35, m: .3 }), 32), 0, .42, 0));
  cylG.add(at(new THREE.Mesh(new THREE.SphereGeometry(.21, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(0x6fc3ff, { r: .35, m: .3 })), 0, .73, 0));
  const cValve = cyl(.06, .06, .1, M(0xd3d8de, { m: .85, r: .3 })); cylG.add(at(cValve, 0, .98, 0));
  cylG.add(at(textSprite('R134a', '#ffffff', .32), 0, .5, .23));
  // الخراطيم
  const hoseM = c => M(c, { r: .6 });
  const blue = tube(new THREE.QuadraticBezierCurve3(V(-.25, 1.15, .2), V(-.7, .2, .7), V(-.98, 1.25, .2)), .03, hoseM(0x2c6fd6), 80); root.add(blue);
  const red = tube(new THREE.QuadraticBezierCurve3(V(.25, 1.15, .2), V(.45, .45, .45), V(.42, .95, .42)), .03, hoseM(0xd23a2e), 60); root.add(red);
  const yA = new THREE.QuadraticBezierCurve3(V(0, 1.15, .2), V(.6, .1, .75), V(1.65, .56, .67));
  const yB = new THREE.QuadraticBezierCurve3(V(0, 1.15, .2), V(.55, .2, -.3), V(1.3, 1.03, -.5));
  const yellowA = tube(yA, .03, hoseM(0xe8c21e), 80), yellowB = tube(yB, .03, hoseM(0xe8c21e), 80); root.add(yellowA); root.add(yellowB);
  const hoses = new THREE.Group(); root.add(hoses); [blue, red, yellowA, yellowB].forEach(h => hoses.attach(h));
  part('manifold', man, V(0, .72, .05), 'جهاز المانيفولد', 'فيه عداد الضغط المنخفض (أزرق) والعالي (أحمر) ومحبسين.');
  part('lowgauge', low.group, V(0, .3, .06), 'عداد الضغط المنخفض', 'بيقرا الضغط والتفريغ. تحت الصفر يعني تفريغ.');
  part('compressor', comp, V(0, 1.2, 0), 'الضاغط وماسورة الخدمة', 'بنوصّل الخرطوم الأزرق على ماسورة الخدمة بتاعته.');
  part('pump', pump, V(0, .72, 0), 'طرمبة التفريغ', 'بتشفط الهوا والرطوبة من الدائرة. دوس عليها عشان تشغّلها.');
  part('cylinder', cylG, V(0, 1.18, 0), 'أنبوبة الفريون على الميزان', 'الميزان بيقول اتشحن كام جرام. دوس عليها عشان تفتح محبسها.');
  part('hoses', hoses, yA.getPoint(.5), 'الخراطيم', 'الأزرق للضغط المنخفض، والأحمر للعالي، والأصفر للطرمبة أو الأنبوبة.');
  // الجزيئات
  const airPath = chain(new THREE.LineCurve3(V(-1.0, .85, .2), V(-.98, 1.25, .2)), new THREE.QuadraticBezierCurve3(V(-.98, 1.25, .2), V(-.7, .2, .7), V(-.25, 1.15, .2)), new THREE.LineCurve3(V(-.25, 1.15, .2), V(0, 1.15, .2)), yA);
  const refPath = chain(new THREE.QuadraticBezierCurve3(V(1.3, 1.03, -.5), V(.55, .2, -.3), V(0, 1.15, .2)), new THREE.LineCurve3(V(0, 1.15, .2), V(-.25, 1.15, .2)), new THREE.QuadraticBezierCurve3(V(-.25, 1.15, .2), V(-.7, .2, .7), V(-.98, 1.25, .2)), new THREE.LineCurve3(V(-.98, 1.25, .2), V(-1.05, .8, .2)));
  const air = new Flow(root, airPath, { color: 0xe9eef5, count: 26, speed: 1.1, size: .035 });
  const ref = new Flow(root, refPath, { color: 0x3d9bff, count: 26, speed: 1.1, size: .04 });
  const st = { hose: 'pump', pump: 0, cyl: 0, run: 0 };
  let vac = 0, charged = 0, minutes = 0;
  const CHARGE = 110;
  ctx.parts.pump.tap = () => {
    if(st.hose !== 'pump') return 'الخرطوم الأصفر دلوقتي على أنبوبة الفريون، مش على الطرمبة.';
    st.pump = st.pump ? 0 : 1; return st.pump ? 'الطرمبة اشتغلت: الهوا بيتشفط من الدائرة.' : 'الطرمبة وقفت.';
  };
  ctx.parts.cylinder.tap = () => {
    if(st.hose !== 'cyl') return 'لسه الخرطوم الأصفر على الطرمبة. خلّص التفريغ الأول.';
    if(charged >= CHARGE) return `الشحنة كملت ${CHARGE} جرام.`;
    st.cyl = st.cyl ? 0 : 1; return st.cyl ? 'محبس الأنبوبة اتفتح: الفريون داخل الدائرة.' : 'محبس الأنبوبة اتقفل.';
  };
  return {
    ...ctx, view: V(.45, .7, 1.6), sway: true, hint: 'دوس على الطرمبة أو الأنبوبة · صباعين للتقريب',
    steps: [
      { title: 'الأدوات والتوصيل', text: 'المانيفولد بعداديه، وطرمبة التفريغ، وأنبوبة الفريون فوق الميزان. الخرطوم الأزرق على ماسورة الخدمة في الضاغط، والأصفر على الطرمبة.', focus: 'manifold', s: { hose: 'pump', pump: 0, cyl: 0, run: 0, vac: 0, charged: 0 } },
      { title: 'التفريغ', text: 'شغّل الطرمبة وافتح المحبس الأزرق. الإبرة بتنزل تحت الصفر لحد -1 بار، يعني الدائرة اتفرغت من الهوا والرطوبة. التفريغ الحقيقي بياخد من 15 لـ 30 دقيقة.', focus: 'lowgauge', s: { hose: 'pump', pump: 1, cyl: 0, run: 0, vac: 0, charged: 0 } },
      { title: 'اختبار ثبات التفريغ', text: 'اقفل المحبس ووقف الطرمبة واستنى 10 دقايق. لو الإبرة فضلت ثابتة عند -1 يبقى مفيش تسريب. لو طلعت لفوق، فيه تسريب لازم يتصلّح قبل الشحن.', focus: 'lowgauge', s: { hose: 'pump', pump: 0, cyl: 0, run: 0, vac: 1, charged: 0 } },
      { title: 'تحضير الشحن', text: 'انقل الخرطوم الأصفر من الطرمبة لأنبوبة الفريون. الأنبوبة فوق الميزان عشان نعرف بالظبط اتشحن كام جرام.', focus: 'cylinder', s: { hose: 'cyl', pump: 0, cyl: 0, run: 0, vac: 1, charged: 0 } },
      { title: 'الشحن', text: 'افتح محبس الأنبوبة والمحبس الأزرق. الفريون (اللون الأزرق) بيدخل الدائرة والميزان بيقل. بنوقف عند الشحنة المكتوبة على لوحة الثلاجة، هنا 110 جرام R134a.', focus: 'cylinder', s: { hose: 'cyl', pump: 0, cyl: 1, run: 0, vac: 1, charged: 0 } },
      { title: 'التأكد من الشحنة', text: 'اقفل المحابس وشغّل الضاغط. ضغط السحب بيثبت حوالي 0.5 بار، وده معناه إن الشحنة مظبوطة. لو أعلى من كده يبقى فيه فريون زيادة، ولو أقل يبقى ناقص.', focus: 'lowgauge', s: { hose: 'cyl', pump: 0, cyl: 0, run: 1, vac: 1, charged: 110 } }
    ],
    apply(s){ Object.assign(st, { hose: s.hose, pump: s.pump, cyl: s.cyl, run: s.run }); vac = s.vac; charged = s.charged; minutes = s.vac ? 20 : 0; },
    update(dt){
      yellowA.visible = st.hose === 'pump'; yellowB.visible = st.hose === 'cyl';
      const pumping = st.hose === 'pump' && st.pump;
      if(pumping){ vac = Math.min(1, vac + dt * .12); minutes = Math.min(30, minutes + dt * 2); }
      const charging = st.hose === 'cyl' && st.cyl && charged < CHARGE;
      if(charging){ charged = Math.min(CHARGE, charged + dt * 12); if(charged >= CHARGE) st.cyl = 0; }
      let lowT;
      if(st.run) lowT = .5;
      else if(charged > 0) lowT = charging ? 1.4 : .2 + .4 * charged / CHARGE;
      else lowT = -vac;
      low.set(lowT); high.set(0); low.update(dt); high.update(dt);
      air.target = pumping ? 1 : 0; ref.target = charging ? 1 : 0; air.update(dt); ref.update(dt);
      pFan.rotation.x += dt * 18 * (pumping ? 1 : 0);
      pump.position.x = 1.4 + (pumping ? Math.sin(performance.now() * .08) * .004 : 0);
      comp.position.x = -1.3 + (st.run ? Math.sin(performance.now() * .09) * .004 : 0);
      timer.setText(`${String(Math.floor(minutes)).padStart(2, '0')}:00`);
      scale.setText(`${Math.round(1000 - charged)} g`);
    }
  };
}

/* ---------- اللحام ---------- */
function buildBrazing(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(3.6, .1, 2.2, M(0x5d6878, { r: .8, m: .2 })), 0, -.05, 0));
  root.add(at(shadowPlane(5.4, 3.8), 0, -.11, 0));
  const PY = .75;
  [-1.0, 1.0].forEach(x => { root.add(at(box(.3, PY - .08, .3, M(0x3b4250, { r: .6 })), x, (PY - .08) / 2, 0)); });
  const copperA = M(0xd98c5f, { m: .85, r: .3 }), copperB = M(0xd98c5f, { m: .85, r: .3 });
  const pipeA = new THREE.Group(); root.add(pipeA);
  const a1 = cyl(.1, .1, 1.4, copperA, 32); a1.rotation.z = Math.PI / 2; pipeA.add(at(a1, -.95, PY, 0));
  const bellM = M(0xd98c5f, { m: .85, r: .3 });
  const bell = cyl(.122, .122, .32, bellM, 32); bell.rotation.z = Math.PI / 2; pipeA.add(at(bell, -.1, PY, 0));
  const cone = cyl(.122, .1, .08, copperA, 32); cone.rotation.z = Math.PI / 2; pipeA.add(at(cone, -.3, PY, 0));
  const pipeB = new THREE.Group(); root.add(pipeB);
  const b1 = cyl(.1, .1, 1.5, copperB, 32); b1.rotation.z = Math.PI / 2; pipeB.add(at(b1, .7, PY, 0));
  const endM = M(0xd98c5f, { m: .85, r: .3 });
  const bEnd = cyl(.101, .101, .3, endM, 32); bEnd.rotation.z = Math.PI / 2; pipeB.add(at(bEnd, -.12, PY, 0));
  // البوري واللهب
  const torch = new THREE.Group(); torch.position.set(.62, 1.25, .3); root.add(torch);
  const dir = V(0, PY, 0).sub(torch.position).normalize();
  torch.quaternion.setFromUnitVectors(V(0, -1, 0), dir); torch.scale.setScalar(1.5);
  torch.add(at(cyl(.035, .035, .5, M(0xd3a43c, { m: .85, r: .3 })), 0, .1, 0));
  torch.add(at(cyl(.07, .07, .55, M(0x1f2a36, { r: .5 })), 0, .62, 0));
  torch.add(at(cyl(.05, .05, .08, M(0xd3a43c, { m: .85, r: .3 })), 0, .33, 0));
  [[-.03, 0x2b8a3e], [.03, 0xb02a2a]].forEach(([x, c]) => torch.add(at(cyl(.02, .02, .12, M(c)), x, .95, 0)));
  const flameIn = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x6fb2ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const flameOut = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff8a2a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  root.add(flameIn); root.add(flameOut);
  const flameLight = new THREE.PointLight(0xff9a40, 0, 3, 2); root.add(flameLight);
  // الأنابيب (أكسجين وأستيلين)
  const gasG = new THREE.Group(); root.add(gasG);
  [[-1.45, 0x1f6b3a, 'O2'], [-1.05, 0x7a1f2a, 'C2H2']].forEach(([x, c, t]) => {
    gasG.add(at(cyl(.17, .17, 1.4, M(c, { r: .45, m: .3 }), 28), x, .72, -.75));
    gasG.add(at(new THREE.Mesh(new THREE.SphereGeometry(.17, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M(c, { r: .45, m: .3 })), x, 1.42, -.75));
    gasG.add(at(cyl(.05, .05, .12, M(0xd3d8de, { m: .85 })), x, 1.65, -.75));
    gasG.add(at(textSprite(t, '#ffffff', .3), x, 1.0, -.56));
  });
  const toRoot = v => v.clone().multiplyScalar(1.5).applyQuaternion(torch.quaternion).add(torch.position);
  const hoseEnd = toRoot(V(0, 1.0, 0));
  gasG.add(tube(new THREE.QuadraticBezierCurve3(V(-1.45, 1.7, -.75), V(-.6, .2, .4), hoseEnd.clone().add(V(-.03, 0, 0))), .02, M(0x2b8a3e, { r: .6 }), 60));
  gasG.add(tube(new THREE.QuadraticBezierCurve3(V(-1.05, 1.7, -.75), V(-.4, .3, .5), hoseEnd.clone().add(V(.03, 0, 0))), .02, M(0xb02a2a, { r: .6 }), 60));
  // سلك اللحام
  const rodG = new THREE.Group(); root.add(rodG);
  const rodM = M(0xe8e3d0, { m: .9, r: .25 });
  const rod = cyl(.018, .018, 1, rodM, 12); rod.position.y = .5; rodG.add(rod);
  const fill = new THREE.Mesh(new THREE.TorusGeometry(.125, .02, 10, 40), M(0xe9d6a0, { m: .9, r: .25 })); fill.rotation.y = Math.PI / 2; fill.position.set(.06, PY, 0); fill.scale.setScalar(.001); root.add(fill);
  part('pipeA', pipeA, V(-.95, PY + .14, 0), 'الماسورة الواسعة (معمول لها سوبدج)', 'طرفها متوسّع عشان التانية تدخل جواه.');
  part('pipeB', pipeB, V(.75, PY + .14, 0), 'الماسورة التانية', 'بتدخل جوه الطرف الواسع حوالي 1 سم.');
  part('torch', torch, V(0, .7, 0), 'بوري اللحام', 'لهب أكسجين وأستيلين. دوس عليه عشان تولّعه أو تطفيه.');
  part('rod', rodG, V(0, .9, 0), 'سلك اللحام (فضة)', 'بيسيح على الوصلة السخنة ويقفل الفراغ.');
  part('gas', gasG, V(-1.25, 1.85, -.75), 'أنبوبتين الأكسجين والأستيلين', 'الأخضر أكسجين والأحمر أستيلين.');
  const st = { joined: 0, flame: 0, rod: 0 };
  let join = 0, heat = 0, melt = 0, rodIn = 0;
  ctx.parts.torch.tap = () => { st.flame = st.flame ? 0 : 1; return st.flame ? 'البوري ولّع. سخّن الوصلة كلها بالتساوي.' : 'البوري انطفى. الوصلة بتبرد لوحدها.'; };
  ctx.parts.rod.tap = () => { if(!st.joined) return 'ركّب الماسورتين في بعض الأول.'; st.rod = st.rod ? 0 : 1; return st.rod ? (heat > .75 ? 'السلك بيسيح ويدخل الوصلة.' : 'الوصلة لسه مش سخنة كفاية، السلك مش هيسيح.') : 'السلك اتبعد عن الوصلة.'; };
  const COP = C(0xd98c5f), HOTC = C(0xff5a1a);
  return {
    ...ctx, view: V(.35, .75, 1.6), sway: true, hint: 'دوس على البوري أو على السلك · صباعين للتقريب',
    steps: [
      { title: 'أدوات اللحام', text: 'ماسورتين نحاس، والواسعة طرفها معمول له سوبدج. وبوري لحام شغّال بالأكسجين والأستيلين، وسلك لحام فضة. والبس النضارة والجوانتي قبل أي حاجة.', s: { joined: 0, flame: 0, rod: 0, melt: 0 } },
      { title: 'التنضيف والتجميع', text: 'نضّف طرفين الماسورتين بالصنفرة لحد ما يلمعوا، وركّب الماسورة التانية جوه الطرف الواسع حوالي 1 سم. الفراغ بينهم لازم يكون صغير جدًا.', focus: 'pipeB', s: { joined: 1, flame: 0, rod: 0, melt: 0 } },
      { title: 'التسخين', text: 'ولّع البوري واضبط اللهب لحد ما يبقى فيه مخروط أزرق صغير. سخّن الوصلة كلها بالتساوي لحد ما النحاس يحمر، حوالي 700 درجة.', focus: 'torch', s: { joined: 1, flame: 1, rod: 0, melt: 0 } },
      { title: 'إضافة السلك', text: 'قرّب السلك من الوصلة نفسها مش من اللهب. لما الوصلة تكون سخنة كفاية، السلك بيسيح ويتسحب جوه الفراغ بين الماسورتين ويعمل حلقة حوالين الوصلة.', focus: 'rod', s: { joined: 1, flame: 1, rod: 1, melt: 0 } },
      { title: 'التبريد والفحص', text: 'اطفي البوري وسيب الوصلة تبرد لوحدها، ما تبرديهاش بمية. الوصلة السليمة لونها منتظم ومفيهاش ثقوب، وبعدها بنختبرها بالضغط.', focus: 'pipeA', s: { joined: 1, flame: 0, rod: 0, melt: 1 } }
    ],
    apply(s){ st.joined = s.joined; st.flame = s.flame; st.rod = s.rod; melt = s.melt; if(s.melt) heat = .9; },
    update(dt){
      join = ease(join, st.joined, dt, 3); pipeB.position.x = (1 - join) * .55;
      heat = Math.max(0, Math.min(1, heat + (st.flame ? .35 : -.18) * dt));
      const hot = Math.max(0, (heat - .2) / .8);
      [bellM, endM].forEach(m => { baseE(m).copy(HOTC).multiplyScalar(hot * .9); m.userData.baseI = 1; m.color.copy(COP).lerp(C(0x6e3b24), hot * .6); });
      const fl = st.flame ? 1 : 0, flick = .9 + .1 * Math.sin(performance.now() * .03);
      const tip = toRoot(V(0, -.18, 0)), mid = tip.clone().lerp(V(0, PY, 0), .55);
      flameIn.position.copy(tip.clone().lerp(V(0, PY, 0), .25)); flameIn.material.opacity = fl; flameIn.scale.setScalar(.16 * flick);
      flameOut.position.copy(mid); flameOut.material.opacity = fl * .85; flameOut.scale.setScalar(.55 * flick);
      flameLight.position.copy(mid); flameLight.intensity = fl * 5;
      rodIn = ease(rodIn, st.rod ? 1 : 0, dt, 3);
      if(st.rod && heat > .75 && melt < 1) melt = Math.min(1, melt + dt * .3);
      const len = 1 - .35 * melt;
      rod.scale.y = len; rod.position.y = len / 2;
      const rodTip = V(.12, PY + .1, .14).lerp(V(.55, PY + .55, .45), 1 - rodIn);
      rodG.position.copy(rodTip); rodG.quaternion.setFromUnitVectors(V(0, 1, 0), V(.5, .6, .45).normalize());
      fill.scale.setScalar(Math.max(.001, melt));
      baseE(fill.material).copy(HOTC).multiplyScalar(hot * .6); fill.material.userData.baseI = 1;
    }
  };
}

/* ---------- مجسّات الآفوميتر (بتتحرك لأي نقطتين) ---------- */
function makeProbes(root, jackR, jackB){
  const wireM = [M(0xd23a2e, { r: .6 }), M(0x1d2128, { r: .6 })];
  const mk = color => { const g = new THREE.Group(); g.add(at(cyl(.024, .024, .3, M(color, { r: .5 })), 0, .2, 0)); g.add(at(cyl(.007, .007, .07, M(0xd3d8de, { m: .9, r: .25 })), 0, .03, 0)); g.rotation.set(-.55, 0, 0); root.add(g); return g; };
  const probes = [mk(0xd23a2e), mk(0x1d2128)], jacks = [jackR, jackB];
  const rest = [jackR.clone().add(V(-.15, -.1, .35)), jackB.clone().add(V(.15, -.1, .35))];
  const cur = rest.map(v => v.clone()), tgt = rest.map(v => v.clone()), wires = [null, null];
  const tail = g => V(0, .36, 0).applyEuler(g.rotation).add(g.position);
  function rebuild(i){
    if(wires[i]){ root.remove(wires[i]); wires[i].geometry.dispose(); }
    const a = jacks[i], b = tail(probes[i]);
    wires[i] = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, .5).add(V(0, -.3, .2)), b), 24, .012, 6, false), wireM[i]);
    wires[i].castShadow = true; root.add(wires[i]);
  }
  let dirty = true;
  return {
    group: probes,
    set(a, b){ tgt[0].copy(a || rest[0]); tgt[1].copy(b || rest[1]); },
    update(dt){
      for(let i = 0; i < 2; i++){ const before = cur[i].clone(); cur[i].lerp(tgt[i], Math.min(1, dt * 5)); probes[i].position.copy(cur[i]); if(before.distanceToSquared(cur[i]) > 1e-7) dirty = true; }
      if(dirty){ rebuild(0); rebuild(1); dirty = false; }
    }
  };
}
function poseLerp(obj, a, b, f){ obj.position.copy(a.p).lerp(b.p, f); obj.quaternion.copy(a.q).slerp(b.q, f); }
const pose = (p, e) => ({ p, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(...e)) });

/* ---------- الأجزاء الكهربية للثلاجة ---------- */
function buildElecParts(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(3.6, .1, 2.4, M(0x7a8596, { r: .7, m: .2 })), 0, -.05, 0));
  root.add(at(shadowPlane(5.4, 4), 0, -.11, 0));
  const comp = makeCompressor(1.2, false); at(comp, -.9, 0, -.1); root.add(comp);
  const brass = M(0xd9a441, { m: .85, r: .3 });
  const PIN = { C: V(-.75, .63, .48), S: V(-.84, .5, .48), R: V(-.66, .5, .48) };
  Object.values(PIN).forEach(p => { const c = cyl(.016, .016, .1, brass, 10); c.rotation.x = Math.PI / 2; root.add(at(c, p.x, p.y, p.z - .03)); });
  root.add(at(box(.24, .22, .03, M(0x1f242c, { r: .6 })), -.75, .56, .375));
  const pinLabels = Object.entries(PIN).map(([k, p]) => { const sp = textSprite(k, '#ffd34d', .16); sp.position.copy(p).add(V(k === 'S' ? -.1 : k === 'R' ? .1 : 0, k === 'C' ? .1 : -.08, .05)); sp.material.opacity = 0; root.add(sp); return sp; });
  // الريليه
  const relay = new THREE.Group(); root.add(relay);
  relay.add(at(box(.24, .2, .16, M(0x23272e, { r: .5 })), 0, 0, 0));
  relay.add(at(textSprite('↑', '#ffffff', .12), 0, .02, .09));
  [-.06, .06].forEach(x => relay.add(at(cyl(.022, .022, .03, brass, 10), x, .02, .085)).children.at(-1).rotation.x = Math.PI / 2);
  const relayBench = pose(V(0, .1, .75), [0, 0, 0]), relayFlip = pose(V(0, .1, .75), [0, 0, Math.PI]), relayMount = pose(V(-.75, .5, .53), [0, 0, 0]);
  // الأوفرلوود
  const olG = new THREE.Group(); root.add(olG);
  olG.add(cyl(.1, .1, .06, M(0x6e4a2e, { r: .5 }), 28));
  [-.05, .05].forEach(x => olG.add(at(cyl(.018, .018, .03, brass, 10), x, .045, 0)));
  const olBench = pose(V(.55, .03, .75), [0, 0, 0]), olMount = pose(V(-.75, .66, .5), [Math.PI / 2, 0, 0]);
  // الترموستات
  const th = new THREE.Group(); th.position.set(1.1, 0, .7); root.add(th);
  th.add(at(box(.36, .2, .14, M(0xeceef1, { r: .4 })), 0, .1, 0));
  const knob = cyl(.055, .055, .05, M(0x2b3038, { r: .4 }), 20); knob.rotation.x = Math.PI / 2; th.add(at(knob, 0, .1, .09));
  const notch = at(box(.012, .04, .01, M(0xffffff)), 0, .12, .118); th.add(notch);
  [-.1, .1].forEach(x => th.add(at(cyl(.018, .018, .03, brass, 10), x, .215, 0)));
  th.add(tube(helix(.32, -.05, .05, .05, .2, 3), .008, M(0xc9ced6, { m: .85 }), 80));
  // الآفوميتر
  const meter = makeMeter('Ω'); at(meter.group, 1.35, 0, -.55); root.add(meter.group);
  const probes = makeProbes(root, termOf(meter.group, meter.red), termOf(meter.group, meter.black));
  part('compressor', comp, V(0, 1.0, 0), 'الضاغط وأطرافه', 'تلات أطراف: C المشترك، وS البدء، وR التشغيل.');
  part('relay', relay, V(0, .16, 0), 'الريليه (المتمم)', 'بيوصّل ملف البدء لحظة التشغيل بس. دوس عليه عشان تقلبه.');
  part('overload', olG, V(0, .12, 0), 'الأوفرلوود', 'بيفصل الضاغط لو سخن أو سحب تيار زيادة. دوس عليه.');
  part('thermostat', th, V(0, .34, 0), 'الترموستات', 'بيشغّل ويفصل حسب الحرارة. دوس عليه عشان تلف المفتاح.');
  part('meter', meter.group, V(0, .36, -.1), 'الآفوميتر', 'على وضع الأوم لقياس المقاومة والتوصيل.');
  const st = { step: 0, olBad: 0, relayInv: 0, thOn: 1, run: 0, mount: 0 };
  let tCycle = 0, pairIdx = 0, labels = 0, mount = 0, flip = 0, knobA = 0, autoFlip = true;
  const PAIRS = [['S', 'R', '30 Ω'], ['C', 'S', '18 Ω'], ['C', 'R', '12 Ω']];
  ctx.parts.overload.tap = () => { if(st.step !== 2) return 'الأوفرلوود بيتختبر في خطوة «اختبار الأوفرلوود».'; st.olBad = st.olBad ? 0 : 1; return st.olBad ? 'ده مثال لأوفرلوود تالف: القراية OL.' : 'ده أوفرلوود سليم: القراية قريبة من الصفر.'; };
  ctx.parts.relay.tap = () => { if(st.step !== 3) return 'الريليه بيتختبر في خطوة «اختبار الريليه».'; autoFlip = false; st.relayInv = st.relayInv ? 0 : 1; return st.relayInv ? 'الريليه مقلوب: التلامس قفل، القراية 0.' : 'الريليه معدول: التلامس مفتوح، القراية OL.'; };
  ctx.parts.thermostat.tap = () => { if(st.step !== 4) return 'الترموستات بيتختبر في خطوة «اختبار الترموستات».'; st.thOn = st.thOn ? 0 : 1; return st.thOn ? 'المفتاح على التشغيل: الترموستات موصّل.' : 'المفتاح على الإيقاف: الترموستات فاصل.'; };
  ctx.parts.compressor.tap = () => { if(st.step !== 5) return 'الضاغط بيشتغل في خطوة «التركيب والتشغيل».'; st.run = st.run ? 0 : 1; return st.run ? 'الضاغط اشتغل.' : 'الضاغط وقف.'; };
  const OLT = [V(.5, .08, .75), V(.6, .08, .75)];
  return {
    ...ctx, view: V(.35, .85, 1.6), sway: true, hint: 'دوس على أي جزء عشان تختبره · صباعين للتقريب',
    steps: [
      { title: 'الأجزاء الكهربية للثلاجة', text: 'الضاغط وأطرافه التلاتة، والريليه، والأوفرلوود، والترموستات، والآفوميتر اللي هنقيس بيه. هنختبر كل جزء لوحده قبل ما نركّبه.', s: { step: 0 } },
      { title: 'تحديد أطراف الضاغط', text: 'حط الآفوميتر على الأوم وقيس بين كل طرفين. أعلى قراية (30 أوم) بتبقى بين S و R، فالطرف التالت هو C. ومن C: أقل قراية (12 أوم) لـ R، والأعلى منها (18 أوم) لـ S.', focus: 'compressor', s: { step: 1 } },
      { title: 'اختبار الأوفرلوود', text: 'قيس بين طرفيه. لو القراية قريبة من الصفر يبقى سليم وموصّل. لو OL يبقى فاصل وتالف. دوس عليه عشان تشوف الحالتين.', focus: 'overload', s: { step: 2 } },
      { title: 'اختبار الريليه', text: 'الريليه التياري بيتختبر وهو معدول ومقلوب. معدول: التلامس مفتوح والقراية OL. مقلوب: التلامس بيقفل والقراية 0. دوس عليه عشان تقلبه بنفسك.', focus: 'relay', s: { step: 3 } },
      { title: 'اختبار الترموستات', text: 'لف المفتاح على التشغيل: القراية 0 يعني موصّل. على الإيقاف: OL يعني فاصل. دوس على الترموستات عشان تلف المفتاح.', focus: 'thermostat', s: { step: 4 } },
      { title: 'التركيب والتشغيل', text: 'الريليه بيتركّب على طرفين S و R، والأوفرلوود على C. بعد التوصيل الضاغط بيشتغل. دوس على الضاغط عشان تشغّله أو توقّفه.', focus: 'compressor', s: { step: 5 } }
    ],
    apply(s){ st.step = s.step; st.olBad = 0; st.relayInv = 0; st.thOn = 1; st.run = s.step === 5 ? 1 : 0; tCycle = 0; pairIdx = 0; autoFlip = true; if(s.step >= 2) labels = 1; else labels = 0; },
    update(dt){
      tCycle += dt;
      let a = null, b = null, read = '—';
      if(st.step === 1){
        if(tCycle > 2.6){ tCycle = 0; pairIdx = (pairIdx + 1) % 3; if(pairIdx === 0) labels = 1; }
        const [p, q, r] = PAIRS[pairIdx]; a = PIN[p].clone().add(V(0, 0, .03)); b = PIN[q].clone().add(V(0, 0, .03)); read = r;
      } else if(st.step === 2){ a = OLT[0]; b = OLT[1]; read = st.olBad ? 'OL' : '0.4 Ω'; }
      else if(st.step === 3){
        if(autoFlip && tCycle > 3){ tCycle = 0; st.relayInv = st.relayInv ? 0 : 1; }
        const top = st.relayInv ? -1 : 1; a = V(-.06, .12, .84); b = V(.06, .12, .84); read = st.relayInv ? '0.0 Ω' : 'OL';
        a.y = .1 + .02 * top; b.y = .1 + .02 * top;
      } else if(st.step === 4){ a = V(1.0, .23, .7); b = V(1.2, .23, .7); read = st.thOn ? '0.0 Ω' : 'OL'; }
      probes.set(a, b); probes.update(dt); meter.setText(read);
      flip = ease(flip, st.step === 3 && st.relayInv ? 1 : 0, dt, 5);
      mount = ease(mount, st.step === 5 ? 1 : 0, dt, 3);
      const rb = { p: relayBench.p, q: relayBench.q.clone().slerp(relayFlip.q, flip) };
      poseLerp(relay, rb, relayMount, mount); poseLerp(olG, olBench, olMount, mount);
      knobA = ease(knobA, st.thOn ? -1.6 : 0, dt, 5); notch.position.set(Math.sin(-knobA) * .03, .1 + Math.cos(knobA) * .03, .118); notch.rotation.z = knobA;
      pinLabels.forEach(sp => { sp.material.opacity = ease(sp.material.opacity, labels, dt, 3); });
      comp.position.x = -.9 + (st.step === 5 && st.run ? Math.sin(performance.now() * .09) * .004 : 0);
    }
  };
}

/* ---------- الدائرة الكهربية الكاملة للثلاجة ---------- */
function buildFridgeCircuit(opts = {}){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(makeBoard());
  const brass = M(0xd9a441, { m: .85, r: .3 });
  const post = (g, x, y, z) => g.add(at(cyl(.035, .035, .06, brass, 12), x, y, z));
  // الفيشة (مصدر 220 فولت)
  const plug = new THREE.Group(); plug.position.set(-1.9, 0, -.3); root.add(plug);
  plug.add(at(box(.38, .22, .7, M(0x2b3038, { r: .5 })), 0, .11, 0));
  post(plug, .1, .25, -.2); post(plug, .1, .25, .2);
  plug.add(at(textSprite('L', '#ff7a6b', .18), -.08, .4, -.2)); plug.add(at(textSprite('N', '#9cc2ff', .18), -.08, .4, .2));
  plug.add(at(textSprite('220V', '#ffffff', .3), -.05, .42, 0));
  // الترموستات
  const th = new THREE.Group(); th.position.set(-.9, 0, -1.05); root.add(th);
  th.add(at(box(.5, .22, .28, M(0xeceef1, { r: .4 })), 0, .11, 0));
  const knob = cyl(.07, .07, .06, M(0x2b3038, { r: .4 }), 20); knob.rotation.x = Math.PI / 2; th.add(at(knob, 0, .12, .16));
  post(th, -.18, .24, 0); post(th, .18, .24, 0);
  const tPanel = makePanel(.36, .16, { bg: '#0d1b2a', fg: '#7fd3ff', font: 'bold 66px monospace' }); tPanel.mesh.position.set(0, .45, 0); th.add(tPanel.mesh);
  // الأوفرلوود
  const ol = new THREE.Group(); ol.position.set(.15, 0, -1.05); root.add(ol);
  const olM = M(0x6e4a2e, { r: .5 }); ol.add(at(cyl(.13, .13, .08, olM, 28), 0, .04, 0)); post(ol, -.08, .1, 0); post(ol, .08, .1, 0);
  // الضاغط
  const comp = makeCompressor(.75, false); at(comp, 1.35, 0, -.45); root.add(comp);
  const PIN = { C: V(1.35, .52, -.1), S: V(1.25, .42, -.1), R: V(1.45, .42, -.1) };
  Object.values(PIN).forEach(p => { const c = cyl(.015, .015, .08, brass, 10); c.rotation.x = Math.PI / 2; root.add(at(c, p.x, p.y, p.z)); });
  Object.entries(PIN).forEach(([k, p]) => root.add(at(textSprite(k, '#ffd34d', .13), p.x + (k === 'S' ? -.09 : k === 'R' ? .09 : 0), p.y + (k === 'C' ? .09 : -.08), p.z + .05)));
  // الريليه
  const relay = new THREE.Group(); relay.position.set(.75, 0, .35); root.add(relay);
  const relayM = M(0x23272e, { r: .5 });
  relay.add(at(box(.42, .24, .3, relayM), 0, .12, 0)); post(relay, -.14, .26, 0); post(relay, 0, .26, .08); post(relay, .14, .26, 0);
  // مفتاح الباب واللمبة
  const door = new THREE.Group(); door.position.set(-.9, 0, .95); root.add(door);
  door.add(at(box(.36, .16, .24, M(0xeceef1, { r: .4 })), 0, .08, 0));
  const btn = at(cyl(.05, .05, .1, M(0xd64545, { r: .4 }), 16), 0, .2, 0); door.add(btn);
  post(door, -.14, .19, .06); post(door, .14, .19, .06);
  const lamp = makeLamp(); at(lamp.group, .1, 0, .95); root.add(lamp.group);
  const am = makeMeter('A'); at(am.group, 1.75, 0, .7); root.add(am.group);
  // الأسلاك
  const L = termOf(plug, V(.1, .28, -.2)), N = termOf(plug, V(.1, .28, .2));
  const t1 = termOf(th, V(-.18, .27, 0)), t2 = termOf(th, V(.18, .27, 0));
  const o1 = termOf(ol, V(-.08, .13, 0)), o2 = termOf(ol, V(.08, .13, 0));
  const r1 = termOf(relay, V(-.14, .29, 0)), rS = termOf(relay, V(0, .29, .08)), rN = termOf(relay, V(.14, .29, 0));
  const d1 = termOf(door, V(-.14, .22, .06)), d2 = termOf(door, V(.14, .22, .06));
  const l1 = termOf(lamp.group, lamp.tL), l2 = termOf(lamp.group, lamp.tR);
  const amR = termOf(am.group, am.red), amB = termOf(am.group, am.black);
  const wires = new THREE.Group(); root.add(wires);
  const RED = 0xd0473a, BLK = 0x2b2f38, BLU = 0x3e6fb0;
  const cL = arch(L, t1, .25), cT = arch(t2, o1, .2), cO = arch(o2, PIN.C, .3), cR = arch(PIN.R, r1, .3), cS = arch(rS, PIN.S, .35), cRN = arch(rN, amR, .25), cAN = arch(amB, N, .35);
  const cD = arch(L, d1, .3), cDL = arch(d2, l1, .2), cLN = arch(l2, N, .4);
  [[cL, RED], [cT, RED], [cO, RED], [cR, BLK], [cS, BLU], [cRN, BLK], [cAN, BLK], [cD, RED], [cDL, RED], [cLN, BLK]].forEach(([c, col]) => wireOn(wires, c, col));
  part('plug', plug, V(0, .55, 0), 'مصدر الكهرباء 220 فولت', 'L هو الخط (الفاز) وN هو النيوترال.');
  part('thermostat', th, V(.32, .3, 0), 'الترموستات', 'بيفصل لما الثلاجة توصل 3 درجات ويوصّل عند 7. دوس عليه عشان تقفله.');
  part('overload', ol, V(0, .2, 0), 'الأوفرلوود', 'متوصل توالي مع الضاغط لحمايته.');
  part('compressor', comp, V(0, .95, 0), 'الضاغط', 'C من الأوفرلوود، وR وS رايحين على الريليه.');
  part('relay', relay, V(0, .45, 0), 'الريليه', 'بيوصّل ملف البدء S ثانية واحدة وقت التشغيل.');
  part('door', door, V(0, .4, 0), 'مفتاح الباب', 'لما الباب يتفتح بيوصّل اللمبة. دوس عليه عشان تفتح الباب.');
  part('lamp', lamp.group, V(0, .72, 0), 'لمبة الثلاجة', 'متوصلة توازي مع الضاغط على مفتاح الباب.');
  part('ammeter', am.group, V(0, .36, -.1), 'الأميتر', 'بيقيس تيار الضاغط: عالي لحظة البدء، وبعدين بيقل.');
  const mainPath = chain(cL, line(t1, t2), cT, line(o1, o2), cO, line(PIN.C, PIN.R), cR, line(r1, rN), cRN, line(amR, amB), cAN);
  const startPath = chain(cL, line(t1, t2), cT, line(o1, o2), cO, line(PIN.C, PIN.S), new THREE.QuadraticBezierCurve3(PIN.S, PIN.S.clone().lerp(rS, .5).add(V(0, .35, 0)), rS), line(rS, rN), cRN, line(amR, amB), cAN);
  const lampPath = chain(cD, line(d1, d2), cDL, line(l1, l2), cLN);
  const fMain = new Flow(root, mainPath, { count: 34, speed: 1.2 }), fStart = new Flow(root, startPath, { color: 0x7fd3ff, count: 30, speed: 1.4 }), fLamp = new Flow(root, lampPath, { count: 18, speed: 1.2 });
  const st = { thOn: 1, door: 0, fast: 0, fault: '' };
  let temp = 7.5, run = false, startT = 0, knobA = 0, press = 0, tripT = 0;
  ctx.parts.thermostat.tap = () => { st.thOn = st.thOn ? 0 : 1; return st.thOn ? 'الترموستات اشتغل: هيوصّل لما الحرارة تعدّي 7 درجات.' : 'الترموستات اتقفل على الإيقاف: الضاغط مش هيشتغل.'; };
  ctx.parts.door.tap = () => { st.door = st.door ? 0 : 1; return st.door ? 'الباب اتفتح: مفتاح الباب وصّل واللمبة نوّرت.' : 'الباب اتقفل: اللمبة طفت.'; };
  const model = {
    ...ctx, view: V(.3, 1.3, 1.5), sway: true, hint: 'دوس على مفتاح الباب أو الترموستات · صباعين للتقريب',
    steps: [
      { title: 'الدائرة الكهربية للثلاجة', text: 'مصدر 220 فولت، وترموستات، وأوفرلوود، وضاغط بأطرافه التلاتة، وريليه، ومفتاح باب ولمبة. الأحمر الخط (L)، والأسود النيوترال (N).', s: { thOn: 1, door: 0, temp: 7.5 } },
      { title: 'مسار تيار الضاغط', text: 'التيار بيطلع من L ويعدّي على الترموستات، وبعدين الأوفرلوود، ويدخل الضاغط من C ويطلع من R على الريليه، ويرجع للنيوترال N. كل دول متوصلين توالي.', focus: 'overload', s: { thOn: 1, door: 0, temp: 7.5 } },
      { title: 'لحظة البدء', text: 'أول ما الضاغط يبدأ، تيار عالي بيمشي في ملف الريليه، فيقفل تلامسه ويوصّل ملف البدء S ثانية واحدة (اللون اللبني). الأميتر بيقرا حوالي 5 أمبير، وبعد ما الضاغط يدور التلامس يفتح والتيار ينزل لـ 1.2 أمبير.', focus: 'relay', s: { thOn: 1, door: 0, temp: 8, restart: 1 } },
      { title: 'الترموستات بيتحكم', text: 'الترموستات بيفصل الضاغط لما جوه الثلاجة توصل 3 درجات، ويرجع يوصّله لما تسخن لـ 7. الوقت هنا متسرّع عشان تشوف الدورة كاملة. دوس عليه عشان تقفله خالص.', focus: 'thermostat', s: { thOn: 1, door: 0, temp: 4, fast: 1 } },
      { title: 'مفتاح الباب واللمبة', text: 'اللمبة على فرع لوحده مع مفتاح الباب، متوصلة توازي. لما الباب يتفتح المفتاح بيوصّل واللمبة تنوّر، والضاغط مش بيتأثر. دوس على مفتاح الباب.', focus: 'door', s: { thOn: 1, door: 1, temp: 6 } },
      { title: 'الدائرة كاملة', text: 'كل الأجزاء مع بعض. جرّب تفتح الباب وتقفل الترموستات، وتابع تيار الضاغط على الأميتر ودرجة الحرارة فوق الترموستات.', focus: 'compressor', s: { thOn: 1, door: 0, temp: 7.5, fast: 1 } }
    ],
    apply(s){ st.thOn = s.thOn; st.door = s.door; st.fast = s.fast || 0; st.fault = s.fault || ''; temp = s.temp; tripT = 0; if(s.restart || s.fault !== undefined){ run = false; } },
    update(dt){
      const k = st.fast ? 1.2 : .35, F = st.fault;
      const closed = st.thOn && F !== 'thOpen';
      tripT = Math.max(0, tripT - dt);
      if(!closed) run = false;
      else if(!run && tripT <= 0 && (temp >= 7 || F === 'relay')) { run = true; startT = 1.6; }
      else if(run && temp <= 3 && F !== 'thStuck') run = false;
      temp += (run && F !== 'relay' ? -k : k * .6) * dt;
      if(F === 'thStuck') temp = Math.max(-6, temp);
      if(F === 'relay') temp = Math.min(9, temp);
      startT = Math.max(0, startT - dt);
      if(F === 'relay' && run && startT <= 0){ run = false; tripT = 2.5; }
      const starting = run && startT > 0, humming = starting && F === 'relay';
      fMain.target = (run && !starting) || humming ? 1 : 0; fStart.target = starting && !humming ? 1 : 0;
      const lampOn = st.door && F !== 'lamp'; fLamp.target = lampOn ? 1 : 0;
      fMain.update(dt); fStart.update(dt); fLamp.update(dt);
      lamp.set(lampOn ? 1 : 0); lamp.update(dt);
      am.setText(humming ? '6.50' : starting ? '5.00' : run ? '1.20' : '0.00');
      baseE(olM).setRGB(1, .35, .08).multiplyScalar(humming ? .35 + .3 * Math.sin(performance.now() * .02) : tripT > 0 ? .5 : 0); olM.userData.baseI = 1;
      tPanel.setText(`${temp.toFixed(1)}°C`);
      baseE(relayM).setRGB(1, .55, .15).multiplyScalar(starting ? .6 : 0); relayM.userData.baseI = 1;
      knobA = ease(knobA, st.thOn ? -1.6 : 0, dt, 5); knob.rotation.y = knobA;
      press = ease(press, st.door ? 0 : 1, dt, 6); btn.position.y = .16 + .05 * press;
      comp.position.x = 1.35 + (run ? Math.sin(performance.now() * .09) * (F === 'relay' ? .008 : .004) : 0);
    }
  };
  if(opts.faults){
    model.hint = 'كل خطوة فيها عطل · دوس على الأجزاء · صباعين للتقريب';
    model.steps = [
      { title: 'الدائرة السليمة', text: 'قبل ما ندوّر على عطل لازم نعرف الدائرة السليمة بتشتغل إزاي. في كل خطوة جاية عطل مختلف: لاحظ العَرَض وفكّر في السبب قبل ما تقرا.', s: { thOn: 1, door: 0, temp: 7.5, fault: '' } },
      { title: 'الضاغط مش بيشتغل خالص', text: 'مفيش صوت والأميتر صفر. نقيس الأول الكهربا على الفيشة (220 فولت موجودة). بعدين نقيس الترموستات وهو على التشغيل: لو قرا OL يبقى تالف ولازم يتغيّر.', focus: 'thermostat', s: { thOn: 1, door: 0, temp: 9, fault: 'thOpen' } },
      { title: 'الضاغط بيزن ويفصل (تكتكة)', text: 'الضاغط بيسحب تيار عالي جدًا (6.5 أمبير) ومش بيدور، فالأوفرلوود يسخن ويفصل ويرجع يوصّل كل شوية. السبب غالبًا إن الريليه مش بيوصّل ملف البدء S. اختبر الريليه، ولو سليم اختبر ملفات الضاغط.', focus: 'overload', s: { thOn: 1, door: 0, temp: 8, fault: 'relay' } },
      { title: 'اللمبة مش بتنوّر', text: 'الضاغط شغال عادي، والباب مفتوح، بس اللمبة مش بتنوّر. قيس اللمبة: لو OL تبقى محروقة. ولو سليمة، اختبر مفتاح الباب.', focus: 'lamp', s: { thOn: 1, door: 1, temp: 7.5, fault: 'lamp' } },
      { title: 'الثلاجة شغالة على طول ومش بتفصل', text: 'الحرارة بتنزل تحت 3 درجات والضاغط مش بيفصل، والأكل بيتلج. يا إما تلامس الترموستات لازق، يا إما حساسه (البصيلة) مش في مكانها. اختبر الترموستات وهو على الإيقاف: لو لسه موصّل يبقى تالف.', focus: 'thermostat', s: { thOn: 1, door: 0, temp: 5, fast: 1, fault: 'thStuck' } }
    ];
  }
  return model;
}

/* ---------- الدفعة التالتة ---------- */
const plate = (root, w = 3.6, d = 2.4, c = 0x7a8596) => { root.add(at(box(w, .1, d, M(c, { r: .7, m: .2 })), 0, -.05, 0)); root.add(at(shadowPlane(w * 1.5, d * 1.6), 0, -.11, 0)); };
const COPPER = () => M(0xd98c5f, { m: .85, r: .3 });
const STEEL = () => M(0xb7bec8, { m: .85, r: .3 });
const DARK = () => M(0x3b4250, { r: .6, m: .2 });

/* تشكيل وقطع المواسير */
function buildPipeForming(){
  const ctx = makeCtx(), { root, part } = ctx; plate(root, 3.8, 2.6);
  const PY = .6, Rb = .36, R = .085, copM = COPPER();
  [-1.35, -.75].forEach(x => root.add(at(box(.24, PY - .1, .24, DARK()), x, (PY - .1) / 2, 0)));
  const pipeG = new THREE.Group(); root.add(pipeG);
  let pipeMesh = null, shown = -1;
  function pipeCurve(t){
    const p = new THREE.CurvePath(); p.add(line(V(-1.6, PY, 0), V(0, PY, 0)));
    if(t > .002){ const pts = []; for(let i = 0; i <= 24; i++){ const f = t * i / 24; pts.push(V(Rb * Math.sin(f), PY, -Rb + Rb * Math.cos(f))); } p.add(CR(pts)); }
    const e = V(Rb * Math.sin(t), PY, -Rb + Rb * Math.cos(t)), tan = V(Math.cos(t), 0, -Math.sin(t));
    p.add(line(e, e.clone().add(tan.multiplyScalar(1.0 - Rb * t)))); return p;
  }
  function setPipe(t){ if(Math.abs(t - shown) < .003) return; shown = t; if(pipeMesh){ pipeG.remove(pipeMesh); pipeMesh.geometry.dispose(); } pipeMesh = new THREE.Mesh(new THREE.TubeGeometry(pipeCurve(t), 140, R, 20, false), copM); pipeMesh.castShadow = true; pipeG.add(pipeMesh); }
  setPipe(0);
  const off = cyl(R, R, .26, COPPER(), 20); off.rotation.z = Math.PI / 2; at(off, 1.13, PY, 0); root.add(off);
  const mark = new THREE.Mesh(new THREE.TorusGeometry(R + .004, .01, 8, 32), M(0xd23a2e)); mark.rotation.y = Math.PI / 2; at(mark, 1.0, PY, 0); root.add(mark);
  const groove = new THREE.Mesh(new THREE.TorusGeometry(R, .004, 8, 32), M(0x3a2414, { r: .8 })); groove.rotation.y = Math.PI / 2; at(groove, 1.0, PY, 0); root.add(groove);
  // القطّاعة
  const cutter = new THREE.Group(); cutter.position.set(1.0, PY, 0); root.add(cutter);
  const frameM = M(0x2c6fd6, { r: .45, m: .3 });
  cutter.add(at(box(.07, .5, .08, frameM), 0, -.05, -.17));
  cutter.add(at(box(.07, .08, .2, frameM), 0, .2, -.08)); cutter.add(at(box(.07, .08, .2, frameM), 0, -.27, -.08));
  const wheel = cyl(.075, .075, .012, STEEL(), 32); wheel.rotation.z = Math.PI / 2; cutter.add(at(wheel, 0, R + .07, 0));
  [-.05, .05].forEach(x => { const r = cyl(.03, .03, .05, STEEL(), 16); r.rotation.z = Math.PI / 2; cutter.add(at(r, x, -R - .03, 0)); });
  cutter.add(at(cyl(.025, .025, .2, STEEL(), 12), 0, -.36, 0)); cutter.add(at(cyl(.06, .06, .06, M(0xd64545, { r: .4 }), 16), 0, -.48, 0));
  // المقشطة (إزالة الرايش)
  const reamer = new THREE.Group(); root.add(reamer);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.12, .2, 24), STEEL()); cone.rotation.z = Math.PI / 2; reamer.add(cone);
  const rh = cyl(.04, .04, .35, M(0xd64545, { r: .4 })); rh.rotation.z = Math.PI / 2; reamer.add(at(rh, .27, 0, 0));
  // جهاز الثني
  const bender = new THREE.Group(); bender.position.set(0, 0, -Rb); root.add(bender);
  bender.add(at(cyl(Rb - R, Rb - R, .2, M(0x8c95a3, { m: .8, r: .3 }), 48), 0, PY, 0));
  bender.add(at(cyl(Rb + .02, Rb + .02, .03, M(0x59626f, { m: .7 }), 48), 0, PY - .12, 0));
  bender.add(at(box(.09, .06, 1.1, M(0x2c6fd6, { r: .45 })), 0, PY - .16, -.6));
  const arm = new THREE.Group(); arm.position.set(0, PY, 0); bender.add(arm);
  arm.add(at(box(.09, .06, 1.25, M(0xd64545, { r: .45 })), 0, .16, .62));
  arm.add(at(cyl(.06, .06, .22, STEEL(), 24), 0, 0, Rb + R + .05));
  const angPanel = makePanel(.3, .14, { bg: '#0d1b2a', fg: '#ffd34d', font: 'bold 70px monospace' }); angPanel.mesh.position.set(0, PY + .35, 0); bender.add(angPanel.mesh);
  part('pipe', pipeG, V(-.8, PY + .12, 0), 'ماسورة النحاس', 'بنقطعها بالمقاس وبعدين نثنيها من غير ما تتطبق.');
  part('cutter', cutter, V(0, .3, 0), 'قطّاعة المواسير', 'بتلف حوالين الماسورة وتقطعها قطع نضيف ومستقيم.');
  part('reamer', reamer, V(0, .15, 0), 'المقشطة', 'بتشيل الرايش (الحرف الحاد) من جوه الماسورة بعد القطع.');
  part('bender', bender, V(.25, PY + .35, .3), 'جهاز الثني (البندر)', 'بيثني الماسورة حوالين عجلة بنصف قطر ثابت. دوس عليه عشان تثني أكتر.');
  const st = { step: 0 }; let cut = 0, fallen = 0, ream = 0, theta = 0, thetaT = 0, spin = 0;
  ctx.parts.bender.tap = () => { if(st.step < 4) return 'اقطع الماسورة الأول، الثني في الخطوة الخامسة.'; thetaT = thetaT >= Math.PI / 2 - .01 ? 0 : Math.min(Math.PI / 2, thetaT + Math.PI / 6); return thetaT ? `بنثني لحد ${Math.round(thetaT * 180 / Math.PI)} درجة.` : 'رجّعنا ماسورة جديدة مستقيمة.'; };
  return {
    ...ctx, view: V(.45, .9, 1.6), sway: true, hint: 'دوس على جهاز الثني · صباعين للتقريب',
    steps: [
      { title: 'أدوات التشكيل', text: 'ماسورة نحاس، وقطّاعة مواسير، ومقشطة لإزالة الرايش، وجهاز ثني (بندر). النحاس طري وسهل الثني، والألومنيوم أطرى منه، والحديد بيحتاج منشار وجهاز ثني تقيل.', s: { step: 0 } },
      { title: 'القياس والتعليم', text: 'قيس الطول المطلوب بالمتر وعلّم مكان القطع بقلم (الخط الأحمر). خلّي الطول زيادة شوية لو هتثني، لأن الثني بياكل من الطول.', focus: 'pipe', s: { step: 1 } },
      { title: 'القطع', text: 'حط القطّاعة على العلامة واربط المسمار ربع لفة، ولف القطّاعة حوالين الماسورة. كل لفتين اربط ربع لفة تاني لحد ما تتقطع. ما تربطيش جامد مرة واحدة عشان الماسورة ما تتطبقش.', focus: 'cutter', s: { step: 2 } },
      { title: 'إزالة الرايش', text: 'القطع بيعمل حرف حاد جوه الماسورة بيضيّق المجرى. لف المقشطة جوه الطرف والماسورة مايلة لتحت، عشان الرايش يقع برا ومايدخلش الدائرة.', focus: 'reamer', s: { step: 3 } },
      { title: 'الثني', text: 'حط الماسورة في مجرى العجلة وقفل الذراع عليها، واسحب الذراع ببطء لحد الزاوية المطلوبة (الشاشة بتقول الزاوية). دوس على الجهاز عشان تثني 30 درجة كمان.', focus: 'bender', s: { step: 4 } },
      { title: 'النتيجة', text: 'ثنية 90 درجة نضيفة من غير تطبيق ولا تجاعيد، والقطر جوه الثنية زي ما هو. لو الماسورة اتطبقت، يبقى نصف قطر الثني أصغر من المناسب للماسورة دي.', focus: 'pipe', s: { step: 5 } }
    ],
    apply(s){ st.step = s.step; cut = s.step > 2 ? 1 : 0; fallen = s.step > 2 ? 1 : 0; ream = s.step > 3 ? 1 : 0; thetaT = s.step === 4 ? Math.PI / 3 : s.step === 5 ? Math.PI / 2 : 0; if(s.step < 4) theta = 0; },
    update(dt){
      if(st.step === 2 && cut < 1){ cut = Math.min(1, cut + dt * .25); spin += dt * 4; }
      if(st.step === 2 && cut >= 1) fallen = Math.min(1, fallen + dt * 1.2);
      if(st.step === 3) spin += dt * 5;
      cutter.visible = st.step === 2 || (st.step === 1);
      cutter.rotation.x = spin; cutter.position.x = 1.0;
      groove.scale.setScalar(1); groove.material.opacity = 1; groove.visible = cut > 0;
      groove.scale.set(1 - .25 * cut, 1 - .25 * cut, 1);
      mark.visible = st.step >= 1 && cut < 1;
      off.visible = fallen < 1 || st.step <= 2;
      off.position.set(1.13 + .2 * fallen, PY - (PY - .1) * fallen, .12 * fallen); off.rotation.y = fallen * .8;
      if(st.step > 2) off.visible = false;
      reamer.visible = st.step === 3; reamer.position.set(1.05 + .45 * (1 - Math.min(1, ream + (st.step === 3 ? 1 : 0))), PY, 0); reamer.rotation.x = spin * 1.5;
      theta = ease(theta, thetaT, dt, 1.2); setPipe(theta);
      arm.rotation.y = theta; angPanel.setText(`${Math.round(theta * 180 / Math.PI)}°`);
    }
  };
}

/* السوبدج والفلير */
function buildSwageFlare(){
  const ctx = makeCtx(), { root, part } = ctx; plate(root, 3.4, 2.2);
  const XF = -.5, XS = .5, R = .09, TOP = .66;
  const bar = new THREE.Group(); root.add(bar);
  bar.add(at(box(1.9, .18, .34, M(0xb7bec8, { m: .85, r: .3 })), 0, .5, 0));
  [-1.05, 1.05].forEach(x => { bar.add(at(cyl(.035, .035, .3, STEEL(), 12), x, .5, 0)); bar.add(at(box(.18, .04, .06, M(0x8c95a3, { m: .8 })), x, .66, 0)); });
  [-.9, 0, .9].forEach(x => bar.add(at(cyl(.06, .06, .01, M(0x1f242c), 20), x, .595, 0)));
  [-.1, .1].forEach(z => root.add(at(box(2.1, .4, .08, DARK()), 0, .2, z * 2.2)));
  const pipeF = at(cyl(R, R, TOP - .05, COPPER(), 24), XF, (TOP + .05) / 2, 0); root.add(pipeF);
  const pipeS = at(cyl(R, R, TOP - .05, COPPER(), 24), XS, (TOP + .05) / 2, 0); root.add(pipeS);
  const nut = at(cyl(.17, .17, .12, M(0xd9a441, { m: .85, r: .3 }), 6), XF, .25, 0); root.add(nut);
  const flareM = COPPER(); const flare = new THREE.Mesh(new THREE.CylinderGeometry(.17, R, .07, 32), flareM); flare.position.set(XF, TOP - .035, 0); root.add(flare);
  const bellM = COPPER(); const bell = new THREE.Mesh(new THREE.CylinderGeometry(.118, .118, 1, 32), bellM); root.add(bell);
  // الفلير: الإطار والمسمار والمخروط
  const yoke = new THREE.Group(); yoke.position.set(XF, 0, 0); root.add(yoke);
  const yM = M(0x2c6fd6, { r: .45, m: .3 });
  [-.32, .32].forEach(x => yoke.add(at(box(.07, .52, .1, yM), x, .85, 0)));
  yoke.add(at(box(.74, .09, .14, yM), 0, 1.12, 0));
  const screw = new THREE.Group(); yoke.add(screw);
  screw.add(at(cyl(.035, .035, .55, STEEL(), 12), 0, .28, 0));
  screw.add(at(box(.42, .04, .04, M(0xd64545, { r: .4 })), 0, .56, 0));
  const cn = new THREE.Mesh(new THREE.ConeGeometry(.14, .16, 32), STEEL()); cn.rotation.x = Math.PI; cn.position.y = -.08; screw.add(cn);
  // السوبدج: البنطة والشاكوش
  const punch = new THREE.Group(); punch.position.set(XS, 0, 0); root.add(punch);
  punch.add(at(cyl(.088, .088, .2, STEEL(), 24), 0, .1, 0));
  punch.add(at(cyl(.118, .118, .07, STEEL(), 24), 0, .235, 0));
  punch.add(at(cyl(.07, .07, .45, M(0x8c95a3, { m: .8 }), 20), 0, .49, 0));
  const hammer = new THREE.Group(); hammer.position.set(XS + .9, 1.35, 0); root.add(hammer);
  hammer.add(at(box(.75, .045, .05, M(0x8a5a32, { r: .7 })), -.5, 0, 0));
  hammer.add(at(box(.14, .28, .14, M(0x4a5262, { m: .7, r: .35 })), -.88, 0, 0));
  const third = at(cyl(R, R, .7, COPPER(), 24), XS, 1.6, 0); root.add(third);
  part('bar', bar, V(.9, .68, 0), 'قالب التثبيت (البار)', 'فيه خروم بمقاسات المواسير، بنقفله بالصواميل على الماسورة.');
  part('yoke', yoke, V(0, 1.22, 0), 'أداة الفلير', 'المخروط بينزل بالمسمار ويفتح طرف الماسورة. دوس عليها عشان تلف المسمار.');
  part('flare', flare, V(0, .05, .12), 'طرف الفلير', 'طرف مفتوح على شكل مخروط بيتقفل بالصامولة.');
  part('nut', nut, V(0, .08, .17), 'صامولة الفلير', 'لازم تتركّب على الماسورة قبل الفلير.');
  part('punch', punch, V(0, .75, 0), 'بنطة السوبدج', 'بتوسّع طرف الماسورة عشان ماسورة تانية تدخل جواه.');
  part('hammer', hammer, V(-.88, .2, 0), 'الشاكوش', 'دوس عليه عشان تخبط خبطة على البنطة.');
  const st = { step: 0, screwing: 1 }; let fl = 0, sw = 0, swing = 0, strikeT = -1, yokeOff = 0, ins = 0;
  ctx.parts.yoke.tap = () => { if(st.step !== 2) return 'الفلير بيتعمل في الخطوة التالتة.'; st.screwing = st.screwing ? 0 : 1; return st.screwing ? 'بنلف المسمار والمخروط بينزل.' : 'وقفنا لف المسمار.'; };
  ctx.parts.hammer.tap = () => { if(st.step !== 4) return 'الشاكوش بيتستخدم في خطوة السوبدج.'; if(strikeT < 0) strikeT = 0; return sw >= 1 ? 'السوبدج خلص، الطرف اتوسع.' : 'خبطة على البنطة.'; };
  return {
    ...ctx, view: V(.2, .85, 1.6), sway: true, hint: 'دوس على أداة الفلير أو الشاكوش · صباعين للتقريب',
    steps: [
      { title: 'أدوات السوبدج والفلير', text: 'قالب تثبيت فيه خروم بمقاسات المواسير، وأداة فلير بمخروط ومسمار، وبنطة سوبدج وشاكوش. الفلير بيفتح الطرف على شكل مخروط للوصلات بالصامولة، والسوبدج بيوسّع الطرف للحام.', s: { step: 0 } },
      { title: 'الصامولة والتثبيت', text: 'ركّب صامولة الفلير على الماسورة الأول، دي أكتر غلطة بتتكرر. وبعدين ثبّت الماسورة في الخرم المناسب، وسيب طرفها طالع فوق القالب قد سُمك عملة معدن.', focus: 'nut', s: { step: 1 } },
      { title: 'عمل الفلير', text: 'حط الأداة على القالب ولف المسمار مع عقارب الساعة. المخروط بينزل ويفتح طرف الماسورة بالتدريج. دوس على الأداة عشان توقّف أو تكمّل.', focus: 'yoke', s: { step: 2 } },
      { title: 'فحص الفلير', text: 'الفلير السليم ناعم ولامع ومن غير شروخ، وقطره قد قاعدة الصامولة بالظبط. لو اتشرخ أو طلع مايل، اقطعه واعمله من جديد.', focus: 'flare', s: { step: 3 } },
      { title: 'عمل السوبدج', text: 'ثبّت ماسورة تانية في القالب، وحط البنطة في طرفها واخبط بالشاكوش خبطات خفيفة ومنتظمة لحد ما البنطة تنزل لحد كتفها. دوس على الشاكوش.', focus: 'punch', s: { step: 4 } },
      { title: 'النتيجة', text: 'الطرف اتوسّع بقطر الماسورة التانية بالظبط، فتدخل جواه حوالي 1 سم وتبقى جاهزة للحام.', focus: 'punch', s: { step: 5 } }
    ],
    apply(s){ st.step = s.step; st.screwing = 1; fl = s.step >= 3 ? 1 : 0; sw = s.step >= 5 ? 1 : 0; strikeT = -1; ins = 0; if(s.step === 4) sw = 0; },
    update(dt){
      if(st.step === 2 && st.screwing && fl < 1) fl = Math.min(1, fl + dt * .22);
      yokeOff = ease(yokeOff, st.step === 2 ? 0 : 1, dt, 3);
      yoke.position.y = yokeOff * .9; yoke.visible = st.step >= 1 && st.step <= 3 && yokeOff < .98 || st.step === 2;
      screw.position.y = TOP + .08 + .3 * (1 - fl) + .02; screw.rotation.y = -fl * 18;
      flare.scale.set(.53 + .47 * fl, Math.max(.01, fl), .53 + .47 * fl); flare.visible = fl > .01;
      nut.position.y = st.step >= 1 ? .3 : .3;
      if(st.step === 4 && strikeT < 0 && sw < 1) strikeT = 0;
      if(strikeT >= 0){ strikeT += dt; swing = Math.sin(Math.min(1, strikeT / .5) * Math.PI); if(strikeT > .25 && strikeT - dt <= .25) sw = Math.min(1, sw + .14); if(strikeT > .5){ strikeT = st.step === 4 && sw < 1 ? 0 : -1; } }
      else swing = ease(swing, 0, dt, 5);
      hammer.rotation.z = .35 - swing * .55; hammer.visible = st.step === 4 || st.step === 5;
      punch.visible = st.step >= 4; punch.position.y = TOP - .02 + (st.step === 5 ? .6 : (1 - sw) * .2) - .0;
      bell.scale.y = Math.max(.001, sw * .22); bell.position.set(XS, TOP - sw * .11, 0); bell.visible = sw > .01;
      ins = ease(ins, st.step === 5 ? 1 : 0, dt, 2); third.visible = st.step === 5; third.position.y = TOP + .35 + .5 * (1 - ins) - .1;
    }
  };
}

/* الكاوتش والمفصلات */
function roundedRectCurve(w, h, r, z){
  const pts = [], seg = 6, cs = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI], [w / 2 - r, -h / 2 + r, Math.PI * 1.5]];
  cs.forEach(([cx, cy, a0]) => { for(let i = 0; i <= seg; i++){ const a = a0 + Math.PI / 2 * i / seg; pts.push(V(cx + r * Math.cos(a), cy + r * Math.sin(a), z)); } });
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal');
}
function buildDoorGasket(){
  const ctx = makeCtx(), { root, part } = ctx; plate(root, 3.2, 2.4);
  const W = 1.3, H = 1.9, Y0 = .05;
  const cab = new THREE.Group(); root.add(cab);
  cab.add(at(box(W, H, .9, M(0xeef1f4, { r: .4 })), 0, Y0 + H / 2, -.47));
  cab.add(at(box(W - .16, H - .16, .02, M(0xc9d2dc, { r: .6 })), 0, Y0 + H / 2, -.015));
  const hinges = new THREE.Group(); root.add(hinges);
  const screws = [];
  [Y0 + H + .03, Y0 - .0].forEach(y => {
    hinges.add(at(box(.24, .05, .22, M(0x9aa3af, { m: .8, r: .3 })), -W / 2 + .08, y, -.02));
    hinges.add(at(cyl(.025, .025, .14, STEEL(), 12), -W / 2 + .02, y + (y > 1 ? -.07 : .07), .06));
    [-.08, .02].forEach(dx => { const s = at(cyl(.022, .022, .04, STEEL(), 6), -W / 2 + .08 + dx, y + .04 * (y > 1 ? 1 : -1), -.06); hinges.add(s); screws.push({ m: s, y0: s.position.y, dir: y > 1 ? 1 : -1 }); });
  });
  const pivot = new THREE.Group(); pivot.position.set(-W / 2 + .02, 0, .06); root.add(pivot);
  const door = new THREE.Group(); pivot.add(door);
  door.add(at(box(W, H, .1, M(0xf6f7f9, { r: .35 })), W / 2, Y0 + H / 2, .05));
  door.add(at(box(.05, .5, .06, M(0x9aa3af, { m: .8, r: .3 })), W - .1, Y0 + H * .6, .13));
  const oldG = new THREE.Mesh(new THREE.TubeGeometry(roundedRectCurve(W - .1, H - .1, .08, 0), 160, .035, 10, true), M(0x2b2f38, { r: .85 }));
  oldG.position.set(W / 2, Y0 + H / 2, -.02); door.add(oldG);
  const newM = M(0x1d2128, { r: .5 });
  const newG = new THREE.Mesh(new THREE.TubeGeometry(roundedRectCurve(W - .1, H - .1, .08, 0), 160, .035, 10, true), newM);
  newG.position.set(W / 2, Y0 + H / 2, -.02); door.add(newG);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(.22, .5), M(0xffffff, { r: .9, side: THREE.DoubleSide })); paper.rotation.y = Math.PI / 2; root.add(paper);
  part('door', door, V(W / 2, Y0 + H + .15, .1), 'باب الثلاجة', 'دوس عليه عشان تفتحه أو تقفله.');
  part('gasket', oldG, V(W - .05, Y0 + H * .3, 0), 'الكاوتش (الجوان)', 'فيه مغناطيس جوه بيشد الباب على الجسم ويمنع دخول الهوا.');
  part('newgasket', newG, V(.05, Y0 + H * .7, 0), 'الكاوتش الجديد', 'بنفس مقاس الباب بالظبط.');
  part('hinges', hinges, V(-W / 2 + .08, Y0 + H + .2, 0), 'المفصلات', 'العليا والسفلى، والباب راكب على مسمارها.');
  part('paper', paper, V(0, .3, 0), 'ورقة الاختبار', 'بنحطها بين الباب والجسم ونسحبها عشان نختبر الإحكام.');
  const st = { step: 0, open: 0 }; let off = 0, oldOff = 0, newIn = 0, unscrew = 0, open = 0;
  ctx.parts.door.tap = () => { if(st.step !== 4 && st.step !== 0) return 'الباب مفكوك دلوقتي.'; st.open = st.open ? 0 : 1; return st.open ? 'الباب اتفتح.' : 'الباب اتقفل والكاوتش لزق على الجسم.'; };
  return {
    ...ctx, view: V(.7, .45, 1.6), sway: true, hint: 'دوس على الباب عشان تفتحه · صباعين للتقريب',
    steps: [
      { title: 'الباب ومكوناته', text: 'باب الثلاجة راكب على مفصلتين فوق وتحت، وعلى ضهره كاوتش فيه مغناطيس بيشده على جسم الثلاجة. الكاوتش لو ناشف أو مقطوع، الهوا السخن بيدخل والثلاجة تشتغل على طول وتعمل تلج كتير.', s: { step: 0 } },
      { title: 'فك المفصلات', text: 'افصل الكهربا الأول. فك مسامير المفصلة العليا والباب مسنود، وارفع الباب من على مسمار المفصلة السفلى.', focus: 'hinges', s: { step: 1 } },
      { title: 'فك الكاوتش القديم', text: 'الكاوتش إما متركّب في مجرى وبيتشد باليد، أو متثبت بمسامير تحت حافته. شيله بالراحة وشوف لو فيه مسامير اتفكت معاه.', focus: 'gasket', s: { step: 2 } },
      { title: 'تركيب الكاوتش الجديد', text: 'لو الكاوتش الجديد متكرمش من التغليف، سخّنه بالسشوار شوية عشان يفرد. ركّبه في المجرى من الأركان الأول وبعدين الجوانب.', focus: 'newgasket', s: { step: 3 } },
      { title: 'التركيب واختبار الإحكام', text: 'ركّب الباب واربط المفصلة. حط ورقة بين الباب والجسم واقفل الباب واسحبها. لو الورقة ماسكة يبقى الكاوتش محكم، ولو طلعت بسهولة يبقى فيه مكان مش لازق. جرّب في كذا مكان.', focus: 'paper', s: { step: 4 } }
    ],
    apply(s){ st.step = s.step; st.open = 0; },
    update(dt){
      const t = performance.now() / 1000;
      unscrew = ease(unscrew, st.step === 1 || st.step === 2 || st.step === 3 ? 1 : 0, dt, 2);
      screws.forEach(o => { o.m.position.y = o.y0 + o.dir * .12 * unscrew; o.m.rotation.y = unscrew * 12; });
      off = ease(off, st.step >= 1 && st.step <= 3 ? 1 : 0, dt, 2);
      pivot.position.set(-W / 2 + .02 + .1 * off, .25 * off, .06 + .7 * off);
      oldOff = ease(oldOff, st.step >= 2 ? 1 : 0, dt, 2); oldG.position.z = -.02 - .5 * oldOff; oldG.visible = oldOff < .98;
      newIn = ease(newIn, st.step >= 3 ? 1 : 0, dt, 2); newG.position.z = -.02 - .6 * (1 - newIn); newG.visible = st.step >= 3;
      open = ease(open, st.open ? 1 : 0, dt, 3); pivot.rotation.y = -open * 1.6 - off * .2;
      paper.visible = st.step === 4 && !st.open; paper.position.set(W / 2 - .05, Y0 + H * .45 + Math.sin(t * 3) * .01, .1 + Math.max(0, Math.sin(t * 2)) * .04);
    }
  };
}

/* زيت الضاغط */
function makeGrad(x, z, maxMl){
  const g = new THREE.Group(); g.position.set(x, 0, z);
  g.add(at(cyl(.16, .16, .02, DARK(), 24), 0, .01, 0));
  g.add(at(cyl(.13, .13, .42, M(0xdbe7f5, { opacity: .25, r: .05, side: THREE.DoubleSide }), 32, true), 0, .23, 0));
  for(let i = 1; i <= 4; i++){ const r = new THREE.Mesh(new THREE.TorusGeometry(.132, .004, 4, 32), M(0x3b4250)); r.rotation.x = Math.PI / 2; g.add(at(r, 0, .03 + .38 * i / 4, 0)); }
  const oilM = M(0xc98a1e, { opacity: .85, r: .2 });
  const oil = at(cyl(.122, .122, 1, oilM, 32), 0, .03, 0); g.add(oil);
  const panel = makePanel(.34, .14, { bg: '#0d1b2a', fg: '#ffd34d', font: 'bold 62px monospace' }); panel.mesh.position.set(0, .56, 0); g.add(panel.mesh);
  return { group: g, oilM, set(ml){ const h = Math.max(.001, .38 * ml / maxMl); oil.scale.y = h; oil.position.y = .03 + h / 2; panel.setText(`${Math.round(ml)} ml`); } };
}
function buildCompressorOil(){
  const ctx = makeCtx(), { root, part } = ctx; plate(root, 3.4, 2.2);
  const piv = new THREE.Group(); root.add(piv);
  const comp = makeCompressor(1); at(comp, 0, -.45, 0); piv.add(comp);
  const stub = tube(CR([V(.36, .1, 0), V(.5, .14, 0), V(.62, .2, 0)]), .035, COPPER(), 20); piv.add(stub);
  const cap = at(cyl(.045, .045, .05, M(0xd23a2e, { r: .4 }), 12), .64, .21, 0); cap.rotation.z = -1.2; piv.add(cap);
  const oldCup = makeGrad(-.65, 0, 250); root.add(oldCup.group);
  oldCup.group.children.at(-1).position.set(-.36, .2, .12);
  const newCup = makeGrad(1.1, .25, 250); root.add(newCup.group); newCup.oilM.color.setHex(0xe8c35a);
  newCup.group.add(at(textSprite('POE', '#ffffff', .22), 0, .75, 0));
  const hose = tube(new THREE.QuadraticBezierCurve3(V(1.1, .4, .25), V(1.0, 1.3, .1), V(.0, .8, 0)), .018, M(0xdbe7f5, { opacity: .5 }), 50); root.add(hose);
  part('compressor', piv, V(0, .7, 0), 'الضاغط', 'بنميّله عشان الزيت ينزل من ماسورة السحب. دوس عليه عشان تميّله.');
  part('stub', stub, V(.62, .25, 0), 'ماسورة السحب', 'منها بنطلّع الزيت القديم وبنحط الجديد.');
  part('oldcup', oldCup.group, V(0, .7, 0), 'مخبار الزيت القديم', 'بنقيس فيه كمية الزيت اللي نزلت.');
  part('newcup', newCup.group, V(0, .9, 0), 'الزيت الجديد', 'بنفس الكمية اللي نزلت، وبالنوع المناسب لغاز الثلاجة.');
  const st = { step: 0, tip: 0 }; let tip = 0, oldMl = 0, newMl = 200;
  const tipPos = () => { const v = V(.64, .21, 0).applyEuler(piv.rotation).add(piv.position); return v; };
  const streamPts = []; const smM = new THREE.MeshBasicMaterial({ color: 0xc98a1e }); const smG = new THREE.SphereGeometry(.025, 8, 6);
  for(let i = 0; i < 14; i++){ const m = new THREE.Mesh(smG, smM); m.userData.t = i / 14; m.visible = false; root.add(m); streamPts.push(m); }
  const inflow = new Flow(root, new THREE.QuadraticBezierCurve3(V(1.1, .4, .25), V(1.0, 1.3, .1), V(.0, .8, 0)), { color: 0xe8c35a, count: 14, speed: .8, size: .03 });
  ctx.parts.compressor.tap = () => { if(st.step !== 1) return 'إمالة الضاغط في خطوة «تصفية الزيت القديم».'; st.tip = st.tip ? 0 : 1; return st.tip ? 'الضاغط اتميّل والزيت بينزل في المخبار.' : 'الضاغط اتعدل.'; };
  return {
    ...ctx, view: V(.3, .7, 1.6), sway: true, hint: 'دوس على الضاغط عشان تميّله · صباعين للتقريب',
    steps: [
      { title: 'تغيير زيت الضاغط', text: 'الزيت بيزيّت الأجزاء المتحركة جوه الضاغط. لو الضاغط اتحرق أو الزيت اسود أو ريحته محروقة، لازم يتغيّر. محتاجين مخبار مدرّج لقياس الكمية، وزيت جديد مناسب.', s: { step: 0 } },
      { title: 'تصفية الزيت القديم', text: 'فك الضاغط من الدائرة، وميّله بحيث ماسورة السحب تبقى لتحت، وسيب الزيت ينزل كله في المخبار. دوس على الضاغط عشان تميّله.', focus: 'compressor', s: { step: 1, tip: 1 } },
      { title: 'قياس الكمية', text: 'الكمية اللي نزلت هي اللي الضاغط محتاجها، هنا 180 ملّي. ولو الزيت لونه غامق أو فيه رايش، يبقى فيه تآكل جوه الضاغط.', focus: 'oldcup', s: { step: 2 } },
      { title: 'إضافة الزيت الجديد', text: 'عدّل الضاغط وحط نفس الكمية من الزيت الجديد في ماسورة السحب بخرطوم أو سرنجة. ما تزوّديش عن الكمية اللي نزلت.', focus: 'newcup', s: { step: 3 } },
      { title: 'نوع الزيت والقفل', text: 'النوع لازم يناسب الغاز: R134a بيستخدم زيت صناعي POE، وR600a وR12 بيستخدموا زيت معدني. اقفل الماسورة بسرعة لأن الزيت الصناعي بيشرب رطوبة من الهوا.', focus: 'stub', s: { step: 4 } }
    ],
    apply(s){ st.step = s.step; st.tip = s.tip || 0; oldMl = s.step >= 2 ? 180 : 0; newMl = s.step >= 4 ? 20 : 200; },
    update(dt){
      tip = ease(tip, st.step === 1 && st.tip ? 1 : 0, dt, 2);
      piv.position.set(-.6 * (1 - tip) - .6 * tip + .6 * (1 - tip) - .0, .45 + .5 * tip, 0);
      piv.position.x = -.0 - .55 * tip; piv.rotation.z = -1.9 * tip;
      const pouring = st.step === 1 && tip > .9 && oldMl < 180;
      if(pouring) oldMl = Math.min(180, oldMl + dt * 30);
      const tp = tipPos(), surf = .03 + .38 * oldMl / 250;
      streamPts.forEach(m => { m.visible = pouring; if(!pouring) return; m.userData.t = (m.userData.t + dt * 1.5) % 1; m.position.set(tp.x, tp.y + (surf - tp.y) * m.userData.t, 0); });
      const filling = st.step === 3 && newMl > 20;
      if(filling) newMl = Math.max(20, newMl - dt * 30);
      inflow.target = filling ? 1 : 0; inflow.update(dt); hose.visible = st.step === 3;
      oldCup.set(oldMl); newCup.set(newMl);
      cap.visible = st.step === 0 || st.step === 4;
      baseE(oldCup.oilM).setRGB(0, 0, 0); oldCup.oilM.color.setHex(0x5a3a12);
    }
  };
}

/* ضغط الدائرة والكشف على التسريب */
function buildLeakTest(){
  const ctx = makeCtx(), { root, part } = ctx; plate(root, 3.8, 2.4);
  // أنبوبة النيتروجين والمنظم
  const n2 = new THREE.Group(); n2.position.set(-1.45, 0, -.35); root.add(n2);
  n2.add(at(cyl(.22, .22, 1.5, M(0x3d4654, { r: .45, m: .3 }), 32), 0, .75, 0));
  n2.add(at(new THREE.Mesh(new THREE.SphereGeometry(.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(0x1f242c, { r: .45 })), 0, 1.5, 0));
  n2.add(at(textSprite('N2', '#ffffff', .3), 0, 1.0, .24));
  const reg = new THREE.Group(); reg.position.set(0, 1.78, 0); n2.add(reg);
  reg.add(at(box(.22, .18, .18, M(0xc9ced6, { m: .85, r: .25 })), 0, 0, 0));
  const knob = cyl(.07, .07, .08, M(0x2b3038, { r: .4 }), 20); knob.rotation.x = Math.PI / 2; reg.add(at(knob, 0, 0, .13));
  const gIn = makeGauge('#59626f', 0, 250, [0, 50, 100, 150, 200, 250], 'bar'); gIn.group.scale.setScalar(.55); at(gIn.group, -.22, .1, 0); reg.add(gIn.group);
  // الدائرة
  const comp = makeCompressor(.75); at(comp, .1, 0, -.35); root.add(comp);
  const circ = new THREE.Group(); root.add(circ);
  const loopPts = [V(.35, .55, -.2), V(.8, .55, 0), V(1.3, .55, -.1), V(1.4, .55, -.6), V(.6, .55, -.75), V(-.15, .5, -.55)];
  const loopC = CR(loopPts); circ.add(tube(loopC, .04, COPPER(), 120));
  const J = [.2, .5, .8].map(f => loopC.getPointAt(f));
  const jointM = J.map(() => M(0xe0b46a, { m: .85, r: .25 }));
  J.forEach((p, i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(.055, .02, 10, 24), jointM[i]); const tan = loopC.getTangentAt([.2, .5, .8][i]); r.position.copy(p); r.quaternion.setFromUnitVectors(V(0, 0, 1), tan); circ.add(r); });
  const svc = V(-.3, .75, .35);
  circ.add(tube(CR([V(.1, .55, -.05), V(-.2, .6, .2), svc]), .03, COPPER(), 30));
  const gauge = makeGauge('#2c6fd6', 0, 35, [0, 5, 10, 15, 20, 25, 30, 35], 'bar'); gauge.group.scale.setScalar(.8); gauge.group.position.copy(svc).add(V(0, .25, 0)); root.add(gauge.group);
  const hose = tube(new THREE.QuadraticBezierCurve3(V(-1.45, 1.75, -.25), V(-1.0, .2, .6), svc), .028, M(0xe8c21e, { r: .6 }), 60); root.add(hose);
  // الفرشة والفقاعات
  const brush = new THREE.Group(); root.add(brush);
  brush.add(at(cyl(.02, .02, .5, M(0x8a5a32, { r: .7 })), 0, .27, 0));
  brush.add(at(box(.1, .07, .1, M(0xf2d24a, { r: .9 })), 0, 0, 0));
  const bubbles = []; const bubM = new THREE.MeshStandardMaterial({ color: 0xdff3ff, transparent: true, opacity: .55, roughness: .05, metalness: 0, depthWrite: false });
  for(let i = 0; i < 9; i++){ const b = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), bubM); b.userData = { ph: Math.random(), dx: (Math.random() - .5) * .1, dz: (Math.random() - .5) * .1 }; b.visible = false; root.add(b); bubbles.push(b); }
  const n2Flow = new Flow(root, new THREE.QuadraticBezierCurve3(V(-1.45, 1.75, -.25), V(-1.0, .2, .6), svc), { color: 0xdbe4ee, count: 16, speed: 1, size: .035 });
  part('n2', n2, V(0, 2.05, 0), 'أنبوبة النيتروجين والمنظم', 'نيتروجين ناشف وآمن. دوس على المنظم عشان تفتح أو تقفل.');
  part('gauge', gauge.group, V(0, .3, .05), 'عداد ضغط الدائرة', 'بيقرا ضغط النيتروجين جوه الدائرة.');
  part('joint', circ, J[1].clone().add(V(0, .15, 0)), 'وصلات اللحام', 'التسريب غالبًا بيكون في الوصلات.');
  part('brush', brush, V(0, .6, 0), 'الفرشة والمية بالصابون', 'بنمسح بيها على الوصلات، ومكان التسريب بيعمل فقاعات.');
  const st = { step: 0, open: 0, leak: 1 }; let p = 0, brushT = 0, bub = 0;
  ctx.parts.n2.tap = () => { st.open = st.open ? 0 : 1; return st.open ? 'المنظم اتفتح: النيتروجين داخل الدائرة.' : 'المنظم اتقفل.'; };
  return {
    ...ctx, view: V(.4, .75, 1.6), sway: true, hint: 'دوس على منظم النيتروجين · صباعين للتقريب',
    steps: [
      { title: 'أدوات اختبار التسريب', text: 'أنبوبة نيتروجين بمنظم ضغط، وخرطوم، وعداد على ماسورة الخدمة، ومية بصابون وفرشة. ممنوع تمامًا نستخدم أكسجين أو هوا مضغوط في الاختبار.', s: { step: 0, open: 0, leak: 1, p: 0 } },
      { title: 'ضغط الدائرة', text: 'افتح المنظم بالراحة لحد ما عداد الدائرة يقرا حوالي 10 بار، وبعدين اقفله. دوس على المنظم عشان تفتحه وتقفله بنفسك.', focus: 'gauge', s: { step: 1, open: 1, leak: 1, p: 0 } },
      { title: 'اختبار الثبات', text: 'اقفل المنظم وراقب العداد. لو الضغط بينزل لوحده زي هنا، يبقى فيه تسريب في حتة. لازم نلاقيه.', focus: 'gauge', s: { step: 2, open: 0, leak: 1, p: 10 } },
      { title: 'الكشف بالصابون', text: 'امسح المية بالصابون على كل وصلة واحدة واحدة. الوصلة اللي بتطلّع فقاعات هي مكان التسريب، هنا الوصلة اللي في النص.', focus: 'brush', s: { step: 3, open: 0, leak: 1, p: 9 } },
      { title: 'بعد الإصلاح', text: 'فرّغ النيتروجين، والحم الوصلة تاني، وأعيد الضغط. لو العداد ثابت والوصلات من غير فقاعات، تبقى الدائرة سليمة. في الشغل الحقيقي بنسيبها ساعات قبل ما نحكم.', focus: 'joint', s: { step: 4, open: 0, leak: 0, p: 10 } }
    ],
    apply(s){ st.step = s.step; st.open = s.open; st.leak = s.leak; p = s.p; brushT = 0; bub = 0; },
    update(dt){
      if(st.open){ p = Math.min(10.5, p + dt * 2.2); if(p >= 10 && st.step === 1){ /* بيتقفل لوحده بعد ما يوصل */ } }
      else if(st.leak && p > 0) p = Math.max(0, p - dt * (st.step >= 2 ? .12 : .02));
      gauge.set(p); gauge.update(dt); gIn.set(st.open ? 150 : 160); gIn.update(dt);
      n2Flow.target = st.open && p < 10.4 ? 1 : 0; n2Flow.update(dt);
      knob.rotation.z = st.open ? -1.2 : 0;
      brushT += dt;
      const visit = st.step === 3 ? Math.min(2, Math.floor(brushT / 2.2)) : -1;
      brush.visible = st.step === 3;
      if(visit >= 0){ const tgt = J[visit].clone().add(V(0, .08, .1)); brush.position.lerp(tgt, Math.min(1, dt * 3)); brush.rotation.z = Math.sin(brushT * 8) * .25; }
      const bubOn = st.leak && p > 2 && st.step >= 3 && visit >= 1;
      bub = ease(bub, bubOn ? 1 : 0, dt, 2);
      bubbles.forEach(b => { b.visible = bub > .05; if(!b.visible) return; b.userData.ph = (b.userData.ph + dt * .5) % 1; const f = b.userData.ph; b.scale.setScalar((.015 + .05 * f) * bub); b.position.set(J[1].x + b.userData.dx, J[1].y + .03 + .05 * f, J[1].z + b.userData.dz); });
    }
  };
}

/* علامات الشحنة الكاملة */
function buildChargeCheck(){
  const ctx = makeCtx(), { root, part } = ctx; plate(root, 3.6, 2.4);
  const comp = makeCompressor(.85); at(comp, -1.25, 0, .35); root.add(comp);
  const evG = new THREE.Group(); root.add(evG);
  evG.add(at(box(1.55, 1.3, .05, M(0xd5dce4, { m: .55, r: .35 })), .35, 1.22, -.62));
  const rowsY = [1.72, 1.52, 1.32, 1.12, .92, .72], XA = -.3, XB = 1.0, Z = -.57, rr = .1, pts = [];
  rowsY.forEach((y, i) => {
    const [xs, xe] = i % 2 ? [XB, XA] : [XA, XB];
    for(let k = 0; k <= 6; k++) pts.push(V(xs + (xe - xs) * k / 6, y, Z));
    if(i < rowsY.length - 1){ const s = i % 2 ? -1 : 1, cy = (y + rowsY[i + 1]) / 2; for(let k = 1; k < 6; k++){ const f = Math.PI / 2 - Math.PI * k / 6; pts.push(V(xe + s * rr * Math.cos(f), cy + rr * Math.sin(f), Z)); } }
  });
  evG.add(tube(CR(pts), .03, M(0xb9c3cf, { m: .8, r: .3 }), 400));
  const frostRows = rowsY.map(y => { const m = M(0xf4fbff, { opacity: .02, r: .9 }); evG.add(at(box(XB - XA + .22, .14, .07, m), (XA + XB) / 2, y, Z + .01)); return m; });
  const sucC = CR([pts[pts.length - 1], V(-.5, .62, -.5), V(-.85, .4, -.05), V(-.92, .5, .3)]);
  const sucG = new THREE.Group(); root.add(sucG);
  sucG.add(tube(sucC, .04, COPPER(), 80));
  const sucFrostM = M(0xf4fbff, { opacity: .02, r: .9 }); sucG.add(tube(sucC, .058, sucFrostM, 80));
  root.add(tube(CR([V(-1.3, .72, .2), V(-1.0, 1.45, -.35), V(-.5, 1.85, -.56), pts[0]]), .012, M(0xe0a070, { m: .85 }), 80));
  const g = makeGauge('#2c6fd6', -1, 10, [-1, 0, 2, 4, 6, 8, 10], 'bar'); g.group.position.set(-.3, 1.05, .45); root.add(g.group);
  root.add(at(cyl(.02, .02, .8, STEEL()), -.3, .5, .4));
  root.add(tube(new THREE.QuadraticBezierCurve3(V(-.3, .8, .42), V(-.6, .15, .7), V(-1.1, .65, .42)), .025, M(0x2c6fd6, { r: .6 }), 40));
  const tP = makePanel(.6, .18, { bg: '#0d1b2a', fg: '#7fd3ff', font: 'bold 52px monospace' }); tP.mesh.position.set(.35, 2.0, -.58); root.add(tP.mesh);
  const aP = makePanel(.42, .16, { bg: '#0d1b2a', fg: '#ffd34d', font: 'bold 58px monospace' }); aP.mesh.position.set(-1.25, 1.05, .4); root.add(aP.mesh);
  part('evaporator', evG, V(XB + .15, 1.8, Z), 'المبخر (الفريزر)', 'شكل التلج عليه أهم علامة. دوس عليه عشان تقلب بين ناقص ومظبوط وزيادة.');
  part('suction', sucG, sucC.getPoint(.6).add(V(0, .1, 0)), 'خط السحب', 'لو التلج وصل عليه لحد الضاغط، يبقى فيه فريون زيادة.');
  part('gauge', g.group, V(0, .3, .05), 'عداد ضغط السحب', 'الطبيعي حوالي 0.5 بار لغاز R134a.');
  part('compressor', comp, V(0, 1.35, 0), 'الضاغط', 'الشاشة فوقه بتقول التيار اللي بيسحبه.');
  const VAL = [{ cover: 2.3, suc: 0, p: -.15, t: -6, a: 0.85 }, { cover: 6, suc: 0, p: .5, t: -18, a: 1.2 }, { cover: 6, suc: 1, p: 1.6, t: -14, a: 1.6 }];
  const NAME = ['شحنة ناقصة', 'شحنة مظبوطة', 'شحنة زيادة'];
  let c = 1, cover = 6, suc = 0, tF = -18, amp = 1.2;
  ctx.parts.evaporator.tap = () => { c = (c + 1) % 3; return `${NAME[c]}: بص على التلج والعداد والشاشات.`; };
  return {
    ...ctx, view: V(.35, .75, 1.6), sway: true, hint: 'دوس على المبخر عشان تغيّر الشحنة · صباعين للتقريب',
    steps: [
      { title: 'علامات الشحنة', text: 'بنحكم على الشحنة من 3 حاجات مع بعض: شكل التلج على المبخر، وضغط السحب على العداد، وحرارة الفريزر وتيار الضاغط. هنا الشحنة مظبوطة.', s: { c: 1 } },
      { title: 'شحنة ناقصة', text: 'التلج على أول صفين بس من المبخر والباقي ناشف، وضغط السحب واطي قريب من الصفر أو تحته، والفريزر مش بيوصل للحرارة المطلوبة، وتيار الضاغط أقل من الطبيعي.', focus: 'evaporator', s: { c: 0 } },
      { title: 'شحنة مظبوطة', text: 'التلج مغطي المبخر كله بالتساوي ويقف عند آخره، وضغط السحب حوالي 0.5 بار، والفريزر بيوصل لـ -18 درجة، والتيار طبيعي.', focus: 'gauge', s: { c: 1 } },
      { title: 'شحنة زيادة', text: 'التلج بيعدّي المبخر ويمشي على خط السحب لحد الضاغط، وضغط السحب عالي، والتيار أعلى من الطبيعي، والفريزر أسخن من المظبوط. الزيادة دي ممكن توصّل سائل للضاغط وتبوّظه.', focus: 'suction', s: { c: 2 } },
      { title: 'الضبط', text: 'لو الشحنة ناقصة: زوّد فريون بكميات صغيرة واستنى حوالي 10 دقايق بين كل مرة. لو زيادة: طلّع شوية بحذر. دوس على المبخر عشان تقلب بين الحالات التلاتة وتقارن.', focus: 'evaporator', s: { c: 1 } }
    ],
    apply(s){ c = s.c; },
    update(dt){
      const v = VAL[c];
      cover = ease(cover, v.cover, dt, 1.2); suc = ease(suc, v.suc, dt, 1.2); tF = ease(tF, v.t, dt, 1.2); amp = ease(amp, v.a, dt, 2);
      frostRows.forEach((m, i) => { m.opacity = .02 + .83 * Math.max(0, Math.min(1, cover - i)); });
      sucFrostM.opacity = .02 + .7 * suc;
      g.set(v.p); g.update(dt);
      tP.setText(`${Math.round(tF)}°C`); aP.setText(`${amp.toFixed(1)} A`);
      comp.position.x = -1.25 + Math.sin(performance.now() * .09) * .004;
    }
  };
}

/* دائرة الإذابة (نوفروست) */
function buildDefrost(){
  const ctx = makeCtx(), { root, part } = ctx; plate(root, 3.6, 2.4);
  const ev = new THREE.Group(); ev.position.set(0, 1.25, -.35); root.add(ev);
  const finM = M(0xb9c3cf, { m: .75, r: .3 });
  for(let x = -.7; x <= .71; x += .07) ev.add(at(box(.012, .6, .3, finM), x, 0, 0));
  [-.18, 0, .18].forEach(y => { const t = cyl(.03, .03, 1.5, M(0xb9c3cf, { m: .8 })); t.rotation.z = Math.PI / 2; ev.add(at(t, 0, y, 0)); });
  const iceM = M(0xf2fbff, { opacity: .02, r: .4 }); ev.add(at(box(1.52, .64, .34, iceM), 0, 0, 0));
  const heatM = M(0x8a2a1a, { m: .5, r: .4 });
  const hc = CR([V(-.72, .9, -.25), V(.6, .9, -.25), V(.74, .9, -.35), V(.6, .9, -.45), V(-.72, .9, -.45)]);
  const heater = tube(hc, .025, heatM, 80); root.add(heater);
  const bim = new THREE.Group(); bim.position.set(.55, 1.47, -.17); root.add(bim);
  const bimM = M(0x9aa3af, { m: .85, r: .3 }); const bd = cyl(.065, .065, .05, bimM, 20); bd.rotation.x = Math.PI / 2; bim.add(bd);
  bim.add(tube(CR([V(-.03, -.04, .02), V(-.1, -.2, .1), V(-.2, -.35, .15)]), .008, M(0xd23a2e), 20));
  const pan = at(box(1.6, .05, .42, M(0x9aa3af, { m: .6 })), 0, .82, -.35); root.add(pan);
  const drainC = CR([V(0, .8, -.3), V(.05, .55, -.05), V(.5, .6, .25), V(.85, .98, .45)]);
  const drain = tube(drainC, .03, M(0xdbe7f5, { opacity: .6 }), 60); root.add(drain);
  const comp = makeCompressor(.75); at(comp, .85, 0, .45); root.add(comp);
  root.add(at(box(.62, .05, .46, M(0x59626f, { m: .4 })), .85, .9, .45));
  const trayM = M(0x4d9be8, { opacity: .02 }); root.add(at(box(.56, .03, .4, trayM), .85, .94, .45));
  const timer = new THREE.Group(); timer.position.set(-1.25, 0, .35); root.add(timer);
  timer.add(at(box(.42, .32, .25, M(0xeceef1, { r: .4 })), 0, .16, 0));
  const dial = cyl(.1, .1, .03, M(0x2b3038, { r: .4 }), 24); dial.rotation.x = Math.PI / 2; timer.add(at(dial, 0, .18, .13));
  const slot = at(box(.12, .015, .01, M(0xffffff)), 0, .18, .148); timer.add(slot);
  const modeP = makePanel(.5, .16, { bg: '#0d1b2a', fg: '#9fe6a0', font: 'bold 46px sans-serif' }); modeP.mesh.position.set(0, .5, 0); timer.add(modeP.mesh);
  const evP = makePanel(.42, .16, { bg: '#0d1b2a', fg: '#7fd3ff', font: 'bold 58px monospace' }); evP.mesh.position.set(0, 1.72, -.35); root.add(evP.mesh);
  const drops = new Flow(root, drainC, { color: 0x7fc4ff, count: 10, speed: .7, size: .03 });
  const drips = []; const dripM = new THREE.MeshBasicMaterial({ color: 0x9fd4ff });
  for(let i = 0; i < 8; i++){ const d = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), dripM); d.userData = { x: -.6 + Math.random() * 1.2, p: Math.random() }; d.visible = false; root.add(d); drips.push(d); }
  const steam = []; const steamM = new THREE.SpriteMaterial({ map: glowTex, color: 0xe8f3ff, transparent: true, opacity: .4, depthWrite: false });
  for(let i = 0; i < 6; i++){ const sp = new THREE.Sprite(steamM.clone()); sp.userData = { x: .65 + Math.random() * .4, p: Math.random() }; sp.visible = false; root.add(sp); steam.push(sp); }
  const meter = makeMeter('Ω'); at(meter.group, -1.25, 0, -.65); root.add(meter.group);
  const probes = makeProbes(root, termOf(meter.group, meter.red), termOf(meter.group, meter.black));
  part('evaporator', ev, V(-.5, .4, .15), 'المبخر', 'التلج بيتجمع عليه في وضع التبريد.');
  part('heater', heater, V(-.4, .95, -.2), 'سخان الإذابة', 'تحت المبخر، بيحمر ويدوّب التلج.');
  part('bimetal', bim, V(0, .12, .04), 'البايمتال', 'بيفصل السخان لما المبخر يوصل حوالي 10 درجات.');
  part('drain', drain, drainC.getPoint(.5).add(V(0, .1, 0)), 'خرطوم الصرف', 'بيوصّل مية الإذابة لصينية التبخير فوق الضاغط.');
  part('timer', timer, V(0, .72, 0), 'تايمر الإذابة', 'بيقلب بين التبريد والإذابة. دوس عليه عشان تلفّه.');
  part('meter', meter.group, V(0, .36, -.1), 'الآفوميتر', 'لاختبار السخان والبايمتال.');
  const st = { mode: 'cool', test: 0 }; let ice = .5, evT = -22, bimClosed = true, water = 0, openT = 0, dialA = 0, tt = 0;
  ctx.parts.timer.tap = () => { st.mode = st.mode === 'cool' ? 'defrost' : 'cool'; openT = 0; return st.mode === 'defrost' ? 'التايمر قلب على الإذابة: الضاغط وقف والسخان اشتغل.' : 'التايمر رجع على التبريد.'; };
  return {
    ...ctx, view: V(.3, .75, 1.6), sway: true, hint: 'دوس على التايمر عشان تلفّه · صباعين للتقريب',
    steps: [
      { title: 'دائرة الإذابة في النوفروست', text: 'في الثلاجة النوفروست المبخر مستخبي ورا الفريزر، والتلج بيتجمع عليه. كل كام ساعة التايمر بيوقّف الضاغط ويشغّل سخان تحت المبخر يدوّب التلج، والمية بتنزل في خرطوم لصينية فوق الضاغط وتتبخر.', s: { mode: 'cool', ice: .6, evT: -22, test: 0 } },
      { title: 'وضع التبريد', text: 'الضاغط شغال والمبخر بيبرد لحد حوالي -25 درجة، والتلج بيتجمع عليه بالتدريج.', focus: 'evaporator', s: { mode: 'cool', ice: .25, evT: -20, test: 0 } },
      { title: 'بداية الإذابة', text: 'بعد حوالي 8 ساعات تشغيل، التايمر بيلف ويفصل الضاغط ويوصّل السخان فيحمر. دوس على التايمر عشان تلفّه بإيدك زي الفني.', focus: 'heater', s: { mode: 'defrost', ice: .9, evT: -20, test: 0 } },
      { title: 'ذوبان التلج والصرف', text: 'التلج بيدوب والمية بتنزل في الصينية وتمشي في الخرطوم لصينية التبخير فوق الضاغط، وحرارة الضاغط بتبخّرها. لو الخرطوم مسدود، المية بتتلج تحت الفريزر أو تنزل جوه الثلاجة.', focus: 'drain', s: { mode: 'defrost', ice: .6, evT: 0, test: 0 } },
      { title: 'البايمتال بيفصل', text: 'البايمتال ملزوق على المبخر. أول ما الحرارة توصل حوالي 10 درجات بيفصل السخان، حتى لو التايمر لسه على الإذابة. ولو البايمتال اتعطل، فيه فيوز حراري بيفصل للأمان.', focus: 'bimetal', s: { mode: 'defrost', ice: 0, evT: 6, test: 0 } },
      { title: 'الاختبار بالآفوميتر', text: 'السخان السليم بيقرا مقاومة، هنا حوالي 160 أوم لسخان 300 وات. والبايمتال وهو بارد لازم يقرا 0 يعني موصّل، ولو قرا OL وهو بارد يبقى تالف.', focus: 'meter', s: { mode: 'cool', ice: .2, evT: -20, test: 1 } }
    ],
    apply(s){ st.mode = s.mode; ice = s.ice; evT = s.evT; st.test = s.test; bimClosed = evT < 10; openT = 0; tt = 0; },
    update(dt){
      tt += dt;
      const heaterOn = st.mode === 'defrost' && bimClosed;
      if(st.mode === 'cool'){ evT = ease(evT, -25, dt, .5); ice = Math.min(1, ice + dt * .04); }
      else if(heaterOn){ if(ice > 0 && evT >= 0){ evT = 0; ice = Math.max(0, ice - dt * .12); water = Math.min(1, water + dt * .2); } else evT += dt * 6; }
      if(evT >= 10) bimClosed = false; if(evT <= -5) bimClosed = true;
      if(st.mode === 'defrost' && !bimClosed){ openT += dt; evT = Math.min(12, evT + dt); }
      water = Math.max(0, water - dt * .03);
      iceM.opacity = .02 + ice * .85;
      baseE(heatM).setRGB(1, .25, .05).multiplyScalar(heaterOn ? 1 : 0); heatM.userData.baseI = 1.5;
      const melting = heaterOn && ice > 0 && evT >= 0;
      drops.target = melting ? 1 : 0; drops.update(dt);
      drips.forEach(d => { d.visible = melting; if(!melting) return; d.userData.p = (d.userData.p + dt * 1.2) % 1; d.position.set(d.userData.x, .93 - .1 * d.userData.p, -.35); });
      trayM.opacity = .02 + water * .7;
      steam.forEach(sp => { sp.visible = water > .15; if(!sp.visible) return; sp.userData.p = (sp.userData.p + dt * .3) % 1; const p = sp.userData.p; sp.position.set(sp.userData.x, 1.0 + p * .6, .45); sp.material.opacity = .35 * Math.sin(Math.PI * p) * water; sp.scale.setScalar(.15 + .2 * p); });
      dialA += dt * (st.mode === 'cool' ? .3 : .6); slot.rotation.z = dialA;
      modeP.setText(st.mode === 'cool' ? 'تبريد' : (heaterOn ? 'إذابة' : 'إذابة - السخان فاصل'));
      evP.setText(`${Math.round(evT)}°C`);
      comp.position.x = .85 + (st.mode === 'cool' ? Math.sin(performance.now() * .09) * .004 : 0);
      let a = null, b = null, read = '—';
      if(st.test){ const k = Math.floor(tt / 3) % 2; if(k === 0){ a = V(-.72, .92, -.25); b = V(-.72, .92, -.45); read = '160 Ω'; } else { a = V(.49, 1.3, -.05); b = V(.35, 1.12, -.02); read = '0.0 Ω'; } }
      probes.set(a, b); probes.update(dt); meter.setText(read);
    }
  };
}

/* دائرة الثلاجة النوفروست (التايمر والسخان والمروحة) */
function buildNoFrostControl(sys = 'us'){
  const JP = sys === 'jp';
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(makeBoard());
  const brass = M(0xd9a441, { m: .85, r: .3 });
  const post = (g, x, y, z) => g.add(at(cyl(.035, .035, .06, brass, 12), x, y, z));
  const plug = new THREE.Group(); plug.position.set(-1.95, 0, -.2); root.add(plug);
  plug.add(at(box(.38, .22, .7, M(0x2b3038, { r: .5 })), 0, .11, 0)); post(plug, .1, .25, -.2); post(plug, .1, .25, .2);
  plug.add(at(textSprite('L', '#ff7a6b', .18), -.08, .4, -.2)); plug.add(at(textSprite('N', '#9cc2ff', .18), -.08, .4, .2));
  const th = new THREE.Group(); th.position.set(-1.05, 0, -1.1); root.add(th);
  th.add(at(box(.46, .2, .26, M(0xeceef1, { r: .4 })), 0, .1, 0)); post(th, -.16, .22, 0); post(th, .16, .22, 0);
  const tm = new THREE.Group(); tm.position.set(.1, 0, -1.0); root.add(tm);
  tm.add(at(cyl(.3, .3, .2, M(0xeceef1, { r: .4 }), 40), 0, .1, 0));
  const dial = new THREE.Group(); dial.position.set(0, .21, 0); tm.add(dial);
  dial.add(cyl(.18, .18, .03, M(0x2b3038, { r: .4 }), 32)); dial.add(at(box(.3, .015, .03, M(0xffffff)), 0, .025, 0));
  const TX = [-.27, -.09, .09, .27];
  TX.forEach((x, i) => { post(tm, x, .08, .3); tm.add(at(textSprite(String(i + 1), '#ffd34d', .15), x, .25, .36)); });
  const modeP = makePanel(.75, .16, { bg: '#0d1b2a', fg: '#9fe6a0', font: 'bold 40px sans-serif' }); modeP.mesh.position.set(0, .55, 0); tm.add(modeP.mesh);
  const comp = makeCompressor(.7); at(comp, 1.45, 0, -.75); root.add(comp);
  const cpost = new THREE.Group(); root.add(cpost); post(cpost, 1.3, .06, -.3); post(cpost, 1.6, .06, -.3);
  const fan = new THREE.Group(); fan.position.set(1.6, 0, .5); root.add(fan);
  fan.add(at(box(.3, .2, .2, M(0x3b4250, { r: .5 })), 0, .1, 0));
  const blades = new THREE.Group(); blades.position.set(0, .32, 0); fan.add(blades);
  for(let i = 0; i < 4; i++){ const b = box(.08, .22, .012, M(0x4f8fd9, { r: .5 })); b.position.y = .12; b.rotation.y = .5; const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; arm.add(b); blades.add(arm); }
  post(fan, -.2, .06, .14); post(fan, .2, .06, .14);
  const heatM = M(0x8a2a1a, { m: .5, r: .4 });
  const hC = CR([V(-.15, .07, .95), V(.6, .07, .95), V(.72, .07, 1.05), V(.6, .07, 1.15), V(-.05, .07, 1.15)]);
  const heater = tube(hC, .03, heatM, 80); root.add(heater);
  const bim = new THREE.Group(); bim.position.set(-.6, 0, .95); root.add(bim);
  bim.add(at(cyl(.09, .09, .05, M(0x9aa3af, { m: .85, r: .3 }), 24), 0, .03, 0)); post(bim, -.1, .07, 0); post(bim, .1, .07, 0);
  const fuse = new THREE.Group(); fuse.position.set(-1.2, 0, .95); root.add(fuse);
  const fg = cyl(.04, .04, .26, M(0xdbe7f5, { opacity: .5 }), 16); fg.rotation.z = Math.PI / 2; fuse.add(at(fg, 0, .07, 0));
  [-.14, .14].forEach(x => { const cp = cyl(.045, .045, .04, STEEL(), 16); cp.rotation.z = Math.PI / 2; fuse.add(at(cp, x, .07, 0)); });
  const L = termOf(plug, V(.1, .28, -.2)), N = termOf(plug, V(.1, .28, .2));
  const th1 = termOf(th, V(-.16, .25, 0)), th2 = termOf(th, V(.16, .25, 0));
  const T = TX.map(x => termOf(tm, V(x, .11, .3)));
  const cA = V(1.3, .09, -.3), cB = V(1.6, .09, -.3);
  const fA = termOf(fan, V(-.2, .09, .14)), fB = termOf(fan, V(.2, .09, .14));
  const fu1 = termOf(fuse, V(-.16, .07, 0)), fu2 = termOf(fuse, V(.16, .07, 0));
  const b1 = termOf(bim, V(-.1, .1, 0)), b2 = termOf(bim, V(.1, .1, 0));
  const hA = V(-.15, .07, .95), hB = V(-.05, .07, 1.15);
  const wires = new THREE.Group(); root.add(wires);
  const RED = 0xd0473a, BLK = 0x2b2f38, BLU = 0x3e6fb0, ORG = 0xe0892e;
  const W = {
    L: arch(L, th1, .25), TH: arch(th2, T[0], .25), C4: arch(T[3], cA, .3), CN: arch(cB, N, .45), F4: arch(T[3], fA, .35), FN: arch(fB, N, .45),
    D2: arch(T[1], fu1, .35), FB: arch(fu2, b1, .2), BH: arch(b2, hA, .2), HN: arch(hB, N, .4), M3: JP ? arch(T[2], hA, .45) : arch(T[2], N, .5)
  };
  [['L', RED], ['TH', RED], ['C4', BLU], ['CN', BLK], ['F4', BLU], ['FN', BLK], ['D2', ORG], ['FB', ORG], ['BH', ORG], ['HN', BLK], ['M3', JP ? 0x4fa87a : BLK]].forEach(([k, c]) => wireOn(wires, W[k], c));
  part('plug', plug, V(0, .5, 0), 'مصدر الكهرباء', 'L الخط وN النيوترال.');
  part('thermostat', th, V(0, .4, 0), 'الترموستات', 'بيفصل كل حاجة لما الحرارة توصل للمطلوب.');
  part('timer', tm, V(.36, .3, 0), 'تايمر الإذابة', '4 أطراف: 1 الداخل، 4 للتبريد، 2 للإذابة، 3 لموتور التايمر. دوس عليه عشان تقلبه.');
  part('compressor', comp, V(0, .95, 0), 'الضاغط', 'بيشتغل في وضع التبريد بس.');
  part('fan', fan, V(0, .62, 0), 'مروحة المبخر', 'بتشتغل مع الضاغط وبتوزّع الهوا البارد.');
  part('heater', heater, V(.3, .2, 1.05), 'سخان الإذابة', 'بيشتغل في وضع الإذابة بس.');
  part('bimetal', bim, V(0, .25, 0), 'البايمتال', 'بيفصل السخان عند حوالي 10 درجات.');
  part('fuse', fuse, V(0, .25, 0), 'الفيوز الحراري', 'حماية: بيفصل لو البايمتال باظ والحرارة علت جدًا.');
  const pre = [W.L, line(th1, th2), W.TH];
  const coolP = chain(...pre, line(T[0], T[3]), W.C4, line(cA, cB), W.CN);
  const fanP = chain(...pre, line(T[0], T[3]), W.F4, line(fA, fB), W.FN);
  const defP = chain(...pre, line(T[0], T[1]), W.D2, line(fu1, fu2), W.FB, line(b1, b2), W.BH, hC, W.HN);
  const motP = JP ? chain(...pre, line(T[0], T[2]), W.M3, hC, W.HN) : chain(...pre, line(T[0], T[2]), W.M3);
  const fCool = new Flow(root, coolP, { count: 34, speed: 1.2 }), fFan = new Flow(root, fanP, { count: 30, speed: 1.2 }), fDef = new Flow(root, defP, { color: 0xff8a3a, count: 34, speed: 1.2 }), fMot = new Flow(root, motP, { color: 0x9fe6a0, count: 14, speed: .8, size: .035 });
  const st = { mode: 'cool', auto: 0 }; let hours = 2, evT = -24, bimClosed = true, after = 0, defMin = 0;
  ctx.parts.timer.tap = () => { st.mode = st.mode === 'cool' ? 'defrost' : 'cool'; hours = 0; after = 0; defMin = 0; if(st.mode === 'defrost'){ evT = Math.min(evT, -20); bimClosed = true; } return st.mode === 'defrost' ? 'التايمر قلب على الإذابة (طرف 1 مع 2).' : 'التايمر رجع على التبريد (طرف 1 مع 4).'; };
  return {
    ...ctx, view: V(.3, 1.3, 1.5), sway: true, hint: 'دوس على التايمر عشان تقلبه · صباعين للتقريب',
    steps: JP ? [
      { title: 'النوفروست: النظام الياباني', text: 'نفس الأجزاء: تايمر بـ 4 أطراف، وترموستات، وضاغط، ومروحة، وسخان، وبايمتال، وفيوز. الفرق كله في سلك واحد: طرف 3 (موتور التايمر) متوصل على النقطة اللي بين البايمتال والسخان (السلك الأخضر)، مش على النيوترال.', s: { mode: 'cool', auto: 0, hours: 2 } },
      { title: 'التبريد: الموتور شغال عن طريق السخان', text: 'التايمر موصّل 1 مع 4، فالضاغط والمروحة شغالين. تيار موتور التايمر بيكمّل للنيوترال عن طريق السخان (النقط الخضرا). التيار ده صغير جدًا، فالسخان ما بيسخنش، والموتور بيلف عادي.', focus: 'timer', s: { mode: 'cool', auto: 0, hours: 3 } },
      { title: 'الإذابة: التايمر بيقف', text: 'التايمر قلب 1 مع 2، والسخان اشتغل عن طريق البايمتال المقفول. دلوقتي طرفين الموتور الاتنين على الخط (L)، فمفيش جهد عليه والتايمر بيقف مكانه. بص على القرص: واقف. دوس على التايمر لو عايزة تقلبه بإيدك.', focus: 'timer', s: { mode: 'defrost', auto: 1, hours: 0, evT: -20 } },
      { title: 'البايمتال بيفصل والتايمر يكمّل', text: 'أول ما التلج يدوب والمبخر يوصل حوالي 10 درجات، البايمتال بيفصل. السخان بيطفى، والموتور ياخد كهربا تاني عن طريق السخان، فيكمّل لف ويرجّع التايمر للتبريد بعد دقايق.', focus: 'bimetal', s: { mode: 'defrost', auto: 1, hours: 0, evT: 4 } },
      { title: 'ليه الياباني «بدون زمن محدد»', text: 'مدة الإذابة هنا على قد التلج: التايمر مش بيكمّل غير لما البايمتال يقول إن التلج خلص. لو التلج قليل الإذابة بتخلص بسرعة والضاغط يرجع يشتغل، ولو كتير بتطول لحد ما يدوب كله.', focus: 'heater', s: { mode: 'cool', auto: 1, hours: 7 } }
    ] : [
      { title: 'النوفروست: النظام الأمريكي', text: 'تايمر بـ 4 أطراف، وترموستات، وضاغط، ومروحة مبخر، وسخان إذابة، وبايمتال، وفيوز حراري. طرف 3 (موتور التايمر) متوصل على النيوترال مباشرة، فالموتور شغال طول ما الترموستات موصّل.', s: { mode: 'cool', auto: 0, hours: 2 } },
      { title: 'وضع التبريد', text: 'التايمر بيوصّل طرف 1 بطرف 4، فالضاغط ومروحة المبخر بيشتغلوا مع بعض. المروحة بتوزّع الهوا البارد على الفريزر والثلاجة.', focus: 'fan', s: { mode: 'cool', auto: 0, hours: 2 } },
      { title: 'التايمر بيعد الوقت', text: 'موتور التايمر (النقط الخضرا) شغال على طول وبيلف الكامة. بعد حوالي 8 ساعات تبريد بيقلب على الإذابة. الوقت هنا متسرّع. دوس على التايمر عشان تقلبه بنفسك.', focus: 'timer', s: { mode: 'cool', auto: 1, hours: 6 } },
      { title: 'الإذابة بزمن محدد', text: 'التايمر بيوصّل 1 مع 2: الضاغط والمروحة يفصلوا، والتيار يعدّي على الفيوز والبايمتال للسخان فيحمر. والموتور لسه شغال، فالإذابة بتاخد وقت ثابت حوالي 25 دقيقة. الشاشة بتعد الدقايق.', focus: 'heater', s: { mode: 'defrost', auto: 1, hours: 0, evT: -20 } },
      { title: 'البايمتال بيفصل بدري', text: 'لما المبخر يوصل حوالي 10 درجات البايمتال يفصل السخان، بس الضاغط بيفضل واقف لحد ما الـ 25 دقيقة يخلصوا، لأن التايمر هو اللي بيحدد الوقت. والفيوز الحراري حماية لو البايمتال باظ.', focus: 'bimetal', s: { mode: 'defrost', auto: 1, hours: 0, evT: 4 } },
      { title: 'ليه الأمريكي «بزمن محدد»', text: 'مدة الإذابة ثابتة مهما كان التلج. لو التلج قليل، الضاغط بيفضل واقف على الفاضي لحد ما الوقت يخلص. قارن بالنظام الياباني في التاب اللي جنبه، اللي التايمر فيه بيستنى البايمتال.', focus: 'timer', s: { mode: 'cool', auto: 1, hours: 7 } }
    ],
    apply(s){ st.mode = s.mode; st.auto = s.auto; hours = s.hours; if(s.evT !== undefined) evT = s.evT; bimClosed = evT < 10; after = 0; defMin = 0; },
    update(dt){
      const cool = st.mode === 'cool', heaterOn = !cool && bimClosed;
      const motorOn = !JP || cool || !bimClosed;
      if(cool){ hours += dt * (st.auto ? .5 : .05); evT = ease(evT, -25, dt, .5); if(st.auto && hours >= 8){ st.mode = 'defrost'; hours = 0; defMin = 0; bimClosed = true; } }
      else {
        if(heaterOn) evT += dt * 4;
        if(!JP){ defMin += dt * 2.5; if(defMin >= 25){ st.mode = 'cool'; hours = 0; defMin = 0; } }
        else if(!bimClosed){ after += dt; if(after > 3){ st.mode = 'cool'; hours = 0; } }
      }
      if(evT >= 10) bimClosed = false; if(evT <= -5) bimClosed = true;
      fCool.target = cool ? 1 : 0; fFan.target = cool ? 1 : 0; fDef.target = heaterOn ? 1 : 0; fMot.target = motorOn ? 1 : 0;
      [fCool, fFan, fDef, fMot].forEach(f => f.update(dt));
      blades.rotation.z -= dt * 10 * fFan.level;
      baseE(heatM).setRGB(1, .25, .05).multiplyScalar(heaterOn ? 1 : 0); heatM.userData.baseI = 1.5;
      if(motorOn) dial.rotation.y -= dt * (cool ? .4 : .8);
      modeP.setText(cool ? `تبريد ${Math.floor(hours)} ساعة` : JP ? (heaterOn ? 'إذابة - التايمر واقف' : 'التايمر بيكمّل') : `إذابة ${Math.floor(defMin)} دقيقة`);
      comp.position.x = 1.45 + (cool ? Math.sin(performance.now() * .09) * .004 : 0);
    }
  };
}


/* التكييف الشباك: الصيانة الدورية والأعطال */
function buildWindowAC(mode = 'maint'){
  const ctx = makeCtx(), { root, part } = ctx; plate(root, 3.2, 2.6);
  const Y0 = .05, Wd = 1.6, Hh = .9, Dp = 1.4;
  const shell = new THREE.Group(); root.add(shell);
  shell.add(at(box(Wd, .04, Dp, M(0x9aa3af, { m: .6 })), 0, Y0 + .02, 0));
  const caseM = M(0xe6e9ed, { opacity: .2, r: .4, side: THREE.DoubleSide });
  shell.add(at(box(Wd, Hh, Dp, caseM), 0, Y0 + Hh / 2, 0));
  shell.add(at(box(Wd - .04, Hh - .04, .03, M(0x8c95a3, { m: .5 })), 0, Y0 + Hh / 2, 0));
  // الوش الأمامي
  const front = new THREE.Group(); root.add(front);
  front.add(at(box(Wd, Hh, .05, M(0xf3f4f6, { r: .4, opacity: .92 })), 0, Y0 + Hh / 2, .72));
  for(let i = 0; i < 6; i++) front.add(at(box(Wd - .3, .02, .03, M(0xbfc6cf)), 0, Y0 + Hh - .14 - i * .05, .755));
  const outP = makePanel(.36, .14, { bg: '#0d1b2a', fg: '#7fd3ff', font: 'bold 60px monospace' }); outP.mesh.position.set(.55, Y0 + .18, .76); front.add(outP.mesh);
  // الفلتر
  const dust = C(0x8a7356), clean = C(0xdfe7ef);
  const filterM = M(0x8a7356, { r: .9, opacity: .85 });
  const filter = at(box(1.4, .72, .02, filterM), 0, Y0 + Hh / 2, .66); root.add(filter);
  // المبخر
  const evap = new THREE.Group(); root.add(evap);
  const evFinM = M(0x8a7356, { m: .5, r: .5 });
  for(let x = -.68; x <= .69; x += .06) evap.add(at(box(.01, .7, .12, evFinM), x, Y0 + Hh / 2, .55));
  [-.2, 0, .2].forEach(y => { const t = cyl(.025, .025, 1.42, COPPER()); t.rotation.z = Math.PI / 2; evap.add(at(t, 0, Y0 + Hh / 2 + y, .55)); });
  // البلاور والموتور والمروحة الخلفية
  const blower = new THREE.Group(); blower.position.set(0, Y0 + .42, .28); root.add(blower);
  for(let i = 0; i < 16; i++){ const b = box(.9, .02, .06, M(0x4f8fd9, { r: .5 })); const a = new THREE.Group(); a.rotation.x = i * Math.PI / 8; b.position.y = .16; a.add(b); blower.add(a); }
  const motor = at(cyl(.12, .12, .25, M(0x3b4250, { m: .5 }), 24), 0, Y0 + .42, -.12); motor.rotation.x = Math.PI / 2; root.add(motor);
  const cfan = new THREE.Group(); cfan.position.set(0, Y0 + .45, -.48); root.add(cfan);
  for(let i = 0; i < 4; i++){ const b = box(.16, .34, .015, M(0x9aa3af, { m: .6 })); b.position.y = .19; b.rotation.y = .5; const a = new THREE.Group(); a.rotation.z = i * Math.PI / 2; a.add(b); cfan.add(a); }
  // الضاغط والمكثف والكابستور
  const comp = makeCompressor(.55); at(comp, .5, Y0, -.3); root.add(comp);
  const cond = new THREE.Group(); root.add(cond);
  const cFinM = M(0x8a7356, { m: .5, r: .5 });
  for(let x = -.75; x <= .76; x += .06) cond.add(at(box(.01, .8, .1, cFinM), x, Y0 + Hh / 2, -.65));
  const condTubeM = COPPER(); [-.25, -.08, .08, .25].forEach(y => { const t = cyl(.025, .025, 1.52, condTubeM); t.rotation.z = Math.PI / 2; cond.add(at(t, 0, Y0 + Hh / 2 + y, -.65)); });
  const capM = M(0xc9ced6, { m: .85, r: .3 });
  const cap = at(cyl(.08, .08, .22, capM, 24), -.55, Y0 + .13, -.3); root.add(cap);
  cap.add(at(textSprite('µF', '#1b1f26', .14), 0, 0, .085));
  const valve = new THREE.Group(); valve.position.set(-.25, Y0 + .25, -.35); root.add(valve);
  const vM = M(0xd9a441, { m: .85, r: .3 }); const vb = cyl(.06, .06, .3, vM, 20); vb.rotation.z = Math.PI / 2; valve.add(vb);
  valve.add(at(box(.12, .1, .1, M(0x2b3038)), 0, .1, 0));
  // الهوا الداخل والخارج
  const airCold = [], airHot = [];
  const mkAir = (arr, color, n) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .8, toneMapped: false }); const g = new THREE.SphereGeometry(.03, 8, 6); for(let i = 0; i < n; i++){ const s = new THREE.Mesh(g, m); s.userData = { x: (Math.random() - .5) * 1.2, y: Y0 + .55 + Math.random() * .3, p: Math.random() }; s.visible = false; root.add(s); arr.push(s); } return m; };
  const coldM = mkAir(airCold, 0x7fd3ff, 26), hotM = mkAir(airHot, 0xff8a3a, 22);
  // أدوات الصيانة
  const spray = new THREE.Group(); root.add(spray);
  spray.add(at(cyl(.07, .07, .3, M(0x4fa87a, { r: .45 }), 20), 0, .15, 0)); spray.add(at(box(.06, .08, .14, M(0x2b3038)), 0, .34, .04));
  const drops = []; const dropM = new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: .8 });
  for(let i = 0; i < 18; i++){ const d = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 5), dropM); d.userData = { p: Math.random(), s: Math.random() }; d.visible = false; root.add(d); drops.push(d); }
  part('front', front, V(-.5, Y0 + Hh + .12, .75), 'الوش الأمامي', 'بيتفك عشان نوصل للفلتر والمبخر.');
  part('filter', filter, V(-.55, .3, .02), 'الفلتر', 'بيمسك التراب قبل المبخر. دوس عليه عشان تطلّعه.');
  part('evaporator', evap, V(.55, Y0 + Hh + .02, .55), 'المبخر (جوه الأوضة)', 'بيبرد الهوا اللي داخل الأوضة.');
  part('blower', blower, V(.48, .1, 0), 'البلاور', 'بيسحب هوا الأوضة على المبخر ويرجعه بارد.');
  part('condenser', cond, V(-.55, Y0 + Hh + .02, -.65), 'المكثف (برا)', 'بيطلّع الحرارة برا البيت.');
  part('compressor', comp, V(0, .95, 0), 'الضاغط', 'قلب الدائرة.');
  part('capacitor', cap, V(0, .17, 0), 'الكابستور', 'بيساعد الضاغط والموتور يبدأوا.');
  if(mode === 'fault') part('valve', valve, V(0, .18, 0), 'البلف العاكس', 'في الموديلات بارد/ساخن، بيعكس اتجاه الفريون.');
  const st = { power: 1, frontOff: 0, filterOut: 0, step: 0, fault: '' };
  let dF = 1, dE = 1, dC = 1, fOff = 0, filUp = 0, outT = 27, rot = 0, frostE = 0, condHot = 0, tripT = 0;
  ctx.parts.filter.tap = () => { if(!st.frontOff && mode === 'maint') return 'فك الوش الأمامي الأول.'; st.filterOut = st.filterOut ? 0 : 1; return st.filterOut ? 'الفلتر طلع.' : 'الفلتر رجع مكانه.'; };
  ctx.parts.front.tap = () => { st.frontOff = st.frontOff ? 0 : 1; return st.frontOff ? 'الوش اتفك.' : 'الوش اتركّب.'; };
  ctx.parts.compressor.tap = () => { st.power = st.power ? 0 : 1; return st.power ? 'الجهاز اشتغل.' : 'الجهاز وقف.'; };
  const M_STEPS = [
    { title: 'التكييف الشباك', text: 'الجزء اللي جوه الأوضة فيه الفلتر والمبخر والبلاور، والجزء اللي برا فيه الضاغط والمكثف ومروحته. النقط الزرقا هوا بارد داخل الأوضة، والبرتقالي هوا سخن خارج برا.', s: { power: 1, frontOff: 0, filterOut: 0, dirt: 1 } },
    { title: 'فصل الكهربا وفك الوش', text: 'افصل الفيشة من الكهربا قبل أي حاجة. فك الوش الأمامي من المسامير أو المشابك اللي تحته.', focus: 'front', s: { power: 0, frontOff: 1, filterOut: 0, dirt: 1 } },
    { title: 'تنظيف الفلتر', text: 'طلّع الفلتر واغسله بمية فاترة وصابون خفيف، وسيبه ينشف في الضل. الفلتر المسدود بيقلّل الهوا ويخلّي المبخر يتلج. دوس على الفلتر عشان تطلّعه وترجّعه.', focus: 'filter', s: { power: 0, frontOff: 1, filterOut: 1, dirt: 1, clean: 'filter' } },
    { title: 'تنظيف المبخر', text: 'رش منظف الكويلات على زعانف المبخر، واستنى شوية، وبعدين اشطفه بمية خفيفة. خلي بالك من الزعانف، لو اتطبقت عدّلها بمشط الزعانف.', focus: 'evaporator', s: { power: 0, frontOff: 1, filterOut: 1, dirt: 2, clean: 'evap' } },
    { title: 'تنظيف المكثف', text: 'من ورا، نضّف المكثف بالفرشة والمية من جوه لبرا عكس اتجاه الهوا. المكثف المتسخ بيرفع ضغط الطرد ويضعف التبريد.', focus: 'condenser', s: { power: 0, frontOff: 1, filterOut: 0, dirt: 3, clean: 'cond' } },
    { title: 'التجميع والتشغيل', text: 'ركّب الفلتر والوش وشغّل الجهاز. اتأكد إن الهوا الخارج بارد (حوالي 12 درجة)، وإن الجهاز مفيش فيه صوت غريب، وإن مية التكثيف بتنزل من الصرف.', focus: 'blower', s: { power: 1, frontOff: 0, filterOut: 0, dirt: 4 } }
  ];
  const F_STEPS = [
    { title: 'الجهاز السليم', text: 'الهوا الخارج حوالي 12 درجة والهوا قوي، والضاغط والمراوح شغالين. في كل خطوة جاية عطل: لاحظ اللي اتغيّر وفكّر في السبب.', s: { fault: '' } },
    { title: 'الفلتر مسدود', text: 'الهوا ضعيف جدًا، والمبخر بيتلج من قلة الهوا، والتبريد بيقل مع الوقت. الحل: تنظيف الفلتر والمبخر.', focus: 'filter', s: { fault: 'filter' } },
    { title: 'الكابستور تالف', text: 'الضاغط بيزن ومش بيبدأ، والأوفرلوود بيفصل كل شوية، والهوا مش بيبرد. افصل الكهربا وفرّغ شحنة الكابستور، وقيسه بالآفوميتر على الميكروفاراد: لو أقل من المكتوب عليه بكتير أو منفوخ، يتغيّر.', focus: 'capacitor', s: { fault: 'cap' } },
    { title: 'نقص الفريون', text: 'الضاغط شغال والهوا قوي، بس الهوا الخارج مش بارد كفاية (حوالي 20 درجة)، وجزء من المبخر بس هو اللي بارد. ضغط السحب واطي. لازم نكشف على التسريب ونصلّحه ونشحن.', focus: 'evaporator', s: { fault: 'leak' } },
    { title: 'المكثف متسخ أو مروحته ضعيفة', text: 'الهوا الخارج من ورا ضعيف والمكثف سخن جدًا، وضغط الطرد عالي، والضاغط بيفصل من الأوفرلوود ويرجع. نضّف المكثف واختبر موتور المروحة وكابستوره.', focus: 'condenser', s: { fault: 'cond' } },
    { title: 'البلف العاكس واقف', text: 'في الموديلات اللي بتبرد وتسخن: الجهاز على التبريد بس بيطلع هوا سخن. البلف العاكس لازق على وضع التسخين. قيس الكهربا على ملفه (لازم تكون صفر في التبريد في أغلب الموديلات)، ولو الملف سليم يبقى البلف نفسه محتاج تغيير.', focus: 'valve', s: { fault: 'valve' } }
  ];
  return {
    ...ctx, view: V(.9, .7, 1.4), sway: true,
    hint: mode === 'maint' ? 'دوس على الوش أو الفلتر · صباعين للتقريب' : 'كل خطوة فيها عطل · صباعين للتقريب',
    steps: mode === 'maint' ? M_STEPS : F_STEPS,
    apply(s){
      if(mode === 'maint'){ st.power = s.power; st.frontOff = s.frontOff; st.filterOut = s.filterOut; st.clean = s.clean || ''; dF = s.dirt <= 1 ? 1 : 0; dE = s.dirt <= 2 ? 1 : 0; dC = s.dirt <= 3 ? 1 : 0; if(s.dirt === 4){ dF = dE = dC = 0; } }
      else { st.fault = s.fault; st.power = 1; st.frontOff = 0; st.filterOut = 0; dF = s.fault === 'filter' ? 1.3 : 0; dE = s.fault === 'filter' ? .6 : 0; dC = s.fault === 'cond' ? 1.3 : 0; tripT = 0; }
    },
    update(dt){
      const F = st.fault || '', t = performance.now() / 1000;
      if(st.clean === 'filter' && filUp > .9) dF = Math.max(0, dF - dt * .35);
      if(st.clean === 'evap') dE = Math.max(0, dE - dt * .3);
      if(st.clean === 'cond') dC = Math.max(0, dC - dt * .3);
      filterM.color.copy(clean).lerp(dust, Math.min(1, dF)); evFinM.color.copy(C(0xb9c3cf)).lerp(dust, Math.min(1, dE)); cFinM.color.copy(C(0xb9c3cf)).lerp(dust, Math.min(1, dC));
      fOff = ease(fOff, st.frontOff ? 1 : 0, dt, 3); front.position.set(0, -.2 * fOff, .6 * fOff); front.visible = fOff < .97;
      filUp = ease(filUp, st.filterOut ? 1 : 0, dt, 3); filter.position.set(0, Y0 + Hh / 2 + .95 * filUp, .66 + .25 * filUp);
      tripT = Math.max(0, tripT - dt);
      if(F === 'cond' && tripT <= 0 && Math.sin(t * .8) > .95) tripT = 2;
      const compOn = st.power && F !== 'cap' && tripT <= 0;
      const fanOn = st.power;
      const air = !fanOn ? 0 : F === 'filter' ? .3 : 1;
      const tgt = !st.power ? 27 : F === 'cap' ? 27 : F === 'leak' ? 20 : F === 'filter' ? 16 : F === 'cond' ? (tripT > 0 ? 24 : 18) : F === 'valve' ? 38 : 12;
      outT = ease(outT, compOn || F === 'cap' ? tgt : 27, dt, .6); outP.setText(`${Math.round(outT)}°C`);
      rot += dt * 10 * (fanOn ? 1 : 0); blower.rotation.x = rot * (F === 'filter' ? 1 : 1); cfan.rotation.z = -rot * (F === 'cond' ? .35 : 1);
      comp.position.x = .5 + (compOn ? Math.sin(t * 90) * .003 : F === 'cap' && st.power ? Math.sin(t * 140) * .005 : 0);
      frostE = ease(frostE, F === 'filter' ? 1 : F === 'leak' ? .25 : 0, dt, .8);
      baseE(evFinM).setRGB(.75, .88, 1).multiplyScalar(frostE * .5); evFinM.userData.baseI = 1;
      condHot = ease(condHot, F === 'cond' && compOn ? 1 : 0, dt, 1);
      baseE(condTubeM).setRGB(1, .3, .08).multiplyScalar(condHot * .8); condTubeM.userData.baseI = 1;
      baseE(capM).setRGB(1, .5, .1).multiplyScalar(F === 'cap' ? .35 + .25 * Math.sin(t * 6) : 0); capM.userData.baseI = 1;
      cap.scale.set(1, F === 'cap' ? 1.12 : 1, 1);
      coldM.color.setHex(F === 'valve' ? 0xff8a3a : 0x7fd3ff);
      airCold.forEach(s => { s.visible = air > 0 && !st.frontOff; if(!s.visible) return; s.userData.p = (s.userData.p + dt * .7 * air) % 1; const p = s.userData.p; s.position.set(s.userData.x, s.userData.y, .76 + p * .9); s.scale.setScalar(air * (1 - p * .5)); });
      const hotAir = compOn && st.power ? (F === 'cond' ? .35 : 1) : 0;
      airHot.forEach(s => { s.visible = hotAir > 0; if(!s.visible) return; s.userData.p = (s.userData.p + dt * .7 * hotAir) % 1; const p = s.userData.p; s.position.set(s.userData.x, s.userData.y - .1, -.72 - p * .8); s.scale.setScalar(hotAir * (1 - p * .5)); });
      const spraying = st.clean === 'evap' || st.clean === 'cond' || (st.clean === 'filter' && filUp > .9);
      spray.visible = spraying;
      const target = st.clean === 'evap' ? V(.95, .3, .85) : st.clean === 'cond' ? V(-.95, .3, -1.0) : V(.9, .9, 1.1);
      spray.position.lerp(target, Math.min(1, dt * 3));
      const aim = st.clean === 'evap' ? V(0, Y0 + .45, .55) : st.clean === 'cond' ? V(0, Y0 + .45, -.65) : filter.position.clone();
      drops.forEach(d => { d.visible = spraying; if(!spraying) return; d.userData.p = (d.userData.p + dt * 1.4) % 1; const src = spray.position.clone().add(V(0, .34, 0)); const end = aim.clone().add(V((d.userData.s - .5) * 1.0, (d.userData.s - .5) * .5, 0)); d.position.copy(src).lerp(end, d.userData.p); });
    }
  };
}

const MODELS = [
  { id: 'series', name: 'دائرة التوالي', from: 'برنامج التبريد والتكييف', build: buildSeries },
  { id: 'parallel', name: 'دائرة التوازي', from: 'برنامج التبريد والتكييف', build: buildParallel },
  { id: 'cycle', name: 'دائرة التبريد', from: 'برنامج التبريد والتكييف', build: buildCycle },
  { id: 'evac', name: 'التفريغ والشحن', from: 'برنامج التبريد والتكييف', build: buildEvacCharge },
  { id: 'brazing', name: 'لحام النحاس', from: 'برنامج التبريد والتكييف', build: buildBrazing },
  { id: 'elecparts', name: 'الأجزاء الكهربية', from: 'برنامج التبريد والتكييف', build: buildElecParts },
  { id: 'fridgecircuit', name: 'دائرة الثلاجة الكهربية', from: 'برنامج التبريد والتكييف', build: buildFridgeCircuit },
  { id: 'pipeform', name: 'تشكيل المواسير', from: 'برنامج التبريد والتكييف', build: buildPipeForming },
  { id: 'swage', name: 'السوبدج والفلير', from: 'برنامج التبريد والتكييف', build: buildSwageFlare },
  { id: 'gasket', name: 'الكاوتش والمفصلات', from: 'برنامج التبريد والتكييف', build: buildDoorGasket },
  { id: 'oil', name: 'زيت الضاغط', from: 'برنامج التبريد والتكييف', build: buildCompressorOil },
  { id: 'leak', name: 'اختبار التسريب', from: 'برنامج التبريد والتكييف', build: buildLeakTest },
  { id: 'charge', name: 'علامات الشحنة', from: 'برنامج التبريد والتكييف', build: buildChargeCheck },
  { id: 'defrost', name: 'دائرة الإذابة', from: 'برنامج التبريد والتكييف', build: buildDefrost },
  { id: 'nofrost', name: 'النوفروست الأمريكي', from: 'برنامج التبريد والتكييف', build: () => buildNoFrostControl('us') },
  { id: 'nofrostjp', name: 'النوفروست الياباني', from: 'برنامج التبريد والتكييف', build: () => buildNoFrostControl('jp') },
  { id: 'faultelec', name: 'الأعطال الكهربية', from: 'برنامج التبريد والتكييف', build: () => buildFridgeCircuit({ faults: true }) },
  { id: 'faultmech', name: 'الأعطال الميكانيكية', from: 'برنامج التبريد والتكييف', build: () => buildCycle({ faults: true }) },
  { id: 'acmaint', name: 'صيانة التكييف الشباك', from: 'برنامج التبريد والتكييف', build: () => buildWindowAC('maint') },
  { id: 'acfault', name: 'أعطال التكييف الشباك', from: 'برنامج التبريد والتكييف', build: () => buildWindowAC('fault') },
  { id: 'engine', name: 'موتور العربية', from: 'مثال لبرنامج إصلاح السيارات', build: buildEngine }
];

/* ---------- التشغيل والواجهة ---------- */
let current = null, stepIdx = 0, selected = null, markers = {}, tagEl = null, fitInfo = null;

function disposeTree(o){
  o.traverse(n => {
    if(n.geometry) n.geometry.dispose();
    const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : [];
    ms.forEach(m => { if(m.map && !m.map.userData.shared) m.map.dispose(); m.dispose(); });
  });
}

// المسافة اللي تخلّي الموديل كله جوه الشاشة، حتى وهو بيلف حوالين نفسه
function fit(){
  if(!current) return;
  const box3 = new THREE.Box3(), tmp = new THREE.Box3();
  current.root.updateWorldMatrix(true, true);
  current.root.traverse(o => {
    if(!o.isMesh || o.userData.noFit) return;
    if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    box3.union(tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld));
  });
  const center = box3.getCenter(new THREE.Vector3());
  const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  const tv = Math.tan(vf / 2), th = Math.tan(hf / 2);
  const d = current.view.clone().normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d).normalize();
  const up = new THREE.Vector3().crossVectors(d, right).normalize();
  const corners = [];
  for(const x of [box3.min.x, box3.max.x]) for(const y of [box3.min.y, box3.max.y]) for(const z of [box3.min.z, box3.max.z]) corners.push(V(x, y, z).sub(center));
  let dist = 0;
  const angles = current.sway ? [-14, -7, 0, 7, 14] : Array.from({ length: 24 }, (_, i) => i * 15);
  for(const a of angles){
    const rot = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(a));
    for(const c0 of corners){
      const c = c0.clone().applyMatrix4(rot);
      const need = c.dot(d) + Math.max(Math.abs(c.dot(right)) / th, Math.abs(c.dot(up)) / tv);
      if(need > dist) dist = need;
    }
  }
  dist *= 1.04;
  fitInfo = { center: center.clone(), dist };
  camera.position.copy(center).add(d.clone().multiplyScalar(dist));
  controls.target.copy(center);
  controls.minDistance = dist * .3; controls.maxDistance = dist * 2;
  camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
  controls.update();
}

function resize(){
  const w = host.clientWidth || 600, h = host.clientHeight || 400;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}

function loadModel(id){
  const def = MODELS.find(m => m.id === id) || MODELS[0];
  if(current){ scene.remove(current.root); disposeTree(current.root); }
  current = def.build(); scene.add(current.root);
  current.root.traverse(o => {
    if(!o.isMesh) return;
    const tr = (Array.isArray(o.material) ? o.material : [o.material]).some(m => m.transparent || m.isMeshBasicMaterial);
    o.castShadow = !tr && !o.userData.receiver; o.receiveShadow = !tr;
  });
  current.objIndex = new Map(Object.entries(current.parts).map(([k, p]) => [p.obj, k]));
  $('hint').textContent = current.hint || 'اسحب للتدوير · صباعين للتقريب · دوس على رقم';
  showToast('');
  userMoved = false;
  document.querySelectorAll('#s3d-root .s3d-tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.id === def.id)));
  $('phase').hidden = !current.engine;
  $('engineBar').hidden = !current.engine;
  if(current.engineCtl){
    const ec = current.engineCtl;
    ec.onRun(on => { $('runBtn').textContent = on ? 'إيقاف الموتور' : 'تشغيل الموتور'; });
    $('rpm').textContent = `${ec.setSpeed(+$('speed').value)} لفة في الدقيقة`;
  }
  buildPartsUI(); buildDots();
  resize(); fit();
  controls.autoRotate = !reduceMotion && !current.sway;
  setStep(0);
}

function buildPartsUI(){
  markerLayer.innerHTML = ''; markers = {};
  const list = $('parts'); list.innerHTML = '';
  current.order.forEach((id, i) => {
    const p = current.parts[id];
    const mk = document.createElement('button'); mk.type = 'button'; mk.className = 's3d-mk'; mk.textContent = i + 1;
    mk.setAttribute('aria-label', p.label); mk.addEventListener('click', () => select(selected === id ? null : id));
    markerLayer.appendChild(mk); markers[id] = mk;
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="s3d-part" data-id="${id}"><span class="s3d-n">${i + 1}</span><span><b></b><span></span></span></button>`;
    li.querySelector('b').textContent = p.label; li.querySelector('span > span').textContent = p.desc;
    li.firstElementChild.addEventListener('click', () => select(selected === id ? null : id));
    list.appendChild(li);
  });
  tagEl = document.createElement('div'); tagEl.className = 's3d-mk-tag'; tagEl.hidden = true; markerLayer.appendChild(tagEl);
}

function select(id){
  selected = id;
  Object.entries(markers).forEach(([k, el]) => el.classList.toggle('s3d-sel', k === id));
  document.querySelectorAll('#s3d-root .s3d-part').forEach(b => b.classList.toggle('s3d-sel', b.dataset.id === id));
  tagEl.hidden = !id; if(id) tagEl.textContent = current.parts[id].label;
}

function buildDots(){
  const d = $('dots'); d.innerHTML = '';
  current.steps.forEach((s, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 's3d-dot';
    b.setAttribute('aria-label', `الخطوة ${i + 1}: ${s.title}`); b.addEventListener('click', () => setStep(i)); d.appendChild(b);
  });
}

function setStep(i){
  const steps = current.steps; stepIdx = Math.max(0, Math.min(steps.length - 1, i));
  const s = steps[stepIdx];
  $('stepNo').textContent = stepIdx + 1; $('stepCount').textContent = steps.length;
  $('stepTitle').textContent = s.title; $('stepText').textContent = s.text;
  $('prevBtn').disabled = stepIdx === 0; $('nextBtn').disabled = stepIdx === steps.length - 1;
  [...$('dots').children].forEach((b, k) => b.setAttribute('aria-current', String(k === stepIdx)));
  current.apply(s.s); select(s.focus || null);
}

$('prevBtn').addEventListener('click', () => setStep(stepIdx - 1));
$('runBtn').addEventListener('click', () => { const ec = current && current.engineCtl; if(ec) ec.setRunning(!ec.running); });
$('speed').addEventListener('input', () => { const ec = current && current.engineCtl; if(ec) $('rpm').textContent = `${ec.setSpeed(+$('speed').value)} لفة في الدقيقة`; });
$('nextBtn').addEventListener('click', () => setStep(stepIdx + 1));
$('resetBtn').addEventListener('click', () => { userMoved = false; current.root.rotation.y = 0; fit(); controls.autoRotate = !reduceMotion && !current.sway; });

// الدوس على قطعة في الموديل: لو ليها حركة (مفتاح، لمبة) تتنفّذ، غير كده تتحدد
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let downAt = null, toastTimer = null;
function showToast(msg){
  const el = $('toast'); el.textContent = msg; el.hidden = !msg;
  clearTimeout(toastTimer); if(msg) toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}
function wirePicking(){
renderer.domElement.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', e => {
  if(!downAt || !current) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y); downAt = null;
  if(moved > 8) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObject(current.root, true);
  for(const h of hits){
    let o = h.object;
    while(o && !current.objIndex.has(o)) o = o.parent;
    if(!o) continue;
    const id = current.objIndex.get(o), p = current.parts[id];
    select(id);
    if(p.tap) showToast(p.tap());
    return;
  }
});
}

const clock = new THREE.Clock();
const wp = new THREE.Vector3(), camDir = new THREE.Vector3();
function tick(){
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if(current){
    if(current.sway && !userMoved && !reduceMotion) current.root.rotation.y = Math.sin(t * .35) * .22;
    current.update(dt);
    for(const [id, p] of Object.entries(current.parts)){
      const h = id === selected ? .4 + .3 * Math.sin(t * 5) : 0;
      for(const m of p.mats){
        m.emissive.copy(m.userData.baseE); m.emissiveIntensity = m.userData.baseI;
        if(h > 0){ m.emissive.lerp(GOLD, h); m.emissiveIntensity = Math.max(m.userData.baseI, 1); }
      }
    }
  }
  controls.update();
  renderer.render(scene, camera);
  if(current){
    const w = host.clientWidth, h = host.clientHeight;
    camera.getWorldDirection(camDir);
    const centerDist = fitInfo ? camera.position.distanceTo(fitInfo.center) : 0;
    for(const [id, p] of Object.entries(current.parts)){
      const el = markers[id]; if(!el) continue;
      p.anchor.getWorldPosition(wp);
      const behind = camera.position.distanceTo(wp) > centerDist + .15;
      const pr = wp.clone().project(camera);
      const x = (pr.x * .5 + .5) * w, y = (-pr.y * .5 + .5) * h;
      let vis = true; for(let o = p.obj; o; o = o.parent) if(!o.visible){ vis = false; break; }
      const off = !vis || pr.z > 1 || x < -20 || x > w + 20 || y < -20 || y > h + 20;
      el.style.visibility = off ? 'hidden' : 'visible';
      el.style.transform = `translate(${x}px,${y}px)` + (id === selected ? ' scale(1.18)' : '');
      el.classList.toggle('s3d-back', behind && id !== selected);
      if(id === selected && tagEl){ tagEl.style.left = x + 'px'; tagEl.style.top = y + 'px'; tagEl.style.visibility = off ? 'hidden' : 'visible'; }
    }
  }
}

/* ---------- الربط مع المنصة ---------- */
// كل قالب قديم بقى ليه موديل جديد (أو أكتر). وبعض الوحدات ليها موديلات خاصة بيها.
const TEMPLATE_TO_MODELS = {
  'mech-circuit': ['cycle'], 'elec-parts': ['elecparts'], 'evac-charge': ['evac'], 'brazing': ['brazing'],
  'electrical-basic': ['series', 'parallel'], 'pipe-forming': ['pipeform'], 'swage-flare': ['swage'], 'door-gasket': ['gasket'],
  'elec-circuit-full': ['fridgecircuit'], 'compressor-oil': ['oil'], 'pressure-leak-test': ['leak'], 'charge-verification': ['charge'],
  'defrost-water': ['defrost'], 'control-board': ['nofrost', 'nofrostjp'], 'fault-diagnosis-elec': ['faultelec'],
  'fault-diagnosis-mech': ['faultmech'], 'maintenance-routine': ['acmaint'], 'fault-diagnosis-combo': ['acfault']
};
const TITLE_TO_MODELS = {
  'توصيل دوائر كهربية بسيطة (مع شروط الأمان من الأخطار الكهربية)': ['series'],
  'توصيلات كهربية ( التوالي – التوازي ) واجهزة القياس': ['series', 'parallel'],
  'توصيل الدائرة الكهربية للنظام الياباني للثلاجة النوفروست': ['nofrostjp', 'nofrost'],
  'توصيل الدائرة الكهربية للنظام الأمريكي للثلاجة النوفروست': ['nofrost', 'nofrostjp']
};
let lastFocus = null;
function buildTabs(ids){
  const t = $('tabs'); t.innerHTML = '';
  if(ids.length < 2) return;
  ids.forEach(id => {
    const def = MODELS.find(m => m.id === id); if(!def) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 's3d-tab'; b.setAttribute('role', 'tab'); b.dataset.id = id; b.textContent = def.name;
    b.addEventListener('click', () => loadModel(id)); t.appendChild(b);
  });
}
function open3D(templateKey, moduleTitle){
  const ids = (TITLE_TO_MODELS[moduleTitle] || TEMPLATE_TO_MODELS[templateKey] || []).filter(id => MODELS.some(m => m.id === id));
  if(!ids.length) return false;
  lastFocus = document.activeElement;
  root3d.hidden = false; document.documentElement.style.overflow = 'hidden';
  $('title').textContent = moduleTitle || MODELS.find(m => m.id === ids[0]).name;
  if(!initEngine()) return true;
  buildTabs(ids);
  clock.getDelta();
  loadModel(ids[0]);
  renderer.setAnimationLoop(tick);
  $('close').focus({ preventScroll: true });
  return true;
}
function close3D(){
  if(root3d.hidden) return;
  root3d.hidden = true; document.documentElement.style.overflow = '';
  if(renderer) renderer.setAnimationLoop(null);
  if(current){ scene.remove(current.root); disposeTree(current.root); current = null; }
  markerLayer.innerHTML = '';
  if(lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
$('close').addEventListener('click', close3D);
root3d.addEventListener('click', e => { if(e.target === root3d) close3D(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !root3d.hidden) close3D(); });
// بيستبدل عارض الـ 3D القديم في المنصة من غير ما يلمس كوده
window.__stceModule3DOpen = function(templateKey, moduleTitle){ try{ if(!open3D(templateKey, moduleTitle) && window.__stceModule3DOpenLegacy) window.__stceModule3DOpenLegacy(templateKey, moduleTitle); }catch(e){ console.error('stce3d_open_failed', e); } };
window.__stceModule3DClose = function(){ try{ close3D(); }catch(e){ console.error('stce3d_close_failed', e); } };
window.STCE3D = { open: open3D, close: close3D, models: () => MODELS.map(m => ({ id: m.id, name: m.name })) };
