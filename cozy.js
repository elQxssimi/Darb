/* Living-room dressing for Darb: furniture and lived-in clutter, all drawn in code. window.DarbCozy(scene) adds everything. */
(function(){
"use strict";
function rng(seed){ let s = seed>>>0; return ()=>((s = Math.imul(s,1664525)+1013904223>>>0)/4294967296); }
function tex(size, draw, h, repeat){ const c=document.createElement('canvas'); c.width=size; c.height=h||size; draw(c.getContext('2d'), size, h||size);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; if(repeat){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(repeat[0],repeat[1]); } return t; }
const M = (o)=>new THREE.MeshStandardMaterial(o);
function mesh(geo, mat, x, y, z, parent){ const m=new THREE.Mesh(geo, mat); m.position.set(x||0,y||0,z||0); m.castShadow=true; m.receiveShadow=true; (parent).add(m); return m; }
function puffBox(w,h,d,mat,amt){ const g=new THREE.BoxGeometry(w,h,d,10,6,10); const p=g.attributes.position; amt=amt==null?0.25:amt;
  for(let i=0;i<p.count;i++){ const vx=p.getX(i)/(w/2), vy=p.getY(i)/(h/2), vz=p.getZ(i)/(d/2); const puff=(1-vx*vx)*(1-vz*vz); p.setY(i, p.getY(i)*(1-amt+amt*puff)); const pinch=1-0.07*vy*vy; p.setX(i,p.getX(i)*pinch); p.setZ(i,p.getZ(i)*pinch); }
  g.computeVertexNormals(); return new THREE.Mesh(g, mat); }
function lathe(pts, mat, seg){ return new THREE.Mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])), seg||32), mat); }

const velvet = (c)=>M({color:c, roughness:0.85});
const out = {};
const darkWood = M({color:0x3b2616, roughness:0.45});
const midWood = tex(512,(g,S)=>{ const r=rng(9); g.fillStyle='#8a5d36'; g.fillRect(0,0,S,S); for(let y=0;y<S;y+=2){ g.fillStyle=r()>0.5?'#7a5030':'#9a6a40'; g.globalAlpha=0.35; g.fillRect(0,y,S,1);} g.globalAlpha=1; });
const woodMat = M({map:midWood, roughness:0.5});
const brass = M({color:0xc9a24e, metalness:0.85, roughness:0.3});
const ceramicW = M({color:0xf2ede4, roughness:0.3});

function armchair(scene, x, z, ry, color){
  const g=new THREE.Group(); const fab=velvet(color);
  const seat=puffBox(0.68,0.16,0.62,fab,0.3); seat.position.set(0,0.42,0.04); g.add(seat);
  const base=puffBox(0.78,0.24,0.74,fab,0.08); base.position.set(0,0.24,0); g.add(base);
  const back=puffBox(0.78,0.5,0.16,fab,0.2); back.position.set(0,0.66,-0.32); back.rotation.x=-0.12; g.add(back);
  [-1,1].forEach(s=>{ const arm=puffBox(0.12,0.3,0.72,fab,0.15); arm.position.set(s*0.39,0.52,0); g.add(arm); });
  const pil=puffBox(0.36,0.3,0.1,velvet(0xc98b2a),0.4); pil.position.set(0.1,0.62,-0.2); pil.rotation.set(-0.25,0,0.12); g.add(pil);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{ const l=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.012,0.12,8), darkWood); l.position.set(a*0.33,0.06,b*0.3); g.add(l); });
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=o.receiveShadow=true; } });
  g.position.set(x,0,z); g.rotation.y=ry; scene.add(g); return g;
}
function sideTable(scene, x, z){ const g=new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.26,0.26,0.03,40), woodMat, 0, 0.55, 0, g);
  mesh(new THREE.CylinderGeometry(0.03,0.04,0.54,12), darkWood, 0, 0.27, 0, g);
  mesh(new THREE.CylinderGeometry(0.18,0.2,0.02,32), darkWood, 0, 0.01, 0, g);
  g.position.set(x,0,z); scene.add(g); return g; }
