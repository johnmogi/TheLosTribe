// connolly-tarot-converter.js
// A utility to transform traditional tarot data into the Connolly evolutionary tarot format

const fs = require('fs');
const path = require('path');

// Connolly-style transformation mappings
const CONNOLLY_TRANSFORMATIONS = {
  "The Fool": { name: "The Innocent", tone: "hopeful" },
  "The Magician": { name: "The Channel", tone: "empowering" },
  "The High Priestess": { name: "The Oracle", tone: "mystical" },
  "The Empress": { name: "The Nurturer", tone: "nurturing" },
  "The Emperor": { name: "The Guardian", tone: "protective" },
  "The Hierophant": { name: "The Teacher", tone: "wise" },
  "The Lovers": { name: "The Harmonizers", tone: "loving" },
  "The Chariot": { name: "The Victor", tone: "triumphant" },
  "Strength": { name: "The Gentle Power", tone: "compassionate" },
  "The Hermit": { name: "The Inner Light", tone: "reflective" },
  "Wheel of Fortune": { name: "The Eternal Cycle", tone: "harmonious" },
  "Justice": { name: "The Balanced Heart", tone: "just" },
  "The Hanged Man": { name: "The Surrendered Trust", tone: "accepting" },
  "Death": { name: "The Transition", tone: "transformative" },
  "Temperance": { name: "The Alchemist", tone: "balancing" },
  "The Devil": { name: "Chains Within", tone: "liberating" },
  "The Tower": { name: "The Awakening", tone: "revelatory" },
  "The Star": { name: "The Divine Inspiration", tone: "inspiring" },
  "The Moon": { name: "The Dreamweaver", tone: "intuitive" },
  "The Sun": { name: "The Radiant One", tone: "joyful" },
  "Judgement": { name: "The Soul's Resurrection", tone: "awakening" },
  "The World": { name: "The Cosmic Dance", tone: "unified" }
};

// Reflective prompts for each card
const REFLECTIVE_PROMPTS = {
  "The Fool": "What new beginning calls to your spirit?",
  "The Magician": "What power within you seeks expression?",
  "The High Priestess": "What inner knowing guides you now?",
  "The Empress": "What growth do you wish to nurture?",
  "The Emperor": "What boundaries protect your growth?",
  "The Hierophant": "What wisdom do you carry to share?",
  "The Lovers": "What seeming opposites seek harmony?",
  "The Chariot": "What purpose drives you forward?",
  "Strength": "Where can gentleness create strength?",
  "The Hermit": "What wisdom awaits in stillness?",
  "Wheel of Fortune": "What cycle completes in your life?",
  "Justice": "What balance seeks restoration?",
  "The Hanged Man": "What can you release with love?",
  "Death": "What transformation awaits?",
  "Temperance": "What needs alchemical balance?",
  "The Devil": "What chains can you dissolve?",
  "The Tower": "What structure needs rebuilding?",
  "The Star": "What light guides your way?",
  "The Moon": "What dreams seek expression?",
  "The Sun": "What joy illuminates your path?",
  "Judgement": "What purpose calls your name?",
  "The World": "What unity calls you home?"
};

// Narrative templates for each card
const NARRATIVE_TEMPLATES = {
  "The Fool": "You stand at the beginning of life's great adventure, carrying nothing but trust and wonder. Every step forward opens new possibilities.",
  "The Magician": "You are the conscious bridge between heaven and earth, transforming thought into reality through awakened will and focused intention.",
  "The High Priestess": "Behind the veil of ordinary perception lies the temple of inner wisdom. You are the guardian of mysteries that whisper eternal truths.",
  "The Empress": "You embody creation's loving embrace, nurturing growth in all beings and celebrating the abundance that flows from aligned hearts.",
  "The Emperor": "You are the wise protector who creates safe space for growth, ruling with compassion and understanding that true strength serves the greater good.",
  "The Hierophant": "You are the bridge between ancient wisdom and emerging consciousness, sharing knowledge not through dictate but through living example.",
  "The Lovers": "You are the sacred union of opposites, recognizing that apparent division dissolves in the alchemy of love and understanding.",
  "The Chariot": "You are the focused determination that moves mountains, aligning your entire being with your soul's highest calling.",
  "Strength": "You are the quiet power of compassion, transforming potential conflict through patience and understanding.",
  "The Hermit": "You are the seeker who finds universal truths in solitude, discovering that retreat is the necessary journey toward wisdom.",
  "Wheel of Fortune": "You are part of the great cosmic dance where every ending becomes a beginning, every challenge an opportunity for growth.",
  "Justice": "You are the perfect balance achieved through compassion, understanding that true justice flows from interconnected hearts.",
  "The Hanged Man": "You choose surrender as the ultimate act of trust, discovering that true freedom comes from graceful release.",
  "Death": "You are in beautiful transformation, where what no longer serves gracefully falls away to make space for rebirth.",
  "Temperance": "You are the sacred alchemist blending opposites into harmony, learning that transformation happens through gentle balance.",
  "The Devil": "You are breaking free from self-imposed limitations, recognizing that true liberation comes from within.",
  "The Tower": "You are experiencing beautiful destruction that precedes rebirth, as outdated structures make way for authentic growth.",
  "The Star": "You are the guiding light that illuminates the path, reminding all beings of their divine origin and infinite potential.",
  "The Moon": "You are navigating the luminous waters of subconscious wisdom, embracing the birthplace of intuition and creativity.",
  "The Sun": "You are the radiant joy that warms all with unconditional love, dissolving shadows and celebrating inherent worthiness.",
  "Judgement": "You are hearing the loving call to step into your authentic purpose, awakening to the magnificent being you were always meant to become.",
  "The World": "You are the dancer in perfect harmony with the cosmos, where individual consciousness merges with universal awareness in celebration."
};

