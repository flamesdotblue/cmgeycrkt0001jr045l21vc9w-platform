import { useState, useCallback } from 'react';
import Hero from './components/Hero';
import HUD from './components/HUD';
import GameCanvas from './components/GameCanvas';
import GameOverOverlay from './components/GameOverOverlay';

export default function App() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'over'
  const [score, setScore] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const [startKey, setStartKey] = useState(0);

  const handleStart = useCallback(() => {
    setScore(0);
    setStatus('running');
    setStartKey((k) => k + 1);
  }, []);

  const handleGameOver = useCallback((finalScore) => {
    setScore(finalScore);
    setStatus('over');
  }, []);

  const handleScore = useCallback((s) => {
    setScore(s);
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setStatus('idle');
    setRestartKey((k) => k + 1);
    // User will press Start again to run
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-x-hidden">
      <Hero />

      <div className="relative max-w-6xl mx-auto px-4 w-full">
        <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-gradient-to-b from-slate-900 via-black to-black/90 shadow-[0_0_60px_-10px_rgba(0,255,255,0.2)]">
          <HUD score={score} status={status} />
          <GameCanvas
            status={status}
            onStart={handleStart}
            onScore={handleScore}
            onGameOver={handleGameOver}
            startKey={startKey}
            restartKey={restartKey}
          />
          <GameOverOverlay
            visible={status === 'over'}
            score={score}
            onRestart={handleRestart}
          />
        </div>
      </div>

      <footer className="max-w-6xl mx-auto px-4 py-10 text-center text-sm text-white/50">
        Neon Night Drive — Endless Cyberpunk Racer
      </footer>
    </div>
  );
}
