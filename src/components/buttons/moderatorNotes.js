const {
  TextInputBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputStyle,
} = require("discord.js");
const Temp = require("../../schemas/temp");

module.exports = {
  data: {
    name: "mod-notes-button",
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const tempDoc = await Temp.findOne({ tempValueOne: "app-review", guildID: interaction.guild.id });
    if (!tempDoc) {
      await interaction.reply({
        content: `The buttons have been disabled. Please run /review again.`,
        ephemeral: true,
      });
      return;
    }
    const user = tempDoc.tempValueTwo;
    const interactionUser = tempDoc.tempValueThree;
    const actualUser = await client.users.fetch(user);

    if (interaction.user.id !== interactionUser) {
      interaction.reply({
        content: `You are not the one who called /review`,
        ephemeral: true,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`mod-notes-modal`)
      .setTitle(`Add notes to ${actualUser.tag}'s application.`);

    const modNoteInput = new TextInputBuilder()
      .setCustomId(`modNotes`)
      .setLabel(`Only moderators can see this.`)
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const firstActionRow = new ActionRowBuilder().addComponents(modNoteInput);

    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
  },
};
