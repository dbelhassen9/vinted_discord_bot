const { Client, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadCommands } = require('./commands/loader');
const { PRESETS, DEFAULT_CHANNELS_BY_PRESET } = require('./config/presets');
const { addSearch, getSearches, removeSearch } = require('./vinted');

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
  publishControlPanel().catch(err => console.warn('Impossible de publier le panneau:', err.message));
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

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId } = interaction;
  if (customId !== 'preset_reshiram' && customId !== 'preset_zekrom') return;

  const presetKey = customId === 'preset_reshiram' ? 'reshiram' : 'zekrom';
  const preset = PRESETS[presetKey];
  const channelsByPreset = DEFAULT_CHANNELS_BY_PRESET[presetKey];

  try {
    const guild = interaction.guild;
    const bundleChannel = guild.channels.cache.find(c => c.name === channelsByPreset.bundle);
    const etbChannel = guild.channels.cache.find(c => c.name === channelsByPreset.etb);
    if (!bundleChannel || !etbChannel) {
      return interaction.reply({ content: `❌ Salons introuvables. Créez \`${channelsByPreset.bundle}\` et \`${channelsByPreset.etb}\`.`, ephemeral: true });
    }

    for (const channel of [bundleChannel, etbChannel]) {
      const existing = getSearches(channel.id);
      for (const s of existing) {
        removeSearch(s.id);
      }
    }

    const bundleId = addSearch(bundleChannel.id, { keyword: preset.searches.bundle.keyword });
    const etbId = addSearch(etbChannel.id, { keyword: preset.searches.etb.keyword });

    await interaction.reply({ content: `✅ ${preset.label} activé\n• ${channelsByPreset.bundle}: \`${preset.searches.bundle.keyword}\` (id: ${bundleId})\n• ${channelsByPreset.etb}: \`${preset.searches.etb.keyword}\` (id: ${etbId})`, ephemeral: true });
  } catch (error) {
    console.error('Erreur preset:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Erreur lors de l\'activation du preset.', ephemeral: true });
    }
  }
});

async function publishControlPanel() {
  const guilds = client.guilds.cache;
  for (const [, guild] of guilds) {
    const controlChannel = guild.channels.cache.find(c => c.name === 'bot');
    if (!controlChannel) continue;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('preset_reshiram').setLabel('Reshiram').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('preset_zekrom').setLabel('Zekrom').setStyle(ButtonStyle.Success),
    );

    await controlChannel.send({ content: 'Sélectionne un preset pour activer les recherches:', components: [row] });
  }
}

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
