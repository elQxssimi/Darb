/* Board styles for Darb. buildBoard(style, root, opts) builds a 10-unit-radius board into `root`
   and returns {tilePos, tileTop, goalY, centre, update(t,dt)}. Requires global THREE. */
(function(){
"use strict";
const GOAL = 50;
function rng(seed){ let s = seed>>>0; return ()=>((s = Math.imul(s,1664525)+1013904223>>>0)/4294967296); }
function canvasTex(size, draw, repeat, h){
  const c = document.createElement('canvas'); c.width = size; c.height = h||size;
  const g = c.getContext('2d'); draw(g, size, h||size);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
  if(repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t; }
function linTex(size, draw){ const t = canvasTex(size, draw); t.encoding = THREE.LinearEncoding; return t; }
function speckle(g, w, h, n, colors, rmax, r, a){
  for(let i=0;i<n;i++){ g.fillStyle = colors[(r()*colors.length)|0]; g.globalAlpha = (a||0.04)+r()*0.12; g.beginPath(); g.arc(r()*w, r()*h, 0.5+r()*rmax, 0, 7); g.fill(); }
  g.globalAlpha = 1; }

const R_OUT = 8.5, R_IN = 2.55, TURNS = 2.6;
function spiral(startAngle, rIn){
  rIn = rIn||R_IN; const thetaMax = TURNS*Math.PI*2, dense = [];
  for(let i=0;i<=3000;i++){ const t=i/3000, th=t*thetaMax, r=R_OUT-(R_OUT-rIn)*t; dense.push(new THREE.Vector3(r*Math.cos(th+startAngle), 0, r*Math.sin(th+startAngle))); }
  const cum=[0]; for(let i=1;i<dense.length;i++) cum.push(cum[i-1]+dense[i].distanceTo(dense[i-1]));
  const total = cum[cum.length-1], tilePos = [];
  for(let k=0;k<GOAL;k++){ const L = total*k/(GOAL-1); let j=1; while(j<cum.length-1 && cum[j]<L) j++;
    const a=dense[j-1], b=dense[j], f=(L-cum[j-1])/((cum[j]-cum[j-1])||1); tilePos.push(new THREE.Vector3().lerpVectors(a,b,f)); }
  return {dense, tilePos};
}
function tileLabel(g, S, k, sp, info, ink, font){
  g.fillStyle = ink; g.textAlign='center'; g.textBaseline='middle';
  if(k===0){ g.font = `800 26px ${font}`; g.fillText('START', S/2, S/2+2); }
  else if(sp){ g.font = `800 46px ${font}`; g.fillText(info.glyph, S/2, S/2-6); g.font = `800 16px ${font}`; g.fillText(String(k), S/2, S/2+34); }
  else { g.font = `800 44px ${font}`; g.fillText(String(k), S/2, S/2+3); }
}

/* ---------------- style A: Dilmun stone ---------------- */
function dilmun(root, P, o){
  const BT = 0.6, upd = [];
  const sand = canvasTex(1024,(g,S)=>{ const r=rng(41), cx=S/2; g.fillStyle='#b8955f'; g.fillRect(0,0,S,S);
    speckle(g,S,S,16000,['#a98d5f','#e2cca1','#b79a6a','#8f7650'],2.2,r,0.03);
    g.strokeStyle='rgba(90,64,34,.35)'; g.lineWidth=3;
    [0.49,0.47,0.445].forEach(f=>{ g.beginPath(); g.arc(cx,cx,S*f,0,7); g.stroke(); });
    // dotted-circle seal motifs in the outer band
    for(let i=0;i<36;i++){ const a=i/36*Math.PI*2, x=cx+Math.cos(a)*S*0.458, y=cx+Math.sin(a)*S*0.458;
      g.strokeStyle='rgba(80,56,30,.55)'; g.lineWidth=2.5; g.beginPath(); g.arc(x,y,7,0,7); g.stroke(); g.fillStyle='rgba(80,56,30,.6)'; g.beginPath(); g.arc(x,y,2.2,0,7); g.fill();
      if(i%2){ g.beginPath(); g.moveTo(x-12,y-11); g.lineTo(x+12,y-11); g.stroke(); } }
    // faint carved spiral field rings
    g.strokeStyle='rgba(120,90,50,.12)'; g.lineWidth=1.5; for(let rr=60; rr<S*0.43; rr+=22){ g.beginPath(); g.arc(cx,cx,rr,0,7); g.stroke(); }
  });
  const sideT = canvasTex(512,(g,S)=>{ const r=rng(42); g.fillStyle='#b39a6f'; g.fillRect(0,0,S,S); speckle(g,S,S,5000,['#8f7650','#d4bd92'],2,r,0.04);
    g.strokeStyle='rgba(80,56,30,.4)'; g.lineWidth=3; for(let y=60;y<S;y+=120){ g.beginPath(); g.moveTo(0,y); g.lineTo(S,y); g.stroke(); } });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(10,10.25,BT,128), [new THREE.MeshStandardMaterial({map:sideT, roughness:0.95}), new THREE.MeshStandardMaterial({map:sand, roughness:0.92}), new THREE.MeshStandardMaterial({color:0x5a4630})]);
  disc.position.y = BT/2; add(root, disc);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(10.05,0.28,12,160), new THREE.MeshStandardMaterial({map:sideT, roughness:0.9})); lip.rotation.x=Math.PI/2; lip.position.y=BT; add(root, lip);
  // turquoise-inlay channel
  const ch = P.dense.filter((_,i)=>i%10===0).map(p=>new THREE.Vector3(p.x, BT+0.005, p.z));
  add(root, new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ch), 700, 0.13, 6, false), new THREE.MeshStandardMaterial({color:0x1f7f86, roughness:0.25, metalness:0.1, emissive:0x082d30, emissiveIntensity:0.4}))).castShadow=false;
  const stoneSide = canvasTex(256,(g,S)=>{ const r=rng(43); g.fillStyle='#d8c39a'; g.fillRect(0,0,S,S); speckle(g,S,S,1500,['#a98d5f','#efe0bf'],2.4,r); });
  const sideMat = new THREE.MeshStandardMaterial({map:stoneSide, roughness:0.9});
  const geo = new THREE.CylinderGeometry(0.58,0.62,0.24,40);
  P.tilePos.forEach((p,k)=>{ const sp=o.specials[k], info=sp&&o.info[sp];
    const top = canvasTex(128,(g,S)=>{ const r=rng(300+k); g.fillStyle = sp? info.color : '#d6bf92'; g.fillRect(0,0,S,S); speckle(g,S,S,500,sp?['#000','#fff']:['#a98d5f','#fff3d6'],2.2,r);
      g.strokeStyle='rgba(70,50,25,.55)'; g.lineWidth=4; g.beginPath(); g.arc(S/2,S/2,S*0.43,0,7); g.stroke();
      for(let d=0; d<4; d++){ const a=d/4*Math.PI*2+Math.PI/4; g.fillStyle='rgba(70,50,25,.5)'; g.beginPath(); g.arc(S/2+Math.cos(a)*S*0.36, S/2+Math.sin(a)*S*0.36, 3, 0, 7); g.fill(); }
      tileLabel(g,S,k,sp,info, sp?'#1b130b':'#5a3d1c', 'Tajawal, sans-serif'); });
    const m = new THREE.Mesh(geo, [sideMat, new THREE.MeshStandardMaterial({map:top, roughness:0.75, emissive: sp?new THREE.Color(info.color):new THREE.Color(0), emissiveIntensity: sp?0.12:0}), sideMat]);
    m.position.set(p.x, BT+0.12, p.z); m.rotation.y = Math.PI - o.startAngle; add(root, m); });
  // centre: stepped temple with a spring pool
  const templeMat = new THREE.MeshStandardMaterial({map:stoneSide, color:0xe6d6b4, roughness:0.88});
  [[3.3,0.34],[2.6,0.34],[1.95,0.34]].forEach(([w,h],i)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w), templeMat); b.position.y=BT+h/2+i*h; b.rotation.y=Math.PI/4; add(root,b); });
  const topY = BT+0.34*3;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.62,0.06,40), new THREE.MeshStandardMaterial({color:0x2fb3c0, roughness:0.05, metalness:0.2, emissive:0x0b4a52, emissiveIntensity:0.6, transparent:true, opacity:0.9}));
  water.position.y = topY+0.0; add(root, water);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.18,40), new THREE.MeshStandardMaterial({color:0x2a9d9a, roughness:0.3, metalness:0.2}));
  seal.rotation.x = Math.PI/2; seal.position.y = topY+1.0; add(root, seal);
  [-1,1].forEach(s=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(0.22,1.2,0.22), templeMat); p.position.set(s*0.75, topY+0.6, s*0.75); add(root,p); });
  upd.push((t)=>{ seal.position.y = topY+1.0+Math.sin(t*1.3)*0.08; seal.rotation.z = t*0.4; });
  return {tileTop: BT+0.24, goalY: topY+0.05, update:(t,dt)=>upd.forEach(f=>f(t,dt))};
}

