const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const Temp = require("../../schemas/temp");
const { databaseToken } = process.env;
const { MongoClient } = require("mongodb");

module.exports = {
  data: {
    name: "del-warn-button",
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const tempDoc = await Temp.findOne({
      tempValueOne: "delete-warning",
      guildID: interaction.guild.id,
    });
    if (!tempDoc) {
      await interaction.reply({
        content: `The buttons have been disabled. Please run /warnings again.`,
        ephemeral: true,
      });
      return;
    }
    const user = tempDoc.tempValueTwo;
    const interactionUser = tempDoc.tempValueThree;

    if (interaction.user.id !== interactionUser) {
      interaction.reply({
        content: `You are not the one who called /warnings`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const mongoClient = new MongoClient(databaseToken);
    const testDB = mongoClient.db("bot");
    const warnColl = testDB.collection("warnings");
    const query = { guildID: interaction.guild.id, userID: user };
    const options = {
      sort: { datentime: -1 },
      projection: { guildID: 0, userID: 0 },
    };
    const cursor = warnColl.find(query, options);

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`del-warn-menu`)
      .setPlaceholder(`Select the warning you would like to delete.`)
      .setMinValues(1)
      .setMaxValues(1);

    for await (const doc of cursor) {
      menu.addOptions(
        new StringSelectMenuOptionBuilder({
          label: `${doc.date} - ${doc.reason}`,
          value: doc.date + doc.reason,
        })
      );
    }

    const firstActionRow = new ActionRowBuilder().addComponents(menu);
    await interaction.editReply({
      content: `Which warning would you like to delete?`,
      components: [firstActionRow],
    });
  },
};
