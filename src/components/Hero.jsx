import Spline from '@splinetool/react-spline';

export default function Hero() {
  return (
    <section className="relative w-full h-[60vh] md:h-[70vh] bg-black">
      <div className="absolute inset-0">
        <Spline
          scene="https://prod.spline.design/sbnqZNZdJSLK7U2A/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black pointer-events-none" />
      <div className="relative z-10 h-full max-w-6xl mx-auto px-4 flex items-end pb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,255,255,0.35)]">
            Neon Night Drive
          </h1>
          <p className="mt-3 text-white/80 max-w-xl">
            Arcade-speed endless racer. Dodge neon traffic on a cyberpunk highway.
          </p>
        </div>
      </div>
    </section>
  );
}
