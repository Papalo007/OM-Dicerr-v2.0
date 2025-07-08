require("dotenv").config();
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const { hapikey } = process.env;
const logEvent = require("../../functions/utils/logger.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premier")
    .setDescription(
      "Returns the statistics of the provided premier team in Valorant."
    )

    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("The name of the team (Team Name#Tag)")
        .setRequired(true)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    await interaction.deferReply();
    const target = interaction.options.getString("target");
    if (!target.includes("#"))
      return await interaction.editReply(
        "Please provide a team name in the form of 'Team Name#Tag'"
      );
    const [name, tag] = target.split("#");

    let response;

    //prettier-ignore
    try {
      response = await axios.get(`https://api.henrikdev.xyz/valorant/v1/premier/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
        {
          headers: {
            Authorization: hapikey,
          },
        }
      );
    } catch (error) {
      if (error.response) {
        // error.response.status contains the HTTP status code
        switch (error.response.status) {
          case 400:
            return await interaction.editReply(
              "400 Internal Error: Invalid queries."
            );
          case 403:
            return await interaction.editReply(
              "403 API Maintenance in progress."
            );
          case 404:
            return await interaction.editReply(
              "I couldn't find a team with this name.."
            );
          case 408:
            await logEvent(
              client,
              `408 Request Timed out in premier command. Option value: ${target}`,
              false
            );
            return await interaction.editReply("408 Timed out :(");
          case 410:
            await logEvent(
              client,
              `410 Deprecated Endpoint in https://api.henrikdev.xyz/valorant/v4/premier/`,
              true
            );
            return await interaction.editReply(
              "410 This endpoint is deprecated. The developer has been notified."
            );
          case 429:
            return error.response.headers["x-ratelimit-remaining"] == 0
              ? await interaction.editReply(
                  "Rate Limit reached for this command, please try again later."
                )
              : await interaction.editReply(
                  "Global rate limit reached, please try again later."
                );
          case 503:
            return await interaction.editReply(
              "503 Rito API down (small indie company)"
            );
          default:
            return interaction.editReply(
              `Error: ${error.response.status} - ${error.response.statusText}`
            );
        }
      } else {
        // Something else went wrong (network error, timeout, etc)
        console.error(error);
        return await interaction.editReply("An unexpected error occurred.");
      }
    }
    let divImg;
    if (response.data.data.enrolled) {
      let division = response.data.data.placement.division;

      if (division <= 5) {
        division = "Open " + division;
        divImg =
          "https://static.wikia.nocookie.net/valorant/images/6/64/Premier_Division_Open.png";
      } else if (division <= 10) {
        division = "Intermediate " + division - 5;
        divImg =
          "https://static.wikia.nocookie.net/valorant/images/3/33/Premier_Division_Intermediate.png";
      } else if (division <= 15) {
        division = "Advanced " + division - 10;
        divImg =
          "https://static.wikia.nocookie.net/valorant/images/2/25/Premier_Division_Advanced.png";
      } else {
        division = "Elite " + division - 15;
        divImg =
          "https://static.wikia.nocookie.net/valorant/images/6/6b/Premier_Division_Elite.png";
      }
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Moderator Dicerr",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTitle(`${name}#${tag}'s Premier Statistics`)
      .addFields({
        name: "A New Field",
        value: "d",
        inline: false,
      })
      .setThumbnail(divImg);

    // TODO: Make embed

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
