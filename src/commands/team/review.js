const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");
const Config = require("../../schemas/config");
const App = require("../../schemas/application");
const Temp = require("../../schemas/temp");
const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");
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
  async execute(interaction, client) {
    await interaction.deferReply();
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      await interaction.editReply({
        content: `You haven't set up the proper channels yet! Do /config.`,
      });
      return;
    }

    const user = interaction.options.getUser("target");
    const temp = await new Temp({
      _id: new mongoose.Types.ObjectId(),
      tempValueOne: "app-review",
      tempValueTwo: user.id,
      tempValueThree: interaction.user.id,
    });
    await temp.save().catch(console.error);

    if (
      interaction.user !== user &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "TM Manager"
      ) &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "OM Manager"
      ) &&
      !interaction.member.roles.cache.some((role) => role.name === "Staff") &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "Team Manager"
      )
    ) {
      await interaction.editReply({
        content: `You are not authorised to view applications other than your own.`,
        ephemeral: true,
      });
      return;
    }

    const app = await App.findOne({ userID: user.id });
    if (!app) {
      await interaction.editReply({
        content: `This person hasn't submitted an application (well it doesn't exist in the database idk if they have)`,
      });
      return;
    }

    const tracker = app.tracker;
    const roles = app.roles;
    const agents = app.agents;
    const warmup = app.warmup || "N/S";
    const notes = app.notes || "None.";
    const moderatorNotes = app.moderatorNotes || "None.";
    const missedMatches = app.missedMatches || 0;
    let embed;

    if (
      interaction.user === user &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "TM Manager"
      ) &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "OM Manager"
      ) &&
      !interaction.member.roles.cache.some((role) => role.name === "Staff") &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "Team Manager"
      )
    ) {
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
            value: "Warn system has not been created yet...",
            inline: true,
          }
        )
        .setColor("#00b0f4")
        .setFooter({
          text: `Application created by ${user.tag}`,
          iconURL: user.displayAvatarURL(),
        })
        .setTimestamp();
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
            value: "Warn system has not been created yet...",
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

    if (
      interaction.user === user &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "TM Manager"
      ) &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "OM Manager"
      ) &&
      !interaction.member.roles.cache.some((role) => role.name === "Staff") &&
      !interaction.member.roles.cache.some(
        (role) => role.name === "Team Manager"
      )
    ) {
      const firstActionRow = new ActionRowBuilder().addComponents(
        deleteApplication
      );
      await interaction.editReply({
        embeds: [embed],
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
      await interaction.editReply({
        embeds: [embed],
        components: [firstActionRow, secondActionRow],
      });
    }

    const mongoClient = new MongoClient(databaseToken, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
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
      if (
        interaction.user === user &&
        !interaction.member.roles.cache.some(
          (role) => role.name === "TM Manager"
        ) &&
        !interaction.member.roles.cache.some(
          (role) => role.name === "OM Manager"
        ) &&
        !interaction.member.roles.cache.some((role) => role.name === "Staff") &&
        !interaction.member.roles.cache.some(
          (role) => role.name === "Team Manager"
        )
      ) {
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
