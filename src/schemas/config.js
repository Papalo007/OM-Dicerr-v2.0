const { Schema, model } = require("mongoose");
const configSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildID: String,
  logChannelID: String,
  permaInvite: { type: String, required: false },
  rosterChangesChannelID: { type: String, required: false },
  botCommandsChannel: { type: String, required: false },
});

module.exports = model("Config", configSchema, "configs");