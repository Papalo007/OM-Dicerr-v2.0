const Config = require("../../schemas/config");
const App = require("../../schemas/application");
const Link = require("../../schemas/link");
const mongoose = require("mongoose");

module.exports = {
  data: {
    name: `application-modal`,
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      return interaction.reply({
        content: `You haven't set up the proper channels yet! Do /setup.`,
      });
    }

    let targetInHex;
    const linkin = await Link.findOne({ userID: interaction.user.id });
    if (linkin) {
      targetInHex = linkin.riotID.replace(/#/g, "%23").replace(/ /g, "%20");
    }

    let tracker;
    try {
      tracker = interaction.fields.getTextInputValue("tracker");
    } catch (error) {
      tracker = `https://tracker.gg/valorant/profile/riot/${targetInHex}/overview`;
    }

    const valoRoles = interaction.fields.getTextInputValue("roles");
    const agents = interaction.fields.getTextInputValue("agents");
    const warmup = interaction.fields.getTextInputValue("warmup") ?? "N/A";
    const notes = interaction.fields.getTextInputValue("notes") ?? "N/A";
    const appRole = interaction.guild.roles.cache.get(config.applicantRole);
    const logChannel = client.channels.cache.get(config.logChannel);
    const member = interaction.member;

    await interaction.deferReply({ ephemeral: true });

    //validation checks
    if (!tracker.includes("https://tracker.gg/valorant/profile/riot/")) {
      await interaction.editReply({
        content: `" ${tracker} " is not a valid tracker link. Tracker links start with "https://tracker.gg/valorant/profile/riot/"`,
        ephemeral: true,
      });
      return;
    }
    //end of validation checks
    const errorCheck = await App.findOne({ userID: interaction.user.id });
    if (errorCheck) {
      await interaction.editReply({
        content: `It seems that there already exists an application with your user ID.`,
      });
      return;
    }

    const application = new App({
      _id: new mongoose.Types.ObjectId(),
      guildID: interaction.guild.id,
      userID: interaction.user.id,
      tracker: tracker,
      roles: valoRoles,
      agents: agents,
      warmup: warmup,
      notes: notes,
      missedMatches: 0,
    });
    await application.save().catch(console.error);

    member.roles.add(appRole).catch(console.error);
    await logChannel.send({
      content: `Application submitted by ${interaction.user.username} (<@${interaction.user.id}>)`,
    });
    await interaction.editReply({
      content: `Your application has been submitted! To review or withdraw your application, run /review followed by your name.`,
    });
  },
};
