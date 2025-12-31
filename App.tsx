import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BingoCellData, WinMode } from './constants';
import { generateBingoCard, checkWin } from './utils/gameLogic';
import { BingoCell } from './components/BingoCell';
import { SettingsMenu } from './components/SettingsMenu';
import { Balloons } from './components/Balloons';

// --- GODMODE AUDIO ENGINE ---
// Pure Web Audio API implementation to avoid 403 errors and loading latency
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    try {
      // Initialize on user interaction to comply with browser autoplay policies
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5; // Master volume
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesize a wax crayon scribble sound using filtered noise
  playMark() {
    if (!this.ctx || !this.masterGain) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Create noise buffer
    const bufferSize = this.ctx.sampleRate * 0.2; // 200ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it sound like wax/paper (Bandpass ~500Hz)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400 + Math.random() * 200, t); // Randomize for realism
    filter.Q.value = 0.7;

    const gain = this.ctx.createGain();
    // ADSR Envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.2);
  }

  // Synthesize a quick paper flip/eraser sound
  playUnmark() {
    if (!this.ctx || !this.masterGain) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle'; // Softer than noise
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Stranger Things inspired Arpeggio (Cmaj7 synth style)
  playWin() {
    if (!this.ctx || !this.masterGain) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Notes: C3, E3, G3, B3, C4
    const notes = [130.81, 164.81, 196.00, 246.94, 261.63];
    
    notes.forEach((freq, i) => {
      const startTime = t + (i * 0.15);
      
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth'; // Iconic 80s synth shape
      osc.frequency.value = freq;
      
      // Low pass filter sweep
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, startTime);
      filter.frequency.exponentialRampToValueAtTime(4000, startTime + 0.1); // "Wub" opening effect
      
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5); // Long release

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(startTime);
      osc.stop(startTime + 1.5);
    });

    // Add a deep bass drone
    const bass = this.ctx.createOscillator();
    bass.type = 'square';
    bass.frequency.value = 65.41; // C2
    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0, t);
    bassGain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 3);
    
    bass.connect(bassGain);
    bassGain.connect(this.masterGain);
    bass.start(t);
    bass.stop(t + 3);
  }
}

