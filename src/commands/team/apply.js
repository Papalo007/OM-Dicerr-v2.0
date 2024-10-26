const {
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
} = require("discord.js");
const Link = require("../../schemas/link");
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("apply")
    .setDescription("Apply for the premier team.")
    .setDMPermission(false),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guildId });
    let done = false;
    if (
      interaction.member.roles.cache.some(
        (role) => role.id === config.applicantRole
      )
    ) {
      return await interaction.reply({
        content: `You have already submitted an application. To review or withdraw your application, use /review`,
        ephemeral: true,
      });
    }

    for (roleid of config.teamRosterRoles) {
      if (interaction.member.roles.cache.some((role) => role.id === roleid)) {
        return await interaction.reply({
          content: `You are already in a team!`,
          ephemeral: true,
        });
      }
    }

    //Building the modal action rows
    const linkin = await Link.findOne({ userID: interaction.user.id });

    const modal = new ModalBuilder()
      .setCustomId(`application-modal`)
      .setTitle(`Application Details`);

    const trackerLink = new TextInputBuilder()
      .setCustomId(`tracker`)
      .setRequired(true)
      .setLabel(`Enter the link to your valorant tracker`)
      .setStyle(TextInputStyle.Short);

    const roleInput = new TextInputBuilder()
      .setCustomId(`roles`)
      .setLabel(`What role/s do you main in Valorant?`)
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const agentInput = new TextInputBuilder()
      .setCustomId(`agents`)
      .setLabel(`What agent/s do you main?`)
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const warmupRoutine = new TextInputBuilder()
      .setCustomId(`warmup`)
      .setLabel(`What is your warmup routine?`)
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);

    const extraNotes = new TextInputBuilder()
      .setCustomId(`notes`)
      .setLabel(`Anything else you want us to know?`)
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);

    const firstActionRow = new ActionRowBuilder().addComponents(trackerLink);
    const secondActionRow = new ActionRowBuilder().addComponents(roleInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(agentInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(warmupRoutine);
    const fifthActionRow = new ActionRowBuilder().addComponents(extraNotes);

    //building the modal

    if (linkin) {
      modal.addComponents(
        secondActionRow,
        thirdActionRow,
        fourthActionRow,
        fifthActionRow
      );
    } else {
      modal.addComponents(
        firstActionRow,
        secondActionRow,
        thirdActionRow,
        fourthActionRow,
        fifthActionRow
      );
    }

    //showing the modal
    await interaction.showModal(modal);
  },
};
