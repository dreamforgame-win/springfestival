
import { BattleCard, BattleTopic, ItemType, NpcType, TileType, LootMetadata, LootRarity, ConsumableType, MapType } from "./types";

// Default/Base dimensions (Home)
export const GRID_W = 15;
export const GRID_H = 15;

export const MAP_DIMENSIONS: Record<MapType, { w: number, h: number }> = {
  [MapType.HOME]: { w: 15, h: 15 },
  [MapType.SCHOOL]: { w: 30, h: 30 },
  [MapType.COMPANY]: { w: 30, h: 30 }
};

export const MAX_SANITY = 5;
export const VISIBILITY_RADIUS = 3; 

export const AGGRESSION_PER_STEP = 0.005;
export const MAX_CHASE_PROBABILITY = 0.8;
export const STEPS_PER_STAGE = 20;

export const FURNITURE_COUNT = 25;
export const NPC_COUNT = 10;
export const LOOT_COUNT = 8;
export const ENV_COUNT = 7;

export const RED_ENVELOPE_AMOUNTS = [6, 12, 18, 66, 88, 128];

export const CONSUMABLES_DATA: Record<ConsumableType, { name: string, price: number, desc: string, emoji: string }> = {
  [ConsumableType.SPRAY]: {
    name: "隐形喷雾",
    price: 500,
    desc: "使用后5步内不会被NPC追踪",
    emoji: "🌫️"
  },
  [ConsumableType.DICE]: {
    name: "重力骰子",
    price: 500,
    desc: "随机传送到3格范围内的空地",
    emoji: "🎲"
  }
};

// --- OBSTACLE FLAVOR TEXT ---
export const OBSTACLE_QUOTES: Record<MapType, Partial<Record<TileType, string[]>>> = {
  [MapType.HOME]: {
    [TileType.OBSTACLE_TV]: [
      "📺 正在播放春晚，今年的表演居然都是机器人，而且不说相声改写代码了。",
      "📺 电视里在放《甄嬛传》，这已经是皇上第108次驾崩了。",
      "📺 广告时间：‘今年过节不收礼，收礼只收显卡’。",
      "📺 正在重播《难忘今宵》，提醒你假期余额已不足。",
      "📺 新闻联播大结局：春天来了，万物复苏。"
    ],
    [TileType.OBSTACLE_SOFA]: [
      "🛋️ 这是一个会“吃人”的沙发，坐下就再也起不来了。",
      "🛋️ 沙发缝里好像塞着五毛钱，是巨款！",
      "🛋️ 只要我瘫得够快，生活的烦恼就追不上我。",
      "🛋️ 这是猫主子的龙椅，你也敢坐？",
      "🛋️ 柔软度满分，适合思考‘中午吃什么’这个哲学问题。"
    ],
    [TileType.OBSTACLE_TABLE]: [
      "🍲 桌上摆满了砂糖橘，吃多了会变小黄人哦。",
      "🥟 饺子皮是买的，但馅儿是手剁的，这就是仪式感。",
      "🍲 这张桌子承载了家族几代人的八卦与催婚。",
      "🥢 筷子筒里有一根是纯金的……骗你的，是掉漆了。",
      "🍲 剩菜剩饭加热一下，又是一顿满汉全席。"
    ],
    [TileType.OBSTACLE_BED]: [
      "🛏️ 封印我的不是被子，是地心引力。",
      "🛏️ 梦里什么都有，快睡吧，梦里你发财了。",
      "🛏️ 被子上全是阳光的味道（其实是螨虫烤焦的味道）。",
      "🛏️ 床头柜藏着我的童年日记，全是黑历史。",
      "🛏️ 只要上了床，我就是世界上最幸福的咸鱼。"
    ],
    [TileType.OBSTACLE_PLANT]: [
      "🪴 这盆发财树快秃了，暗示了我的钱包状况。",
      "🪴 它是家里唯一的听众，虽然它听不懂。",
      "🪴 塑料花也是花，永不凋零的爱。",
      "🪴 别浇水了，它是仙人掌，不是水仙！"
    ]
  },
  [MapType.SCHOOL]: {
    [TileType.OBSTACLE_DESK]: [
      "📚 桌上刻着一个“早”字，鲁迅看了都说好。",
      "📚 桌肚里藏着一本武侠小说和半包辣条。",
      "📚 试卷堆成山，我在山中修仙。",
      "📚 这是同桌的三八线，越界要给一块橡皮。",
      "📚 趴在桌上睡出的红印，是青春的纹身。"
    ],
    [TileType.OBSTACLE_TABLE]: [
      "👨‍🏫 讲台是老师的舞台，粉笔灰是特效。",
      "👨‍🏫 只要站在讲台上，就能看到全班谁在偷吃零食。",
      "👨‍🏫 讲台下的多媒体柜子永远锁不上。",
      "👨‍🏫 这里的黑板擦主要功能是叫醒睡觉的同学。"
    ],
    [TileType.OBSTACLE_PLANT]: [
      "🌿 这盆绿萝是班里唯一的活物（除了同学）。",
      "🌿 它吸收了太多的粉笔灰，已经进化了。",
      "🌿 负责浇水的同学毕业了，它学会了自己喝水。",
      "🌿 别拔叶子了，它也怕疼。"
    ]
  },
  [MapType.COMPANY]: {
    [TileType.OBSTACLE_DESK]: [
      "💻 电脑屏幕贴着“莫生气”，气出病来无人替。",
      "💻 键盘里的饼干渣，记录了每一次加班。",
      "💻 屏幕保护程序是“我要暴富”，非常虔诚。",
      "💻 这把人体工学椅，见证了凌晨四点的城市。",
      "💻 只要我敲键盘的声音够大，老板就以为我在工作。"
    ],
    [TileType.OBSTACLE_SOFA]: [
      "🛋️ 午休圣地，手慢无。",
      "🛋️ 每一个在这睡过的同事，都梦到了被裁员。",
      "🛋️ 坐在这里，感觉自己是上市公司的董事长（并没有）。",
      "🛋️ 咖啡渍是它的勋章。"
    ],
    [TileType.OBSTACLE_PLANT]: [
      "🌵 仙人球：我承受了太多辐射，快变异了。",
      "🌵 这盆花是行政买的，假的，别浇水。",
      "🌵 它听到了太多公司机密，必须灭口。",
      "🌵 唯一的绿色，保护视力全靠它。"
    ],
    [TileType.OBSTACLE_TABLE]: [
      "☕ 会议桌：这里生产PPT，也生产废话。",
      "☕ 投影仪的线永远接不上，这是玄学。",
      "☕ 在这里开会，主要靠意念交流。",
      "☕ 既然解决不了问题，那就解决提出问题的人。"
    ]
  }
};

