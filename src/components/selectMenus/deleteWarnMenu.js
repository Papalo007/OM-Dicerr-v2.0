const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const Config = require("../../schemas/config");
const Warning = require("../../schemas/warn");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;

module.exports = {
  data: {
    name: `del-warn-menu`,
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    await interaction.deferReply();
    const dateReason = interaction.values[0];

    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      await interaction.editReply({
        content: `The configuration document for this server has been deleted.`,
      });
      return;
    }

    const warn = await Warning.findOne({
      reason: dateReason.substring(10),
      date: dateReason.substring(0, 10),
    });

    if (!warn) {
      await interaction.editReply({
        content: `This warning doesn't exist anymore`,
      });
      return;
    }

    const logChannel = client.channels.cache.get(config.logChannel);

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
    const warnedUser = await client.users.fetch(warn.userID);

    const mongoClient = new MongoClient(databaseToken);

    const myDB = mongoClient.db("test");
    const warnColl = myDB.collection("warnings");
    const query = {
      reason: dateReason.substring(10),
      date: dateReason.substring(0, 10),
    };

    const response = await interaction.editReply({
      content: `Are you sure you want to remove the warning from ${warn.date} with the reason: ${warn.reason}`,
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
          content: `Warning has been deleted`,
          components: [],
        });
        const resultOfDel = await warnColl
          .deleteOne(query)
          .catch(console.error);
        if (resultOfDel.deletedCount === 1) {
          await logChannel.send(
            `${interaction.user.tag} has succesfully removed a warning from ${warnedUser.tag}\nDate: ${warn.date}\nReason: ${warn.reason}`
          );
        } else {
          await interaction.editReply({
            content: `Failed to delete warning. `,
          });
          return;
        }
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
