// libs/lootGen.js
import { weightedPick, rarityWeights, getRandomRarity, pick, randInt } from './generator.js';
import weaponsData from '../data/weapons.json' assert { type: 'json' };
import relicsData from '../data/relics.json' assert { type: 'json' };
import cardsData from '../data/cards.json' assert { type: 'json' };

/**
 * Generate loot based on level and loot tier
 * @param {Object} options - Generation options
 * @param {number} options.level - Loot level
 * @param {string} options.tier - Loot tier (small, medium, large, epic, legendary)
 * @param {boolean} options.guaranteeItem - Whether to guarantee an item (no gold-only)
 */
export function genLoot({
  level = 1,
  tier = 'small',
  guaranteeItem = false
} = {}) {
  // Determine loot quality based on tier and level
  const lootQuality = determineLootQuality(tier, level);

  // Roll for loot type
  const lootType = rollLootType(lootQuality, guaranteeItem);

  switch (lootType) {
    case 'gold':
      return generateGold(level, tier);

    case 'weapon':
      return generateWeapon(level, lootQuality);

    case 'relic':
      return generateRelic(level, lootQuality);

    case 'card':
      return generateCard(level, lootQuality);

    case 'potion':
      return generatePotion(level);

    default:
      return generateGold(level, tier); // Fallback
  }
}

/**
 * Determine loot quality based on tier and level
 */
function determineLootQuality(tier, level) {
  const tierMultipliers = {
    small: 1,
    medium: 1.5,
    large: 2,
    epic: 3,
    legendary: 4
  };

  const baseQuality = (tierMultipliers[tier] || 1) * (1 + level * 0.1);

  // Convert to rarity scale
  if (baseQuality >= 3.5) return 'legendary';
  if (baseQuality >= 2.5) return 'epic';
  if (baseQuality >= 1.8) return 'rare';
  if (baseQuality >= 1.3) return 'uncommon';
  return 'common';
}

/**
 * Roll loot type with weights
 */
function rollLootType(quality, guaranteeItem) {
  let typeWeights;

  if (guaranteeItem) {
    // No gold, only items
    typeWeights = [
      { item: 'weapon', weight: 35 },
      { item: 'relic', weight: 25 },
      { item: 'card', weight: 40 }
    ];
  } else {
    // Include gold
    typeWeights = [
      { item: 'gold', weight: 30 },
      { item: 'weapon', weight: 25 },
      { item: 'relic', weight: 20 },
      { item: 'card', weight: 20 },
      { item: 'potion', weight: 5 }
    ];
  }

  return weightedPick(typeWeights);
}

/**
 * Generate gold reward
 */
function generateGold(level, tier) {
  const baseAmounts = {
    small: { min: 5, max: 15 },
    medium: { min: 15, max: 35 },
    large: { min: 30, max: 70 },
    epic: { min: 60, max: 140 },
    legendary: { min: 120, max: 280 }
  };

  const amount = baseAmounts[tier] || baseAmounts.small;
  const gold = randInt(amount.min, amount.max) + Math.floor(level * 2);

  return {
    type: 'gold',
    amount: gold,
    description: `${gold} gold coins`
  };
}

/**
 * Generate weapon loot
 */
function generateWeapon(level, quality) {
  const availableWeapons = weaponsData.filter(w =>
    w.rarity === quality || (quality === 'common' && ['common', 'uncommon'].includes(w.rarity))
  );

  if (availableWeapons.length === 0) {
    // Fallback to any weapon
    const fallbackWeapons = weaponsData.filter(w => w.type === 'melee' || w.type === 'ranged');
    return pick(fallbackWeapons);
  }

  return pick(availableWeapons);
}

/**
 * Generate relic loot
 */
function generateRelic(level, quality) {
  const availableRelics = relicsData.filter(r =>
    r.rarity === quality || (quality === 'common' && ['common', 'uncommon'].includes(r.rarity))
  );

  if (availableRelics.length === 0) {
    // Fallback to any relic
    return pick(relicsData);
  }

  return pick(availableRelics);
}

/**
 * Generate card loot
 */
function generateCard(level, quality) {
  const availableCards = cardsData.filter(c =>
    c.rarity === quality || (quality === 'common' && ['common', 'uncommon'].includes(c.rarity))
  );

  if (availableCards.length === 0) {
    // Fallback to any card
    return pick(cardsData);
  }

  return pick(availableCards);
}

/**
 * Generate potion loot
 */