function tableLamp(scene, x, y, z, lights){ const g=new THREE.Group();
  g.add(lathe([[0,0],[0.07,0],[0.09,0.05],[0.1,0.14],[0.07,0.24],[0.03,0.27],[0.015,0.3],[0,0.3]], M({color:0x2e6b6a, roughness:0.2})));
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.18,0.2,32,1,true), M({color:0xf4e7cf, emissive:0xffc77a, emissiveIntensity:0.55, roughness:0.9, side:THREE.DoubleSide, transparent:true, opacity:0.95}));
  shade.position.y=0.38; g.add(shade);
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; } }); shade.castShadow=false;
  if(lights){ const L=new THREE.PointLight(0xffc27a, 0.55, 2.6, 2); L.position.set(0,0.36,0); g.add(L); }
  g.position.set(x,y,z); scene.add(g); return g; }
function floorLamp(scene, x, z){ const g=new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.17,0.19,0.03,32), M({color:0x222222, metalness:0.6, roughness:0.4}), 0,0.015,0,g);
  const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,0.03,0), new THREE.Vector3(0,2.3,0), new THREE.Vector3(0.95,1.75,0.3));
  mesh(new THREE.TubeGeometry(curve,40,0.014,8), brass, 0,0,0,g);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(0.17,24,12,0,Math.PI*2,0,Math.PI/2), M({color:0xc9a24e, metalness:0.8, roughness:0.3, side:THREE.DoubleSide}));
  dome.position.set(0.95,1.75,0.3); g.add(dome);
  const bulb=mesh(new THREE.SphereGeometry(0.05,12,8), M({color:0xfff0d0, emissive:0xffd8a0, emissiveIntensity:1.5}), 0.95,1.7,0.3,g); bulb.castShadow=false;
  g.position.set(x,0,z); scene.add(g); return g; }
function plant(scene, x, z, scale, seed){ const g=new THREE.Group(); const r=rng(seed||3);
  g.add(lathe([[0,0],[0.16,0],[0.2,0.05],[0.22,0.36],[0.2,0.38],[0,0.38]], M({color:0xe7dfd2, roughness:0.6})));
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.19,0.02,24), M({color:0x3a2a1c})); soil.position.y=0.35; g.add(soil);
  const leafShape=new THREE.Shape(); leafShape.moveTo(0,0); leafShape.quadraticCurveTo(0.16,0.2,0,0.42); leafShape.quadraticCurveTo(-0.16,0.2,0,0);
  const leafGeo=new THREE.ShapeGeometry(leafShape,8);
  for(let i=0;i<34;i++){ const h=0.5+r()*1.0, a=r()*Math.PI*2, out=0.05+r()*0.25;
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.008,h,5), M({color:0x4a5a2a})); stem.position.set(Math.cos(a)*out*0.4,0.36+h/2,Math.sin(a)*out*0.4); stem.rotation.set(Math.sin(a)*out*0.6,0,-Math.cos(a)*out*0.6); g.add(stem);
    const leaf=new THREE.Mesh(leafGeo, M({color:new THREE.Color().setHSL(0.28+r()*0.06,0.5,0.18+r()*0.12), side:THREE.DoubleSide, roughness:0.6}));
    leaf.position.set(Math.cos(a)*out, 0.36+h, Math.sin(a)*out); leaf.rotation.set(-0.6-r()*0.6, a, 0, 'YXZ'); leaf.rotation.order='YXZ'; leaf.rotation.y=-a+Math.PI/2; leaf.castShadow=true; g.add(leaf); }
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
  g.scale.setScalar(scale||1); g.position.set(x,0,z); scene.add(g); return g; }
