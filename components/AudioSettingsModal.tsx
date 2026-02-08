
import React from 'react';
import { X, Music, Volume2 } from 'lucide-react';

interface AudioSettingsModalProps {
  onClose: () => void;
  audioState: { bgm: boolean; sfx: boolean };
  onToggleBgm: () => void;
  onToggleSfx: () => void;
}

const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ onClose, audioState, onToggleBgm, onToggleSfx }) => {
  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a0505] border-2 border-yellow-600/50 rounded-2xl shadow-2xl p-6 w-full max-w-sm relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h3 className="text-xl font-bold text-yellow-500 mb-6 text-center tracking-wider border-b border-white/5 pb-4">
          声音设置
        </h3>

        <div className="flex flex-col gap-4">
          {/* BGM Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
            <div className="flex items-center gap-3 text-yellow-100">
              <Music size={20} className={audioState.bgm ? "text-yellow-400" : "text-gray-500"} />
              <span className="font-bold">背景音乐</span>
            </div>
            <button 
              onClick={onToggleBgm}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${audioState.bgm ? 'bg-yellow-600' : 'bg-gray-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${audioState.bgm ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* SFX Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
            <div className="flex items-center gap-3 text-yellow-100">
              <Volume2 size={20} className={audioState.sfx ? "text-green-400" : "text-gray-500"} />
              <span className="font-bold">游戏音效</span>
            </div>
            <button 
              onClick={onToggleSfx}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${audioState.sfx ? 'bg-green-600' : 'bg-gray-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${audioState.sfx ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-3 bg-yellow-900/30 hover:bg-yellow-800/50 text-yellow-500 font-bold rounded-xl transition-colors border border-yellow-700/50"
        >
          关闭
        </button>
      </div>
    </div>
  );
};

export default AudioSettingsModal;
