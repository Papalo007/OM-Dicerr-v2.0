const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Give feedback or suggest a feature for the bot")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("What would you like to suggest?")
        .setRequired(true)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const developer = await client.users.fetch("706547981184270428");
    const suggestion = interaction.options.getString("prompt");

    const blacklistedUsersIds = [];

    if (blacklistedUsersIds.includes(interaction.user.id))
      return await interaction.reply({
        content: `You have been blacklisted from sending suggestions due to abuse of this system. Please use this for actual feedback :/`,
      });

    await developer.send(
      `# -------------------------\n# New Suggestion\n**By tag**: ${interaction.user.tag}, **name**: ${interaction.user.username}
      **ID:** ${interaction.user.id}\n\n**Server:** ${interaction.guild.id}, ${interaction.guild.name}, **Member Count:** ${interaction.guild.memberCount}.
      **Suggestion:** \`\`\`\n${suggestion}\n\`\`\`\n# -------------------------`
    );

    await interaction.reply({
      content: `Your suggestion has been sent to the developer!`,
      ephemeral: true,
    });
  },
};
