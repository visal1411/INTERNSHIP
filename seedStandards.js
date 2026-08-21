const { WeightStandard, sequelize } = require('./database');

const standards = [
  { ageMinMonths: 0, ageMaxMonths: 6, minHealthyWeight: 70, maxHealthyWeight: 100, description: '6 months typical' },
  { ageMinMonths: 7, ageMaxMonths: 12, minHealthyWeight: 120, maxHealthyWeight: 180, description: '12 months typical' },
  { ageMinMonths: 13, ageMaxMonths: 18, minHealthyWeight: 180, maxHealthyWeight: 250, description: '18 months typical' },
  { ageMinMonths: 19, ageMaxMonths: 24, minHealthyWeight: 250, maxHealthyWeight: 350, description: '24 months typical' },
  { ageMinMonths: 25, ageMaxMonths: 240, gender: 'Female', minHealthyWeight: 300, maxHealthyWeight: 400, description: 'Adult cow' },
  { ageMinMonths: 25, ageMaxMonths: 240, gender: 'Male', minHealthyWeight: 400, maxHealthyWeight: 600, description: 'Adult bull' }
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('SQL Connected');
    
    // Clear and seed
    await WeightStandard.destroy({ where: {}, truncate: true });
    console.log('Cleared existing standards');
    
    await WeightStandard.bulkCreate(standards);
    console.log('Seeded weight standards successfully (SQL)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding SQL standards:', error);
    process.exit(1);
  }
}

seed();