/* ---------------- style B: Pearl & brass ---------------- */
function pearl(root, P, o){
  const BT = 0.5, upd = [];
  const inlay = canvasTex(1024,(g,S)=>{ const r=rng(51), cx=S/2; g.fillStyle='#2a1a10'; g.fillRect(0,0,S,S);
    for(let y=0;y<S;y+=2){ g.fillStyle = r()>0.5?'#24160c':'#33200f'; g.globalAlpha=0.35; g.fillRect(0,y,S,1);} g.globalAlpha=1;
    // mother-of-pearl star lattice
    const step=74; for(let y=-step;y<S+step;y+=step) for(let x=-step;x<S+step;x+=step){ const px=x+((y/step)%2?step/2:0), py=y; const d=Math.hypot(px-cx,py-cx); if(d>S*0.43) continue;
      const grd=g.createLinearGradient(px-20,py-20,px+20,py+20); grd.addColorStop(0,'#f4efe6'); grd.addColorStop(0.5,'#d9e7ec'); grd.addColorStop(1,'#efd9e3');
      g.fillStyle=grd; g.globalAlpha=0.85; g.beginPath(); for(let a=0;a<16;a++){ const ang=a/16*Math.PI*2+Math.PI/8; const rr=a%2?9:20; g.lineTo(px+Math.cos(ang)*rr, py+Math.sin(ang)*rr);} g.closePath(); g.fill(); }
    g.globalAlpha=1; g.strokeStyle='#c9a24e'; g.lineWidth=5; [0.475,0.455].forEach(f=>{ g.beginPath(); g.arc(cx,cx,S*f,0,7); g.stroke(); });
    for(let i=0;i<64;i++){ const a=i/64*Math.PI*2; g.fillStyle=i%2?'#c9a24e':'#efe6dc'; g.beginPath(); g.arc(cx+Math.cos(a)*S*0.465, cx+Math.sin(a)*S*0.465, 4, 0, 7); g.fill(); }
  });
  const walnut = canvasTex(512,(g,S)=>{ const r=rng(52); g.fillStyle='#3a2415'; g.fillRect(0,0,S,S); for(let y=0;y<S;y+=2){ g.fillStyle=r()>0.5?'#2b1a0e':'#4a2f1a'; g.globalAlpha=0.4; g.fillRect(0,y,S,1);} g.globalAlpha=1; });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(10,10.1,BT,128), [new THREE.MeshStandardMaterial({map:walnut, roughness:0.35}), new THREE.MeshStandardMaterial({map:inlay, roughness:0.28, metalness:0.05}), new THREE.MeshStandardMaterial({color:0x1a0f08})]);
  disc.position.y = BT/2; add(root, disc);
  const brass = new THREE.MeshStandardMaterial({color:0xc9a24e, metalness:0.9, roughness:0.25});
  const rim = new THREE.Mesh(new THREE.TorusGeometry(10.05,0.2,12,160), brass); rim.rotation.x=Math.PI/2; rim.position.y=BT; add(root, rim);
  const rim2 = new THREE.Mesh(new THREE.TorusGeometry(10.05,0.08,8,160), brass); rim2.rotation.x=Math.PI/2; rim2.position.y=0.05; add(root, rim2);
  const ch = P.dense.filter((_,i)=>i%10===0).map(p=>new THREE.Vector3(p.x, BT+0.01, p.z));
  add(root, new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ch), 700, 0.07, 6, false), brass)).castShadow=false;
  const pearlMat = new THREE.MeshPhysicalMaterial({color:0xf3eee6, roughness:0.18, clearcoat:1, clearcoatRoughness:0.1});
  const geo = new THREE.CylinderGeometry(0.56,0.58,0.16,40), ring = new THREE.TorusGeometry(0.57,0.05,8,40);
  P.tilePos.forEach((p,k)=>{ const sp=o.specials[k], info=sp&&o.info[sp];
    const top = canvasTex(128,(g,S)=>{ const grd=g.createRadialGradient(S*0.35,S*0.3,4,S/2,S/2,S*0.6); grd.addColorStop(0, sp?'#ffffff':'#fbf8f2'); grd.addColorStop(0.6, sp?info.color:'#e8e3dc'); grd.addColorStop(1, sp?info.color:'#d8d6e6'); g.fillStyle=grd; g.fillRect(0,0,S,S);
      tileLabel(g,S,k,sp,info, sp?'#1b130b':'#6b5326', 'Tajawal, sans-serif'); });
    const m = new THREE.Mesh(geo, [pearlMat, new THREE.MeshPhysicalMaterial({map:top, roughness:0.2, clearcoat:1, clearcoatRoughness:0.08}), pearlMat]);
    m.position.set(p.x, BT+0.08, p.z); m.rotation.y = Math.PI - o.startAngle; add(root, m);
    const rr = new THREE.Mesh(ring, brass); rr.rotation.x=Math.PI/2; rr.position.set(p.x, BT+0.15, p.z); add(root, rr); });
  // centre: open shell holding a giant pearl
  const shellMat = new THREE.MeshPhysicalMaterial({color:0xe9ddd0, roughness:0.35, clearcoat:0.6, side:THREE.DoubleSide});
  function shell(){ const pts=[]; for(let i=0;i<=20;i++){ const t=i/20; pts.push(new THREE.Vector2(Math.sin(t*Math.PI/2)*1.9, (1-Math.cos(t*Math.PI/2))*0.55)); }
    const g = new THREE.LatheGeometry(pts, 48, 0, Math.PI); const pos=g.attributes.position; for(let i=0;i<pos.count;i++){ const x=pos.getX(i), z=pos.getZ(i); const a=Math.atan2(z,x); const rib=1+0.06*Math.cos(a*14); pos.setX(i,x*rib); pos.setZ(i,z*rib);} g.computeVertexNormals(); return new THREE.Mesh(g, shellMat); }
  const lower = shell(); lower.rotation.x = Math.PI; lower.position.y = BT+0.56; add(root, lower);
  const upper = shell(); upper.position.set(0, BT+0.56, -0.1); upper.rotation.x = -1.15; add(root, upper);
  const bigPearl = new THREE.Mesh(new THREE.SphereGeometry(0.7,48,32), new THREE.MeshPhysicalMaterial({color:0xfaf6f0, roughness:0.08, clearcoat:1, emissive:0x2a2420, emissiveIntensity:0.4}));
  bigPearl.position.y = BT+1.1; add(root, bigPearl);
  upd.push((t)=>{ bigPearl.position.y = BT+1.1+Math.sin(t*1.2)*0.05; });
  return {tileTop: BT+0.16, goalY: BT+0.6, update:(t,dt)=>upd.forEach(f=>f(t,dt))};
}

