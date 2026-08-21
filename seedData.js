const { Cow, WeightRecord, Device, sequelize } = require('./database');

const sampleCows = [
  { cowId: 'COW-001', name: 'Bella', breed: 'Brahman', gender: 'Female', birthDate: '2025-06-15' },
  { cowId: 'COW-002', name: 'Thunder', breed: 'Angus', gender: 'Male', birthDate: '2024-12-10' },
  { cowId: 'COW-003', name: 'Daisy', breed: 'Hereford', gender: 'Female', birthDate: '2025-01-05' },
  { cowId: 'COW-004', name: 'Rex', breed: 'Brahman', gender: 'Male', birthDate: '2023-11-20' }
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('SQL Connected');
    
    // Sync true to clear
    await sequelize.sync({ force: true });
    console.log('Database cleared and synchronized');

    // Create Device
    await Device.create({ deviceId: 'esp32-scale-01', status: 'online', name: 'Main Gate Scale' });

    // Seed Cows
    for (const cowData of sampleCows) {
      const cow = await Cow.create(cowData);
      
      // Create historical records
      let weight = cow.gender === 'Male' ? 400 : 150;
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 30));
        
        await WeightRecord.create({
          cowId: cow.cowId,
          deviceId: 'esp32-scale-01',
          weight: weight + (Math.random() * 10),
          timestamp: date,
          stable: true
        });
        weight += 15;
      }
    }
    
    console.log('Seeded sample cows and records successfully (SQL)');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding SQL:', error);
    process.exit(1);
  }
}

seed();
