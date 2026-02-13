'use client';

import { useState, useEffect } from 'react';

export default function TestParticles() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particlesCount, setParticlesCount] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black/50 text-white p-4 rounded z-50">
      <div>Mouse: {mousePos.x}, {mousePos.y}</div>
      <div>Particles: {particlesCount}</div>
      <button 
        onClick={() => {
          // Force a re-render to trigger particle initialization
          window.location.reload();
        }}
        className="mt-2 px-3 py-1 bg-blue-500 rounded text-sm"
      >
        Reload Particles
      </button>
    </div>
  );
}