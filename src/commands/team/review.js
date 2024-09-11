const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");
const App = require("../../schemas/application");
const Temp = require("../../schemas/temp");
const Link = require("../../schemas/link");
const Config = require("../../schemas/config");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("review")
    .setDescription("Review the application of a player")
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member whose application you'd like to review.")
        .setRequired(true)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    let done = false;
    await interaction.deferReply();

    const config = await Config.findOne({ guildID: interaction.guild.id });

    const mongoClient = new MongoClient(databaseToken);

    const user = interaction.options.getUser("target");

    if (interaction.user !== user) {
      for (roleid of config.scoutRoles) {
        if (interaction.member.roles.cache.some((role) => role.id === roleid)) {
          done = true;
          break;
        }
      }
      if (!done)
        return await interaction.editReply({
          content: `You are not authorised to view applications other than your own.`,
          ephemeral: true,
        });
    }

    const app = await App.findOne({ userID: user.id });
    if (!app) {
      await interaction.editReply({
        content: `This person hasn't submitted an application (well it doesn't exist in the database idk if they have)`,
      });
      return;
    }

    let tracker;
    const linkin = await Link.findOne({ userID: user.id });
    if (linkin) {
      const targetInHex = linkin.riotID
        .replace(/#/g, "%23")
        .replace(/ /g, "%20");
      tracker = `https://tracker.gg/valorant/profile/riot/${targetInHex}/overview`;
    } else {
      tracker = app.tracker;
    }

    const roles = app.roles;
    const agents = app.agents;
    const warmup = app.warmup || "N/S";
    const notes = app.notes || "None.";
    const moderatorNotes = app.moderatorNotes || "None.";
    const missedMatches = app.missedMatches || 0;
    let embed;
    const warnDB = mongoClient.db("test");
    const warnColl = warnDB.collection("warnings");
    const query = { guildID: interaction.guild.id, userID: user.id };

    const warnings = await warnColl.countDocuments(query);

    for (roleid of config.scoutRoles) {
      if (interaction.member.roles.cache.some((role) => role.id === roleid)) {
        done = true;
        break;
      } else {
        done = false;
      }
    }
    const missedMatchButton = new ButtonBuilder()
      .setCustomId("missed-match-button")
      .setLabel("Add a missed match")
      .setStyle(ButtonStyle.Primary);

    const removeMissedMatchButton = new ButtonBuilder()
      .setCustomId("rem-missed-match-button")
      .setLabel("Remove a missed match")
      .setStyle(ButtonStyle.Danger);

    const moderatorNotesButton = new ButtonBuilder()
      .setCustomId("mod-notes-button")
      .setLabel("Add notes")
      .setStyle(ButtonStyle.Primary);

    const recruitButton = new ButtonBuilder()
      .setCustomId("recruit-button")
      .setLabel("Recruit")
      .setStyle(ButtonStyle.Success);

    const deleteApplication = new ButtonBuilder()
      .setCustomId("del-app-button")
      .setLabel("Delete Application")
      .setStyle(ButtonStyle.Danger);
    if (interaction.user === user && !done) {
      embed = new EmbedBuilder()
        .setAuthor({
          name: "Moderator Dicerr",
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTitle(`${user.username}'s Application`)
        .setDescription(`Application Details`)
        .addFields(
          {
            name: "Tracker Link",
            value: tracker,
            inline: false,
          },
          {
            name: "Roles",
            value: roles,
            inline: true,
          },
          {
            name: "Agents",
            value: agents,
            inline: true,
          },
          {
            name: "Warmup routine",
            value: warmup,
            inline: false,
          },
          {
            name: "Notes",
            value: notes,
            inline: false,
          },
          {
            name: "Missed Matches",
            value: missedMatches.toString(),
            inline: true,
          },
          {
            name: "Warnings",
            value: warnings.toString(),
            inline: true,
          }
        )
        .setColor("#00b0f4")
        .setFooter({
          text: `Application created by ${user.tag}`,
          iconURL: user.displayAvatarURL(),
        })
        .setTimestamp();

      const firstActionRow = new ActionRowBuilder().addComponents(
        deleteApplication
      );
      await interaction.editReply({
        embeds: [embed],
        components: [firstActionRow],
      });
    } else {
      embed = new EmbedBuilder()
        .setAuthor({
          name: "Moderator Dicerr",
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTitle(`${user.username}'s Application`)
        .setDescription(`Application Details`)
        .addFields(
          {
            name: "Tracker Link",
            value: tracker,
            inline: false,
          },
          {
            name: "Roles",
            value: roles,
            inline: true,
          },
          {
            name: "Agents",
            value: agents,
            inline: true,
          },
          {
            name: "Warmup routine",
            value: warmup,
            inline: false,
          },
          {
            name: "Notes",
            value: notes,
            inline: false,
          },
          {
            name: "Missed Matches",
            value: missedMatches.toString(),
            inline: true,
          },
          {
            name: "Warnings",
            value: warnings.toString(),
            inline: true,
          },
          {
            name: "Moderator Notes",
            value: moderatorNotes,
            inline: false,
          }
        )
        .setColor("#00b0f4")
        .setFooter({
          text: `Application created by ${user.tag}`,
          iconURL: user.displayAvatarURL(),
        })
        .setTimestamp();

      const firstActionRow = new ActionRowBuilder().addComponents(
        moderatorNotesButton,
        recruitButton,
        deleteApplication
      );
      const secondActionRow = new ActionRowBuilder().addComponents(
        missedMatchButton,
        removeMissedMatchButton
      );
      await interaction.editReply({
        embeds: [embed],
        components: [firstActionRow, secondActionRow],
      });
    }

    const temp = await new Temp({
      _id: new mongoose.Types.ObjectId(),
      tempValueOne: "app-review",
      tempValueTwo: user.id,
      tempValueThree: interaction.user.id,
    });
    await temp.save().catch(console.error);

    setTimeout(() => {
      const myDB = mongoClient.db("test");
      const myColl = myDB.collection("temp");
      const query = { tempValueOne: "app-review" };
      myColl.deleteOne(query);
      missedMatchButton.setDisabled(true);
      removeMissedMatchButton.setDisabled(true);
      moderatorNotesButton.setDisabled(true);
      recruitButton.setDisabled(true);
      deleteApplication.setDisabled(true);
      if (interaction.user === user && !done) {
        const firstActionRow = new ActionRowBuilder().addComponents(
          deleteApplication
        );
        interaction.editReply({
          components: [firstActionRow],
        });
      } else {
        const firstActionRow = new ActionRowBuilder().addComponents(
          moderatorNotesButton,
          recruitButton,
          deleteApplication
        );
        const secondActionRow = new ActionRowBuilder().addComponents(
          missedMatchButton,
          removeMissedMatchButton
        );
        interaction.editReply({
          components: [firstActionRow, secondActionRow],
        });
      }
      console.log("1 minute passed.");
    }, 60_000);
  },
};
