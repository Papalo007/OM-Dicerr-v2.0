const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const Temp = require("../../schemas/temp");
const { databaseToken } = process.env;
const { MongoClient } = require("mongodb");
const Config = require("../../schemas/config");
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
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guildId });
    for (roleid of config.staffRoles) {
      if (interaction.member.roles.some((role) => role.id === roleid)) {
        return;
      }

      if (interaction.user !== interaction.options.getUser("target"))
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
    const warnSorDot = warnCount === 1 ? "." : "s.";

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
        text: `Warnings called by ${interaction.client.user.username}`,
      })
      .setTimestamp();

    const deleteWarn = new ButtonBuilder()
      .setCustomId("del-warn-button")
      .setLabel("Delete a warning")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(deleteWarn);

    if (interaction.user === user || warnCount === 0) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ embeds: [embed], components: [row] });

      const temp = await new Temp({
        _id: new mongoose.Types.ObjectId(),
        guildID: interaction.guild.id,
        tempValueOne: "delete-warning",
        tempValueTwo: user.id,
        tempValueThree: interaction.user.id,
      });
      await temp.save().catch(console.error);

      setTimeout(() => {
        const testDB = mongoClient.db("test");
        const tempColl = testDB.collection("temp");
        const query = { tempValueOne: "delete-warning", guildID: interaction.guild.id };
        tempColl.deleteOne(query);
        deleteWarn.setDisabled(true);
        if (interaction.user !== user) {
          const firstActionRow = new ActionRowBuilder().addComponents(
            deleteWarn
          );
          interaction.editReply({
            components: [firstActionRow],
          });
        }
        console.log("1 minute passed.");
      }, 60_000);
    }
  },
};
