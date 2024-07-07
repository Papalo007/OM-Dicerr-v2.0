const { Schema, model } = require("mongoose");
const tempSchema = new Schema({
  _id: Schema.Types.ObjectId,
  tempValueOne: { type: String, required: false },
  tempValueTwo: { type: String, required: false },
  tempValueThree: { type: String, required: false },
  tempValueFour: { type: String, required: false },
  tempValueFive: { type: String, required: false },
});

module.exports = model("Temp", tempSchema, "temp");