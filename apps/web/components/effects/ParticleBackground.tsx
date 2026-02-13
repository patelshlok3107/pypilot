'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    isInitializedRef.current = true;
    console.log('ParticleBackground: Initializing...');

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('ParticleBackground: Could not get 2D context');
      return;
    }

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log(`ParticleBackground: Canvas resized to ${canvas.width}x${canvas.height}`);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      
      mousePositionRef.current = { x: newX, y: newY };

      // Create particles only when mouse is moving
      const dx = mousePositionRef.current.x - lastMousePositionRef.current.x;
      const dy = mousePositionRef.current.y - lastMousePositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 2) {
        const particleCount = Math.min(Math.floor(distance / 8), 4);
        
        for (let i = 0; i < particleCount; i++) {
          const progress = i / particleCount;
          const x = lastMousePositionRef.current.x + dx * progress;
          const y = lastMousePositionRef.current.y + dy * progress;

          const speed = Math.min(distance * 0.15, 4);
          const angle = Math.atan2(dy, dx);
          
          particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 3,
            vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 3,
            life: 1,
            maxLife: 0.7 + Math.random() * 0.5,
            size: 1.5 + Math.random() * 2.5,
            color: ['#87CEEB', '#9370DB', '#00FFFF', '#FF69B4'][Math.floor(Math.random() * 4)]
          });
        }

        lastMousePositionRef.current = { ...mousePositionRef.current };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        // Update physics
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.08; // Gravity
        particle.vx *= 0.97; // Air resistance
        particle.vy *= 0.97;
        particle.life -= 0.015;
        
        // Draw if alive and on screen
        if (particle.life > 0 && 
            particle.x >= -10 && particle.x <= canvas.width + 10 && 
            particle.y >= -10 && particle.y <= canvas.height + 10) {
          
          const alpha = Math.min(particle.life / particle.maxLife, 1);
          ctx.globalAlpha = alpha * 0.8;
          
          // Draw particle
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
          ctx.fill();
          
          // Add glow effect
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
          
          ctx.globalAlpha = 1;
          return true;
        }
        return false;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    console.log('ParticleBackground: Starting animation loop');
    animate();

    // Cleanup
    return () => {
      console.log('ParticleBackground: Cleaning up...');
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameRef.current);
      isInitializedRef.current = false;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ 
        background: 'transparent',
        display: 'block'
      }}
    />
  );
}