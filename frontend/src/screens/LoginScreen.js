import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Decorations from "../components/Decorations";
import TcmLogo from "../components/TcmLogo";
import { login, register } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

const roleOptions = [
  {
    key: "student",
    title: "Student",
    loginTitle: "Student Login",
    subtitle: "Learn & Grow",
    loginSubtitle: "Continue as a student",
    icon: "school",
    color: "#7357F6"
  },
  {
    key: "mentor",
    title: "Mentor",
    loginTitle: "Mentor Login",
    subtitle: "Teach & Inspire",
    loginSubtitle: "Continue as mentor",
    icon: "person",
    color: "#28A745"
  },
  {
    key: "admin",
    title: "Admin",
    loginTitle: "Admin Login",
    subtitle: "Manage & Support",
    loginSubtitle: "Continue as admin",
    icon: "shield-checkmark",
    color: "#3478F6"
  }
];

export default function LoginScreen({ onLogin }) {
  const { width, height } = useWindowDimensions();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("student");
  const [mentorCategory, setMentorCategory] = useState("TCM Information Tech");
  const [secure, setSecure] = useState(true);
  const [confirmSecure, setConfirmSecure] = useState(true);

  const mentorCategoryOptions = [
    { key: "TCM Information Tech", label: "TCM Information Tech", desc: "Coding, MERN, AI, DevOps", icon: "laptop-mac", color: "#5B3CF5" },
    { key: "TCM Academy", label: "TCM Academy", desc: "NEET, JEE, Boards", icon: "school", color: "#2E7D32" },
    { key: "TCM Government", label: "TCM Government", desc: "UPSC, SSC CGL, Banking, Railway", icon: "bank", color: "#2F79B9" }
  ];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "student@tcm.com",
    mobile: "",
    password: "password123",
    confirmPassword: ""
  });

  const compact = height < 740;
  const panelMaxWidth = Math.min(width - 24, 440);
  const activeRole = useMemo(() => roleOptions.find((item) => item.key === role) || roleOptions[0], [role]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openSignup(nextRole = "student") {
    setRole(nextRole);
    setMode(nextRole === "mentor" ? "mentor" : "signup");
  }

  async function submitLogin() {
    setLoading(true);
    try {
      const session = await login(form.email.trim(), form.password);
      onLogin(session);
    } catch (error) {
      Alert.alert("Login failed", error.message || "Could not load live account data from backend.");
    } finally {
      setLoading(false);
    }
  }

  async function submitSignup() {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      Alert.alert("Missing details", "Please fill in name, email, and password.");
      return;
    }

    if (form.confirmPassword && form.password !== form.confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const session = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: mode === "mentor" ? "mentor" : role,
        mentorCategory
      });
      onLogin(session);
    } catch (error) {
      Alert.alert("Signup failed", error.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  if (mode !== "login") {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[styles.authScroll, { minHeight: height + 1 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Decorations />
          <Pressable hitSlop={12} onPress={() => setMode("login")} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={colors.ink} />
          </Pressable>

          <View style={[styles.signupWrap, { maxWidth: panelMaxWidth }]}>
            <TcmLogo compact />
            <Text style={styles.signupTitle}>{mode === "mentor" ? "Mentor Sign Up" : "Create Your Account"}</Text>
            <Text style={styles.signupSub}>
              {mode === "mentor" ? "Join as a mentor and inspire the future" : "Join TCM and start your learning journey"}
            </Text>

            {mode === "mentor" ? <MentorIntro /> : <RoleTabs role={role} setRole={setRole} setMode={setMode} />}

            <Text style={styles.blockTitle}>{mode === "mentor" ? "Select Your Specialization Category:" : ""}</Text>
            {mode === "mentor" ? (
              <View style={{ marginBottom: 14, marginTop: 4 }}>
                {mentorCategoryOptions.map((cat) => {
                  const selected = mentorCategory === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => setMentorCategory(cat.key)}
                      style={[
                        styles.mentorCatChoiceCard,
                        selected && { borderColor: cat.color, backgroundColor: "#F9F8FF" }
                      ]}
                    >
                      <View style={[styles.mentorCatIconWrap, { backgroundColor: selected ? cat.color : "#F0EDFF" }]}>
                        <MaterialCommunityIcons name={cat.icon} size={18} color={selected ? "#FFFFFF" : cat.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.mentorCatTitle, selected && { color: cat.color, fontFamily: fonts.bold }]}>
                          {cat.label}
                        </Text>
                        <Text style={styles.mentorCatDesc}>{cat.desc}</Text>
                      </View>
                      {selected ? <Feather name="check-circle" size={16} color={cat.color} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <Input icon="user" placeholder="Full Name" value={form.name} onChangeText={(value) => updateField("name", value)} />
            <Input
              autoCapitalize="none"
              icon="mail"
              keyboardType="email-address"
              placeholder="Email Address"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
            />
            <Input
              icon="phone"
              keyboardType="phone-pad"
              leftExtra="+91"
              placeholder="Mobile Number"
              value={form.mobile}
              onChangeText={(value) => updateField("mobile", value)}
            />
            <Input
              icon="lock"
              placeholder="Create Password"
              secureTextEntry={secure}
              value={form.password}
              onChangeText={(value) => updateField("password", value)}
              rightIcon={secure ? "eye" : "eye-off"}
              onRightPress={() => setSecure((value) => !value)}
            />
            <Input
              icon="lock"
              placeholder="Confirm Password"
              secureTextEntry={confirmSecure}
              value={form.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              rightIcon={confirmSecure ? "eye" : "eye-off"}
              onRightPress={() => setConfirmSecure((value) => !value)}
            />

            {mode === "signup" ? (
              <View style={styles.termsRow}>
                <Ionicons name="checkbox" size={17} color={colors.primary} />
                <Text style={styles.termsText}>I agree to the Terms & Conditions and Privacy Policy</Text>
              </View>
            ) : null}

            <Pressable disabled={loading} onPress={submitSignup} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryText}>{loading ? "Please wait..." : mode === "mentor" ? "Continue" : "Sign Up"}</Text>
            </Pressable>

            <Divider label="or sign up with" />
            <SocialRow wide />

            <Text style={styles.switchText}>
              Already have an account?{" "}
              <Text onPress={() => setMode("login")} style={styles.link}>Login</Text>
            </Text>
          </View>
          <View style={styles.footerWave} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { minHeight: height + 1 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Decorations />
        <View style={[styles.hero, compact && styles.heroCompact]}>
          <TcmLogo compact />
          <Text style={styles.tagline}>
            Learn. Grow. Achieve.{"\n"}Your <Text style={styles.future}>Future</Text> Starts Here.
          </Text>
        </View>

        <View style={[styles.panel, { maxWidth: panelMaxWidth }]}>
          <Text style={styles.heading}>Welcome Back!</Text>
          <Text style={styles.subheading}>Login to continue your learning journey</Text>

          <Input
            autoCapitalize="none"
            icon="mail"
            keyboardType="email-address"
            placeholder="Email Address"
            value={form.email}
            onChangeText={(value) => updateField("email", value)}
          />
          <Input
            icon="lock"
            placeholder="Password"
            secureTextEntry={secure}
            value={form.password}
            onChangeText={(value) => updateField("password", value)}
            rightIcon={secure ? "eye" : "eye-off"}
            onRightPress={() => setSecure((value) => !value)}
          />

          <Pressable style={styles.forgot}>
            <Text style={styles.link}>Forgot Password?</Text>
          </Pressable>

          <Pressable disabled={loading} onPress={submitLogin} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{loading ? "Logging in..." : "Login"}</Text>
          </Pressable>

          <Divider label="or continue with" />
          <SocialRow />
          <Divider label="or login as" />

          <View style={styles.roles}>
            {roleOptions.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setRole(item.key)}
                style={({ pressed }) => [
                  styles.roleCard,
                  role === item.key && styles.roleCardActive,
                  pressed && styles.pressed
                ]}
              >
                <View style={[styles.roleIcon, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <Text numberOfLines={1} style={styles.roleTitle}>{item.loginTitle}</Text>
                <Text numberOfLines={2} style={styles.roleSubtitle}>{item.loginSubtitle}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primaryDark} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.switchText}>
            Don't have an account?{" "}
            <Text onPress={() => openSignup(activeRole.key)} style={styles.link}>Sign Up</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleTabs({ role, setRole, setMode }) {
  return (
    <View style={styles.roleTabs}>
      {roleOptions.map((item) => {
        const active = role === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => {
              setRole(item.key);
              setMode(item.key === "mentor" ? "mentor" : "signup");
            }}
            style={[styles.roleTab, active && styles.roleTabActive]}
          >
            <View style={[styles.roleTabIcon, { backgroundColor: `${item.color}18` }]}>
              <Ionicons name={item.icon} size={21} color={item.color} />
            </View>
            <View style={styles.roleTabTextWrap}>
              <Text numberOfLines={1} style={styles.roleTabTitle}>{item.title}</Text>
              <Text numberOfLines={1} style={styles.roleTabSub}>{item.subtitle}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function MentorIntro() {
  return (
    <View style={styles.mentorIntro}>
      <View style={styles.mentorAvatar}>
        <View style={styles.mentorHair} />
        <View style={styles.mentorFace} />
        <View style={styles.mentorBody} />
      </View>
      <View style={styles.mentorIntroCopy}>
        <Text style={styles.mentorIntroTitle}>Make an Impact</Text>
        <Text style={styles.mentorIntroText}>Share your knowledge, guide students and build a better tomorrow.</Text>
      </View>
      <View style={styles.mentorBadge}>
        <Ionicons name="school" size={20} color={colors.primary} />
      </View>
    </View>
  );
}

function Input({ icon, leftExtra, rightIcon, onRightPress, style, ...props }) {
  return (
    <View style={[styles.inputWrap, style]}>
      <Feather name={icon} size={17} color={colors.muted} />
      {leftExtra ? <Text style={styles.leftExtra}>{leftExtra}</Text> : null}
      <TextInput
        placeholderTextColor="#9692AF"
        style={styles.input}
        {...props}
      />
      {rightIcon ? (
        <Pressable hitSlop={10} onPress={onRightPress}>
          <Feather name={rightIcon} size={17} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SocialRow({ wide = false }) {
  return (
    <View style={styles.socialRow}>
      <Pressable style={styles.socialButton}>
        <FontAwesome name="google" size={18} color="#4285F4" />
        <Text numberOfLines={1} style={styles.socialText}>{wide ? "Continue with Google" : "Google"}</Text>
      </Pressable>
      <Pressable style={styles.socialButton}>
        <FontAwesome name="apple" size={21} color="#050505" />
        <Text numberOfLines={1} style={styles.socialText}>{wide ? "Continue with Apple" : "Apple"}</Text>
      </Pressable>
    </View>
  );
}

function Divider({ label }) {
  return (
    <View style={styles.divider}>
      <View style={styles.rule} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#FBFAFF",
    flex: 1
  },
  scroll: {
    alignItems: "center",
    flexGrow: 1,
    paddingTop: 26
  },
  authScroll: {
    alignItems: "center",
    flexGrow: 1,
    paddingBottom: 34,
    paddingHorizontal: 14,
    paddingTop: 22
  },
  backButton: {
    left: 18,
    position: "absolute",
    top: 34,
    zIndex: 2
  },
  hero: {
    alignItems: "center",
    paddingBottom: 24,
    width: "100%"
  },
  heroCompact: {
    paddingBottom: 14,
    transform: [{ scale: 0.92 }]
  },
  tagline: {
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center"
  },
  future: {
    color: colors.primary,
    fontFamily: fonts.bold
  },
  panel: {
    ...shadow,
    alignSelf: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 22,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 24,
    width: "100%"
  },
  signupWrap: {
    alignSelf: "center",
    paddingBottom: 16,
    paddingTop: 26,
    width: "100%",
    zIndex: 1
  },
  signupTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 14,
    textAlign: "center"
  },
  signupSub: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: 16,
    marginTop: 4,
    textAlign: "center"
  },
  heading: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    lineHeight: 26
  },
  subheading: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: 18,
    marginTop: 4
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    height: 46,
    marginBottom: 12,
    paddingHorizontal: 12,
    width: "100%"
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginLeft: 10,
    paddingVertical: 0
  },
  leftExtra: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginLeft: 9
  },
  forgot: {
    alignSelf: "flex-end",
    marginBottom: 14,
    marginTop: -2
  },
  link: {
    color: colors.primary,
    fontFamily: fonts.bold
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 7,
    height: 48,
    justifyContent: "center",
    width: "100%"
  },
  pressed: {
    opacity: 0.82
  },
  primaryText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 14
  },
  divider: {
    alignItems: "center",
    flexDirection: "row",
    marginVertical: 17,
    width: "100%"
  },
  rule: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1
  },
  dividerText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    marginHorizontal: 12
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%"
  },
  socialButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 42,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 8
  },
  socialText: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 11,
    marginLeft: 9
  },
  roles: {
    flexDirection: "row",
    gap: 10,
    width: "100%"
  },
  roleCard: {
    alignItems: "center",
    backgroundColor: "#F7F5FF",
    borderColor: "transparent",
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    minHeight: 105,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 9
  },
  roleCardActive: {
    backgroundColor: "#F3F0FF",
    borderColor: colors.primary
  },
  mentorCatChoiceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#EBEAFA",
    gap: 10
  },
  mentorCatIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  mentorCatTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#181725"
  },
  mentorCatDesc: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 1
  },
  roleIcon: {
    alignItems: "center",
    borderRadius: 26,
    height: 42,
    justifyContent: "center",
    marginBottom: 7,
    width: 42
  },
  roleTitle: {
    color: colors.primaryDark,
    fontFamily: fonts.bold,
    fontSize: 10,
    textAlign: "center",
    width: "100%"
  },
  roleSubtitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 8,
    lineHeight: 12,
    marginTop: 2,
    textAlign: "center"
  },
  switchText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 18,
    textAlign: "center"
  },
  roleTabs: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.lavenderLine,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginBottom: 18,
    padding: 5,
    width: "100%"
  },
  roleTab: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    minHeight: 50,
    minWidth: 0,
    paddingHorizontal: 6
  },
  roleTabActive: {
    backgroundColor: "#F4F0FF",
    borderColor: colors.primary
  },
  roleTabIcon: {
    alignItems: "center",
    borderRadius: 20,
    height: 34,
    justifyContent: "center",
    marginRight: 6,
    width: 34
  },
  roleTabTextWrap: {
    flex: 1,
    minWidth: 0
  },
  roleTabTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 10
  },
  roleTabSub: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 8
  },
  blockTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 4
  },
  blockSub: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    marginBottom: 10,
    marginTop: 2
  },
  termsRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
    marginTop: -2
  },
  termsText: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 9,
    marginLeft: 6
  },
  mentorIntro: {
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    borderRadius: 9,
    flexDirection: "row",
    marginBottom: 16,
    minHeight: 88,
    padding: 12,
    width: "100%"
  },
  mentorAvatar: {
    alignItems: "center",
    height: 64,
    justifyContent: "flex-end",
    marginRight: 12,
    width: 60
  },
  mentorHair: {
    backgroundColor: "#1F2750",
    borderRadius: 16,
    height: 25,
    position: "absolute",
    top: 3,
    width: 36
  },
  mentorFace: {
    backgroundColor: "#F0B27B",
    borderRadius: 14,
    height: 28,
    marginBottom: -4,
    width: 28,
    zIndex: 1
  },
  mentorBody: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 31,
    width: 48
  },
  mentorIntroCopy: {
    flex: 1
  },
  mentorIntroTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  mentorIntroText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3
  },
  mentorBadge: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginLeft: 8,
    width: 36
  },
  footerWave: {
    backgroundColor: "#DCD3FF",
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
    bottom: -55,
    height: 92,
    left: -40,
    opacity: 0.8,
    position: "absolute",
    right: -40
  }
});
