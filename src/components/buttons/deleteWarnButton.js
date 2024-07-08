const Temp = require("../../schemas/temp");
const Config = require("../../schemas/config");

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
  },
};
