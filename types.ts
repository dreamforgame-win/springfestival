
export type Position = {
  x: number;
  y: number;
};

export enum MapType {
  HOME = 'HOME',
  SCHOOL = 'SCHOOL',
  COMPANY = 'COMPANY'
}

export enum TileType {
  FLOOR = 'FLOOR',
  WALL = 'WALL', 
  EXIT = 'EXIT',
  OBSTACLE_SOFA = 'OBSTACLE_SOFA', // Generic obstacle for Home
  OBSTACLE_TV = 'OBSTACLE_TV',
  OBSTACLE_PLANT = 'OBSTACLE_PLANT',
  OBSTACLE_TABLE = 'OBSTACLE_TABLE', // Dining table / Generic table
  OBSTACLE_BED = 'OBSTACLE_BED',     // New: Bed
  OBSTACLE_DESK = 'OBSTACLE_DESK',   // New: School/Office Desk
}

export enum ItemType {
  SNACK = 'SNACK',
  MONEY_ITEM = 'MONEY_ITEM', // Replaces RED_ENVELOPE (Home: Red Envelope, School: Test Paper, Company: Reimbursement)
  UNIQUE_LOOT = 'UNIQUE_LOOT', 
}

export enum ConsumableType {
  SPRAY = 'SPRAY', // 隐形喷雾
  DICE = 'DICE'    // 重力骰子
}

export enum LootRarity {
  BLUE = 'BLUE',     // Common 
  PURPLE = 'PURPLE', // Rare 
  ORANGE = 'ORANGE', // Epic 
  RED = 'RED'        // Legendary 
}

export interface LootMetadata {
  id: string;
  name: string;
  emoji: string;
  story: string;
  value: number;
  rarity: LootRarity;
  mapType: MapType; // Limit loot to specific maps
}

export interface Entity {
  id: string;
  type: 'PLAYER' | 'NPC' | 'ITEM';
  pos: Position;
  npcType?: NpcType;
  itemType?: ItemType;
  lootId?: string; 
  isDead?: boolean;
}

export interface GameState {
  mapType: MapType;
  sanity: number;
  maxSanity: number;
  inventory: Array<{ type: ItemType, lootId?: string }>;
  isGameOver: boolean;
  isVictory: boolean;
  turn: number;
  totalSteps: number; 
  logs: string[];
  usedScenarioIds: string[]; 
  invisibleSteps: number; 
}

export enum NpcType {
  // HOME
  AUNT = 'AUNT', UNCLE = 'UNCLE', GRANDMA = 'GRANDMA', COUSIN = 'COUSIN', KID = 'KID', DAD = 'DAD', MOM = 'MOM',
  // SCHOOL
  TEACHER_MATH = 'TEACHER_MATH', TEACHER_ENG = 'TEACHER_ENG', PRINCIPAL = 'PRINCIPAL', STUDENT_NERD = 'STUDENT_NERD', STUDENT_BULLY = 'STUDENT_BULLY',
  // COMPANY
  BOSS = 'BOSS', CLIENT = 'CLIENT', PM = 'PM', COLLEAGUE_SLACKER = 'COLLEAGUE_SLACKER', COLLEAGUE_TRYHARD = 'COLLEAGUE_TRYHARD'
}

export enum BattleTopic {
  // Generic / Home
  MARRIAGE = '催婚', SALARY = '工资', JOB = '工作', HEALTH = '健康', GRADES = '成绩', LIFE = '生活',
  // School
  EXAM = '考试', DISCIPLINE = '纪律', FUTURE = '前途',
  // Company
  KPI = '绩效', DEADLINE = '死线', OVERTIME = '加班', BLAME = '甩锅'
}

export interface BattleCard {
  id: string;
  name: string;
  description: string;
  isCorrect: boolean; 
  actionType: 'TALK' | 'ACTION';
  emoji?: string;
}

export interface BattleScenario {
  id: string;
  npcType: NpcType;
  topic: BattleTopic;
  dialogue: string;
  cards: BattleCard[]; 
  stableId: string; 
}

export interface BattleState {
  isActive: boolean;
  npcId: string | null;
  npcType: NpcType | null;
  currentRound: number; 
  playerWins: number;
  npcWins: number;
  currentScenario: BattleScenario | null;
  history: string[]; 
  isThinking: boolean; 
  result: 'WIN' | 'LOSE' | null;
  currentHand: BattleCard[]; 
  lastFeedback: 'CORRECT' | 'WRONG' | null;
  
  // Specific for School
  examScore: number; // 0, 28, 59, 100
  
  // Specific for Company
  potProgress: number; // 0 to 100, starts at 50. Player wins pushes > 50.
}
