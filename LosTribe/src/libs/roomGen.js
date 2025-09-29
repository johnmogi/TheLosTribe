// libs/roomGen.js
import { pick, weightedPick, randInt, randomTarotCard } from './generator.js';
import { genMonsterPack, genEliteMonster, genBossMonster } from './monsterGen.js';
import roomsData from '../data/rooms.json' assert { type: 'json' };
import trapsData from '../data/traps.json' assert { type: 'json' };

/**
 * Generate a room for the dungeon
 * @param {Object} options - Generation options
 * @param {string} options.type - Force specific room type
 * @param {number} options.level - Room level/floor
 * @param {boolean} options.isBossRoom - Whether this is a boss room
 */
export function genRoom({
  type = null,
  level = 1,
  isBossRoom = false
} = {}) {
  // Determine room type
  let roomType;
  if (type) {
    roomType = type;
  } else if (isBossRoom) {
    roomType = 'boss';
  } else {
    // Weighted room type selection
    const typeWeights = [
      { item: 'battle', weight: 40 },
      { item: 'treasure', weight: 20 },
      { item: 'trap', weight: 15 },
      { item: 'rest', weight: 10 },
      { item: 'event', weight: 8 },
      { item: 'merchant', weight: 7 }
    ];

    // Adjust weights based on level (more challenging rooms later)
    if (level >= 5) {
      typeWeights.find(t => t.item === 'battle').weight += 10;
      typeWeights.find(t => t.item === 'elite').weight = 15;
    }

    roomType = weightedPick(typeWeights);
  }

  // Generate room content based on type
  const roomContent = generateRoomContent(roomType, level);

  // Select visual theme and layout
  const roomTemplate = selectRoomTemplate(roomType, level);

  // Generate exits (branching paths)
  const exits = generateExits(roomType, level);

  // Tarot flavor for the room
  const tarot = roomTemplate.tarot || randomTarotCard();

  return {
    id: `room_${level}_${Math.random().toString(36).substr(2, 9)}`,
    type: roomType,
    level,
    position: { x: 0, y: 0 }, // Will be set by dungeon generator

    // Content
    monsters: roomContent.monsters || [],
    traps: roomContent.traps || [],
    treasure: roomContent.treasure || null,

    // Visual and gameplay
    background: roomTemplate.background || 'dungeon_stone',
    layout: roomTemplate.layout || 'standard',
    exits,

    // Metadata
    tarot,
    description: roomTemplate.description || getRoomDescription(roomType, level),
    isCleared: false,
    isVisited: false,

    // Special room properties
    specialProperties: roomContent.specialProperties || {}
  };
}

/**
 * Generate room content based on type
 */
function generateRoomContent(roomType, level) {
  switch (roomType) {
    case 'battle':
      return generateBattleContent(level);

    case 'elite':
      return {
        monsters: [genEliteMonster(level)],
        specialProperties: { eliteFight: true }
      };

    case 'boss':
      return {
        monsters: [genBossMonster(level)],
        specialProperties: { bossFight: true, noEscape: true }
      };

    case 'treasure':
      return generateTreasureContent(level);

    case 'trap':
      return generateTrapContent(level);

    case 'rest':
      return {
        specialProperties: {
          healing: true,
          healAmount: Math.floor(20 + level * 5),
          energyRestore: true
        }
      };

    case 'merchant':
      return generateMerchantContent(level);

    case 'event':
      return generateEventContent(level);

    default:
      return {};
  }
}

/**
 * Generate battle room content
 */
function generateBattleContent(level) {
  const monsterCount = randInt(1, Math.min(4, level + 1));
  const monsters = genMonsterPack(monsterCount, level);

  // Small chance for elite monsters in battle rooms
  if (Math.random() < 0.1 && level >= 3) {
    monsters.push(genEliteMonster(level));
  }

  return { monsters };
}

/**
 * Generate treasure room content
 */
function generateTreasureContent(level) {
  const treasureTypes = ['loot_small', 'loot_medium', 'loot_large', 'loot_epic'];

  // Higher level = better loot
  let treasureType;
  const lootRoll = Math.random();
  if (level >= 7) {
    treasureType = lootRoll < 0.3 ? 'loot_epic' : 'loot_large';
  } else if (level >= 4) {
    treasureType = lootRoll < 0.2 ? 'loot_large' : 'loot_medium';
  } else {
    treasureType = lootRoll < 0.1 ? 'loot_medium' : 'loot_small';
  }

  return {
    treasure: treasureType,
    // Treasure rooms often have some monsters guarding them
    monsters: Math.random() < 0.4 ? genMonsterPack(1, level) : []
  };
}

/**
 * Generate trap room content
 */
