const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sack")
    .setDescription("Kick the provided player from OM or TPN")
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
      return interaction.reply({
        content: `You haven't set up the proper channels yet! Do /config.`
      });
    }
    if (config.botCommandsChannel && client.channels.cache.get(config.botCommandsChannel) !== interaction.channel) {
      return interaction.reply({
        content: `You cannot use commands in this channel`,
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

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
      team.toLowerCase() !== "one more" &&
      team.toLowerCase() !== "typhoon" &&
      team.toLowerCase() !== "om" &&
      team.toLowerCase() !== "tpn"
    ) {
      await interaction.editReply({
        content: `${team} is not a valid team. Valid options are: One More, OM, Typhoon, TPN (Case doesn't matter).`,
      });
      return;
    } else if (team.toLowerCase() === "one more" || team.toLowerCase() === "om") {
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
          content: `You are not authorised to kick people from One More.`,
        });
        return;
      }
      await user.roles.remove(omRole).catch(console.error);

      if (announcementChannel) {
        await announcementChannel.send({
          content: `<@&1245743215898919143> <@${userId}> has been removed from One More's roster.`,
        });
      }

      await targetUser.send({
        content: `Unfortunately, you have been kicked from One More, however, you can still apply for a position in Typhoon. To do that, run the /apply command and notify a TPN Manager, that you are looking to join the team.`,
      });
      team = "One More";
    } else if (team.toLowerCase() === "typhoon" || team === "tpn") {
      if (!user.roles.cache.some((role) => role.name === "TPN Roster")) {
        await interaction.editReply({
          content: `This player is not in Typhoon.`,
          ephemeral: true,
        });
        return;
      } else if (
        !member.roles.cache.some((role) => role.name === "TPN Manager")
      ) {
        await interaction.editReply({
          content: `You are not authorised to kick people from Typhoon.`,
        });
        return;
      }
      await user.roles.remove(tmRole).catch(console.error);

      if (announcementChannel) {
        await announcementChannel.send({
          content: `<@&1245743215898919143> <@${userId}> has been removed from Typhoon's roster.`,
        });
      }

      await targetUser.send({
        content: `You have been kicked from Typhoon.`,
      });
      team = "Typhoon";
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
        text: `Roster kick log by ${interaction.client.user.username}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.editReply({
      content: `${targetUser.tag} has been succesfully kicked from ${team}.`,
    });
    await logChannel.send({ embeds: [logEmbed] });
  },
};
