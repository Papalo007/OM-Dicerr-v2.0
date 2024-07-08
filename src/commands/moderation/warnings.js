const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const Config = require("../../schemas/config");
const Temp = require("../../schemas/temp");
const { databaseToken } = process.env;
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Returns the warnings this member has received.")
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member whose warnings you'd like to see.")
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

    if (
      !interaction.member.roles.cache.some((role) => role.name === "Staff") &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "Team Manager"
      ) &&
      !interaction.user !== interaction.options.getUser("target")
    ) {
      await interaction.reply({
        content: `You do not have permission to use this command.`,
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply();

    const user = interaction.options.getUser("target");
    const mongoClient = new MongoClient(databaseToken);
    const testDB = mongoClient.db("test");
    const warnColl = testDB.collection("warnings");
    const query = { guildID: interaction.guild.id, userID: user.id };
    const options = {
      sort: { datentime: -1 },
      projection: { _id: 0, guildID: 0, userID: 0 },
    };

    const cursor = warnColl.find(query, options);
    const warnCount = await warnColl.countDocuments(query);
    let warnsTogether;
    let warnSorDot;
    if (warnCount === 1) {
      warnSorDot = ".";
    } else {
      warnSorDot = "s.";
    }

    for await (const doc of cursor) {
      if (!warnsTogether) {
        warnsTogether = doc.reason + " - " + doc.date + "\n";
      } else {
        warnsTogether =
          warnsTogether + "\n" + doc.reason + " - " + doc.date + "\n";
      }
    }

    warnsTogether = warnsTogether || "None.";

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Moderator Dicerr",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTitle(`${user.tag}'s warnings`)
      .setDescription(`This user has ${warnCount} warning${warnSorDot}`)
      .addFields({
        name: "Warnings",
        value: warnsTogether.toString(),
        inline: false,
      })
      .setColor(0xfd9323)
      .setFooter({
        text: "Warnings called by OM Dicerr v2.0",
      })
      .setTimestamp();

    const deleteWarn = new ButtonBuilder()
      .setCustomId("del-warn-button")
      .setLabel("Delete a warning")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(deleteWarn);

    if (interaction.user === user) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ embeds: [embed], components: [row] });

      const temp = await new Temp({
        _id: new mongoose.Types.ObjectId(),
        tempValueOne: "delete-warning",
        tempValueTwo: user.id,
        tempValueThree: interaction.user.id,
      });
      await temp.save().catch(console.error);

      setTimeout(() => {
        const testDB = mongoClient.db("test");
        const tempColl = testDB.collection("temp");
        const query = { tempValueOne: "delete-warning" };
        tempColl.deleteOne(query);
        deleteWarn.setDisabled(true);
        if (interaction.user !== user) {
          const firstActionRow = new ActionRowBuilder().addComponents(deleteWarn);
          interaction.editReply({
            components: [firstActionRow],
          });
        }
        console.log("1 minute passed.");
      }, 60_000);
    }
  },
};