// Gameplay effect templates
const GAMEPLAY_TEMPLATES = {
  "The Fool": {
    combat_effect: { type: "energy_boost", value: 2, description: "Begin combat with extra energy" },
    exploration_effect: { type: "reveal_paths", chance: 0.5, description: "Hidden paths become visible" },
    run_effect: { type: "unlock_potential", description: "Opens possibilities for all future evolutions" }
  },
  "The Magician": {
    combat_effect: { type: "spell_amplify", multiplier: 1.25, description: "Spells deal 25% more damage" },
    exploration_effect: { type: "mana_double", description: "Mana crystals restore double energy" },
    run_effect: { type: "creative_awakening", description: "Enables advanced spell weaving" }
  },
  "The High Priestess": {
    combat_effect: { type: "intent_reveal", description: "See enemy intentions before they act" },
    exploration_effect: { type: "room_scry", description: "Preview room contents before entering" },
    run_effect: { type: "intuition_enhance", description: "Enhances intuitive decision making" }
  },
  "Death": {
    combat_effect: { type: "evolve_trigger", description: "Transform defeated enemies into spirits" },
    exploration_effect: { type: "transmute_items", description: "Old items can be transmuted to better ones" },
    run_effect: { type: "milestone_transform", description: "Major transformation milestone" }
  }
  // Additional templates can be added here
};

// Default gameplay effect if no specific template exists
const DEFAULT_GAMEPLAY = {
  combat_effect: { type: "empower", description: "Gain temporary strength" },
  exploration_effect: { type: "insight", description: "Gain deeper understanding" },
  run_effect: { type: "evolve", description: "Progress toward next evolution" }
};

/**
 * Converts a traditional tarot card to Connolly evolutionary format
 * @param {Object} card - The source tarot card data
 * @returns {Object} - The transformed card in Connolly format
 */
function convertToConnolly(card) {
  const traditionalName = card.traditional_name || card.name || card.id;
  const connollyInfo = CONNOLLY_TRANSFORMATIONS[traditionalName] || { name: traditionalName, tone: "uplifting" };
  
  return {
    id: card.id || traditionalName.toLowerCase().replace(/\s+/g, '_'),
    traditional_name: traditionalName,
    connolly_name: connollyInfo.name,
    tone: connollyInfo.tone,
    narrative: NARRATIVE_TEMPLATES[traditionalName] || `${traditionalName} represents a moment of transformation and growth.`,
    reflective_prompt: REFLECTIVE_PROMPTS[traditionalName] || "What does this moment reveal to you?",
    gameplay: GAMEPLAY_TEMPLATES[traditionalName] || DEFAULT_GAMEPLAY,
    rarity: card.rarity || "common",
    element_affinity: card.element_affinity || ["spirit"]
  };
}

/**
 * Processes a directory of JSON files and converts them to Connolly format
 * @param {string} inputDir - Directory containing source JSON files
 * @param {string} outputDir - Directory to save converted files
 */
function processDirectory(inputDir, outputDir) {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all JSON files in input directory
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.json'));
  
  files.forEach(file => {
    try {
      const filePath = path.join(inputDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Handle both array and single object formats
      const converted = Array.isArray(data) 
        ? data.map(convertToConnolly) 
        : convertToConnolly(data);
      
      // Save converted data
      const outputPath = path.join(outputDir, `connolly_${file}`);
      fs.writeFileSync(outputPath, JSON.stringify(converted, null, 2));
      console.log(`Converted ${file} -> connolly_${file}`);
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  });
}

/**
 * Converts a single tarot card file to Connolly format
 * @param {string} inputFile - Path to source JSON file
 * @param {string} outputFile - Path to save converted file
 */
function convertFile(inputFile, outputFile) {
  try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const converted = Array.isArray(data) 
      ? data.map(convertToConnolly) 
      : convertToConnolly(data);
    
    fs.writeFileSync(outputFile, JSON.stringify(converted, null, 2));
    console.log(`Converted ${inputFile} -> ${outputFile}`);
  } catch (error) {
    console.error(`Error converting ${inputFile}:`, error.message);
  }
}

// Export functions for use in other modules
module.exports = {
  convertToConnolly,
  processDirectory,
  convertFile
};

// Run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node connolly-tarot-converter.js input.json output.json');
    console.log('  node connolly-tarot-converter.js inputDir outputDir');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputPath = args[1] || './connolly_output';
  
  try {
    const stats = fs.statSync(inputPath);
    
    if (stats.isDirectory()) {
      processDirectory(inputPath, outputPath);
    } else if (stats.isFile() && inputPath.endsWith('.json')) {
      const outFile = outputPath.endsWith('.json') 
        ? outputPath 
        : path.join(outputPath, `connolly_${path.basename(inputPath)}`);
      
      // Create output directory if it doesn't exist
      const outDir = path.dirname(outFile);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      
      convertFile(inputPath, outFile);
    } else {
      console.error('Input must be a JSON file or directory containing JSON files');
      process.exit(1);
    }
    
    console.log('Conversion complete!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
