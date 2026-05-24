import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import {
  ArrowUpRight,
  BrainCircuit,
  Database,
  BriefcaseBusiness,
  Workflow,
  Sparkles,
  Download,
  Linkedin,
  Github,
  Mail,
  MapPin,
  Copy,
  Check,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { capabilities, experiences, profile, projects, signalStats, stack } from './portfolioData';
import './styles.css';

const PARTICLE_COUNT = 2000;

// Helper to generate the 5 geometric shapes for the scroll-bound morphing WebGL system
const generateShapes = () => {
  const shapes = [];

  // 1. Swirling Spiral Galaxy (Hero)
  const galaxy = [];
  const arms = 3;
  const spiralFactor = 1.6;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const radius = 0.8 + Math.random() * 4.8;
    const armIndex = i % arms;
    const angle = (armIndex * (Math.PI * 2) / arms) + (radius * spiralFactor) + (Math.random() - 0.5) * 0.28;
    galaxy.push({
      x: Math.cos(angle) * radius,
      y: (Math.random() - 0.5) * 0.4 * (5.5 - radius),
      z: Math.sin(angle) * radius
    });
  }
  shapes.push(galaxy);

  // 2. DNA Double Helix (Capabilities)
  const helix = [];
  const height = 7.0;
  const helixRadius = 1.6;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const pct = i / PARTICLE_COUNT;
    const isStrandA = i % 2 === 0;
    const angle = pct * Math.PI * 8.0; // 4 full turns
    const y = pct * height - (height / 2);

    if (i % 12 === 0) {
      // Connective rung particles
      const t = Math.random();
      const angleStrand = angle;
      const xA = Math.cos(angleStrand) * helixRadius;
      const zA = Math.sin(angleStrand) * helixRadius;
      const xB = Math.cos(angleStrand + Math.PI) * helixRadius;
      const zB = Math.sin(angleStrand + Math.PI) * helixRadius;
      helix.push({
        x: xA + (xB - xA) * t,
        y: y + (Math.random() - 0.5) * 0.08,
        z: zA + (zB - zA) * t
      });
    } else {
      const strandAngle = isStrandA ? angle : angle + Math.PI;
      helix.push({
        x: Math.cos(strandAngle) * helixRadius + (Math.random() - 0.5) * 0.12,
        y: y,
        z: Math.sin(strandAngle) * helixRadius + (Math.random() - 0.5) * 0.12
      });
    }
  }
  shapes.push(helix);

  // 3. Dimensional Plane / Grid of Data (Projects)
  const grid = [];
  const side = Math.ceil(Math.sqrt(PARTICLE_COUNT)); // roughly 45x45
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const col = i % side;
    const row = Math.floor(i / side);
    const px = (col / side - 0.5) * 7.0;
    const pz = (row / side - 0.5) * 7.0;
    const py = Math.sin(px * 1.5) * Math.cos(pz * 1.5) * 0.45 - 0.4;
    grid.push({
      x: px,
      y: py,
      z: pz
    });
  }
  shapes.push(grid);

  // 4. Concentric Spherical Shell (Experience)
  const sphere = [];
  const sphereRadius = 2.4;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.acos(1.0 - 2.0 * (i + 0.5) / PARTICLE_COUNT);
    const phi = Math.PI * (1.0 + Math.sqrt(5.0)) * i;
    sphere.push({
      x: sphereRadius * Math.sin(theta) * Math.cos(phi),
      y: sphereRadius * Math.cos(theta),
      z: sphereRadius * Math.sin(theta) * Math.sin(phi)
    });
  }
  shapes.push(sphere);

  // 5. Torus Ring / Vortex (Contact)
  const torus = [];
  const majorRadius = 3.0;
  const minorRadius = 0.65;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2.0;
    const phi = Math.random() * Math.PI * 2.0;
    torus.push({
      x: (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta),
      y: minorRadius * Math.sin(phi),
      z: (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta)
    });
  }
  shapes.push(torus);

  return shapes;
};

