const { addSearch } = require('../vinted');

module.exports = {
  name: 'add',
  description: 'Ajouter une nouvelle recherche Vinted',
  usage: '!vinted add <mot-clé> [priceMin] [priceMax]',
  
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Veuillez spécifier au moins un mot-clé.\nUsage: `!vinted add <mot-clé> [priceMin] [priceMax]`');
    }

    const searchConfig = {
      keyword: args[0],
      priceMin: args[1] || null,
      priceMax: args[2] || null,
    };

    const searchId = addSearch(message.channel.id, searchConfig);
    
    let response = `✅ Recherche ajoutée avec succès !\n🔍 Mot-clé: **${searchConfig.keyword}**`;
    
    if (searchConfig.priceMin) {
      response += `\n💰 Prix min: **${searchConfig.priceMin}€**`;
    }
    
    if (searchConfig.priceMax) {
      response += `\n💰 Prix max: **${searchConfig.priceMax}€**`;
    }
    
    response += `\n🆔 ID de recherche: \`${searchId}\``;
    response += '\n\n📡 Le bot vérifiera les nouvelles annonces toutes les 5 secondes.';
    
    await message.reply(response);
  },
};
