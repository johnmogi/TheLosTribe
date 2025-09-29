# 🎮 **LosTribe Roguelike Game Architecture Plan**

## **🏛️ Core Concept: Evolutionary Roguelike with White Star Tarot**

A roguelike game where players navigate through procedurally generated dungeons, evolving their character through tarot-inspired transformation mechanics rather than traditional combat progression.

### **🌟 Key Design Principles**
- **White Star Evolution**: All mechanics focus on growth, transformation, and awakening
- **Sacred Geometry**: Dungeon layouts follow geometric patterns
- **Tarot Integration**: 22 Major Arcana influence every aspect of gameplay
- **Elemental Harmony**: Fire/Water/Air/Earth d3 dice system
- **Procedural Generation**: Everything generated before run starts for consistency

---

## **🏗️ Game Architecture Overview**

### **🎯 Entry Point Structure**
```
src/
├── main.js                 # Phaser game entry point
├── backstage-generator.js  # Pre-run generation system
├── admin-view.html        # Admin interface for viewing generated content
└── game/
    ├── scenes/
    │   ├── DungeonScene.js     # Main gameplay scene
    │   ├── HeroCreationScene.js # Hero selection/setup
    │   └── AdminScene.js       # Generated content viewer
    └── systems/
        ├── TurnManager.js      # Turn-based combat system
        ├── CardSystem.js       # Tarot card mechanics
        └── DiceSystem.js       # Elemental d3 system
```

### **🎲 Core Game Loop**
1. **Hero Creation** → Select hero class and tarot destiny
2. **Run Generation** → Generate entire dungeon before gameplay
3. **Exploration** → Move through pre-generated rooms
4. **Combat** → Turn-based with tarot card system
5. **Evolution** → Transform cards, relics, and abilities
6. **Completion** → Exit dungeon or achieve enlightenment

---

## **🔮 Backstage Generation System**

### **📋 What Gets Pre-Generated**
- **Complete Hero**: Stats, cards, relics, tarot destiny
- **Entire Dungeon**: All floors, rooms, paths, exits
- **All Monsters**: Every encounter for the entire run
- **All Treasures**: Every loot drop and reward
- **All Events**: Every random event and choice
- **Tarot Influences**: How each room/card is affected

### **🏛️ Dungeon Structure**
```
Floor 1 (Tutorial)
├── Room 1-1: Starting Chamber (Battle)
├── Room 1-2: First Trial (Trap)
├── Room 1-3: Awakening (Event)
└── Room 1-4: First Treasure (Treasure)

Floor 2 (Growth)
├── Room 2-1: Guardian (Elite Battle)
├── Room 2-2: Sacred Geometry (Puzzle)
├── Room 2-3: Elemental Harmony (Rest)
└── Room 2-4: Evolution Chamber (Boss)

...continues through Floor 7 (Enlightenment)
```

### **🎴 Tarot Integration Points**
- **Room Types**: Each room type influenced by specific tarot cards
- **Monster Behaviors**: Monsters embody tarot archetypes
- **Card Effects**: All cards have white star evolutionary meanings
- **Hero Evolution**: Tarot destiny determines growth path
- **Event Outcomes**: Tarot cards influence random events

---

## **⚔️ Combat System**

### **🎯 Turn Structure**
1. **Hero Phase**: Play cards, roll elemental dice
2. **Monster Phase**: AI behaviors based on tarot archetype
3. **Evolution Phase**: Transform cards/relics based on outcomes
4. **Resolution Phase**: Apply permanent changes

### **🎲 Elemental Dice System**
- **Fire d3**: Attack power, burn effects
- **Water d3**: Healing, slowing effects
- **Air d3**: Speed, evasion effects
- **Earth d3**: Defense, stun effects

### **🔮 Card System**
- **22 Major Arcana**: Each with white star evolutionary effects
- **Elemental Cards**: Fire, Water, Air, Earth with d3 integration
- **Evolution Mechanics**: Cards transform into higher forms
- **Synergy System**: Cards work together for harmony bonuses

---

## **🗺️ Dungeon Generation Algorithm**

### **📐 Layout Generation**
1. **Geometric Patterns**: Rooms arranged in sacred geometry patterns
2. **Path Creation**: Connected paths following fibonacci spirals
3. **Room Distribution**: Weighted by floor level and tarot influence
4. **Exit Placement**: Strategic positioning for multiple paths