// Globally mounted Canvas component
function GlobalCanvas3D() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const activeRipples = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const shapes = generateShapes();

    // Create current/live positions arrays
    const currentPositions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      currentPositions[i * 3] = shapes[0][i].x;
      currentPositions[i * 3 + 1] = shapes[0][i].y;
      currentPositions[i * 3 + 2] = shapes[0][i].z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));

    // Particle Colors
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const colorTeal = new THREE.Color('#5eead4');
    const colorGreen = new THREE.Color('#34d399');
    const colorWhite = new THREE.Color('#ffffff');
    const colorSlate = new THREE.Color('#64748b');

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let mixedColor;
      const rand = Math.random();
      if (rand < 0.5) {
        mixedColor = colorTeal.clone().lerp(colorGreen, Math.random() * 0.45);
      } else if (rand < 0.85) {
        mixedColor = colorTeal.clone().lerp(colorSlate, Math.random() * 0.5);
      } else {
        mixedColor = colorWhite;
      }
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Material
    const material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Crystalline breathing core at the center
    const coreGeometry = new THREE.IcosahedronGeometry(0.8, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    // Track mouse
    const handleMouseMove = (e) => {
      mouse.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    // Track click ripples
    const handleCanvasClick = (e) => {
      const screenX = (e.clientX / window.innerWidth) * 2 - 1;
      const screenY = -(e.clientY / window.innerHeight) * 2 + 1;
      const aspect = window.innerWidth / window.innerHeight;
      const clickWorldX = screenX * 4.2 * aspect;
      const clickWorldY = screenY * 4.2;

      activeRipples.current.push({
        x: clickWorldX,
        y: clickWorldY,
        time: clock.getElapsedTime(),
        duration: 1.4,
        speed: 4.2,
        amplitude: 0.65
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleCanvasClick);
    handleResize();

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      
      // Calculate Scroll Progress
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollFraction = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      const activeProgress = scrollFraction * 4.0;
      const idxA = Math.floor(activeProgress);
      const idxB = Math.min(4, idxA + 1);
      const mixFactor = activeProgress - idxA;

      // Core mesh scaling and opacity
      const coreBreath = 1.0 + Math.sin(elapsed * 1.6) * 0.08;
      const fadeFactor = Math.max(0, 1.0 - scrollFraction * 3.5);
      coreMaterial.opacity = 0.16 * fadeFactor;
      coreMesh.scale.set(coreBreath * fadeFactor, coreBreath * fadeFactor, coreBreath * fadeFactor);
      coreMesh.rotation.y = -elapsed * 0.12;
      coreMesh.rotation.z = elapsed * 0.08;

      // Mouse smoothing
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;
      
      const aspect = window.innerWidth / window.innerHeight;
      const mouseWorldX = mouse.current.x * 4.2 * aspect;
      const mouseWorldY = mouse.current.y * 4.2;

      const positions = geometry.attributes.position.array;

      activeRipples.current = activeRipples.current.filter(
        (rip) => elapsed - rip.time <= rip.duration
      );

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const posA = shapes[idxA][i];
        const posB = shapes[idxB][i];

        // Target interpolated position
        let destX = posA.x + (posB.x - posA.x) * mixFactor;
        let destY = posA.y + (posB.y - posA.y) * mixFactor;
        let destZ = posA.z + (posB.z - posA.z) * mixFactor;

        // Current position
        let px = positions[i * 3];
        let py = positions[i * 3 + 1];
        let pz = positions[i * 3 + 2];

        // Spring interpolation
        px += (destX - px) * 0.065;
        py += (destY - py) * 0.065;
        pz += (destZ - pz) * 0.065;

        // Mouse displacement
        const dx = px - mouseWorldX;
        const dy = py - mouseWorldY;
        const dz = pz - 0;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist < 1.6 && dist > 0.01) {
          const force = (1.6 - dist) * 0.15;
          px += (dx / dist) * force;
          py += (dy / dist) * force;
          pz += (dz / dist) * force;
        }

        // Ripple wave displacements
        activeRipples.current.forEach((rip) => {
          const elapsedRip = elapsed - rip.time;
          const currentRadius = elapsedRip * rip.speed;
          const rdx = px - rip.x;
          const rdy = py - rip.y;
          const rdz = pz - 0;
          const rdist = Math.sqrt(rdx*rdx + rdy*rdy + rdz*rdz);

          if (rdist > 0.01) {
            const deltaDist = Math.abs(rdist - currentRadius);
            if (deltaDist < 0.4) {
              const pushForce = (1.0 - deltaDist / 0.4) * (1.0 - elapsedRip / rip.duration) * rip.amplitude;
              px += (rdx / rdist) * pushForce;
              py += (rdy / rdist) * pushForce;
              pz += (rdz / rdist) * pushForce;
            }
          }
        });

        positions[i * 3] = px;
        positions[i * 3 + 1] = py;
        positions[i * 3 + 2] = pz;
      }

      geometry.attributes.position.needsUpdate = true;

      // Slow global rotation
      particles.rotation.y = elapsed * 0.04;
      particles.rotation.x = Math.sin(elapsed * 0.08) * 0.06;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleCanvasClick);
      geometry.dispose();
      material.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="global-3d-container" aria-hidden="true">
      <canvas ref={canvasRef} className="global-3d-canvas" />
    </div>
  );
}

