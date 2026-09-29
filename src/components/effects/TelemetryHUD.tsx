import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export const TelemetryHUD: React.FC = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    gpu: 79,
    cpu: 16,
    lat: 11,
  });

  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextFps = Math.floor(Math.random() * (60 - 58 + 1)) + 58;
      const nextGpu = Math.floor(Math.random() * (85 - 75 + 1)) + 75;
      const nextCpu = Math.floor(Math.random() * (22 - 12 + 1)) + 12;
      const nextLat = Math.floor(Math.random() * (15 - 8 + 1)) + 8;

      setMetrics({
        fps: nextFps,
        gpu: nextGpu,
        cpu: nextCpu,
        lat: nextLat,
      });

      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 450);
      return () => clearTimeout(timer);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-full bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg shadow-blue-950/20 text-xs select-none transition-all duration-300"
      aria-label="Telemetría en Vivo del Sistema"
    >
      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline text-[11px] uppercase tracking-wider font-semibold">Telemetría</span>
      </div>

      <div className="w-px h-3 bg-slate-700/80" />

      {/* FPS */}
      <div className="flex items-baseline gap-1">
        <span className="text-[10px] text-slate-400 font-semibold">FPS</span>
        <span
          className={`font-mono font-bold transition-all duration-300 ${
            flashing ? 'text-purple-300 scale-110 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'text-sky-400'
          }`}
        >
          {metrics.fps}
        </span>
      </div>

      <div className="w-px h-3 bg-slate-700/80" />

      {/* GPU */}
      <div className="flex items-baseline gap-1">
        <span className="text-[10px] text-slate-400 font-semibold">GPU</span>
        <span
          className={`font-mono font-bold transition-all duration-300 ${
            flashing ? 'text-purple-300 scale-110 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'text-sky-400'
          }`}
        >
          {metrics.gpu}%
        </span>
      </div>

      <div className="w-px h-3 bg-slate-700/80" />

      {/* CPU */}
      <div className="flex items-baseline gap-1">
        <span className="text-[10px] text-slate-400 font-semibold">CPU</span>
        <span
          className={`font-mono font-bold transition-all duration-300 ${
            flashing ? 'text-purple-300 scale-110 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'text-sky-400'
          }`}
        >
          {metrics.cpu}%
        </span>
      </div>

      <div className="w-px h-3 bg-slate-700/80" />

      {/* LAT */}
      <div className="flex items-baseline gap-1">
        <span className="text-[10px] text-slate-400 font-semibold">LAT</span>
        <span
          className={`font-mono font-bold transition-all duration-300 ${
            flashing ? 'text-purple-300 scale-110 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'text-emerald-400'
          }`}
        >
          {metrics.lat}ms
        </span>
      </div>
    </div>
  );
};