function books(parent, x, y, z, n, seed, rot){ const r=rng(seed); const cols=[0x7d1f1a,0x1f3b5a,0x2f5d3a,0xc98b2a,0x5a3d6a,0xe7dfd2,0x3a2a1c]; let off=0; const g=new THREE.Group();
  for(let i=0;i<n;i++){ const w=0.025+r()*0.03, h=0.18+r()*0.08, d=0.13+r()*0.04; const b=mesh(new THREE.BoxGeometry(w,h,d), M({color:cols[(r()*cols.length)|0], roughness:0.7}), off+w/2, h/2, 0, g); off+=w+0.002; }
  g.position.set(x,y,z); g.rotation.y=rot||0; parent.add(g); return g; }
function bookcase(scene, x, z, ry){ const g=new THREE.Group(); const W=1.2,H=2.0,D=0.34;
  [[W,0.03,D,0,H],[W,0.03,D,0,0.06],[0.03,H,D,-W/2,H/2],[0.03,H,D,W/2,H/2]].forEach(([w,h,d,px,py])=>mesh(new THREE.BoxGeometry(w,h,d), woodMat, px, py, 0, g));
  mesh(new THREE.BoxGeometry(W,H,0.02), darkWood, 0, H/2, -D/2+0.01, g);
  const shelves=[0.45,0.85,1.25,1.62]; shelves.forEach(y=>mesh(new THREE.BoxGeometry(W-0.04,0.025,D-0.02), woodMat, 0, y, 0, g));
  books(g, -0.55, 0.075, 0.02, 14, 1); books(g, -0.55, 0.465, 0.02, 9, 2); books(g, 0.15, 0.465, 0.02, 7, 3); books(g, -0.2, 0.865, 0.02, 12, 4); books(g, -0.55, 1.27, 0.02, 6, 5); books(g, 0.05, 1.635, 0.02, 10, 6);
  const vase=lathe([[0,0],[0.05,0],[0.08,0.08],[0.05,0.2],[0.035,0.26],[0.045,0.28],[0,0.28]], M({color:0x2e6b6a, roughness:0.25})); vase.position.set(-0.35,0.865,0); vase.castShadow=true; g.add(vase);
  const bowl=lathe([[0,0],[0.06,0],[0.11,0.05],[0.12,0.07],[0,0.04]], brass); bowl.position.set(0.35,1.27,0); g.add(bowl);
  const box2=mesh(new THREE.BoxGeometry(0.2,0.1,0.14), M({color:0x7d1f1a, roughness:0.5}), 0.35, 0.125, 0, g); // keepsake box
  const frame=photoFrame(0.18,0.24,3); frame.position.set(0.32,0.865,0.03); frame.rotation.x=-0.12; g.add(frame);
  g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g); return g; }