// --- MAP CONFIG (Updated with Positive Vibes) ---
export const MAP_CONFIGS: Record<MapType, { name: string, desc: string, moneyItemName: string, moneyItemEmoji: string, bgClass: string, introTexts: string[], endingTexts: string[] }> = {
  [MapType.HOME]: {
    name: "温馨老家",
    desc: "七大姑八大姨的围剿战场。",
    moneyItemName: "红包",
    moneyItemEmoji: "🧧",
    bgClass: "bg-[#1e1412]",
    introTexts: [
      "推开贴着福字的防盗门，热气腾腾的饺子香扑面而来。虽然亲戚们的关心有时让人招架不住，但这里永远是你的避风港。",
      "一年一度的家庭聚会，是挑战也是温情。准备好用你的高情商化解尴尬，在这个春节收获满满的祝福吧！",
      "厨房里传来剁馅的声音，电视里放着春晚。深吸一口气，用微笑面对长辈们的‘灵魂拷问’，因为那是他们表达爱的方式。",
    ],
    endingTexts: [
      "虽然有些疲惫，但看着手里厚厚的红包和家人们慈祥的笑脸，你明白这一切都是值得的。明年，还要常回家看看。",
      "无论外面的世界多大，家永远是你最坚实的后盾。带着这份温暖和力量，去迎接新一年的挑战吧！",
      "撤退不是逃避，是为了更好地出发。吃饱了年夜饭，整理好心情，你已经准备好面对未来的一切！",
    ]
  },
  [MapType.SCHOOL]: {
    name: "梦回一中",
    desc: "被试卷和班主任支配的恐惧。",
    moneyItemName: "高分试卷",
    moneyItemEmoji: "💯",
    bgClass: "bg-[#0f172a]",
    introTexts: [
      "阳光洒在课桌上，空气中弥漫着粉笔灰的味道。重回校园，不仅是为了回忆青春，更是为了弥补当年的遗憾。",
      "那个站在后门窗户口的班主任，那个总是借橡皮的同桌。这一次，用你的智慧和勇气，在知识的海洋里乘风破浪！",
      "上课铃声响起，你不再是那个懵懂的少年。面对老师的提问，请大声说出你的答案，做最自信的自己！",
    ],
    endingTexts: [
      "走出校门的那一刻，晚霞染红了天边。你收获的不仅是高分试卷，更是一段无悔的青春记忆。",
      "知识就是力量，而你已经掌握了通往未来的钥匙。感谢老师的教导，感谢那个努力奋斗的自己。",
      "虽然只是一次短暂的梦回，但那份为了梦想全力以赴的热血，将永远流淌在你的血液里。加油，少年！",
    ]
  },
  [MapType.COMPANY]: {
    name: "福报大厂",
    desc: "007工作制下的生存挑战。",
    moneyItemName: "年终奖",
    moneyItemEmoji: "💰",
    bgClass: "bg-[#1c1917]",
    introTexts: [
      "城市的霓虹灯下，写字楼依旧灯火通明。你是职场中的奋斗者，用汗水浇灌梦想，用努力证明价值。",
      "面对复杂的工作任务和人际关系，保持冷静和专业是你的必修课。相信自己，你就是这个舞台上最耀眼的主角。",
      "每一次加班，每一份报表，都是你成长的阶梯。在这个充满挑战的职场，展现你的才华，赢取属于你的荣耀！",
    ],
    endingTexts: [
      "合上电脑，看着窗外的万家灯火，你感到一种前所未有的充实。所有的付出都有回报，你值得最好的年终奖！",
      "你用实力赢得了同事的尊重和老板的认可。职场之路虽然艰辛，但你每一步都走得坚定而有力。",
      "暂时告别繁忙的工作，去享受属于你的生活吧。休息是为了走更远的路，未来的你一定会感谢现在拼搏的自己。",
    ]
  }
};

