import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType } from '../types';
import { getSuitSymbol, getSuitColor } from '../utils';

interface CardProps {
  card: CardType;
  isFaceDown?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isPlayable?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  isFaceDown = false, 
  onClick, 
  disabled = false,
  className = "",
  isPlayable = false
}) => {
  const symbol = getSuitSymbol(card.suit);
  const colorClass = getSuitColor(card.suit);

  return (
    <motion.div
      layoutId={card.id}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={!disabled && !isFaceDown ? { y: -20, scale: 1.05 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative w-24 h-36 sm:w-28 sm:h-40 rounded-xl shadow-lg cursor-pointer transition-all duration-200
        ${isFaceDown ? 'bg-indigo-700 border-4 border-white' : 'bg-white border-2 border-gray-200'}
        ${isPlayable && !isFaceDown ? 'ring-4 ring-yellow-400 shadow-yellow-200' : ''}
        ${disabled ? 'cursor-not-allowed opacity-80' : ''}
        flex flex-col items-center justify-center
        ${className}
      `}
    >
      {isFaceDown ? (
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
          <div className="w-full h-full bg-indigo-800 opacity-50 flex flex-wrap gap-1 p-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-white/10" />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                <span className="text-white font-bold text-xl">8</span>
             </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`absolute top-2 left-2 flex flex-col items-center leading-none ${colorClass}`}>
            <span className="text-lg font-bold">{card.rank}</span>
            <span className="text-sm">{symbol}</span>
          </div>
          
          <div className={`text-5xl ${colorClass}`}>
            {symbol}
          </div>

          <div className={`absolute bottom-2 right-2 flex flex-col items-center leading-none rotate-180 ${colorClass}`}>
            <span className="text-lg font-bold">{card.rank}</span>
            <span className="text-sm">{symbol}</span>
          </div>
        </>
      )}
    </motion.div>
  );
};
