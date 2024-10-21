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
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    let done = false;
    let teamIndex;

    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("target");
    const user = interaction.options.getMember("target");
    const logChannel = interaction.guild.channels.cache.get(config.logChannel);
    const userId = targetUser.id;
    const member = interaction.member;
    const announcementChannel = interaction.guild.channels.cache.get(
      config.rosterChangesChannel
    );

    let team = interaction.options.getString("team");

    for (let i = 0; i < config.teams.length; i++) {
      if (
        team.toLowerCase() === config.teams[i].toLowerCase() ||
        team.toLowerCase() === config.teamShortCodes[i].toLowerCase()
      ) {
        done = true;
        team = config.teams[i];
        teamIndex = i;
        break;
      }
    }

    if (!done) {
      return await interaction.editReply({
        content: `${team} is not a valid team. Valid options are the team names and short codes that were inputted during setup.`,
      });
    } else {
      if (
        !user.roles.cache.some(
          (role) => role.id === config.teamRosterRoles[teamIndex]
        )
      ) {
        return await interaction.editReply({
          content: `This player is not in ${team}.`,
          ephemeral: true,
        });
      } else if (
        !member.roles.cache.some(
          (role) => role.id === config.teamManagerRoles[teamIndex]
        )
      ) {
        return await interaction.editReply({
          content: `You are not authorised to kick people from ${team}.`,
        });
      }
      await user.roles.remove(interaction.guild.roles.cache.get(config.teamRosterRoles[teamIndex])).catch(console.error);

      if (announcementChannel) {
        await announcementChannel.send({
          content: `<@${userId}> has been removed from One More's roster.`,
        });
      }

      await targetUser.send({
        content: `Unfortunately, you have been kicked from ${team}, however, you can most likely still apply for a position in a team at a later time. If a spot opens up, apply using the /apply command.`,
      });
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
