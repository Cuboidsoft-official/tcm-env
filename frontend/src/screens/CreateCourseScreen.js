import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { generateSyllabusWithAI } from "../api/gemini";
import { createCourse, updateCourse } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

function safeImageUri(url, fallback = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=80") {
  if (!url || typeof url !== "string") return fallback;
  if (url.startsWith("blob:") || url.includes("blob:http")) return fallback;
  return url;
}

export default function CreateCourseScreen({ session, user = {}, courseToEdit = null, onBack, onCourseCreated }) {
  const { theme } = useTheme();
  const isEditing = Boolean(courseToEdit);
  // Locked Mentor Category (assigned during signup/profile)
  const assignedCategory = courseToEdit?.category || user.mentorCategory || user.category || "TCM Information Tech";
  
  const [title, setTitle] = useState(courseToEdit?.title || "");
  const [subtitle, setSubtitle] = useState(courseToEdit?.subtitle || "");
  const [level, setLevel] = useState(courseToEdit?.level || "All Levels");
  const [price, setPrice] = useState((courseToEdit?.price || "1,499").replace("₹", ""));
  const [duration, setDuration] = useState(courseToEdit?.duration || "20 Days");
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState(courseToEdit?.duration || "");
  const [coverImageUrl, setCoverImageUrl] = useState(safeImageUri(courseToEdit?.imageUrl || courseToEdit?.image));
  const [customImageInput, setCustomImageInput] = useState("");
  const [showCustomImageInput, setShowCustomImageInput] = useState(false);
  
  // Syllabus State (Normalize modules array containing lessons)
  const initialModules = (courseToEdit?.modules && courseToEdit.modules.length > 0)
    ? courseToEdit.modules.map((m, idx) => ({
        id: m.id || `m_${idx + 1}_${Date.now()}`,
        title: m.title || (m.dayNum ? `${m.dayNum}: ${m.topic}` : `Day ${idx + 1}: ${m.topic || "Core Topic"}`),
        lessons: Array.isArray(m.lessons) && m.lessons.length > 0
          ? m.lessons
          : [
              `Lesson ${idx + 1}.1: Introduction & Fundamentals`,
              `Lesson ${idx + 1}.2: Live Coding & Application Setup`,
              `Lesson ${idx + 1}.3: Hands-on Practice & Q&A`
            ]
      }))
    : [
        {
          id: "m1",
          title: "Day 1: Environment Setup & Foundations",
          lessons: [
            "Lesson 1.1: Tooling & IDE Configuration",
            "Lesson 1.2: Essential Building Blocks",
            "Lesson 1.3: Hands-on Lab: Building Live Feature"
          ]
        }
      ];

  const [modules, setModules] = useState(initialModules);

  const [generatingAI, setGeneratingAI] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Category Icon Mapping
  const getCategoryMeta = (catKey) => {
    if (catKey.includes("Academy")) {
      return { label: "TCM Academy", icon: "school", color: "#2E7D32", bg: "#ECF9E9" };
    }
    if (catKey.includes("Government")) {
      return { label: "TCM Government", icon: "bank", color: "#2F79B9", bg: "#EAF5FF" };
    }
    if (catKey.includes("Career")) {
      return { label: "TCM Career", icon: "briefcase", color: "#E76F51", bg: "#FFF2EE" };
    }
    return { label: "TCM Information Tech", icon: "laptop-mac", color: "#5B3CF5", bg: "#F0EDFF" };
  };

  const catMeta = getCategoryMeta(assignedCategory);

  const levelsList = ["Beginner", "Intermediate", "Advanced", "All Levels"];
  const durationOptions = ["20 Days", "30 Days", "45 Days", "4 Weeks", "8 Weeks", "Custom"];
  const presetCovers = [
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=640&q=80",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=640&q=80"
  ];

  // Deep Duration-Based AI Syllabus Generator
  async function handleAutoGenerateSyllabus() {
    if (!title.trim()) {
      Alert.alert("Course Title Required", "Please enter a Course Title first so the AI can generate a deep curriculum.");
      return;
    }

    setGeneratingAI(true);
    try {
      const generatedModules = await generateSyllabusWithAI(title.trim(), assignedCategory, duration);
      if (generatedModules && generatedModules.length > 0) {
        const dayWiseModules = generatedModules.map((m, idx) => {
          let topicTitle = m.title || `Topic ${idx + 1}`;
          topicTitle = topicTitle.replace(/^(Module|Phase|Week)\s*\d+[^:]*:\s*/i, "");
          if (!topicTitle.toLowerCase().startsWith("day")) {
            topicTitle = `Day ${idx + 1}: ${topicTitle}`;
          }
          return {
            ...m,
            id: m.id || `m_${idx + 1}`,
            title: topicTitle
          };
        });
        setModules(dayWiseModules);
        Alert.alert("Day-by-Day Syllabus Generated!", `AI generated a Day-by-Day syllabus for "${title.trim()}"!`);
      }
    } catch (err) {
      Alert.alert("AI Generation Error", err.message || "Failed to generate syllabus.");
    } finally {
      setGeneratingAI(false);
    }
  }

  // Gallery Image Picker
  async function handlePickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow gallery access to upload a course cover picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const pickedUri = result.assets[0].uri;
        const validCoverUri = pickedUri.startsWith("blob:")
          ? "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=80"
          : pickedUri;
        setCoverImageUrl(validCoverUri);
        Alert.alert("Picture Uploaded", "Course cover picture updated successfully!");
      }
    } catch (err) {
      Alert.alert("Upload Error", "Could not select image from gallery.");
    }
  }

  // Handle Custom Cover Image URL
  function handleApplyCustomImage() {
    if (!customImageInput.trim()) {
      Alert.alert("Image URL Required", "Please enter a valid image URL.");
      return;
    }
    setCoverImageUrl(customImageInput.trim());
    setShowCustomImageInput(false);
    Alert.alert("Image Updated", "Course cover picture updated successfully.");
  }

  // Add / Edit Module & Lesson Functions
  function handleAddModule() {
    const nextDayNum = modules.length + 1;
    const newModId = `m${nextDayNum}`;
    setModules((prev) => [
      ...prev,
      {
        id: newModId,
        title: `Day ${nextDayNum}: New Practical Day Topic`,
        lessons: ["Lesson 1: Introduction & Fundamentals", "Lesson 2: Live Practical Setup"]
      }
    ]);
  }

  function handleRemoveModule(modId) {
    if (modules.length <= 1) {
      Alert.alert("Action Not Allowed", "Course must contain at least 1 module.");
      return;
    }
    setModules((prev) => prev.filter((m) => m.id !== modId));
  }

  function handleUpdateModuleTitle(modId, newTitle) {
    setModules((prev) =>
      prev.map((m) => (m.id === modId ? { ...m, title: newTitle } : m))
    );
  }

  function handleAddLesson(modId) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === modId) {
          const nextLessonNum = (m.lessons?.length || 0) + 1;
          return {
            ...m,
            lessons: [...(m.lessons || []), `Lesson ${nextLessonNum}: New Practical Lesson Topic`]
          };
        }
        return m;
      })
    );
  }

  function handleRemoveLesson(modId, lessonIndex) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === modId) {
          const updated = [...m.lessons];
          updated.splice(lessonIndex, 1);
          return { ...m, lessons: updated };
        }
        return m;
      })
    );
  }

  function handleUpdateLessonText(modId, lessonIndex, text) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === modId) {
          const updated = [...m.lessons];
          updated[lessonIndex] = text;
          return { ...m, lessons: updated };
        }
        return m;
      })
    );
  }

  // Publish / Update Course to Backend
  async function handlePublishCourse() {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a course title.");
      return;
    }

    setPublishing(true);
    try {
      const coursePayload = {
        title: title.trim(),
        subtitle: subtitle.trim() || `Master ${title.trim()} under ${assignedCategory} with live guidance`,
        category: assignedCategory,
        level,
        price: price.startsWith("₹") ? price : `₹${price}`,
        duration,
        imageUrl: coverImageUrl,
        mentorName: user.name || "TCM Mentor",
        mentorRole: user.role || "TCM Educator",
        mentorAvatarUrl: user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        modules
      };

      const targetCourseId = courseToEdit?.id || courseToEdit?._id || courseToEdit?.customId;

      if (session?.token) {
        if (isEditing && targetCourseId) {
          await updateCourse(session.token, targetCourseId, coursePayload);
        } else {
          await createCourse(session.token, coursePayload);
        }
      }

      Alert.alert(isEditing ? "Course Updated!" : "Course Published Live!", `"${title.trim()}" has been ${isEditing ? "updated" : "published"} under ${assignedCategory}!`);
      if (onCourseCreated) onCourseCreated({ ...coursePayload, id: targetCourseId });
      if (onBack) onBack();
    } catch (err) {
      Alert.alert("Save Failed", err.message || "Could not save course to backend.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Header Bar */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Feather name="chevron-left" size={24} color={theme.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text }]}>{isEditing ? "Edit Course" : "Create Course"}</Text>

        <Pressable onPress={handlePublishCourse} disabled={publishing} style={[styles.publishHeaderBtn, { backgroundColor: theme.primary }]}>
          <Text style={styles.publishHeaderBtnText}>{publishing ? "Saving..." : "Publish"}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ============================================================ */}
        {/* 2. LOCKED CATEGORY CARD */}
        {/* ============================================================ */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.lockedHeaderRow}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>Your Assigned Specialization</Text>
            <View style={[styles.lockPill, { backgroundColor: theme.badgeBg }]}>
              <MaterialCommunityIcons name="lock-outline" size={12} color={theme.subtext} style={{ marginRight: 3 }} />
              <Text style={[styles.lockPillText, { color: theme.subtext }]}>Locked</Text>
            </View>
          </View>
          <Text style={[styles.inputSubLabel, { color: theme.subtext }]}>Category assigned during mentor registration (cannot be changed):</Text>

          <View style={[styles.lockedCategoryBox, { backgroundColor: theme.isDark ? "#1E293B" : catMeta.bg, borderColor: catMeta.color }]}>
            <View style={[styles.catIconBox, { backgroundColor: catMeta.color }]}>
              <MaterialCommunityIcons name={catMeta.icon} size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.catTitleText, { color: catMeta.color }]}>{catMeta.label}</Text>
              <Text style={[styles.catSubText, { color: theme.subtext }]}>Only courses for {catMeta.label} can be published from this account</Text>
            </View>
            <Feather name="check-circle" size={18} color={catMeta.color} />
          </View>
        </View>

        {/* ============================================================ */}
        {/* 3. COURSE DETAILS & PRICING */}
        {/* ============================================================ */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>Course Details & Pricing</Text>

          <Text style={[styles.inputLabel, { color: theme.text }]}>Course Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Advanced Full Stack AI Engineer 2026"
            placeholderTextColor={theme.subtext}
            style={[styles.textInput, { backgroundColor: theme.isDark ? "#1E293B" : "#F8F7FF", borderColor: theme.border, color: theme.text }]}
          />

          <Text style={[styles.inputLabel, { color: theme.text }]}>Subtitle / Description</Text>
          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="e.g. Master PyTorch, LLMs, & Fullstack React Native"
            placeholderTextColor={theme.subtext}
            style={[styles.textInput, { backgroundColor: theme.isDark ? "#1E293B" : "#F8F7FF", borderColor: theme.border, color: theme.text }]}
          />

          {/* Level Selector */}
          <Text style={[styles.inputLabel, { color: theme.text }]}>Target Level</Text>
          <View style={styles.pillsRow}>
            {levelsList.map((lvl) => (
              <Pressable
                key={lvl}
                onPress={() => setLevel(lvl)}
                style={[styles.pill, { backgroundColor: level === lvl ? theme.primary : theme.badgeBg, borderColor: level === lvl ? theme.primary : theme.border }]}
              >
                <Text style={[styles.pillText, { color: level === lvl ? "#FFFFFF" : theme.primary, fontFamily: level === lvl ? fonts.bold : fonts.medium }]}>{lvl}</Text>
              </Pressable>
            ))}
          </View>

          {/* Duration Selector */}
          <Text style={[styles.inputLabel, { color: theme.text }]}>Program Duration (e.g. 20 Days, 30 Days, 8 Weeks)</Text>
          <View style={styles.pillsRow}>
            {durationOptions.map((dur) => {
              const isSel = dur === "Custom" ? isCustomDuration : (!isCustomDuration && duration === dur);
              return (
                <Pressable
                  key={dur}
                  onPress={() => {
                    if (dur === "Custom") {
                      setIsCustomDuration(true);
                      if (customDuration) setDuration(customDuration);
                    } else {
                      setIsCustomDuration(false);
                      setDuration(dur);
                    }
                  }}
                  style={[styles.pill, { backgroundColor: isSel ? theme.primary : theme.badgeBg, borderColor: isSel ? theme.primary : theme.border }]}
                >
                  <Text style={[styles.pillText, { color: isSel ? "#FFFFFF" : theme.primary, fontFamily: isSel ? fonts.bold : fonts.medium }]}>{dur}</Text>
                </Pressable>
              );
            })}
          </View>

          {isCustomDuration ? (
            <View style={{ marginTop: 8 }}>
              <TextInput
                value={customDuration}
                onChangeText={(text) => {
                  setCustomDuration(text);
                  setDuration(text || "20 Days");
                }}
                placeholder="Type custom duration in days (e.g. 20 Days, 15 Days, 60 Days)"
                placeholderTextColor={theme.subtext}
                style={[styles.textInput, { backgroundColor: theme.isDark ? "#1E293B" : "#F8F7FF", borderColor: theme.border, color: theme.text }]}
              />
            </View>
          ) : null}

          {/* Price Input */}
          <Text style={[styles.inputLabel, { color: theme.text }]}>Course Price (₹)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="1,499"
            placeholderTextColor={theme.subtext}
            keyboardType="numeric"
            style={[styles.textInput, { backgroundColor: theme.isDark ? "#1E293B" : "#F8F7FF", borderColor: theme.border, color: theme.text }]}
          />

          {/* Cover Picture Section */}
          <Text style={[styles.inputLabel, { color: theme.text }]}>Course Cover Picture</Text>
          <View style={[styles.coverPreviewBox, { backgroundColor: theme.badgeBg }]}>
            <Image source={{ uri: safeImageUri(coverImageUrl) }} style={styles.coverImage} />
          </View>

          <View style={styles.coverActionsRow}>
            <Pressable onPress={handlePickImage} style={[styles.uploadImageBtn, { backgroundColor: theme.primary }]}>
              <MaterialCommunityIcons name="image-search" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.uploadImageBtnText}>Upload Image from Gallery</Text>
            </Pressable>

            <Pressable onPress={() => setShowCustomImageInput((prev) => !prev)} style={[styles.urlImageBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="link-variant" size={15} color={theme.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.urlImageBtnText, { color: theme.primary }]}>URL</Text>
            </Pressable>
          </View>

          {showCustomImageInput ? (
            <View style={styles.customImageWrap}>
              <TextInput
                value={customImageInput}
                onChangeText={setCustomImageInput}
                placeholder="Paste Image URL (https://...)"
                placeholderTextColor={theme.subtext}
                style={[styles.textInput, { backgroundColor: theme.isDark ? "#1E293B" : "#F8F7FF", borderColor: theme.border, color: theme.text }]}
              />
              <Pressable onPress={handleApplyCustomImage} style={[styles.applyImageBtn, { backgroundColor: theme.primary }]}>
                <Text style={styles.applyImageBtnText}>Apply Picture</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={[styles.inputSubLabel, { color: theme.subtext }]}>Or Choose Preset Banner:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {presetCovers.map((imgUrl, index) => (
              <Pressable key={index} onPress={() => setCoverImageUrl(imgUrl)} style={[styles.presetImageBtn, { borderColor: theme.border }]}>
                <Image source={{ uri: safeImageUri(imgUrl) }} style={styles.presetImage} />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* 4. DEEP AI CURRICULUM GENERATOR CARD */}
        {/* ============================================================ */}
        <View style={[styles.aiGenCard, { backgroundColor: theme.primary }]}>
          <View style={styles.aiHeaderRow}>
            <View style={styles.aiIconCircle}>
              <MaterialCommunityIcons name="sparkles" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiCardTitle}>Deep AI Curriculum Generator</Text>
              <Text style={styles.aiCardSub}>Generates comprehensive, multi-module syllabus tailored for {duration}</Text>
            </View>
          </View>

          <Pressable
            onPress={handleAutoGenerateSyllabus}
            disabled={generatingAI}
            style={({ pressed }) => [styles.aiGenerateBtn, pressed && styles.pressed]}
          >
            {generatingAI ? (
              <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
            ) : (
              <MaterialCommunityIcons name="auto-fix" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.aiGenerateBtnText}>
              {generatingAI ? "Generating Deep Curriculum..." : `Auto-Generate Syllabus (${duration})`}
            </Text>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* 5. EDITABLE SYLLABUS MODULES TREE */}
        {/* ============================================================ */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>Course Curriculum ({modules.length} Modules)</Text>
            <Pressable onPress={handleAddModule} style={[styles.addModuleBtn, { backgroundColor: theme.badgeBg }]}>
              <Feather name="plus" size={14} color={theme.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.addModuleBtnText, { color: theme.primary }]}>Add Module</Text>
            </Pressable>
          </View>

          {(modules || []).map((mod) => (
            <View key={mod.id || Math.random().toString()} style={[styles.moduleCard, { backgroundColor: theme.isDark ? "#1E293B" : "#F8F7FF", borderColor: theme.border }]}>
              {/* Module Header Title Input */}
              <View style={styles.modHeaderRow}>
                <TextInput
                  value={mod.title || (mod.dayNum ? `${mod.dayNum}: ${mod.topic}` : "Day Module")}
                  onChangeText={(text) => handleUpdateModuleTitle(mod.id, text)}
                  style={[styles.modTitleInput, { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }]}
                />
                <Pressable onPress={() => handleDeleteModule(mod.id)} style={styles.deleteModBtn}>
                  <Feather name="trash-2" size={16} color="#D32F2F" />
                </Pressable>
              </View>

              {/* Lessons List inside Module */}
              <View style={styles.lessonsContainer}>
                {(mod.lessons || []).map((lesText, lesIdx) => (
                  <View key={lesIdx} style={[styles.lessonRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="file-document-outline" size={15} color={theme.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      value={lesText}
                      onChangeText={(text) => handleUpdateLesson(mod.id, lesIdx, text)}
                      style={[styles.lessonInput, { color: theme.text }]}
                    />
                    <Pressable onPress={() => handleDeleteLesson(mod.id, lesIdx)} style={styles.deleteLesBtn}>
                      <Feather name="x" size={15} color={theme.subtext} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <Pressable onPress={() => handleAddLesson(mod.id)} style={styles.addLessonBtn}>
                <Feather name="plus-circle" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.addLessonBtnText, { color: theme.primary }]}>Add Lesson</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* 6. Publish Course Live Button */}
        <Pressable onPress={handlePublishCourse} disabled={publishing} style={[styles.bigPublishBtn, { backgroundColor: theme.primary }]}>
          <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.bigPublishBtnText}>{publishing ? "Publishing..." : "Publish Course Live"}</Text>
        </Pressable>
      </ScrollView>
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
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFFF"
  },
  backBtn: {
    padding: 4
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#181725"
  },
  publishHeaderBtn: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14
  },
  publishHeaderBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#FFFFFF"
  },

  scrollContent: {
    paddingBottom: 110
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725",
    marginBottom: 4
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },

  lockedHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  lockPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F3FA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  lockPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#7C7C9A"
  },

  lockedCategoryBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    marginTop: 8,
    gap: 10
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  catTitleText: {
    fontFamily: fonts.bold,
    fontSize: 14
  },
  catSubText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 1
  },

  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#55556A",
    marginTop: 10,
    marginBottom: 4
  },
  inputSubLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginBottom: 6
  },
  textInput: {
    backgroundColor: "#F8F7FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: "#181725",
    borderWidth: 1,
    borderColor: "#EBEAFA",
    marginBottom: 4
  },

  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6
  },
  pill: {
    backgroundColor: "#F8F7FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EBEAFA"
  },
  pillActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#55556A"
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  coverPreviewBox: {
    height: 130,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "#F0EDFF"
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },

  coverActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  uploadImageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10
  },
  uploadImageBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#FFFFFF"
  },
  urlImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    borderWidth: 1,
    borderColor: "#E5E1FF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10
  },
  urlImageBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },
  customImageWrap: {
    marginBottom: 10
  },
  applyImageBtn: {
    backgroundColor: "#5B3CF5",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4
  },
  applyImageBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#FFFFFF"
  },

  presetScroll: {
    flexDirection: "row"
  },
  presetImageBtn: {
    width: 52,
    height: 36,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#E0DBFF"
  },
  presetImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },

  // AI Card
  aiGenCard: {
    backgroundColor: "#4323D3",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    ...shadow.medium
  },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10
  },
  aiIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  aiCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#FFFFFF"
  },
  aiCardSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2
  },
  aiGenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    paddingVertical: 11,
    borderRadius: 12
  },
  aiGenerateBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#FFFFFF"
  },

  // Modules List
  addModuleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  addModuleBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },

  moduleCard: {
    backgroundColor: "#F8F7FF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EBEAFA"
  },
  modHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  modTitleInput: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2DDFF"
  },
  deleteModBtn: {
    padding: 6,
    marginLeft: 6
  },

  lessonsContainer: {
    gap: 6,
    marginBottom: 8
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#F0EFFF"
  },
  lessonInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#4A4A6A",
    paddingVertical: 4
  },
  deleteLesBtn: {
    padding: 4
  },
  addLessonBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4
  },
  addLessonBtnText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
  },

  bigPublishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 6,
    marginBottom: 20,
    ...shadow.medium
  },
  bigPublishBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#FFFFFF"
  },
  pressed: {
    opacity: 0.85
  }
});
