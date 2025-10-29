const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Afficher l\'aide du bot',
  usage: '!vinted help',
  
  async execute(message, args) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot de Surveillance Vinted')
      .setDescription('Surveillez les annonces Vinted en temps réel directement sur votre serveur Discord !')
      .setColor('#09B1BA')
      .setTimestamp()
      .addFields(
        {
          name: '📝 Commandes Disponibles',
          value: '\u200B',
          inline: false
        },
        {
          name: '!vinted add <mot-clé> [priceMin] [priceMax]',
          value: 'Ajouter une nouvelle recherche\nExemple: `!vinted add nike 10 50`',
          inline: false
        },
        {
          name: '!vinted list',
          value: 'Afficher toutes les recherches actives dans ce canal',
          inline: false
        },
        {
          name: '!vinted remove <searchId>',
          value: 'Supprimer une recherche par son ID',
          inline: false
        },
        {
          name: '!vinted help',
          value: 'Afficher ce message d\'aide',
          inline: false
        },
        {
          name: '⚡ Informations',
          value: '• Le bot vérifie les nouvelles annonces **toutes les 5 secondes**\n• Vous recevrez une notification pour chaque nouvelle annonce correspondant à vos critères\n• Vous pouvez avoir plusieurs recherches actives simultanément',
          inline: false
        }
      )
      .setFooter({ text: 'Vinted Bot - Surveillance en temps réel' });

    await message.reply({ embeds: [embed] });
  },
};
