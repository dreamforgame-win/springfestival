
import React, { useState, useEffect, useRef } from 'react';
import { BattleState, BattleCard, MapType } from '../types';
import { NPC_NAMES as CONST_NPC_NAMES, NPC_EMOJIS } from '../constants';
import { audioManager } from '../services/audioManager';
import { CheckCircle2, XCircle, MessageSquareQuote, User, CookingPot, Send, Check, X } from 'lucide-react';

interface BattleInterfaceProps {
  battleState: BattleState;
  mapType: MapType;
  onCardSelect: (card: BattleCard) => void;
  onBattleEnd: (won: boolean) => void;
}

interface ChatMessage {
    id: string;
    role: 'NPC' | 'PLAYER';
    text: string;
    subText?: string;
    avatar: string;
    isCorrect?: boolean;
}

const BattleInterface: React.FC<BattleInterfaceProps> = ({ battleState, mapType, onCardSelect, onBattleEnd }) => {
  const [localFeedback, setLocalFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [displayScore, setDisplayScore] = useState(battleState.examScore);
  
  // State for Company Mode continuous chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Score Animation Effect
  useEffect(() => {
      if (battleState.examScore === displayScore) return;

      const duration = 1000;
      const startValue = displayScore;
      const endValue = battleState.examScore;
      let startTime: number | null = null;

      const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          // Ease out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          
          const val = Math.floor(startValue + (endValue - startValue) * ease);
          setDisplayScore(val);

          if (progress < 1) {
              requestAnimationFrame(animate);
          }
      };
      
      requestAnimationFrame(animate);
  }, [battleState.examScore]);

  // Reset local state on new round, but keep chat history for Company mode
  useEffect(() => {
    setLocalFeedback(null);
    setSelectedCardId(null);
  }, [battleState.currentRound, battleState.isActive]);

  // Initialize Chat History on Battle Start (Round 1)
  useEffect(() => {
      if (battleState.isActive && battleState.currentRound === 1 && mapType === MapType.COMPANY) {
          setChatHistory([]);
      }
  }, [battleState.isActive, battleState.currentRound, mapType]);

  // Append NPC Message when Scenario Changes (Company Mode)
  useEffect(() => {
      if (mapType === MapType.COMPANY && battleState.currentScenario && battleState.isActive) {
          setChatHistory(prev => {
              // Avoid duplicates if re-rendering same scenario
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === 'NPC' && lastMsg.text === battleState.currentScenario!.dialogue) {
                  return prev;
              }
              return [...prev, {
                  id: `npc_${battleState.currentRound}_${Date.now()}`,
                  role: 'NPC',
                  text: battleState.currentScenario!.dialogue,
                  avatar: NPC_EMOJIS[battleState.npcType!]
              }];
          });
      }
  }, [battleState.currentScenario, mapType, battleState.isActive, battleState.npcType, battleState.currentRound]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
      if (mapType === MapType.COMPANY) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatHistory, mapType]);

  if (!battleState.isActive || !battleState.npcType || !battleState.currentScenario) return null;

  const isResultVisible = battleState.result !== null;
  const scenario = battleState.currentScenario;
  const hand = battleState.currentHand;

  const handleSelect = (card: BattleCard) => {
    if (localFeedback) return; 
    
    // SFX: Play Correct or Wrong sound immediately upon selection
    if (card.isCorrect) {
        audioManager.playCorrect();
    } else {
        audioManager.playWrong();
    }

    setSelectedCardId(card.id);
    setLocalFeedback(card.isCorrect ? 'CORRECT' : 'WRONG');

    // For Company Mode: Append Player Answer immediately
    if (mapType === MapType.COMPANY) {
        setChatHistory(prev => [...prev, {
            id: `player_${battleState.currentRound}_${Date.now()}`,
            role: 'PLAYER',
            text: card.name,
            subText: card.description,
            avatar: '😎', // Player Avatar
            isCorrect: card.isCorrect
        }]);
    }

    setTimeout(() => {
        onCardSelect(card);
    }, 800);
  };

  // --- RENDER MODES ---

  // 1. SCHOOL MODE: Test Paper Style
  if (mapType === MapType.SCHOOL) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 p-4 animate-in fade-in">
             <div className="w-full max-w-md bg-white text-slate-800 rounded-sm shadow-2xl overflow-hidden flex flex-col relative min-h-[600px]">
                 {/* Header: Paper Header with Icons */}
                 <div className="border-b-2 border-slate-300 p-4 border-dashed relative bg-slate-50">
                     <div className="flex justify-between items-start mb-2">
                        {/* NPC (Teacher) */}
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-white border border-slate-300 rounded-full flex items-center justify-center text-xl shadow-sm">
                                {NPC_EMOJIS[battleState.npcType]}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700">监考: {CONST_NPC_NAMES[battleState.npcType]}</span>
                                <span className="text-[10px] text-slate-400">严肃注视中...</span>
                            </div>
                        </div>
                        {/* Score */}
                        <div className="relative">
                           <div className="text-red-600 font-handwriting text-5xl -rotate-12 font-bold opacity-90 transition-all duration-300">
                               {displayScore}
                           </div>
                           <div className="absolute -bottom-2 right-0 text-[10px] text-red-400 font-serif tracking-widest -rotate-6">SCORE</div>
                        </div>
                     </div>
                     
                     <h2 className="text-center font-serif text-xl font-bold tracking-widest mt-2 border-y border-slate-200 py-1">期末考试试卷</h2>
                     
                     <div className="flex justify-between items-center text-xs font-mono mt-2 text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                         <div className="flex items-center gap-1">
                             <User size={12} /> 考生: 你
                         </div>
                         <span>科目: {scenario.topic}</span>
                         <span>题号: {battleState.currentRound}/5</span>
                     </div>
                 </div>

                 {/* Question Area */}
                 <div className="p-6 flex-1 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] relative overflow-y-auto">
                     <div className="mb-6 relative z-10">
                         <span className="font-bold mr-2 text-slate-900">{battleState.currentRound}.</span>
                         <span className="font-serif text-lg text-slate-800 font-medium leading-relaxed">{scenario.dialogue}</span>
                     </div>

                     {/* Options */}
                     <div className="flex flex-col gap-3 relative z-10 pb-4">
                         {!isResultVisible && hand.map((card, idx) => {
                             const isSelected = selectedCardId === card.id;
                             let bgClass = "bg-white border-slate-300 hover:bg-blue-50 hover:border-blue-300";
                             if (localFeedback && isSelected) {
                                 bgClass = card.isCorrect ? "bg-green-50 border-green-500 ring-1 ring-green-500" : "bg-red-50 border-red-500 ring-1 ring-red-500";
                             } else if (localFeedback && !isSelected) {
                                 bgClass = "bg-slate-50 border-slate-200 opacity-50";
                             }
                             
                             return (
                                 <button 
                                    key={idx}
                                    onClick={() => handleSelect(card)}
                                    className={`relative text-left p-3 sm:p-4 border rounded shadow-sm transition-all flex items-start gap-3 active:scale-[0.99] ${bgClass}`}
                                 >
                                     <span className="font-bold bg-slate-200 px-2 py-0.5 rounded text-sm min-w-[24px] text-center">{String.fromCharCode(65+idx)}</span>
                                     <div className="flex-1">
                                         <div className="text-sm font-bold text-slate-900">{card.name}</div>
                                         {card.description && <div className="text-xs text-slate-500 mt-1">{card.description}</div>}
                                     </div>
                                     
                                     {/* Stamp Animation */}
                                     {localFeedback && isSelected && (
                                         <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none animate-in zoom-in spin-in-3 duration-300">
                                            {card.isCorrect ? (
                                                <div className="rotate-[-10deg] drop-shadow-md">
                                                    <Check size={56} className="text-green-600 mix-blend-multiply opacity-90" strokeWidth={5} />
                                                </div>
                                            ) : (
                                                <div className="rotate-[10deg] drop-shadow-md">
                                                    <X size={56} className="text-red-600 mix-blend-multiply opacity-90" strokeWidth={5} />
                                                </div>
                                            )}
                                         </div>
                                     )}
                                 </button>
                             )
                         })}
                     </div>
                 </div>

                 {/* Result Overlay */}
                 {isResultVisible && (
                     <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm z-50">
                         <div className="bg-white w-full rounded p-6 text-center shadow-2xl animate-in zoom-in duration-300">
                             <div className="text-6xl mb-4">{battleState.result === 'WIN' ? '💯' : '📝'}</div>
                             <h3 className="text-2xl font-black mb-2 text-slate-900">{battleState.result === 'WIN' ? '满分答卷！' : '不及格'}</h3>
                             <p className="text-slate-500 mb-6 text-sm">
                                {battleState.result === 'WIN' ? '知识就是力量，老师为你转身！' : '该回炉重造了，同学。'}
                             </p>
                             <button onClick={() => onBattleEnd(battleState.result === 'WIN')} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded transition-colors">
                                 {battleState.result === 'WIN' ? '领取奖学金' : '接受补考'}
                             </button>
                         </div>
                     </div>
                 )}
             </div>
        </div>
      )
  }

  // 2. COMPANY MODE: Chat App Style
  if (mapType === MapType.COMPANY) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-4 animate-in fade-in">
             <div className="w-full max-w-md bg-[#f5f5f5] h-full sm:h-[700px] sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
                 {/* Chat Header */}
                 <div className="bg-[#0089ff] p-4 text-white flex flex-col gap-3 shadow-md z-10 shrink-0">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="relative">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl border border-white/30">
                                    {NPC_EMOJIS[battleState.npcType]}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#0089ff] rounded-full"></div>
                             </div>
                             <div>
                                 <div className="font-bold text-sm">{CONST_NPC_NAMES[battleState.npcType]}</div>
                                 <div className="text-[10px] opacity-80 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                                    正在输入...
                                 </div>
                             </div>
                         </div>
                         <div className="bg-white/10 px-2 py-1 rounded text-xs font-mono">
                             Round {battleState.currentRound}
                         </div>
                     </div>

                     {/* The POT Progress Bar */}
                     <div className="bg-white/10 p-2 rounded-xl flex items-center gap-2">
                         <div className="text-xl shrink-0 grayscale brightness-200">😎</div> {/* Player Avatar */}
                         <div className="flex-1 h-3 bg-black/20 rounded-full relative mx-1">
                             {/* Gradient Background */}
                             <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 opacity-80"></div>
                             
                             {/* The POT Slider */}
                             <div 
                                className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10 flex flex-col items-center"
                                style={{ left: `${battleState.potProgress}%`, transform: 'translate(-50%, -50%)' }}
                             >
                                 <div className="text-2xl filter drop-shadow-md animate-bounce"><CookingPot fill="#333" /></div>
                                 <div className="w-0.5 h-4 bg-white/80 absolute top-full"></div>
                             </div>
                         </div>
                         <div className="text-xl shrink-0 grayscale brightness-200">{NPC_EMOJIS[battleState.npcType]}</div> {/* NPC Avatar */}
                     </div>
                     <div className="flex justify-between text-[10px] px-8 text-white/60 font-bold -mt-1">
                         <span>不粘锅</span>
                         <span>背锅侠</span>
                     </div>
                 </div>

                 {/* Chat Area */}
                 <div className="flex-1 bg-[#ededed] px-4 pt-4 overflow-y-auto flex flex-col gap-4 scroll-smooth">
                     <div className="text-center shrink-0">
                         <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-1 rounded">星期五 17:59</span>
                     </div>

                     {/* History Messages */}
                     {chatHistory.map((msg) => (
                         <div key={msg.id} className={`flex items-start gap-2 ${msg.role === 'PLAYER' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                             <div className={`w-9 h-9 min-w-[36px] rounded bg-white flex items-center justify-center text-sm border border-black/5 shadow-sm overflow-hidden shrink-0`}>
                                 {msg.avatar}
                             </div>
                             <div className={`max-w-[75%] p-3 rounded-xl shadow-sm text-sm border relative ${
                                 msg.role === 'PLAYER' 
                                    ? (msg.isCorrect ? 'bg-[#95ec69] border-[#7ec958] text-black' : 'bg-[#ffdede] border-[#ffbaba] text-black') 
                                    : 'bg-white border-gray-100 text-gray-800 rounded-tl-none'
                                 } ${msg.role === 'PLAYER' ? 'rounded-tr-none' : ''}`}
                             >
                                 <div className="font-medium">{msg.text}</div>
                                 {msg.subText && <div className="text-[10px] opacity-60 mt-1 border-t border-black/10 pt-1">{msg.subText}</div>}
                             </div>
                         </div>
                     ))}
                     
                     {/* Invisible div to scroll to */}
                     <div ref={chatEndRef} className="h-4"></div>
                 </div>

                 {/* Options Area */}
                 <div className="bg-[#f5f5f5] p-3 border-t border-gray-200 shrink-0 pb-safe z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                      {isResultVisible ? (
                           <div className="p-2 text-center">
                               <div className="text-sm text-gray-500 mb-2">对话已结束</div>
                           </div>
                      ) : (
                        <>
                            <div className="text-[10px] text-gray-400 mb-2 ml-1 flex items-center gap-1">
                                <Send size={10} /> 请选择回复:
                            </div>
                            <div className="grid gap-2">
                                {hand.map((card, idx) => {
                                    const isSelected = selectedCardId === card.id;
                                    let btnClass = "bg-white text-gray-800 border-gray-200 hover:bg-gray-50";
                                    if (localFeedback) {
                                        // Disable all buttons once one is selected to prevent spam
                                        btnClass = "bg-gray-100 text-gray-400 border-transparent cursor-not-allowed opacity-60";
                                        if (isSelected) {
                                            btnClass = "bg-[#0089ff] text-white border-blue-600 opacity-100";
                                        }
                                    }
                                    return (
                                        <button 
                                            key={idx}
                                            onClick={() => handleSelect(card)}
                                            disabled={!!localFeedback}
                                            className={`p-3 rounded-xl text-left text-sm font-medium shadow-sm border active:scale-[0.98] transition-all flex items-center justify-between group ${btnClass}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{card.name}</span>
                                            </div>
                                            {card.description && (
                                                <span className="text-[10px] opacity-60 font-normal truncate max-w-[120px]">
                                                    {card.description}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </>
                      )}
                 </div>

                 {/* Result Overlay */}
                 {isResultVisible && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm z-50">
                         <div className="bg-white w-full rounded-2xl p-6 text-center animate-in zoom-in duration-300">
                             <div className="text-6xl mb-4">{battleState.result === 'WIN' ? '🛡️' : '🍳'}</div>
                             <h3 className="text-2xl font-black mb-2 text-gray-900">{battleState.result === 'WIN' ? '成功甩锅' : '接盘侠'}</h3>
                             <p className="text-gray-500 mb-6 text-sm">
                                {battleState.result === 'WIN' ? '你以惊人的话术避开了所有责任！' : '这口黑锅又大又圆，你背定了。'}
                             </p>
                             <button onClick={() => onBattleEnd(battleState.result === 'WIN')} className="w-full py-3 bg-[#0089ff] hover:bg-[#0077e6] text-white font-bold rounded-xl shadow-lg transition-colors">
                                 {battleState.result === 'WIN' ? '领取年终奖' : '加班反省'}
                             </button>
                         </div>
                     </div>
                 )}
             </div>
        </div>
      )
  }

  // 3. HOME MODE (Existing)
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300`}>
      <div className="relative w-full max-w-md flex flex-col gap-4"> 
        
        {/* Battle Header */}
        <div className="flex justify-between items-center border-b border-yellow-500/20 pb-4 relative">
          {/* Player */}
          <div className="flex items-center gap-2">
             <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center border-2 border-green-500/50 relative">
                <span className="text-2xl">🕶️</span>
                {localFeedback === 'CORRECT' && <div className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border border-white animate-ping"></div>}
             </div>
             <div className="flex flex-col">
                 <div className="flex gap-0.5">
                     {Array.from({length: 3}).map((_, i) => (
                         <div key={i} className={`w-4 h-2 rounded-sm ${i < battleState.playerWins ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-gray-700'}`} />
                     ))}
                 </div>
                 <span className="text-[10px] text-green-500 font-bold">DEF</span>
             </div>
          </div>

          <div className="text-center">
             <div className="text-xl font-black text-white/20 italic">VS</div>
             <div className="text-[10px] text-yellow-600 bg-black/40 px-2 rounded-full border border-yellow-900/50">Round {battleState.currentRound}</div>
          </div>

          {/* NPC */}
          <div className="flex items-center gap-2 flex-row-reverse text-right">
             <div className="flex flex-col items-center">
               <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center border-2 border-red-500/50">
                  <span className="text-2xl">{NPC_EMOJIS[battleState.npcType]}</span>
               </div>
               <span className="text-[10px] text-red-200 mt-1 font-bold whitespace-nowrap">{CONST_NPC_NAMES[battleState.npcType]}</span>
             </div>
             <div className="flex flex-col items-end">
                 <div className="flex gap-0.5 flex-row-reverse">
                     {Array.from({length: 3}).map((_, i) => (
                         <div key={i} className={`w-4 h-2 rounded-sm ${i < battleState.npcWins ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'bg-gray-700'}`} />
                     ))}
                 </div>
                 <span className="text-[10px] text-red-500 font-bold">ATK</span>
             </div>
          </div>
        </div>

        {/* NPC Dialogue */}
        <div className="bg-red-950/40 p-6 rounded-2xl border border-red-900/50 min-h-[140px] flex items-center justify-center text-center relative shadow-inner">
           <MessageSquareQuote className="absolute top-2 left-2 text-red-800" size={20} />
           <div>
               <div className="text-[10px] text-yellow-600/60 mb-2 uppercase tracking-widest">{scenario.topic}</div>
               <p className="text-lg text-red-50 font-serif italic drop-shadow-md">"{scenario.dialogue}"</p>
           </div>
        </div>

        {/* Options */}
        {!isResultVisible && (
          <div className={`flex flex-col gap-3 transition-all duration-300 ${localFeedback ? 'pointer-events-none' : ''}`}>
            {hand.map((card, idx) => {
              const isSelected = selectedCardId === card.id;
              let cardStateClass = 'bg-white/5 border-white/10 active:bg-white/10 active:border-yellow-500/50 hover:bg-white/5';
              
              if (localFeedback) {
                  if (isSelected) {
                      cardStateClass = card.isCorrect ? 'bg-green-900/30 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-red-900/30 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                  } else {
                      cardStateClass = 'opacity-30 grayscale'; 
                  }
              }

              return (
                <button 
                  key={`${card.id}-${idx}`}
                  onClick={() => handleSelect(card)}
                  className={`relative p-4 rounded-xl border text-left transition-all flex flex-col justify-center min-h-[80px] group ${cardStateClass}`}
                >
                  <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-bold ${localFeedback && isSelected ? (card.isCorrect ? 'text-green-400' : 'text-red-400') : 'text-gray-200'}`}>{card.name}</span>
                      {card.emoji && <span className="text-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">{card.emoji}</span>}
                  </div>
                  {card.description && <p className="text-xs text-gray-400 italic line-clamp-2">{card.description}</p>}
                </button>
              );
            })}
          </div>
        )}

        {/* Hint (Hidden to maintain layout) */}
        {!isResultVisible && (
          <div className={`text-center text-[10px] text-yellow-600/40 font-mono transition-opacity duration-300 ${localFeedback ? 'opacity-0' : 'opacity-100'}`}>
             请选择最合适的应对方式...
          </div>
        )}

        {/* Result Overlay */}
        {isResultVisible && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 rounded-3xl animate-in zoom-in duration-300 backdrop-blur-sm">
             <div className="p-8 text-center w-full">
                {battleState.result === 'WIN' ? (
                  <>
                    <CheckCircle2 size={50} className="text-green-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <h3 className="text-2xl font-black text-white mb-2">绝杀！</h3>
                    <p className="text-gray-400 mb-6 text-xs">你的反应让亲戚大受震撼！</p>
                    <button onClick={() => onBattleEnd(true)} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg border border-green-500/50">继续潜伏</button>
                  </>
                ) : (
                  <>
                    <XCircle size={50} className="text-red-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <h3 className="text-2xl font-black text-white mb-2">防御崩溃</h3>
                    <p className="text-gray-400 mb-6 text-xs">气氛突然变得尴尬...</p>
                    <button onClick={() => onBattleEnd(false)} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg border border-red-500/50">心碎 -1</button>
                  </>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleInterface;
