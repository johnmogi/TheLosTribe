// libs/generator.js
// Generic utilities for randomness, weighted choices, scaling

/**
 * Generate random integer between min and max (inclusive)
 */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random element from array
 */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick element from array with weights
 * @param {Array} items - Array of {item: any, weight: number} objects
 */
export function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;

  for (const item of items) {
    if (random < item.weight) return item.item;
    random -= item.weight;
  }

  return items[items.length - 1].item;
}

/**
 * Scale base value by level with exponential growth
 * @param {number} base - Base value
 * @param {number} level - Current level
 * @param {number} scale - Scale factor (default 0.12 for ~12% per level)
 */
export function scaleValue(base, level, scaleFactor = 0.12) {
  return Math.max(1, Math.round(base * (1 + level * scaleFactor)));
}

/**
 * Rarity weight configuration
 */
export const rarityWeights = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1
};

/**
 * Get rarity from weighted roll
 */
export function getRandomRarity(level = 1) {
  // Increase chance of rare+ items at higher levels
  const levelBonus = Math.min(level * 2, 20); // Max 20% bonus

  const rollTable = [
    { item: 'common', weight: rarityWeights.common - levelBonus },
    { item: 'uncommon', weight: rarityWeights.uncommon + Math.floor(levelBonus / 2) },
    { item: 'rare', weight: rarityWeights.rare + Math.floor(levelBonus / 3) },
    { item: 'epic', weight: rarityWeights.epic + Math.floor(levelBonus / 4) },
    { item: 'legendary', weight: rarityWeights.legendary + Math.floor(levelBonus / 5) }
  ];

  return weightedPick(rollTable);
}

/**
 * Generate loot table roll
 * @param {Array} lootTable - Array of {type: string, id?: string, min?: number, max?: number, chance: number}
 */
export function rollLootTable(lootTable) {
  const roll = Math.random() * 100;
  let cumulativeChance = 0;

  for (const loot of lootTable) {
    cumulativeChance += loot.chance * 100;
    if (roll <= cumulativeChance) {
      if (loot.type === 'gold') {
        return {
          type: 'gold',
          amount: randInt(loot.min, loot.max)
        };
      } else {
        return {
          type: loot.type,
          id: loot.id,
          amount: loot.amount || 1
        };
      }
    }
  }

  return null; // No loot
}

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate random element
 */
export function randomElement() {
  const elements = ['fire', 'water', 'air', 'earth'];
  return pick(elements);
}

/**
 * Get element weakness (opposite element)
 */
export function getElementWeakness(element) {
  const weaknesses = {
    fire: 'water',
    water: 'earth',
    air: 'fire',
    earth: 'air'
  };
  return weaknesses[element];
}

/**
 * Get element strength (same element)
 */
export function getElementStrength(element) {
  return element;
}

/**
 * Generate random tarot card ID
 */
export function randomTarotCard() {
  const cards = [
    'The Fool', 'The Magician', 'The Tower', 'Death', 'The Hermit',
    'The Wheel of Fortune', 'The Lovers', 'The Chariot', 'Strength', 'Justice'
  ];
  return pick(cards);
}

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Generate random point within radius
 */
export function randomPointInRadius(centerX, centerY, radius) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * radius;
  return {
    x: centerX + Math.cos(angle) * distance,
    y: centerY + Math.sin(angle) * distance
  };
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Shuffle array in place
 */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
