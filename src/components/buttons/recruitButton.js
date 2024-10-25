const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const Config = require("../../schemas/config");
const Temp = require("../../schemas/temp");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;

module.exports = {
  data: {
    name: "recruit-button",
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    await interaction.deferReply();

    const tempDoc = await Temp.findOne({
      tempValueOne: "app-review",
      guildID: interaction.guild.id,
    });
    if (!tempDoc) {
      await interaction.reply({
        content: `The buttons have been disabled. Please run /review again.`,
        ephemeral: true,
      });
      return;
    }
    const config = await Config.findOne({ guildID: interaction.guild.id });
    const logChannel = client.channels.cache.get(config.logChannel);
    const user = tempDoc.tempValueTwo;
    const interactionUser = tempDoc.tempValueThree;
    const appRole = interaction.guild.roles.cache.get(config.applicantRole);
    const member = await interaction.guild.members.fetch(user);
    const targetUser = await client.users.fetch(user);
    let team;
    const mongoClient = new MongoClient(databaseToken);

    const myDB = mongoClient.db("bot");
    const appColl = myDB.collection("applications");
    const query = { userID: user };

    if (interaction.user.id !== interactionUser) {
      interaction.editReply({
        content: `You are not the one who called /review`,
        ephemeral: true,
      });
      return;
    }

    const announcementChannel = interaction.guild.channels.cache.get(
      config.rosterChangesChannel
    );

    let button1, button2, button3, button4, button5;
    let firstActionRow = new ActionRowBuilder();

    switch (config.teams.length) {
      case 1:
        button1 = new ButtonBuilder()
          .setCustomId("0")
          .setLabel(config.teams[0])
          .setStyle(ButtonStyle.Primary);
        firstActionRow.addComponents(button1);
        break;
      case 2:
        button1 = new ButtonBuilder()
          .setCustomId("0")
          .setLabel(config.teams[0])
          .setStyle(ButtonStyle.Primary);
        button2 = new ButtonBuilder()
          .setCustomId("1")
          .setLabel(config.teams[1])
          .setStyle(ButtonStyle.Danger);
        firstActionRow.addComponents(button1, button2);
        break;
      case 3:
        button1 = new ButtonBuilder()
          .setCustomId("0")
          .setLabel(config.teams[0])
          .setStyle(ButtonStyle.Primary);
        button2 = new ButtonBuilder()
          .setCustomId("1")
          .setLabel(config.teams[1])
          .setStyle(ButtonStyle.Danger);
        button3 = new ButtonBuilder()
          .setCustomId("2")
          .setLabel(config.teams[2])
          .setStyle(ButtonStyle.Success);
        firstActionRow.addComponents(button1, button2, button3);
        break;
      case 4:
        button1 = new ButtonBuilder()
          .setCustomId("0")
          .setLabel(config.teams[0])
          .setStyle(ButtonStyle.Primary);
        button2 = new ButtonBuilder()
          .setCustomId("1")
          .setLabel("Typhoon")
          .setStyle(ButtonStyle.Danger);
        button3 = new ButtonBuilder()
          .setCustomId("2")
          .setLabel("Typhoon")
          .setStyle(ButtonStyle.Success);
        button4 = new ButtonBuilder()
          .setCustomId("3")
          .setLabel("Typhoon")
          .setStyle(ButtonStyle.Primary);
        firstActionRow.addComponents(button1, button2, button3, button4);
        break;
      case 5:
        button1 = new ButtonBuilder()
          .setCustomId("0")
          .setLabel(config.teams[0])
          .setStyle(ButtonStyle.Primary);
        button2 = new ButtonBuilder()
          .setCustomId("1")
          .setLabel(config.teams[1])
          .setStyle(ButtonStyle.Danger);
        button3 = new ButtonBuilder()
          .setCustomId("2")
          .setLabel(config.teams[2])
          .setStyle(ButtonStyle.Success);
        button4 = new ButtonBuilder()
          .setCustomId("3")
          .setLabel(config.teams[3])
          .setStyle(ButtonStyle.Primary);
        button5 = new ButtonBuilder()
          .setCustomId("4")
          .setLabel(config.teams[4])
          .setStyle(ButtonStyle.Danger);
        firstActionRow.addComponents(
          button1,
          button2,
          button3,
          button4,
          button5
        );
        break;
    }

    const response = await interaction.editReply({
      content: `Which team would you like to recruit ${targetUser.tag} (<@${user}>) into?`,
      ephemeral: true,
      components: [firstActionRow],
      fetchReply: true,
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 30_000,
      });

      team = config.teams[confirmation.customId];
      if (
        !interaction.member.roles.cache.some(
          (role) => role.id === config.teamManagerRoles[confirmation.customId]
        )
      ) {
        await confirmation.update({
          content: `You are not authorised to recruit people for ${team}.`,
          components: [],
        });
        return;
      } else {
        await member.roles.add(interaction.guild.roles.cache.get(config.teamRosterRoles[confirmation.customId])).catch(console.error);
        await member.roles.remove(interaction.guild.roles.cache.get(config.appRole)).catch(console.error);

        if (announcementChannel) {
          await announcementChannel.send({
            content: `<@${user}> has been accepted to ${team}!`,
          });
        }

        await targetUser.send({
          content: `Congratulations, you have been accepted to ${team}!`,
        });
      }
    } catch (e) {
      console.log(e);
      await interaction.editReply({
        content: "Confirmation not received within 30 seconds, cancelling",
        components: [],
      });
    }

    const logEmbed = new EmbedBuilder()
      .setAuthor({
        name: "Moderator Dicerr",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTitle("Recruitment Log")
      .setDescription(`Recruitment log for ${team}`)
      .addFields(
        {
          name: "Recruited by",
          value: interaction.user.tag,
          inline: false,
        },
        {
          name: "Recruiter ID",
          value: interaction.user.id,
          inline: true,
        },
        {
          name: "Recruiter Mention",
          value: `<@${interaction.user.id}>`,
          inline: true,
        },
        {
          name: "New Recruit",
          value: targetUser.tag,
          inline: false,
        },
        {
          name: "New Recruit ID",
          value: user,
          inline: true,
        },
        {
          name: "New Recruit Mention",
          value: `<@${user}>`,
          inline: true,
        },
        {
          name: "Team",
          value: team,
          inline: false,
        }
      )
      .setColor("#ff8000")
      .setFooter({
        text: `Recruitment log by ${interaction.client.user.username}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.editReply({
      content: `${targetUser.tag} has succesfully been recruited to ${team}!`,
      components: [],
    });
    await logChannel.send({ embeds: [logEmbed] });
    await appColl.deleteOne(query).catch(console.error);
  },
};
