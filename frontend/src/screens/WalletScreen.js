import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { addWalletMoney, convertCoinsToCash, convertReferralBonus, getWallet, withdrawWalletFunds } from "../api/client";
import { Linking } from "react-native";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

const { width } = Dimensions.get("window");

function generateReferralCode(user = {}) {
  if (user.referralCode && user.referralCode.length === 6) return user.referralCode.toUpperCase();
  const rawName = (user.name || "LEARNER")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  const prefix = rawName.substring(0, 3).padEnd(3, "X");
  return `${prefix}25X`.substring(0, 6);
}

export default function WalletScreen({ session, user = {}, onBack }) {
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState({
    totalBalance: user.wallet?.totalBalance !== undefined ? user.wallet.totalBalance : 0.0,
    availableBalance: user.wallet?.availableBalance !== undefined ? user.wallet.availableBalance : 0.0,
    totalEarned: user.wallet?.totalEarned !== undefined ? user.wallet.totalEarned : 0.0,
    totalWithdrawn: user.wallet?.totalWithdrawn !== undefined ? user.wallet.totalWithdrawn : 0.0,
    tcmCoins: user.wallet?.tcmCoins !== undefined ? user.wallet.tcmCoins : 0,
    pendingBalance: user.wallet?.pendingBalance !== undefined ? user.wallet.pendingBalance : 0.0,
    referralCode: user.wallet?.referralCode || generateReferralCode(user),
    transactions: user.wallet?.transactions || []
  });

  const referralCode = walletData.referralCode || generateReferralCode(user);

  useEffect(() => {
    fetchLiveWallet();
  }, [session?.token]);

  async function fetchLiveWallet() {
    if (!session?.token) return;
    try {
      setLoading(true);
      const res = await getWallet(session.token);
      if (res?.wallet) {
        setWalletData(res.wallet);
      }
    } catch (err) {
      console.log("Wallet fetch fallback:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Action Modals
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [addMoneyModalOpen, setAddMoneyModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [copiedToast, setCopiedToast] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [inputReferralCode, setInputReferralCode] = useState("");
  const [appliedReferral, setAppliedReferral] = useState(false);

  function handleApplyReferralCode() {
    const code = inputReferralCode.trim().toUpperCase();
    if (!code) {
      Alert.alert("Referral Code Required", "Please enter a valid referral code to claim 20 coins.");
      return;
    }
    if (appliedReferral) {
      Alert.alert("Already Claimed", "You have already applied a referral code.");
      return;
    }
    setAppliedReferral(true);

    setWalletData((prev) => {
      const newCoins = prev.tcmCoins + 20;
      let newBalance = prev.availableBalance;
      let newTotal = prev.totalBalance;
      let finalCoins = newCoins;
      const extraTx = [];

      if (newCoins >= 500) {
        const convertMultiplier = Math.floor(newCoins / 500);
        const coinsDeducted = convertMultiplier * 500;
        const cashAdded = convertMultiplier * 100;
        finalCoins = newCoins - coinsDeducted;
        newBalance += cashAdded;
        newTotal += cashAdded;

        extraTx.push({
          id: `tx_autoconv_${Date.now()}`,
          type: "credit",
          title: "Auto Coins Conversion",
          subtitle: `Auto-converted 500 Coins to ₹${cashAdded.toFixed(2)} Cash`,
          amount: `+ ₹${cashAdded.toFixed(2)}`,
          date: "Just now",
          icon: "gift",
          iconBg: "#ECFDF5",
          iconColor: "#10B981"
        });
      }

      return {
        ...prev,
        tcmCoins: finalCoins,
        availableBalance: newBalance,
        totalBalance: newTotal,
        transactions: [
          ...extraTx,
          {
            id: `tx_ref_applied_${Date.now()}`,
            type: "credit",
            title: "Referral Code Bonus",
            subtitle: `Applied referral code ${code} (+20 Coins)`,
            amount: "+ 20 Coins",
            date: "Just now",
            icon: "star",
            iconBg: "#FEF3C7",
            iconColor: "#D97706"
          },
          ...prev.transactions
        ]
      };
    });

    Alert.alert(
      "Referral Bonus Added! 🎉",
      `Referral code ${code} applied successfully!\n\n+20 TCM Coins added to your wallet.`
    );
  }

  function handleCopyReferral() {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
    Alert.alert("Referral Code Copied", `Code: ${referralCode}\nShare with friends to earn ₹100 & 50 TCM Coins per referral!`);
  }

  function handleShareReferral() {
    Alert.alert(
      "Share Referral Link",
      `Join me on TCM Academy using my code ${referralCode} and get 10 TCM Coins & ₹500 converted referral reward!\n\nLink: https://tcm.app/ref/${referralCode}`
    );
  }

  async function handleConvertCoins() {
    if (walletData.tcmCoins < 500) {
      Alert.alert(
        "Coins Requirement",
        `You currently have ${walletData.tcmCoins} TCM Coins. You need 500 coins to convert to ₹100 cash (500 Coins = ₹100).\n\nApply a referral code (+20 coins) or invite friends to earn coins!`
      );
      return;
    }

    setActionSubmitting(true);
    try {
      const convertMultiplier = Math.floor(walletData.tcmCoins / 500);
      const coinsDeducted = convertMultiplier * 500;
      const cashAdded = convertMultiplier * 100;

      setWalletData((prev) => ({
        ...prev,
        tcmCoins: Math.max(0, prev.tcmCoins - coinsDeducted),
        availableBalance: prev.availableBalance + cashAdded,
        totalBalance: prev.totalBalance + cashAdded,
        totalEarned: prev.totalEarned + cashAdded,
        transactions: [
          {
            id: `tx_conv_${Date.now()}`,
            type: "credit",
            title: "Coins Converted to Cash",
            subtitle: `Converted ${coinsDeducted} TCM Coins to ₹${cashAdded.toFixed(2)} Cash`,
            amount: `+ ₹${cashAdded.toFixed(2)}`,
            date: "Just now",
            icon: "gift",
            iconBg: "#ECFDF5",
            iconColor: "#10B981"
          },
          ...prev.transactions
        ]
      }));

      Alert.alert("Coins Converted! 🎉", `${coinsDeducted} TCM Coins converted successfully! ₹${cashAdded.toFixed(2)} cash added to your available balance.`);
    } catch (err) {
      Alert.alert("Conversion Failed", err.message || "Failed to convert coins.");
    } finally {
      setActionSubmitting(false);
    }
  }

  async function handleClaimConvertedReferral(refId, friendName) {
    setActionSubmitting(true);
    try {
      if (session?.token) {
        const res = await convertReferralBonus(session.token, refId, friendName);
        if (res?.wallet) setWalletData(res.wallet);
      } else {
        setWalletData((prev) => ({
          ...prev,
          availableBalance: prev.availableBalance + 500,
          totalBalance: prev.totalBalance + 500,
          totalEarned: prev.totalEarned + 500,
          transactions: [
            {
              id: `tx_ref_bonus_${Date.now()}`,
              type: "credit",
              title: "Converted Referral Cash Bonus",
              subtitle: `Successful converted referral by ${friendName}`,
              amount: "+ ₹500.00",
              date: "Just now",
              icon: "star",
              iconBg: "#F0EDFF",
              iconColor: "#0A6836"
            },
            ...prev.transactions
          ]
        }));
      }
      Alert.alert("₹500 Bonus Credited!", `₹500.00 converted referral bonus credited for ${friendName}!`);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not claim referral bonus.");
    } finally {
      setActionSubmitting(false);
    }
  }

  function handleWithdrawWhatsApp() {
    const amt = parseFloat(withdrawAmount) || walletData.availableBalance || 100;
    const upi = upiId.trim() || "Not specified";
    const whatsappNum = "9238695500";
    const msg = `Hi TCM Support! I want to withdraw ₹${amt.toFixed(2)} from my TCM Wallet. My UPI / Bank details: ${upi}. Please process my withdrawal.`;
    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/91${whatsappNum}?text=${encoded}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp Direct Contact 💬", `Please send a WhatsApp message to +91 ${whatsappNum} with your UPI details: "${upi}" to withdraw ₹${amt.toFixed(2)}.`);
    });
  }

  async function handleWithdrawSubmit() {
    handleWithdrawWhatsApp();
  }

  async function handleAddMoneySubmit() {
    const amt = parseFloat(addAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to add.");
      return;
    }

    setActionSubmitting(true);
    try {
      if (session?.token) {
        const res = await addWalletMoney(session.token, { amount: amt });
        if (res?.wallet) setWalletData(res.wallet);
      } else {
        setWalletData((prev) => ({
          ...prev,
          availableBalance: prev.availableBalance + amt,
          totalBalance: prev.totalBalance + amt,
          totalEarned: prev.totalEarned + amt,
          transactions: [
            {
              id: `tx_${Date.now()}`,
              type: "credit",
              title: "Added Funds",
              subtitle: "UPI / GPay Payment Success",
              amount: `+ ₹${amt.toFixed(2)}`,
              date: "Just now",
              icon: "wallet-plus",
              iconBg: "#E8F5E9",
              iconColor: "#2E7D32"
            },
            ...prev.transactions
          ]
        }));
      }

      setAddMoneyModalOpen(false);
      setAddAmount("");
      Alert.alert("Money Added Successfully", `₹${amt.toFixed(2)} added to your TCM Wallet balance.`);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to add money.");
    } finally {
      setActionSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* 1. Top Header Bar matching reference image */}
      <View style={styles.topHeader}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#181725" />
        </Pressable>
        <Text style={styles.headerTitle}>Wallet</Text>
        <Pressable onPress={() => Alert.alert("TCM Wallet Help", "Earn coins via referrals and convert coins to withdrawable cash anytime!")} style={styles.helpBtn}>
          <Feather name="help-circle" size={20} color="#181725" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. Total Balance Purple Gradient Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardTop}>
            <View style={styles.balanceInfoCol}>
              <View style={styles.balanceLabelRow}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Feather name="eye" size={14} color="rgba(255,255,255,0.8)" style={{ marginLeft: 6 }} />
              </View>
              <Text style={styles.totalBalanceAmount}>₹{walletData.totalBalance.toFixed(2)}</Text>
              
              <Text style={styles.availLabel}>Available Balance</Text>
              <Text style={styles.availAmount}>₹{walletData.availableBalance.toFixed(2)}</Text>
            </View>

            {/* 3D Wallet Graphic Artwork */}
            <View style={styles.walletGraphicWrap}>
              <View style={styles.walletIconCircle}>
                <MaterialCommunityIcons name="wallet" size={44} color="#FFFFFF" />
                <View style={styles.coinBadgeFloating1}>
                  <Text style={styles.coinBadgeText}>₹</Text>
                </View>
                <View style={styles.coinBadgeFloating2}>
                  <Text style={styles.coinBadgeText}>₹</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.balanceActionsRow}>
            <Pressable onPress={() => setWithdrawModalOpen(true)} style={styles.withdrawBtn}>
              <Feather name="upload" size={14} color="#0A6836" style={{ marginRight: 6 }} />
              <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
            </Pressable>

            <Pressable onPress={() => setAddMoneyModalOpen(true)} style={styles.addMoneyBtn}>
              <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addMoneyBtnText}>Add Money</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. 4-Column Metric Summary Card */}
        <View style={styles.metricsCard}>
          {/* Column 1: Total Earned */}
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Total Earned</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.earnedVal}>₹{walletData.totalEarned.toFixed(2)}</Text>
              <View style={styles.arrowUpBadge}>
                <Feather name="arrow-up" size={10} color="#2E7D32" />
              </View>
            </View>
          </View>

          <View style={styles.metricDivider} />

          {/* Column 2: Total Withdrawn */}
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Total Withdrawn</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.withdrawnVal}>₹{walletData.totalWithdrawn.toFixed(2)}</Text>
              <View style={styles.arrowDownBadge}>
                <Feather name="arrow-down" size={10} color="#D32F2F" />
              </View>
            </View>
          </View>

          <View style={styles.metricDivider} />

          {/* Column 3: TCM Coins */}
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>TCM Coins</Text>
            <View style={styles.metricValueRow}>
              <View style={styles.coinCircle}>
                <Text style={styles.coinSymbol}>$</Text>
              </View>
              <Text style={styles.coinsVal}>{walletData.tcmCoins}</Text>
            </View>
          </View>

          <View style={styles.metricDivider} />

          {/* Column 4: Pending */}
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Pending</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.pendingVal}>₹{walletData.pendingBalance.toFixed(2)}</Text>
              <View style={styles.clockBadge}>
                <Feather name="clock" size={10} color="#2F79B9" />
              </View>
            </View>
          </View>
        </View>

        {/* 4. Your Referral Code & Add Referral Code Card */}
        <View style={styles.referralCard}>
          <Text style={styles.referralCardTitle}>Your Referral Code</Text>

          <View style={styles.referralMainRow}>
            <View style={styles.referralLeftCol}>
              <Pressable onPress={handleCopyReferral} style={styles.dashedCodeBox}>
                <Text style={styles.referralCodeText}>{referralCode}</Text>
                <Feather name="copy" size={16} color="#0A6836" style={{ marginLeft: 8 }} />
              </Pressable>
            </View>

            <View style={styles.referralRightCol}>
              <Text style={styles.referralInviteText}>
                Earn <Text style={{ fontFamily: fonts.bold, color: "#10B981" }}>₹300 Cash</Text> per friend who buys a course using your code!
              </Text>

              <Pressable onPress={handleShareReferral} style={styles.shareEarnBtn}>
                <Feather name="share-2" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.shareEarnBtnText}>Share & Earn ₹300</Text>
              </Pressable>
            </View>

            <View style={styles.giftGraphicWrap}>
              <MaterialCommunityIcons name="gift-outline" size={40} color="#0A6836" />
            </View>
          </View>

          {/* Add Friend's Referral Code Section */}
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#E2E8F0" }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#0F172A", marginBottom: 4 }}>Have a Referral Code?</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: "#64748B", marginBottom: 8 }}>Enter someone's referral code to get 20 TCM Coins instantly!</Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="Enter referral code (e.g. AYU25X)"
                placeholderTextColor="#94A3B8"
                style={{ flex: 1, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: fonts.medium, textTransform: "uppercase" }}
                value={inputReferralCode}
                onChangeText={setInputReferralCode}
                disabled={appliedReferral}
              />
              <Pressable
                onPress={handleApplyReferralCode}
                disabled={appliedReferral}
                style={{ backgroundColor: appliedReferral ? "#94A3B8" : "#0A6836", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, justifyContent: "center" }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: "#FFFFFF" }}>{appliedReferral ? "Applied ✓" : "Apply Code"}</Text>
              </Pressable>
            </View>
          </View>

          {copiedToast ? (
            <View style={styles.copiedToastPill}>
              <Feather name="check" size={12} color="#2E7D32" style={{ marginRight: 4 }} />
              <Text style={styles.copiedToastText}>Copied to clipboard!</Text>
            </View>
          ) : null}
        </View>

        {/* 4.5. Coin Conversion & Converted Referral Rewards Card */}
        <View style={styles.coinConvCard}>
          <View style={styles.coinConvHeaderRow}>
            <View style={styles.coinIconWrap}>
              <MaterialCommunityIcons name="coins" size={22} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coinConvTitle}>500 Coins = ₹100 Cash Conversion</Text>
              <Text style={styles.coinConvSub}>20 Coins per referral code • 500 Coins = ₹100 Cash • ₹300 per successful course refer</Text>
            </View>
          </View>

          <View style={styles.coinProgressRow}>
            <Text style={styles.coinProgressText}>Current Balance: <Text style={{ fontFamily: fonts.bold, color: "#10B981" }}>{walletData.tcmCoins} Coins</Text></Text>
            <Text style={styles.coinReqText}>Target: 500 Coins = ₹100.00</Text>
          </View>

          <Pressable
            onPress={handleConvertCoins}
            disabled={actionSubmitting}
            style={[
              styles.convertCoinsBtn,
              walletData.tcmCoins < 500 && { backgroundColor: "#94A3B8" }
            ]}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.convertCoinsBtnText}>
              {walletData.tcmCoins >= 500 ? "Convert 500 Coins to ₹100 Cash" : `Need ${Math.max(0, 500 - walletData.tcmCoins)} More Coins to Convert`}
            </Text>
          </Pressable>

          {/* Course Purchase Eligibility & Discount Banner */}
          <View style={{ marginTop: 14, backgroundColor: "#E8F5E9", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#C8E6C9" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <MaterialCommunityIcons name="school-outline" size={18} color="#0A6836" />
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#0A6836" }}>Eligible for New Course Purchase 🎓</Text>
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: "#1E293B", lineHeight: 17 }}>
              Aap apne converted wallet cash (<Text style={{ fontFamily: fonts.bold, color: "#0A6836" }}>₹{walletData.availableBalance.toFixed(2)}</Text>) se naye TCM Courses purchase kar sakte hain ya instant course discount claim kar sakte hain!
            </Text>
          </View>
        </View>

        {/* Referral Tracking List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Referrals Track History</Text>
          <Text style={styles.viewAllText}>{walletData.referrals?.length || 0} Referred</Text>
        </View>

        {Array.isArray(walletData.referrals) && walletData.referrals.length > 0 ? (
          <View style={styles.referralsList}>
            {walletData.referrals.map((ref) => (
              <View key={ref.id || Math.random()} style={styles.refRowItem}>
                <View style={styles.refAvatarWrap}>
                  <Text style={styles.refAvatarText}>{ref.name?.[0]?.toUpperCase() || "U"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.refNameText}>{ref.name}</Text>
                  <Text style={styles.refDateText}>{ref.date || "Recently"}</Text>
                </View>
                <View style={styles.refBadgeCol}>
                  <View style={[styles.refBadgePill, ref.status === "Converted" ? { backgroundColor: "#F0EDFF" } : { backgroundColor: "#ECFDF5" }]}>
                    <Text style={[styles.refBadgeText, ref.status === "Converted" ? { color: "#0A6836" } : { color: "#10B981" }]}>
                      {ref.status === "Converted" ? "Converted (+₹500)" : "Joined (+10 Coins)"}
                    </Text>
                  </View>
                  {ref.status !== "Converted" && (
                    <Pressable onPress={() => handleClaimConvertedReferral(ref.id, ref.name)} style={styles.claimBonusBtn}>
                      <Text style={styles.claimBonusText}>Claim ₹500 Bonus</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyRefCard}>
            <MaterialCommunityIcons name="account-group-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyRefText}>No referrals tracked yet</Text>
            <Text style={styles.emptyRefSub}>Share your code {referralCode} to get 10 coins per join & ₹500 on converted referrals!</Text>
          </View>
        )}

        {/* 5. Recent Transactions Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable onPress={() => Alert.alert("Transactions History", "Showing all recent wallet transactions.")}>
            <Text style={styles.viewAllText}>View All →</Text>
          </Pressable>
        </View>

        {walletData.transactions && walletData.transactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {walletData.transactions.map((tx) => (
              <View key={tx.id} style={styles.txRowItem}>
                <View style={[styles.txIconBox, { backgroundColor: tx.iconBg }]}>
                  <MaterialCommunityIcons name={tx.icon} size={18} color={tx.iconColor} />
                </View>

                <View style={styles.txMainInfo}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txSub}>{tx.subtitle}</Text>
                </View>

                <View style={styles.txRightCol}>
                  <Text style={[styles.txAmount, tx.type === "credit" ? styles.creditText : styles.debitText]}>
                    {tx.amount}
                  </Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTxCard}>
            <MaterialCommunityIcons name="history" size={32} color="#9E9EB2" />
            <Text style={styles.emptyTxTitle}>No Recent Transactions</Text>
            <Text style={styles.emptyTxSub}>Your wallet history will appear here once you add funds or withdraw earnings.</Text>
          </View>
        )}

        {/* 6. How it Works? Section */}
        <Text style={styles.sectionTitle}>How it Works?</Text>
        <View style={styles.stepsGrid}>
          {/* Step 1 */}
          <View style={styles.stepCard}>
            <View style={styles.stepIconWrap}>
              <Feather name="users" size={20} color="#0A6836" />
            </View>
            <Text style={styles.stepNumTitle}>1. Refer</Text>
            <Text style={styles.stepSubText}>Invite your friends to TCM Academy</Text>
          </View>

          {/* Step 2 */}
          <View style={styles.stepCard}>
            <View style={styles.stepIconWrap}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#FFB800" />
            </View>
            <Text style={styles.stepNumTitle}>2. Earn</Text>
            <Text style={styles.stepSubText}>You earn coins on successful referrals</Text>
          </View>

          {/* Step 3 */}
          <View style={styles.stepCard}>
            <View style={styles.stepIconWrap}>
              <MaterialCommunityIcons name="wallet-outline" size={20} color="#0A6836" />
            </View>
            <Text style={styles.stepNumTitle}>3. Redeem</Text>
            <Text style={styles.stepSubText}>Convert coins to cash and withdraw</Text>
          </View>
        </View>
      </ScrollView>

      {/* Withdraw Funds Modal */}
      <Modal visible={withdrawModalOpen} transparent animationType="slide" onRequestClose={() => setWithdrawModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Withdraw Funds</Text>
                <Pressable onPress={() => setWithdrawModalOpen(false)}>
                  <Feather name="x" size={20} color="#181725" />
                </Pressable>
              </View>

              {/* Maintenance Warning Banner */}
              <View style={{ backgroundColor: "#FEF3C7", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#FDE68A", marginBottom: 14 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#92400E", marginBottom: 3 }}>Withdrawal Gateway Under Maintenance</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: "#78350F", lineHeight: 17 }}>
                  Automated payout gateway is currently undergoing maintenance. Send your withdrawal request on WhatsApp to <Text style={{ fontWeight: "700" }}>9238695500</Text> for instant direct UPI transfer.
                </Text>
              </View>

              <Text style={styles.modalSubText}>
                Available balance for withdrawal:{" "}
                <Text style={{ fontFamily: fonts.bold, color: "#2E7D32" }}>
                  ₹{walletData.availableBalance.toFixed(2)}
                </Text>
              </Text>

              <Text style={styles.inputLabel}>Enter Amount (₹):</Text>
              <TextInput
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="e.g. 500"
                placeholderTextColor="#A0A0B8"
                keyboardType="numeric"
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Enter UPI ID / Bank Details:</Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                placeholder="e.g. name@upi or Account No."
                placeholderTextColor="#A0A0B8"
                style={styles.modalInput}
              />

              <TouchableOpacity onPress={handleWithdrawWhatsApp} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#0F172A", paddingVertical: 14, borderRadius: 14, marginTop: 8 }}>
                <FontAwesome5 name="whatsapp" size={18} color="#25D366" style={{ marginRight: 8 }} />
                <Text style={styles.modalSubmitBtnText}>Withdraw via WhatsApp (9238695500) 💬</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Money Modal */}
      <Modal visible={addMoneyModalOpen} transparent animationType="slide" onRequestClose={() => setAddMoneyModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Add Money to Wallet</Text>
                <Pressable onPress={() => setAddMoneyModalOpen(false)}>
                  <Feather name="x" size={20} color="#181725" />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Enter Amount to Add (₹):</Text>
              <TextInput
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder="e.g. 500"
                placeholderTextColor="#A0A0B8"
                keyboardType="numeric"
                style={styles.modalInput}
              />

              <View style={styles.quickPillsRow}>
                {[100, 500, 1000, 2000].map((amt) => (
                  <Pressable key={amt} onPress={() => setAddAmount(amt.toString())} style={styles.quickPill}>
                    <Text style={styles.quickPillText}>+ ₹{amt}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={handleAddMoneySubmit} style={styles.modalSubmitBtn}>
                <Text style={styles.modalSubmitBtnText}>Proceed to Pay with UPI</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    marginTop: 2,
    borderWidth: 0
  },
  backBtn: {
    padding: 4
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#181725"
  },
  helpBtn: {
    padding: 4
  },

  scrollContent: {
    paddingBottom: 120
  },

  // Purple Balance Card
  balanceCard: {
    backgroundColor: "#4323D3",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...shadow.medium
  },
  balanceCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  balanceInfoCol: {
    flex: 1
  },
  balanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  balanceLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)"
  },
  totalBalanceAmount: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: "#FFFFFF",
    marginBottom: 10
  },
  availLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)"
  },
  availAmount: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#FFFFFF",
    marginTop: 1
  },

  walletGraphicWrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  walletIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  coinBadgeFloating1: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFC107",
    alignItems: "center",
    justifyContent: "center"
  },
  coinBadgeFloating2: {
    position: "absolute",
    bottom: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFCA28",
    alignItems: "center",
    justifyContent: "center"
  },
  coinBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5D4037"
  },

  balanceActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  withdrawBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 12
  },
  withdrawBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#4B2BE3"
  },
  addMoneyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)"
  },
  addMoneyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#FFFFFF"
  },

  // 4-Column Metrics Card
  metricsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  metricCol: {
    flex: 1,
    alignItems: "center"
  },
  metricLabel: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: "#7C7C9A",
    marginBottom: 4,
    textAlign: "center"
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  earnedVal: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#2E7D32",
    marginRight: 3
  },
  withdrawnVal: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#D32F2F",
    marginRight: 3
  },
  coinsVal: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725"
  },
  pendingVal: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#2F79B9",
    marginRight: 3
  },

  arrowUpBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center"
  },
  arrowDownBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center"
  },
  coinCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFC107",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4
  },
  coinSymbol: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: "#5D4037"
  },
  clockBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center"
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#F0EFFF"
  },

  // Referral Card
  referralCard: {
    backgroundColor: "#F5F3FF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EBE5FF",
    position: "relative"
  },
  referralCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    marginBottom: 10
  },
  referralMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  referralLeftCol: {
    width: "44%"
  },
  dashedCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#0A6836",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8
  },
  referralCodeText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#0A6836",
    letterSpacing: 0.5
  },
  referralRightCol: {
    flex: 1,
    marginLeft: 10
  },
  referralInviteText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#55556A",
    lineHeight: 14,
    marginBottom: 8
  },
  shareEarnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A6836",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  shareEarnBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#FFFFFF"
  },
  giftGraphicWrap: {
    position: "absolute",
    right: 4,
    top: -20,
    opacity: 0.25
  },
  copiedToastPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8
  },
  copiedToastText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#2E7D32"
  },

  // Transactions Section
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725"
  },
  viewAllText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#0A6836"
  },
  transactionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  emptyTxCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  emptyTxTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725",
    marginTop: 8
  },
  emptyTxSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 15
  },
  txRowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F7FF"
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  txMainInfo: {
    flex: 1
  },
  txTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  txSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 1
  },
  txRightCol: {
    alignItems: "flex-end"
  },
  txAmount: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  creditText: {
    color: "#2E7D32"
  },
  debitText: {
    color: "#D32F2F"
  },
  txDate: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A",
    marginTop: 2
  },

  // Steps Grid (How it works)
  stepsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
    marginTop: 8
  },
  stepCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  stepIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  stepNumTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725",
    marginBottom: 2
  },
  stepSubText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A",
    textAlign: "center",
    lineHeight: 12
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },

  // Coin Conversion & Referrals List Styles
  coinConvCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...shadow.soft
  },
  coinConvHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10
  },
  coinIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center"
  },
  coinConvTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  coinConvSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  coinProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10
  },
  coinProgressText: {
    fontSize: 12,
    color: "#334155"
  },
  coinReqText: {
    fontSize: 11,
    color: "#64748B"
  },
  convertCoinsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 12
  },
  convertCoinsBtnText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  referralsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 10
  },
  refRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  refAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0A6836",
    alignItems: "center",
    justifyContent: "center"
  },
  refAvatarText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 14
  },
  refNameText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: "#0F172A"
  },
  refDateText: {
    fontSize: 11,
    color: "#64748B"
  },
  refBadgeCol: {
    alignItems: "flex-end",
    gap: 4
  },
  refBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  refBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold
  },
  claimBonusBtn: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DDD6FE"
  },
  claimBonusText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: "#0A6836"
  },
  emptyRefCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  emptyRefText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#475569",
    marginTop: 6
  },
  emptyRefSub: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: "#181725"
  },
  modalSubText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    marginBottom: 14
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#181725",
    marginBottom: 6,
    marginTop: 6
  },
  modalInput: {
    backgroundColor: "#F8F7FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#181725",
    borderWidth: 1,
    borderColor: "#EBEAFA",
    marginBottom: 10
  },
  quickPillsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14
  },
  quickPill: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0D7FF"
  },
  quickPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#0A6836"
  },
  modalSubmitBtn: {
    backgroundColor: "#0A6836",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    ...shadow.soft
  },
  modalSubmitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  }
});
