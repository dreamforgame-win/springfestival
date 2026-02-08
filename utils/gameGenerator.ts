
import { NPC_COUNT, UNIQUE_LOOT_ITEMS, LOOT_COUNT, ENV_COUNT, MAP_DIMENSIONS } from "../constants";
import { Entity, ItemType, NpcType, Position, TileType, LootRarity, MapType } from "../types";

// Helper to fill a rectangle (with boundary checks)
const fillRect = (tiles: TileType[][], x: number, y: number, w: number, h: number, type: TileType) => {
  const gridH = tiles.length;
  const gridW = tiles[0].length;
  for (let i = y; i < y + h; i++) {
    for (let j = x; j < x + w; j++) {
      if (i >= 0 && i < gridH && j >= 0 && j < gridW) {
        tiles[i][j] = type;
      }
    }
  }
};

// Helper to check valid spawn position
const isValidSpawn = (tiles: TileType[][], entities: Entity[], x: number, y: number) => {
    const gridH = tiles.length;
    const gridW = tiles[0].length;
    return x >= 0 && x < gridW && y >= 0 && y < gridH && 
           tiles[y][x] === TileType.FLOOR && 
           !entities.some(e => e.pos.x === x && e.pos.y === y);
}

// --- HOME GENERATOR (15x15) ---
const generateHomeLayout = (tiles: TileType[][]) => {
    const w = tiles[0].length;
    const h = tiles.length;
    
    // Clear all
    fillRect(tiles, 0, 0, w, h, TileType.FLOOR);

    const midX = 7;
    const midY = 7;

    // Central Cross Walls
    fillRect(tiles, midX, 0, 1, h, TileType.WALL); // Vertical
    fillRect(tiles, 0, midY, w, 1, TileType.WALL); // Horizontal

    // Doors (Gaps in walls)
    tiles[midY][2] = TileType.FLOOR; // Door to TL (Master Bed)
    tiles[midY][12] = TileType.FLOOR; // Door to TR (Guest Bed)
    tiles[3][midX] = TileType.FLOOR; // Door between TL and TR (maybe not) -> Door to Hallway
    tiles[11][midX] = TileType.FLOOR; // Door between BL and BR

    // Make Center Hallway Open
    fillRect(tiles, midX, midY - 2, 1, 5, TileType.FLOOR); // Open vertical center
    fillRect(tiles, midX - 2, midY, 5, 1, TileType.FLOOR); // Open horizontal center

    // --- FURNITURE ---
    // TL: Master Bedroom
    tiles[1][1] = TileType.OBSTACLE_BED;
    tiles[1][2] = TileType.OBSTACLE_BED; 
    tiles[4][1] = TileType.OBSTACLE_PLANT;
    tiles[1][4] = TileType.OBSTACLE_TV;

    // TR: Guest Bedroom / Kids Room
    tiles[1][12] = TileType.OBSTACLE_BED;
    tiles[2][13] = TileType.OBSTACLE_DESK; // Study desk

    // BL: Kitchen & Dining
    tiles[10][1] = TileType.OBSTACLE_TABLE; // Dining Table
    tiles[10][2] = TileType.OBSTACLE_TABLE;
    tiles[11][1] = TileType.OBSTACLE_TABLE;
    tiles[11][2] = TileType.OBSTACLE_TABLE;
    tiles[13][4] = TileType.OBSTACLE_PLANT;

    // BR: Living Room
    tiles[9][10] = TileType.OBSTACLE_SOFA;
    tiles[9][11] = TileType.OBSTACLE_SOFA;
    tiles[9][12] = TileType.OBSTACLE_SOFA;
    tiles[12][11] = TileType.OBSTACLE_TV;

    return { 
        spawnZones: { player: [{x:7, y:7}], exit: [{x:0, y:0}, {x:14,y:0}] } // Hallway spawn
    };
};

