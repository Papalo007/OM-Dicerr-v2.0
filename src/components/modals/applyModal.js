const Config = require("../../schemas/config");
const App = require("../../schemas/application");
const mongoose = require("mongoose");

module.exports = {
  data: {
    name: `application-modal`,
  },
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      await interaction.reply({
        content: `You haven't set up the proper channels yet! Do /config.`,
      });
      return;
    }

    const tracker = interaction.fields.getTextInputValue("tracker");
    const valoRoles = interaction.fields.getTextInputValue("roles");
    const agents = interaction.fields.getTextInputValue("agents");
    const warmup = interaction.fields.getTextInputValue("warmup") ?? "N/A";
    const notes = interaction.fields.getTextInputValue("notes") ?? "N/A";
    const appRole = interaction.guild.roles.cache.get("1257734734168068147");
    const logChannel = client.channels.cache.get(config.logChannelID);
    const member = interaction.member;

    await interaction.deferReply({ ephemeral: true });

    //validation checks
    if (!tracker.startsWith("https://tracker.gg/valorant/profile/riot/")) {
      await interaction.editReply({
        content: `${tracker} is not a valid tracker link. Tracker links start with "https://tracker.gg/valorant/profile/riot/"`,
        ephemeral: true,
      });
      return;
    }
    if (
      !valoRoles.toLowerCase().includes("duelist") &&
      !valoRoles.toLowerCase().includes("control") &&
      !valoRoles.toLowerCase().includes("ini") &&
      !valoRoles.toLowerCase().includes("sen") &&
      !valoRoles.toLowerCase().includes("all") &&
      !valoRoles.toLowerCase().includes("every")
    ) {
      await interaction.editReply({
        content: `${valoRoles} is/are not a valid selection of Valorant roles`,
      });
      return;
    }
    //end of validation checks
    const errorCheck = await App.findOne({ userID: interaction.user.id });
    if (errorCheck) {
      await interaction.editReply({
        content: `It seems that there already exists an application with your user ID. If you get this error, please open a ticket in <#1223388941718257797>`,
      });
      return;
    }

    const application = new App({
      _id: new mongoose.Types.ObjectId(),
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
    logChannel.send({
      content: `Application submitted by ${interaction.user.username} (<@${interaction.user.id}>)`,
    });
    await interaction.editReply({
      content: `Your application has been submitted! To review or withdraw your application, run /review followed by your name.`,
    });
  },
};