// Custom Cursor Ring component (Desktop only)
function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const isTouchDevice = useRef(false);

  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice.current) return;

    document.body.classList.add('use-custom-cursor');

    const mousePos = { x: -100, y: -100 };
    const targetPos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };

    const handleMouseMove = (e) => {
      targetPos.x = e.clientX;
      targetPos.y = e.clientY;
    };

    const handleMouseOver = (e) => {
      const isInteractive = e.target.closest('a, button, .icon-button, .nav-link, [data-cursor="pointer"]');
      if (isInteractive) {
        document.body.classList.add('cursor-hover-active');
      } else {
        document.body.classList.remove('cursor-hover-active');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    let frameId;
    const updateCursor = () => {
      ringPos.x += (targetPos.x - ringPos.x) * 0.12;
      ringPos.y += (targetPos.y - ringPos.y) * 0.12;

      mousePos.x += (targetPos.x - mousePos.x) * 0.28;
      mousePos.y += (targetPos.y - mousePos.y) * 0.28;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`;
      }

      frameId = requestAnimationFrame(updateCursor);
    };

    updateCursor();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.body.classList.remove('use-custom-cursor', 'cursor-hover-active');
      cancelAnimationFrame(frameId);
    };
  }, []);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <>
      <div ref={ringRef} className="custom-cursor-ring" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  );
}

// Minimal page preloader component
function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => {
      setLoading(false);
      document.body.style.overflow = '';
    }, 1200);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -45 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#030406]"
        >
          <motion.div 
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-signal/25 bg-signal/5 text-signal font-bold text-lg tracking-wider shadow-panel animate-pulse">
              AT
            </div>
            
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/50 font-display">
              Initializing WebGL Engine
            </p>

            <div className="relative mt-4 h-[2.5px] w-32 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-signal to-transparent"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Section Label component
function SectionLabel({ children, icon: Icon = Sparkles }) {
  return (
    <div className="section-label">
      <Icon size={12} className="text-signal animate-pulse" />
      {children}
    </div>
  );
}

// Navigation Header component
function Header() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 transition-all duration-300 nav-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#hero" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-signal font-bold tracking-tight text-sm transition-all duration-300 group-hover:bg-signal group-hover:text-black">
            AT
          </div>
          <span className="hidden sm:block text-sm font-bold text-white tracking-wide transition-colors duration-300 group-hover:text-signal">
            Aditya Tirakapadi
          </span>
        </a>

        <nav className="flex items-center gap-6 md:gap-8">
          <a href="#capabilities" className="nav-link">Expertise</a>
          <a href="#projects" className="nav-link">Projects</a>
          <a href="#experience" className="nav-link">Journey</a>
          <a href="#contact" className="nav-link">Contact</a>
          <a href={profile.links.resume} target="_blank" rel="noreferrer" className="icon-button" aria-label="Resume">
            <Download size={16} />
          </a>
        </nav>
      </div>
      <div 
        className="h-[2px] bg-gradient-to-r from-signal to-emerald-400 transition-all duration-100 ease-out" 
        style={{ width: `${scrollProgress}%` }}
      />
    </header>
  );
}

// Hero Landing Section component
function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <div className="glow-spot top-[10%] left-[5%]" />
      <div className="glow-spot bottom-[15%] right-[5%]" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <SectionLabel icon={Sparkles}>AI & DATA SCIENCE PORTFOLIO</SectionLabel>
          
          <h1 className="mt-6 text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight text-white leading-[1.05] font-display max-w-4xl">
            Aditya <span className="gradient-teal">Tirakapadi</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl md:text-2xl font-medium text-white/90 max-w-2xl font-display">
            {profile.role}
          </p>

          <p className="mt-4 text-sm sm:text-base text-white/50 max-w-xl leading-relaxed">
            {profile.headline}
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <a className="primary-button" href="#projects">
              Explore Work
              <ArrowUpRight size={16} />
            </a>
            <a className="secondary-button" href="#contact">
              Get in Touch
            </a>
          </div>
        </motion.div>

        {/* Hero KPI Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 sm:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {signalStats.map((stat, i) => (
            <div key={stat.label} className="glass-card hover-glow flex flex-col items-center justify-center p-6 border-white/[0.04]">
              <strong className="text-3xl md:text-4xl font-bold text-white font-display tracking-tight">
                {stat.value}
              </strong>
              <span className="mt-2 text-[10px] font-bold text-white/40 tracking-wider uppercase text-center leading-normal">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Scroll to Explore</span>
        <div className="w-[1px] h-10 bg-gradient-to-b from-signal/40 to-transparent" />
      </div>
    </section>
  );
}

// Capabilities Section component
function Capabilities() {
  const iconMap = [BrainCircuit, Database, BriefcaseBusiness, Workflow];

  return (
    <section id="capabilities" className="section-wrap">
      <div className="glow-spot top-[20%] right-[10%]" />
      
      <div className="mb-12 md:mb-20 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <SectionLabel icon={Workflow}>Expertise</SectionLabel>
          <h2 className="section-title mt-2">Core capabilities driving results.</h2>
        </div>
        <p className="max-w-md text-sm sm:text-base leading-relaxed text-white/50 text-center md:text-left">
          Bridging technical ML engineering, predictive analytics, structured AI prompt flows, and direct business execution metrics.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {capabilities.map((capability, index) => {
          const Icon = iconMap[index] || BrainCircuit;
          return (
            <motion.article
              key={capability.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card hover-glow flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-signal/20 bg-signal/5 text-signal mb-6">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{capability.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{capability.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                {capability.tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-semibold text-white/50 bg-white/[0.02] border border-white/[0.04] rounded-md px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

// Projects Showcase Section component
function Projects() {
  return (
    <section id="projects" className="section-wrap">
      <div className="glow-spot bottom-[10%] left-[10%]" />
      
      <div className="mb-12 md:mb-16">
        <SectionLabel icon={Database}>Portfolio Work</SectionLabel>
        <h2 className="section-title mt-2">Selected Case Studies & Engineering.</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <motion.article
            key={project.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
            className="glass-card hover-glow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold tracking-widest text-signal uppercase bg-signal/5 border border-signal/20 px-2.5 py-1 rounded-md">
                  {project.category}
                </span>
                <a 
                  href={project.repo} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="icon-button h-8 w-8" 
                  aria-label={`Open GitHub Repo for ${project.title}`}
                >
                  <ArrowUpRight size={14} />
                </a>
              </div>

              <h3 className="mt-5 text-xl font-bold text-white tracking-tight leading-snug">
                {project.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {project.description}
              </p>
            </div>

            <div className="mt-6">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-xs font-semibold text-white/80 flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-signal animate-ping" />
                <span>{project.signal}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((item) => (
                  <span key={item} className="tag text-[10px] px-2 py-0.5">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

// Experience and Bio Section component
function Experience() {
  return (
    <section id="experience" className="section-wrap">
      <div className="glow-spot top-[15%] left-[5%]" />
      
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] items-start">
        <div className="lg:sticky lg:top-28">
          <SectionLabel icon={BriefcaseBusiness}>JOURNEY</SectionLabel>
          <h2 className="section-title mt-2">Professional Logs.</h2>
          <p className="mt-6 text-sm sm:text-base leading-relaxed text-white/60">{profile.summary}</p>
          
          <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-white/70">
              <MapPin size={17} className="text-signal" />
              <span>{profile.location}</span>
            </div>
            <a 
              className="flex items-center gap-3 text-sm font-semibold text-white/70 hover:text-signal transition-colors duration-300" 
              href={`mailto:${profile.email}`}
            >
              <Mail size={17} className="text-signal" />
              <span>{profile.email}</span>
            </a>
          </div>
        </div>

        <div className="space-y-6">
          {experiences.map((experience, index) => (
            <motion.article
              key={experience.company}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="glass-card timeline-container"
            >
              <div className="timeline-dot" />
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{experience.role}</h3>
                  <p className="text-sm font-bold text-signal mt-1">{experience.company}</p>
                </div>
                <div className="text-xs text-white/40 font-semibold sm:text-right mt-1 sm:mt-0 space-y-1">
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <Calendar size={12} className="text-signal/60" />
                    <span>{experience.period}</span>
                  </div>
                  <p>{experience.meta}</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/70">{experience.description}</p>
              
              <ul className="mt-4 space-y-2.5">
                {experience.bullets.map((bullet, bulletIdx) => (
                  <li key={bulletIdx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-white/60">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Categorized Stack / System Libraries component
function StackCloud() {
  const categories = useMemo(() => [
    {
      name: 'Languages & Core Systems',
      items: ['Python', 'SQL', 'FastAPI', 'React', 'MySQL', 'Jupyter']
    },
    {
      name: 'Applied Machine Learning & Data Science',
      items: ['Pandas', 'NumPy', 'Scikit-learn', 'XGBoost']
    },
    {
      name: 'Business Strategy & AI workflows',
      items: ['Prompt Engineering', 'Business Analysis', 'Product Strategy', 'Power BI', 'Tableau', 'Git']
    }
  ], []);

  return (
    <section className="section-wrap">
      <div className="glass-card border-white/[0.04]">
        <div className="mb-10">
          <SectionLabel icon={BrainCircuit}>SYSTEM LIBRARIES</SectionLabel>
          <h2 className="section-title mt-2">Technical Engine & Tooling.</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {categories.map((cat, idx) => (
            <motion.div 
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-signal bg-signal/5 border border-signal/15 px-3 py-1.5 rounded-lg w-fit">
                {cat.name}
              </h3>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {cat.items.map((item) => (
                  <span key={item} className="tag text-xs font-semibold px-3 py-1.5 bg-white/[0.01]">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Center & Links component
function Contact() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" className="section-wrap pb-16">
      <div className="glow-spot bottom-[10%] right-[10%]" />
      
      <div className="glass-card border-white/[0.05] p-8 md:p-12 grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
        <div>
          <SectionLabel icon={Mail}>COMMUNICATIONS</SectionLabel>
          <h2 className="section-title mt-2">Connect & Collaborate.</h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/50">
            Open to internships, AI/DS trainee positions, product-focused analytics engineering, and business strategy roles. Let's build something scalable.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            type="button" 
            onClick={handleCopyEmail}
            className="flex items-center justify-between text-left rounded-xl border border-white/10 bg-white/[0.01] px-5 py-4 font-semibold text-white/70 transition-all duration-300 hover:border-signal/30 hover:bg-signal/5 hover:text-signal w-full"
          >
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-signal font-bold">
              {copied ? (
                <>
                  <Check size={13} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </div>
          </button>

          <a 
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.01] px-5 py-4 font-semibold text-white/70 transition-all duration-300 hover:border-signal/30 hover:bg-signal/5 hover:text-signal text-sm" 
            href={profile.links.linkedin} 
            target="_blank" 
            rel="noreferrer"
          >
            <div className="flex items-center gap-3">
              <Linkedin size={16} />
              <span>LinkedIn Profile</span>
            </div>
            <ExternalLink size={13} className="opacity-40" />
          </a>

          <a 
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.01] px-5 py-4 font-semibold text-white/70 transition-all duration-300 hover:border-signal/30 hover:bg-signal/5 hover:text-signal text-sm" 
            href={profile.links.github} 
            target="_blank" 
            rel="noreferrer"
          >
            <div className="flex items-center gap-3">
              <Github size={16} />
              <span>GitHub Portfolio</span>
            </div>
            <ExternalLink size={13} className="opacity-40" />
          </a>

          <a 
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.01] px-5 py-4 font-semibold text-white/70 transition-all duration-300 hover:border-signal/30 hover:bg-signal/5 hover:text-signal text-sm" 
            href={profile.links.resume} 
            target="_blank" 
            rel="noreferrer"
          >
            <div className="flex items-center gap-3">
              <Download size={16} />
              <span>Download Resume</span>
            </div>
            <ExternalLink size={13} className="opacity-40" />
          </a>
        </div>
      </div>

      <footer className="mt-12 border-t border-white/5 pt-6 text-center text-xs font-semibold tracking-wider text-white/30 uppercase">
        <p>&copy; {new Date().getFullYear()} Aditya Tirakapadi. All rights reserved.</p>
      </footer>
    </section>
  );
}

// App root component
function App() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-teal-500/20 relative">
      <Preloader />
      <CustomCursor />
      <GlobalCanvas3D />
      <Header />
      <div className="relative z-10">
        <Hero />
        <Capabilities />
        <Projects />
        <Experience />
        <StackCloud />
        <Contact />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
