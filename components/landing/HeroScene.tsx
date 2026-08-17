"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const loading = loadingRef.current;
    const fallback = fallbackRef.current;
    if (!wrap || !canvas || !loading || !fallback) return;

    function hasWebGL() {
      try {
        const c = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (c.getContext("webgl") || c.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    }

    if (!hasWebGL()) {
      canvas.style.display = "none";
      fallback.style.display = "flex";
      loading.style.display = "none";
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.5, 9);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const CLR = {
      mustard: 0xf2b33d,
      mustardD: 0xd89622,
      tomato: 0xe85b3b,
      mint: 0x7bc49b,
      sky: 0x7cb1d5,
      cream: 0xfff4da,
      creamD: 0xfbe8b7,
      ink: 0x2b211c,
      plum: 0xb478a9,
      green: 0x57a67b,
    };

    function clayMat(color: number) {
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75,
        metalness: 0.02,
        flatShading: false,
      });
    }

    const ambient = new THREE.AmbientLight(0xffe8c4, 0.55);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff4de, 1.1);
    key.position.set(4, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc4d8ea, 0.35);
    fill.position.set(-4, 2, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffcc88, 0.3);
    rim.position.set(0, -3, -4);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    function makeSchool() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.3, 1.3), clayMat(CLR.mustard));
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.85, 4, 1), clayMat(CLR.tomato));
      roof.position.y = 1.05;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      g.add(roof);

      const chim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), clayMat(CLR.creamD));
      chim.position.set(0.4, 1.35, 0);
      chim.castShadow = true;
      g.add(chim);

      const door = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.08), clayMat(CLR.sky));
      door.position.set(0, -0.3, 0.66);
      g.add(door);

      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), clayMat(CLR.mustard));
      knob.position.set(0.12, -0.3, 0.71);
      g.add(knob);

      const winMat = clayMat(CLR.mint);
      const wGeo = new THREE.BoxGeometry(0.3, 0.3, 0.08);
      const winL = new THREE.Mesh(wGeo, winMat);
      winL.position.set(-0.55, 0.2, 0.66);
      g.add(winL);
      const winR = new THREE.Mesh(wGeo, winMat);
      winR.position.set(0.55, 0.2, 0.66);
      g.add(winR);

      const paneMat = clayMat(CLR.cream);
      function addPanes(x: number, y: number) {
        const v = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.32, 0.02), paneMat);
        v.position.set(x, y, 0.71);
        g.add(v);
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.02), paneMat);
        h.position.set(x, y, 0.71);
        g.add(h);
      }
      addPanes(-0.55, 0.2);
      addPanes(0.55, 0.2);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), clayMat(CLR.ink));
      pole.position.set(0.4, 1.7, 0);
      g.add(pole);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.02), clayMat(CLR.tomato));
      flag.position.set(0.5, 1.75, 0);
      g.add(flag);

      return g;
    }

    function makeBus() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.7), clayMat(CLR.mustard));
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.65), clayMat(CLR.mustardD));
      roof.position.y = 0.42;
      g.add(roof);

      const win = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.28, 0.72), clayMat(CLR.sky));
      win.position.set(-0.05, 0.12, 0);
      g.add(win);

      const divMat = clayMat(CLR.mustardD);
      for (let i = -1; i <= 1; i++) {
        const d = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.74), divMat);
        d.position.set(i * 0.32, 0.12, 0);
        g.add(d);
      }

      const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.18, 20);
      const wheelMat = clayMat(CLR.ink);
      const w1 = new THREE.Mesh(wheelGeo, wheelMat);
      w1.rotation.z = Math.PI / 2;
      w1.position.set(-0.45, -0.42, 0);
      w1.castShadow = true;
      g.add(w1);
      const w2 = w1.clone();
      w2.position.set(0.45, -0.42, 0);
      g.add(w2);

      const hubMat = clayMat(CLR.cream);
      const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12), hubMat);
      h1.rotation.z = Math.PI / 2;
      h1.position.set(-0.45, -0.42, 0);
      g.add(h1);
      const h2 = h1.clone();
      h2.position.set(0.45, -0.42, 0);
      g.add(h2);

      const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.65), clayMat(CLR.tomato));
      bumper.position.set(0.79, -0.15, 0);
      g.add(bumper);

      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), clayMat(CLR.cream));
      hl.position.set(0.83, -0.05, 0.22);
      g.add(hl);

      return g;
    }

    function makeApple() {
      const g = new THREE.Group();
      const apple = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24), clayMat(CLR.tomato));
      apple.scale.set(1, 0.95, 1);
      apple.castShadow = true;
      g.add(apple);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.15, 8), clayMat(0x6b4a2e));
      stem.position.y = 0.42;
      stem.rotation.z = -0.15;
      g.add(stem);

      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.12, 0.05, 0.2, 0);
      leafShape.quadraticCurveTo(0.12, -0.05, 0, 0);
      const leaf = new THREE.Mesh(
        new THREE.ExtrudeGeometry(leafShape, { depth: 0.02, bevelEnabled: false }),
        clayMat(CLR.green)
      );
      leaf.position.set(0.03, 0.44, 0);
      leaf.rotation.z = 0.3;
      g.add(leaf);

      return g;
    }

    function makePencil() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.0, 8), clayMat(CLR.mustard));
      body.castShadow = true;
      g.add(body);

      const wood = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 8), clayMat(CLR.cream));
      wood.position.y = 0.61;
      g.add(wood);

      const point = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 8), clayMat(CLR.ink));
      point.position.y = 0.74;
      g.add(point);

      const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 12), clayMat(CLR.tomato));
      eraser.position.y = -0.59;
      g.add(eraser);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.06, 12), clayMat(0xa88e5c));
      band.position.y = -0.5;
      g.add(band);

      return g;
    }

    function makeCard() {
      const g = new THREE.Group();
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.05, 0.06), clayMat(CLR.cream));
      card.castShadow = true;
      g.add(card);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 0.062), clayMat(CLR.mint));
      stripe.position.y = 0.4;
      g.add(stripe);

      const star = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), clayMat(CLR.mustard));
      star.position.set(0, 0.4, 0.05);
      g.add(star);

      const lineMat = clayMat(CLR.mustard);
      for (let i = 0; i < 4; i++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.062), lineMat);
        l.position.set(-0.05, 0.15 - i * 0.13, 0);
        g.add(l);
      }
      const short = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.062), clayMat(CLR.tomato));
      short.position.set(-0.15, -0.37, 0);
      g.add(short);

      return g;
    }

    function makeStar(color: number, size: number) {
      const g = new THREE.Group();
      const s = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12), clayMat(color));
      g.add(s);
      return g;
    }

    const school = makeSchool();
    school.position.set(0.3, -0.5, 0);
    root.add(school);

    const bus = makeBus();
    bus.position.set(-2.1, -1.6, 0.8);
    bus.rotation.y = 0.3;
    root.add(bus);

    const apple = makeApple();
    apple.position.set(2.1, 1.2, 0.6);
    root.add(apple);

    const pencil = makePencil();
    pencil.position.set(-2.4, 0.8, 0.5);
    pencil.rotation.z = 0.5;
    pencil.rotation.x = 0.2;
    root.add(pencil);

    const card = makeCard();
    card.position.set(2.0, -1.0, 0.4);
    card.rotation.z = -0.15;
    card.rotation.y = 0.2;
    root.add(card);

    const sparkles = [
      { color: CLR.mustard, size: 0.09, pos: [2.5, 2.2, -1.5] as const },
      { color: CLR.tomato, size: 0.07, pos: [-2.8, 2.1, -1.2] as const },
      { color: CLR.mint, size: 0.08, pos: [1.0, 2.4, -1.8] as const },
      { color: CLR.plum, size: 0.06, pos: [-1.5, -2.3, -1.4] as const },
      { color: CLR.sky, size: 0.08, pos: [2.9, -0.3, -2.0] as const },
      { color: CLR.mustard, size: 0.06, pos: [-2.9, -0.5, -2.2] as const },
    ];

    const sparkleObjects = sparkles.map((s) => {
      const star = makeStar(s.color, s.size);
      star.position.set(...s.pos);
      root.add(star);
      return star;
    });

    const animated: {
      obj: THREE.Object3D;
      base: THREE.Vector3;
      phase: number;
      bob: number;
      rot: number;
    }[] = [
      { obj: school, base: school.position.clone(), phase: 0.0, bob: 0.05, rot: 0.15 },
      { obj: bus, base: bus.position.clone(), phase: 1.2, bob: 0.08, rot: 0.1 },
      { obj: apple, base: apple.position.clone(), phase: 0.5, bob: 0.15, rot: 0.5 },
      { obj: pencil, base: pencil.position.clone(), phase: 2.0, bob: 0.18, rot: 0.4 },
      { obj: card, base: card.position.clone(), phase: 3.1, bob: 0.12, rot: 0.3 },
    ];

    sparkleObjects.forEach((s, i) => {
      animated.push({
        obj: s,
        base: s.position.clone(),
        phase: i * 0.8,
        bob: 0.2 + Math.random() * 0.15,
        rot: 0.8,
      });
    });

    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetRotY = mouseX * 0.25;
      targetRotX = -mouseY * 0.15;
    };

    const onMouseLeave = () => {
      targetRotY = 0;
      targetRotX = 0;
    };

    wrap.addEventListener("mousemove", onMouseMove);
    wrap.addEventListener("mouseleave", onMouseLeave);

    const clock = new THREE.Clock();
    let running = false;
    let sceneReady = false;
    let rafId = 0;

    function resize() {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener("resize", resize);

    function animate() {
      if (!running) return;
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      animated.forEach((a) => {
        a.obj.position.y = a.base.y + Math.sin(t * 0.9 + a.phase) * a.bob;
        a.obj.rotation.y += 0.003 * a.rot;
        a.obj.rotation.x = Math.sin(t * 0.5 + a.phase) * 0.05 * a.rot;
      });

      root.rotation.y += (targetRotY - root.rotation.y) * 0.06;
      root.rotation.x += (targetRotX - root.rotation.x) * 0.06;
      if (Math.abs(targetRotY) < 0.02 && Math.abs(targetRotX) < 0.02) {
        root.rotation.y += 0.001;
      }

      renderer.render(scene, camera);
    }

    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!running) {
              running = true;
              if (!sceneReady) {
                sceneReady = true;
                setTimeout(() => {
                  loading.classList.add("hidden");
                  setTimeout(() => {
                    loading.style.display = "none";
                  }, 500);
                }, 400);
              }
              animate();
            }
          } else {
            running = false;
            cancelAnimationFrame(rafId);
          }
        });
      },
      { threshold: 0.1 }
    );

    heroObserver.observe(wrap);
    renderer.render(scene, camera);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      wrap.removeEventListener("mousemove", onMouseMove);
      wrap.removeEventListener("mouseleave", onMouseLeave);
      heroObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="scene-wrap" ref={wrapRef}>
      <div className="scene-badge top">
        <span
          style={{
            width: 8,
            height: 8,
            background: "var(--mint)",
            borderRadius: "50%",
            border: "1.5px solid var(--ink)",
          }}
        />
        132 kids at school today
      </div>
      <div className="scene-badge bottom">
        <span style={{ fontSize: "1rem" }}>🎨</span>
        New photos for parents
      </div>
      <canvas id="hero-canvas" ref={canvasRef} />
      <div className="scene-fallback" id="scene-fallback" ref={fallbackRef}>
        <svg viewBox="0 0 400 400" width="100%" style={{ maxWidth: 400 }} xmlns="http://www.w3.org/2000/svg">
          <rect x="140" y="180" width="120" height="100" rx="12" fill="#F2B33D" stroke="#2B211C" strokeWidth="4" />
          <polygon points="130,180 200,120 270,180" fill="#E85B3B" stroke="#2B211C" strokeWidth="4" />
          <rect x="185" y="220" width="30" height="60" rx="6" fill="#7CB1D5" stroke="#2B211C" strokeWidth="3" />
          <rect x="155" y="200" width="20" height="20" rx="4" fill="#FFF4DA" stroke="#2B211C" strokeWidth="3" />
          <rect x="225" y="200" width="20" height="20" rx="4" fill="#FFF4DA" stroke="#2B211C" strokeWidth="3" />
          <rect x="60" y="290" width="100" height="50" rx="14" fill="#F2B33D" stroke="#2B211C" strokeWidth="4" />
          <rect x="70" y="298" width="80" height="20" rx="6" fill="#7CB1D5" stroke="#2B211C" strokeWidth="3" />
          <circle cx="82" cy="345" r="10" fill="#2B211C" />
          <circle cx="138" cy="345" r="10" fill="#2B211C" />
          <circle cx="310" cy="110" r="26" fill="#E85B3B" stroke="#2B211C" strokeWidth="4" />
          <path d="M310 84 Q 316 76, 322 82" fill="none" stroke="#2B211C" strokeWidth="4" strokeLinecap="round" />
          <path d="M318 82 Q 328 76, 332 68" fill="#7BC49B" stroke="#2B211C" strokeWidth="3" strokeLinecap="round" />
          <g transform="translate(80 100) rotate(-20)">
            <rect x="0" y="0" width="70" height="16" rx="4" fill="#F2B33D" stroke="#2B211C" strokeWidth="3" />
            <polygon points="70,0 90,8 70,16" fill="#FFF4DA" stroke="#2B211C" strokeWidth="3" />
            <rect x="-8" y="0" width="8" height="16" rx="2" fill="#E85B3B" stroke="#2B211C" strokeWidth="3" />
          </g>
          <text x="280" y="240" fontSize="26">
            ⭐
          </text>
          <text x="60" y="200" fontSize="22">
            ✨
          </text>
        </svg>
      </div>
      <div className="scene-loading" id="scene-loading" ref={loadingRef}>
        <div className="loading-bounce">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
