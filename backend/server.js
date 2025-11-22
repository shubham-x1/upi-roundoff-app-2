// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./connectDB');
const User = require('./models/user');
const Transaction = require('./models/transaction');

const app = express();
app.use(express.json());
app.use(cors());

const rupeeToPaise = (amount) => {
  const parsed = Number(amount);
  if (Number.isNaN(parsed)) throw new Error('Invalid amount');
  return Math.round(parsed * 100);
};
const paiseToRupee = (p) => +(p / 100).toFixed(2); // return number (not string) to match frontend

// connect then start
connectDB().then(() => {
  // health
  app.get('/api/health', (req, res) => res.json({ success: true, ok: true }));
app.post('/api/user', async (req, res) => {
  try {
    const { uid, email, displayName, upiId, initialBalance } = req.body;
    if (!uid || !displayName)
      return res.status(400).json({ success: false, error: 'uid and displayName required' });

    // 🟢 Check if user already exists
    let existingUser = await User.findOne({ uid });

    if (existingUser) {
      return res.json({
        success: true,
        message: "User already exists",
        user: {
          uid: existingUser.uid,
          email: existingUser.email,
          displayName: existingUser.displayName,
          balance: paiseToRupee(existingUser.balancePaise),
          savings: paiseToRupee(existingUser.savingsPaise)
        }
      });
    }

    // 🟢 Create new user ONLY if not exists
    const balancePaise = initialBalance ? rupeeToPaise(initialBalance) : 0;

    const newUser = await User.create({
      uid,
      email,
      displayName,
      upiId: upiId || '',
      balancePaise,
      savingsPaise: 0
    });

    return res.json({
      success: true,
      user: {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        balance: paiseToRupee(newUser.balancePaise),
        savings: paiseToRupee(newUser.savingsPaise)
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

  // create user (test)
  // body: { uid, email, displayName, upiId?, initialBalance? }

  // fund user (add money)
  // POST /api/user/:uid/fund  body: { amount, note? } amount rupees
  app.post('/api/user/:uid/fund', async (req, res) => {
    const session = await User.startSession();
    session.startTransaction();
    try {
      const { uid } = req.params;
      const { amount, note } = req.body;
      if (amount === undefined) throw new Error('amount required');

      const user = await User.findOne({ uid }).session(session);
      if (!user) throw new Error('user not found');

      const paise = rupeeToPaise(amount);
      user.balancePaise += paise;
      await user.save({ session });

      await Transaction.create([{
        userId: uid,
        merchantName: 'Top-up',
        merchantUpi: user.upiId || 'topup',
        merchantAmountPaise: paise,
        roundUpPaise: 0,
        totalDebitedPaise: -paise,
        type: 'fund',
        note: note || 'fund added',
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return res.json({ success: true, newBalance: paiseToRupee(user.balancePaise) });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // get user info
  app.get('/api/user/:uid', async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await User.findOne({ uid }).lean();
      if (!user) return res.status(404).json({ success: false, error: 'user not found' });
      return res.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          balance: paiseToRupee(user.balancePaise),
          savings: paiseToRupee(user.savingsPaise),
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET transactions by query param userId (matches your frontend calling pattern)
  // GET /api/transactions?userId=<uid>
  app.get('/api/transactions', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ success: false, error: 'userId query param required' });

      const txs = await Transaction.find({ userId }).sort({ createdAt: -1 }).lean();
      // Convert to frontend Transaction shape
      const data = txs.map(t => ({
        id: t._id.toString(),
        merchantName: t.merchantName,
        amount: paiseToRupee(t.merchantAmountPaise), // number
        date: t.createdAt.toISOString(),
        userId: t.userId,
      }));
      return res.json({ success: true, data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/pay   body: { userId, upiId, amount }
  // Performs round-up, updates user balance/savings, writes transaction
  app.post('/api/pay', async (req, res) => {
    const session = await User.startSession();
    session.startTransaction();
    try {
      const { userId, upiId, amount } = req.body;
      if (!userId || !upiId || amount === undefined) {
        throw new Error('userId, upiId, amount required');
      }

      const user = await User.findOne({ uid: userId }).session(session);
      if (!user) throw new Error('user not found');

      const merchantAmountPaise = rupeeToPaise(amount);
      const ceilRupeePaise = Math.ceil(merchantAmountPaise / 100) * 100;
      const roundUpPaise = ceilRupeePaise - merchantAmountPaise;
      const totalDebitPaise = ceilRupeePaise;

      if (user.balancePaise < totalDebitPaise) throw new Error('insufficient balance');

      user.balancePaise -= totalDebitPaise;
      user.savingsPaise += roundUpPaise;
      await user.save({ session });

      const tx = {
        userId,
        merchantName: upiId, // for demo use upi as merchantName; you can parse UPI or map to friendly name
        merchantUpi: upiId,
        merchantAmountPaise,
        roundUpPaise,
        totalDebitedPaise: totalDebitPaise,
        type: 'payment',
      };
      const created = await Transaction.create([tx], { session });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        transaction: {
          id: created[0]._id.toString(),
          merchantName: tx.merchantName,
          merchantAmount: paiseToRupee(merchantAmountPaise),
          roundUp: paiseToRupee(roundUpPaise),
          totalDebited: paiseToRupee(totalDebitPaise),
          date: created[0].createdAt.toISOString(),
        },
        newBalance: paiseToRupee(user.balancePaise),
        savings: paiseToRupee(user.savingsPaise),
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // withdraw savings into balance
  app.post('/api/withdraw-savings', async (req, res) => {
    const session = await User.startSession();
    session.startTransaction();
    try {
      const { userId, amount } = req.body;
      if (!userId) throw new Error('userId required');

      const user = await User.findOne({ uid: userId }).session(session);
      if (!user) throw new Error('user not found');

      const withdrawPaise = amount === undefined ? user.savingsPaise : rupeeToPaise(amount);
      if (withdrawPaise <= 0) throw new Error('invalid withdraw amount');
      if (withdrawPaise > user.savingsPaise) throw new Error('withdraw amount exceeds savings');

      user.savingsPaise -= withdrawPaise;
      user.balancePaise += withdrawPaise;
      await user.save({ session });

      await Transaction.create([{
        userId,
        merchantName: 'Savings Withdrawal',
        merchantUpi: user.upiId || 'savings',
        merchantAmountPaise: 0,
        roundUpPaise: 0,
        totalDebitedPaise: -withdrawPaise,
        type: 'withdrawal',
        note: 'Withdraw savings to balance',
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return res.json({ success: true, newBalance: paiseToRupee(user.balancePaise), savings: paiseToRupee(user.savingsPaise) });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log(`UPI backend listening on :${PORT}`));
});
