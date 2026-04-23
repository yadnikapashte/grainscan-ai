import { useEffect, useRef } from 'react';

/**
 * DefectHeatmap - Enhanced with image background support and high-intensity rendering.
 */
export default function DefectHeatmap({ grains, imgWidth, imgHeight, imageUrl, className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !grains || grains.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Setup background image
    const bgImage = new Image();
    bgImage.src = imageUrl;
    
    bgImage.onload = () => {
      // Clear and draw background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background image with low opacity (30%)
      ctx.globalAlpha = 0.3;
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;

      // Filter for defects
      const defects = grains.filter(g => g.quality !== 'Normal');
      if (defects.length === 0) return;

      // Quality to Heat Color Map
      const HEAT_COLORS = {
        Broken: '#D00000',
        Chalky: '#3AB7BF',
        Discolored: '#FFB800'
      };

      // Draw heat blobs
      defects.forEach(defect => {
        const [x, y, w, h] = defect.bbox;
        const centerX = (x + w / 2) * (canvas.width / imgWidth);
        const centerY = (y + h / 2) * (canvas.height / imgHeight);
        const color = HEAT_COLORS[defect.quality] || '#E9840A';

        // Create a radial gradient for a "hot" look
        const radius = Math.min(canvas.width, canvas.height) / 8;
        const gradient = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, `${color}44`); // 44 is hex alpha
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Add a small core point
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Fallback if image doesn't load or isn't provided
    if (!imageUrl) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#F5F3EE';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

  }, [grains, imgWidth, imgHeight, imageUrl]);

  return (
    <div className={`relative bg-background-soft rounded-2xl border border-surface-border overflow-hidden shadow-inner ${className}`}>
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <canvas
        ref={canvasRef}
        width={imgWidth || 800}
        height={imgHeight || 600}
        className="w-full h-full object-contain"
      />
      
      {/* Legend & Labels */}
      <div className="absolute top-6 left-6 block">
        <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="flex -space-x-1">
            <div className="w-2 h-2 rounded-full bg-status-discolored"></div>
            <div className="w-2 h-2 rounded-full bg-status-chalky"></div>
          </div>
          <p className="text-[10px] font-bold text-white uppercase tracking-widest">
            Spatial Distribution Map
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D00000]"></div>
                <span className="text-[9px] font-bold text-text-header/60 uppercase">Broken Heat</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#3AB7BF]"></div>
                <span className="text-[9px] font-bold text-text-header/60 uppercase">Chalky Heat</span>
            </div>
            <div className="w-24 h-1 rounded-full bg-gradient-to-r from-transparent to-primary mt-1" />
        </div>
      </div>
    </div>
  );
}
