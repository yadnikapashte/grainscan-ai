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
      
      // Draw background image with high opacity (75%) for better clarity
      ctx.globalAlpha = 0.75;
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;

      // Filter for grains to display (showing all classes)
      const displayGrains = grains;
      if (displayGrains.length === 0) return;

      // Quality to Heat Color Map
      const HEAT_COLORS = {
        Normal: '#2D6A4F',
        Broken: '#D00000',
        Chalky: '#3AB7BF',
        Discolored: '#FFB800'
      };

      // Draw heat blobs
      displayGrains.forEach(defect => {
        const [x, y, w, h] = defect.bbox;
        const centerX = (x + w / 2) * (canvas.width / imgWidth);
        const centerY = (y + h / 2) * (canvas.height / imgHeight);
        const color = HEAT_COLORS[defect.quality] || '#E9840A';

        // Create a radial gradient for a "hot" look with higher intensity and larger radius
        const radius = Math.min(canvas.width, canvas.height) / 7;
        const gradient = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.4, `${color}88`); // 88 is ~50% alpha (increased from 44)
        gradient.addColorStop(1, 'transparent');

        ctx.globalCompositeOperation = 'screen'; // additive glow effect
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; // restore default

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
        <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3 shadow-2xl">
          <div className="flex -space-x-1">
            <div className="w-2.5 h-2.5 rounded-full bg-status-discolored shadow-[0_0_8px_rgba(255,184,0,0.6)]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-status-chalky shadow-[0_0_8px_rgba(58,183,191,0.6)]"></div>
          </div>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
            Spatial Distribution Map
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 p-5 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F] shadow-[0_0_10px_rgba(45,106,79,0.8)]"></div>
                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Normal Distribution</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D00000] shadow-[0_0_10px_rgba(208,0,0,0.8)]"></div>
                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Broken Heat</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3AB7BF] shadow-[0_0_10px_rgba(58,183,191,0.8)]"></div>
                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Chalky Heat</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.8)]"></div>
                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Discolored Heat</span>
            </div>
            <div className="w-full h-1 rounded-full bg-gradient-to-r from-transparent via-primary/40 to-primary/80 mt-1" />
        </div>
      </div>
    </div>
  );
}
