
import React from 'react';
import { CONSUMABLES_DATA } from '../constants';
import { ConsumableType } from '../types';
import { X, ShoppingCart } from 'lucide-react';

interface ShopModalProps {
  money: number;
  inventory: Record<ConsumableType, number>;
  onBuy: (type: ConsumableType) => void;
  onClose: () => void;
}

const ShopModal: React.FC<ShopModalProps> = ({ money, inventory, onBuy, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-2xl bg-[#1a0505] border-2 border-yellow-600/50 rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-yellow-900/50 flex justify-between items-center bg-[#100303]">
          <div className="flex items-center gap-3">
             <ShoppingCart className="text-yellow-500" />
             <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 font-serif">神秘商店</h2>
                <p className="text-yellow-600/60 text-xs font-mono tracking-widest uppercase">Secret Supply</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-yellow-600">
            <X size={24} />
          </button>
        </div>

        {/* Money Display */}
        <div className="px-6 py-2 bg-yellow-900/10 flex justify-end items-center border-b border-white/5">
             <span className="text-sm text-yellow-600 mr-2">当前余额:</span>
             <span className="text-2xl font-black text-yellow-400">¥{money}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.entries(CONSUMABLES_DATA) as [ConsumableType, typeof CONSUMABLES_DATA[ConsumableType]][]).map(([type, data]) => {
                const canAfford = money >= data.price;
                return (
                    <div key={type} className="bg-black/40 border border-white/10 rounded-xl p-5 flex flex-col gap-4 hover:border-yellow-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="text-4xl bg-white/5 p-3 rounded-lg">{data.emoji}</div>
                            <div className="text-right">
                                <div className="text-yellow-100 font-bold text-lg">{data.name}</div>
                                <div className="text-xs text-gray-500">{data.desc}</div>
                            </div>
                        </div>
                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/5">
                             <div className="text-xs text-gray-400">拥有: <span className="text-white font-bold">{inventory[type]}</span></div>
                             <button 
                                onClick={() => onBuy(type)}
                                disabled={!canAfford}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    canAfford 
                                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg active:scale-95' 
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                             >
                                购买 (¥{data.price})
                             </button>
                        </div>
                    </div>
                );
            })}
        </div>

      </div>
    </div>
  );
};

export default ShopModal;