// --- SCHOOL GENERATOR (30x30) ---
const generateSchoolLayout = (tiles: TileType[][]) => {
    const w = tiles[0].length; // 30
    const h = tiles.length;    // 30
    
    // Fill all floor
    fillRect(tiles, 0, 0, w, h, TileType.FLOOR);

    // Structure:
    // Top 2/3 (0-19) Classrooms
    // Bottom 1/3 (20-29) Corridor / Playground

    // Horizontal wall separating corridor
    fillRect(tiles, 0, 20, w, 1, TileType.WALL);

    // Vertical walls splitting classrooms into 3 columns (at 10 and 20)
    fillRect(tiles, 10, 0, 1, 20, TileType.WALL);
    fillRect(tiles, 20, 0, 1, 20, TileType.WALL);

    // Doors to corridor
    tiles[20][5] = TileType.FLOOR; // Left room door
    tiles[20][15] = TileType.FLOOR; // Center room door
    tiles[20][25] = TileType.FLOOR; // Right room door

    // Add extra horizontal dividers inside classroom columns to make 6 classrooms (3 cols x 2 rows)
    // Horizontal divider at y=10 for all columns
    fillRect(tiles, 0, 10, w, 1, TileType.WALL);
    // Doors for inner classrooms
    tiles[10][5] = TileType.FLOOR;
    tiles[10][15] = TileType.FLOOR;
    tiles[10][25] = TileType.FLOOR;

    // Desks in Classrooms
    // 6 Rooms: (0,0)-(9,9), (10,0)-(19,9), (20,0)-(29,9)
    //          (0,11)-(9,19), (10,11)-(19,19), (20,11)-(29,19)
    
    const placeDesksInRoom = (rx: number, ry: number) => {
        // Teacher desk at top center of room
        tiles[ry+1][rx+4] = TileType.OBSTACLE_TABLE;
        // Student desks
        for(let r = ry+3; r < ry+8; r+=2) {
            for(let c = rx+2; c < rx+8; c+=2) {
                tiles[r][c] = TileType.OBSTACLE_DESK;
            }
        }
    };

    // Top row rooms
    placeDesksInRoom(0,0);
    placeDesksInRoom(10,0);
    placeDesksInRoom(20,0);
    // Bottom row rooms
    placeDesksInRoom(0,11);
    placeDesksInRoom(10,11);
    placeDesksInRoom(20,11);

    // Plants in corridor
    for(let x=2; x<w; x+=5) {
        tiles[22][x] = TileType.OBSTACLE_PLANT;
        tiles[28][x] = TileType.OBSTACLE_PLANT;
    }

    // Exits: Bottom Left and Bottom Right
    const exitZones = [{x:0, y:29}, {x:29, y:29}];

    return { 
        spawnZones: { player: [{x:15, y:25}], exit: exitZones } // Spawn in corridor
    };
};

// --- COMPANY GENERATOR (30x30) ---
const generateCompanyLayout = (tiles: TileType[][]) => {
    const w = tiles[0].length; // 30
    const h = tiles.length;    // 30

    // Open Plan
    fillRect(tiles, 0, 0, w, h, TileType.FLOOR);

    // Top Left: Boss Office (Enclosed, bigger)
    // 10x8
    fillRect(tiles, 0, 8, 10, 1, TileType.WALL); // Bottom wall
    fillRect(tiles, 10, 0, 1, 9, TileType.WALL); // Right wall
    tiles[8][5] = TileType.FLOOR; // Door
    
    // Boss Furniture
    tiles[2][4] = TileType.OBSTACLE_TABLE; // Boss Desk
    tiles[2][3] = TileType.OBSTACLE_PLANT;
    tiles[2][5] = TileType.OBSTACLE_PLANT;
    tiles[5][2] = TileType.OBSTACLE_SOFA; 
    tiles[5][3] = TileType.OBSTACLE_SOFA;

    // Top Right: Meeting Room (Enclosed)
    // 10x8 at (20,0)
    fillRect(tiles, 19, 0, 1, 9, TileType.WALL); // Left wall
    fillRect(tiles, 19, 8, 11, 1, TileType.WALL); // Bottom wall
    tiles[8][25] = TileType.FLOOR; // Door

    // Meeting Table (Long)
    fillRect(tiles, 22, 3, 6, 2, TileType.OBSTACLE_TABLE);

    // Cubicle Islands
    // Grid of islands starting from y=12
    const placeIsland = (x: number, y: number) => {
        // 2x2 desks back to back
        tiles[y][x] = TileType.OBSTACLE_DESK;
        tiles[y][x+1] = TileType.OBSTACLE_DESK;
        tiles[y+1][x] = TileType.OBSTACLE_DESK;
        tiles[y+1][x+1] = TileType.OBSTACLE_DESK;
        // Plants around
        if(x+2 < w) tiles[y][x+2] = TileType.OBSTACLE_PLANT;
    }

    for(let y=12; y<25; y+=5) {
        for(let x=2; x<28; x+=5) {
            placeIsland(x, y);
        }
    }

    // Pantry / Break area at bottom right
    fillRect(tiles, 25, 25, 5, 1, TileType.OBSTACLE_TABLE); // Counter

    // Exits: Main Entrance (Bottom Center) + Side Exit (Left)
    const exitZones = [{x:15, y:29}, {x:0, y:15}];

    return { 
        spawnZones: { player: [{x:15, y:15}], exit: exitZones } // Center spawn
    };
};

