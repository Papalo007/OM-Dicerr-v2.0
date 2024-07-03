const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sack")
    .setDescription("Kick the provided player from OM or TM")
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The player you wish to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("team")
        .setDescription("The team that the member is currenty in.")
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

    await interaction.deferReply({ content: `Working on it...`, ephemeral: true });

    const targetUser = interaction.options.getUser("target");
    const user = interaction.options.getMember("target");
    const logChannel = client.channels.cache.get(config.logChannelID);
    const userId = targetUser.id;
    const member = interaction.member;
    const omRole = interaction.guild.roles.cache.get("1219879616546738236");
    const tmRole = interaction.guild.roles.cache.get("1243214533590384660");
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
      if (!user.roles.cache.some((role) => role.name === "OM Roster")) {
        await interaction.editReply({
          content: `This player is not in One More.`,
          ephemeral: true,
        });
        return;
      } else if (
        !member.roles.cache.some((role) => role.name === "OM Manager")
      ) {
      await interaction.editReply({
          content: `You are not authorised to recruit people for One More.`,
        });
        return;
      }
      await user.roles.remove(omRole).catch(console.error);

      if (announcementChannel) {
        announcementChannel.send({
          content: `<@&1245743215898919143> <@${userId}> has been removed from One More's roster.`,
        });
      }

      targetUser.send({
        content: `Unfortunately, you have been kicked from One More, however, you can still apply for a position in Two More. To do that, complete onboarding and notify a TM Manager, that you are looking to join the team.`,
      });
      team = "One More";
    } else if (team === "TM" || team === "Two More" || team === "tm") {
      if (!user.roles.cache.some((role) => role.name === "TM Roster")) {
      await interaction.editReply({
          content: `This player is not in Two More.`,
          ephemeral: true,
        });
        return;
      } else if (
        !member.roles.cache.some((role) => role.name === "TM Manager")
      ) {
      await interaction.editReply({
          content: `You are not authorised to recruit people for Two More.`,
        });
        return;
      }
      await user.roles.remove(tmRole).catch(console.error);

      if (announcementChannel) {
        announcementChannel.send({
          content: `<@&1245743215898919143> <@${userId}> has been removed from Two More's roster.`,
        });
      }

      targetUser.send({
        content: `You have been kicked from Two More.`,
      });
      team = "Two More";
    }

    const logEmbed = new EmbedBuilder()
      .setAuthor({
        name: "Moderator Dicerr",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTitle("Roster kick Log")
      .setDescription(`Roster kick log for ${team}`)
      .addFields(
        {
          name: "Kicked by",
          value: interaction.user.tag,
          inline: false,
        },
        {
          name: "Manager ID",
          value: interaction.user.id,
          inline: true,
        },
        {
          name: "Manager Mention",
          value: `<@${interaction.user.id}>`,
          inline: true,
        },
        {
          name: "Ex Player",
          value: targetUser.tag,
          inline: false,
        },
        {
          name: "Ex Player ID",
          value: userId,
          inline: true,
        },
        {
          name: "Ex Player Mention",
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
        text: "Roster kick log by OM Dicerr v2.0",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    logChannel.send({ embeds: [logEmbed] });
  },
};