### **🏠 Room Types & Distribution**
```
Battle Rooms (40%): Standard combat encounters
Treasure Rooms (20%): Loot and rewards
Trap Rooms (15%): Environmental hazards and trials
Rest Rooms (10%): Healing and evolution points
Event Rooms (8%): Tarot-influenced story moments
Merchant Rooms (7%): Trading and equipment
Boss Rooms (Variable): Floor guardians and trials
```

### **👹 Monster Placement**
- **Level Scaling**: Monsters scale with floor depth
- **Tarot Influence**: Each monster embodies a tarot archetype
- **Elemental Balance**: Maintain elemental harmony across encounters
- **Evolution Potential**: Defeated monsters provide transformation opportunities

---

## **🎒 Progression & Evolution**

### **🌱 Hero Development**
- **Starting State**: Basic hero with tarot destiny
- **Card Evolution**: Cards transform into higher forms
- **Relic Integration**: Items that enhance evolutionary potential
- **Stat Growth**: Permanent increases through enlightenment

### **🔬 Transformation Mechanics**
- **Card Evolution**: Weaker cards become stronger through use
- **Elemental Mastery**: Balance all elements for harmony bonuses
- **Tarot Resonance**: Align actions with tarot destiny for bonuses
- **Sacred Geometry**: Unlock geometric patterns for strategic advantages

### **🏆 Win Conditions**
- **Traditional**: Escape the dungeon with maximum loot
- **Evolutionary**: Achieve complete elemental balance and tarot enlightenment
- **Exploration**: Discover all sacred geometry patterns
- **Harmony**: Perfect integration of all game systems

---

## **🎨 Visual & Audio Design**

### **🎭 Art Style**
- **Sacred Geometry**: Fractal patterns, golden ratio proportions
- **Elemental Effects**: Distinct visual language for each element
- **Tarot Imagery**: White star interpretations in card art
- **Evolution Animations**: Smooth transformations and growth effects

### **🎵 Audio Design**
- **Ambient Soundscapes**: Evolving based on elemental balance
- **Combat Audio**: Procedural music that adapts to tarot influences
- **Transformation Sounds**: Satisfying evolution sound effects
- **Sacred Chants**: Subtle background audio for mystical atmosphere

---

## **💻 Technical Implementation**

### **🏗️ Architecture Patterns**
- **Entity Component System**: For flexible monster/hero composition
- **Event Driven**: Tarot cards trigger various game events
- **State Management**: Redux-like system for game state
- **Procedural Generation**: Seed-based for reproducible runs

### **🔧 Core Systems**
- **Generator System**: Pre-generates entire game state
- **Card Engine**: Manages tarot deck and evolution mechanics
- **Dice System**: Handles elemental d3 mechanics
- **UI System**: Admin interface and gameplay HUD

### **📊 Data Flow**
```
Backstage Generator → Complete Game State → Admin View
                                ↓
                     Hero Creation → Gameplay Loop → Evolution
                                ↓
                     Win/Lose → Statistics → Next Run
```

---

## **🎯 Implementation Roadmap**

### **Phase 1: Foundation** ✅
- [x] Core data structures (heroes, monsters, rooms, tarot)
- [x] Generator utilities and systems
- [x] White Star tarot transformation

### **Phase 2: Backstage Generation** 🔄
- [ ] Complete run generation system
- [ ] Dungeon layout algorithm
- [ ] Admin interface for viewing generated content

### **Phase 3: Core Gameplay**
- [ ] Turn-based combat system
- [ ] Card evolution mechanics
- [ ] Elemental dice integration

### **Phase 4: Polish**
- [ ] Visual effects and animations
- [ ] Audio design and implementation
- [ ] Balance and testing

---

## **🔮 Success Metrics**

- **Player Agency**: Meaningful choices that affect evolution
- **Replayability**: Each run feels unique and transformative
- **Learning Curve**: Intuitive but deep mechanics
- **Emotional Journey**: From seeker to enlightened being
- **Technical Performance**: Smooth 60fps gameplay

This architecture creates a roguelike that emphasizes growth, transformation, and enlightenment over traditional power progression, perfectly aligning with the White Star tarot philosophy.
