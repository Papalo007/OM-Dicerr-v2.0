const { Schema, model } = require("mongoose");
const warnSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildID: String,
  userID: String,
  reason: { type: String, required: false },
  date: String,
});

module.exports = model("Warning", warnSchema, "warnings");