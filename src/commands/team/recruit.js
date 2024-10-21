const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;
const Config = require("../../schemas/config");

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
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("target");
    const user = interaction.options.getMember("target");
    const logChannel = client.channels.cache.get(config.logChannel);
    const userId = targetUser.id;
    const member = interaction.member;
    const appRole = interaction.guild.roles.cache.get(config.applicantRole);
    const mongoClient = new MongoClient(databaseToken);

    const myDB = mongoClient.db("test");
    const appColl = myDB.collection("applications");
    const query = { userID: userId };

    const announcementChannel = client.channels.cache.get(
      config.rosterChangesChannel
    );
    let teamIndex;
    let done;
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
      if (user.roles.cache.some((role) => role.id === config.teamRosterRoles[teamIndex])) {
        return await interaction.editReply({
          content: `This player is already in ${team}.`,
          ephemeral: true,
        });
      }
      if (!member.roles.cache.some((role) => role.id === config.teamManagerRoles[teamIndex])) {
        return await interaction.editReply({
          content: `You are not authorised to recruit people for ${team}.`,
        });
      } else {
        await user.roles.add(interaction.guild.roles.cache.get(config.teamRosterRoles[teamIndex])).catch(console.error);
        await user.roles.remove(appRole).catch(console.error);

        if (announcementChannel) {
          await announcementChannel.send({
            content: `<@&1245743215898919143> <@${userId}> has been recruited to ${team}!`,
          });
        }
        try {
          await targetUser.send({
            content: `Congratulations, you have been recruited to One More!`,
          });
        } catch (error) {
          console.log(error);
          if (error.name === "DiscordAPIError[50007]") {
            await interaction.editReply({
              content: `This person has DMs disabled, so I couldn't DM them.`,
            });
          }
        }
      }
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
        text: `Recruitment log by ${interaction.client.user.username}`,
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