const scenes = [ // little painted "photos": sea, dunes, dhow, palms, city
  (g,S,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#9cc9e6'); gr.addColorStop(0.55,'#e9d7b0'); gr.addColorStop(0.56,'#2e7aa0'); gr.addColorStop(1,'#1f5874'); g.fillStyle=gr; g.fillRect(0,0,S,H); g.fillStyle='#f6e6b8'; g.beginPath(); g.arc(S*0.7,H*0.3,S*0.08,0,7); g.fill(); },
  (g,S,H)=>{ g.fillStyle='#f3c98a'; g.fillRect(0,0,S,H); g.fillStyle='#d99a55'; g.beginPath(); g.moveTo(0,H*0.65); g.quadraticCurveTo(S*0.4,H*0.45,S,H*0.7); g.lineTo(S,H); g.lineTo(0,H); g.fill(); g.fillStyle='#b8743c'; g.beginPath(); g.moveTo(0,H*0.85); g.quadraticCurveTo(S*0.6,H*0.6,S,H*0.9); g.lineTo(S,H); g.lineTo(0,H); g.fill(); },
  (g,S,H)=>{ g.fillStyle='#f0c27a'; g.fillRect(0,0,S,H); g.fillStyle='#2a5f7a'; g.fillRect(0,H*0.62,S,H); g.fillStyle='#4a2c18'; g.beginPath(); g.moveTo(S*0.25,H*0.62); g.lineTo(S*0.75,H*0.62); g.lineTo(S*0.68,H*0.7); g.lineTo(S*0.32,H*0.7); g.fill(); g.fillStyle='#f6ead2'; g.beginPath(); g.moveTo(S*0.48,H*0.2); g.lineTo(S*0.7,H*0.6); g.lineTo(S*0.42,H*0.6); g.fill(); },
  (g,S,H)=>{ g.fillStyle='#bfe0e8'; g.fillRect(0,0,S,H); g.fillStyle='#e5d1a4'; g.fillRect(0,H*0.75,S,H); g.strokeStyle='#5a3d1c'; g.lineWidth=S*0.03; [0.3,0.65].forEach(px=>{ g.beginPath(); g.moveTo(S*px,H*0.78); g.quadraticCurveTo(S*(px+0.04),H*0.5,S*px,H*0.32); g.stroke(); g.fillStyle='#2f6d3a'; for(let a=0;a<6;a++){ g.beginPath(); g.ellipse(S*px+Math.cos(a)*S*0.08, H*0.32+Math.sin(a)*H*0.03, S*0.1, H*0.025, a, 0, 7); g.fill(); } }); },
  (g,S,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#f7a35c'); gr.addColorStop(1,'#6a3d6a'); g.fillStyle=gr; g.fillRect(0,0,S,H); g.fillStyle='#1d1830'; [[0.1,0.5],[0.25,0.35],[0.4,0.55],[0.55,0.2],[0.7,0.45],[0.85,0.6]].forEach(([px,py])=>g.fillRect(S*px,H*py,S*0.12,H)); }
];
function photoFrame(w,h,i){ const g=new THREE.Group(); mesh(new THREE.BoxGeometry(w+0.03,h+0.03,0.02), M({color:0x2a1b10, roughness:0.4}),0,0,0,g);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h), M({map:tex(128, scenes[i%scenes.length], Math.round(128*h/w)), roughness:0.4})); p.position.z=0.011; g.add(p); return g; }
function wallClock(scene, x, y, z, ry){ const g=new THREE.Group();
  const face=tex(256,(c,S)=>{ c.fillStyle='#f6f1e6'; c.fillRect(0,0,S,S); c.fillStyle='#2a1b10'; c.font='700 30px Tajawal, serif'; c.textAlign='center'; c.textBaseline='middle';
    const d=['١٢','١','٢','٣','٤','٥','٦','٧','٨','٩','١٠','١١']; d.forEach((t,i)=>{ const a=i/12*Math.PI*2-Math.PI/2; c.fillText(t, S/2+Math.cos(a)*S*0.36, S/2+Math.sin(a)*S*0.36); }); });
  const f=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.03,48), M({color:0xc9a24e,metalness:0.8,roughness:0.3})); f.rotation.x=Math.PI/2; g.add(f);
  const fc=new THREE.Mesh(new THREE.CircleGeometry(0.2,48), M({map:face, roughness:0.4})); fc.position.z=0.016; g.add(fc);
  const hand=(len,w,a)=>{ const h=new THREE.Mesh(new THREE.BoxGeometry(w,len,0.004), M({color:0x1a1a1a})); h.geometry.translate(0,len/2,0); h.position.z=0.02; h.rotation.z=-a; g.add(h); return h; };
  const hh=hand(0.12,0.012,Math.PI*2*(4.33/12)), mh=hand(0.17,0.008,Math.PI*2*(20/60));
  g.position.set(x,y,z); g.rotation.y=ry; scene.add(g); return [hh,mh]; }
