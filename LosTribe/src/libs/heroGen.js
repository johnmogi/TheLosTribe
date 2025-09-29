// libs/heroGen.js
import { pick, scaleValue, randomElement, randomTarotCard } from './generator.js';
import heroesData from '../data/heroes.json' assert { type: 'json' };
import tarotData from '../data/tarot_archetypes.json' assert { type: 'json' };

/**
 * Generate a hero character for the start of a run
 * @param {Object} options - Generation options
 * @param {string} options.heroId - Specific hero template ID
 * @param {number} options.level - Starting level (default: 1)
 * @param {boolean} options.forceElement - Force specific element affinity
 * @param {boolean} options.forceTarot - Force specific tarot destiny
 */
export function genHero({
  heroId = null,
  level = 1,
  forceElement = null,
  forceTarot = null
} = {}) {
  // Select hero template
  let template;
  if (heroId) {
    template = heroesData.find(h => h.id === heroId);
    if (!template) {
      console.warn(`Hero template ${heroId} not found, using random`);
      template = pick(heroesData);
    }
  } else {
    template = pick(heroesData);
  }

  // Apply level scaling
  const scaledStats = {
    hp: scaleValue(template.base.hp, level, 0.1), // 10% per level
    atk: scaleValue(template.base.atk, level, 0.08), // 8% per level
    def: scaleValue(template.base.def, level, 0.06), // 6% per level
    spd: template.base.spd // Speed doesn't scale as much
  };

  // Elemental affinity
  const elementAffinity = forceElement || pick(template.element_affinity || [randomElement()]);

  // Tarot destiny card
  const tarotDestiny = forceTarot || randomTarotCard();

  // Apply tarot modifiers
  const tarotModifiers = getTarotModifiers(tarotDestiny, level);
  const finalStats = applyTarotStats(scaledStats, tarotModifiers);

  // Starting deck (copy and prepare for gameplay)
  const startingDeck = [...template.starting_deck];

  // Apply elemental affinity bonuses
  const affinityBonus = getAffinityBonus(elementAffinity);

  return {
    id: template.id,
    name: template.name,
    class: template.class,
    level,
    elementAffinity,
    tarotDestiny,
    stats: finalStats,
    maxStats: { ...finalStats }, // For tracking max values
    currentStats: { ...finalStats }, // Current values (for damage, etc.)

    // Card system
    deck: startingDeck,
    hand: [],
    discardPile: [],
    energy: 3, // Starting energy per turn
    maxEnergy: 3,

    // Equipment and inventory
    equipment: {
      weapon: null,
      relic: null,
      armor: null
    },

    // Status effects
    statusEffects: [],

    // Tarot-specific properties
    tarotModifiers,

    // Visual properties for Phaser
    spriteKey: `hero_${template.class}_${elementAffinity}`,
    portrait: `portrait_${template.id}`,

    // Affinity bonuses
    affinityBonus,

    // Quirks (special abilities)
    quirks: template.quirk || {}
  };
}

/**
 * Get tarot card modifiers for hero stats and abilities
 */
function getTarotModifiers(tarot, level) {
  const modifiers = {
    'The Magician': {
      maxEnergy: 1, // Extra energy
      spellPower: 1.25, // Increased spell damage
      rerollChance: 0.15 // Chance to reroll dice
    },
    'Death': {
      reviveChance: 0.3, // Chance to revive when defeated
      deathDefiance: true, // Survive lethal damage once per run
      lifeSteal: 0.1 // Small lifesteal
    },
    'The Fool': {
      randomEventChance: 0.2, // Random events occur more often
      unpredictability: true, // Cards may have random effects
      luckBonus: 1.5 // Better loot chances
    },
    'The Hermit': {
      defenseBonus: 1.3, // Increased defense
      detectionBonus: 2, // Better trap detection
      relicFindBonus: 0.5 // Higher relic chance
    },
    'The Wheel of Fortune': {
      luckMultiplier: 2.0, // Doubled luck effects
      randomOutcomes: true, // Events can be very good or very bad
      gambleReward: true // Gambling mechanics more rewarding
    },
    'The Lovers': {
      companionBonus: 0.3, // Chance for companion
      sharedAbilities: true, // Can use ally abilities
      relationshipPower: 1.2 // Power increases with bonds
    },
    'The Chariot': {
      movementBonus: 2, // Extra movement
      chargeBonus: true, // Charge attacks more powerful
      positioningAdvantage: true // Better positioning
    },
    'Strength': {
      nonViolenceBonus: true, // Better non-combat solutions
      tamingChance: 0.4, // Can tame enemies
      persuasionBonus: 2 // Better negotiation
    },
    'Justice': {
      karmaBalance: true, // Karma system active
      fairFightBonus: 1.5, // Bonuses in fair fights
      truthDetection: true // Detect lies and illusions
    },
    'The Tower': {
      destructionBonus: true, // Better at breaking things
      chaosPower: 1.8, // Powerful but unpredictable
      areaDamageBonus: 1.5 // Area damage increased
    }
  };

  return modifiers[tarot] || {};
}

