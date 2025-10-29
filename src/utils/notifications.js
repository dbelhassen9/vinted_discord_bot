const { EmbedBuilder } = require('discord.js');
const { formatPrice } = require('./priceHelpers');

async function sendNotification(channel, item, searchConfig) {
  const embed = new EmbedBuilder()
    .setTitle(item.title || 'Article Vinted')
    .setURL(item.url || `https://www.vinted.fr/items/${item.id}`)
    .setColor('#09B1BA')
    .setTimestamp()
    .setFooter({ text: 'Vinted Bot' });

  if (item.photo?.url) {
    embed.setThumbnail(item.photo.url);
  }

  const formattedPrice = formatPrice(item);
  if (formattedPrice) {
    embed.addFields({ name: '💰 Prix', value: formattedPrice, inline: true });
  }

  if (item.size_title) {
    embed.addFields({ name: '📏 Taille', value: item.size_title, inline: true });
  }

  if (item.brand_title) {
    embed.addFields({ name: '🏷️ Marque', value: item.brand_title, inline: true });
  }

  if (item.user?.login) {
    embed.addFields({ name: '👤 Vendeur', value: item.user.login, inline: true });
  }

  if (item.city) {
    embed.addFields({ name: '📍 Localisation', value: item.city, inline: true });
  }

  if (searchConfig.keyword) {
    embed.addFields({ name: '🔍 Recherche', value: searchConfig.keyword, inline: false });
  }

  // Propager les erreurs (notamment 429) à la queue pour gestion
  await channel.send({ embeds: [embed] });
  console.log(`📤 Notification envoyée pour l'article ${item.id}`);
}

module.exports = { sendNotification };
