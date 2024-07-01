const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
} = require("discord.js");

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("getAvatar")
    .setType(ApplicationCommandType.User)
    .setDMPermission(false),
  async execute(interaction, client) {
    await interaction.reply({
      content: `${interaction.targetUser.displayAvatarURL()}`
    });
  },
};