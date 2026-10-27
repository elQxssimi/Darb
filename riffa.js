/* Riffa Clock Tower (stylised model from reference photos) + roundabout board style.
   window.DarbRiffa.tower() -> THREE.Group, shaft width 1 unit, ~3.3 units to the dome, flag above.
   Registers DarbBoards.styles.roundabout when boards.js is loaded. Requires global THREE. */
(function(){
"use strict";
function rng(seed){ let s = seed>>>0; return ()=>((s = Math.imul(s,1664525)+1013904223>>>0)/4294967296); }
function tex(size, draw, h, repeat){ const c=document.createElement('canvas'); c.width=size; c.height=h||size; draw(c.getContext('2d'), size, h||size);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; if(repeat){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(repeat[0],repeat[1]); } return t; }
function speckle(g,w,h,n,cols,rmax,r,a){ for(let i=0;i<n;i++){ g.fillStyle=cols[(r()*cols.length)|0]; g.globalAlpha=(a||0.04)+r()*0.1; g.beginPath(); g.arc(r()*w,r()*h,0.5+r()*rmax,0,7); g.fill(); } g.globalAlpha=1; }
const M = o=>new THREE.MeshStandardMaterial(o);

/* ---------- materials ---------- */
const sandTex = tex(256,(g,S)=>{ const r=rng(3); g.fillStyle='#ffffff'; g.fillRect(0,0,S,S); speckle(g,S,S,1800,['#d9cbb8','#fff6ea','#c9b8a2'],1.6,r,0.05); }, null, [2,2]);
const SAND = M({color:0xc99467, map:sandTex, roughness:0.85, envMapIntensity:0.55});
const SAND_D = M({color:0xad7d58, map:sandTex, roughness:0.9, envMapIntensity:0.55});
const SHADE = M({color:0x5a3f2c, roughness:1});
const COPPER = M({color:0x2f8a63, roughness:0.4, metalness:0.3});
const BLUE = M({color:0x2f5fb3, roughness:0.4, metalness:0.3});
const GOLD = M({color:0xd8ad55, roughness:0.3, metalness:0.85});

function box(w,h,d,mat,x,y,z,p){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; p.add(m); return m; }
/* pointed (two-centred) arch outline, base at y=0, width w, springing at h, apex h + w*0.62 */
function archShape(w, h, hole){ const s = new THREE.Shape(), r = w*0.9, hw = w/2;
  s.moveTo(-hw,0); s.lineTo(-hw,h);
  const steps=14; for(let i=1;i<=steps;i++){ const t=i/steps; const a=Math.acos((r-hw)/r)*(1-t) ; // left arc from springing to apex
    const cx = -hw + r, ang = Math.PI - Math.acos((r-hw)/r)*(1-t) - 0; }
  // simple pointed arch via quadratic curves
  s.quadraticCurveTo(-hw, h + w*0.42, 0, h + w*0.62); s.quadraticCurveTo(hw, h + w*0.42, hw, h); s.lineTo(hw,0); s.lineTo(-hw,0);
  if(hole) s.holes.push(hole); return s; }
function archPath(w,h){ const p = new THREE.Path(), hw=w/2; p.moveTo(-hw,0); p.lineTo(-hw,h); p.quadraticCurveTo(-hw,h+w*0.42,0,h+w*0.62); p.quadraticCurveTo(hw,h+w*0.42,hw,h); p.lineTo(hw,0); p.lineTo(-hw,0); return p; }
/* a flat moulded arch frame: outer arch minus inner arch, extruded `d` */
function archFrame(w,h,band,d,mat){ const outer = archShape(w,h); const ip = archPath(w-band*2, h); outer.holes.push(ip);
  const g = new THREE.ExtrudeGeometry(outer,{depth:d, bevelEnabled:false, curveSegments:10}); return new THREE.Mesh(g, mat); }
function archFill(w,h,mat){ return new THREE.Mesh(new THREE.ShapeGeometry(archShape(w,h),10), mat); }
/* place a decoration group on each of the four faces (face distance `half`) */
function onFaces(p, half, make, faces){ (faces||[0,1,2,3]).forEach(i=>{ const g = make(i); const a = i*Math.PI/2; g.position.set(Math.sin(a)*half, 0, Math.cos(a)*half); g.rotation.y = a; p.add(g); }); }

const clockFace = tex(256,(g,S)=>{ g.fillStyle='#fbfaf6'; g.beginPath(); g.arc(S/2,S/2,S/2,0,7); g.fill(); g.fillStyle='#1a1a1a'; g.font='700 30px Georgia, serif'; g.textAlign='center'; g.textBaseline='middle';
  for(let i=1;i<=12;i++){ const a=i/12*Math.PI*2-Math.PI/2; g.fillText(String(i), S/2+Math.cos(a)*S*0.38, S/2+Math.sin(a)*S*0.38); }
  g.strokeStyle='#1a1a1a'; g.lineWidth=7; g.lineCap='round'; g.beginPath(); g.moveTo(S/2,S/2); g.lineTo(S/2-S*0.2,S/2+S*0.02); g.stroke(); g.lineWidth=4; g.beginPath(); g.moveTo(S/2,S/2); g.lineTo(S/2+S*0.04,S/2+S*0.33); g.stroke(); });
const emblem = tex(128,(g,S)=>{ g.clearRect(0,0,S,S); g.fillStyle='#ffffff'; g.beginPath(); g.moveTo(S*0.12,S*0.1); g.lineTo(S*0.88,S*0.1); g.lineTo(S*0.88,S*0.55); g.quadraticCurveTo(S*0.88,S*0.85,S/2,S*0.95); g.quadraticCurveTo(S*0.12,S*0.85,S*0.12,S*0.55); g.closePath(); g.fill();
  g.fillStyle='#ce1126'; g.beginPath(); g.moveTo(S*0.12,S*0.42); for(let i=0;i<=5;i++){ g.lineTo(S*(0.12+i*0.152), i%2? S*0.3: S*0.42); } g.lineTo(S*0.88,S*0.55); g.quadraticCurveTo(S*0.88,S*0.85,S/2,S*0.95); g.quadraticCurveTo(S*0.12,S*0.85,S*0.12,S*0.55); g.closePath(); g.fill(); });
const kufic = tex(128,(g,S)=>{ g.fillStyle='#e6c9a6'; g.fillRect(0,0,S,S); g.fillStyle='#a6553a'; const u=S/9; // an original square-kufic-style maze panel
  const cells=['111111111','100000101','101110101','101000101','101011101','101010001','101010111','100010001','111111111'];
  cells.forEach((row,y)=>[...row].forEach((c,x)=>{ if(c==='1') g.fillRect(x*u+1,y*u+1,u-2,u-2); })); });
const flagTex = tex(256,(g,S,H)=>{ g.fillStyle='#ce1126'; g.fillRect(0,0,S,H); g.fillStyle='#ffffff'; g.beginPath(); g.moveTo(0,0); g.lineTo(S*0.25,0); for(let i=0;i<5;i++){ const y0=i*H/5; g.lineTo(S*0.36, y0+H/10); g.lineTo(S*0.25, y0+H/5); } g.lineTo(0,H); g.closePath(); g.fill(); }, 160);

function tower(){
  const T = new THREE.Group(); const W = 1.0;
  /* ---- level 0: arched base (0 → 1.35) ---- */
  const H0 = 1.35;
  box(W, H0, W, SAND, 0, H0/2, 0, T);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>box(0.12, H0, 0.12, SAND, a*(W/2), H0/2, b*(W/2), T)); // corner piers
  onFaces(T, W/2, i=>{ const g = new THREE.Group();
    const fill = archFill(0.56, 0.62, SHADE); fill.position.z = 0.004; g.add(fill);
    const f1 = archFrame(0.7, 0.62, 0.07, 0.05, SAND); g.add(f1);
    const f2 = archFrame(0.62, 0.62, 0.035, 0.08, SAND_D); g.add(f2);
    const inner = archFill(0.36, 0.42, M({color:0x4a3a2e, roughness:1})); inner.position.set(0,0,0.006); g.add(inner);
    if(i===0){ // front porch with its own pointed arch and oculus above
      box(0.5, 0.5, 0.24, SAND, 0, 0.25, 0.12, g); const pf = archFill(0.26, 0.2, M({color:0x3a2c22})); pf.position.set(0,0,0.241); g.add(pf);
      const crest = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(0.5,0.0),{depth:0.24,bevelEnabled:false}), SAND); crest.position.set(0,0.5,0); g.add(crest);
      const oc = new THREE.Mesh(new THREE.CircleGeometry(0.035,20), SHADE); oc.position.set(0.16, 0.95, 0.06); g.add(oc); }
    return g; });
  // side wings (lower flanking blocks)
  [-1,1].forEach(s=>{ const g = new THREE.Group(); box(0.3, 0.62, 0.86, SAND, 0, 0.31, 0, g);
    const a = archFill(0.2,0.3,SHADE); a.position.set(0,0,0.431); g.add(a); const a2 = archFill(0.2,0.3,SHADE); a2.position.set(0,0,-0.431); a2.rotation.y=Math.PI; g.add(a2);
    const a3 = archFill(0.36,0.28,SHADE); a3.rotation.y = s*Math.PI/2; a3.position.set(s*0.151,0,0); g.add(a3);
    g.position.set(s*(W/2+0.15), 0, 0); T.add(g); });
  /* ---- level 1: loggia with columns and blue railing (1.35 → 1.78) ---- */
  const L0 = H0, LH = 0.43;
  box(W+0.06, 0.04, W+0.06, SAND, 0, L0+0.02, 0, T);
  box(W-0.2, LH, W-0.2, M({color:0x5a4636, roughness:1}), 0, L0+LH/2, 0, T); // shadowed interior
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>box(0.14, LH, 0.14, SAND, a*(W/2-0.07), L0+LH/2, b*(W/2-0.07), T));
  onFaces(T, W/2-0.03, ()=>{ const g = new THREE.Group();
    for(let k=1;k<=5;k++){ const x = -0.36 + k*0.12; box(0.045, LH, 0.05, SAND, x, L0+LH/2, 0, g); }
    for(let k=0;k<6;k++){ const x = -0.36 + 0.06 + k*0.12; // railing bay with a circle motif
      box(0.1, 0.012, 0.012, BLUE, x, L0+0.13, 0.01, g); box(0.1, 0.012, 0.012, BLUE, x, L0+0.04, 0.01, g);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03,0.006,6,16), BLUE); ring.position.set(x, L0+0.085, 0.012); g.add(ring);
      const top = archFill(0.08, 0.06, SHADE); top.position.set(x, L0+LH-0.14, 0.03); g.add(top); }
    box(W-0.04, 0.07, 0.04, SAND, 0, L0+LH-0.035, 0.0, g);
    return g; });
  /* ---- level 2: clock band with arched gables, copper half-domes, stepped corbels (1.78 → 2.33) ---- */
  const C0 = L0+LH, CH = 0.55;
  box(W+0.14, 0.05, W+0.14, SAND, 0, C0+0.025, 0, T);
  box(W, CH, W, SAND, 0, C0+CH/2, 0, T);
  // stepped flares on the corners
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{ for(let k=0;k<4;k++){ const out=0.035*(k+1); box(out, 0.06, 0.12, SAND, a*(W/2+out/2), C0+0.1+k*0.06, b*(W/2-0.06), T); box(0.12, 0.06, out, SAND, a*(W/2-0.06), C0+0.1+k*0.06, b*(W/2+out/2), T); } });
  onFaces(T, W/2, i=>{ const g = new THREE.Group();
    // semicircular gable rising above the band
    const gs = new THREE.Shape(); gs.moveTo(-0.27,0); gs.lineTo(-0.27,0.0); gs.absarc(0,0,0.27,Math.PI,0,true); gs.lineTo(0.27,0); gs.lineTo(-0.27,0);
    const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(gs,{depth:0.12,bevelEnabled:false,curveSegments:24}), SAND); gable.position.set(0, C0+CH-0.06, -0.1); g.add(gable);
    const moul = new THREE.Mesh(new THREE.TorusGeometry(0.235,0.018,8,40,Math.PI), SAND_D); moul.position.set(0, C0+CH-0.06, 0.03); g.add(moul);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.15,40), M({map:clockFace, roughness:0.4})); face.position.set(0, C0+CH-0.07, 0.035); g.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.152,0.014,8,40), GOLD); rim.position.set(0, C0+CH-0.07, 0.036); g.add(rim);
    // diamond cluster of cubes (muqarnas-like) under the clock
    [[0,0],[-1,1],[1,1],[0,2],[-2,2],[2,2],[-1,3],[1,3],[0,4]].forEach(([x,y])=>box(0.045,0.045,0.045, SAND, x*0.026, C0+0.27 - y*0.042, 0.03, g));
    return g; });
  // copper quarter-domes between gables
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{ const d = new THREE.Mesh(new THREE.SphereGeometry(0.17,16,10,0,Math.PI*2,0,Math.PI/2), COPPER); d.position.set(a*(W/2-0.12), C0+CH, b*(W/2-0.12)); d.castShadow=true; T.add(d); });
  /* ---- level 3: narrower shaft with emblem and kufic panels (2.33 → 2.78) ---- */
  const U0 = C0+CH, UW = 0.63, UH = 0.62;
  box(UW+0.08, 0.04, UW+0.08, SAND, 0, U0+0.02, 0, T);
  for(let k=0;k<6;k++){ [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{ const off=-0.25+k*0.1; box(0.035,0.035,0.035,SAND, a? a*(UW/2+0.06) : off, U0+0.06, b? b*(UW/2+0.06) : off, T); }); } // dentil row
  box(UW, UH, UW, SAND, 0, U0+UH/2, 0, T);
  onFaces(T, UW/2+0.002, ()=>{ const g = new THREE.Group();
    const e = new THREE.Mesh(new THREE.PlaneGeometry(0.11,0.13), M({map:emblem, transparent:true, roughness:0.5})); e.position.set(0, U0+UH-0.1, 0); g.add(e);
    const k = new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.2), M({map:kufic, roughness:0.7})); k.position.set(0, U0+0.33, 0); g.add(k); return g; });
  /* ---- level 4: drum with balcony and pointed openings (2.78 → 3.2) ---- */
  const D0 = U0+UH;
  const balc = new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.32,0.04,32), SAND); balc.position.y = D0+0.02; T.add(balc);
  const railTop = new THREE.Mesh(new THREE.TorusGeometry(0.335,0.008,6,40), BLUE); railTop.rotation.x=Math.PI/2; railTop.position.y = D0+0.1; T.add(railTop);
  for(let k=0;k<20;k++){ const a=k/20*Math.PI*2; const post=new THREE.Mesh(new THREE.BoxGeometry(0.008,0.08,0.008), BLUE); post.position.set(Math.cos(a)*0.335, D0+0.06, Math.sin(a)*0.335); T.add(post); }
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.26,0.42,32), SAND); drum.position.y = D0+0.25; drum.castShadow=true; T.add(drum);
  for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; const op = archFill(0.08,0.12,SHADE); op.position.set(Math.sin(a)*0.252, D0+0.18, Math.cos(a)*0.252); op.rotation.y=a; T.add(op); }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.26,0.04,32), SAND); cap.position.y = D0+0.48; T.add(cap);
  /* ---- level 5: green ribbed crown (3.2 → 3.45) ---- */
  const crownPts=[]; for(let i=0;i<=16;i++){ const t=i/16; crownPts.push(new THREE.Vector2(0.27*Math.sin(Math.PI*(0.15+t*0.85))*(1-t*0.35)+0.02, t*0.24)); }
  const cg = new THREE.LatheGeometry(crownPts, 48); const cp = cg.attributes.position; for(let i=0;i<cp.count;i++){ const x=cp.getX(i), z=cp.getZ(i); const a=Math.atan2(z,x); const k=1+0.08*Math.abs(Math.cos(a*8)); cp.setX(i,x*k); cp.setZ(i,z*k); } cg.computeVertexNormals();
  const crown = new THREE.Mesh(cg, COPPER); crown.position.y = D0+0.5; crown.castShadow=true; T.add(crown);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.03,10,8), GOLD); finial.position.y = D0+0.76; T.add(finial);
  /* ---- flag ---- */
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.01,1.0,8), M({color:0xeeeeee, metalness:0.6, roughness:0.3})); pole.position.y = D0+1.26; T.add(pole);
  const fg = new THREE.PlaneGeometry(0.42,0.26,12,4); fg.translate(0.21,0,0);
  const flag = new THREE.Mesh(fg, M({map:flagTex, side:THREE.DoubleSide, roughness:0.8})); flag.position.set(0.008, D0+1.62, 0); T.add(flag);
  const base = fg.attributes.position.array.slice();
  T.userData.update = (t)=>{ const p = fg.attributes.position; for(let i=0;i<p.count;i++){ const x=base[i*3]; p.setZ(i, Math.sin(x*14 - t*5)*0.03*(x/0.42)); } p.needsUpdate=true; fg.computeVertexNormals(); };
  T.traverse(o=>{ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
  return T;
}
/* free-standing broken arches that ring the tower */
function archFragment(){ const s = new THREE.Shape(); s.moveTo(0,0); s.lineTo(0.16,0); s.lineTo(0.16,0.58); s.quadraticCurveTo(0.2,0.78,0.42,0.86); s.lineTo(0.42,0.95); s.lineTo(0,0.95); s.lineTo(0,0);
  const g = new THREE.ExtrudeGeometry(s,{depth:0.14, bevelEnabled:false, curveSegments:12}); g.translate(0,0,-0.07);
  const grp = new THREE.Group(); const m = new THREE.Mesh(g, SAND); m.castShadow=m.receiveShadow=true; grp.add(m);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.08,0.24), SAND_D); plinth.position.set(0.08,0.04,0); grp.add(plinth); return grp; }

