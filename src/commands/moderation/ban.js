const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans the member provided.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member you'd like to ban.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason as to why this peasant should be banned.")
    )
    .addStringOption((option) =>
      option
        .setName("purgetime")
        .setDescription(
          "Past which messages should be deleted (in the format of 1s, 1m, 1h, 1d) Max 7 days"
        )
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

    const user = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") ?? "N/A";
    const guild = interaction.guild;
    const logChannel = client.channels.cache.get(config.logChannelID);
    let purgeTime = interaction.options.getString("purgetime") ?? "0s";
    let dmuser = "true";

    await interaction.deferReply({ ephemeral: true });

    if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      await interaction.editReply({
        content: `Invalid Permissions. I need to have the Ban Members permission in order to ban members :(`,
      });
      return;
    }

    //purgeTime validation check

    if (purgeTime.endsWith("s")) {
      purgeTime = purgeTime.slice(0, -1);
      if (containsOnlyDigits(purgeTime)) {
      } else {
        await interaction.editReply(
          `Invalid purge option format: Can only have 1 letter (at the end of the selection)`
        );
        return;
      }
    } else if (purgeTime.endsWith("m")) {
      purgeTime = purgeTime.slice(0, -1);
      if (containsOnlyDigits(purgeTime)) {
        purgeTime *= 60;
      } else {
        await interaction.editReply(
          `Invalid purge option format: Can only have 1 letter (at the end of the selection)`
        );
        return;
      }
    } else if (purgeTime.endsWith("h")) {
      purgeTime = purgeTime.slice(0, -1);
      if (containsOnlyDigits(purgeTime)) {
        purgeTime *= 60 * 60;
      } else {
        await interaction.editReply(
          `Invalid purge option format: Can only have 1 letter (at the end of the selection)`
        );
        return;
      }
    } else if (purgeTime.endsWith("d")) {
      purgeTime = purgeTime.slice(0, -1);
      if (containsOnlyDigits(purgeTime)) {
        purgeTime *= 24 * 60 * 60;
      } else {
        await interaction.editReply(
          `Invalid purge option format: Can only have 1 letter (at the end of the selection)`
        );
        return;
      }
    } else {
      await interaction.editReply(
        "Invalid purge option format: The selection must end in s (seconds), m (minutes), h (hours) or d (days)"
      );
      return;
    }

    purgeTime = parseInt(purgeTime);

    if (purgeTime > 604800) {
      // 7 * 24 * 60 * 60 = 604800
      await interaction.editReply(
        `Invalid purge option: Cannot be longer than 7 days.`
      );
      return;
    }

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(console.error);

    if (member.bannable) {
      try {
        await client.users.send(
          user.id,
          `You have been banned from ${interaction.guild.name}\nReason: ${reason}\nIf you get unbanned, this is a permanent server invite: ${config.permaInvite}`
        );
      } catch (error) {
        dmuser = "false";
        console.log("An error occurred. User's DMs are probably off.");
      } finally {
        // Ban Embed

        const logEmbed = new EmbedBuilder()
          .setAuthor({
            name: "Moderator Dicer",
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTitle("Ban Log")
          .setDescription(
            `User has been banned by **${interaction.user.tag}**.`
          )
          .addFields(
            {
              name: "Username",
              value: user.tag,
              inline: true,
            },
            {
              name: "  Mention",
              value: `  <@${user.id}>`,
              inline: true,
            },
            {
              name: "User ID",
              value: user.id,
              inline: true,
            },
            {
              name: "Banned by",
              value: interaction.user.tag,
              inline: false,
            },
            {
              name: "Reason",
              value: reason,
              inline: false,
            },
            {
              name: "Messaged User  ",
              value: dmuser,
              inline: true,
            },
            {
              name: "  Deleted messages",
              value: `Deleted all messages from this user in the past ${purgeTime} seconds.`,
              inline: true,
            }
          )
          .setColor(0xfd9323)
          .setFooter({
            text: `Ban Log by ${interaction.client.user.tag}`,
            iconURL: interaction.client.user.displayAvatarURL(),
          })
          .setTimestamp();

        // Embed
        await member
          .ban({
            deleteMessageSeconds: purgeTime,
            reason: reason,
          })
          .catch(console.error);
        await interaction.editReply({
          content: `**${user}** has been banned succesfully.`,
        });
        await logChannel.send({
          embeds: [logEmbed],
        });
      }
    } else {
      await interaction.editReply({
        content: `**${user.tag}** cannot be banned..`,
      });
    }
  },
};

function containsOnlyDigits(str) {
  return /^\d+$/.test(str);
}
