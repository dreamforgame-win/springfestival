
import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameState, Entity, Position, TileType, NpcType, ItemType, 
  BattleState, BattleCard, ConsumableType, MapType 
} from './types';
import { 
  GRID_H, GRID_W, MAX_SANITY, 
  NPC_NAMES, NPC_AGGRESSION, 
  AGGRESSION_PER_STEP, MAX_CHASE_PROBABILITY, UNIQUE_LOOT_ITEMS,
  CONSUMABLES_DATA, RED_ENVELOPE_AMOUNTS, MAP_CONFIGS, OBSTACLE_QUOTES
} from './constants';
import { generateMap } from './utils/gameGenerator';
import { loadSaveData, saveGameData, clearSaveData } from './utils/saveManager';
import { getRandomBattleScenario, drawHandFromScenario } from './services/battleService';
import { audioManager } from './services/audioManager';
import GridMap from './components/GridMap';
import BattleInterface from './components/BattleInterface';
import CollectionGallery from './components/CollectionGallery';
import ShopModal from './components/ShopModal';
import AudioSettingsModal from './components/AudioSettingsModal';
import { Trophy, RefreshCw, Book, Play, ArrowLeft, Coins, Heart, ShoppingCart, Map, Building2, GraduationCap, Home, VolumeX, Settings } from 'lucide-react';

