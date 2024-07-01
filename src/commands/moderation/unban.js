const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans the member provided.")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("The ID of the user you'd like to unban.")
        .setMinLength(17)
        .setMaxLength(19)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason as to why this peasant should be forgiven.")
    ),
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      interaction.reply({
        content: `You haven't set up the proper channels yet! Do /help.`,
      });
      return;
    }
    if (config.botCommandsChannel) {
      const channel = client.channels.cache.get(config.botCommandsChannel);
      if (channel !== interaction.channel) {
        interaction.reply({
          content: `You cannot use commands in this channel`,
          ephemeral: true,
        });
        return;
      }
    }

    const logChannel = client.channels.cache.get(config.logChannelID);
    const { options, guild } = interaction;
    const userId = await options.getString("target");
    const reason = (await options.getString("reason")) ?? "N/A";
    await interaction.reply({
      content: "Working on it...",
      ephemeral: true,
    });

    if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.editReply({
        content: `Invalid Permissions. I need to have the Ban Members permission in order to unban members :(`,
      });
    } else if (!isValidSnowflake(userId)) {
      return interaction.editReply({
        content: `${userId} is not a valid user ID.`,
      });
    }
    let ban = await guild.bans.fetch(userId);
    let user = await ban.user.fetch();

    //embed

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Moderator Dicer",
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle("Unban Log")
      .setDescription(`User has been unbanned by **${interaction.user.tag}**.`)
      .addFields(
        {
          name: "Username",
          value: user.tag,
          inline: true,
        },
        {
          name: "Mention",
          value: `<@${userId}>`,
          inline: true,
        },
        {
          name: "User ID",
          value: userId,
          inline: false,
        },
        {
          name: "Unbanned by",
          value: interaction.user.tag,
          inline: false,
        },
        {
          name: "Reason",
          value: reason,
          inline: false,
        }
      )
      .setColor(0xfd9323)
      .setFooter({
        text: "Ban log by OM Dicerr v1.0",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    //embed

    try {
      ban = await guild.bans.fetch(userId);
      user = await ban.user.fetch();

      await guild.members.unban(userId);

      await interaction.editReply({
        content: `**${user.tag}** has been unbanned.`,
      });

      logChannel.send({ embeds: [embed] });
    } catch (err) {
      if (err.name === "DiscordAPIError[10026]") {
        logChannel.send(`Unban failed: <@${userId}> is not banned.`);
        return await interaction.editReply({
          content: `This user is not banned :/`,
        });
      }
      if (err.name === "DiscordAPIError[10013]") {
        logChannel.send(`Unban failed: Unknown user`);
        return await interaction.editReply({
          content: `Unkown User. This probably happened because you didn't enter the correct ID.`,
        });
      } else {
        interaction.editReply({
          content: `An error occured while trying to unban this user.`,
        });
      }
      return console.log(err);
    }
  },
};

function isValidSnowflake(snowflake) {
  const snowflakeRegex = /^[0-9]{17,19}$/;
  return snowflakeRegex.test(snowflake);
}