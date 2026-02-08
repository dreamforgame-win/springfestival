
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Entity, Position, TileType, ItemType, MapType } from '../types';
import { NPC_EMOJIS, UNIQUE_LOOT_ITEMS } from '../constants';
import { 
  DoorOpen, Tv, Flower, Sofa, Utensils, BedDouble, Monitor, BookOpen, Armchair
} from 'lucide-react';

interface GridMapProps {
  tiles: TileType[][];
  entities: Entity[];
  playerPos: Position;
  mapType: MapType;
  onCellClick: (dx: number, dy: number) => void;
  onInteract: (tileType: TileType) => void;
}

export const getLootEmoji = (entity: Entity) => {
  if (entity.itemType === ItemType.MONEY_ITEM) return '💰';
  if (entity.itemType === ItemType.SNACK) return '🍎';
  if (entity.itemType === ItemType.UNIQUE_LOOT && entity.lootId) {
     const lootData = UNIQUE_LOOT_ITEMS.find(i => i.id === entity.lootId);
     return lootData?.emoji || '💎';
  }
  return '📦';
};

// 棋盘格子尺寸固定为 40px
const TILE_SIZE = 40; 
const VISIBILITY_RADIUS = 3;

const GridMap: React.FC<GridMapProps> = ({ tiles, entities, playerPos, mapType, onCellClick, onInteract }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        let h = rect.height;
        let w = rect.width;
        
        if (window.visualViewport && window.visualViewport.height < window.innerHeight) {
            // Mobile keyboard adjustment fallback
        }

        if (h === 0) h = window.innerHeight * 0.55;
        if (w === 0) w = window.innerWidth;
        
        setViewportSize({ width: w, height: h });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0 || tiles.length === 0) return;

    const mapH = tiles.length;
    const mapW = tiles[0].length;

    const mapWidth = mapW * TILE_SIZE;
    const mapHeight = mapH * TILE_SIZE;

    const px = playerPos.x * TILE_SIZE + TILE_SIZE / 2;
    const py = playerPos.y * TILE_SIZE + TILE_SIZE / 2;

    let tx = (viewportSize.width / 2) - px;
    let ty = (viewportSize.height / 2) - py;

    const minX = viewportSize.width - mapWidth;
    const minY = viewportSize.height - mapHeight;

    if (minX > 0) {
       tx = minX / 2;
    } else {
       tx = Math.min(0, Math.max(minX, tx));
    }

    if (minY >= 0) {
        ty = minY / 2;
    } else {
        ty = Math.min(0, Math.max(minY, ty));
    }

    setCameraOffset({ x: tx, y: ty });
  }, [playerPos, viewportSize, tiles]);

  const getDistance = (x: number, y: number) => {
    return Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);
  };

  const handleCellClick = (x: number, y: number) => {
    const tile = tiles[y][x];
    const isObstacle = tile !== TileType.FLOOR && tile !== TileType.EXIT;
    const dist = getDistance(x, y);
    const isVisible = dist <= VISIBILITY_RADIUS;

    // Logic: 
    // 1. If visible and obstacle -> Show description (Interact)
    // 2. If adjacent and floor/exit -> Move
    
    if (isVisible && isObstacle) {
        onInteract(tile);
    } else {
        const dx = x - playerPos.x;
        const dy = y - playerPos.y;
        if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
          onCellClick(dx, dy);
        }
    }
  };

  // Map Theme Config
  const getMapTheme = () => {
      switch(mapType) {
          case MapType.SCHOOL:
              return { floor: '#e2e8f0', wall: '#64748b', wallTop: '#475569' }; // Blue-grey slate
          case MapType.COMPANY:
              return { floor: '#d6d3d1', wall: '#57534e', wallTop: '#44403c' }; // Warm grey concrete
          case MapType.HOME:
          default:
              return { floor: '#f5e6d3', wall: '#8a5a44', wallTop: '#5e3d2e' }; // Warm wood
      }
  };

  const theme = getMapTheme();

  if (!tiles || tiles.length === 0) return null;

  const mapH = tiles.length;
  const mapW = tiles[0].length;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#050505] rounded-xl border border-[#3a201d] shadow-inner touch-none"
    >
      <div 
        className="absolute top-0 left-0 transition-transform duration-300 ease-out will-change-transform"
        style={{
          width: `${mapW * TILE_SIZE}px`,
          height: `${mapH * TILE_SIZE}px`,
          transform: `translate3d(${cameraOffset.x}px, ${cameraOffset.y}px, 0)`
        }}
      >
        {/* 地图网格层 */}
        <div 
          className="grid relative z-10"
          style={{ gridTemplateColumns: `repeat(${mapW}, ${TILE_SIZE}px)` }}
        >
          {tiles.map((row, y) => 
            row.map((tile, x) => {
              const dist = getDistance(x, y);
              const isVisible = dist <= VISIBILITY_RADIUS;
              
              const isObstacle = tile !== TileType.FLOOR && tile !== TileType.EXIT;
              const isAdjacent = (Math.abs(x - playerPos.x) === 1 && y === playerPos.y) || (Math.abs(y - playerPos.y) === 1 && x === playerPos.x);
              
              // 基础样式
              let bgColor = theme.floor;
              let content = null;
              let maskOpacity = 0; // 遮罩透明度 (0 = 完全清晰, 1 = 完全黑)
              let grayscale = false;

              // 1. 设置内容图标
              if (isObstacle) {
                  bgColor = theme.wall;
                  if (tile === TileType.WALL) {
                      content = <div className="w-full h-full shadow-inner relative" style={{ backgroundColor: theme.wallTop }}>
                          {/* Top Highlight to simulate 3D wall top */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10"></div>
                      </div>;
                  }
                  else if (tile === TileType.OBSTACLE_SOFA) content = <Sofa className="w-3/5 h-3/5 text-amber-700" />;
                  else if (tile === TileType.OBSTACLE_TV) content = <Tv className="w-3/5 h-3/5 text-gray-800" />;
                  else if (tile === TileType.OBSTACLE_PLANT) content = <Flower className="w-3/5 h-3/5 text-green-600" />;
                  else if (tile === TileType.OBSTACLE_TABLE) content = <Utensils className="w-3/5 h-3/5 text-amber-900" />;
                  else if (tile === TileType.OBSTACLE_BED) content = <BedDouble className="w-4/5 h-4/5 text-blue-800" />;
                  else if (tile === TileType.OBSTACLE_DESK) {
                      if (mapType === MapType.SCHOOL) content = <BookOpen className="w-3/5 h-3/5 text-amber-800" />;
                      else content = <Monitor className="w-3/5 h-3/5 text-gray-800" />;
                  }
              } else if (tile === TileType.EXIT) {
                  bgColor = "#1b5e20";
                  content = <DoorOpen className="text-green-400 w-3/4 h-3/4 animate-pulse" />;
              }

              // 2. 根据曼哈顿距离计算遮罩和可见性
              if (dist <= 1) {
                  // 正常亮度 (中心 + 1格范围)
                  maskOpacity = 0;
              } else if (dist === 2) {
                  // 稍微变暗
                  maskOpacity = 0.1;
              } else if (dist === 3) {
                  // 视野边缘，更暗
                  maskOpacity = 0.2;
              } else {
                  // 视野外 (Fog of War) - 显示地形/障碍物，但非常暗且灰度化
                  maskOpacity = 0.85; 
                  grayscale = true;
                  bgColor = "#111"; // 迷雾下的地板底色变暗
              }

              return (
                <div 
                  key={`${x}-${y}`} 
                  onClick={() => handleCellClick(x, y)}
                  className={`relative flex items-center justify-center transition-colors duration-500`}
                  style={{ 
                    width: TILE_SIZE, 
                    height: TILE_SIZE, 
                    backgroundColor: bgColor,
                    filter: grayscale ? 'grayscale(80%)' : 'none',
                  }}
                >
                  {/* 内容层 (障碍物/出口) - 迷雾中也渲染，但受父级filter影响 */}
                  {content}

                  {/* 光照遮罩层 - 使用绝对定位覆盖在上方实现变暗 */}
                  <div 
                    className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                    style={{ backgroundColor: '#000', opacity: maskOpacity }}
                  />

                  {/* 交互提示 - 仅在相邻且亮处显示 - 去除了ring */}
                  {isVisible && isAdjacent && !isObstacle && (
                    <div className="absolute inset-0 bg-yellow-500/20 animate-pulse pointer-events-none z-20 rounded-sm"></div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 实体层 - 仅渲染视野内的实体 */}
        {entities.map(entity => {
           if (entity.isDead) return null;
           
           const dist = getDistance(entity.pos.x, entity.pos.y);
           const isVisible = dist <= VISIBILITY_RADIUS; // 实体必须在视野内才可见
           
           if (!isVisible && entity.type !== 'PLAYER') return null;

           // 实体也受距离光照影响，稍作变暗处理以融入环境
           let entityBrightness = 1;
           if (dist === 2) entityBrightness = 0.8;
           if (dist === 3) entityBrightness = 0.6;

           return (
             <div 
               key={entity.id}
               className="absolute top-0 left-0 pointer-events-none z-50 flex items-center justify-center"
               style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  transform: `translate3d(${entity.pos.x * TILE_SIZE}px, ${entity.pos.y * TILE_SIZE}px, 0)`,
                  transition: 'transform 300ms cubic-bezier(0.2, 0, 0, 1)',
                  filter: `brightness(${entityBrightness})`
               }}
             >
                <div className="w-full h-full flex items-center justify-center">
                    {entity.type === 'PLAYER' && <span className="text-2xl drop-shadow-md relative z-10">😎</span>}
                    {entity.type === 'NPC' && <span className="text-2xl animate-bounce drop-shadow-lg relative z-10">{NPC_EMOJIS[entity.npcType!]}</span>}
                    {entity.type === 'ITEM' && <span className="text-xl filter drop-shadow-sm relative z-10">{getLootEmoji(entity)}</span>}
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default GridMap;
