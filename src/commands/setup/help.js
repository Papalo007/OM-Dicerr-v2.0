const { SlashCommandBuilder, EmbedBuilder, Embed } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get help with commands")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("specific-command")
        .setDescription("Specify a command you need help with.")
        .setRequired(false)
        .setAutocomplete(true)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async autocomplete(interaction, client) {
    const focusedValue = interaction.options.getFocused();
    const choices = [];

    const commandsColl = await client.application.commands.fetch();
    for (const command of commandsColl.values()) {
      if (command.type !== 1) continue;

      choices.push(command.name);
    }

    const filtered = choices.filter((choice) =>
      choice.startsWith(focusedValue)
    );
    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice }))
    );
  },

  async execute(interaction, client) {
    const helpEmbed = new EmbedBuilder()
      .setTitle("Available Commands:")
      .setAuthor({
        name: "Dicerr",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setColor(0xfd9323);

    const commandsColl = await client.application.commands.fetch();
    let commandType;
    const specifiedCommand = interaction.options.getString("specific-command");

    if (specifiedCommand) {
      const command = commandsColl.find(
        (command) => command.name === specifiedCommand
      );
      if (!command)
        return await interaction.reply(
          `${specifiedCommand} is not a valid command :/`
        );

      helpEmbed
        .setTitle(`</${command.name}:${command.id}>`)
        .setDescription(command.description + `\n\n**Options:**`);

      if (command.options.length === 0) {
        helpEmbed.addFields({
          name: `This command has no options.`,
          value: ` `,
        });
      } else {
        for (let i = 0; i < command.options.length; i++) {
          switch (command.options[i].type) {
            case 1:
              commandType = "Sub command";
              break;
            case 2:
              commandType = "Sub command group";
              break;
            case 3:
              commandType = "String";
              break;
            case 4:
              commandType = "Number (no decimals)";
              break;
            case 5:
              commandType = "Boolean (true/false)";
              break;
            case 6:
              commandType = "Discord User";
              break;
            case 7:
              commandType = "Channel";
              break;
            case 8:
              commandType = "Role";
              break;
            case 9:
              commandType = "Mentionable";
              break;
            case 10:
              commandType = "Number (with decimals)";
              break;
            case 11:
              commandType = "Attachment";
              break;
          }
          helpEmbed.addFields({
            name: `${command.options[i].name} - ${commandType}`,
            value: `${command.options[i].description}\nRequired: ${command.options[i].required}`,
            inline: true,
          });

          if (command.options[i].options) {
            helpEmbed.addFields({
              name: `   - Extra option to "__${command.options[i].name}__": ${command.options[i].options[0].name}`,
              value:
                command.options[i].options[0].description +
                `\nRequired: ${command.options[i].options[0].required}`,
              inline: false,
            });
          }
        }
      }
    } else {
      for (const command of commandsColl.values()) {
        if (command.type !== 1) continue;

        helpEmbed.addFields({
          name: `</${command.name}:${command.id}>`,
          value: `${command.description}`,
          inline: true,
        });
      }
    }
    await interaction.reply({ embeds: [helpEmbed] });
  },
};
