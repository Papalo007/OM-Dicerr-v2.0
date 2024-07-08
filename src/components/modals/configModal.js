const { PermissionFlagsBits } = require("discord.js");
const Config = require("../../schemas/config");
const { MongoClient } = require("mongodb");
const mongoose = require('mongoose');
const { databaseToken } = process.env;

module.exports = {
  data: {
    name: `config-modal`,
  },
  async execute(interaction, client) {
    const mongoClient = new MongoClient(databaseToken);

    let logChannelID = interaction.fields.getTextInputValue("logChan");
    let botCommandChannelID = interaction.fields.getTextInputValue("comChan");
    let permaInvite = interaction.fields.getTextInputValue("permaInv");
    let rosChangeChanID = interaction.fields.getTextInputValue("rosChangeChan");

    permaInvite.replace("discord.gg/", "");
    permaInvite.replace("https://discord.gg/", "");
    permaInvite.replace("http://discord.gg", "");

    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
    await interaction.reply({ content: `You do not have Admin permissions.` });
      return;
    }

    if (permaInvite) {
      let invite;

      try {
        invite = await client.fetchInvite(permaInvite, { withCounts: true });
      } catch (error) {
        await interaction.reply({
          content: `I couldn't find an invite matching \`${permaInvite}\``,
        });
      }

      if (!invite) return;

      if (invite.guild.id === interaction.guild.id) {
      } else {
      await interaction.reply({
          content: `This is not an invite for this server.`,
        });
        logChannelID = null;
        botCommandChannelID = null;
        permaInvite = null;
        rosChangeChanID = null;
        return;
      }
    }

    if (interaction.guild.channels.cache.get(logChannelID) === undefined) {
    await interaction.reply({
        content: `The provided channel ID for the log channel does not correspond to an existing channel in this server.`,
      });
      logChannelID = null;
      botCommandChannelID = null;
      permaInvite = null;
      rosChangeChanID = null;
      return;
    } else if (
      interaction.guild.channels.cache.get(botCommandChannelID) === undefined &&
      botCommandChannelID
    ) {
    await interaction.reply({
        content: `The provided channel ID for the bot-commands channel does not correspond to an existing channel in this server.`,
      });
      logChannelID = null;
      botCommandChannelID = null;
      permaInvite = null;
      rosChangeChanID = null;
      return;
    } else if (
      interaction.guild.channels.cache.get(rosChangeChanID) === undefined &&
      rosChangeChanID
    ) {
    await interaction.reply({
        content: `The provided channel ID for the roster changes channel does not correspond to an existing channel in this server.`,
      });
      logChannelID = null;
      botCommandChannelID = null;
      permaInvite = null;
      rosChangeChanID = null;
      return;
    } else {
      if (botCommandChannelID && rosChangeChanID) {
      await interaction.reply({
          content: `The log channel, bot-commands channel and roster-changes channel have been set to <#${logChannelID}>, <#${botCommandChannelID}> and <#${rosChangeChanID}> respectively. The permanent invite for this server is ${permaInvite}`,
        });
      } else if (botCommandChannelID) {
      await interaction.reply({
          content: `The log channel has been set to <#${logChannelID}> and the bot-commands channel has been set to <#${botCommandChannelID}>. The permanent invite for this server is ${permaInvite}`,
        });
      } else if (rosChangeChanID) {
      await interaction.reply({
          content: `The log channel has been set to <#${logChannelID}> and the roster-changes channel has been set to <#${rosChangeChanID}>. The permanent invite for this server is ${permaInvite}`,
        });
      } else {
      await interaction.reply({
          content: `The log channel has been set to <#${logChannelID}> and the permanent invite for this server is ${permaInvite}`,
        });
      }

      let guildConfig = await Config.findOne({ guildID: interaction.guild.id });
      if (!guildConfig) {
        guildConfig = await new Config({
          _id: new mongoose.Types.ObjectId(),
          guildID: interaction.guild.id,
          logChannelID: logChannelID,
          permaInvite: permaInvite,
          rosterChangesChannelID: rosChangeChanID,
          botCommandsChannelID: botCommandChannelID,
        });

        await guildConfig.save().catch(console.error);
        console.log("Saved new guild configuration profile:");
        console.log(guildConfig);
      } else {
        const updateDocument = {
          $set: {
            logChannelID: logChannelID,
            permaInvite: permaInvite,
            rosterChangesChannelID: rosChangeChanID,
            botCommandsChannelID: botCommandChannelID,
          },
        };
        const filter = { _id: guildConfig._id };
        const myDB = mongoClient.db("test");
        const myColl = myDB.collection("configs");
        await myColl.updateOne(filter, updateDocument);
        console.log("Updated configuration profile");
      }
    }
  },
};
