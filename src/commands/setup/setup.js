const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const Config = require("../../schemas/config");
const mongoose = require("mongoose");
const { databaseToken } = process.env;
const { MongoClient } = require("mongodb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the bot!")
    .setDMPermission(false),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    await interaction.reply({
      content: `If you want to quit the setup stage, send the message "Exit". This will reset the setup and you can start over.
If at any point you want to go to the previous question to answer it again, send the message "Back". With this you can change your answer in a previous question. After 20 minutes, the program will exit if the setup process is not done.`,
    });

    let done;

    const questions = [
      "Do you want to enable the Teams module? Answer with Yes or No.",
      "Please enter the team's name, along with their short codes (One More -> OM). If there are multiple teams, use the following format: Team1 name Team1-short-code, Team2 name Team2-short-code etc. (e.g. One More OM, Typhoon TPN, Two More TM)",
      "What is the ID of the Team's manager role? (right click the role -> Copy Role ID) A team manager can recruit and kick players from the team's roster. If there are multiple teams, seperate the IDs using a comma (The order should be the same as the one you used in the previous step).",
      "Which roles (send the role ID of them) should be able to review someone's application? These can add notes, delete, add missed matches and remove missed matches from the application, but only the team manager roles can recruit someone.",
      "What is the ID of the Roster-Changes channel? This is the channel where changes in a team's roster will be announced. (if you don't want to add one, send the message \"None\".",
      'What is the Role ID of the applicant role? (Whoever applies will get that role). If you don\'t want one, reply with "None" (I, the Bot, recommend you add an applicant role as it is easier to see who has applied).',
      "What is the ID of the staff role? If there are multiple, seperate them using a comma. These roles will be able to warn members, purge messages and check the warnings of a user.",
      "What is the ID of the log channel? This is going to be the channel where all logs will be sent (application submitted, warned/kicked/banned/unbanned/recruited/sacked a user etc.)",
      'What is the ID of the bot commands channel/s? This is the channel/s where bot commands will work, any other channel will not recognize commands. If there are multiple channels you would like to add, seperate them using a comma. If you want to use commands in all channels, reply with "None".',
    ];

    let answers = [];

    const exitCollector = interaction.channel.createMessageCollector({
      //conditions
      filter: (message) =>
        message.content.toLowerCase() === "exit" &&
        message.channelId === interaction.channel.id &&
        message.author === interaction.user,
      time: 20 * 60_000,
    });

    const backCollector = interaction.channel.createMessageCollector({
      filter: (message) =>
        message.content.toLowerCase() === "back" &&
        message.channelId === interaction.channel.id &&
        message.author === interaction.user,
      time: 20 * 60_000,
    });

    const answerCollector = interaction.channel.createMessageCollector({
      filter: (message) =>
        message.content.toLowerCase() !== "back" &&
        message.content.toLowerCase() !== "exit" &&
        message.channelId === interaction.channel.id &&
        message.author === interaction.user,
      time: 20 * 60_000,
    });

    let index = 0;
    let exited = false;

    exitCollector.on("collect", (message) => {
      message.reply("Exited.");
      exited = true;
      backCollector.stop();
      answerCollector.stop();
      exitCollector.stop();
      return;
    });

    backCollector.on("collect", async (message) => {
      if (index === 0) {
        message.reply(
          'This is the first question. You can\'t go back. If you want to cancel setup, say "exit".'
        );
        interaction.channel.send(`${questions[index]} ${index + 1}/9`);
        return;
      } else if (index === 6 && answers[0].toLowerCase() === "no") {
        index = 1;
      }
      answers.pop();
      index--;
      await interaction.channel.send(`${questions[index]} ${index + 1}/9`);
    });

    await interaction.channel.send(`${questions[index]} ${index + 1}/9`);
    answerCollector.on("collect", async (answer) => {
      if (checkValid(answer.content, index, interaction, answers)) {
        if (index === 0 && answer.content.toLowerCase() === "no") {
          index = 5;
        }
        index++;
        answers.push(answer.content);
        if (index === 9) {
          done = true;
          const confirmButton = new ButtonBuilder()
            .setCustomId("confirm")
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Success);

          const cancelButton = new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger);

          const firstActionRow = new ActionRowBuilder().addComponents(
            confirmButton,
            cancelButton
          );

          let summary;
          const teamModule = answers[0].toLowerCase() === "no" ? false : true;
          const existingConfig = await Config.findOne({
            guildID: interaction.guild.id,
          });
          switch (answers.length) {
            case 4:
              const staffRoles4 = answers[1]
                .split(",")
                .map((str) => str.trim());
              const logChan4 = answers[2];
              const botCommandsChannels4 = answers[3]
                .split(",")
                .map((str) => str.trim());

              summary = "Team Module: Disabled\nStaff roles: ";
              for (roleid of staffRoles4) {
                summary =
                  summary +
                  `<@& this is so that no ping just delete this when done lel ${roleid}>, `;
              }
              summary =
                summary +
                `\nLogs Channel: <#${logChan4}>\nCommands enabled in the following channels: `;
              for (channelID of botCommandsChannels4) {
                if (channelID.toLowerCase() === "none") {
                  summary = summary + "All";
                } else {
                  summary = summary + `<#${channelID}>, `;
                }
              }

              const response = await interaction.channel.send({
                content: `Based on your answers, this is the configuration for this server:\n${summary}\nWould you like to confirm or cancel this configuration profile? This *can* be changed later.`,
                components: [firstActionRow],
                fetchReply: true,
              });

              answerCollector.stop();

              const confirmCollectorFilter = (i) =>
                i.user.id === interaction.user.id;
              const confirmationCollector =
                await response.awaitMessageComponent({
                  filter: confirmCollectorFilter,
                  time: 2 * 60_000,
                });

              if (confirmationCollector.customId === "confirm") {
                if (existingConfig) {
                  const mongoClient = new MongoClient(databaseToken);
                  const myDB = mongoClient.db("test");
                  const coll = myDB.collection("configs");
                  const filter = { guildID: interaction.guild.id };
                  const updateConfig = {
                    $set: {
                      teamModule: teamModule,
                      staffRoles: staffRoles4,
                      logChannel: logChan4,
                      botCommandsChannel: botCommandsChannels4,
                    },
                  };
                  await coll.updateOne(filter, updateConfig);
                  await interaction.followUp("Configuration profile updated!");
                  return;
                } else {
                  const smallConfig = new Config({
                    _id: new mongoose.Types.ObjectId(),
                    guildID: interaction.guild.id,
                    teamModule: teamModule,
                    staffRoles: staffRoles4,
                    logChannel: logChan4,
                    botCommandsChannel: botCommandsChannels4,
                  });

                  await smallConfig.save().catch(console.error);
                  await interaction.followUp("Configuration profile saved!");
                  return;
                }
              } else if (confirmationCollector.customId === "cancel") {
                await confirmationCollector.update({
                  content: "Action cancelled",
                  components: [],
                });
                return;
              }

            case 9:
              const staffRoles = answers[6].split(",").map((str) => str.trim());
              const logChan = answers[7];
              const botCommandsChannels = answers[8]
                .split(",")
                .map((str) => str.trim());

              const teamsAndShortCodes = answers[1]
                .split(",")
                .map((str) => str.trim());
              let teams = [];
              let shortCodes = [];
              for (team of teamsAndShortCodes) {
                teams.push(team.substring(0, team.lastIndexOf(" ")));
                shortCodes.push(team.substring(team.lastIndexOf(" ") + 1));
              }
              const teamManagerRoles = answers[2]
                .split(",")
                .map((str) => str.trim());
              const scoutRoles = answers[3].split(",").map((str) => str.trim());
              const rosChangesChannel = answers[4];
              const appRole = answers[5];

              //Summary

              summary = "Team Module: Enabled\nTeams: ";
              for (team of teams) {
                summary = summary + `${team}, `;
              }
              summary = summary + "\nTeams' Short Codes (order is the same): ";
              for (code of shortCodes) {
                summary = summary + `${code}, `;
              }
              summary = summary + "\nTeam Manager roles (order is the same): ";
              for (roleid of teamManagerRoles) {
                summary =
                  summary +
                  `<@& this is so no ping remove this hehe ping blocker ${roleid}>, `;
              }
              summary =
                summary +
                `\nScout Roles (roles that can review applications): `;
              for (scoutrole of scoutRoles) {
                summary = summary + `<@& ping blocker ${scoutrole}>, `;
              }
              summary =
                summary +
                `\nRoster Chages Channel: <#${rosChangesChannel}>\nApplicant Role: <@& ping blocker ${appRole}>\nStaff Roles: `;
              for (role of staffRoles) {
                summary = summary + `<@& ping blocker ${role}>, `;
              }
              summary =
                summary +
                `\nLog Channel: <#${logChan}>\nCommands enabled in the following channels: `;
              for (channelID of botCommandsChannels) {
                if (channelID.toLowerCase() === "none") {
                  summary = summary + "All";
                } else {
                  summary = summary + `<#${channelID}>, `;
                }
              }

              //summary done

              const response2 = await interaction.channel.send({
                content: `Based on your answers, this is the configuration for this server:\n${summary}\nWould you like to confirm or cancel this configuration profile? This *can* be changed later.`,
                components: [firstActionRow],
                fetchReply: true,
              });

              answerCollector.stop();

              const confirmCollectorFilter1 = (i) =>
                i.user.id === interaction.user.id;
              const confirmationCollector2 =
                await response2.awaitMessageComponent({
                  filter: confirmCollectorFilter1,
                  time: 2 * 60_000,
                });

              if (confirmationCollector2.customId === "confirm") {
                if (existingConfig) {
                  const mongoClient = new MongoClient(databaseToken);
                  const myDB = mongoClient.db("test");
                  const coll = myDB.collection("configs");
                  const filter = { guildID: interaction.guild.id };
                  const updateConfig = {
                    $set: {
                      teamModule: teamModule,
                      teams: teams,
                      teamShortCodes: shortCodes,
                      teamManagerRoles: teamManagerRoles,
                      scoutRoles: scoutRoles,
                      rosterChangesChannel: rosChangesChannel,
                      applicantRole: appRole,
                      staffRoles: staffRoles,
                      logChannel: logChan,
                      botCommandsChannel: botCommandsChannels,
                    },
                  };
                  await coll.updateOne(filter, updateConfig);
                  await interaction.followUp("Configuration profile updated!");
                  return;
                } else {
                  const config = new Config({
                    _id: new mongoose.Types.ObjectId(),
                    guildID: interaction.guild.id,
                    teamModule: teamModule,
                    teams: teams,
                    teamShortCodes: shortCodes,
                    teamManagerRoles: teamManagerRoles,
                    scoutRoles: scoutRoles,
                    rosterChangesChannel: rosChangesChannel,
                    applicantRole: appRole,
                    staffRoles: staffRoles,
                    logChannel: logChan,
                    botCommandsChannel: botCommandsChannels,
                  });
                  config.save().catch(console.error);
                }
              } else if (confirmationCollector2.customId === "cancel") {
                await confirmationCollector2.update({
                  content: "Action cancelled",
                  components: [],
                });
                return;
              }

            //TODO: Look for a config with the same guildID in the db and if there is, update it.
          }
        }
        interaction.channel.send(`${questions[index]} ${index + 1}/9`);
      } else {
        answer.reply("That is not a valid answer.\n");
        interaction.channel.send(`${questions[index]} ${index + 1}/9`);
      }
    });

    exitCollector.on("end", () => {
      if (!done && !exited) {
        interaction.channel.send(
          "20 Minutes passed without finishing setup. Exiting..."
        );
      }
    });

    if (exited) return;
  },
};

