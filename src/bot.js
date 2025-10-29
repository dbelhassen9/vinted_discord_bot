const { Client, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { loadCommands } = require('./commands/loader');
const { addSearch, getSearches, removeSearch } = require('./vinted');
const { upsertPreset, getPreset, listPresetTitles } = require('./utils/userPresets');

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
  if (interaction.isButton()) {
    if (interaction.customId === 'create_preset') {
      const modal = new ModalBuilder()
        .setCustomId('create_preset_modal')
        .setTitle('Créer une configuration de bot');

      const titleInput = new TextInputBuilder()
        .setCustomId('preset_title')
        .setLabel('Titre du bot (nom de preset)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ex: black_white_bundle')
        .setRequired(true);

      const queriesInput = new TextInputBuilder()
        .setCustomId('preset_queries')
        .setLabel('Recherches récurrentes (séparées par des virgules)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('ex: bundle flamme blanche, etb reshiram, bundle foudre noire')
        .setRequired(true);

      const priceMinInput = new TextInputBuilder()
        .setCustomId('preset_price_min')
        .setLabel('Prix minimum (optionnel)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ex: 30');

      const priceMaxInput = new TextInputBuilder()
        .setCustomId('preset_price_max')
        .setLabel('Prix maximum (optionnel)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ex: 60');

      const minEvalInput = new TextInputBuilder()
        .setCustomId('preset_min_eval')
        .setLabel('Nombre min. d’évaluations (optionnel)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ex: 10');

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(queriesInput),
        new ActionRowBuilder().addComponents(priceMinInput),
        new ActionRowBuilder().addComponents(priceMaxInput),
        new ActionRowBuilder().addComponents(minEvalInput),
      );

      return interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'create_preset_modal') {
    const title = interaction.fields.getTextInputValue('preset_title').trim();
    const queriesRaw = interaction.fields.getTextInputValue('preset_queries');
    const priceMin = interaction.fields.getTextInputValue('preset_price_min').trim();
    const priceMax = interaction.fields.getTextInputValue('preset_price_max').trim();
    const minEval = interaction.fields.getTextInputValue('preset_min_eval').trim();

    const queries = queriesRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (queries.length === 0) {
      return interaction.reply({ content: '❌ Aucune recherche fournie.', ephemeral: true });
    }

    // Enregistrer le preset
    const presetData = {
      title,
      queries,
      priceMin: priceMin || null,
      priceMax: priceMax || null,
      minEvaluations: minEval || null,
      channelId: interaction.channelId,
      createdAt: Date.now(),
    };
    upsertPreset(title, presetData);

    // Nettoie les recherches existantes de ce salon
    const existing = getSearches(interaction.channelId);
    for (const s of existing) removeSearch(s.id);

    // Crée les recherches
    const createdIds = [];
    for (const q of queries) {
      const id = addSearch(interaction.channelId, {
        keyword: q,
        priceMin: presetData.priceMin,
        priceMax: presetData.priceMax,
        minEvaluations: presetData.minEvaluations,
      });
      createdIds.push(id);
    }

    return interaction.reply({ content: `✅ Preset \`${title}\` créé (${queries.length} recherche(s)). IDs: ${createdIds.map(x => '\`'+x+'\`').join(', ')}`, ephemeral: true });
  }
});

async function publishControlPanel() {
  const guilds = client.guilds.cache;
  for (const [, guild] of guilds) {
    const controlChannel = guild.channels.cache.find(c => c.name === 'bot');
    if (!controlChannel) continue;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('create_preset').setLabel('Créer').setStyle(ButtonStyle.Primary),
    );

    await controlChannel.send({ content: 'Créer une configuration de bot pour ce salon:', components: [row] });
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
