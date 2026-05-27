import React, { useState, useLayoutEffect, useRef } from 'react';

interface RippleProps {
  className?: string;
}

const Ripple: React.FC<RippleProps> = ({ className = 'bg-current/20' }) => {
  const [ripples, setRipples] = useState<Array<{x: number, y: number, size: number, id: number}>>([]);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;

    const style = window.getComputedStyle(parent);
    if (style.position === 'static') {
      parent.style.position = 'relative';
    }

    const handleMouseDown = (e: MouseEvent) => {
      if ((parent as HTMLButtonElement).disabled) return;

      const rect = parent.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const id = performance.now();

      setRipples(prev => [...prev, { x, y, size, id }]);
    };

    parent.addEventListener('mousedown', handleMouseDown);
    return () => parent.removeEventListener('mousedown', handleMouseDown);
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden z-0">
      {ripples.map(r => (
        <span
          key={r.id}
          className={`absolute rounded-full animate-ripple ${className}`}
          style={{
            top: r.y,
            left: r.x,
            width: r.size,
            height: r.size,
          }}
          onAnimationEnd={() => {
            setRipples(prev => prev.filter(item => item.id !== r.id));
          }}
        />
      ))}
    </div>
  );
};

export default Ripple;
