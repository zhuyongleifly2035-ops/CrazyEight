/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { RefreshCw, Info, Trophy, User, Cpu, ChevronRight } from 'lucide-react';
import { Card as CardType, GameState, Suit, Turn } from './types';
import { createDeck, canPlayCard, getSuitSymbol, getSuitColor } from './utils';
import { Card } from './components/Card';
import { SuitSelector } from './components/SuitSelector';

export default function App() {
  const [state, setState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentTurn: 'player',
    currentSuit: null,
    status: 'waiting',
    winner: null,
  });

  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [pendingCard, setPendingCard] = useState<CardType | null>(null);
  const [message, setMessage] = useState("Welcome to Crazy Eights!");

  // Initialize Game
  const startGame = () => {
    const deck = createDeck();
    const playerHand = deck.splice(0, 8);
    const aiHand = deck.splice(0, 8);
    
    // Find a non-8 card for the start of discard pile
    let firstCardIndex = deck.findIndex(c => c.rank !== '8');
    if (firstCardIndex === -1) firstCardIndex = 0;
    const discardPile = [deck.splice(firstCardIndex, 1)[0]];

    setState({
      deck,
      discardPile,
      playerHand,
      aiHand,
      currentTurn: 'player',
      currentSuit: null,
      status: 'playing',
      winner: null,
    });
    setMessage("Your turn! Match the suit or rank.");
  };

  const drawCard = (turn: Turn) => {
    if (state.deck.length === 0) {
      setMessage("Deck is empty! Skipping turn.");
      nextTurn();
      return;
    }

    const newDeck = [...state.deck];
    const drawnCard = newDeck.pop()!;
    
    if (turn === 'player') {
      setState(prev => ({
        ...prev,
        deck: newDeck,
        playerHand: [...prev.playerHand, drawnCard],
      }));
      setMessage("You drew a card.");
      // Check if playable immediately (optional rule, let's keep it simple: draw ends turn if no play)
      // For this version: draw ends turn.
      setTimeout(nextTurn, 800);
    } else {
      setState(prev => ({
        ...prev,
        deck: newDeck,
        aiHand: [...prev.aiHand, drawnCard],
      }));
      setMessage("AI drew a card.");
      setTimeout(nextTurn, 800);
    }
  };

  const playCard = (card: CardType, turn: Turn, selectedSuit?: Suit) => {
    const topCard = state.discardPile[state.discardPile.length - 1];
    
    if (!canPlayCard(card, topCard, state.currentSuit)) {
      if (turn === 'player') setMessage("Invalid move!");
      return;
    }

    const isEight = card.rank === '8';
    
    if (isEight && turn === 'player' && !selectedSuit) {
      setPendingCard(card);
      setShowSuitSelector(true);
      return;
    }

    const finalSuit = isEight ? (selectedSuit || 'hearts') : null;

    setState(prev => {
      const hand = turn === 'player' ? prev.playerHand : prev.aiHand;
      const newHand = hand.filter(c => c.id !== card.id);
      const newDiscard = [...prev.discardPile, card];
      
      const newState = {
        ...prev,
        discardPile: newDiscard,
        [turn === 'player' ? 'playerHand' : 'aiHand']: newHand,
        currentSuit: finalSuit,
      };

      if (newHand.length === 0) {
        newState.status = 'gameover';
        newState.winner = turn;
      }

      return newState;
    });

    if (isEight) {
      setMessage(`${turn === 'player' ? 'You' : 'AI'} played an 8 and chose ${finalSuit}!`);
    } else {
      setMessage(`${turn === 'player' ? 'You' : 'AI'} played ${card.rank} of ${card.suit}.`);
    }

    if (state.status !== 'gameover') {
      setTimeout(nextTurn, 1000);
    }
  };

  const nextTurn = () => {
    setState(prev => ({
      ...prev,
      currentTurn: prev.currentTurn === 'player' ? 'ai' : 'player'
    }));
  };

  // AI Logic
  useEffect(() => {
    if (state.status === 'playing' && state.currentTurn === 'ai') {
      const timer = setTimeout(() => {
        const topCard = state.discardPile[state.discardPile.length - 1];
        const playableCards = state.aiHand.filter(c => canPlayCard(c, topCard, state.currentSuit));

        if (playableCards.length > 0) {
          // AI strategy: play an 8 if it's the only option or randomly
          const eights = playableCards.filter(c => c.rank === '8');
          const others = playableCards.filter(c => c.rank !== '8');
          
          const cardToPlay = others.length > 0 ? others[0] : eights[0];
          
          if (cardToPlay.rank === '8') {
            // AI picks its most frequent suit
            const suitCounts: Record<string, number> = {};
            state.aiHand.forEach(c => {
              suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
            });
            const bestSuit = (Object.keys(suitCounts).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || 'hearts') as Suit;
            playCard(cardToPlay, 'ai', bestSuit);
          } else {
            playCard(cardToPlay, 'ai');
          }
        } else {
          drawCard('ai');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.currentTurn, state.status, state.aiHand, state.discardPile, state.currentSuit]);

  // Win Effect
  useEffect(() => {
    if (state.status === 'gameover' && state.winner === 'player') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [state.status, state.winner]);

  const handleSuitSelect = (suit: Suit) => {
    if (pendingCard) {
      playCard(pendingCard, 'player', suit);
      setPendingCard(null);
      setShowSuitSelector(false);
    }
  };

  const topDiscard = state.discardPile[state.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-emerald-900 text-white font-sans selection:bg-emerald-500 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <span className="text-black font-black text-xl">8</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Crazy Eights</h1>
            <p className="text-xs text-emerald-300 font-medium uppercase tracking-widest">Digital Edition</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <div className="flex items-center gap-2">
              <User size={16} className="text-emerald-400" />
              <span>You: {state.playerHand.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-emerald-400" />
              <span>AI: {state.aiHand.length}</span>
            </div>
          </div>
          <button 
            onClick={startGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Restart Game"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      {/* Main Game Board */}
      <main className="flex-1 relative p-4 flex flex-col items-center justify-between max-w-6xl mx-auto w-full">
        
        {/* AI Hand */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2 text-emerald-300 uppercase text-xs font-bold tracking-widest">
            <Cpu size={14} />
            Opponent Hand
          </div>
          <div className="flex -space-x-12 sm:-space-x-16 overflow-visible h-40 items-center">
            {state.aiHand.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card card={card} isFaceDown disabled className="scale-75 sm:scale-90" />
              </motion.div>
            ))}
            {state.aiHand.length === 0 && state.status === 'playing' && (
              <div className="text-emerald-500 italic">Empty</div>
            )}
          </div>
        </div>

        {/* Center: Deck and Discard */}
        <div className="flex items-center gap-8 sm:gap-16 my-8">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {state.deck.length > 0 ? (
                <Card 
                  card={state.deck[0]} 
                  isFaceDown 
                  onClick={() => state.currentTurn === 'player' && drawCard('player')}
                  disabled={state.currentTurn !== 'player' || state.status !== 'playing'}
                  className="hover:shadow-indigo-500/50"
                />
              ) : (
                <div className="w-24 h-36 sm:w-28 sm:h-40 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/20">
                  Empty
                </div>
              )}
              {state.deck.length > 1 && (
                <div className="absolute -top-1 -left-1 w-full h-full bg-indigo-800 rounded-xl -z-10 border-2 border-white/20" />
              )}
              {state.deck.length > 2 && (
                <div className="absolute -top-2 -left-2 w-full h-full bg-indigo-900 rounded-xl -z-20 border-2 border-white/20" />
              )}
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">
              Draw ({state.deck.length})
            </span>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <AnimatePresence mode="popLayout">
                {topDiscard && (
                  <Card 
                    key={topDiscard.id}
                    card={topDiscard} 
                    disabled 
                    className="shadow-2xl"
                  />
                )}
              </AnimatePresence>
              
              {/* Crazy 8 Indicator */}
              {state.currentSuit && (
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-indigo-500 z-20"
                >
                  <span className={`text-2xl ${getSuitColor(state.currentSuit)}`}>
                    {getSuitSymbol(state.currentSuit)}
                  </span>
                </motion.div>
              )}
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">
              Discard
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-black/40 px-6 py-3 rounded-full border border-white/10 shadow-xl mb-4 max-w-md text-center">
          <p className="text-sm font-medium text-emerald-50">{message}</p>
        </div>

        {/* Player Hand */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 text-emerald-300 uppercase text-xs font-bold tracking-widest">
            <User size={14} />
            Your Hand
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 max-w-4xl">
            {state.playerHand.map((card) => (
              <Card
                key={card.id}
                card={card}
                onClick={() => state.currentTurn === 'player' && playCard(card, 'player')}
                disabled={state.currentTurn !== 'player' || state.status !== 'playing'}
                isPlayable={state.currentTurn === 'player' && canPlayCard(card, topDiscard, state.currentSuit)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showSuitSelector && (
          <SuitSelector onSelect={handleSuitSelect} />
        )}

        {state.status === 'waiting' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="text-center p-8">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-24 h-24 bg-yellow-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-yellow-500/40"
              >
                <span className="text-black font-black text-5xl">8</span>
              </motion.div>
              <h2 className="text-5xl font-black mb-4 tracking-tighter">CRAZY EIGHTS</h2>
              <p className="text-emerald-300 mb-12 max-w-xs mx-auto text-lg">The classic card game of strategy and luck. Can you empty your hand first?</p>
              <button 
                onClick={startGame}
                className="bg-white text-emerald-900 px-10 py-4 rounded-2xl font-bold text-xl hover:bg-emerald-100 transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
              >
                Play Game <ChevronRight />
              </button>
            </div>
          </motion.div>
        )}

        {state.status === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="bg-white text-gray-900 p-12 rounded-[3rem] shadow-2xl text-center max-w-sm mx-4">
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${state.winner === 'player' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                <Trophy size={40} />
              </div>
              <h2 className="text-4xl font-black mb-2 tracking-tighter">
                {state.winner === 'player' ? 'YOU WON!' : 'AI WON!'}
              </h2>
              <p className="text-gray-500 mb-8 font-medium">
                {state.winner === 'player' ? 'Incredible strategy! You cleared all your cards.' : 'Better luck next time! The AI outplayed you.'}
              </p>
              <button 
                onClick={startGame}
                className="w-full bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="p-4 text-center text-emerald-500/50 text-[10px] uppercase tracking-widest font-bold">
        Crazy Eights v1.0 • Built with React & Tailwind
      </footer>
    </div>
  );
}
