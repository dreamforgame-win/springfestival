
import React, { useState } from 'react';
import { UNIQUE_LOOT_ITEMS, MAP_CONFIGS } from '../constants';
import { LootMetadata, LootRarity, MapType } from '../types';
import { X, Trash2 } from 'lucide-react';

interface CollectionGalleryProps {
  unlockedItems: Record<string, number>;
  onClose: () => void;
  onReset: () => void;
}

const CollectionGallery: React.FC<CollectionGalleryProps> = ({ unlockedItems, onClose, onReset }) => {
  const [selectedItem, setSelectedItem] = useState<LootMetadata | null>(null);
  const [rarityFilter, setRarityFilter] = useState<LootRarity | 'ALL'>('ALL');
  const [mapFilter, setMapFilter] = useState<MapType | 'ALL'>('ALL');

  const filteredItems = UNIQUE_LOOT_ITEMS.filter(item => {
      const matchRarity = rarityFilter === 'ALL' || item.rarity === rarityFilter;
      const matchMap = mapFilter === 'ALL' || item.mapType === mapFilter;
      return matchRarity && matchMap;
  });

  const getRarityColor = (rarity: LootRarity) => {
    switch (rarity) {
      case LootRarity.RED: return 'border-red-500 bg-red-950/30 text-red-500 shadow-red-900/40';
      case LootRarity.ORANGE: return 'border-orange-500 bg-orange-950/30 text-orange-500 shadow-orange-900/40';
      case LootRarity.PURPLE: return 'border-purple-500 bg-purple-950/30 text-purple-500 shadow-purple-900/40';
      case LootRarity.BLUE: return 'border-blue-500 bg-blue-950/30 text-blue-500 shadow-blue-900/40';
      default: return 'border-gray-500';
    }
  };

  const getRarityText = (rarity: LootRarity) => {
    switch (rarity) {
        case LootRarity.RED: return "传说";
        case LootRarity.ORANGE: return "史诗";
        case LootRarity.PURPLE: return "稀有";
        case LootRarity.BLUE: return "普通";
    }
  }

  const getMapName = (type: MapType) => MAP_CONFIGS[type].name;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-5xl h-[90vh] bg-[#1a0505] border-2 border-yellow-600/50 rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-yellow-900/50 flex justify-between items-center bg-[#100303]">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 font-serif">时光博物馆</h2>
            <p className="text-yellow-600/60 text-xs font-mono mt-1 tracking-widest uppercase">264 Memories of the Past</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-yellow-600">
            <X size={24} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-white/5 bg-black/20">
            {/* Map Filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0 border-b sm:border-b-0 sm:border-r border-white/10 sm:pr-4">
                <span className="text-xs text-gray-500 self-center mr-1">场景:</span>
                {(['ALL', MapType.HOME, MapType.SCHOOL, MapType.COMPANY] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setMapFilter(f)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all whitespace-nowrap ${
                            mapFilter === f 
                            ? 'bg-yellow-700/50 text-yellow-100 border border-yellow-500/50' 
                            : 'bg-transparent text-gray-500 border border-transparent hover:bg-white/5'
                        }`}
                    >
                        {f === 'ALL' ? '全部' : getMapName(f)}
                    </button>
                ))}
            </div>

            {/* Rarity Filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                <span className="text-xs text-gray-500 self-center mr-1">品质:</span>
                {(['ALL', LootRarity.RED, LootRarity.ORANGE, LootRarity.PURPLE, LootRarity.BLUE] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setRarityFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                            rarityFilter === f 
                            ? 'bg-yellow-600 border-yellow-500 text-white' 
                            : 'bg-black/40 border-white/10 text-gray-500 hover:border-white/30'
                        }`}
                    >
                        {f === 'ALL' ? '全部' : getRarityText(f)}
                    </button>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {filteredItems.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">暂无相关物品</div>
            ) : (
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {filteredItems.map((item) => {
                    const count = unlockedItems[item.id] || 0;
                    const isUnlocked = count > 0;
                    const rarityStyle = getRarityColor(item.rarity);

                    return (
                    <button
                        key={item.id}
                        onClick={() => isUnlocked && setSelectedItem(item)}
                        className={`aspect-square rounded-lg border flex items-center justify-center relative transition-transform duration-200 ${
                        isUnlocked 
                            ? `${rarityStyle} hover:scale-110 hover:shadow-xl hover:z-20 cursor-pointer` 
                            : 'bg-black/40 border-white/5 cursor-not-allowed opacity-40'
                        }`}
                        title={isUnlocked ? item.name : '未解锁'}
                    >
                        <span className={`text-2xl sm:text-3xl select-none ${!isUnlocked ? 'grayscale brightness-0' : ''}`}>
                            {item.emoji}
                        </span>
                        
                        {isUnlocked && count > 1 && (
                        <div className="absolute bottom-0 right-0 bg-black/80 text-[8px] text-white font-bold px-1 rounded-tl-md border-t border-l border-white/10">
                            x{count}
                        </div>
                        )}
                    </button>
                    );
                })}
              </div>
            )}
        </div>

        {/* Footer Summary & Reset */}
        <div className="p-4 bg-black/20 text-center text-xs text-yellow-600/40 font-mono flex justify-between items-center border-t border-yellow-900/20">
          <span>收集进度: {Object.keys(unlockedItems).length} / {UNIQUE_LOOT_ITEMS.length}</span>
          <button 
            onClick={onReset} 
            className="flex items-center gap-1.5 text-red-900/40 hover:text-red-500 hover:bg-red-950/30 px-3 py-1.5 rounded-full transition-all"
            title="清空所有存档"
          >
             <Trash2 size={12} /> 
             <span className="font-bold">重置进度</span>
          </button>
        </div>

        {/* Item Detail Popup */}
        {selectedItem && (
          <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
            <div className={`max-w-md w-full bg-[#150505] border-2 p-8 rounded-2xl shadow-2xl text-center relative ${getRarityColor(selectedItem.rarity).split(' ')[0]}`} onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 text-white/20 hover:text-white"
              >
                <X size={20} />
              </button>
              
              <div className="text-6xl mb-6 drop-shadow-2xl animate-bounce">{selectedItem.emoji}</div>
              <h3 className="text-2xl font-black text-white mb-2">{selectedItem.name}</h3>
              <div className={`inline-flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full mb-6 border uppercase tracking-wider ${getRarityColor(selectedItem.rarity)}`}>
                {getRarityText(selectedItem.rarity)} Item
              </div>
              
              <div className="bg-black/40 p-6 rounded-xl text-gray-300 text-sm leading-relaxed italic text-justify font-serif border border-white/5">
                "{selectedItem.story}"
              </div>
              
              <div className="mt-8 text-xs font-mono text-yellow-600/60 flex justify-between items-center">
                 <span>NO. {selectedItem.id.toUpperCase()}</span>
                 <span className="text-green-500 font-bold">估值: ¥{selectedItem.value}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionGallery;
