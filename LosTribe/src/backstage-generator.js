// src/backstage-generator.js
// Complete game state generator for LosTribe

import { genHero } from './libs/heroGen.js';
import { genMonster, genMonsterPack, genEliteMonster, genBossMonster } from './libs/monsterGen.js';
import { genRoom, genFloorRooms } from './libs/roomGen.js';
import { genLoot, genTreasureChest, genMonsterLoot } from './libs/lootGen.js';
import { randomTarotCard } from './libs/generator.js';

/**
 * Generate complete game state for an entire run
 * @param {Object} options - Generation options
 * @param {number} options.totalFloors - Number of floors in the dungeon
 * @param {string} options.heroClass - Hero class to generate
 * @param {number} options.seed - Random seed for reproducible runs
 */
export function generateCompleteRun({
  totalFloors = 7,
  heroClass = null,
  seed = null
} = {}) {
  // Set seed for reproducible generation (if provided)
  if (seed) Math.random = seedRandom(seed);

  console.log(`🎭 Generating complete run with ${totalFloors} floors...`);

  // Generate hero
  const hero = generateHeroWithSetup(heroClass);

  // Generate complete dungeon
  const dungeon = generateCompleteDungeon(totalFloors, hero);

  // Generate all encounters and loot
  const runData = {
    hero,
    dungeon,
    encounters: generateAllEncounters(dungeon, hero),
    treasures: generateAllTreasures(dungeon, hero),
    events: generateAllEvents(dungeon, hero),
    evolution: generateEvolutionPath(hero, dungeon)
  };

  console.log(`✅ Complete run generated!`);
  console.log(`📊 Summary:`);
  console.log(`   Hero: ${hero.name} (${hero.class})`);
  console.log(`   Floors: ${totalFloors}`);
  console.log(`   Total Rooms: ${dungeon.allRooms.length}`);
  console.log(`   Total Monsters: ${dungeon.allMonsters.length}`);
  console.log(`   Total Treasures: ${dungeon.allTreasures.length}`);

  return runData;
}

/**
 * Generate hero with complete setup
 */
function generateHeroWithSetup(heroClass) {
  const heroOptions = heroClass ? { heroId: heroClass } : {};
  const hero = genHero(heroOptions);

  // Add starting equipment and cards
  hero.startingDeck = [...hero.deck];
  hero.startingEquipment = { ...hero.equipment };

  return hero;
}

/**
 * Generate complete dungeon structure
 */
function generateCompleteDungeon(totalFloors, hero) {
  const floors = [];
  const allRooms = [];
  const allMonsters = [];
  const allTreasures = [];

  for (let floor = 1; floor <= totalFloors; floor++) {
    const floorData = generateFloor(floor, hero);
    floors.push(floorData);

    // Collect all rooms, monsters, and treasures
    allRooms.push(...floorData.rooms);
    allMonsters.push(...floorData.monsters);
    allTreasures.push(...floorData.treasures);
  }

  return {
    floors,
    allRooms,
    allMonsters,
    allTreasures,
    totalFloors,
    layout: generateDungeonLayout(allRooms)
  };
}

/**
 * Generate a single floor
 */
function generateFloor(floorLevel, hero) {
  const roomCount = Math.min(8 + floorLevel, 15); // More rooms on deeper floors
  const rooms = genFloorRooms(floorLevel, roomCount);

  // Generate monsters for this floor
  const monsters = [];
  const treasures = [];

  rooms.forEach((room, index) => {
    // Generate monsters based on room type
    if (room.monsters && room.monsters.length > 0) {
      room.monsters.forEach(monster => {
        monsters.push({
          id: monster.id,
          floor: floorLevel,
          roomIndex: index,
          monster: monster
        });
      });
    }

    // Generate treasures for this room
    if (room.treasure) {
      const treasureChest = genTreasureChest(floorLevel, room.treasure);
      treasures.push({
        id: `treasure_${floorLevel}_${index}`,
        floor: floorLevel,
        roomIndex: index,
        contents: treasureChest,
        roomType: room.type
      });
    }

    // Add room-specific loot
    if (room.type === 'battle' || room.type === 'elite' || room.type === 'boss') {
      monsters.forEach(monster => {
        const loot = genMonsterLoot(monster.monster);
        if (loot.length > 0) {
          treasures.push({
            id: `monster_loot_${monster.id}`,
            floor: floorLevel,
            roomIndex: index,
            contents: loot,
            source: 'monster'
          });
        }
      });
    }
  });

  return {
    level: floorLevel,
    rooms,
    monsters,
    treasures,
    bossRoom: rooms.find(r => r.type === 'boss'),
    eliteRooms: rooms.filter(r => r.type === 'elite')
  };
}

/**
 * Generate all encounters for the run
 */
function generateAllEncounters(dungeon, hero) {
  const encounters = [];

  dungeon.allMonsters.forEach(monsterData => {
    encounters.push({
      id: `encounter_${monsterData.id}`,
      floor: monsterData.floor,
      roomIndex: monsterData.roomIndex,
      type: 'combat',
      monster: monsterData.monster,
      difficulty: calculateEncounterDifficulty(monsterData.monster, hero),
      potentialLoot: genMonsterLoot(monsterData.monster),
      tarotInfluence: monsterData.monster.tarot
    });
  });

  return encounters;
}

