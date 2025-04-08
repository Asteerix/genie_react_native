import React, { useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ConfettiProps {
  confettiColors?: string[];
  confettiSize?: number;
  fallSpeed?: number;
  confettiCount?: number;
  duration?: number;
  spread?: number;
  children?: React.ReactNode;
}

interface Confetti {
  x: number;
  y: number;
  rotation: number;
  speedX: number;
  speedY: number;
  color: string;
  startTime: number;
  size: number;
}

const ConfettiEffect: React.FC<ConfettiProps> = ({
  confettiColors = ["#f94144", "#f3722c", "#f8961e", "#f9c74f", "#90be6d", "#43aa8b", "#577590"],
  confettiSize = 10,
  fallSpeed = 3,
  confettiCount = 30,
  duration = 2000,
  spread = 60,
  children
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<Confetti[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let resizeTimeout: NodeJS.Timeout;

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(parent);

    resizeCanvas();

    return () => {
      ro.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confettiRef.current = confettiRef.current.filter((confetti: Confetti) => {
        const elapsed = timestamp - confetti.startTime;
        if (elapsed >= duration || confetti.y > canvas.height) {
          return false;
        }

        // Update position
        confetti.x += confetti.speedX;
        confetti.y += confetti.speedY;
        confetti.speedY += fallSpeed * 0.02; // Gravity effect
        confetti.rotation += 0.1;

        // Draw confetti piece
        ctx.save();
        ctx.translate(confetti.x, confetti.y);
        ctx.rotate(confetti.rotation);
        ctx.fillStyle = confetti.color;
        ctx.beginPath();
        ctx.fillRect(-confetti.size / 2, -confetti.size / 4, confetti.size, confetti.size / 2);
        ctx.restore();

        return true;
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [confettiColors, confettiSize, fallSpeed, confettiCount, duration, spread]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, [role="button"]') || isMobile) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = performance.now();
    const newConfetti: Confetti[] = Array.from({ length: confettiCount }, () => ({
      x,
      y,
      rotation: Math.random() * Math.PI * 2,
      speedX: (Math.random() - 0.5) * spread * 0.1,
      speedY: -Math.random() * fallSpeed,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      startTime: now,
      size: confettiSize * (0.75 + Math.random() * 0.5)
    }));

    confettiRef.current.push(...newConfetti);
  };

  return (
    <div
      className="relative w-full h-full"
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[9999]"
      />
      {children}
    </div>
  );
};

export default ConfettiEffect;
