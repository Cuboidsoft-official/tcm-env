const mongoose = require('mongoose');
require('dotenv').config();

async function checkReferrals() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    console.log('--- TOTAL USERS IN MONGODB:', users.length, '---');
    
    users.forEach(u => {
      console.log(`[USER] Name: ${u.name || 'N/A'} | Email: ${u.email || 'N/A'}`);
      console.log(`       ReferralCode: ${u.referralCode || 'N/A'}`);
      console.log(`       ReferredBy: ${u.referredBy || 'N/A'}`);
      console.log(`       TCM Coins: ${u.tcmCoins ?? 0}`);
      console.log(`       Wallet Balance: ₹${u.walletBalance ?? 0}`);
      console.log(`       ReferralAppliedAt: ${u.referralAppliedAt || 'None'}`);
      console.log('--------------------------------------------------');
    });

    const redeemed = users.filter(u => u.referredBy || u.referralAppliedAt);
    console.log('=== USERS WHO REDEEMED A REFERRAL CODE:', redeemed.length, '===');
    redeemed.forEach(u => {
      console.log(`-> ${u.name} (${u.email}) applied referral code: "${u.referredBy}" at ${u.referralAppliedAt}`);
    });

    const referrers = users.filter(u => (u.tcmCoins && u.tcmCoins > 0) || (u.walletBalance && u.walletBalance > 0));
    console.log('=== USERS WITH REWARDS/COINS:', referrers.length, '===');
    referrers.forEach(u => {
      console.log(`-> ${u.name} (${u.email}): ${u.tcmCoins || 0} Coins, ₹${u.walletBalance || 0} Wallet`);
    });

  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkReferrals();