export const generateMap = (mapType: MapType) => {
  const dim = MAP_DIMENSIONS[mapType];
  const w = dim.w;
  const h = dim.h;
  
  const tiles: TileType[][] = Array(h).fill(null).map(() => Array(w).fill(TileType.FLOOR));
  
  // 1. Generate Layout based on MapType
  let layoutInfo;
  if (mapType === MapType.SCHOOL) {
      layoutInfo = generateSchoolLayout(tiles);
  } else if (mapType === MapType.COMPANY) {
      layoutInfo = generateCompanyLayout(tiles);
  } else {
      layoutInfo = generateHomeLayout(tiles);
  }

  const entities: Entity[] = [];
  let idCounter = 0;

  // 2. Place Player
  let playerPos: Position = { x: 0, y: 0 };
  let playerPlaced = false;
  
  // Try preferred spawn
  if (layoutInfo.spawnZones.player.length > 0) {
      const p = layoutInfo.spawnZones.player[0];
      if (tiles[p.y][p.x] === TileType.FLOOR) {
          playerPos = p;
          entities.push({ id: 'player', type: 'PLAYER', pos: playerPos });
          playerPlaced = true;
      }
  }
  // Fallback random
  while (!playerPlaced) {
    const x = Math.floor(Math.random() * w);
    const y = Math.floor(Math.random() * h);
    if (tiles[y][x] === TileType.FLOOR) {
      playerPos = { x, y };
      entities.push({ id: 'player', type: 'PLAYER', pos: playerPos });
      playerPlaced = true;
    }
  }

  // 3. Place Exits
  // For School/Company, use defined exits. For Home, calculate dynamic.
  // Actually, let's use the defined exits if available, otherwise dynamic.
  // The requirement is "add an extra exit" for School/Company.
  
  if (layoutInfo.spawnZones.exit.length > 0) {
      layoutInfo.spawnZones.exit.forEach(p => {
          if (tiles[p.y][p.x] === TileType.FLOOR) {
              tiles[p.y][p.x] = TileType.EXIT;
          }
      });
  } else {
      // Dynamic placement (Home fallback)
      let exitPlaced = false;
      while (!exitPlaced) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        const dist = Math.sqrt(Math.pow(x - playerPos.x, 2) + Math.pow(y - playerPos.y, 2));
        if (tiles[y][x] === TileType.FLOOR && dist > (Math.min(w,h)/2)) {
          tiles[y][x] = TileType.EXIT;
          exitPlaced = true;
        }
      }
  }

  // 4. Generate Loot
  const selectedLootIds: string[] = [];
  const mapLootPool = UNIQUE_LOOT_ITEMS.filter(item => item.mapType === mapType || (!item.mapType && mapType === MapType.HOME));
  
  // Scale loot count for larger maps? Maybe slightly more
  const lootCount = (w > 20) ? Math.floor(LOOT_COUNT * 1.5) : LOOT_COUNT;

  for (let i = 0; i < lootCount; i++) {
     const roll = Math.random() * 11; 
     let targetRarity = LootRarity.BLUE;
     if (roll > 10) targetRarity = LootRarity.RED;
     else if (roll > 8) targetRarity = LootRarity.ORANGE;
     else if (roll > 5) targetRarity = LootRarity.PURPLE;
     
     const pool = mapLootPool.filter(item => item.rarity === targetRarity && !selectedLootIds.includes(item.id));
     const finalPool = pool.length > 0 ? pool : mapLootPool.filter(item => !selectedLootIds.includes(item.id));
     
     if (finalPool.length > 0) {
        const pick = finalPool[Math.floor(Math.random() * finalPool.length)];
        selectedLootIds.push(pick.id);
        
        let placedLoot = false;
        let attempts = 0;
        while (!placedLoot && attempts < 50) {
            const x = Math.floor(Math.random() * w);
            const y = Math.floor(Math.random() * h);
            if (isValidSpawn(tiles, entities, x, y)) {
                entities.push({
                    id: `loot-${idCounter++}`,
                    type: 'ITEM',
                    pos: { x, y },
                    itemType: ItemType.UNIQUE_LOOT,
                    lootId: pick.id
                });
                placedLoot = true;
            }
            attempts++;
        }
     }
  }

  // 5. Money Items
  const envCount = (w > 20) ? Math.floor(ENV_COUNT * 1.5) : ENV_COUNT;
  for (let i = 0; i < envCount; i++) {
    let placedEnv = false;
    let attempts = 0;
    while (!placedEnv && attempts < 50) {
      const x = Math.floor(Math.random() * w);
      const y = Math.floor(Math.random() * h);
      if (isValidSpawn(tiles, entities, x, y)) {
        entities.push({
          id: `money-${idCounter++}`,
          type: 'ITEM',
          pos: { x, y },
          itemType: ItemType.MONEY_ITEM
        });
        placedEnv = true;
      }
      attempts++;
    }
  }

  // 6. NPCs
  let availableNpcs: NpcType[] = [];
  if (mapType === MapType.HOME) {
      availableNpcs = [NpcType.DAD, NpcType.MOM, NpcType.GRANDMA, NpcType.AUNT, NpcType.UNCLE, NpcType.COUSIN, NpcType.KID];
  } else if (mapType === MapType.SCHOOL) {
      availableNpcs = [NpcType.TEACHER_MATH, NpcType.TEACHER_ENG, NpcType.PRINCIPAL, NpcType.STUDENT_NERD, NpcType.STUDENT_BULLY];
  } else if (mapType === MapType.COMPANY) {
      availableNpcs = [NpcType.BOSS, NpcType.CLIENT, NpcType.PM, NpcType.COLLEAGUE_SLACKER, NpcType.COLLEAGUE_TRYHARD];
  }

  const npcTargetCount = (w > 20) ? Math.floor(NPC_COUNT * 1.5) : NPC_COUNT;
  const npcList: NpcType[] = [];
  for (let i = 0; i < npcTargetCount; i++) {
      npcList.push(availableNpcs[Math.floor(Math.random() * availableNpcs.length)]);
  }

  for (const npcType of npcList) {
    let placedNpc = false;
    let attempts = 0;
    while (!placedNpc && attempts < 100) {
      const x = Math.floor(Math.random() * w);
      const y = Math.floor(Math.random() * h);
      const distToPlayer = Math.sqrt(Math.pow(x - playerPos.x, 2) + Math.pow(y - playerPos.y, 2));
      const tooCloseToNpc = entities.some(e => e.type === 'NPC' && Math.sqrt(Math.pow(e.pos.x - x, 2) + Math.pow(e.pos.y - y, 2)) < 4);

      if (isValidSpawn(tiles, entities, x, y) && distToPlayer > 4 && !tooCloseToNpc) {
        entities.push({
          id: `npc-${idCounter++}`,
          type: 'NPC',
          pos: { x, y },
          npcType: npcType,
          isDead: false,
        });
        placedNpc = true;
      }
      attempts++;
    }
  }

  return { tiles, entities };
};
