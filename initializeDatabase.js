// Initialize database with default data
const fs = require('fs');
const path = require('path');
const db = require('./database');
const { DamModel } = require('./models');

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');

    // Initialize database connection
    await db.initialize();

    // Load dam data from JSON file
    const damsJsonPath = path.join(__dirname, 'dams-data.json');
    if (!fs.existsSync(damsJsonPath)) {
      console.warn('⚠️  dams-data.json not found, creating default dams');
      // Create default dams if file doesn't exist
      createDefaultDams();
      return;
    }

    const damsData = JSON.parse(fs.readFileSync(damsJsonPath, 'utf8'));
    
    if (!damsData.dams || !Array.isArray(damsData.dams)) {
      throw new Error('Invalid dams-data.json format');
    }

    console.log(`📊 Loading ${damsData.dams.length} dams from file...`);

    // Bulk create dams
    await DamModel.bulkCreate(damsData.dams);
    
    // Verify count
    const allDams = await DamModel.getAll();
    console.log(`✅ Database initialized with ${allDams.length} dams`);

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

async function createDefaultDams() {
  const defaultDams = [
    {
      id: 'kariba',
      name: 'Kariba Dam',
      province: 'Mashonaland West',
      type: 'Hydroelectric',
      capacity_percent: 78.5,
      latitude: -16.521,
      longitude: 28.762,
      image_url: 'https://via.placeholder.com/400x300/2ecc71/ffffff?text=Kariba+Dam',
      status: 'normal'
    },
    {
      id: 'mutirikwi',
      name: 'Mutirikwi Dam',
      province: 'Masvingo',
      type: 'Irrigation',
      capacity_percent: 45.2,
      latitude: -20.243,
      longitude: 30.932,
      image_url: 'https://via.placeholder.com/400x300/f39c12/ffffff?text=Mutirikwi+Dam',
      status: 'caution'
    },
    {
      id: 'manyame',
      name: 'Manyame Dam',
      province: 'Harare',
      type: 'Water Supply',
      capacity_percent: 92.3,
      latitude: -17.133,
      longitude: 30.867,
      image_url: 'https://via.placeholder.com/400x300/2ecc71/ffffff?text=Manyame+Dam',
      status: 'normal'
    },
    {
      id: 'chivero',
      name: 'Chivero Dam',
      province: 'Mashonaland East',
      type: 'Recreation',
      capacity_percent: 67.8,
      latitude: -17.917,
      longitude: 30.817,
      image_url: 'https://via.placeholder.com/400x300/f39c12/ffffff?text=Chivero+Dam',
      status: 'caution'
    }
  ];

  for (const dam of defaultDams) {
    await DamModel.create(dam);
  }

  console.log(`✅ Created ${defaultDams.length} default dams`);
}

// Export for use
module.exports = {
  initializeDatabase,
  createDefaultDams
};

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization complete');
      db.close();
    })
    .catch(error => {
      console.error('❌ Initialization failed:', error);
      db.close();
      process.exit(1);
    });
}