function generateTrapContent(level) {
  const trapCount = randInt(1, Math.min(3, level));
  const traps = [];

  for (let i = 0; i < trapCount; i++) {
    const availableTraps = trapsData.filter(t => t.level <= level + 1);
    const trap = pick(availableTraps);
    traps.push(trap.id);
  }

  return { traps };
}

/**
 * Generate merchant room content
 */
function generateMerchantContent(level) {
  return {
    merchant: {
      id: 'merchant_traveler',
      inventory: generateMerchantInventory(level),
      prices: generateMerchantPrices(level),
      discount: 0.9 + (Math.random() * 0.2) // 10-30% discount
    },
    specialProperties: { canShop: true }
  };
}

/**
 * Generate event room content
 */
function generateEventContent(level) {
  const eventTypes = ['blessing', 'curse', 'choice', 'combat', 'puzzle'];

  return {
    event: {
      type: pick(eventTypes),
      tarot: randomTarotCard(),
      choices: generateEventChoices(level)
    },
    specialProperties: { isEvent: true }
  };
}

/**
 * Generate merchant inventory
 */
function generateMerchantInventory(level) {
  // This would integrate with your loot/weapon/relic generators
  // For now, return placeholder structure
  return [
    { type: 'weapon', id: 'w_basic_sword', rarity: 'common' },
    { type: 'relic', id: 'r_healing_potion', rarity: 'common' },
    { type: 'card', id: 'c_fireball', rarity: 'uncommon' }
  ];
}

/**
 * Generate merchant prices
 */
function generateMerchantPrices(level) {
  return {
    baseMultiplier: 1.0 + (level * 0.1), // Prices increase with level
    specialOffers: Math.random() < 0.3 // 30% chance for special offer
  };
}

/**
 * Generate event choices for event rooms
 */
function generateEventChoices(level) {
  return [
    { text: "Take the safe path", effect: "heal", value: 10 },
    { text: "Take the risky path", effect: "damage", value: 5, reward: "better_loot" },
    { text: "Mysterious third option", effect: "random", value: 0 }
  ];
}

/**
 * Select appropriate room template
 */
function selectRoomTemplate(roomType, level) {
  // Find matching room templates
  const matchingRooms = roomsData.filter(r => r.type === roomType);

  if (matchingRooms.length > 0) {
    return pick(matchingRooms);
  }

  // Fallback template
  return {
    background: 'dungeon_stone',
    layout: 'standard',
    tarot: randomTarotCard(),
    description: getRoomDescription(roomType, level)
  };
}

/**
 * Generate room description
 */
function getRoomDescription(roomType, level) {
  const descriptions = {
    battle: `A combat chamber filled with hostile creatures.`,
    treasure: `A room glittering with potential riches.`,
    trap: `A dangerous area rigged with deadly mechanisms.`,
    rest: `A safe haven for weary adventurers.`,
    event: `A mysterious chamber with unknown purpose.`,
    merchant: `A marketplace where goods are bought and sold.`,
    boss: `The lair of a powerful guardian.`,
    elite: `A challenging encounter with elite foes.`
  };

  return descriptions[roomType] || `A mysterious chamber.`;
}

/**
 * Generate exits for the room
 */
function generateExits(roomType, level) {
  const baseExits = randInt(1, 3);

  // Boss rooms typically have fewer exits
  const exitCount = roomType === 'boss' ? 1 : baseExits;

  const exitDirections = ['north', 'south', 'east', 'west'];
  const exits = [];

  // Shuffle and pick exits
  const shuffledDirections = [...exitDirections].sort(() => Math.random() - 0.5);

  for (let i = 0; i < exitCount; i++) {
    exits.push({
      direction: shuffledDirections[i],
      leadsTo: null, // Will be connected by dungeon generator
      isLocked: Math.random() < 0.1 && level >= 3, // 10% chance for locked doors
      requiresKey: false // Could be expanded for key mechanics
    });
  }

  return exits;
}

/**
 * Generate a complete floor of rooms
 */
export function genFloorRooms(floorLevel = 1, roomCount = 8) {
  const rooms = [];
  const startRoom = genRoom({ type: 'battle', level: floorLevel });

  rooms.push(startRoom);

  // Generate subsequent rooms
  for (let i = 1; i < roomCount; i++) {
    const room = genRoom({ level: floorLevel });

    // Connect to previous room (simple linear connection for now)
    if (rooms.length > 0) {
      const prevRoom = rooms[rooms.length - 1];
      if (prevRoom.exits.length > 0) {
        prevRoom.exits[0].leadsTo = room.id;
        room.exits.push({
          direction: 'south', // Opposite direction
          leadsTo: prevRoom.id
        });
      }
    }

    rooms.push(room);
  }

  return rooms;
}
