const mongoose = require('mongoose');
require('dotenv').config();

async function fixReferralData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();

    function getCode(name) {
      const clean = (name || 'TCM').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'TCM';
      const rand = Math.floor(10 + Math.random() * 89);
      return `${clean}${rand}X`;
    }

    for (const u of users) {
      const updatePayload = {};
      if (!u.referralCode) {
        updatePayload.referralCode = getCode(u.name);
      }
      if (u.referredBy && (!u.tcmCoins || u.tcmCoins === 0)) {
        updatePayload.tcmCoins = 25;
      }
      if (Object.keys(updatePayload).length > 0) {
        await usersCollection.updateOne({ _id: u._id }, { $set: updatePayload });
        console.log(`Updated user ${u.name} (${u.email}):`, updatePayload);
      }
    }
    console.log('--- DB REFERRAL DATA UPDATED ---');
  } catch (e) {
    console.error('Migration error:', e);
  } finally {
    await mongoose.disconnect();
  }
}

fixReferralData();
