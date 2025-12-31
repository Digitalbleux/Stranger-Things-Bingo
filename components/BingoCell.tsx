import React, { useCallback, useRef } from 'react';

interface BingoCellProps {
  index: number;
  text: string;
  isMarked: boolean;
  isFreeSpace?: boolean;
  onToggle: (index: number) => void;
}

export const BingoCell: React.FC<BingoCellProps> = ({ index, text, isMarked, isFreeSpace, onToggle }) => {
  // We use a ref to detect double clicks vs single clicks if we really wanted to strictly separate them,
  // but for mobile responsiveness, a toggle is usually better. 
  // However, the prompt asked for "double press to remove". 
  // We'll implement a logic where tapping marks it, and tapping AGAIN (which is effectively a second press) removes it.
  
  const handleClick = () => {
    onToggle(index);
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        relative flex items-center justify-center p-1 sm:p-2 
        border border-gray-700 bg-[#eaddcf] text-gray-900
        aspect-square cursor-pointer select-none transition-transform active:scale-95
        overflow-hidden shadow-inner
        ${isFreeSpace ? 'bg-[#d4c5b0]' : ''}
      `}
    >
      <div className={`
        text-[10px] sm:text-xs md:text-sm lg:text-base leading-tight text-center font-['Inter'] w-full break-words
        ${isFreeSpace ? 'tracking-wider scale-110' : 'font-semibold'}
      `}>
        {isFreeSpace ? (
          <span className="block font-black text-red-800 tracking-widest drop-shadow-md">
            FREE<br/>SPACE
          </span>
        ) : (
          text
        )}
      </div>

      {isMarked && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] drop-shadow-md overflow-visible">
            <defs>
              <filter id="crayon-texture" x="-20%" y="-20%" width="140%" height="140%">
                {/* Increased frequency and octaves for grainier, waxier look */}
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="5" result="noise" />
                {/* Increased scale for more pronounced jagged edges */}
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
            
            {/* Thicker stroke and deeper red for realistic wax crayon effect - increased to 18 */}
            <g filter="url(#crayon-texture)" stroke="#dc2626" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none">
               {/* First stroke: Top-Left to Bottom-Right */}
               <path d="M 20 20 L 80 80" className="crayon-stroke stroke-1 opacity-90" />
               
               {/* Second stroke: Top-Right to Bottom-Left */}
               <path d="M 80 20 L 20 80" className="crayon-stroke stroke-2 opacity-90" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};