// --- LOOT GENERATION (88 items per map = 264 Total) ---
// Rarity Distribution: 8 Red, 20 Orange, 20 Purple, 40 Blue

const createLoot = (id: string, name: string, emoji: string, val: number, rarity: LootRarity, mapType: MapType, story: string): LootMetadata => ({
  id, name, emoji, value: val, rarity, mapType, story
});

// Generators
const generateMapLoot = (mapType: MapType, prefix: string): LootMetadata[] => {
  const items: LootMetadata[] = [];
  let idCounter = 1;

  // Configuration for each map
  const configs = {
    [MapType.HOME]: {
      red: [
        ["传家玉镯", "💍", "奶奶手腕上戴了六十年的物件，水头极好。"], ["族谱孤本", "📜", "纸张已经酥脆。记载了家族三百年的兴衰。"], ["抗战勋章", "🎖️", "爷爷的铁血荣耀。那是用鲜血换来的和平。"], ["80年茅台", "🍶", "大伯藏在床底下的宝贝，只有大喜事才舍得喝。"], ["老房地契", "🏠", "家族的根基所在，承载着几代人的记忆。"], ["金丝楠木盒", "📦", "祖上传下来的首饰盒，散发着淡淡幽香。"], ["翡翠白菜", "🥬", "虽然只有巴掌大，但晶莹剔透，寓意百财。"], ["袁大头银元", "🪙", "曾祖父留下来的压箱底宝贝，吹一下嗡嗡响。"]
      ],
      orange: [
        ["海鸥相机", "📷", "双反镜头里的倒影。"], ["红灯收音机", "📻", "电子管发出的暖光。"], ["蝴蝶缝纫机", "🧵", "妈妈当年的嫁妆。"], ["小霸王", "🎮", "其乐无穷！"], ["大哥大", "📱", "整条街最靓的仔。"], ["黑胶唱片机", "💽", "流淌出旧时光的旋律。"], ["永久牌自行车", "🚲", "爸爸当年娶妈妈时的婚车。"], ["机械座钟", "🕰️", "每到整点就会发出沉稳的钟声。"], ["老式手电筒", "🔦", "装两节大号电池，铁皮外壳锃亮。"], ["搪瓷脸盆", "🛁", "印着双喜和牡丹花，结实耐用。"],
        ["铁皮青蛙", "🐸", "拧紧发条就会蹦蹦跳跳。"], ["玻璃弹珠", "🔮", "小时候的硬通货。"], ["小人书", "📚", "泛黄的纸张画着三国演义。"], ["像章", "📛", "那个火红年代的记忆。"], ["粮票", "🎫", "一段特殊历史的见证。"], ["煤油灯", "🏮", "停电时的光亮。"], ["暖水壶", "🍶", "软木塞散发着开水的热气。"], ["搓衣板", "🪵", "不仅能洗衣，还能跪。"], ["顶针", "💍", "奶奶缝补衣物时的工具。"], ["老算盘", "🧮", "噼里啪啦的算账声。"]
      ],
      purple: [
        ["鸡毛掸子", "🧹", "小时候最怕的‘家法’。"], ["痒痒挠", "🥢", "背面是鞋拔子。"], ["风油精", "🧴", "提神醒脑，蚊虫克星。"], ["万金油", "🔴", "哪里不舒服涂哪里。"], ["大白兔奶糖", "🍬", "甜甜蜜蜜的童年回忆。"], ["麦乳精", "☕", "小时候最高级的饮料。"], ["健力宝", "🥤", "魔水的味道。"], ["水果罐头", "🥫", "生病了才能吃到的美味。"], ["挂历", "📅", "每家每户墙上都有。"], ["蒲扇", "🍃", "夏夜纳凉的神器。"],
        ["老花镜", "👓", "爷爷看报纸必备。"], ["收音机天线", "📶", "拉长了信号才好。"], ["磁带", "📼", "用铅笔卷回去。"], ["火柴盒", "🔥", "划亮微弱的光。"], ["针线包", "🧵", "慈母手中线。"], ["苍蝇拍", "🏸", "快准狠。"], ["痰盂", "🏺", "经典的红双喜图案。"], ["痒痒粉", "✨", "恶作剧专用。"], ["玻璃丝", "🎗️", "编手链用的。"], ["大大卷", "🍥", "可以吹很大的泡泡。"]
      ],
      blue: 40 // Fill generic items
    },
    [MapType.SCHOOL]: {
      red: [
        ["校长假发", "💇‍♂️", "全校最大的秘密，拿到它你就掌握了话语权。"], ["没收的Gameboy", "🕹️", "教导处保险柜里的传说。"], ["全校排名榜", "🏆", "第一名永远是那个叫“小明”的人。"], ["绝版球鞋", "👟", "虽然旧了，但是乔丹穿过的同款。"], ["满分作文集", "📝", "被语文老师在全班朗读过的神作。"], ["实验室钥匙", "🔑", "通往神秘化学实验室的唯一途径。"], ["校花日记", "📔", "记载了无数青春的秘密。"], ["免死金牌", "🏅", "甚至可以免除一次叫家长。"]
      ],
      orange: [
        ["情书大全", "💌", "校草收到的情书合集。"], ["标准答案", "📑", "考试前一晚的硬通货。"], ["多媒体遥控器", "📶", "掌握了它，你就掌握了全班的娱乐命脉。"], ["篮球场篮网", "🏀", "灌篮高手留下的纪念。"], ["随身听", "🎧", "单曲循环周杰伦。"], ["电子词典", "📟", "其实是用来玩游戏的。"], ["漫画书", "📖", "上课偷偷在桌肚里看。"], ["毕业纪念册", "📒", "写满了同学们的祝福。"], ["限量版笔袋", "👝", "打开有三层的那种。"], ["自动铅笔芯", "✏️", "永远不够用。"],
        ["修正带", "🏳️", "涂改液的进化版。"], ["圆规", "📍", "扎橡皮的神器。"], ["三角板", "📐", "打人挺疼的。"], ["红领巾", "🧣", "鲜艳的红色。"], ["校徽", "📛", "进校门必须佩戴。"], ["值日生袖章", "🔴", "权力的象征。"], ["广播站话筒", "🎙️", "向全校广播你的声音。"], ["流动红旗", "🚩", "班级荣誉。"], ["粉笔擦", "🧽", "吃灰神器。"], ["教鞭", "🥖", "老师的武器。"]
      ],
      purple: [
        ["晨光祈福笔", "✏️", "据说用了它，蒙题全对。"], ["涂改液", "🧴", "桌面文化的绘图工具。"], ["mp3播放器", "🎧", "里面全是流行歌。"], ["五三模拟", "📚", "紫色的噩梦。"], ["黄冈试卷", "📄", "做完就能考满分。"], ["王后雄学案", "📖", "厚厚的一大本。"], ["英语磁带", "📼", "李雷和韩梅梅。"], ["作弊小抄", "📃", "缩印的艺术。"], ["便利贴", "📝", "互相传纸条。"], ["透明胶带", "⭕", "粘掉错字。"],
        ["橡皮泥", "🧱", "美术课的快乐。"], ["水彩笔", "🖌️", "画画专用。"], ["直笛", "🎵", "音乐课魔音贯耳。"], ["跳绳", "➰", "体育中考必备。"], ["实心球", "⚫", "扔不远。"], ["眼保健操图", "👀", "按揉攒竹穴。"], ["课程表", "📅", "除了体育课都是主课。"], ["请假条", "🗒️", "模仿家长签名。"], ["检讨书", "📜", "深刻反省。"], ["奖状", "🏵️", "贴在墙上。"]
      ],
      blue: 40
    },
    [MapType.COMPANY]: {
      red: [
        ["公章", "💮", "权力的象征，别随便乱盖。"], ["老板球杆", "⛳", "谈过亿项目才拿出来。"], ["S级绩效单", "📈", "打工人的至高荣耀。"], ["公司期权", "📃", "虽然现在是纸，万一上市了呢？"], ["核心代码", "💻", "公司的机密，价值连城。"], ["客户名单", "📇", "销售的命根子。"], ["报销单据", "🧾", "积少成多，也是一笔巨款。"], ["老板的秘密", "🤫", "知道了这个，你在公司横着走。"]
      ],
      orange: [
        ["人体工学椅", "💺", "保卫腰间盘。"], ["机械键盘", "⌨️", "噼里啪啦的生产力工具。"], ["星巴克卡", "☕", "无限续杯的快乐。"], ["降噪耳机", "🎧", "戴上就是全世界。"], ["双屏显示器", "🖥️", "效率翻倍。"], ["升降桌", "🪜", "站着办公更健康。"], ["午睡床", "🛏️", "加班狗的第二个家。"], ["按摩仪", "💆", "缓解颈椎疼痛。"], ["加湿器", "♨️", "办公室补水神器。"], ["绿植", "🪴", "吸收辐射（心理安慰）。"],
        ["无线充", "⚡", "随放随充。"], ["硬盘底座", "💾", "数据都在这里。"], ["笔记本支架", "📐", "抬头挺胸。"], ["护眼灯", "💡", "照亮加班的夜。"], ["手办", "🤖", "二次元的慰藉。"], ["零食箱", "🍪", "能量补给站。"], ["咖啡机", "☕", "现磨的味道。"], ["微波炉", "🍲", "热饭专用。"], ["冰箱", "🧊", "冰镇快乐水。"], ["投影仪", "📽️", "开会必备。"]
      ],
      purple: [
        ["摸鱼鼠标", "🖱️", "一键切换屏幕。"], ["午睡枕", "💤", "趴着睡不手麻。"], ["防脱发液", "🧴", "程序员必备。"], ["枸杞保温杯", "🍵", "中年危机标配。"], ["工牌", "💳", "进出门禁。"], ["便签纸", "📝", "贴满屏幕。"], ["订书机", "📎", "经常卡针。"], ["回形针", "🖇️", "弯成各种形状。"], ["打孔机", "⭕", "解压神器。"], ["文件夹", "📂", "装样子的。"],
        ["白板笔", "🖍️", "头脑风暴。"], ["计算器", "🧮", "算算工资。"], ["鼠标垫", "⬛", "超大号的。"], ["USB风扇", "🌀", "夏日清凉。"], ["暖手宝", "🔥", "冬日温暖。"], ["眼药水", "💧", "缓解疲劳。"], ["维C泡腾片", "💊", "增强抵抗力。"], ["速溶咖啡", "☕", "续命水。"], ["袋装茶", "🍵", "提神醒脑。"], ["抽纸", "🧻", "擦汗擦泪。"]
      ],
      blue: 40
    }
  };

  const config = configs[mapType];

  // Red (8)
  config.red.forEach((data, i) => {
    items.push(createLoot(`${prefix}r${i}`, data[0], data[1], 8000 + i * 100, LootRarity.RED, mapType, data[2]));
  });
  // Orange (20)
  config.orange.forEach((data, i) => {
    items.push(createLoot(`${prefix}o${i}`, data[0], data[1], 1000 + i * 50, LootRarity.ORANGE, mapType, data[2]));
  });
  // Purple (20)
  config.purple.forEach((data, i) => {
    items.push(createLoot(`${prefix}p${i}`, data[0], data[1], 300 + i * 20, LootRarity.PURPLE, mapType, data[2]));
  });
  // Blue (40) - Generate Generics
  const blueNames = ["旧报纸", "空瓶子", "废纸团", "断掉的笔", "生锈的钉子", "碎玻璃", "枯树叶", "积灰的盒子", "过期发票", "外卖单", "传单", "名片", "回形针", "橡皮筋", "塑料袋", "纸杯", "吸管", "包装袋", "瓶盖", "螺丝帽"];
  const blueEmojis = ["📰", "🍾", "🧻", "🖊️", "🔩", "🧊", "🍂", "📦", "🧾", "📜", "📄", "📇", "📎", "⭕", "🛍️", "🥤", "🥢", "🥡", "🔘", "🔩"];
  
  for(let i=0; i<40; i++) {
     const name = blueNames[i % blueNames.length] + (Math.floor(i/blueNames.length) > 0 ? ` ${Math.floor(i/blueNames.length)+1}` : "");
     const emoji = blueEmojis[i % blueEmojis.length];
     items.push(createLoot(`${prefix}b${i}`, name, emoji, 10 + i, LootRarity.BLUE, mapType, "平平无奇的杂物。"));
  }

  return items;
};

