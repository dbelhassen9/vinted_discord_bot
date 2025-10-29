const { getSearches } = require('../vinted');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'list',
  description: 'Lister toutes les recherches actives',
  usage: '!vinted list',
  
  async execute(message, args) {
    const searches = getSearches(message.channel.id);
    
    if (searches.length === 0) {
      return message.reply('📭 Aucune recherche active dans ce canal.\nUtilisez `!vinted add <mot-clé>` pour créer une recherche.');
    }

    const embed = new EmbedBuilder()
      .setTitle('🔍 Recherches Vinted Actives')
      .setColor('#09B1BA')
      .setTimestamp()
      .setFooter({ text: `${searches.length} recherche(s) active(s)` });

    for (const search of searches) {
      let fieldValue = `🔍 Mot-clé: **${search.config.keyword || 'Tous'}**\n`;
      
      if (search.config.priceMin) {
        fieldValue += `💰 Prix min: **${search.config.priceMin}€**\n`;
      }
      
      if (search.config.priceMax) {
        fieldValue += `💰 Prix max: **${search.config.priceMax}€**\n`;
      }
      
      fieldValue += `🆔 ID: \`${search.id}\``;
      
      embed.addFields({
        name: `Recherche #${searches.indexOf(search) + 1}`,
        value: fieldValue,
        inline: false
      });
    }

    await message.reply({ embeds: [embed] });
  },
};