function acUnit(scene, x, y, z, ry){ const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.3,0.22), M({color:0xf7f7f5, roughness:0.35})); g.add(b);
  const grille=new THREE.Mesh(new THREE.BoxGeometry(0.85,0.04,0.02), M({color:0xd8d8d6})); grille.position.set(0,-0.11,0.1); g.add(grille);
  const led=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.01,0.005), M({color:0x6fd1ff, emissive:0x6fd1ff, emissiveIntensity:1})); led.position.set(0.35,0.06,0.111); g.add(led);
  g.position.set(x,y,z); g.rotation.y=ry; scene.add(g); }
function chandelier(scene, x, z, h, lights){ const g=new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.008,0.008,0.6,6), brass, 0, 0.3, 0, g);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.38,0.018,10,64), brass); ring.rotation.x=Math.PI/2; g.add(ring);
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const cup=lathe([[0,0],[0.03,0],[0.045,0.05],[0,0.05]], brass, 16); cup.position.set(Math.cos(a)*0.38,0.0,Math.sin(a)*0.38); g.add(cup);
    const b=new THREE.Mesh(new THREE.SphereGeometry(0.03,12,8), M({color:0xfff2d8, emissive:0xffd8a0, emissiveIntensity:1.2})); b.position.set(Math.cos(a)*0.38,0.08,Math.sin(a)*0.38); g.add(b); }
  if(lights){ const L=new THREE.PointLight(0xffd2a0, 0.35, 4, 2); L.position.y=0; g.add(L); }
  g.position.set(x,h-0.6,z); scene.add(g); }
function drapes(scene, x, zA, zB, H, color){ const g=new THREE.PlaneGeometry(0.55, H, 30, 1); const p=g.attributes.position;
  for(let i=0;i<p.count;i++) p.setZ(i, Math.sin(p.getX(i)*34)*0.05+0.02); g.computeVertexNormals();
  [zA,zB].forEach(z=>{ const m=new THREE.Mesh(g, M({color, roughness:0.9, side:THREE.DoubleSide})); m.rotation.y=Math.PI/2; m.position.set(x, H/2, z); m.castShadow=true; scene.add(m); });
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,Math.abs(zB-zA)+0.9,10), brass); rod.rotation.x=Math.PI/2; rod.position.set(x+0.03, H+0.04, (zA+zB)/2); scene.add(rod); }
function slippers(scene, x, z, ry, color){ const g=new THREE.Group(); const sole=M({color:0x3a2a1c, roughness:0.8}), strap=M({color, roughness:0.6});
  [-0.055,0.055].forEach((dx,i)=>{ const s=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.018,20), sole); s.scale.set(1,1,2.6); s.position.set(dx,0.009,i?0.02:0); s.rotation.y=i?0.12:-0.05; s.castShadow=true; g.add(s);
    const st=new THREE.Mesh(new THREE.TorusGeometry(0.04,0.012,8,16,Math.PI), strap); st.position.set(dx,0.018,(i?0.02:0)-0.03); st.castShadow=true; g.add(st); });
  g.position.set(x,0,z); g.rotation.y=ry; scene.add(g); }
function toys(scene){ const ball=tex(256,(g,S)=>{ ['#e8473a','#f2c94c','#2f80ed','#27ae60','#ffffff','#e8473a'].forEach((c,i)=>{ g.fillStyle=c; g.fillRect(i*S/6,0,S/6,S); }); });
  mesh(new THREE.SphereGeometry(0.11,24,16), M({map:ball, roughness:0.4}), 1.15, 0.11, 2.35, scene).rotation.set(0.4,0.8,0.2);
  const r=rng(12), cols=[0xe8473a,0xf2c94c,0x2f80ed,0x27ae60];
  for(let i=0;i<9;i++){ const b=mesh(new THREE.BoxGeometry(0.06,0.06,0.06), M({color:cols[i%4], roughness:0.5}), 0.6+r()*0.35, 0.03+(i>6?0.06:0), 2.0+r()*0.3, scene); b.rotation.y=r()*3; }
  const car=new THREE.Group(); mesh(new THREE.BoxGeometry(0.16,0.05,0.08), M({color:0xe8473a, roughness:0.3, metalness:0.3}),0,0.04,0,car); mesh(new THREE.BoxGeometry(0.08,0.04,0.07), M({color:0x9fd3ff, roughness:0.1}),-0.01,0.08,0,car);
  [[-0.05,-0.045],[0.05,-0.045],[-0.05,0.045],[0.05,0.045]].forEach(([a,b])=>{ const w=mesh(new THREE.CylinderGeometry(0.02,0.02,0.015,12), M({color:0x111}),a,0.02,b,car); w.rotation.x=Math.PI/2; });
  car.position.set(-0.3,0,1.85); car.rotation.y=0.7; scene.add(car); }