export const UNIQUE_LOOT_ITEMS = [
  ...generateMapLoot(MapType.HOME, 'h'),
  ...generateMapLoot(MapType.SCHOOL, 's'),
  ...generateMapLoot(MapType.COMPANY, 'c')
];

export const TOPICS = [BattleTopic.MARRIAGE, BattleTopic.SALARY, BattleTopic.JOB, BattleTopic.HEALTH, BattleTopic.GRADES, BattleTopic.LIFE];

export const NPC_NAMES: Record<NpcType, string> = {
  // HOME
  [NpcType.AUNT]: "大姨", [NpcType.UNCLE]: "舅舅", [NpcType.GRANDMA]: "奶奶", [NpcType.COUSIN]: "表弟", [NpcType.KID]: "熊孩子", [NpcType.DAD]: "老爸", [NpcType.MOM]: "老妈",
  // SCHOOL
  [NpcType.TEACHER_MATH]: "数学老师", [NpcType.TEACHER_ENG]: "英语老师", [NpcType.PRINCIPAL]: "校长", [NpcType.STUDENT_NERD]: "学霸班长", [NpcType.STUDENT_BULLY]: "校霸",
  // COMPANY
  [NpcType.BOSS]: "画饼老板", [NpcType.CLIENT]: "刁钻甲方", [NpcType.PM]: "产品经理", [NpcType.COLLEAGUE_SLACKER]: "摸鱼同事", [NpcType.COLLEAGUE_TRYHARD]: "卷王"
};

