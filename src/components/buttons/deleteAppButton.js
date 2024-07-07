const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Temp = require("../../schemas/temp");
const Config = require("../../schemas/config");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { databaseToken } = process.env;

module.exports = {
  data: {
    name: "del-app-button",
  },
  async execute(interaction, client) {
    const tempDoc = await Temp.findOne({ tempValueOne: "app-review" });
    if (!tempDoc) {
      await interaction.reply({
        content: `The buttons have been disabled. Please run /review again.`,
        ephemeral: true,
      });
      return;
    }
    const config = await Config.findOne({ guildID: interaction.guild.id });
    const logChannel = client.channels.cache.get(config.logChannelID);
    const user = tempDoc.tempValueTwo;
    const interactionUser = tempDoc.tempValueThree;
    const appRole = interaction.guild.roles.cache.get("1257734734168068147");
    const member = await interaction.guild.members.fetch(user);

    if (interaction.user.id !== interactionUser) {
      interaction.reply({
        content: `You are not the one who called /review`,
        ephemeral: true,
      });
      return;
    }

    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    const firstActionRow = new ActionRowBuilder().addComponents(
      confirmButton,
      cancelButton
    );

    await interaction.deferReply({ ephemeral: true });

    const mongoClient = new MongoClient(databaseToken, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    const myDB = mongoClient.db("test");
    const appColl = myDB.collection("applications");
    const query = { userID: user };

    const response = await interaction.editReply({
      content: `Are you sure you want to delete <@${user}>'s Application?`,
      ephemeral: true,
      components: [firstActionRow],
      fetchReply: true,
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 30_000,
      });

      if (confirmation.customId === "confirm") {
        await confirmation.update({
          content: `<@${user}>'s application has been deleted.`,
          components: [],
        });
        member.roles.remove(appRole).catch(console.error);
        logChannel.send(
          `<@${user}>'s application has been deleted by ${interaction.user.tag}`
        );
        await appColl.deleteOne(query).catch(console.error);
      } else if (confirmation.customId === "cancel") {
        await confirmation.update({
          content: "Action cancelled",
          components: [],
        });
      }
    } catch (e) {
      console.log(e);
      await interaction.editReply({
        content: "Confirmation not received within 30 seconds, cancelling",
        components: [],
      });
    }
  },
};