function generatePotion(level) {
  const potions = [
    { id: 'potion_health', name: 'Health Potion', effect: 'heal', value: 25 },
    { id: 'potion_energy', name: 'Energy Potion', effect: 'energy', value: 2 },
    { id: 'potion_strength', name: 'Strength Potion', effect: 'buff_atk', value: 3, duration: 5 },
    { id: 'potion_defense', name: 'Defense Potion', effect: 'buff_def', value: 3, duration: 5 }
  ];

  return pick(potions);
}

/**
 * Generate treasure chest contents
 */
export function genTreasureChest(level = 1, chestType = 'normal') {
  const chestContents = [];

  // Base loot
  chestContents.push(genLoot({ level, tier: 'medium' }));

  // Additional loot based on chest type
  switch (chestType) {
    case 'small':
      // Just the base loot
      break;

    case 'normal':
      if (Math.random() < 0.4) {
        chestContents.push(genLoot({ level, tier: 'small' }));
      }
      break;

    case 'large':
      chestContents.push(genLoot({ level, tier: 'medium' }));
      if (Math.random() < 0.3) {
        chestContents.push(genLoot({ level, tier: 'large', guaranteeItem: true }));
      }
      break;

    case 'epic':
      chestContents.push(genLoot({ level, tier: 'large' }));
      chestContents.push(genLoot({ level, tier: 'epic', guaranteeItem: true }));
      break;

    case 'legendary':
      chestContents.push(genLoot({ level, tier: 'epic' }));
      chestContents.push(genLoot({ level, tier: 'legendary', guaranteeItem: true }));
      chestContents.push(genLoot({ level, tier: 'rare', guaranteeItem: true }));
      break;
  }

  return chestContents;
}

/**
 * Generate loot from monster defeat
 */
export function genMonsterLoot(monster, bonusMultiplier = 1) {
  const loot = [];

  // Base gold
  const goldAmount = Math.floor((monster.stats.hp * 0.1 + monster.level * 5) * bonusMultiplier);
  if (goldAmount > 0) {
    loot.push({
      type: 'gold',
      amount: goldAmount,
      description: `${goldAmount} gold from ${monster.name}`
    });
  }

  // Monster's loot table
  if (monster.loot && monster.loot.length > 0) {
    monster.loot.forEach(lootItem => {
      if (Math.random() < lootItem.chance * bonusMultiplier) {
        if (lootItem.type === 'gold') {
          const extraGold = randInt(lootItem.min, lootItem.max);
          loot.push({
            type: 'gold',
            amount: extraGold,
            description: `${extraGold} bonus gold`
          });
        } else {
          loot.push({
            type: lootItem.type,
            id: lootItem.id,
            description: `${lootItem.type} from ${monster.name}`
          });
        }
      }
    });
  }

  return loot;
}

/**
 * Generate shop inventory for merchants
 */
export function genShopInventory(level = 1, shopSize = 6) {
  const inventory = [];

  for (let i = 0; i < shopSize; i++) {
    const rarity = getRandomRarity(level);
    const lootType = pick(['weapon', 'relic', 'card']);

    let item;
    switch (lootType) {
      case 'weapon':
        item = generateWeapon(level, rarity);
        break;
      case 'relic':
        item = generateRelic(level, rarity);
        break;
      case 'card':
        item = generateCard(level, rarity);
        break;
    }

    if (item) {
      inventory.push({
        item,
        price: calculateItemPrice(item, level),
        originalPrice: calculateItemPrice(item, level) // For discount calculations
      });
    }
  }

  return inventory;
}

/**
 * Calculate item price for shop
 */
function calculateItemPrice(item, level) {
  const basePrices = {
    common: 50,
    uncommon: 100,
    rare: 200,
    epic: 400,
    legendary: 800
  };

  const basePrice = basePrices[item.rarity] || 50;
  const levelMultiplier = 1 + (level * 0.1);

  return Math.round(basePrice * levelMultiplier);
}

/**
 * Generate loot table for specific scenarios
 */
export function createLootTable(rewards) {
  // Helper to create weighted loot tables
  // Example: createLootTable([
  //   { type: 'gold', min: 10, max: 20, chance: 0.8 },
  //   { type: 'weapon', rarity: 'common', chance: 0.3 }
  // ])

  return rewards.map(reward => {
    if (reward.type === 'gold') {
      return {
        type: 'gold',
        min: reward.min,
        max: reward.max,
        chance: reward.chance
      };
    } else {
      return {
        type: reward.type,
        id: reward.id,
        chance: reward.chance
      };
    }
  });
}
