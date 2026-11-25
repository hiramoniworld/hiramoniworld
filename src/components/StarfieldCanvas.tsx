import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number;
  phase: number;
  tint: string;
}

export const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { reducedMotion } = useAuth();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const tints = ['#F8FAFC', '#DCE8FF', '#E9D5FF', '#FDE68A'];
    const count = Math.min(160, Math.max(70, Math.floor((width * height) / 11000)));
    const stars: Star[] = Array.from({ length: count }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.35 + 0.35,
      alpha: Math.random() * 0.65 + 0.2,
      speed: Math.random() * 0.08 + 0.02,
      phase: Math.random() * Math.PI * 2,
      tint: tints[idx % tints.length],
    }));

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        const twinkle = reducedMotion
          ? s.alpha
          : s.alpha * (0.65 + 0.35 * Math.sin(time * 0.0012 + s.phase));
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = s.tint;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (!reducedMotion) {
          s.y -= s.speed * 0.25;
          if (s.y < -4) {
            s.y = height + 4;
            s.x = Math.random() * width;
          }
        }
      }
      ctx.globalAlpha = 1;

      if (!reducedMotion) {
        animId = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame(0);
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(45, 55, 105, 0.24), transparent 70%), radial-gradient(ellipse 60% 50% at 85% 80%, rgba(91, 67, 138, 0.14), transparent 70%), #060810',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />
    </div>
  );
};
