const { SlashCommandBuilder } = require("discord.js");
const Link = require("../../schemas/link");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;
const mongoose = require("mongoose");
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your discord with your Valorant Account.")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("riotid")
        .setDescription("Your Valorant name (Username#ID)")
        .setRequired(true)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    await interaction.deferReply();

    const target = interaction.options.getString("riotid");
    const targetInHex = target.replace(/#/g, "%23").replace(/ /g, "%20");
    const trackerLink = `https://tracker.gg/valorant/profile/riot/${targetInHex}/overview`;
    const mongoClient = new MongoClient(databaseToken);
    let status;
    let name;
    let discriminator;
    let nameNdiscrim;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(trackerLink);

    await page.waitForTimeout(1000);

    const elementExists = await page
      .locator("css=li.multi-switch__item--selected span")
      .nth(0)
      .count();
    let elements = await page.locator("css=span.font-light").count();
    let mode;
    let errorCheck;

    if (elements) {
      elements = await page.locator("css=span.font-light").textContent();
      if (elements.toLowerCase().includes("profile is private")) {
        status = "private";
        nameNdiscrim = elements.slice(0, -23);
      } else {
        console.log(elements);
        return await interaction.editReply({
          content: `An unknown error occurred. Please try again later.`,
        });
      }
    } else if (elementExists) {
      name = await page
        .locator("css=span.trn-ign__username")
        .first()
        .textContent();
      discriminator = await page
        .locator("css=span.trn-ign__discriminator")
        .first()
        .textContent()
        .then((d) => d.slice(1));
      nameNdiscrim = name + discriminator;
      mode = await page
        .locator("css=li.multi-switch__item--selected span")
        .nth(0)
        .textContent();
      if (mode === "Premier") {
        await page.getByText("Competitive").first().click();
        errorCheck = page.getByText(nameNdiscrim + "'S PROFILE IS PRIVATE.");
        if (errorCheck) {
          status = "private";
        } else {
          status = "public";
        }
      } else {
        status = "public";
      }
    } else {
      const error = await page.locator("h1").textContent();
      if (error === "404") {
        return await interaction.editReply({
          content: `This player doesn't exist.`,
          ephemeral: true,
        });
      } else {
        console.log(error);
        return await interaction.editReply({
          content: `An unknown error occurred. Please try again later.`,
        });
      }
    }
    if (!nameNdiscrim) {
      nameNdiscrim = name + discriminator;
    }
    //Saving to the DB
    const existingLink = await Link.findOne({ userID: interaction.user.id });
    if (existingLink) {
      const myDB = mongoClient.db("test");
      const coll = myDB.collection("riotdiscordlink");
      const filter = { userID: interaction.user.id };

      const updateDocument = {
        $set: {
          riotID: nameNdiscrim || name + discriminator,
          status: status,
        },
      };
      await coll.updateOne(filter, updateDocument);
      //Replying
      if (status === "private") {
        await interaction.editReply({
          content:
            `Your discord account has been updated and is now linked with the valorant account **${nameNdiscrim}**.` +
            `\nWARNING! Your tracker account is private, so we cannot access any information regarding your statistics.` +
            `\nPlease make it public by visiting ${trackerLink} and signing in to claim your account.`,
        });
      } else if (status === "public") {
        await interaction.editReply({
          content: `Your discord account has been updated and is now linked with the valorant account **${name}${discriminator}**.`,
        });
      }
    } else {
      const linkin = new Link({
        _id: new mongoose.Types.ObjectId(),
        userID: interaction.user.id,
        riotID: nameNdiscrim || name + discriminator,
        status: status,
      });
      await linkin.save().catch(console.error);
      //Replying
      if (status === "private") {
        await interaction.editReply({
          content:
            `Your discord account has been linked with the valorant account **${nameNdiscrim}**.` +
            `\nWARNING! Your tracker account is private, so we cannot access any information regarding your statistics.` +
            `\nPlease make it public by visiting ${trackerLink} and signing in to claim your account.`,
        });
      } else if (status === "public") {
        await interaction.editReply({
          content: `Your discord account has been linked with the valorant account **${name}${discriminator}**.`,
        });
      }
    }

    await browser.close();
  },
};
