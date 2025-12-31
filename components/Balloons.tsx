import React, { useEffect, useRef } from 'react';

export const Balloons: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const balloons: Balloon[] = [];
    const colors = ['#EF4444', '#111827', '#DC2626', '#FFFFFF']; // Red, Black, Dark Red, White

    class Balloon {
      x: number;
      y: number;
      speed: number;
      radius: number;
      color: string;
      wobble: number;
      wobbleSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 100;
        this.speed = 1 + Math.random() * 2;
        this.radius = 20 + Math.random() * 20;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.02 + Math.random() * 0.03;
      }

      update() {
        this.y -= this.speed;
        this.x += Math.sin(this.wobble) * 0.5;
        this.wobble += this.wobbleSpeed;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        // Balloon shape
        ctx.ellipse(this.x, this.y, this.radius, this.radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Shine
        ctx.beginPath();
        ctx.ellipse(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, this.radius * 0.1, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();

        // String
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius * 1.2);
        ctx.quadraticCurveTo(
          this.x + Math.sin(this.wobble * 2) * 10, 
          this.y + this.radius * 1.2 + 50,
          this.x, 
          this.y + this.radius * 1.2 + 100
        );
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.stroke();
      }
    }

    // Create balloons
    for (let i = 0; i < 50; i++) {
      balloons.push(new Balloon());
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      balloons.forEach(balloon => {
        balloon.update();
        balloon.draw();
      });

      // Remove balloons that fly off screen
      // For infinite loop, reset them to bottom
      balloons.forEach(balloon => {
        if (balloon.y < -150) {
          balloon.y = height + 100;
          balloon.x = Math.random() * width;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
};