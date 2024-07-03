const Config = require("../../schemas/config");
const App = require("../../schemas/application");
const mongoose = require("mongoose");

module.exports = {
  data: {
    name: `application-modal`,
  },
  async execute(interaction, client) {
    const tracker = interaction.fields.getTextInputValue("tracker");
    const valoRoles = interaction.fields.getTextInputValue("roles");
    const agents = interaction.fields.getTextInputValue("agents");
    const warmup = interaction.fields.getTextInputValue("warmup") ?? "N/A";
    const notes = interaction.fields.getTextInputValue("notes") ?? "N/A";
    const appRole = interaction.guild.roles.cache.get("1257734734168068147");
    const logChannel = client.channels.cache.get(Config.logChannelID);
    const user = interaction.user;
    console.log(interaction.user);
    console.log(user);

    //validation checks
    if (!tracker.startsWith("https://tracker.gg/valorant/profile/riot/")) {
      await interaction.reply({
        content: `${tracker} is not a valid tracker link. Tracker links start with "https://tracker.gg/valorant/profile/riot/"`,
        ephemeral: true,
      });
      return;
    }
    if (
      !valoRoles.toLowerCase().includes("duelist") &&
      !valoRoles.toLowerCase().includes("controller") &&
      !valoRoles.toLowerCase().includes("initiator") &&
      !valoRoles.toLowerCase().includes("sentinel") &&
      !valoRoles.toLowerCase().includes("all") &&
      !valoRoles.toLowerCase().includes("every")
    ) {
      interaction.reply({
        content: `${valoRoles} is/are not a valid selection of Valorant roles`,
      });
      return;
    }
    //end of validation checks
    const errorCheck = await App.findOne({ userID: interaction.user.id });
    if (errorCheck) {
      interaction.reply({
        content: `It seems that there already exists an application with your user ID. If you get this error, please DM @papalo007`,
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
    });
    await application.save().catch(console.error);
    
    await user.roles.add(appRole).catch(console.error);
    logChannel.send({content: `Application submitted by ${interaction.user.name} (<@${interaction.user.id})`});
    interaction.reply({content: `Your application has been submitted!`})
  },
};