function tvDecor(scene, zWall){ const y=0.42; const z=zWall-0.25;
  mesh(new THREE.BoxGeometry(0.9,0.07,0.09), M({color:0x1a1a1c, roughness:0.4}), 0.2, y+0.035, z-0.05, scene); // soundbar
  const v=lathe([[0,0],[0.06,0],[0.09,0.1],[0.06,0.28],[0.05,0.34],[0,0.34]], M({color:0xc98b2a, roughness:0.25})); v.position.set(-0.6,y,z); v.castShadow=true; scene.add(v);
  plant(scene, 0.95, z, 0.32, 8).position.y=y;
  books(scene, -0.42, y, z+0.02, 5, 9, Math.PI/2);
  const f1=photoFrame(0.16,0.2,0); f1.position.set(0.62,y+0.12,z); f1.rotation.y=Math.PI-0.2; f1.rotation.x=0.1; scene.add(f1);
  const ctrl=new THREE.Group(); mesh(new THREE.BoxGeometry(0.15,0.03,0.08), M({color:0x222326, roughness:0.4}),0,0.015,0,ctrl); [-0.06,0.06].forEach(dx=>mesh(new THREE.SphereGeometry(0.035,12,8), M({color:0x222326, roughness:0.4}),dx,0.015,0.03,ctrl));
  ctrl.position.set(-0.1,y,z+0.05); ctrl.rotation.y=Math.PI+0.3; scene.add(ctrl);
}
function thermosTray(scene, x, y, z){ const g=new THREE.Group();
  g.add(lathe([[0,0],[0.17,0],[0.19,0.025],[0.18,0.026],[0.16,0.008],[0,0.008]], brass));
  const th=lathe([[0,0.01],[0.055,0.01],[0.06,0.03],[0.06,0.22],[0.045,0.26],[0.03,0.29],[0.035,0.31],[0,0.31]], M({color:0x8a1f2a, metalness:0.5, roughness:0.3})); g.add(th);
  const cap=lathe([[0,0.3],[0.035,0.3],[0.035,0.34],[0,0.35]], brass); g.add(cap);
  for(let i=0;i<3;i++){ const a=1.2+i*0.9; const cup=lathe([[0,0],[0.02,0],[0.026,0.045],[0.024,0.046],[0.018,0.004],[0,0.004]], ceramicW, 16); cup.position.set(Math.cos(a)*0.11,0.008,Math.sin(a)*0.11); g.add(cup);
    const k=lathe([[0,0.03],[0.023,0.03],[0.0235,0.038],[0,0.038]], M({color:0xb07a45, roughness:0.3}),16); k.position.copy(cup.position); g.add(k); }
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
  g.position.set(x,y,z); scene.add(g); }
