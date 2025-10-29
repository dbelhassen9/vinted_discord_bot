const { resumeSearch, getSearches } = require('../vinted');

module.exports = {
  name: 'resume',
  description: 'Relancer une recherche Vinted mise en pause',
  usage: '!vinted resume <searchId>',
  
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Veuillez spécifier l\'ID de la recherche à relancer.\nUsage: `!vinted resume <searchId>`');
    }

    const searchId = args[0];
    const searches = getSearches(message.channel.id);
    const search = searches.find(s => s.id === searchId);
    
    if (!search) {
      return message.reply('❌ Recherche non trouvée dans ce canal. Utilisez `!vinted list` pour voir vos recherches actives.');
    }

    if (search.active) {
      return message.reply('▶️ Cette recherche est déjà active.');
    }

    const ok = resumeSearch(searchId);
    if (ok) {
      return message.reply(`▶️ Recherche relancée: \`${searchId}\``);
    }
    return message.reply('❌ Erreur lors de la relance de la recherche.');
  },
};


