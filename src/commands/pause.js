const { pauseSearch, getSearches } = require('../vinted');

module.exports = {
  name: 'pause',
  description: 'Mettre en pause une recherche Vinted',
  usage: '!vinted pause <searchId>',
  
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Veuillez spécifier l\'ID de la recherche à mettre en pause.\nUsage: `!vinted pause <searchId>`');
    }

    const searchId = args[0];
    const searches = getSearches(message.channel.id);
    const search = searches.find(s => s.id === searchId);
    
    if (!search) {
      return message.reply('❌ Recherche non trouvée dans ce canal. Utilisez `!vinted list` pour voir vos recherches actives.');
    }

    if (!search.active) {
      return message.reply('⏸️ Cette recherche est déjà en pause.');
    }

    const ok = pauseSearch(searchId);
    if (ok) {
      return message.reply(`⏸️ Recherche mise en pause: \`${searchId}\``);
    }
    return message.reply('❌ Erreur lors de la mise en pause de la recherche.');
  },
};


