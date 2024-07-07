const { Schema, model } = require("mongoose");
const applicationSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userID: String,
  tracker: String,
  roles: String,
  agents: String,
  warmup: { type: String, required: false },
  notes: { type: String, required: false },
  missedMatches: { type: Number, required: false },
  moderatorNotes: { type: String, required: false },
});

module.exports = model("App", applicationSchema, "applications");
