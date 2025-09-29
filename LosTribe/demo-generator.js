// Demo function for testing backstage generator
// Call this from browser console to see the generator in action

window.demoBackstageGenerator = function() {
    console.log('🎭 Starting LosTribe Backstage Generator Demo...');

    // Import the generator (this would work in a real module environment)
    import('./src/backstage-generator.js').then(({ generateCompleteRun }) => {
        console.log('✅ Generator loaded, creating complete run...');

        const runData = generateCompleteRun({
            totalFloors: 3, // Smaller for demo
            heroClass: 'warrior',
            seed: 12345 // Fixed seed for consistent results
        });

        console.log('🎮 Run generated successfully!');
        console.log(`📊 Summary:`);
        console.log(`   Hero: ${runData.hero.name} (${runData.hero.class})`);
        console.log(`   Floors: ${runData.dungeon.totalFloors}`);
        console.log(`   Total Rooms: ${runData.dungeon.allRooms.length}`);
        console.log(`   Total Monsters: ${runData.dungeon.allMonsters.length}`);
        console.log(`   Total Treasures: ${runData.dungeon.allTreasures.length}`);

        // Show hero details
        console.log('\n👤 HERO DETAILS:');
        console.log(`Name: ${runData.hero.name}`);
        console.log(`Class: ${runData.hero.class}`);
        console.log(`Level: ${runData.hero.level}`);
        console.log(`Element: ${runData.hero.elementAffinity}`);
        console.log(`Tarot Destiny: ${runData.hero.tarotDestiny}`);
        console.log(`Stats: HP:${runData.hero.stats.hp} ATK:${runData.hero.stats.atk} DEF:${runData.hero.stats.def} SPD:${runData.hero.stats.spd}`);

        // Show first floor layout
        console.log('\n🏰 FIRST FLOOR LAYOUT:');
        const firstFloor = runData.dungeon.floors[0];
        firstFloor.rooms.forEach((room, index) => {
            console.log(`Room ${index + 1}: ${room.type} (${room.tarot}) - ${room.monsters ? room.monsters.length : 0} monsters`);
        });

        // Show some monsters
        console.log('\n⚔️ SAMPLE MONSTERS:');
        runData.encounters.slice(0, 3).forEach(encounter => {
            console.log(`${encounter.monster.name}: ${encounter.difficulty} - ${encounter.monster.element} ${encounter.monster.tarot}`);
        });

        // Show some treasures
        console.log('\n💎 SAMPLE TREASURES:');
        runData.treasures.slice(0, 3).forEach(treasure => {
            console.log(`${treasure.type} (${treasure.rarity}): ${treasure.value}g`);
        });

        console.log('\n🎭 Demo complete! Check the admin view for full details.');
        console.log('💡 Tip: Open admin-view.html for the complete interface');

        return runData;
    }).catch(error => {
        console.error('❌ Error loading generator:', error);
    });
};

// Auto-run demo if in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🚀 LosTribe Backstage Generator loaded!');
    console.log('💡 Type demoBackstageGenerator() in console to run demo');
}