/* a mirrored pair of broken arches in front of each of the four doors (tower-local units) */
function addGateways(T, d, spread){ d = d||1.45; spread = spread||0.58;
  for(let i=0;i<4;i++){ const a = i*Math.PI/2, n = new THREE.Vector3(Math.sin(a),0,Math.cos(a)), t = new THREE.Vector3(Math.cos(a),0,-Math.sin(a));
    [-1,1].forEach(side=>{ const f = archFragment(); f.scale.setScalar(1.0); const pos = n.clone().multiplyScalar(d).add(t.clone().multiplyScalar(side*spread));
      f.position.copy(pos); f.rotation.y = side<0 ? a : a+Math.PI; T.add(f); }); } }

/* ---------- roundabout board ---------- */
function roundabout(root, P, o){
  const R = 10, BT = 0.5, upd = [], S = 2048;
  const w2c = (x,z)=>[ (z/(2*R)+0.5)*S, (0.5 - x/(2*R))*S ];
  const top = tex(S,(g)=>{ const r=rng(77);
    g.fillStyle='#4f8a3a'; g.fillRect(0,0,S,S); speckle(g,S,S,30000,['#3e7a2e','#62a046','#5a9640','#447f32'],2.5,r,0.05);
    // entry roads (four), drawn first so the spiral sits on top
    const roadW = 1.5*102;
    for(let k=0;k<4;k++){ const a = o.startAngle + Math.PI/4 + k*Math.PI/2; const [x0,y0]=w2c(Math.cos(a)*7.6, Math.sin(a)*7.6), [x1,y1]=w2c(Math.cos(a)*10.5, Math.sin(a)*10.5);
      g.strokeStyle='#d8c9a4'; g.lineWidth=roadW+30; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke();
      g.strokeStyle='#3b3d40'; g.lineWidth=roadW; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke();
      // zebra crossing
      const nx=Math.cos(a), ny=Math.sin(a); for(let s=-5;s<=5;s++){ const off=s*12; const cx=Math.cos(a)*9.2, cz=Math.sin(a)*9.2; const [px,py]=w2c(cx - ny*off/102, cz + nx*off/102); g.save(); g.translate(px,py); g.rotate(Math.atan2(y1-y0,x1-x0)); g.fillStyle='#f4f1e8'; g.fillRect(-22,-5,44,8); g.restore(); }
      // centre dashes
      g.strokeStyle='#f2c94c'; g.lineWidth=5; g.setLineDash([26,18]); g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); g.setLineDash([]); }
    // spiral road: verge, kerb stripes, asphalt, lane line
    const pts = P.dense.filter((_,i)=>i%6===0).map(p=>w2c(p.x,p.z));
    const trace = ()=>{ g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); };
    g.lineJoin='round'; g.lineCap='round';
    trace(); g.strokeStyle='#d8c9a4'; g.lineWidth=1.62*102; g.stroke();
    trace(); g.strokeStyle='#1d1d1d'; g.lineWidth=1.46*102; g.setLineDash([28,28]); g.stroke(); g.setLineDash([]);
    trace(); g.strokeStyle='#f2c94c'; g.lineWidth=1.46*102; g.setLineDash([28,28]); g.lineDashOffset=28; g.stroke(); g.setLineDash([]); g.lineDashOffset=0;
    trace(); g.strokeStyle='#3b3d40'; g.lineWidth=1.32*102; g.stroke();
    speckle(g,S,S,0,[],1,r);
    trace(); g.strokeStyle='rgba(240,240,232,.85)'; g.lineWidth=4; g.setLineDash([30,26]); g.stroke(); g.setLineDash([]);
    // flower beds along the grass medians
    for(let i=0;i<900;i++){ const t=r(); const th=t*2.6*Math.PI*2, rr=8.5-(8.5-o.rIn)*t + 1.05 + (r()-.5)*0.35; if(rr>9.6) continue; const [x,y]=w2c(rr*Math.cos(th+o.startAngle), rr*Math.sin(th+o.startAngle));
      g.fillStyle=['#e5486b','#f7a1b8','#ffffff','#f2c94c'][(r()*4)|0]; g.globalAlpha=0.9; g.beginPath(); g.arc(x,y,3+r()*3,0,7); g.fill(); }
    g.globalAlpha=1;
    // central island: kerb ring, flowers, paving
    const [cx,cy]=w2c(0,0); const isl=(o.rIn-0.8)*102;
    g.fillStyle='#d8c9a4'; g.beginPath(); g.arc(cx,cy,isl+16,0,7); g.fill();
    for(let k=0;k<48;k++){ g.fillStyle=k%2?'#f2c94c':'#1d1d1d'; g.beginPath(); g.arc(cx,cy,isl+12,k/48*Math.PI*2,(k+1)/48*Math.PI*2); g.arc(cx,cy,isl,(k+1)/48*Math.PI*2,k/48*Math.PI*2,true); g.fill(); }
    g.fillStyle='#5a9a40'; g.beginPath(); g.arc(cx,cy,isl,0,7); g.fill();
    for(let i=0;i<500;i++){ const a=r()*Math.PI*2, rr=isl*(0.82+r()*0.14); g.fillStyle=['#e5486b','#f7a1b8','#ff6b6b'][(r()*3)|0]; g.beginPath(); g.arc(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr, 3+r()*2.5,0,7); g.fill(); }
    g.fillStyle='#cdb38e'; g.beginPath(); g.arc(cx,cy,isl*0.42,0,7); g.fill();
    g.strokeStyle='#b89a74'; g.lineWidth=3; for(let k=0;k<12;k++){ g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(k/12*Math.PI*2)*isl*0.42, cy+Math.sin(k/12*Math.PI*2)*isl*0.42); g.stroke(); }
    // outer pavement ring
    g.strokeStyle='#cbbfa4'; g.lineWidth=40; g.beginPath(); g.arc(cx,cy,S*0.485,0,7); g.stroke();
  });
  const side = tex(512,(g,s)=>{ for(let k=0;k<16;k++){ g.fillStyle=k%2?'#f2c94c':'#1d1d1d'; g.fillRect(k*s/16,0,s/16,s); } }, 64, [6,1]);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R+0.12, BT, 128), [M({map:side, roughness:0.6}), M({map:top, roughness:0.9}), M({color:0x2a2a2a})]);
  disc.position.y = BT/2; disc.castShadow = disc.receiveShadow = true; root.add(disc);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R+0.02,0.12,8,160), M({color:0xcfc4ad, roughness:0.8})); lip.rotation.x=Math.PI/2; lip.position.y=BT; root.add(lip);
  // tiles: low painted road roundels
  const geo = new THREE.CylinderGeometry(0.56,0.58,0.08,40); const sideM = M({color:0xf1ede2, roughness:0.6});
  P.tilePos.forEach((p,k)=>{ const sp=o.specials[k], info=sp&&o.info[sp];
    const t = tex(128,(g,S2)=>{ g.fillStyle = sp? info.color : '#2f3134'; g.fillRect(0,0,S2,S2);
      g.strokeStyle = sp? '#1b130b' : '#f4f1e8'; g.lineWidth=7; g.beginPath(); g.arc(S2/2,S2/2,S2*0.42,0,7); g.stroke();
      g.fillStyle = sp? '#1b130b' : '#f4f1e8'; g.textAlign='center'; g.textBaseline='middle';
      if(k===0){ g.font='800 26px Tajawal, sans-serif'; g.fillText('START',S2/2,S2/2+2); }
      else if(sp && o.drawIcon){ o.drawIcon(g, sp, S2/2, S2/2-8, 62, '#1b130b'); g.font='800 16px Tajawal, sans-serif'; g.fillText(String(k),S2/2,S2/2+38); }
      else { g.font='800 44px Tajawal, sans-serif'; g.fillText(String(k),S2/2,S2/2+3); } });
    const m = new THREE.Mesh(geo, [sideM, M({map:t, roughness:0.55, emissive: sp?new THREE.Color(info.color):new THREE.Color(0), emissiveIntensity: sp?0.12:0}), sideM]);
    m.position.set(p.x, BT+0.04, p.z); m.rotation.y = Math.PI - o.startAngle; m.castShadow=m.receiveShadow=true; root.add(m); });
  // the clock tower and its ring of broken arches
  const T = tower(); T.scale.setScalar(1.3); T.position.y = BT; T.rotation.y = o.startAngle - Math.PI/2 + Math.PI/2; root.add(T);
  // face the clock's porch toward the default camera
  T.rotation.y = Math.PI/2 - o.startAngle;
  addGateways(T);
  // palms and street lamps on the medians
  const trunk = M({color:0x8a6a45, roughness:0.9}), frond = M({color:0x3f7a32, roughness:0.7, side:THREE.DoubleSide});
  const leaf = new THREE.Shape(); leaf.moveTo(0,0); leaf.quadraticCurveTo(0.35,0.18,0.75,-0.12); leaf.quadraticCurveTo(0.35,0.08,0,0); const leafGeo = new THREE.ShapeGeometry(leaf,8);
  const pr = rng(9);
  function palm(x,z,s){ const g=new THREE.Group(); for(let i=0;i<7;i++){ const seg=new THREE.Mesh(new THREE.CylinderGeometry(0.07-i*0.004,0.08-i*0.004,0.18,8),trunk); seg.position.y=0.09+i*0.17; seg.castShadow=true; g.add(seg); }
    for(let i=0;i<8;i++){ const piv=new THREE.Group(); const l=new THREE.Mesh(leafGeo,frond); l.castShadow=true; l.rotation.x=-Math.PI/2+0.3; l.rotation.z=-0.25; piv.add(l); piv.position.y=1.25; piv.rotation.y=i/8*Math.PI*2+pr(); g.add(piv); }
    g.position.set(x,BT,z); g.scale.setScalar(s); root.add(g); }
  function lamp(x,z,face){ const g=new THREE.Group(); const pm=M({color:0x9aa0a6, metalness:0.7, roughness:0.35});
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.045,2.2,8),pm); p.position.y=1.1; g.add(p); const arm=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.03,0.03),pm); arm.position.set(0.22,2.18,0); g.add(arm);
    const head=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.05,0.1), M({color:0xf7f1d8, emissive:0xfff0c0, emissiveIntensity:0.6})); head.position.set(0.44,2.15,0); g.add(head);
    g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); g.position.set(x,BT,z); g.rotation.y=face; root.add(g); }
  for(let k=0;k<4;k++){ const a = o.startAngle + Math.PI/4 + k*Math.PI/2; [-1,1].forEach(s=>{ const ang=a+s*0.2; palm(Math.cos(ang)*9.4, Math.sin(ang)*9.4, 0.8+pr()*0.2); }); lamp(Math.cos(a+0.33)*9.55, Math.sin(a+0.33)*9.55, -a); }
  // a few toy cars on the entry roads
  const carCols=[0xe8473a,0xf4f4f4,0x2f80ed,0x222326];
  for(let k=0;k<4;k++){ const a = o.startAngle + Math.PI/4 + k*Math.PI/2; const c=new THREE.Group(); const body=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.18,0.34), M({color:carCols[k], metalness:0.5, roughness:0.3})); body.position.y=0.17; c.add(body);
    const cab=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.15,0.3), M({color:0x9fc3d8, metalness:0.3, roughness:0.1})); cab.position.set(-0.04,0.33,0); c.add(cab);
    [[-0.22,-0.17],[0.22,-0.17],[-0.22,0.17],[0.22,0.17]].forEach(([x,z])=>{ const w=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.05,12), M({color:0x111111})); w.rotation.x=Math.PI/2; w.position.set(x,0.08,z); c.add(w); });
    c.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); const rr = 9.75; c.position.set(Math.cos(a)*rr + Math.cos(a+Math.PI/2)*0.35, BT, Math.sin(a)*rr + Math.sin(a+Math.PI/2)*0.35); c.rotation.y = -a; root.add(c); }
  upd.push(t=>T.userData.update(t));
  const islandR = o.rIn - 0.8;
  return {tileTop: BT+0.08, goalY: BT+0.02, goalRadius: Math.min(2.0, islandR-0.25), update:(t,dt)=>upd.forEach(f=>f(t,dt))};
}

window.DarbRiffa = {tower, archFragment, addGateways, roundabout};
if(window.DarbBoards) window.DarbBoards.styles.roundabout = roundabout;
})();
