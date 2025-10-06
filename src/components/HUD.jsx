export default function HUD({ score, status }) {
  return (
    <div className="pointer-events-none absolute top-0 left-0 right-0 z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-xs uppercase tracking-widest text-cyan-300/80">Mode</div>
        <div className="text-xs uppercase tracking-widest text-cyan-300/80">Score</div>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="text-sm md:text-base font-medium text-white/80">
          {status === 'idle' && 'Ready'}
          {status === 'running' && 'Racing'}
          {status === 'over' && 'Crashed'}
        </div>
        <div className="text-2xl md:text-3xl font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]">{Math.floor(score)}</div>
      </div>
    </div>
  );
}
