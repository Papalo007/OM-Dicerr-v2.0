const { Schema, model } = require("mongoose");
const configSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildID: String,
  teamModule: Boolean,
  teams: { type: Array, required: false },
  teamShortCodes: { type: Array, required: false },
  teamManagerRoles: { type: Array, required: false },
  teamRosterRoles: { type: Array, required: false },
  scoutRoles: { type: Array, required: false },
  rosterChangesChannel: { type: String, required: false },
  applicantRole: { type: String, required: false },
  staffRoles: Array,
  logChannel: String,
  botCommandsChannel: { type: Array, required: false },
});

module.exports = model("Config", configSchema, "configs");