/* ---------------- style C: Holo-deck ---------------- */
function holo(root, P, o){
  const BT = 0.5, upd = [];
  const circuits = canvasTex(1024,(g,S)=>{ const r=rng(61), cx=S/2; g.fillStyle='#000000'; g.fillRect(0,0,S,S);
    g.lineCap='round';
    for(let i=0;i<140;i++){ let a=r()*Math.PI*2, rad=60+r()*S*0.38; let x=cx+Math.cos(a)*rad, y=cx+Math.sin(a)*rad; g.strokeStyle = r()>0.7?'#ff3fb0':'#16e0ff'; g.globalAlpha=0.35+r()*0.4; g.lineWidth=1.5+r()*1.5; g.beginPath(); g.moveTo(x,y);
      for(let s=0;s<4;s++){ const len=15+r()*45; if(r()>0.5){ x+= (r()>0.5?1:-1)*len; } else { y += (r()>0.5?1:-1)*len; } g.lineTo(x,y); } g.stroke(); g.beginPath(); g.arc(x,y,2.5,0,7); g.fillStyle=g.strokeStyle; g.fill(); }
    g.globalAlpha=0.9; g.strokeStyle='#16e0ff'; g.lineWidth=4; [0.485,0.47].forEach(f=>{ g.beginPath(); g.arc(cx,cx,S*f,0,7); g.stroke(); });
    for(let i=0;i<120;i++){ const a=i/120*Math.PI*2; g.globalAlpha = i%4===0?0.9:0.35; g.beginPath(); g.moveTo(cx+Math.cos(a)*S*0.45, cx+Math.sin(a)*S*0.45); g.lineTo(cx+Math.cos(a)*S*(i%4===0?0.43:0.44), cx+Math.sin(a)*S*(i%4===0?0.43:0.44)); g.stroke(); }
    g.globalAlpha=1; });
  const base = canvasTex(1024,(g,S)=>{ const r=rng(62); g.fillStyle='#0d1016'; g.fillRect(0,0,S,S); speckle(g,S,S,3000,['#1a2030','#050608'],2,r); });
  const top = new THREE.MeshStandardMaterial({map:base, emissiveMap:circuits, emissive:0xffffff, emissiveIntensity:0.9, roughness:0.15, metalness:0.6});
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(10,10.3,BT,128), [new THREE.MeshStandardMaterial({color:0x1b1f28, metalness:0.8, roughness:0.3}), top, new THREE.MeshStandardMaterial({color:0x07080b})]);
  disc.position.y = BT/2; add(root, disc);
  const neon = (c,i)=>new THREE.MeshStandardMaterial({color:c, emissive:c, emissiveIntensity:i||1.4, roughness:0.4});
  const rim = new THREE.Mesh(new THREE.TorusGeometry(10.15,0.12,10,160), neon(0x16e0ff,2)); rim.rotation.x=Math.PI/2; rim.position.y=BT*0.55; add(root, rim).castShadow=false;
  const ch = P.dense.filter((_,i)=>i%10===0).map(p=>new THREE.Vector3(p.x, BT+0.01, p.z));
  add(root, new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ch), 700, 0.05, 6, false), neon(0x16e0ff,1.6))).castShadow=false;
  const padSide = new THREE.MeshStandardMaterial({color:0x2a3040, metalness:0.85, roughness:0.3});
  const geo = new THREE.CylinderGeometry(0.62,0.66,0.18,6);
  P.tilePos.forEach((p,k)=>{ const sp=o.specials[k], info=sp&&o.info[sp]; const col = sp? info.neon : '#16e0ff';
    const face = canvasTex(128,(g,S)=>{ g.fillStyle='#0b0e14'; g.fillRect(0,0,S,S); g.strokeStyle=col; g.lineWidth=5; g.beginPath(); for(let a=0;a<6;a++){ const ang=a/6*Math.PI*2; g.lineTo(S/2+Math.cos(ang)*S*0.42, S/2+Math.sin(ang)*S*0.42);} g.closePath(); g.stroke();
      g.shadowColor=col; g.shadowBlur=10; tileLabel(g,S,k,sp,info, col, 'Tajawal, sans-serif'); });
    const m = new THREE.Mesh(geo, [padSide, new THREE.MeshStandardMaterial({map:face, emissiveMap:face, emissive:0xffffff, emissiveIntensity:0.9, roughness:0.3}), padSide]);
    m.position.set(p.x, BT+0.09, p.z); m.rotation.y = Math.PI - o.startAngle; add(root, m); });
  // centre: reactor core
  const coreBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.0,0.4,6), padSide); coreBase.position.y=BT+0.2; add(root, coreBase);
  const rings = []; [1.4,1.05,0.7].forEach((r,i)=>{ const m=new THREE.Mesh(new THREE.TorusGeometry(r,0.05,8,64), neon(i===1?0xff3fb0:0x16e0ff,2)); m.position.y=BT+1.2+i*0.25; add(root,m).castShadow=false; rings.push(m); });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45,0), new THREE.MeshStandardMaterial({color:0x9ff4ff, emissive:0x16e0ff, emissiveIntensity:1.2, wireframe:true}));
  core.position.y = BT+1.5; add(root, core).castShadow=false;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.6,3.4,24,1,true), new THREE.MeshBasicMaterial({color:0x16e0ff, transparent:true, opacity:0.16, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide}));
  beam.position.y = BT+1.9; add(root, beam).castShadow=false;
  upd.push((t)=>{ rings.forEach((m,i)=>{ m.rotation.x = Math.PI/2 + Math.sin(t*0.9+i)*0.5; m.rotation.y = t*(0.6+i*0.3); }); core.rotation.y = t*0.8; core.rotation.x = t*0.5; beam.material.opacity = 0.12+Math.sin(t*3)*0.05; });
  return {tileTop: BT+0.18, goalY: BT+0.42, update:(t,dt)=>upd.forEach(f=>f(t,dt))};
}

function add(root, m){ m.castShadow = true; m.receiveShadow = true; root.add(m); return m; }

window.DarbBoards = {
  styles: {dilmun, pearl, holo},
  build(style, root, opts){ const P = spiral(opts.startAngle, opts.rIn); const r = (this.styles[style]||dilmun)(root, P, opts); r.tilePos = P.tilePos; return r; }
};
})();
