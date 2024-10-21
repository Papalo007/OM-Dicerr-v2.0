const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("view-db-file")
    .setDescription("View a DB file (debugging) (currently: CONFIG)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    await interaction.deferReply();
    if (interaction.user.id !== "706547981184270428") {
      return await interaction.editReply(
        "This command is for debugging. You are not allowed to use it."
      );
    }

    const query = { guildID: interaction.guild.id };

    const config = await Config.findOne(query);

    await interaction.editReply({
      content: `Team Module: ${config.teamModule}
        Teams: ${config.teams.toString()},
  teamShortCodes: ${config.teamShortCodes.toString()},
  teamManagerRoles: ${config.teamManagerRoles.toString()},
  teamRosterRoles: ${config.teamRosterRoles.toString()},
  scoutRoles: ${config.scoutRoles.toString()},
  rosterChangesChannel: ${config.rosterChangesChannel},
  applicantRole: ${config.applicantRole},
  staffRoles: ${config.staffRoles.toString()},
  logChannel: ${config.logChannel},
  botCommandsChannel: ${config.botCommandsChannel},`,
    });
  },
};
