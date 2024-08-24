const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const Config = require("../../schemas/config");
const Temp = require("../../schemas/temp");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;

module.exports = {
  data: {
    name: "recruit-button",
  },
  async execute(interaction, client) {
    await interaction.deferReply();

    const tempDoc = await Temp.findOne({ tempValueOne: "app-review" });
    if (!tempDoc) {
      await interaction.reply({
        content: `The buttons have been disabled. Please run /review again.`,
        ephemeral: true,
      });
      return;
    }
    const config = await Config.findOne({ guildID: interaction.guild.id });
    const logChannel = client.channels.cache.get(config.logChannelID);
    const user = tempDoc.tempValueTwo;
    const interactionUser = tempDoc.tempValueThree;
    const appRole = interaction.guild.roles.cache.get("1257734734168068147");
    const omRole = interaction.guild.roles.cache.get("1219879616546738236");
    const tmRole = interaction.guild.roles.cache.get("1243214533590384660");
    const member = await interaction.guild.members.fetch(user);
    const targetUser = await client.users.fetch(user);
    let team;
    const mongoClient = new MongoClient(databaseToken);

    const myDB = mongoClient.db("test");
    const appColl = myDB.collection("applications");
    const query = { userID: user };

    if (interaction.user.id !== interactionUser) {
      interaction.editReply({
        content: `You are not the one who called /review`,
        ephemeral: true,
      });
      return;
    }

    const announcementChannel = client.channels.cache.get(
      config.rosterChangesChannelID
    );

    const omButton = new ButtonBuilder()
      .setCustomId("om")
      .setLabel("One More")
      .setStyle(ButtonStyle.Primary);

    const tpnButton = new ButtonBuilder()
      .setCustomId("tpn")
      .setLabel("Typhoon")
      .setStyle(ButtonStyle.Success);

    const firstActionRow = new ActionRowBuilder().addComponents(
      omButton,
      tpnButton
    );

    const response = await interaction.editReply({
      content: `Which team would you like to recruit ${targetUser.tag} (<@${user}>) into?`,
      ephemeral: true,
      components: [firstActionRow],
      fetchReply: true,
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 30_000,
      });

      if (confirmation.customId === "om") {
        if (
          !interaction.member.roles.cache.some(
            (role) => role.name === "OM Manager"
          )
        ) {
          await confirmation.update({
            content: `You are not authorised to recruit people for One More.`,
            components: [],
          });
          return;
        } else {
          await member.roles.add(omRole).catch(console.error);
          await member.roles.remove(appRole).catch(console.error);

          if (announcementChannel) {
            await announcementChannel.send({
              content: `<@&1245743215898919143> <@${user}> has been accepted to One More!`,
            });
          }

          await targetUser.send({
            content: `Congratulations, you have been accepted to One More!\nJoin our gankster team: https://valorant.gankster.gg/i?code=kLKMq1PGQWMa\nAlso make sure to DM papalo and ask for an invite to the OM server. I can't do that myself :(`,
          });

          team = "One More";
        }
      } else if (confirmation.customId === "tpn") {
        if (
          !interaction.member.roles.cache.some(
            (role) => role.name === "TPN Manager"
          )
        ) {
          await confirmation.update({
            content: `You are not authorised to recruit people for Typhoon.`,
            components: [],
          });
          return;
        } else {
          await member.roles.add(tmRole).catch(console.error);
          await member.roles.remove(appRole).catch(console.error);

          if (announcementChannel) {
            await announcementChannel.send({
              content: `<@&1245743215898919143> <@${user}> has been recruited to Typhoon!`, 
            });
          }

          await targetUser.send({
            content: `Congratulations, you have been accepted to Typhoon! Join the gankster team through this link: https://valorant.gankster.gg/i?code=yNGYPxLEJgmR\nIf you have any questions, feel free open a support ticket in https://discord.com/channels/1219872802794901565/1223388941718257797`,
          });

          team = "Typhoon";
        }
      }
    } catch (e) {
      console.log(e);
      await interaction.editReply({
        content: "Confirmation not received within 30 seconds, cancelling",
        components: [],
      });
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
          value: user,
          inline: true,
        },
        {
          name: "New Recruit Mention",
          value: `<@${user}>`,
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
        text: `Recruitment log by ${interaction.client.user.username}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.editReply({
      content: `${targetUser.tag} has succesfully been recruited to ${team}!`,
      components: [],
    });
    await logChannel.send({ embeds: [logEmbed] });
    await appColl.deleteOne(query).catch(console.error);
  },
};
