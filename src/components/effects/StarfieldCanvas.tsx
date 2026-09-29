import React, { useEffect, useRef } from 'react';

export const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const PARTICLE_COUNT = 135;
    const particles: Particle[] = [];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);

    class Particle {
      x = 0;
      y = 0;
      radius = 0;
      vx = 0;
      vy = 0;
      baseAlpha = 0;
      alpha = 0;
      twinkleSpeed = 0;
      twinkleOffset = 0;
      color = '';

      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : Math.random() > 0.5 ? -5 : height + 5;
        this.radius = Math.random() * 1.5 + 0.6;
        this.vx = (Math.random() - 0.5) * 0.22;
        this.vy = (Math.random() - 0.5) * 0.22;
        this.baseAlpha = Math.random() * 0.45 + 0.2;
        this.alpha = this.baseAlpha;
        this.twinkleSpeed = Math.random() * 0.025 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI * 2;

        const isDark = document.documentElement.classList.contains('dark');
        const tier = Math.random();

        if (isDark) {
          if (tier > 0.75) {
            this.color = '192, 132, 252'; // Purple (#c084fc)
          } else if (tier > 0.45) {
            this.color = '96, 165, 250'; // Blue (#60a5fa)
          } else {
            this.color = '255, 255, 255'; // Pure white
          }
        } else {
          if (tier > 0.6) {
            this.color = '59, 130, 246'; // Blue
          } else {
            this.color = '148, 163, 184'; // Slate
          }
        }
      }

      update(time: number) {
        this.x += this.vx;
        this.y += this.vy;

        this.alpha = this.baseAlpha + Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.25;
        this.alpha = Math.max(0.06, Math.min(0.85, this.alpha));

        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;
        if (this.y < -10) this.y = height + 10;
        if (this.y > height + 10) this.y = -10;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        if (this.radius > 1.2) {
          c.shadowBlur = 5;
          c.shadowColor = `rgba(${this.color}, ${this.alpha})`;
        } else {
          c.shadowBlur = 0;
        }
        c.fill();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    let tick = 0;
    const animate = () => {
      tick += 0.5;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(tick);
        particles[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full opacity-60 dark:opacity-80 transition-opacity duration-500"
    />
  );
};