// Updated School NPC Icons to Faces
export const NPC_EMOJIS: Record<NpcType, string> = {
  // HOME
  [NpcType.AUNT]: "👩‍🦱", [NpcType.UNCLE]: "👨‍💼", [NpcType.GRANDMA]: "👵", [NpcType.COUSIN]: "🧢", [NpcType.KID]: "😈", [NpcType.DAD]: "👨🏻", [NpcType.MOM]: "👩🏻",
  // SCHOOL (Updated)
  [NpcType.TEACHER_MATH]: "👨‍🏫", [NpcType.TEACHER_ENG]: "👩‍🏫", [NpcType.PRINCIPAL]: "👴", [NpcType.STUDENT_NERD]: "🤓", [NpcType.STUDENT_BULLY]: "👱",
  // COMPANY
  [NpcType.BOSS]: "🦁", [NpcType.CLIENT]: "🤴", [NpcType.PM]: "🐶", [NpcType.COLLEAGUE_SLACKER]: "🐢", [NpcType.COLLEAGUE_TRYHARD]: "🐍"
};

export const NPC_AGGRESSION: Record<NpcType, number> = {
  // HOME
  [NpcType.AUNT]: 0.75, [NpcType.MOM]: 0.7, [NpcType.DAD]: 0.6, [NpcType.GRANDMA]: 0.8, [NpcType.UNCLE]: 0.6, [NpcType.KID]: 0.2, [NpcType.COUSIN]: 0.3,
  // SCHOOL
  [NpcType.TEACHER_MATH]: 0.8, [NpcType.TEACHER_ENG]: 0.7, [NpcType.PRINCIPAL]: 0.9, [NpcType.STUDENT_NERD]: 0.4, [NpcType.STUDENT_BULLY]: 0.8,
  // COMPANY
  [NpcType.BOSS]: 0.9, [NpcType.CLIENT]: 0.95, [NpcType.PM]: 0.8, [NpcType.COLLEAGUE_SLACKER]: 0.3, [NpcType.COLLEAGUE_TRYHARD]: 0.6
};
