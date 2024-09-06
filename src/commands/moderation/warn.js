const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Config = require("../../schemas/config");
const Warning = require("../../schemas/warn");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member.")
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member you would like to warn.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for this warning.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription(
          "Would you like to notify the user of this warning? (input yes or no). Default is yes."
        )
        .setRequired(false)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      return interaction.reply({
        content: `You haven't set up the proper channels yet! Do /setup.`,
      });
    }
    if(config.botCommandsChannel && !botCommandsChannel.includes(interaction.channel.id)) {
      return interaction.reply({
        content: `You cannot use commands in this channel`,
        ephemeral: true,
      })
    }

    if (
      !interaction.member.roles.cache.some((role) => role.name === "Staff") &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "Team Manager"
      )
    ) {
      await interaction.reply({
        content: `You do not have permission to use this command.`,
        ephemeral: true,
      });
      return;
    }

    const targetUser = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "N/S";
    let dmUser = interaction.options.getString("message") || "yes";
    const logChannel = client.channels.cache.get(config.logChannelID);

    await interaction.deferReply({ ephemeral: true });

    let date_time = new Date();

    let date = ("0" + date_time.getDate()).slice(-2);

    let month = ("0" + (date_time.getMonth() + 1)).slice(-2);

    let year = date_time.getFullYear();

    const datentime = date + "/" + month + "/" + year;

    if (dmUser.toLowerCase() !== "no" && dmUser.toLowerCase() !== "yes") {
      interaction.editReply({
        content: `Please input either "yes", "no" or nothing in the last field.`,
      });
      return;
    } else if (dmUser.toLowerCase() === "no") {
      dmUser = "false";
    } else {
      dmUser = "true";
      try {
        await targetUser.send({
          content: `You have been warned in ${interaction.guild.name}.\nReason: ${reason}.`,
        });
      } catch (error) {
        dmUser = "failed";
        console.log(error);
      }
    }

    const warning = new Warning({
      _id: new mongoose.Types.ObjectId(),
      guildID: interaction.guild.id,
      userID: targetUser.id,
      reason: reason,
      date: datentime,
    });
    await warning.save().catch(console.error);

    //embed
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Moderator Dicerr",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTitle("Warning Log")
      .addFields(
        {
          name: "Warned User",
          value: targetUser.tag,
          inline: true,
        },
        {
          name: "Warned User's ID",
          value: targetUser.id,
          inline: true,
        },
        {
          name: "Warned User Ping",
          value: `<@${targetUser.id}>`,
          inline: true,
        },
        {
          name: "Reason",
          value: reason,
          inline: false,
        },
        {
          name: "Warn issued by",
          value: interaction.user.tag,
          inline: true,
        },
        {
          name: "Warner's ID",
          value: interaction.user.id,
          inline: true,
        },
        {
          name: "Warner Ping",
          value: `<@${interaction.user.id}>`,
          inline: true,
        },
        {
          name: "Messaged User",
          value: dmUser,
          inline: false,
        }
      )
      .setColor(0xfd9323)
      .setFooter({
        text: `Warning issued to ${targetUser.tag}`,
        iconURL: targetUser.displayAvatarURL(),
      })
      .setTimestamp();
    //embed
    await logChannel.send({ embeds: [embed] });
    await interaction.editReply({
      content: `${targetUser.tag} has been warned.`,
    });
  },
};