const App: React.FC = () => {
  const [cards, setCards] = useState<BingoCellData[]>([]);
  const [markedIndices, setMarkedIndices] = useState<Set<number>>(new Set());
  const [gameMode, setGameMode] = useState<WinMode>('STANDARD');
  const [hasWon, setHasWon] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  
  // Parallax Refs
  const headerBgRef = useRef<HTMLDivElement>(null);
  const headerContentRef = useRef<HTMLDivElement>(null);

  // Audio Engine Ref
  const soundEngine = useRef<SoundEngine | null>(null);

  useEffect(() => {
    // Initialize audio engine
    soundEngine.current = new SoundEngine();
  }, []);

  const playSound = (type: 'mark' | 'unmark' | 'win') => {
    if (!soundEngine.current) return;
    
    switch (type) {
      case 'mark': soundEngine.current.playMark(); break;
      case 'unmark': soundEngine.current.playUnmark(); break;
      case 'win': soundEngine.current.playWin(); break;
    }
  };

  // Initial load
  useEffect(() => {
    startNewGame();

    // Parallax Scroll Handler
    const handleScroll = () => {
      const scrolled = window.scrollY;
      
      if (headerBgRef.current) {
        headerBgRef.current.style.transform = `translateY(${scrolled * 0.15}px) scale(1.1)`;
      }
      if (headerContentRef.current) {
        headerContentRef.current.style.transform = `translateY(${scrolled * 0.3}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const startNewGame = () => {
    const newCards = generateBingoCard();
    setCards(newCards);
    setMarkedIndices(new Set([12])); // Free space always marked
    setHasWon(false);
    setShowWinOverlay(false);
  };

  const handleCellToggle = (index: number) => {
    // Explicitly type the new Set to ensure it is Set<number>
    const newMarked = new Set<number>(markedIndices);

    if (newMarked.has(index)) {
      newMarked.delete(index);
      playSound('unmark');
    } else {
      newMarked.add(index);
      playSound('mark');
    }
    setMarkedIndices(newMarked);

    // Check win condition
    const isWin = checkWin(Array.from(newMarked), gameMode);
    
    if (isWin && !hasWon) {
      setHasWon(true);
      setShowWinOverlay(true);
      playSound('win');
      setTimeout(() => setShowWinOverlay(false), 8000);
    } else if (!isWin) {
      setHasWon(false);
    }
  };

  // Memoize grid rendering
  const gridCells = useMemo(() => {
    return cards.map((card, index) => (
      <BingoCell
        key={card.id}
        index={index}
        text={card.text}
        isMarked={markedIndices.has(index)}
        isFreeSpace={card.isFreeSpace}
        onToggle={handleCellToggle}
      />
    ));
  }, [cards, markedIndices]);

  return (
    <div className="min-h-screen flex flex-col items-center pb-12 relative overflow-hidden">
      {/* Background Overlay for darkness */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none z-0"></div>

      {/* Win Animation */}
      {(hasWon && showWinOverlay) && <Balloons />}

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-2xl px-4 flex flex-col items-center">
        
        {/* Header Section */}
        <header className="mt-8 mb-6 text-center w-full relative">
           {/* Header Container with CSS-only atmosphere to avoid broken images */}
           <div className="relative h-48 md:h-60 w-full mb-4 rounded-lg overflow-hidden border-2 border-red-900/50 shadow-[0_0_30px_rgba(220,38,38,0.3)] bg-gray-900 group z-10">
              
              {/* Parallax Background Layer Group */}
              <div ref={headerBgRef} className="absolute inset-0 w-full h-full scale-110 origin-center transition-transform duration-75 ease-out will-change-transform">
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-black to-black opacity-80"></div>
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
                {/* Bottom fade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              </div>
              
              {/* Parallax Content Layer */}
              <div ref={headerContentRef} className="absolute inset-0 flex items-center justify-center flex-col pt-4 z-20 will-change-transform">
                <div className="w-64 md:w-80 lg:w-[28rem] relative transition-transform duration-700 hover:scale-105">
                  {/* Stranger Things Logo */}
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Stranger_Things_logo.png/640px-Stranger_Things_logo.png" 
                    alt="Stranger Things"
                    className="w-full h-auto drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] filter brightness-110 contrast-125"
                  />
                </div>
                <h2 className="text-red-500 font-serif text-sm md:text-xl tracking-[0.2em] mt-4 text-shadow-lg animate-pulse font-bold">
                  Season 5 Finale Bingo
                </h2>
              </div>
           </div>
        </header>

        {/* Controls - INCREASED Z-INDEX TO 30 TO FIX DROPDOWN CLIPPING */}
        <div className="w-full flex justify-between items-center mb-4 px-2 relative z-30">
          <div className="text-gray-400 text-xs md:text-sm font-['Arial']">
            Mode: <span className="text-red-400 font-bold">{gameMode}</span>
          </div>
          <SettingsMenu 
            currentMode={gameMode} 
            onModeChange={(mode) => {
              setGameMode(mode);
              // Re-check win immediately upon mode change
              const isWin = checkWin(Array.from(markedIndices), mode);
              setHasWon(isWin);
              if(isWin) {
                setShowWinOverlay(true);
                playSound('win');
              }
            }} 
            onNewGame={startNewGame} 
          />
        </div>

        {/* Bingo Card */}
        <div className="w-full aspect-square bg-[#f3e5d8] p-2 sm:p-3 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-gray-800 relative z-20">
          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
          
          {/* Grid */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 h-full w-full relative z-10">
            {gridCells}
          </div>
        </div>

        {/* Footer / Instructions */}
        <div className="mt-8 text-center space-y-2 relative z-20">
          <p className="text-gray-500 text-xs font-mono max-w-md mx-auto">
            Tap a square to mark it with a crayon. Tap again to remove the mark. 
            Get 5 in a row to win!
          </p>
          {hasWon && (
            <div className="animate-bounce text-red-500 font-stranger text-2xl mt-4 text-glow-red">
              BINGO! YOU SURVIVED!
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default App;