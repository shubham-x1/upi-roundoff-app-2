// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },   // <-- match frontend UID
  upiId: { type: String, default: "" },                  // <-- safe default
  balancePaise: { type: Number, default: 0 },            // wallet balance
  savingsPaise: { type: Number, default: 0 },            // round-up savings
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);

