const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Config = require("../../schemas/config");
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("valstats")
    .setDescription("Returns the statistics of the provided user in Valorant.")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("The riot id of the user (Username#ID)")
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
    await interaction.deferReply();

    const target = interaction.options.getString("target");
    const targetInHex = replaceNonAlphanumericWithHex(target);
    const trackerLink = `https://tracker.gg/valorant/profile/riot/${targetInHex}/overview`;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(trackerLink);
    await page.screenshot({ path: "screenshotLol.png" }); //For troubleshooting


    //TODO: Make these more specific using css selectors + unique variables for each one going in the embed.

    let texts = [];
    try {
      for (let i = 0; i < 44; i++) {
        let elements = await page.locator(".value").nth(i).textContent();
        if (!elements) {
          break;
        }
        texts.push(elements);
      }
    } catch (error) {
      console.log(error);
      try {
        let elements = await page.locator("h1").textContent();
        if (elements === "404") {
          await interaction.editReply({
            content: `404\nCouldn't find the player "${target}"`,
            ephemeral: true,
          });
          return;
        } else if (elements === "tracker.gg") {
          await interaction.editReply({
            content: `The bot couldn't get past the human verification check.`,
            ephemeral: true,
          });
          return;
        } else {
          await interaction.editReply({
            content: `An unknown error occurred while trying to gather information about this player. Please check the bot terminal for further information.`,
          });
          console.log("An unknown error occurred");
        }
      } catch (error) {
        let elements = await page.locator("css=span.font-light").textContent();
        if (elements.toLowerCase().includes("profile is private")) {
          await interaction.editReply({
            content: `${target}'s profile is private, so I cannot access any information regarding this player :(`,
          });
          return;
        }
      }
    }

    const mode = await page
      .locator("css=li.multi-switch__item--selected span")
      .nth(0)
      .textContent();
    const episode = await page
      .locator("css=li.multi-switch__item--selected span")
      .nth(1)
      .textContent();

    const name = await page
      .locator("css=span.trn-ign__username")
      .first()
      .textContent();
    let discriminator = await page
      .locator("css=span.trn-ign__discriminator")
      .first()
      .textContent();
    discriminator = discriminator.slice(1);

    // EMBED HERE
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Moderator Dicerr",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTitle(`${name}${discriminator}'s Valorant statistics`)
      .setURL(trackerLink)
      .setDescription(`${mode} overview of ${episode}`)
      .addFields(
        {
          name: "Dmg/Round",
          value: texts[12] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "K/D",
          value: texts[13] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "HS %",
          value: texts[14] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "KAST",
          value: texts[17] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "Win %",
          value: texts[15] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "Current/Peak Rank",
          value:
            `${texts[0]}/ ${texts[1]}` || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "__Most Played Agent__",
          value: `${texts[29] || "Couldn't find any info on that :/"} (${
            texts[30] || "Couldn't find any info on that :/"
          } matches)\n\n__Statistics with ${
            texts[29] || "Couldn't find any info on that :/"
          }:__`,
          inline: false,
        },
        {
          name: "Dmg/Round",
          value: texts[33] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "K/D",
          value: texts[32] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "Win %",
          value: texts[31] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "__Second Most Played Agent__",
          value: `${texts[36] || "Couldn't find any info on that :/"} (${
            texts[37] || "Couldn't find any info on that :/"
          } matches)\n\n__Statistics with ${
            texts[36] || "Couldn't find any info on that :/"
          }:__`,
          inline: false,
        },
        {
          name: "Dmg/Round",
          value: texts[40] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "K/D",
          value: texts[39] || "Couldn't find any info on that :/",
          inline: true,
        },
        {
          name: "Win %",
          value: texts[38] || "Couldn't find any info on that :/",
          inline: true,
        }
      )
      .setColor("#ff8000")
      .setFooter({
        text: "Valorant Stats by Dicerr",
        iconURL:
          "https://toppng.com/uploads/preview/valorant-logo-icon-11608279985p9bg0vbcxu.png",
      })
      .setTimestamp();
    // EMBED HERE

    await browser.close();
    await interaction.editReply({
      embeds: [embed],
    });
  },
};

function replaceNonAlphanumericWithHex(input) {
  return input.replace(/[^A-Za-z0-9]/g, (match) => {
    return "%" + match.charCodeAt(0).toString(16).toUpperCase();
  });
}
