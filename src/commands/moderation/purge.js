const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete multiple messages")
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("after")
        .setDescription("Purge every message after the specified message.")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Message link or ID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("number")
        .setDescription("Purge any amount of messages")
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription(`The amount of messages you want to purge.`)
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true)
        )
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    )
      return interaction.reply({
        content: `You don't have permission to purge messages!`,
        ephemeral: true,
      });

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "number") {
      let number = interaction.options.getInteger("amount");

      await interaction.reply({
        content: `Purged the last ${number} messages`,
        ephemeral: true,
      });

      try {
        await interaction.channel.bulkDelete(number);
      } catch (error) {
        if (error.name === "DiscordAPIError[50034]") {
          await interaction.editReply({
            content: `I cannot delete messages that are over 14 days old :(`,
            ephemeral: true,
          });
        } else {
          await interaction.editReply({ content: `Nevermind I failed :(` });
          console.error(error);
        }
      }
    } else {
      let messageID = interaction.options.getString("message");

      if (messageID.startsWith("ht")) {
        messageID = messageID.match(/[^\/]+$/)[0];
      }

      try {
        await interaction.channel.messages.fetch(messageID);
      } catch (error) {
        return await interaction.reply({
          content: `This is not a valid message id or link. Note that the command must be ran in the same channel the provided message was sent.`,
        });
      }

      const amountOfMessages = (
        await interaction.channel.messages.fetch({ after: messageID })
      ).size;

      if (amountOfMessages <= 0) {
        return await interaction.reply({
          content: `There are 0 messages after the specified one so nothing happened :/`,
          ephemeral: true,
        });
      }

      await interaction.reply({
        content: `Purged the last ${amountOfMessages} messages`,
        ephemeral: true,
      });

      try {
        await interaction.channel.bulkDelete(amountOfMessages);
      } catch (error) {
        if (error.name === "DiscordAPIError[50034]") {
          await interaction.editReply({
            content: `I cannot delete messages that are over 14 days old :(`,
            ephemeral: true,
          });
        } else {
          await interaction.editReply({ content: `Nevermind I failed :(` });
          console.error(error);
        }
      }
    }
  },
};
