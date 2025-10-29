const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadCommands } = require('./commands/loader');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  console.log(`📡 Présent sur ${client.guilds.cache.size} serveur(s)`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!vinted')) return;

  // Découpe les arguments en respectant les guillemets: "mot clé" -> un seul argument
  function tokenize(input) {
    const tokens = [];
    const regex = /\"([^\"]+)\"|'([^']+)'|[^\s]+/g;
    let match;
    while ((match = regex.exec(input)) !== null) {
      tokens.push(match[1] || match[2] || match[0]);
    }
    return tokens;
  }

  const raw = message.content.slice('!vinted'.length).trim();
  const parts = tokenize(raw);
  if (parts.length === 0) return;
  const commandName = parts.shift().toLowerCase();
  const args = parts;

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la commande:', error);
    await message.reply('Une erreur est survenue lors de l\'exécution de cette commande.');
  }
});

async function startBot() {
  loadCommands(client);
  
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN n\'est pas défini. Veuillez configurer votre token Discord.');
  }
  
  await client.login(token);
  return client;
}

module.exports = { startBot };
