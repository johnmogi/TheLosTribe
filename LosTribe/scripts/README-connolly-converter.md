# Connolly Tarot Converter

A utility for transforming traditional tarot card data into the Connolly evolutionary tarot format, designed for the LosTribe game.

## Overview

This tool converts tarot card data from traditional formats into the Connolly-inspired evolutionary tarot system, which emphasizes personal growth, transformation, and positive psychology. The converter adds narrative depth, reflective prompts, and gameplay effects that align with the White Star evolutionary theme.

## Features

- Converts traditional tarot cards to Connolly evolutionary format
- Adds narrative passages and reflective prompts
- Generates appropriate gameplay effects based on card archetypes
- Processes single files or entire directories
- Preserves original data while adding new fields
- Handles both array and single-object JSON files

## Installation

1. Ensure you have Node.js installed (v14 or higher)
2. Clone the LosTribe repository
3. Navigate to the scripts directory:
   ```
   cd LosTribe/scripts
   ```
4. Install dependencies (if any):
   ```
   npm install
   ```

## Usage

### Convert a single file
```bash
node connolly-tarot-converter.js path/to/input.json path/to/output.json
```

### Convert all JSON files in a directory
```bash
node connolly-tarot-converter.js path/to/input/directory path/to/output/directory
```

### Use in your code
```javascript
const { convertToConnolly, processDirectory } = require('./connolly-tarot-converter');

// Convert a single card
const traditionalCard = {
  id: "death",
  name: "Death",
  rarity: "rare"
};

const connollyCard = convertToConnolly(traditionalCard);

// Process a directory of card files
processDirectory('./src/data/tarot', './src/data/connolly_tarot');
```

## Card Format

The converter transforms cards into the following format:

```json
{
  "id": "the_fool",
  "traditional_name": "The Fool",
  "connolly_name": "The Innocent",
  "tone": "hopeful",
  "narrative": "You stand at the beginning of life's great adventure...",
  "reflective_prompt": "What new beginning calls to your spirit?",
  "gameplay": {
    "combat_effect": {
      "type": "energy_boost",
      "value": 2,
      "description": "Begin combat with extra energy"
    },
    "exploration_effect": {
      "type": "reveal_paths",
      "chance": 0.5,
      "description": "Hidden paths become visible"
    },
    "run_effect": {
      "type": "unlock_potential",
      "description": "Opens possibilities for all future evolutions"
    }
  },
  "rarity": "common",
  "element_affinity": ["spirit"]
}
```

## Customization

### Adding New Cards
1. Add the card to the appropriate objects in the script:
   - `CONNOLLY_TRANSFORMATIONS` - Connolly name and tone
   - `REFLECTIVE_PROMPTS` - Questions for player reflection
   - `NARRATIVE_TEMPLATES` - Story snippets for each card
   - `GAMEPLAY_TEMPLATES` - Game mechanics for each card

### Modifying Templates
Edit the template objects to change the default behavior:
- `DEFAULT_GAMEPLAY` - Default effects when no specific template exists
- `GAMEPLAY_TEMPLATES` - Card-specific gameplay effects

## Integration with LosTribe

The converted cards can be used directly in the game by importing them into your card management system. The format is compatible with the existing game architecture while adding the Connolly evolutionary layer.

## License

This tool is part of the LosTribe project and is available under the same license.

## Contributing

Contributions are welcome! Please submit pull requests or open issues for any bugs or feature requests.
