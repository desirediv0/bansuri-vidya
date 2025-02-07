'use client';

import React, { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { cn } from '@/lib/utils';

interface EarthProps {
  className?: string;
}

const Earth: React.FC<EarthProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let width = 0;
    const onResize = () => {
      if (canvasRef.current) {
        const { offsetWidth } = canvasRef.current;
        width = Math.min(offsetWidth, window.innerHeight * 0.8);
      }
    };
    
    window.addEventListener('resize', onResize);
    onResize();
    let phi = 0;

    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 40000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.8, 0.1, 0.1],
      glowColor: [0.8, 0.1, 0.1],
      scale: 1.2,
      opacity: 0.8,
      markers: [
        { 
          location: [28.6139, 77.2090], 
          size: 0.1,
        }
      ],
      onRender: (state: any) => {
        state.phi = phi;
        phi += 0.003;
      }
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className={cn(
      'relative flex items-center justify-center w-full md:h-screen md:max-h-[800px]',
      className
    )}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100vh',
          aspectRatio: '1',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};

export default Earth;