/**
 * Apply tarot modifiers to base stats
 */
function applyTarotStats(stats, modifiers) {
  const modified = { ...stats };

  if (modifiers.defenseBonus) {
    modified.def = Math.round(modified.def * modifiers.defenseBonus);
    modified.hp = Math.round(modified.hp * 1.1); // Small HP bonus too
  }

  if (modifiers.maxEnergy) {
    modified.energy = (modified.energy || 3) + modifiers.maxEnergy;
  }

  return modified;
}

/**
 * Get elemental affinity bonuses
 */
function getAffinityBonus(element) {
  const bonuses = {
    fire: {
      damageBonus: 1.15, // 15% more fire damage
      burnChance: 0.2, // Chance to burn enemies
      fireResistance: 0.3 // 30% fire resistance
    },
    water: {
      healingBonus: 1.25, // 25% more healing
      slowChance: 0.15, // Chance to slow enemies
      waterResistance: 0.3 // 30% water resistance
    },
    air: {
      speedBonus: 1.2, // 20% more speed
      evadeChance: 0.15, // Chance to evade attacks
      airResistance: 0.3 // 30% air resistance
    },
    earth: {
      defenseBonus: 1.15, // 15% more defense
      stunChance: 0.2, // Chance to stun enemies
      earthResistance: 0.3 // 30% earth resistance
    }
  };

  return bonuses[element] || {};
}

/**
 * Generate a random hero for quick starts
 */
export function genRandomHero(level = 1) {
  return genHero({ level });
}

/**
 * Generate hero with specific class focus
 */
export function genHeroByClass(desiredClass, level = 1) {
  const classHeroes = heroesData.filter(h => h.class === desiredClass);
  if (classHeroes.length === 0) {
    console.warn(`No heroes found for class ${desiredClass}`);
    return genRandomHero(level);
  }

  const template = pick(classHeroes);
  return genHero({ heroId: template.id, level });
}

/**
 * Generate hero with specific element affinity
 */
export function genHeroByElement(desiredElement, level = 1) {
  const elementHeroes = heroesData.filter(h =>
    h.element_affinity && h.element_affinity.includes(desiredElement)
  );

  if (elementHeroes.length === 0) {
    console.warn(`No heroes found for element ${desiredElement}`);
    return genRandomHero(level);
  }

  const template = pick(elementHeroes);
  return genHero({ heroId: template.id, level, forceElement: desiredElement });
}

/**
 * Apply level up to existing hero
 */
export function levelUpHero(hero) {
  const newLevel = hero.level + 1;

  // Scale stats
  hero.stats.hp = scaleValue(hero.stats.hp, newLevel, 0.1);
  hero.stats.atk = scaleValue(hero.stats.atk, newLevel, 0.08);
  hero.stats.def = scaleValue(hero.stats.def, newLevel, 0.06);

  hero.level = newLevel;
  hero.maxStats = { ...hero.stats };
  hero.currentStats = { ...hero.stats };

  // Unlock new abilities/cards at certain levels
  if (newLevel % 3 === 0) {
    // Every 3 levels, add a new card to deck
    hero.deck.push('c_upgrade_card'); // Placeholder for new card
  }

  return hero;
}