function checkValid(answer, index, interaction, answers) {
  switch (index) {
    case 0:
      return answer.toLowerCase() === "yes" || answer.toLowerCase() === "no";
    case 1:
      if (answer.includes(",")) {
        const splitStrings = answer.split(",").map((str) => str.trim());
        return splitStrings.every((str) => str.includes(" "));
      } else {
        return answer.includes(" ");
      }
    case 2:
      if (hasSameAmountOfChar(answer, answers[1], ",")) {
        if (answer.includes(",")) {
          const splitStrings = answer.split(",").map((str) => str.trim());
          for (roleid of splitStrings) {
            if (!interaction.guild.roles.cache.get(roleid)) {
              return false;
            }
          }
          return true;
        } else {
          return interaction.guild.roles.cache.get(answer) ? true : false;
        }
      } else {
        return false;
      }
    case 3:
      if (answer.includes(",")) {
        const splitStrings = answer.split(",").map((str) => str.trim());
        for (roleid of splitStrings) {
          if (!interaction.guild.roles.cache.get(roleid)) {
            return false;
          }
        }
        return true;
      } else {
        return interaction.guild.roles.cache.get(answer) ? true : false;
      }
    case 4:
      if (
        answer.toLowerCase().includes("none") ||
        interaction.guild.channels.cache.get(answer)
      ) {
        if (interaction.guild.channels.cache.get(answer).type === 0 ||interaction.guild.channels.cache.get(answer).type === 5) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    case 5:
      return answer.toLowerCase().includes("none") ||
        interaction.guild.roles.cache.get(answer)
        ? true
        : false;
    case 6:
      if (answer.includes(",")) {
        const splitStrings = answer.split(",").map((str) => str.trim());
        for (roleid of splitStrings) {
          if (!interaction.guild.roles.cache.get(roleid)) {
            return false;
          }
        }
        return true;
      } else {
        return interaction.guild.roles.cache.get(answer) ? true : false;
      }
    case 7:
      if (interaction.guild.channels.cache.get(answer)) {
        if (interaction.guild.channels.cache.get(answer).type === 0 || interaction.guild.channels.cache.get(answer).type === 5) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    case 8:
      if (answer.toLowerCase() === "none") {
        return true;
      }
      if (answer.includes(",")) {
        const splitStrings = answer.split(",").map((str) => str.trim());
        for (chanid of splitStrings) {
          try {
            if (interaction.guild.channels.cache.get(chanid).type !== 0 && interaction.guild.channels.cache.get(answer).type !== 5) {
              return false;
            }
          } catch (error) {
            console.log(error);
            return false;
          }
        }
        return true;
      } else {
        if (interaction.guild.channels.cache.get(answer)) {
          if (interaction.guild.channels.cache.get(answer).type === 0 || interaction.guild.channels.cache.get(answer).type === 5) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    default:
      return false;
  }
}

function countCharacter(str, char) {
  return str.split(char).length - 1;
}

function hasSameAmountOfChar(str1, str2, char) {
  return countCharacter(str1, char) === countCharacter(str2, char);
}
