const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const Temp = require("../../schemas/temp");
const Config = require("../../schemas/config");
const { databaseToken } = process.env;
const { MongoClient } = require("mongodb");

module.exports = {
  data: {
    name: "del-warn-button",
  },
  async execute(interaction, client) {
    const tempDoc = await Temp.findOne({ tempValueOne: "delete-warning" });
    if (!tempDoc) {
      await interaction.reply({
        content: `The buttons have been disabled. Please run /warnings again.`,
        ephemeral: true,
      });
      return;
    }
    const config = await Config.findOne({ guildID: interaction.guild.id });
    const logChannel = client.channels.cache.get(config.logChannelID);
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
    const testDB = mongoClient.db("test");
    const warnColl = testDB.collection("warnings");
    const query = { guildID: interaction.guild.id, userID: user.id };
    const options = {
      sort: { datentime: -1 },
      projection: { _id: 0, guildID: 0, userID: 0 },
    };
    const cursor = warnColl.find(query, options);

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`del-warn-menu`)
      .setPlaceholder(`Select the warning you would like to delete.`)
      .setMinValues(1)
      .setMaxValues(1);

    for await (const doc of cursor) {
      menu.setOptions(
        new StringSelectMenuOptionBuilder({
          name: doc.date + " - " + doc.doc,
          value: doc._id,
        })
      ).catch(console.error);
      console.log("entered");
    }
  },
};
