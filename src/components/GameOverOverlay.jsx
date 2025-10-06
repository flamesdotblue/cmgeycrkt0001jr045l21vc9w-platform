export default function GameOverOverlay({ visible, score, onRestart }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md mx-auto text-center p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-black/70 shadow-[0_0_40px_-10px_rgba(255,0,128,0.35)]">
        <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">Game Over</h2>
        <p className="text-white/80 mb-6">Final Score</p>
        <div className="text-5xl font-black text-cyan-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.6)] mb-8">{Math.floor(score)}</div>
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold shadow-[0_10px_30px_-10px_rgba(255,0,200,0.6)] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