/**
 * Generate all treasures for the run
 */
function generateAllTreasures(dungeon, hero) {
  const treasures = [];

  dungeon.allTreasures.forEach(treasureData => {
    treasures.push({
      id: treasureData.id,
      floor: treasureData.floor,
      roomIndex: treasureData.roomIndex,
      type: treasureData.roomType,
      contents: treasureData.contents,
      value: calculateTreasureValue(treasureData.contents),
      rarity: determineTreasureRarity(treasureData.contents)
    });
  });

  return treasures;
}

/**
 * Generate all events for the run
 */
function generateAllEvents(dungeon, hero) {
  const events = [];

  dungeon.allRooms.forEach((room, index) => {
    if (room.type === 'event') {
      events.push({
        id: `event_${room.id}`,
        floor: Math.floor(index / 8) + 1,
        roomIndex: index % 8,
        type: 'tarot_event',
        tarotCard: room.tarot,
        choices: generateEventChoices(room.tarot, hero),
        outcomes: generateEventOutcomes(room.tarot, hero)
      });
    }
  });

  return events;
}

/**
 * Generate hero's evolution path
 */
function generateEvolutionPath(hero, dungeon) {
  const evolution = {
    startingState: {
      stats: { ...hero.stats },
      deck: [...hero.deck],
      equipment: { ...hero.equipment }
    },
    milestones: [],
    finalState: null
  };

  // Simulate evolution milestones
  const floors = dungeon.floors;
  floors.forEach((floor, index) => {
    if (index % 2 === 0) { // Every other floor
      evolution.milestones.push({
        floor: floor.level,
        type: 'evolution_milestone',
        description: `Evolution milestone at floor ${floor.level}`,
        potentialChanges: generateEvolutionChanges(hero, floor.level)
      });
    }
  });

  return evolution;
}

/**
 * Generate dungeon layout for visualization
 */
function generateDungeonLayout(rooms) {
  const layout = {
    width: 20,
    height: 20,
    rooms: [],
    paths: []
  };

  // Simple grid layout for now
  rooms.forEach((room, index) => {
    const x = (index % 5) * 4;
    const y = Math.floor(index / 5) * 4;

    layout.rooms.push({
      id: room.id,
      x,
      y,
      type: room.type,
      tarot: room.tarot,
      exits: room.exits.map(exit => ({
        direction: exit.direction,
        targetRoom: exit.leadsTo
      }))
    });
  });

  return layout;
}

/**
 * Helper functions
 */
function calculateEncounterDifficulty(monster, hero) {
  const monsterPower = monster.stats.hp + monster.stats.atk + monster.stats.def;
  const heroPower = hero.stats.hp + hero.stats.atk + hero.stats.def;
  const ratio = monsterPower / heroPower;

  if (ratio < 0.8) return 'easy';
  if (ratio < 1.2) return 'medium';
  if (ratio < 1.8) return 'hard';
  return 'deadly';
}

function calculateTreasureValue(contents) {
  return contents.reduce((total, item) => {
    if (item.type === 'gold') return total + item.amount;
    if (item.rarity) {
      const rarityValues = { common: 50, uncommon: 100, rare: 200, epic: 400, legendary: 800 };
      return total + (rarityValues[item.rarity] || 50);
    }
    return total + 25; // Default value
  }, 0);
}

function determineTreasureRarity(contents) {
  const rarities = contents.map(item => item.rarity).filter(r => r);
  if (rarities.includes('legendary')) return 'legendary';
  if (rarities.includes('epic')) return 'epic';
  if (rarities.includes('rare')) return 'rare';
  if (rarities.includes('uncommon')) return 'uncommon';
  return 'common';
}

function generateEventChoices(tarotCard, hero) {
  return [
    { text: "Embrace the lesson", effect: "positive", value: 2 },
    { text: "Seek deeper understanding", effect: "evolution", value: 1 },
    { text: "Accept the challenge", effect: "mixed", value: 1 }
  ];
}

function generateEventOutcomes(tarotCard, hero) {
  return {
    positive: `Gain insight into ${tarotCard} teachings`,
    evolution: `Transform understanding of ${tarotCard}`,
    mixed: `Learn but face consequences from ${tarotCard}`
  };
}

function generateEvolutionChanges(hero, floorLevel) {
  return [
    { type: 'stat_increase', target: 'wisdom', value: floorLevel },
    { type: 'card_evolution', count: 1 },
    { type: 'elemental_mastery', element: 'all', value: 0.1 }
  ];
}

/**
 * Simple seeded random number generator
 */
function seedRandom(seed) {
  let m = 2 ** 35 - 31;
  let a = 185852;
  let s = seed % m;

  return function () {
    return (s = (s * a) % m) / m;
  };
}

/**
 * Export for admin view
 */
export { generateFloor, generateAllEncounters, generateAllTreasures };
