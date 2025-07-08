require("dotenv").config();
const { token, databaseToken } = process.env;
const { connect } = require("mongoose");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const logEvent = require("./functions/utils/logger.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    //Privileged
    GatewayIntentBits.MessageContent,
  ],
});
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();
client.commandArray = [];

const functionFolders = fs.readdirSync("./src/functions");
for (const folder of functionFolders) {
  const functionFiles = fs
    .readdirSync(`./src/functions/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of functionFiles)
    require(`./functions/${folder}/${file}`)(client);
}

process.on("unhandledRejection", async (reason, promise) => {
  await logEvent(
    client,
    `Unhandled Rejection (crash): ${reason}\nPromise:  ${promise}`,
    true
  );
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  await logEvent(client, `Uncaught Exception (crash): ${error}`, true);
  process.exit(1);
});

client.handleEvents();
client.handleCommands();
client.handleComponents();
client.login(token);
connect(databaseToken).catch(console.error);
(async () => {
  await connect(databaseToken).catch(console.error);
})();
