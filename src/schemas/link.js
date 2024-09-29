const { Schema, model } = require("mongoose");
const linkSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userID: String,
  riotID: String,
  status: String,
});

module.exports = model("Link", linkSchema, "riotdiscordlink");
