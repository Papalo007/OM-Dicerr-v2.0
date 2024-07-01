const {
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
  } = require("discord.js");
  
  module.exports = {
    data: {
      name: "config-button",
    },
    async execute(interaction, client) {
      const modal = new ModalBuilder()
        .setCustomId(`config-modal`)
        .setTitle(`Configuration Menu`);
  
      const logChanInput = new TextInputBuilder()
        .setCustomId(`logChan`)
        .setLabel(`What is the ID of your log channel?`)
        .setRequired(true) //makes the field be required
        .setStyle(TextInputStyle.Short); //Paragraph for long input, Short for shorter input
  
      const commandChannelInput = new TextInputBuilder()
        .setCustomId(`comChan`)
        .setLabel(`Bot commands channel ID. Leave empty for all`)
        .setRequired(false)
        .setStyle(TextInputStyle.Short);
  
      const permanentInvite = new TextInputBuilder()
        .setCustomId(`permaInv`)
        .setLabel(`Input a PERMANENT Invite for this server.`)
        .setRequired(false)
        .setStyle(TextInputStyle.Short);
  
      const rosterChangesChannel = new TextInputBuilder()
        .setCustomId(`rosChangeChan`)
        .setLabel(`Input the ID of the roster changes channel.`)
        .setRequired(false)
        .setStyle(TextInputStyle.Short);
  
      const firstActionRow = new ActionRowBuilder().addComponents(logChanInput);
      const secondActionRow = new ActionRowBuilder().addComponents(
        commandChannelInput
      );
      const thirdActionRow = new ActionRowBuilder().addComponents(
        permanentInvite
      );
      const fourthActionRow = new ActionRowBuilder().addComponents(
        rosterChangesChannel
      );
  
      modal.addComponents(
        firstActionRow,
        secondActionRow,
        thirdActionRow,
        fourthActionRow
      );
  
      await interaction.showModal(modal);
    },
  };