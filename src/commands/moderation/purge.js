const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Purge any amount of messages")
    .setDMPermission(false)
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription(`The amount of messages you want to purge.`)
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),
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
  },
};
