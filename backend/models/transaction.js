// models/Transaction.js
const mongoose = require('mongoose');

const TxSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  merchantUpi: { type: String, required: true },
  merchantAmountPaise: { type: Number, required: true },
  roundUpPaise: { type: Number, required: true },
  totalDebitedPaise: { type: Number, required: true },
  type: { type: String, enum: ['payment', 'savings_withdrawal', 'fund', 'refund'], default: 'payment' },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', TxSchema);