function throwBlanket(scene, x, y, z, ry){ const knit=tex(256,(g,S)=>{ g.fillStyle='#c98b2a'; g.fillRect(0,0,S,S); g.strokeStyle='rgba(90,50,10,.35)'; g.lineWidth=3; for(let x=0;x<S;x+=12){ g.beginPath(); for(let y=0;y<S;y+=8){ g.lineTo(x+((y/8)%2?4:0),y);} g.stroke(); } g.fillStyle='#efe6d2'; g.fillRect(0,S*0.8,S,S*0.06); }, null, [2,2]);
  const b=puffBox(0.42,0.06,0.32, M({map:knit, roughness:0.95}), 0.2); b.position.set(x,y,z); b.rotation.y=ry; b.castShadow=b.receiveShadow=true; scene.add(b);
  const g2=new THREE.PlaneGeometry(0.42,0.5,16,16); const p=g2.attributes.position; for(let i=0;i<p.count;i++){ const yy=p.getY(i); p.setZ(i, Math.sin(p.getX(i)*18)*0.015 + (yy<0? yy*yy*0.8:0)); } g2.computeVertexNormals();
  const drape=new THREE.Mesh(g2, M({map:knit, roughness:0.95, side:THREE.DoubleSide})); drape.position.set(x+0.05,y-0.2,z+0.18); drape.rotation.set(-0.15,ry,0); drape.castShadow=true; scene.add(drape); }

window.DarbCozy = function(scene, o){
  o = o||{}; const lights = o.lights!==false;
  armchair(scene, -1.55, 0.25, Math.PI/2+0.2, 0x1f4e4b);
  armchair(scene, -1.9, -1.0, 1.08, 0x1f4e4b);
  sideTable(scene, -1.52, -1.95); sideTable(scene, 1.52, -1.95);
  tableLamp(scene, -1.52, 0.565, -2.02, lights); tableLamp(scene, 1.58, 0.565, -2.04, lights);
  thermosTray(scene, 1.45, 0.565, -1.86);
  floorLamp(scene, -2.45, -2.1);
  plant(scene, -3.05, -2.1, 1.25, 4); plant(scene, 3.05, 2.8, 1.1, 5);
  bookcase(scene, 2.75, -2.28, 0);
  const clockHands = wallClock(scene, 3.44, 1.85, 0.25, -Math.PI/2);
  [[3.44,1.9,-0.55,1],[3.44,1.9,1.05,2],[3.44,1.45,-0.2,3],[3.44,1.45,0.7,4]].forEach(([x,y,z,i])=>{ const f=photoFrame(i%2?0.3:0.24, i%2?0.22:0.3, i); f.position.set(x,y,z); f.rotation.y=-Math.PI/2; scene.add(f); });
  acUnit(scene, -2.2, 2.5, -2.38, 0);
  chandelier(scene, 0, 0, 2.9, lights);
  drapes(scene, -3.36, -1.85, 2.15, 2.75, 0x5e1914);
  slippers(scene, 2.15, 1.55, 0.4, 0x7d1f1a); slippers(scene, 1.95, 1.75, -0.3, 0x1f3b5a); slippers(scene, -0.9, -1.25, 0.2, 0xc98b2a);
  toys(scene); tvDecor(scene, 3.2);
  throwBlanket(scene, 0.75, 0.47, -1.85, 0.1);
  // two sadu cushions on the sofa
  const sadu=tex(256,(g,S)=>{ ['#7d1f1a','#1c1a19','#efe6d2','#c98b2a','#7d1f1a'].forEach((c,i)=>{ g.fillStyle=c; g.fillRect(0,i*S/5,S,S/5); }); g.fillStyle='#efe6d2'; for(let x=0;x<S;x+=26){ g.beginPath(); g.moveTo(x,S*0.1-8); g.lineTo(x+8,S*0.1); g.lineTo(x,S*0.1+8); g.lineTo(x-8,S*0.1); g.fill(); } });
  [[-0.78,0.1],[0.78,-0.1]].forEach(([x,r])=>{ const c=puffBox(0.4,0.4,0.12, M({map:sadu, roughness:0.9}), 0.45); c.position.set(x,0.68,-1.98); c.rotation.set(-0.2,r,0); c.castShadow=c.receiveShadow=true; scene.add(c); });
  return {clockHands};
};
})();
