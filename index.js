require('dotenv').config();
const { startBot } = require('./src/bot');
const { startVintedMonitoring } = require('./src/vinted');

async function main() {
  try {
    console.log('🚀 Démarrage du bot Discord Vinted...');
    
    const client = await startBot();
    
    console.log('🔍 Démarrage de la surveillance Vinted...');
    startVintedMonitoring(client);
    
    console.log('✅ Bot opérationnel !');
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

main();
