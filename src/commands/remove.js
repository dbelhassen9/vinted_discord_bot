const { removeSearch, getSearches } = require('../vinted');

module.exports = {
  name: 'remove',
  description: 'Supprimer une recherche Vinted',
  usage: '!vinted remove <searchId>',
  
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Veuillez spécifier l\'ID de la recherche à supprimer.\nUsage: `!vinted remove <searchId>`');
    }

    const searchId = args[0];
    const searches = getSearches(message.channel.id);
    const search = searches.find(s => s.id === searchId);
    
    if (!search) {
      return message.reply('❌ Recherche non trouvée dans ce canal. Utilisez `!vinted list` pour voir vos recherches actives.');
    }
    
    const success = removeSearch(searchId);
    
    if (success) {
      await message.reply(`✅ Recherche supprimée: \`${searchId}\``);
    } else {
      await message.reply('❌ Erreur lors de la suppression de la recherche.');
    }
  },
};
