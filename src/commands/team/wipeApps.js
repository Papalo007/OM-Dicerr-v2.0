const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wipe-apps")
    .setDescription("Deletes all applications.")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    await interaction.deferReply();
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

    const mongoClient = new MongoClient(databaseToken);

    const myDB = mongoClient.db("test");
    const appColl = myDB.collection("applications");
    const appRole = interaction.guild.roles.cache.get(config.applicantRole);

    const response = await interaction.editReply({
      content: `Are you sure you want to wipe all applications? This action cannot be undone! (This will also remove the applicant role from anyone with an application).`,
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
          content: `All applications have been succesfully wiped`,
          components: [],
        });
        let result = await appColl.findOneAndDelete({
          guildID: interaction.guild.id,
        });
        let member;
        while (result !== null) {
          member = await interaction.guild.members.fetch(result.userID);
          await member.roles.remove(appRole);
          result = await appColl.findOneAndDelete({
            guildID: interaction.guild.id,
          });
        }
        await logChannel.send(
          `All (${result.deletedCount}) applications have been deleted by ${interaction.user.tag} (application database wiped succesfully)`
        );
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
