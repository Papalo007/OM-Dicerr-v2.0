const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Config = require("../../schemas/config");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("recruit")
    .setDescription("Recruit the provided player into the team!")
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member you'd like to recruit.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("team")
        .setDescription("The team you want the member to recruit to.")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      await interaction.reply({
        content: `You haven't set up the proper channels yet! Do /config.`,
      });
      return;
    }
    if (config.botCommandsChannel) {
      const channel = client.channels.cache.get(config.botCommandsChannel);
      if (channel !== interaction.channel) {
        await interaction.reply({
          content: `You cannot use commands in this channel`,
          ephemeral: true,
        });
        return;
      }
    }

    await interaction.deferReply();

    const targetUser = interaction.options.getUser("target");
    const user = interaction.options.getMember("target");
    const logChannel = client.channels.cache.get(config.logChannelID);
    const userId = targetUser.id;
    const member = interaction.member;
    const omRole = interaction.guild.roles.cache.get("1219879616546738236");
    const tmRole = interaction.guild.roles.cache.get("1243214533590384660");
    const appRole = interaction.guild.roles.cache.get("1257734734168068147");
    const mongoClient = new MongoClient(databaseToken);

    const myDB = mongoClient.db("test");
    const appColl = myDB.collection("applications");
    const query = { userID: userId };

    const announcementChannel = client.channels.cache.get(
      config.rosterChangesChannelID
    );

    let team = interaction.options.getString("team");
    if (
      team !== "OM" &&
      team !== "One More" &&
      team !== "TM" &&
      team !== "Two More" &&
      team !== "om" &&
      team !== "tm"
    ) {
      await interaction.editReply({
        content: `${team} is not a valid team. Valid options are: One More, OM, om, Two More, TM, tm.`,
      });
      return;
    } else if (team === "OM" || team === "One More" || team === "om") {
      if (user.roles.cache.some((role) => role.name === "OM Roster")) {
        await interaction.editReply({
          content: `This player is already in One More.`,
          ephemeral: true,
        });
        return;
      } else if (user.roles.cache.some((role) => role.name === "TM Roster")) {
        await interaction.editReply({
          content: `This player is already in Two More.`,
          ephemeral: true,
        });
        return;
      }
      if (!member.roles.cache.some((role) => role.name === "OM Manager")) {
        await interaction.editReply({
          content: `You are not authorised to recruit people for One More.`,
        });
        return;
      } else {
        await user.roles.add(omRole).catch(console.error);
        await user.roles.remove(appRole).catch(console.error);

        if (announcementChannel) {
          await announcementChannel.send({
            content: `<@&1245743215898919143> <@${userId}> has been accepted to One More!`,
          });
        }

        await targetUser.send({
          content: `Congratulations, you have been accepted to One More!\nJoin our gankster team: https://valorant.gankster.gg/i?code=kLKMq1PGQWMa\nAlso make sure to DM papalo and ask for an invite to the OM server. I can't do that myself :(`,
        });
      }
      team = "One More";
    } else if (team === "TM" || team === "Two More" || team === "tm") {
      if (user.roles.cache.some((role) => role.name === "OM Roster")) {
        await interaction.editReply({
          content: `This player is already in One More.`,
          ephemeral: true,
        });
        return;
      } else if (user.roles.cache.some((role) => role.name === "TM Roster")) {
        await interaction.editReply({
          content: `This player is already in Two More.`,
          ephemeral: true,
        });
        return;
      }
      if (!member.roles.cache.some((role) => role.name === "TM Manager")) {
        await interaction.editReply({
          content: `You are not authorised to recruit people for Two More.`,
        });
        return;
      } else {
        await user.roles.add(tmRole).catch(console.error);
        await user.roles.remove(appRole).catch(console.error);

        if (announcementChannel) {
          await announcementChannel.send({
            content: `<@&1245743215898919143> <@${userId}> has been accepted to Two More!`,
          });
        }

        await targetUser.send({
          content: `Congratulations, you have been accepted to Two More! Join the gankster team through this link: https://valorant.gankster.gg/i?code=yNGYPxLEJgmR\nIf you have any questions, feel free open a support ticket in https://discord.com/channels/1219872802794901565/1223388941718257797`,
        });
      }
      team = "Two More";
    }

    const logEmbed = new EmbedBuilder()
      .setAuthor({
        name: "Moderator Dicerr",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTitle("Recruitment Log")
      .setDescription(`Recruitment log for ${team}`)
      .addFields(
        {
          name: "Recruited by",
          value: interaction.user.tag,
          inline: false,
        },
        {
          name: "Recruiter ID",
          value: interaction.user.id,
          inline: true,
        },
        {
          name: "Recruiter Mention",
          value: `<@${interaction.user.id}>`,
          inline: true,
        },
        {
          name: "New Recruit",
          value: targetUser.tag,
          inline: false,
        },
        {
          name: "New Recruit ID",
          value: userId,
          inline: true,
        },
        {
          name: "New Recruit Mention",
          value: `<@${userId}>`,
          inline: true,
        },
        {
          name: "Team",
          value: team,
          inline: false,
        }
      )
      .setColor("#ff8000")
      .setFooter({
        text: "Recruitment log by OM Dicerr v2.0",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.editReply({
      content: `${targetUser.tag} has succesfully been recruited to ${team}!`,
    });
    await logChannel.send({ embeds: [logEmbed] });
    await appColl.deleteOne(query).catch(console.error);
  },
};
