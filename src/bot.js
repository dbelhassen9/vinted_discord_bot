const { Client, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { loadCommands } = require('./commands/loader');
const { addSearch, getSearches, removeSearch } = require('./vinted');
const { upsertPreset, getPreset, listPresetTitles, deletePreset } = require('./utils/userPresets');

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
        .setTitle('Créer une configuration');

      const titleInput = new TextInputBuilder()
        .setCustomId('preset_title')
        .setLabel('Titre du bot')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ex: black_white_bundle')
        .setRequired(true);

      const queriesInput = new TextInputBuilder()
        .setCustomId('preset_queries')
        .setLabel('Recherches (séparées par des virgules)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('ex: bundle flamme blanche, etb reshiram')
        .setRequired(true);

      const priceRangeInput = new TextInputBuilder()
        .setCustomId('preset_price_range')
        .setLabel('Prix min-max (optionnel)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ex: 30-60, 30-, -60');

      const minEvalInput = new TextInputBuilder()
        .setCustomId('preset_min_eval')
        .setLabel('Min évaluations (optionnel)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ex: 10');

      const channelIdInput = new TextInputBuilder()
        .setCustomId('preset_channel_id')
        .setLabel('ID du salon pour les notifications')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ex: 123456789012345678')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(queriesInput),
        new ActionRowBuilder().addComponents(priceRangeInput),
        new ActionRowBuilder().addComponents(minEvalInput),
        new ActionRowBuilder().addComponents(channelIdInput),
      );

      return interaction.showModal(modal);
    }

    if (interaction.customId === 'use_preset') {
      const titles = listPresetTitles(interaction.user.id);
      if (titles.length === 0) {
        return interaction.reply({ content: 'ℹ️ Aucun preset trouvé pour vous.', flags: 64 });
      }
      const menu = new StringSelectMenuBuilder()
        .setCustomId('use_preset_select')
        .setPlaceholder('Sélectionnez un preset')
        .addOptions(titles.slice(0, 25).map(t => ({ label: t.slice(0, 100), value: t })));
      const row = new ActionRowBuilder().addComponents(menu);
      return interaction.reply({ content: 'Choisissez un preset à utiliser:', components: [row], flags: 64 });
    }

    if (interaction.customId === 'edit_preset') {
      const titles = listPresetTitles(interaction.user.id);
      if (titles.length === 0) {
        return interaction.reply({ content: 'ℹ️ Aucun preset à modifier.', flags: 64 });
      }
      const menu = new StringSelectMenuBuilder()
        .setCustomId('edit_preset_select')
        .setPlaceholder('Sélectionnez un preset à modifier/supprimer')
        .addOptions(titles.slice(0, 25).map(t => ({ label: t.slice(0, 100), value: t })));
      const row = new ActionRowBuilder().addComponents(menu);
      return interaction.reply({ content: 'Choisissez un preset:', components: [row], flags: 64 });
    }

    if (interaction.customId === 'stop_preset') {
      const titles = listPresetTitles(interaction.user.id);
      if (titles.length === 0) {
        return interaction.reply({ content: 'ℹ️ Aucun preset à arrêter.', flags: 64 });
      }
      const menu = new StringSelectMenuBuilder()
        .setCustomId('stop_preset_select')
        .setPlaceholder('Sélectionnez un preset à arrêter')
        .addOptions(titles.slice(0, 25).map(t => ({ label: t.slice(0, 100), value: t })));
      const row = new ActionRowBuilder().addComponents(menu);
      return interaction.reply({ content: 'Quel preset arrêter ?', components: [row], flags: 64 });
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'create_preset_modal') {
    const title = interaction.fields.getTextInputValue('preset_title').trim();
    const queriesRaw = interaction.fields.getTextInputValue('preset_queries');
    const priceRange = interaction.fields.getTextInputValue('preset_price_range').trim();
    const minEval = interaction.fields.getTextInputValue('preset_min_eval').trim();
    const targetChannelId = interaction.fields.getTextInputValue('preset_channel_id').trim();
    let priceMin = null, priceMax = null;
    if (priceRange) {
      const m = priceRange.match(/^(\d+)?\s*-\s*(\d+)?$/);
      if (m) { priceMin = m[1] || null; priceMax = m[2] || null; }
    }

    // Validate channel
    try {
      const ch = await interaction.guild.channels.fetch(targetChannelId);
      if (!ch) {
        return interaction.reply({ content: '❌ Salon invalide.', flags: 64 });
      }
    } catch {
      return interaction.reply({ content: '❌ ID de salon introuvable.', flags: 64 });
    }

    const queries = queriesRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (queries.length === 0) {
      return interaction.reply({ content: '❌ Aucune recherche fournie.', ephemeral: true });
    }

    // Enregistrer le preset
    const presetData = {
      title,
      queries,
      priceMin: priceMin,
      priceMax: priceMax,
      minEvaluations: minEval || null,
      channelId: targetChannelId,
      ownerId: interaction.user.id,
      createdAt: Date.now(),
    };
    upsertPreset(interaction.user.id, title, presetData);

    // Nettoie les recherches existantes de ce salon
    const existing = getSearches(targetChannelId);
    for (const s of existing) removeSearch(s.id);

    // Crée les recherches
    const createdIds = [];
    for (const q of queries) {
      const id = addSearch(targetChannelId, {
        keyword: q,
        priceMin: presetData.priceMin,
        priceMax: presetData.priceMax,
        minEvaluations: presetData.minEvaluations,
      });
      createdIds.push(id);
    }

    return interaction.reply({ content: `✅ Preset \`${title}\` créé (${queries.length} recherche(s)). IDs: ${createdIds.map(x => '\`'+x+'\`').join(', ')}`, flags: 64 });
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'use_preset_select') {
    const title = interaction.values[0];
      const preset = getPreset(interaction.user.id, title);
      if (!preset) return interaction.reply({ content: '❌ Preset introuvable.', flags: 64 });
      // Nettoie le salon cible puis crée
      const existing = getSearches(preset.channelId);
      for (const s of existing) removeSearch(s.id);
      const createdIds = [];
      for (const q of preset.queries) {
        const id = addSearch(preset.channelId, {
          keyword: q,
          priceMin: preset.priceMin,
          priceMax: preset.priceMax,
          minEvaluations: preset.minEvaluations,
        });
        createdIds.push(id);
      }
      return interaction.update({ content: `✅ Preset \`${title}\` utilisé. IDs: ${createdIds.map(x => '\`'+x+'\`').join(', ')}`, components: [], flags: 64 });
    }

    if (interaction.customId === 'edit_preset_select') {
      const title = interaction.values[0];
      const preset = getPreset(interaction.user.id, title);
      if (!preset) return interaction.reply({ content: '❌ Preset introuvable.', flags: 64 });

      const modal = new ModalBuilder()
        .setCustomId(`edit_preset_modal::${title}`)
        .setTitle('Modifier la configuration');

      const titleInput = new TextInputBuilder().setCustomId('preset_title').setLabel('Titre du bot').setStyle(TextInputStyle.Short).setValue(title).setRequired(true);
      const queriesInput = new TextInputBuilder().setCustomId('preset_queries').setLabel('Recherches (virgules)').setStyle(TextInputStyle.Paragraph).setValue(preset.queries.join(', ')).setRequired(true);
      const priceRangeInput = new TextInputBuilder().setCustomId('preset_price_range').setLabel('Prix min-max').setStyle(TextInputStyle.Short).setValue(`${preset.priceMin||''}-${preset.priceMax||''}`).setRequired(false);
      const minEvalInput = new TextInputBuilder().setCustomId('preset_min_eval').setLabel('Min évaluations').setStyle(TextInputStyle.Short).setValue(preset.minEvaluations || '').setRequired(false);
      const channelIdInput = new TextInputBuilder().setCustomId('preset_channel_id').setLabel('ID du salon').setStyle(TextInputStyle.Short).setValue(preset.channelId || '').setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(queriesInput),
        new ActionRowBuilder().addComponents(priceRangeInput),
        new ActionRowBuilder().addComponents(minEvalInput),
        new ActionRowBuilder().addComponents(channelIdInput),
      );

      return interaction.showModal(modal);
    }

    if (interaction.customId === 'stop_preset_select') {
      const title = interaction.values[0];
      const preset = getPreset(interaction.user.id, title);
      if (!preset) return interaction.reply({ content: '❌ Preset introuvable.', flags: 64 });
      const existing = getSearches(preset.channelId);
      for (const s of existing) removeSearch(s.id);
      return interaction.update({ content: `🛑 Recherches arrêtées pour \`${title}\` dans <#${preset.channelId}>.`, components: [], flags: 64 });
    }
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('edit_preset_modal::')) {
    const oldTitle = interaction.customId.split('::')[1];
    const title = interaction.fields.getTextInputValue('preset_title').trim();
    const queriesRaw = interaction.fields.getTextInputValue('preset_queries');
    const priceRange = interaction.fields.getTextInputValue('preset_price_range').trim();
    const minEval = interaction.fields.getTextInputValue('preset_min_eval').trim();
    const targetChannelId = interaction.fields.getTextInputValue('preset_channel_id').trim();
    let priceMin = null, priceMax = null;
    if (priceRange) {
      const m = priceRange.match(/^(\d+)?\s*-\s*(\d+)?$/);
      if (m) { priceMin = m[1] || null; priceMax = m[2] || null; }
    }

    const queries = queriesRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (queries.length === 0) return interaction.reply({ content: '❌ Aucune recherche fournie.', flags: 64 });

    // Validate channel
    try {
      const ch = await interaction.guild.channels.fetch(targetChannelId);
      if (!ch) return interaction.reply({ content: '❌ Salon invalide.', flags: 64 });
    } catch { return interaction.reply({ content: '❌ ID de salon introuvable.', flags: 64 }); }

    // Si le titre change, on supprime l'ancien
    if (oldTitle !== title) deletePreset(interaction.user.id, oldTitle);

    upsertPreset(interaction.user.id, title, {
      title,
      queries,
      priceMin: priceMin,
      priceMax: priceMax,
      minEvaluations: minEval || null,
      channelId: targetChannelId,
      ownerId: interaction.user.id,
      updatedAt: Date.now(),
    });

    return interaction.reply({ content: `✅ Preset \`${title}\` enregistré.`, flags: 64 });
  }
});

async function publishControlPanel() {
  const guilds = client.guilds.cache;
  for (const [, guild] of guilds) {
    const controlChannel = guild.channels.cache.find(c => c.name === 'bot');
    if (!controlChannel) continue;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('create_preset').setLabel('Créer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('use_preset').setLabel('Utiliser').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('edit_preset').setLabel('Modifier').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('stop_preset').setLabel('Stop').setStyle(ButtonStyle.Danger),
    );

    await controlChannel.send({ content: 'Gérer vos configurations de bot pour ce salon:', components: [row] });
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
