import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { FlashcardData } from '../types';

interface FlashcardViewProps {
  data: FlashcardData;
  sourceCount: number;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ data, sourceCount, onClose, theme }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');

  const cards = (data?.cards || []).map((card: any) => {
    const question = card?.question || card?.front || card?.q || '';
    const answer = card?.answer || card?.back || card?.a || '';
    return { question, answer };
  }).filter((card: any) => card.question || card.answer);
  const currentCard = cards[currentIndex];

  // Agar cards massivi bo'sh yoki currentIndex noto'g'ri bo'lsa, yopish
  useEffect(() => {
    if (!cards.length || currentIndex < 0 || currentIndex >= cards.length) {
      onClose();
      return;
    }
  }, [cards, currentIndex, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection('right');
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
        setDirection('none');
      }, 200);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection('left');
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsFlipped(false);
        setDirection('none');
      }, 200);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setDirection('none');
  };

  // Agar kartalar mavjud bo'lmasa, hech narsani ko'rsatma
  if (!cards.length || !currentCard) {
    return (
      <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-[#1a1c1e] text-white`}>
        <div className="text-center">
          <p className="text-xl mb-4">Kartochkalar topilmadi</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    );
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subTextColor = theme === 'dark' ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-[#1a1c1e] text-white`}>
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-green-600/5 rounded-full blur-[120px] -translate-y-1/2"></div>
      </div>

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{data?.title || 'Kartochkalar'}</h2>
          <p className="text-sm mt-1 text-gray-500">{sourceCount} ta manba asosida</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="p-2.5 rounded-full hover:bg-white/10 text-gray-400 transition-all"
            title="Boshidan boshlash"
          >
            <RotateCcw size={22} />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-white/10 text-gray-400 transition-all"
          >
            <X size={26} />
          </button>
        </div>
      </div>

      <div className="text-center mb-12 text-[14px] font-medium text-gray-500 max-w-xl animate-in fade-in duration-700">
        Kartochkani ag'darish uchun Bo'shliq (Space) tugmasini bosing. <br />
        ← va → tugmalari orqali ular o'rtasida almashing.
      </div>

      {/* Flashcard Component Container */}
      <div className="relative w-full max-w-lg h-[500px] perspective-1000 flex items-center justify-center">
        {/* Navigation Dots on Sides */}
        <div className="absolute left-[-100px] flex items-center justify-center">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-[#2a2d31] hover:bg-[#3a3e44] disabled:opacity-0 text-white`}
          >
            <ChevronLeft size={28} />
          </button>
        </div>

        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full h-full transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''} ${direction === 'right' ? '-translate-x-10 opacity-0' : direction === 'left' ? 'translate-x-10 opacity-0' : 'translate-x-0 opacity-100'}`}
        >
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-12 text-center border border-gray-800 bg-[#25282c]">
            <div className="text-3xl font-medium leading-relaxed text-white">
              {currentCard.question || 'Savol mavjud emas'}
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[13px] font-medium text-gray-500">
              Javobni ko'rish
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-12 text-center border border-gray-800 bg-[#25282c] rotate-y-180">
            <div className="text-2xl font-medium leading-relaxed text-gray-300">
              {currentCard.answer || 'Javob mavjud emas'}
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[13px] font-medium text-gray-500">
              Savolga qaytish
            </div>
          </div>
        </div>

        <div className="absolute right-[-100px] flex items-center justify-center">
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-[#2a2d31] hover:bg-[#3a3e44] disabled:opacity-0 text-white`}
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="mt-20 w-full max-w-lg">
        <div className="flex items-center gap-6">
          <div className="flex-1 h-[2px] bg-white/10 rounded-full relative">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 relative"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
            </div>
          </div>
          <div className="text-[13px] font-medium text-gray-500 whitespace-nowrap">
            Kartochek: {currentIndex + 1} / {cards.length}
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardView;
