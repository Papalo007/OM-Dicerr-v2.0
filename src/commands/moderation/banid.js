const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banid")
    .setDescription("Bans the user with the ID provided.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("The ID of the user you'd like to ban.")
        .setMinLength(17)
        .setMaxLength(19)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription(
          "The reason for which this peasant deserves to be banned."
        )
    )
    .addStringOption((option) =>
      option
        .setName("purgetime")
        .setDescription(
          "Past which messages should be deleted (in the format of 1s, 1m, 1h, 1d) Max 7 days"
        )
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const logChannel = client.channels.cache.get("1219986404889722932");
    const { options, guild } = interaction;

    const userId = await options.getString("target");
    const reason = (await options.getString("reason")) ?? "N/A";
    let purgeTime = interaction.options.getString("purgetime") ?? "0s";
    let dmuser = "true";
    let validPurgeTime = true;

    await interaction.deferReply({ ephemeral: true });

    if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.editReply({
        content: `Invalid Permissions. I need to have the Ban Members permission in order to ban members :(`,
      });
    }

    //purgeTime validation check

    if (purgeTime.endsWith("s")) {
      purgeTime = purgeTime.slice(0, -1);
      if (containsOnlyDigits(purgeTime)) {
      } else {
        validPurgeTime = false;
        return interaction.editReply(
          `Invalid purge option format: Can only have 1 letter (at the end of the selection)`
        );
      }
    } else if (purgeTime.endsWith("m")) {
      purgeTime = purgeTime.slice(0, -1);
      if (containsOnlyDigits(purgeTime)) {
        purgeTime *= 60;
      } else {
        validPurgeTime = false;
        return interaction.editReply(
          `Invalid purge option format: Can only have 1 letter (at the end of the selection)`
        );
      }
    } else if (purgeTime.endsWith("h")) {
      purgeTime = purgeTime.slice(0, -1);
      if (containsOnlyDigits(purgeTime)) {
        purgeTime *= 60 * 60;
      } else {
        validPurgeTime = false;
        return interaction.editReply(
          `Invalid purge option format: Can only have 1 letter (at the end of the selection)`
        );
      }
    } else if (purgeTime.endsWith("d")) {
      purgeTime = purgeTime.slice(0, -1);
      if (containsOnlyDigits(purgeTime)) {
        purgeTime *= 24 * 60 * 60;
      } else {
        validPurgeTime = false;
        return interaction.editReply(
          `Invalid purge option format: Can only have 1 letter (at the end of the selection)`
        );
      }
    } else {
      validPurgeTime = false;
      await interaction.editReply(
        "Invalid purge option format: The selection must end in s (seconds), m (minutes), h (hours) or d (days)"
      );
    }

    purgeTime = parseInt(purgeTime);

    if (purgeTime > 604800) {
      // 7 * 24 * 60 * 60 = 604800
      validPurgeTime = false;
      return interaction.editReply(
        `Invalid purge option: Cannot be longer than 7 days.`
      );
    }
    if (!validPurgeTime) return;

    if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.editReply({
        content: `Invalid Permissions. I need to have the Ban Members permission in order to ban members :(`,
      });
    } else if (!isValidSnowflake(userId)) {
      return interaction.editReply({
        content: `${userId} is not a valid user ID.`,
      });
    }

    try {
      await guild.bans.fetch(userId);
      return interaction.editReply({
        content: `<@${userId}> is already banned`,
      });
    } catch (error) {}

    try {
      await client.users.send(
        userId,
        `You have been banned from ${interaction.guild.name}\nReason: ${reason}\nIf you get unbanned, this is a permanent server invite: https://discord.com/invite/n7vWKdcJKd`
      );
    } catch (error) {
      dmuser = "false";
      console.log("An error occurred. User's DMs are probably off.");
    } finally {
      //embed

      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: "Moderator Dicer",
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle("Ban Log")
        .setDescription(`User has been banned by **${interaction.user.tag}**.`)
        .addFields(
          {
            name: "  Mention",
            value: `  <@${userId}>`,
            inline: true,
          },
          {
            name: "User ID",
            value: userId,
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
          text: `Ban log by ${interaction.client.user.username}`,
          iconURL: "https://slate.dan.onl/slate.png",
        })
        .setTimestamp();

      //embed

      await guild.members.ban(userId).catch(console.error);
      await interaction.editReply({
        content: `**<@${userId}>** has been banned succesfully. Reason: ${reason}`,
      });
      await logChannel.send({
        embeds: [logEmbed],
      });
    }
  },
};

function isValidSnowflake(snowflake) {
  const snowflakeRegex = /^[0-9]{17,19}$/;
  return snowflakeRegex.test(snowflake);
}

function containsOnlyDigits(str) {
  return /^\d+$/.test(str);
}
