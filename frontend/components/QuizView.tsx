
import React, { useEffect, useState } from 'react';
import { ChevronRight, X, Check, RotateCcw, Eye, ArrowLeft, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { QuizData } from '../types';

interface QuizViewProps {
  quiz: QuizData;
  sourceCount: number;
  onClose: () => void;
  onAdvanceTopic?: () => void;
  theme: 'light' | 'dark';
}

const QuizView: React.FC<QuizViewProps> = ({ quiz, sourceCount, onClose, onAdvanceTopic, theme }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [didAdvance, setDidAdvance] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleNext = () => {
    const newAnswers = [...userAnswers, selectedOption];
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setShowSummary(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setUserAnswers([]);
    setShowSummary(false);
    setIsReviewMode(false);
    setDidAdvance(false);
  };

  const calculateResults = () => {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    userAnswers.forEach((answer, index) => {
      if (answer === null) {
        skipped++;
      } else if (answer === quiz.questions[index].correctAnswerIndex) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const accuracy = quiz.questions.length > 0 ? Math.round((correct / quiz.questions.length) * 100) : 0;

    return { correct, incorrect, skipped, accuracy };
  };

  const results = showSummary ? calculateResults() : null;

  useEffect(() => {
    if (!showSummary || !results || didAdvance || !onAdvanceTopic) return;
    if (results.accuracy >= 85) {
      onAdvanceTopic();
      setDidAdvance(true);
    }
  }, [showSummary, results, didAdvance, onAdvanceTopic]);

  const bgColor = theme === 'dark' ? 'bg-[#121214]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderColor = theme === 'dark' ? 'border-white/5' : 'border-gray-200';

  if (isReviewMode) {
    return (
      <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md`}>
        <div className={`w-full max-w-3xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border ${theme === 'dark' ? 'bg-[#1c1c21] border-gray-800' : 'bg-white border-gray-100'} animate-in zoom-in-95 duration-200`}>
          <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsReviewMode(false)}
                className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className={`text-xl font-bold tracking-tight ${textColor}`}>Javoblarni ko'rish</h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {quiz.questions.map((q, idx) => {
              const userAnswer = userAnswers[idx];
              const isCorrect = userAnswer === q.correctAnswerIndex;
              const isSkipped = userAnswer === null || userAnswer === undefined;

              return (
                <div key={idx} className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#25252b] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="mt-1">
                      {isCorrect ? (
                        <CheckCircle2 className="text-green-500" size={24} />
                      ) : isSkipped ? (
                        <MinusCircle className="text-yellow-500" size={24} />
                      ) : (
                        <XCircle className="text-red-500" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        Savol {idx + 1}
                      </div>
                      <h4 className={`text-lg font-medium leading-relaxed ${textColor}`}>{q.question}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} ${!isCorrect && !isSkipped ? 'border-red-500/30' : 'border-transparent'}`}>
                      <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Sizning javobingiz</div>
                      <div className={`text-sm ${userAnswer !== null ? textColor : 'text-gray-500 italic'}`}>
                        {userAnswer !== null ? q.options[userAnswer as number] : "Belgilanmadi"}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-green-900/10 border-green-500/30' : 'bg-green-50 border-green-500/30'}`}>
                      <div className="text-[10px] uppercase font-bold text-green-500 mb-1">To'g'ri javob</div>
                      <div className={`text-sm font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                        {q.options[q.correctAnswerIndex]}
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-[#1c1c21]' : 'bg-gray-100/50'}`}>
                    <div className="text-[10px] uppercase font-bold text-indigo-500 mb-1">Tushuntirish</div>
                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`p-6 border-t flex justify-center ${theme === 'dark' ? 'border-gray-800 bg-[#25252b]' : 'border-gray-100 bg-gray-50'}`}>
             <button 
              onClick={handleRestart}
              className={`flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 active:scale-95`}
            >
              <RotateCcw size={18} />
              Testni qayta boshlash
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSummary) {
    const { correct, incorrect, skipped, accuracy } = results || { correct: 0, incorrect: 0, skipped: 0, accuracy: 0 };
    return (
      <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md`}>
        <div className={`w-full max-w-2xl p-12 rounded-3xl overflow-hidden flex flex-col items-center text-center shadow-2xl border ${theme === 'dark' ? 'bg-[#1c1c21] border-gray-800' : 'bg-white border-gray-100'} animate-in zoom-in-95 duration-200`}>
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-600/40 rotate-12">
             <Check size={48} />
          </div>
          <h2 className={`text-3xl font-bold mb-10 ${textColor}`}>Ajoyib! Test yakunlandi</h2>

          <div className="grid grid-cols-3 gap-4 w-full mb-10">
            <div className={`p-6 rounded-2xl flex flex-col items-start justify-between h-32 ${theme === 'dark' ? 'bg-[#25252b]' : 'bg-gray-50'}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Natija</span>
              <span className={`text-3xl font-bold ${textColor}`}>{correct} / {quiz.questions.length}</span>
            </div>
            <div className={`p-6 rounded-2xl flex flex-col items-start justify-between h-32 ${theme === 'dark' ? 'bg-[#25252b]' : 'bg-gray-50'}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Aniqlik</span>
              <span className={`text-3xl font-bold ${textColor}`}>{accuracy}%</span>
            </div>
            <div className={`p-6 rounded-2xl flex flex-col gap-2 justify-center h-32 ${theme === 'dark' ? 'bg-[#25252b]' : 'bg-gray-50'}`}>
              <div className="flex justify-between w-full text-xs">
                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>To'g'ri</span>
                <span className={`font-bold text-green-500`}>{correct}</span>
              </div>
              <div className="flex justify-between w-full text-xs">
                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>Noto'g'ri</span>
                <span className={`font-bold text-red-500`}>{incorrect}</span>
              </div>
              <div className="flex justify-between w-full text-xs">
                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>O'tkazib yuborildi</span>
                <span className={`font-bold text-yellow-500`}>{skipped}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button 
              onClick={() => setIsReviewMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all border ${theme === 'dark' ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              <Eye size={18} />
              Javoblarni ko'rish
            </button>
            <button 
              onClick={handleRestart}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30`}
            >
              <RotateCcw size={18} />
              Testni qayta boshlash
            </button>
          </div>
          <button 
            onClick={onClose}
            className={`mt-6 text-sm font-medium ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Yopish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md`}>
      <div className={`w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl border ${theme === 'dark' ? 'bg-[#1c1c21] border-gray-800' : 'bg-white border-gray-100'} animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${textColor}`}>{quiz.title}</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {sourceCount} ta manba asosida
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          <div className={`text-xs font-bold mb-6 tracking-widest ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
            {currentQuestionIndex + 1} / {quiz.questions.length}
          </div>

          <h3 className={`text-xl font-bold leading-relaxed mb-10 ${textColor}`}>
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectOption = index === currentQuestion.correctAnswerIndex;
              const showResult = selectedOption !== null;

              let buttonClass = theme === 'dark' ? 'bg-[#25252b] text-gray-300' : 'bg-gray-50 text-gray-700';
              let borderColor = 'border-transparent';

              if (showResult) {
                if (isCorrectOption) {
                  buttonClass = theme === 'dark' ? 'bg-green-900/10 text-green-400' : 'bg-green-50 text-green-600';
                  borderColor = 'border-green-500/50';
                } else if (isSelected) {
                  buttonClass = theme === 'dark' ? 'bg-red-900/10 text-red-400' : 'bg-red-50 text-red-600';
                  borderColor = 'border-red-500/50';
                }
              } else {
                buttonClass += theme === 'dark' ? ' hover:bg-[#2e2e36]' : ' hover:bg-gray-100';
              }

              const label = String.fromCharCode(65 + index); // A, B, C, D

              return (
                <button
                  key={index}
                  disabled={showResult}
                  onClick={() => setSelectedOption(index)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all flex flex-col gap-2 ${buttonClass} ${borderColor}`}
                >
                  <div className="flex gap-4 items-center">
                    <span className="font-bold text-base">{label}.</span>
                    <span className="text-sm font-medium">{option}</span>
                  </div>

                  {showResult && isCorrectOption && (
                    <div className="mt-1 pl-8 animate-in slide-in-from-top-1 duration-300">
                      <div className="text-green-500 font-bold text-[11px] mb-1">
                        {isSelected ? "To'g'ri!" : "To'g'ri javob"}
                      </div>
                      <p className={`text-[12px] leading-relaxed ${theme === 'dark' ? 'text-green-400/90' : 'text-green-600/90'}`}>
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-8 border-t flex items-center justify-end ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleNext()}
              className={`text-sm font-medium mr-4 ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              O'tkazib yuborish
            </button>
            <button 
              onClick={handleNext}
              disabled={selectedOption === null}
              className={`flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none active:scale-95`}
            >
              {currentQuestionIndex === quiz.questions.length - 1 ? 'Tugallash' : 'Keyingisi'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
