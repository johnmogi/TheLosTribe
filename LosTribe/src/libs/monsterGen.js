// libs/monsterGen.js
import { pick, scaleValue, rarityWeights, weightedPick, randomElement, randomTarotCard } from './generator.js';
import monstersData from '../data/monsters.json' assert { type: 'json' };

/**
 * Generate a monster from template with level scaling
 * @param {Object} options - Generation options
 * @param {string} options.templateId - Specific monster template ID
 * @param {number} options.level - Monster level (default: 1)
 * @param {boolean} options.forceElement - Force specific element
 * @param {boolean} options.forceTarot - Force specific tarot card
 */
export function genMonster({
  templateId = null,
  level = 1,
  forceElement = null,
  forceTarot = null
} = {}) {
  // Select template
  let template;
  if (templateId) {
    template = monstersData.find(m => m.id === templateId);
    if (!template) {
      console.warn(`Monster template ${templateId} not found, using random`);
      template = pick(monstersData);
    }
  } else {
    // Filter by level appropriateness (±2 levels)
    const levelFiltered = monstersData.filter(m => Math.abs(m.level - level) <= 2);
    template = pick(levelFiltered.length > 0 ? levelFiltered : monstersData);
  }

  // Apply level scaling
  const scaledStats = {
    hp: scaleValue(template.base.hp, level, 0.15), // 15% per level
    atk: scaleValue(template.base.atk, level, 0.12), // 12% per level
    def: scaleValue(template.base.def, level, 0.08), // 8% per level
    spd: Math.max(1, template.base.spd + Math.floor(level / 3)) // +1 speed per 3 levels
  };

  // Elemental dice setup
  const element = forceElement || template.element;
  const eDice = {
    type: element,
    faces: 3,
    roll: () => randInt(1, 3)
  };

  // Tarot archetype
  const tarot = forceTarot || template.tarot || randomTarotCard();

  // Apply tarot modifiers
  const tarotModifiers = getTarotModifiers(tarot, level);
  const finalStats = applyTarotStats(scaledStats, tarotModifiers);

  // Generate loot
  const loot = [];
  if (template.loot_table && template.loot_table.length > 0) {
    const lootResult = rollLootTable(template.loot_table);
    if (lootResult) loot.push(lootResult);
  }

  return {
    id: template.id,
    name: template.name,
    level,
    element,
    tarot,
    stats: finalStats,
    eDice,
    abilities: template.abilities || [],
    loot,
    tags: template.tags || [],
    // Visual properties for Phaser
    spriteKey: `monster_${element}_${template.id}`,
    scale: 1 + (level * 0.1), // Size increases with level
    tint: getElementColor(element)
  };
}

/**
 * Generate multiple monsters for an encounter
 */
export function genMonsterPack(count, level = 1) {
  const monsters = [];
  for (let i = 0; i < count; i++) {
    monsters.push(genMonster({ level }));
  }
  return monsters;
}

/**
 * Generate elite monster (higher level, better loot)
 */
export function genEliteMonster(level = 1) {
  return genMonster({
    level: level + 2,
    forceTarot: 'The Tower' // Boss-like tarot
  });
}

/**
 * Get tarot card modifiers for monster stats
 */
function getTarotModifiers(tarot, level) {
  const modifiers = {
    'The Tower': { hp: 2.0, atk: 2.0, def: 0.5 }, // Glass cannon
    'The Fool': { spd: 2, random_ability: true }, // Chaotic
    'The Magician': { atk: 1.5, eDice_bonus: 1 }, // Spell master
    'The Hermit': { def: 1.5, spd: 0.5 }, // Tanky but slow
    'Death': { hp: 1.8, revive_chance: 0.3 }, // Undead-like
    'The Wheel of Fortune': { luck_multiplier: 2.0 }, // Random effects
    'The Lovers': { companion_chance: 0.4 }, // May spawn allies
    'The Chariot': { spd: 1.5, charge_bonus: true }, // Fast charger
    'Strength': { atk: 1.3, def: 1.3 }, // Well-rounded
    'Justice': { balance_bonus: true } // Fair fights
  };

  return modifiers[tarot] || {};
}

/**
 * Apply tarot modifiers to base stats
 */
function applyTarotStats(stats, modifiers) {
  const modified = { ...stats };

  if (modifiers.hp) modified.hp = Math.round(modified.hp * modifiers.hp);
  if (modifiers.atk) modified.atk = Math.round(modified.atk * modifiers.atk);
  if (modifiers.def) modified.def = Math.round(modified.def * modifiers.def);
  if (modifiers.spd) modified.spd = Math.round(modified.spd * modifiers.spd);

  return modified;
}

/**
 * Get element color for Phaser tinting
 */
function getElementColor(element) {
  const colors = {
    fire: 0xFF4444,
    water: 0x4444FF,
    air: 0x44FF44,
    earth: 0xFFAA44
  };
  return colors[element] || 0xFFFFFF;
}

/**
 * Generate boss monster for end of floor
 */
export function genBossMonster(floorLevel = 1) {
  // Bosses are 3-4 levels higher
  const bossLevel = floorLevel + randInt(3, 4);

  // Bosses often have multiple elements or special abilities
  const bossTemplates = monstersData.filter(m =>
    m.tags.includes('boss') || m.level >= bossLevel - 1
  );

  const template = pick(bossTemplates);

  return genMonster({
    templateId: template.id,
    level: bossLevel,
    forceTarot: 'The Tower' // Boss tarot
  });
}

/**
 * Generate random encounter monsters based on room type
 */
export function genRoomMonsters(roomType, level = 1) {
  switch (roomType) {
    case 'battle':
      // Standard encounter
      const monsterCount = randInt(1, 3);
      return genMonsterPack(monsterCount, level);

    case 'elite':
      // Single strong monster
      return [genEliteMonster(level)];

    case 'boss':
      // Boss fight
      return [genBossMonster(level)];

    case 'swarm':
      // Many weak monsters
      return genMonsterPack(randInt(4, 6), Math.max(1, level - 1));

    default:
      return [];
  }
}
