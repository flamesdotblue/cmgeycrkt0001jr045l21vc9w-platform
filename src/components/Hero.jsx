export default function Hero() {
  return (
    <section className="relative w-full h-[52vh] md:h-[64vh] bg-black overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(1200px 600px at 50% 120%, rgba(34,211,238,0.18), rgba(0,0,0,0))'
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(800px 400px at 20% 0%, rgba(217,70,239,0.16), rgba(0,0,0,0))'
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))'
        }} />
        <div className="absolute -bottom-20 inset-x-0 h-[60%] blur-2xl opacity-60 bg-[conic-gradient(at_50%_120%,#06b6d4,transparent_25%,#a78bfa_50%,transparent_75%,#ec4899)]" />
      </div>

      <div className="relative z-10 h-full max-w-6xl mx-auto px-4 flex items-end pb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,255,255,0.35)]">
            Neon Night Drive
          </h1>
          <p className="mt-3 text-white/80 max-w-xl">
            Arcade-speed endless racer. Dodge neon traffic on a cyberpunk highway.
          </p>
          <p className="mt-1 text-xs text-white/50">Press Enter/Space or Tap to Start</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,0.4),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(168,85,247,0.3),transparent_40%),radial-gradient(circle_at_30%_90%,rgba(236,72,153,0.25),transparent_40%)]" />
    </section>
  );
}
