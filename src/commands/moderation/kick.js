const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks the member provided.")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member you'd like to kick.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for kicking the member.")
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      await interaction.editReply({
        content: `You haven't set up the proper channels yet! Do /config.`,
      });
      return;
    }
    if (config.botCommandsChannel) {
      const channel = client.channels.cache.get(config.botCommandsChannel);
      if (channel !== interaction.channel) {
        await interaction.editReply({
          content: `You cannot use commands in this channel`,
          ephemeral: true,
        });
        return;
      }
    }

    const user = interaction.options.getUser("target");
    let dmuser = "false";
    let reason = interaction.options.getString("reason");
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(console.error);

    if (!reason) reason = "N/A.";
    const logChannel = client.channels.cache.get(config.logChannelID);

    if (
      !interaction.guild.members.me.permissions.has(
        PermissionFlagsBits.KickMembers
      )
    ) {
      return interaction.editReply({
        content: `Invalid Permissions. I need to have the Kick Members permission in order to kick members :(`,
      });
    }

    if (member.kickable) {
      try {
        await user.send({
          content: `You have been kicked from **${interaction.guild.name}**\nReason: ${reason}`,
        });
        dmuser = "true";
      } catch (error) {
        console.error(error);
      }

      // Log Embed

      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: "Moderator Dicer",
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle("Kick Log")
        .setDescription(`User has been kicked by **${interaction.user.tag}**.`)
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
            name: "Kicked by",
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
          }
        )
        .setColor(0xfd9323)
        .setFooter({
          text: `Kick log by ${interaction.client.user.username}`,
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTimestamp();

      // Embed

      await logChannel.send({ embeds: [logEmbed] });
      await member.kick(reason).catch(console.error);
      if (interaction.fetchReply()) {
        await interaction.editReply({
          content: `**${user.tag}** has been kicked. Reason: ${reason}`,
        });
      } else {
        await interaction.reply({
          content: `**${user.tag}** has been kicked. Reason: ${reason}`,
        });
      }
    } else {
      await interaction.editReply({
        content: `**${user.tag}** cannot be kicked..`,
      });
    }
  },
};
