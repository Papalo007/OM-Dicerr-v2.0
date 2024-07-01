const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Returns the configuration menu.")
    .setDMPermission(false),
  async execute(interaction, client) {
    embed = new EmbedBuilder()
      .setAuthor({
        name: "Moderator Dicerr",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTitle("Configuration Embed")
      .setDescription("Placeholder Description")
      .setTimestamp();
      

      const button = new ButtonBuilder()
      .setCustomId("config-button")
      .setLabel("Config Menu")
      .setStyle(ButtonStyle.Danger);

      if(interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        button.setDisabled(false);
      } else {
        button.setDisabled(true);
      }


    await interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(button)],
    });
  },
};