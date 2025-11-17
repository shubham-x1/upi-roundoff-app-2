// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  upiId: { type: String, required: true },
  // All currency stored in integer paise
  balancePaise: { type: Number, default: 0 },  // available balance
  savingsPaise: { type: Number, default: 0 },  // round-up savings
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