type ScreenState = 'START' | 'MAP_SELECT' | 'INTRO' | 'GAME' | 'COLLECTION';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('START');
  const [introText, setIntroText] = useState<string>("");
  const [endingText, setEndingText] = useState<string>("");
  
  // Audio State
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [audioState, setAudioState] = useState({ bgm: true, sfx: true });

  // Save Data
  const savedData = loadSaveData();
  const [unlockedItems, setUnlockedItems] = useState<Record<string, number>>(savedData.unlockedItems);
  const [money, setMoney] = useState<number>(savedData.money);
  const [consumables, setConsumables] = useState<Record<ConsumableType, number>>(savedData.consumables);

  // Shop UI State
  const [showShop, setShowShop] = useState(false);
  const [selectedItemForUse, setSelectedItemForUse] = useState<ConsumableType | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [tiles, setTiles] = useState<TileType[][]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [gameState, setGameState] = useState<GameState>({
    mapType: MapType.HOME,
    sanity: MAX_SANITY,
    maxSanity: MAX_SANITY,
    inventory: [],
    isGameOver: false,
    isVictory: false,
    turn: 0,
    totalSteps: 0,
    logs: [],
    usedScenarioIds: [],
    invisibleSteps: 0,
  });
  
  const [battleState, setBattleState] = useState<BattleState>({
    isActive: false,
    npcId: null,
    npcType: null,
    currentRound: 1,
    playerWins: 0,
    npcWins: 0,
    currentScenario: null,
    history: [],
    isThinking: false,
    result: null,
    currentHand: [],
    lastFeedback: null,
    examScore: 0,
    potProgress: 50
  });
  
  const [aggressionData, setAggressionData] = useState<{ active: boolean, npcName: string | null }>({ active: false, npcName: null });
  const [threatLevel, setThreatLevel] = useState<0 | 1 | 2 | 3>(0);
  const [levelGainedMoney, setLevelGainedMoney] = useState(0);

  // Mobile Audio Unlocker - Aggressive
  useEffect(() => {
    const unlockAudio = () => {
        // Just call resumeContext repeatedly on early interactions
        audioManager.resumeContext();
        
        // We only remove listener if we are sure it's running, 
        // but on some iOS versions checking state immediately might be 'suspended' even if resuming.
        // So we keep it for a few interactions or until we know it's good.
        if (audioManager.isContextRunning()) {
             window.removeEventListener('touchstart', unlockAudio);
             window.removeEventListener('click', unlockAudio);
        }
    };

    // 'touchstart' is critical for iOS Safari
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio);

    return () => {
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('click', unlockAudio);
    };
  }, []);

  const addLog = useCallback((message: string) => {
    setGameState(prev => ({
      ...prev,
      logs: [message, ...prev.logs].slice(0, 50)
    }));
  }, []);

  const handleReturnToMenu = () => {
    setGameState(prev => ({ ...prev, isVictory: false, isGameOver: false, inventory: [] }));
    setScreen('START');
  };

  // Audio Handlers
  const handleToggleBgm = () => {
    const newState = !audioState.bgm;
    audioManager.setBgmMuted(!newState);
    setAudioState(prev => ({ ...prev, bgm: newState }));
  };

  const handleToggleSfx = () => {
    const newState = !audioState.sfx;
    audioManager.setSfxMuted(!newState);
    setAudioState(prev => ({ ...prev, sfx: newState }));
  };

  const openAudioSettings = () => {
    audioManager.init(); // Ensure initialized before showing settings if accessed directly
    setShowAudioSettings(true);
  };

  // Toast Handler
  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000); // Hide after 3s
  };

  // BGM Management Logic
  useEffect(() => {
    if (screen === 'START' || screen === 'MAP_SELECT' || screen === 'COLLECTION') {
        audioManager.playBGM('START');
        return;
    }

    if (screen === 'GAME') {
        if (battleState.isActive) {
            audioManager.playBGM('BATTLE');
        } else {
            audioManager.playBGM(gameState.mapType);
        }
        return;
    }
    
    audioManager.stopBGM();
    
  }, [screen, battleState.isActive, gameState.mapType]);

  // Persist data
  useEffect(() => {
    saveGameData({ unlockedItems, money, consumables });
  }, [unlockedItems, money, consumables]);

  const handleResetProgress = () => {
    if (window.confirm("确定要清空所有存档（包括金钱和道具）吗？此操作无法撤销。")) {
      clearSaveData();
      setUnlockedItems({});
      setMoney(0);
      setConsumables({ [ConsumableType.SPRAY]: 0, [ConsumableType.DICE]: 0 });
    }
  };

  const initGame = (mapType: MapType) => {
    const { tiles: newTiles, entities: newEntities } = generateMap(mapType);
    setTiles(newTiles);
    setEntities(newEntities);
    const pPos = newEntities.find(e => e.type === 'PLAYER')!.pos;
    setPlayerPos(pPos);
    setGameState({
      mapType: mapType,
      sanity: MAX_SANITY,
      maxSanity: MAX_SANITY,
      inventory: [],
      isGameOver: false,
      isVictory: false,
      turn: 0,
      totalSteps: 0,
      logs: ["【系统】潜入行动开始..."],
      usedScenarioIds: [],
      invisibleSteps: 0
    });
    setBattleState({
      isActive: false,
      npcId: null,
      npcType: null,
      currentRound: 1,
      playerWins: 0,
      npcWins: 0,
      currentScenario: null,
      history: [],
      isThinking: false,
      result: null,
      currentHand: [],
      lastFeedback: null,
      examScore: 0,
      potProgress: 50
    });
    setAggressionData({ active: false, npcName: null });
    setEndingText(""); 
    setLevelGainedMoney(0);
    setSelectedItemForUse(null);
    setToastMessage(null);
  };

  const handleSelectMap = (type: MapType) => {
      audioManager.resumeContext();
      audioManager.playConfirm();
      const config = MAP_CONFIGS[type];
      initGame(type);
      setIntroText(config.introTexts[Math.floor(Math.random() * config.introTexts.length)]);
      setScreen('INTRO');
  };

  const handleEnterLevel = () => {
    audioManager.resumeContext();
    audioManager.playConfirm();
    setScreen('GAME');
  };

  const updateThreatLevel = useCallback(() => {
    let minDst = 999;
    entities.forEach(e => {
      if (e.type === 'NPC' && !e.isDead) {
        const dst = Math.sqrt(Math.pow(e.pos.x - playerPos.x, 2) + Math.pow(e.pos.y - playerPos.y, 2));
        if (dst < minDst) minDst = dst;
      }
    });

    if (minDst <= 2) setThreatLevel(3);
    else if (minDst <= 3) setThreatLevel(2);
    else if (minDst <= 5) setThreatLevel(1);
    else setThreatLevel(0);
  }, [entities, playerPos]);

  useEffect(() => {
    if (screen === 'GAME') updateThreatLevel();
  }, [playerPos, entities, updateThreatLevel, screen]);

  // --- ITEM LOGIC ---

  const handleBuyItem = (type: ConsumableType) => {
    const cost = CONSUMABLES_DATA[type].price;
    if (money >= cost) {
        audioManager.playConfirm();
        setMoney(prev => prev - cost);
        setConsumables(prev => ({ ...prev, [type]: prev[type] + 1 }));
    }
  };

  const handleUseItem = (type: ConsumableType) => {
    if (consumables[type] <= 0) return;

    let success = false;
    let logMsg = "";

    const mapH = tiles.length;
    const mapW = tiles[0].length;

    if (type === ConsumableType.SPRAY) {
        setGameState(prev => ({ ...prev, invisibleSteps: 5 }));
        logMsg = "【道具】使用了隐形喷雾！5步内NPC无法追踪你。";
        success = true;
    } else if (type === ConsumableType.DICE) {
        let placed = false;
        let attempts = 0;
        let targetX = playerPos.x;
        let targetY = playerPos.y;

        while (!placed && attempts < 20) {
             const dx = Math.floor(Math.random() * 7) - 3; 
             const dy = Math.floor(Math.random() * 7) - 3;
             const tx = playerPos.x + dx;
             const ty = playerPos.y + dy;
             
             if (tx >= 0 && tx < mapW && ty >= 0 && ty < mapH && 
                 tiles[ty][tx] === TileType.FLOOR && 
                 !(dx===0 && dy===0) &&
                 !entities.some(e => e.pos.x === tx && e.pos.y === ty && e.type !== 'ITEM') 
             ) {
                targetX = tx;
                targetY = ty;
                placed = true;
             }
             attempts++;
        }

        if (placed) {
            setPlayerPos({ x: targetX, y: targetY });
            setEntities(prev => prev.map(e => e.type === 'PLAYER' ? { ...e, pos: { x: targetX, y: targetY } } : e));
            logMsg = "【道具】重力骰子生效！你被传送到了新的位置。";
            success = true;
        } else {
            addLog("【系统】空间干扰太强，传送失败！(未消耗道具)");
        }
    }

    if (success) {
        audioManager.playConfirm();
        setConsumables(prev => ({ ...prev, [type]: prev[type] - 1 }));
        addLog(logMsg);
        setSelectedItemForUse(null);
    }
  };

  // --- INTERACTION ---
  const handleObstacleInteract = (tileType: TileType) => {
      const mapType = gameState.mapType;
      const quotes = OBSTACLE_QUOTES[mapType]?.[tileType];
      
      if (quotes && quotes.length > 0) {
          const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
          addLog(`【观察】${randomQuote}`);
          showToast(randomQuote);
          audioManager.playBlip();
      }
  };

  // --- MOVEMENT ---

  const handlePlayerMove = (dx: number, dy: number) => {
    if (screen !== 'GAME' || gameState.isGameOver || gameState.isVictory || battleState.isActive || aggressionData.active) return;

    const mapH = tiles.length;
    const mapW = tiles[0].length;

    const target = { x: playerPos.x + dx, y: playerPos.y + dy };
    if (target.x < 0 || target.x >= mapW || target.y < 0 || target.y >= mapH) return;
    
    const targetTile = tiles[target.y][target.x];
    if (targetTile !== TileType.FLOOR && targetTile !== TileType.EXIT) return;

    let nextEntities = [...entities];
    const collidedEntity = nextEntities.find(e => e.pos.x === target.x && e.pos.y === target.y && !e.isDead);

    if (collidedEntity) {
      if (collidedEntity.type === 'NPC') {
        startBattle(collidedEntity);
        return;
      } else if (collidedEntity.type === 'ITEM') {
        audioManager.playCoin(); // Play coin sound
        const itemName = collidedEntity.itemType === ItemType.UNIQUE_LOOT 
          ? UNIQUE_LOOT_ITEMS.find(u => u.id === collidedEntity.lootId)?.name 
          : MAP_CONFIGS[gameState.mapType].moneyItemName; // Dynamic name based on map
          
        addLog(`【获得】搜到一件：${itemName}`);
        
        if (collidedEntity.itemType === ItemType.UNIQUE_LOOT && collidedEntity.lootId) {
            setUnlockedItems(prev => ({
                ...prev,
                [collidedEntity.lootId!]: (prev[collidedEntity.lootId!] || 0) + 1
            }));
        }

        setGameState(prev => ({ ...prev, inventory: [...prev.inventory, { type: collidedEntity.itemType!, lootId: collidedEntity.lootId }] }));
        nextEntities = nextEntities.filter(e => e.id !== collidedEntity.id);
      }
    }

    if (tiles[target.y][target.x] === TileType.EXIT) {
      if (gameState.inventory.length > 0) {
        let totalMoney = 0;
        gameState.inventory.forEach(item => {
            if (item.type === ItemType.MONEY_ITEM) {
                totalMoney += RED_ENVELOPE_AMOUNTS[Math.floor(Math.random() * RED_ENVELOPE_AMOUNTS.length)];
            }
        });
        
        audioManager.playWin(); // Play victory sound
        setLevelGainedMoney(totalMoney);
        setMoney(prev => prev + totalMoney);
        
        setGameState(prev => ({ ...prev, isVictory: true }));
        const config = MAP_CONFIGS[gameState.mapType];
        setEndingText(config.endingTexts[Math.floor(Math.random() * config.endingTexts.length)]);
        setScreen('INTRO');
        return;
      } else {
        addLog("【系统】两手空空怎么回去？多搜点东西。");
        showToast("两手空空怎么回去？多搜点东西。");
      }
    }

    audioManager.playStep(); // Play step sound
    setPlayerPos(target);
    setEntities(nextEntities.map(e => e.type === 'PLAYER' ? { ...e, pos: target } : e));
    
    setGameState(prev => ({ 
        ...prev, 
        turn: prev.turn + 1, 
        totalSteps: prev.totalSteps + 1,
        invisibleSteps: Math.max(0, prev.invisibleSteps - 1)
    }));
    
    moveNpcs();
  };

  const moveNpcs = () => {
     setEntities(prevEntities => {
        let nextEntities = JSON.parse(JSON.stringify(prevEntities)) as Entity[];
        const player = nextEntities.find(e => e.type === 'PLAYER');
        if (!player) return nextEntities;
        const currentPPos = player.pos;
        
        const mapH = tiles.length;
        const mapW = tiles[0].length;

        let foundTarget: Entity | null = null;
        const npcs = nextEntities.filter(e => e.type === 'NPC' && !e.isDead);
        
        for (const npc of npcs) {
            if (foundTarget) break;

            const currentNpc = nextEntities.find(e => e.id === npc.id);
            if (!currentNpc) continue;

            const distToPlayer = Math.sqrt(Math.pow(currentPPos.x - currentNpc.pos.x, 2) + Math.pow(currentPPos.y - currentNpc.pos.y, 2));

            const baseProb = NPC_AGGRESSION[currentNpc.npcType as NpcType] || 0.5;
            const bonusProb = Math.min(MAX_CHASE_PROBABILITY, gameState.totalSteps * AGGRESSION_PER_STEP);
            
            let isAggressive = Math.random() < (baseProb + bonusProb);
            if (distToPlayer >= 4 || gameState.invisibleSteps > 0) {
                isAggressive = false; 
            }

            let nx = currentNpc.pos.x;
            let ny = currentNpc.pos.y;
            let moved = false;

            if (isAggressive) {
                const dx = currentPPos.x - currentNpc.pos.x;
                const dy = currentPPos.y - currentNpc.pos.y;
                let tryXFirst = Math.abs(dx) > Math.abs(dy);
                if (dx === 0) tryXFirst = false;
                if (dy === 0) tryXFirst = true;

                if (tryXFirst) {
                    const testNx = currentNpc.pos.x + Math.sign(dx);
                    const isFloor = testNx >= 0 && testNx < mapW && tiles[currentNpc.pos.y][testNx] === TileType.FLOOR;
                    const isBlockedByNpc = nextEntities.some(e => e.id !== currentNpc.id && e.pos.x === testNx && e.pos.y === currentNpc.pos.y && e.type === 'NPC');
                    if (isFloor && !isBlockedByNpc) { nx = testNx; moved = true; } 
                    else if (dy !== 0) {
                         const testNy = currentNpc.pos.y + Math.sign(dy);
                         const isFloorY = testNy >= 0 && testNy < mapH && tiles[testNy][currentNpc.pos.x] === TileType.FLOOR;
                         const isBlockedByNpcY = nextEntities.some(e => e.id !== currentNpc.id && e.pos.x === currentNpc.pos.x && e.pos.y === testNy && e.type === 'NPC');
                         if (isFloorY && !isBlockedByNpcY) { ny = testNy; moved = true; }
                    }
                } else {
                    const testNy = currentNpc.pos.y + Math.sign(dy);
                    const isFloor = testNy >= 0 && testNy < mapH && tiles[testNy][currentNpc.pos.x] === TileType.FLOOR;
                    const isBlockedByNpc = nextEntities.some(e => e.id !== currentNpc.id && e.pos.x === currentNpc.pos.x && e.pos.y === testNy && e.type === 'NPC');
                    if (isFloor && !isBlockedByNpc) { ny = testNy; moved = true; } 
                    else if (dx !== 0) {
                         const testNx = currentNpc.pos.x + Math.sign(dx);
                         const isFloorX = testNx >= 0 && testNx < mapW && tiles[currentNpc.pos.y][testNx] === TileType.FLOOR;
                         const isBlockedByNpcX = nextEntities.some(e => e.id !== currentNpc.id && e.pos.x === testNx && e.pos.y === currentNpc.pos.y && e.type === 'NPC');
                         if (isFloorX && !isBlockedByNpcX) { nx = testNx; moved = true; }
                    }
                }
            } else {
                const dirs = [{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0}];
                const d = dirs[Math.floor(Math.random()*4)];
                const testNx = nx + d.x;
                const testNy = ny + d.y;
                if (testNx >= 0 && testNx < mapW && testNy >= 0 && testNy < mapH && tiles[testNy][testNx] === TileType.FLOOR) {
                     if (!nextEntities.some(other => other.id !== currentNpc.id && other.pos.x === testNx && other.pos.y === testNy && other.type === 'NPC')) {
                        nx = testNx; ny = testNy; moved = true;
                    }
                }
            }

            if (moved || (nx === currentPPos.x && ny === currentPPos.y)) { 
                if (nx === currentPPos.x && ny === currentPPos.y) {
                    currentNpc.pos = { x: nx, y: ny };
                    if (!foundTarget) foundTarget = currentNpc;
                } else {
                    currentNpc.pos = { x: nx, y: ny };
                }
            }
        }

        if (foundTarget) {
            // FIX: Use explicit const variables and type assertion to ensure TS inference holds in closure
            const target: Entity = foundTarget;
            const npcTypeVal = target.npcType;
            
            if (npcTypeVal) {
                // Pre-calculate name to avoid indexing inside setTimeout
                const npcNameVal = NPC_NAMES[npcTypeVal as NpcType];
                
                setTimeout(() => {
                    audioManager.playEncounter();
                    setAggressionData({ active: true, npcName: npcNameVal });
                    setTimeout(() => {
                        setAggressionData({ active: false, npcName: null });
                        startBattle(target);
                    }, 1000);
                }, 0);
            }
        }

        return nextEntities;
     });
  };

  const startBattle = (npc: Entity) => {
    if (battleState.isActive) return;
    const scenario = getRandomBattleScenario(npc.npcType!, gameState.usedScenarioIds);
    setBattleState({
      isActive: true,
      npcId: npc.id,
      npcType: npc.npcType!,
      currentRound: 1,
      playerWins: 0,
      npcWins: 0,
      currentScenario: scenario,
      history: [],
      isThinking: false,
      result: null,
      currentHand: drawHandFromScenario(scenario),
      lastFeedback: null,
      examScore: 0,
      potProgress: 50 
    });
    setGameState(prev => ({
      ...prev,
      usedScenarioIds: [...prev.usedScenarioIds, scenario.stableId]
    }));
    addLog(`【遭遇】${NPC_NAMES[npc.npcType!]}拦住了你！`);
  };

  const handleCardSelect = (card: BattleCard) => {
    const isSuccess = card.isCorrect;
    const mapType = gameState.mapType;

    // SFX (handled in BattleInterface now for immediate feedback)
    // audioManager.playAttack(); 

    let nextExamScore = battleState.examScore;
    let nextPotProgress = battleState.potProgress;
    let nextPlayerWins = battleState.playerWins;
    let nextNpcWins = battleState.npcWins;
    let finalResult: 'WIN' | 'LOSE' | null = null;

    if (isSuccess) nextPlayerWins++; else nextNpcWins++;

    if (mapType === MapType.SCHOOL) {
        if (isSuccess) {
            if (nextPlayerWins === 1) nextExamScore = 28;
            if (nextPlayerWins === 2) nextExamScore = 59;
            if (nextPlayerWins >= 3) { nextExamScore = 100; finalResult = 'WIN'; }
        }
        if (battleState.currentRound >= 5 && nextExamScore < 100 && !finalResult) {
            finalResult = 'LOSE';
        }
    } else if (mapType === MapType.COMPANY) {
        if (isSuccess) nextPotProgress = Math.min(100, nextPotProgress + 10);
        else nextPotProgress = Math.max(0, nextPotProgress - 10);

        if (nextPlayerWins >= 3) finalResult = 'WIN';
        else if (nextNpcWins >= 3) finalResult = 'LOSE';
    } else {
        if (nextPlayerWins >= 3) finalResult = 'WIN';
        else if (nextNpcWins >= 3) finalResult = 'LOSE';
    }

    if (finalResult) {
         if (finalResult === 'WIN') audioManager.playWin();
         else audioManager.playLose();

         setBattleState(prev => ({ 
             ...prev, 
             playerWins: nextPlayerWins, 
             npcWins: nextNpcWins, 
             examScore: nextExamScore, 
             potProgress: nextPotProgress, 
             result: finalResult 
         }));
    } else {
        const nextRound = battleState.currentRound + 1;
        const nextScenario = getRandomBattleScenario(battleState.npcType!, gameState.usedScenarioIds);
        setBattleState(prev => ({ 
            ...prev, 
            playerWins: nextPlayerWins, 
            npcWins: nextNpcWins, 
            examScore: nextExamScore, 
            potProgress: nextPotProgress, 
            currentRound: nextRound,
            currentScenario: nextScenario,
            currentHand: drawHandFromScenario(nextScenario)
        }));
        setGameState(prev => ({ ...prev, usedScenarioIds: [...prev.usedScenarioIds, nextScenario.stableId] }));
    }
  };

  const handleBattleEnd = (won: boolean) => {
    if (won) {
      setEntities(prev => prev.map(e => e.id === battleState.npcId ? { ...e, isDead: true } : e));
      const config = MAP_CONFIGS[gameState.mapType];
      addLog(`【胜出】你在${config.name}的交锋中占据上风！`);
    } else {
      const newSanity = gameState.sanity - 1;
      setGameState(prev => ({ ...prev, sanity: newSanity }));
      addLog(`【败北】你的心理防线遭受重创。心碎 -1`);
      
      const mapH = tiles.length;
      const mapW = tiles[0].length;

      let placed = false;
      let attempts = 0;
      let newX = playerPos.x;
      let newY = playerPos.y;
      while(!placed && attempts < 20) {
          const dx = Math.floor(Math.random() * 5) - 2; 
          const dy = Math.floor(Math.random() * 5) - 2;
          const tx = playerPos.x + dx;
          const ty = playerPos.y + dy;
          if (tx >= 0 && tx < mapW && ty >= 0 && ty < mapH && tiles[ty][tx] === TileType.FLOOR && !(dx===0 && dy===0) && !entities.some(e => e.pos.x === tx && e.pos.y === ty && e.id !== 'player')) {
              newX = tx; newY = ty; placed = true;
          }
          attempts++;
      }
      if (placed) {
         setPlayerPos({ x: newX, y: newY });
         setEntities(prev => prev.map(e => e.type === 'PLAYER' ? { ...e, pos: { x: newX, y: newY } } : e));
         addLog("【系统】战术撤退至安全区域。");
      }
      if (newSanity <= 0) {
        setGameState(prev => ({ ...prev, isGameOver: true }));
        setEndingText("你彻底崩溃了。这个世界太难了，我想回火星。");
        setScreen('INTRO');
      }
    }
    setBattleState(prev => ({ ...prev, isActive: false, result: null, currentScenario: null, lastFeedback: null }));
  };

  // --- RENDERING SCREENS ---

  return (
    <div className={`h-[100dvh] w-screen flex flex-col justify-center bg-black text-yellow-50 relative overflow-hidden ${screen === 'GAME' ? MAP_CONFIGS[gameState.mapType].bgClass : ''}`}>
      
      {/* Global Mute Button (Top Right) for Start Screen only, or maybe general access? 
          User requested to move Mute button to Start Screen.
      */}
      
      {/* Audio Settings Modal */}
      {showAudioSettings && (
        <AudioSettingsModal 
          onClose={() => setShowAudioSettings(false)}
          audioState={audioState}
          onToggleBgm={handleToggleBgm}
          onToggleSfx={handleToggleSfx}
        />
      )}

      {screen === 'START' && (
        <div className="h-[100dvh] flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] relative">
          <div className="text-center mb-12 animate-in slide-in-from-top duration-700">
            <h1 className="text-6xl sm:text-7xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-yellow-600 drop-shadow-2xl">
              新春<br/>搜打撤
            </h1>
            <p className="text-yellow-100/60 font-mono tracking-[0.3em] uppercase mt-4 text-xs">Search, Fight, Evacuate</p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
            <button 
              onClick={() => { audioManager.resumeContext(); audioManager.playConfirm(); setScreen('MAP_SELECT'); }} 
              className="group relative px-8 py-5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(185,28,28,0.4)] border-b-4 border-red-900 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="flex items-center justify-center gap-3">
                <Play size={24} fill="currentColor" />
                <span className="text-xl">开始行动</span>
              </div>
            </button>

            <button 
              onClick={() => { audioManager.resumeContext(); audioManager.playConfirm(); setShowShop(true); }}
              className="group px-8 py-4 bg-yellow-900/40 hover:bg-yellow-800/50 text-yellow-500 font-bold rounded-xl transition-all border border-yellow-700/50 flex items-center justify-center gap-3"
            >
              <ShoppingCart size={20} />
              <span>神秘商店</span>
            </button>

            <button 
              onClick={() => { audioManager.resumeContext(); audioManager.playConfirm(); setScreen('COLLECTION'); }}
              className="group px-8 py-4 bg-yellow-700/20 hover:bg-yellow-700/30 text-yellow-500 font-bold rounded-xl transition-all border border-yellow-700/50 flex items-center justify-center gap-3"
            >
              <Book size={20} />
              <span>回忆图鉴</span>
            </button>

            {/* Audio Settings Button */}
            <button 
              onClick={openAudioSettings}
              className="group px-8 py-4 bg-black/40 hover:bg-black/60 text-white/70 font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-3"
            >
              {(!audioState.bgm || !audioState.sfx) ? <VolumeX size={20} /> : <Settings size={20} />}
              <span>声音设置</span>
            </button>
          </div>
          
          {showShop && <ShopModal money={money} inventory={consumables} onBuy={handleBuyItem} onClose={() => setShowShop(false)} />}
          
          {/* Footer */}
          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
             <p className="text-[10px] text-yellow-100/20 font-sans tracking-wide">
               ©游梦人生 工作室 全是玩梗 仅供娱乐 无不良导向
             </p>
          </div>
        </div>
      )}

      {screen === 'MAP_SELECT' && (
          <div className="h-[100dvh] bg-[#1a0505] p-4 flex flex-col items-center overflow-y-auto">
              <h2 className="text-2xl font-black text-white mb-6 mt-2 flex items-center gap-2">
                  <Map className="text-yellow-500" /> 选择你的战场
              </h2>
              <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
                  {/* HOME */}
                  <button onClick={() => handleSelectMap(MapType.HOME)} className="bg-[#2a1d18] border-2 border-red-900 rounded-xl p-4 text-left hover:border-red-500 transition-all hover:-translate-y-1 shadow-lg group relative overflow-hidden">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"><Home size={20} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-red-100 mb-1">{MAP_CONFIGS[MapType.HOME].name}</h3>
                            <p className="text-xs text-gray-400 line-clamp-2">{MAP_CONFIGS[MapType.HOME].desc}</p>
                            <div className="mt-2 text-[10px] text-yellow-600 bg-black/20 px-2 py-0.5 inline-block rounded">掉落: 红包, 老物件</div>
                        </div>
                      </div>
                  </button>
                  {/* SCHOOL */}
                  <button onClick={() => handleSelectMap(MapType.SCHOOL)} className="bg-[#0f172a] border-2 border-blue-900 rounded-xl p-4 text-left hover:border-blue-500 transition-all hover:-translate-y-1 shadow-lg group relative overflow-hidden">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"><GraduationCap size={20} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-100 mb-1">{MAP_CONFIGS[MapType.SCHOOL].name}</h3>
                            <p className="text-xs text-gray-400 line-clamp-2">{MAP_CONFIGS[MapType.SCHOOL].desc}</p>
                            <div className="mt-2 text-[10px] text-blue-400 bg-black/20 px-2 py-0.5 inline-block rounded">掉落: 试卷, 文具</div>
                        </div>
                      </div>
                  </button>
                  {/* COMPANY */}
                  <button onClick={() => handleSelectMap(MapType.COMPANY)} className="bg-[#1c1917] border-2 border-orange-900 rounded-xl p-4 text-left hover:border-orange-500 transition-all hover:-translate-y-1 shadow-lg group relative overflow-hidden">
                       <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"><Building2 size={20} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-orange-100 mb-1">{MAP_CONFIGS[MapType.COMPANY].name}</h3>
                            <p className="text-xs text-gray-400 line-clamp-2">{MAP_CONFIGS[MapType.COMPANY].desc}</p>
                            <div className="mt-2 text-[10px] text-orange-400 bg-black/20 px-2 py-0.5 inline-block rounded">掉落: 年终奖, 办公用品</div>
                        </div>
                      </div>
                  </button>
              </div>
              <button onClick={() => setScreen('START')} className="mt-6 mb-4 text-gray-500 hover:text-white flex items-center gap-2 text-sm">
                  <ArrowLeft size={14} /> 返回主菜单
              </button>
          </div>
      )}

      {screen === 'INTRO' && (
        <div className="h-[100dvh] flex items-center justify-center p-4 bg-black/90">
          <div className="max-w-md w-full bg-[#1a0505] border-2 border-yellow-900/50 p-6 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
             <h2 className="text-2xl font-black text-red-500 mb-6 border-b border-red-900/30 pb-4">
               {gameState.isVictory ? "撤离成功" : gameState.isGameOver ? "行动中止" : MAP_CONFIGS[gameState.mapType].name}
             </h2>
             <p className="text-base text-yellow-100/80 font-serif leading-relaxed mb-6 italic whitespace-pre-wrap">
               {gameState.isVictory || gameState.isGameOver ? endingText : introText}
             </p>

             {gameState.isVictory && (levelGainedMoney > 0 || gameState.inventory.filter(i => i.type === ItemType.MONEY_ITEM).length > 0) && (
                 <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl flex items-center gap-4">
                     <div className="p-2 bg-yellow-500 rounded-full text-black"><Coins size={20} /></div>
                     <div>
                         <div className="text-xs text-yellow-500/80 uppercase tracking-widest font-bold">收益结算</div>
                         <div className="flex items-baseline gap-2">
                             <div className="text-xl font-black text-yellow-300">¥{levelGainedMoney}</div>
                             {gameState.inventory.filter(i => i.type === ItemType.MONEY_ITEM).length > 0 && (
                                 <div className="text-[10px] text-yellow-500/60 font-mono">
                                     ({gameState.inventory.filter(i => i.type === ItemType.MONEY_ITEM).length} 个{MAP_CONFIGS[gameState.mapType].moneyItemName})
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
             )}
             
             {gameState.isVictory && gameState.inventory.filter(i => i.type === ItemType.UNIQUE_LOOT).length > 0 && (
               <div className="mb-8 p-4 bg-green-900/20 border border-green-800/50 rounded-xl">
                  <div className="flex items-center gap-2 text-green-400 font-bold mb-2 text-sm">
                     <Trophy size={16} />
                     <span>发现宝藏</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {gameState.inventory.filter(i => i.type === ItemType.UNIQUE_LOOT).map((item, idx) => (
                       <div key={idx} className="bg-black/40 p-1.5 rounded-lg border border-white/5 flex items-center">
                          <span className="text-lg">
                            {UNIQUE_LOOT_ITEMS.find(u => u.id === item.lootId)?.emoji || '📦'}
                          </span>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             <button 
              onClick={gameState.isGameOver || gameState.isVictory ? handleReturnToMenu : handleEnterLevel}
              className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-black rounded-xl text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
             >
               {gameState.isGameOver || gameState.isVictory ? <RefreshCw size={20} /> : <Play size={20} fill="currentColor" />}
               <span>{gameState.isGameOver || gameState.isVictory ? "回到主页" : "开始潜入"}</span>
             </button>
          </div>
        </div>
      )}

      {/* GAME UI */}
      {screen === 'GAME' && (
        <>
          {/* TOAST NOTIFICATION (NEW) */}
          {toastMessage && (
              <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-sm pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="bg-black/80 backdrop-blur-md border border-yellow-500/50 text-yellow-100 p-4 rounded-xl shadow-2xl flex items-start gap-3">
                      <div className="text-xl">👀</div>
                      <div className="text-sm font-medium leading-relaxed">{toastMessage}</div>
                  </div>
              </div>
          )}

          {/* 遭遇战警示 */}
          {aggressionData.active && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="relative rotate-[-5deg]">
                  <div className="absolute inset-0 bg-red-500 blur-[40px] opacity-60 animate-pulse"></div>
                  <h1 className="relative text-3xl font-black text-white py-2 px-6 bg-red-600 border-4 border-white shadow-xl">
                     {aggressionData.npcName} 出现!
                  </h1>
               </div>
            </div>
          )}

          {/* 道具确认 */}
          {selectedItemForUse && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedItemForUse(null)}>
                  <div className="bg-[#1a0505] p-6 rounded-xl border-2 border-yellow-500/50 w-full max-w-xs text-center shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                      <div className="text-5xl mb-4">{CONSUMABLES_DATA[selectedItemForUse].emoji}</div>
                      <h3 className="text-lg font-bold text-yellow-100 mb-2">{CONSUMABLES_DATA[selectedItemForUse].name}</h3>
                      <div className="flex gap-2 mt-4">
                          <button onClick={() => setSelectedItemForUse(null)} className="flex-1 py-2 bg-gray-800 rounded text-gray-300 text-sm">取消</button>
                          <button onClick={() => handleUseItem(selectedItemForUse)} className="flex-1 py-2 bg-yellow-600 text-white rounded text-sm">使用</button>
                      </div>
                  </div>
              </div>
          )}

          {/* HUD Header */}
          <div className="shrink-0 w-full max-w-md mx-auto flex justify-between items-end px-4 py-3 z-10">
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                      threatLevel === 3 ? 'bg-red-500 shadow-[0_0_8px_red]' : 
                      threatLevel === 2 ? 'bg-orange-500' : 
                      threatLevel === 1 ? 'bg-yellow-500' : 'bg-green-500'
                   }`} />
                   <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/50">
                      THREAT: {threatLevel}
                   </span>
                   {gameState.invisibleSteps > 0 && (
                       <span className="text-[10px] text-blue-300 flex items-center gap-1 bg-blue-900/30 px-1.5 rounded font-bold">
                           👻 {gameState.invisibleSteps}
                       </span>
                   )}
                </div>
                <h1 className="text-lg font-black tracking-tight text-white/90">{MAP_CONFIGS[gameState.mapType].name}</h1>
             </div>
             
             <div className="flex flex-col items-end">
                <div className="flex gap-1 mb-1">
                  {Array.from({length: gameState.maxSanity}).map((_, i) => (
                    <Heart key={i} size={14} fill={i < gameState.sanity ? "#ef4444" : "none"} className={i < gameState.sanity ? "text-red-500" : "text-white/10"} />
                  ))}
                </div>
                <span className="text-[10px] text-white/30 font-mono">SANITY</span>
             </div>
          </div>

          {/* 地图核心区域：固定高度 440px (11个格子) 以适配移动端并防止被遮挡 */}
          <div className="w-full max-w-md mx-auto relative overflow-hidden h-[440px] shrink-0 border-y border-[#3a201d] bg-[#0a0a0a]">
              <GridMap 
                tiles={tiles} 
                entities={entities} 
                playerPos={playerPos} 
                mapType={gameState.mapType}
                onCellClick={(dx, dy) => handlePlayerMove(dx, dy)}
                onInteract={handleObstacleInteract}
              />
          </div>

          {/* 底部交互区 */}
          <div className="shrink-0 w-full max-w-md mx-auto flex flex-col gap-2 p-3 pb-8 z-40 bg-gradient-to-t from-black to-transparent">
              {/* 道具栏 */}
              <div className="flex gap-2">
                  {(Object.entries(consumables) as [ConsumableType, number][]).map(([type, count]) => (
                      <button 
                          key={type}
                          onClick={() => count > 0 && setSelectedItemForUse(type)}
                          disabled={count === 0}
                          className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                              count > 0 
                              ? 'bg-blue-900/30 border-blue-500/30 text-blue-200 active:scale-95 shadow-lg' 
                              : 'bg-white/5 border-white/5 text-white/10'
                          }`}
                      >
                          <span className="text-xl">{CONSUMABLES_DATA[type].emoji}</span>
                          <span className="text-xs font-bold">{count}</span>
                      </button>
                  ))}
              </div>

              {/* 背包摘要 */}
              <div className="h-14 bg-black/40 border border-white/5 rounded-xl flex items-center px-3 gap-2 overflow-x-auto scrollbar-hide">
                  {gameState.inventory.length === 0 && <span className="text-[10px] text-white/20 italic mx-auto">背包空空如也...</span>}
                  {gameState.inventory.map((item, idx) => (
                      <div key={idx} className="flex-shrink-0 w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-xl shadow-inner border border-white/5">
                          {item.type === ItemType.UNIQUE_LOOT 
                          ? UNIQUE_LOOT_ITEMS.find(u => u.id === item.lootId)?.emoji 
                          : MAP_CONFIGS[gameState.mapType].moneyItemEmoji}
                      </div>
                  ))}
              </div>

              {/* 简易日志 */}
              <div className="h-10 overflow-hidden flex flex-col justify-center px-1">
                  <div className="text-[10px] font-mono text-white/30 uppercase flex justify-between">
                      <span>Steps: {gameState.totalSteps}</span>
                      <div className="flex gap-3">
                          <button onClick={() => setScreen('START')} className="hover:text-white flex items-center gap-1"><ArrowLeft size={10}/>退出</button>
                      </div>
                  </div>
                  <div className="truncate text-[10px] font-mono text-yellow-500/80 mt-1">
                     {gameState.logs[0] || "潜行中..."}
                  </div>
              </div>
          </div>

          {battleState.isActive && (
            <BattleInterface 
              battleState={battleState} 
              mapType={gameState.mapType}
              onCardSelect={handleCardSelect} 
              onBattleEnd={handleBattleEnd} 
            />
          )}
        </>
      )}

      {screen === 'COLLECTION' && (
        <CollectionGallery 
          unlockedItems={unlockedItems} 
          onClose={() => setScreen('START')} 
          onReset={handleResetProgress}
        />
      )}
    </div>
  );
};

export default App;
