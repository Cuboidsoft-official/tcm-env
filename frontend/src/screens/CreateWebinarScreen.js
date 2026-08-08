import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { createWebinar } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

export default function CreateWebinarScreen({ session, user = {}, onBack, onWebinarCreated }) {
  const [eventType, setEventType] = useState("Webinar"); // Webinar | Event
  const [webinarType, setWebinarType] = useState("Free Webinar"); // Free Webinar | Paid Webinar
  const [price, setPrice] = useState("₹499");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [learningPoints, setLearningPoints] = useState([
    "Key takeaways & practical concepts",
    "Live Q&A and doubt clearance session",
    "Certificate & downloadable resources"
  ]);
  const [dateTime, setDateTime] = useState("Today • 6:00 PM");
  const [duration, setDuration] = useState("60 Mins");
  const [meetLink, setMeetLink] = useState("https://meet.google.com/tcm-live-session");
  const [pdfName, setPdfName] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [registrationLimit, setRegistrationLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Calendar & Clock Time Grid Picker State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDateNum, setSelectedDateNum] = useState(5);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("06:00 PM");

  function handleConfirmCalendarDate() {
    const dayStr = selectedDateNum === 5 ? "Today" : selectedDateNum === 6 ? "Tomorrow" : `Aug ${selectedDateNum}, 2026`;
    setDateTime(`${dayStr} • ${selectedTimeSlot}`);
    setShowCalendarModal(false);
  }

  async function pickBannerImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please grant photo library access to upload banner.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setBannerUrl(result.assets[0].uri);
    }
  }

  async function pickPdfResource() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets?.[0]) {
        const doc = result.assets[0];
        setPdfName(doc.name || "Webinar_Notes.pdf");
        setPdfUrl(doc.uri);
        Alert.alert("Resource Attached", `Successfully attached "${doc.name}"`);
      }
    } catch (err) {
      console.warn("PDF Pick Error:", err);
    }
  }

  function handleAddPoint() {
    if (learningPoints.length >= 8) {
      Alert.alert("Limit Reached", "You can add up to 8 learning takeaways.");
      return;
    }
    setLearningPoints((prev) => [...prev, ""]);
  }

  function handlePointChange(text, idx) {
    setLearningPoints((prev) => {
      const copy = [...prev];
      copy[idx] = text;
      return copy;
    });
  }

  function handleRemovePoint(idx) {
    if (learningPoints.length <= 1) {
      Alert.alert("Minimum Required", "At least one learning point is required.");
      return;
    }
    setLearningPoints((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handlePublish(isDraft = false) {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Webinar title is required.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Required Field", "Please write a short description.");
      return;
    }

    setSubmitting(true);

    const payload = {
      eventType,
      webinarType,
      price: webinarType === "Free Webinar" ? "Free" : price,
      title: title.trim(),
      description: description.trim(),
      bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
      learningPoints: learningPoints.filter((p) => p.trim().length > 0),
      dateTime,
      duration,
      meetLink: meetLink.trim() || "https://meet.google.com/tcm-live-session",
      pdfUrl,
      pdfName,
      registrationLimit,
      status: isDraft ? "draft" : "upcoming"
    };

    try {
      if (session?.token) {
        await createWebinar(session.token, payload);
      }
      Alert.alert(
        isDraft ? "Draft Saved" : "Webinar Published",
        `"${title.trim()}" has been ${isDraft ? "saved as draft" : "published live for your students"}!`
      );
      if (onWebinarCreated) onWebinarCreated(payload);
      if (onBack) onBack();
    } catch (err) {
      Alert.alert("Publish Failed", err.message || "Could not publish webinar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#181725" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Create Webinar / Event</Text>
          <Text style={styles.headerSub}>Create a new webinar or event for your students</Text>
        </View>

        <Pressable onPress={() => handlePublish(true)} style={styles.draftBtn}>
          <Text style={styles.draftBtnText}>Save Draft</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. Event Type Cards (Pro Cards) */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Event Type</Text>
          <View style={styles.choiceGrid}>
            {/* Webinar Card */}
            <Pressable
              onPress={() => setEventType("Webinar")}
              style={[styles.proCard, eventType === "Webinar" && styles.proCardActive]}
            >
              <View style={styles.proCardTopRow}>
                <View style={[styles.proIconBox, eventType === "Webinar" && styles.proIconBoxActive]}>
                  <Feather name="video" size={16} color={eventType === "Webinar" ? "#5B3CF5" : "#7C7C9A"} />
                </View>
                <View style={[styles.proRadioOuter, eventType === "Webinar" && styles.proRadioOuterActive]}>
                  {eventType === "Webinar" && <View style={styles.proRadioInner} />}
                </View>
              </View>
              <Text style={[styles.proCardTitle, eventType === "Webinar" && styles.proCardTitleActive]}>Webinar</Text>
              <Text style={styles.proCardSub}>Live online session</Text>
            </Pressable>

            {/* Event Card */}
            <Pressable
              onPress={() => setEventType("Event")}
              style={[styles.proCard, eventType === "Event" && styles.proCardActive]}
            >
              <View style={styles.proCardTopRow}>
                <View style={[styles.proIconBox, eventType === "Event" && styles.proIconBoxActive]}>
                  <Feather name="calendar" size={16} color={eventType === "Event" ? "#5B3CF5" : "#7C7C9A"} />
                </View>
                <View style={[styles.proRadioOuter, eventType === "Event" && styles.proRadioOuterActive]}>
                  {eventType === "Event" && <View style={styles.proRadioInner} />}
                </View>
              </View>
              <Text style={[styles.proCardTitle, eventType === "Event" && styles.proCardTitleActive]}>Event</Text>
              <Text style={styles.proCardSub}>In-person / Other</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Webinar Type Cards (Pro Cards) */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Webinar Type</Text>
          <View style={styles.choiceGrid}>
            {/* Free Webinar */}
            <Pressable
              onPress={() => setWebinarType("Free Webinar")}
              style={[styles.proCard, webinarType === "Free Webinar" && styles.proCardActive]}
            >
              <View style={styles.proCardTopRow}>
                <View style={[styles.proIconBox, webinarType === "Free Webinar" && styles.proIconBoxActive]}>
                  <Feather name="gift" size={16} color={webinarType === "Free Webinar" ? "#5B3CF5" : "#7C7C9A"} />
                </View>
                <View style={[styles.proRadioOuter, webinarType === "Free Webinar" && styles.proRadioOuterActive]}>
                  {webinarType === "Free Webinar" && <View style={styles.proRadioInner} />}
                </View>
              </View>
              <Text style={[styles.proCardTitle, webinarType === "Free Webinar" && styles.proCardTitleActive]}>Free Webinar</Text>
              <Text style={styles.proCardSub}>Open for all students</Text>
            </Pressable>

            {/* Paid Webinar */}
            <Pressable
              onPress={() => setWebinarType("Paid Webinar")}
              style={[styles.proCard, webinarType === "Paid Webinar" && styles.proCardActive]}
            >
              <View style={styles.proCardTopRow}>
                <View style={[styles.proIconBox, webinarType === "Paid Webinar" && styles.proIconBoxActive]}>
                  <Feather name="credit-card" size={16} color={webinarType === "Paid Webinar" ? "#5B3CF5" : "#7C7C9A"} />
                </View>
                <View style={[styles.proRadioOuter, webinarType === "Paid Webinar" && styles.proRadioOuterActive]}>
                  {webinarType === "Paid Webinar" && <View style={styles.proRadioInner} />}
                </View>
              </View>
              <Text style={[styles.proCardTitle, webinarType === "Paid Webinar" && styles.proCardTitleActive]}>Paid Webinar</Text>
              <Text style={styles.proCardSub}>Paid registration required</Text>
            </Pressable>
          </View>
        </View>

        {/* Price Input if Paid Webinar */}
        {webinarType === "Paid Webinar" ? (
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Registration Fee (₹) *</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="currency-inr" size={18} color="#5B3CF5" style={styles.inputIcon} />
              <TextInput
                value={price}
                onChangeText={(t) => setPrice(t.startsWith("₹") ? t : `₹${t}`)}
                placeholder="₹499"
                placeholderTextColor="#A0A0BA"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>
          </View>
        ) : null}

        {/* 4. Title Input */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Title *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={title}
              onChangeText={(t) => t.length <= 100 && setTitle(t)}
              placeholder="Enter webinar title"
              placeholderTextColor="#A0A0BA"
              style={styles.textInput}
            />
            <Text style={styles.charCounter}>{title.length}/100</Text>
          </View>
        </View>

        {/* 5. Short Description */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Short Description *</Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              value={description}
              onChangeText={(t) => t.length <= 200 && setDescription(t)}
              placeholder="Write a short description about this webinar..."
              placeholderTextColor="#A0A0BA"
              multiline
              numberOfLines={4}
              style={styles.textAreaInput}
            />
            <Text style={styles.charCounterBottom}>{description.length}/200</Text>
          </View>
        </View>

        {/* 6. Banner Image Upload */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Banner Image *</Text>
          <Pressable onPress={pickBannerImage} style={styles.bannerPickerCard}>
            {bannerUrl ? (
              <View style={styles.bannerPreviewWrap}>
                <Image source={{ uri: bannerUrl }} style={styles.bannerImgPreview} />
                <View style={styles.changeImageOverlay}>
                  <Feather name="camera" size={16} color="#FFFFFF" />
                  <Text style={styles.changeImageText}>Change Banner</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholderInner}>
                <View style={styles.uploadIconBadge}>
                  <Feather name="image" size={22} color="#5B3CF5" />
                </View>
                <Text style={styles.uploadTitleText}>Upload Banner</Text>
                <Text style={styles.uploadSubText}>Recommended size: 1280 x 720px (16:9){"\n"}JPG, PNG up to 5MB</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 7. What will you learn? */}
        <View style={styles.fieldSection}>
          <View style={styles.learnHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={styles.fieldLabel}>What will you learn? *</Text>
              <Feather name="info" size={13} color="#7C7C9A" />
            </View>
            <Pressable onPress={handleAddPoint} style={styles.addPointBtn}>
              <Feather name="plus" size={14} color="#5B3CF5" />
              <Text style={styles.addPointBtnText}>Add Point</Text>
            </Pressable>
          </View>

          <View style={{ gap: 10, marginTop: 6 }}>
            {learningPoints.map((pt, idx) => (
              <View key={idx} style={styles.pointInputRow}>
                <View style={styles.pointNumBadge}>
                  <Text style={styles.pointNumText}>{idx + 1}</Text>
                </View>
                <TextInput
                  value={pt}
                  onChangeText={(text) => handlePointChange(text, idx)}
                  placeholder="Add learning point"
                  placeholderTextColor="#A0A0BA"
                  style={styles.pointTextInput}
                />
                <Pressable onPress={() => handleRemovePoint(idx)} style={styles.trashBtn}>
                  <Feather name="trash-2" size={16} color="#9E9EBA" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* 8. Date & Time (Calendar Picker) */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Date & Time *</Text>
          <Pressable onPress={() => setShowCalendarModal(true)} style={styles.selectWrapper}>
            <Feather name="calendar" size={16} color="#5B3CF5" style={styles.inputIcon} />
            <Text style={[styles.selectText, { color: "#181725", fontFamily: fonts.bold }]}>{dateTime}</Text>
            <Feather name="chevron-right" size={16} color="#7C7C9A" />
          </Pressable>
        </View>

        {/* 9. Duration (Manual Input) */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Duration *</Text>
          <View style={styles.inputWrapper}>
            <Feather name="clock" size={16} color="#7C7C9A" style={styles.inputIcon} />
            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g. 60 Mins, 1.5 Hours, 90 Mins"
              placeholderTextColor="#A0A0BA"
              style={styles.textInput}
            />
          </View>
        </View>

        {/* 10. Google Meet Link */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Google Meet Link *</Text>
          <View style={styles.inputWrapper}>
            <Feather name="link" size={16} color="#7C7C9A" style={styles.inputIcon} />
            <TextInput
              value={meetLink}
              onChangeText={setMeetLink}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              placeholderTextColor="#A0A0BA"
              autoCapitalize="none"
              style={styles.textInput}
            />
          </View>
          <Text style={styles.helperText}>Paste Google Meet link for your live session</Text>
        </View>

        {/* 11. Attach Notes / Resources (PDF) */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Attach Notes / Resources (PDF) (Optional)</Text>
          <Pressable onPress={pickPdfResource} style={styles.pdfCardContainer}>
            <View style={styles.pdfIconBadge}>
              <Feather name="file-text" size={20} color="#5B3CF5" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.pdfTitleText}>{pdfName || "Upload PDF"}</Text>
              <Text style={styles.pdfSubText}>{pdfName ? "Attached PDF document" : "Upload notes or study material (PDF only)"}</Text>
            </View>

            <Feather name="chevron-right" size={18} color="#7C7C9A" />
          </Pressable>
        </View>

        {/* 12. Registration Limit */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Registration Limit (Optional)</Text>
          <View style={styles.inputWrapper}>
            <Feather name="users" size={16} color="#7C7C9A" style={styles.inputIcon} />
            <TextInput
              value={registrationLimit}
              onChangeText={setRegistrationLimit}
              placeholder="e.g. 200 (leave empty for unlimited)"
              placeholderTextColor="#A0A0BA"
              keyboardType="numeric"
              style={styles.textInput}
            />
          </View>
        </View>

        {/* 13. Submit Publish Button */}
        <Pressable
          onPress={() => handlePublish(false)}
          disabled={submitting}
          style={({ pressed }) => [styles.publishBtn, pressed && { opacity: 0.9 }]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.publishBtnText}>Publish Webinar & Event</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* 14. Interactive Calendar Date & Time Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalCard}>
            <View style={styles.calendarHeaderRow}>
              <View>
                <Text style={styles.calendarTitleText}>Select Date & Time</Text>
                <Text style={styles.calendarSubText}>August 2026</Text>
              </View>
              <Pressable onPress={() => setShowCalendarModal(false)} style={styles.closeModalBtn}>
                <Feather name="x" size={18} color="#181725" />
              </Pressable>
            </View>

            {/* Calendar Days Header */}
            <View style={styles.weekDaysRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <Text key={d} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>

            {/* 31 Days Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                const isSelected = selectedDateNum === dayNum;
                return (
                  <Pressable
                    key={dayNum}
                    onPress={() => setSelectedDateNum(dayNum)}
                    style={[styles.dayCell, isSelected && styles.dayCellActive]}
                  >
                    <Text style={[styles.dayCellText, isSelected && styles.dayCellTextActive]}>{dayNum}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Interactive Clock Time Grid Picker */}
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={styles.timeSectionLabel}>Select Session Time</Text>
                <View style={styles.timeSelectedPill}>
                  <Feather name="clock" size={12} color="#5B3CF5" style={{ marginRight: 4 }} />
                  <Text style={styles.timeSelectedPillText}>{selectedTimeSlot}</Text>
                </View>
              </View>

              <View style={styles.timeGridWrap}>
                {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"].map((tSlot) => {
                  const isTsSelected = selectedTimeSlot === tSlot;
                  return (
                    <Pressable
                      key={tSlot}
                      onPress={() => setSelectedTimeSlot(tSlot)}
                      style={[styles.timeChipCell, isTsSelected && styles.timeChipCellActive]}
                    >
                      <Text style={[styles.timeChipCellText, isTsSelected && styles.timeChipCellTextActive]}>{tSlot}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Confirm Button */}
            <Pressable onPress={handleConfirmCalendarDate} style={styles.confirmDateBtn}>
              <Text style={styles.confirmDateBtnText}>Set Date & Time →</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFBFE",
    paddingHorizontal: 16
  },

  // 1. Header Row
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#FBFBFE",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFFF",
    gap: 10
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitleWrap: {
    flex: 1
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 1
  },
  draftBtn: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14
  },
  draftBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
  },

  scrollContent: {
    paddingVertical: 14,
    paddingBottom: 60,
    gap: 16
  },

  // Field Section Wrapper
  fieldSection: {
    gap: 6
  },
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: "#181725"
  },

  // Choice Grid Container
  choiceGrid: {
    flexDirection: "row",
    gap: 10
  },

  // Professional Compact Grid Cards (Event Type & Webinar Type)
  proCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EBE5FF",
    gap: 3,
    ...shadow.soft
  },
  proCardActive: {
    borderColor: "#5B3CF5",
    backgroundColor: "#F9F8FF"
  },
  proCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2
  },
  proIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },
  proIconBoxActive: {
    backgroundColor: "#F0EDFF"
  },
  proRadioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#C5C5DB",
    alignItems: "center",
    justifyContent: "center"
  },
  proRadioOuterActive: {
    borderColor: "#5B3CF5"
  },
  proRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5B3CF5"
  },
  proCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725"
  },
  proCardTitleActive: {
    color: "#5B3CF5"
  },
  proCardSub: {
    fontFamily: fonts.regular,
    fontSize: 9.5,
    color: "#7C7C9A"
  },

  // Inputs
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48
  },
  inputIcon: {
    marginRight: 8
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#181725"
  },
  charCounter: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#A0A0BA"
  },

  // Text Area
  textAreaWrapper: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5FF",
    borderRadius: 12,
    padding: 12,
    minHeight: 100
  },
  textAreaInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#181725",
    textAlignVertical: "top"
  },
  charCounterBottom: {
    alignSelf: "flex-end",
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#A0A0BA",
    marginTop: 4
  },

  // Banner Picker Card
  bannerPickerCard: {
    backgroundColor: "#F9F8FF",
    borderWidth: 1.5,
    borderColor: "#5B3CF5",
    borderStyle: "dashed",
    borderRadius: 14,
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  uploadPlaceholderInner: {
    alignItems: "center",
    padding: 16
  },
  uploadIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  uploadTitleText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  uploadSubText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    textAlign: "center",
    marginTop: 2
  },
  bannerPreviewWrap: {
    width: "100%",
    height: 140,
    position: "relative"
  },
  bannerImgPreview: {
    width: "100%",
    height: "100%"
  },
  changeImageOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.65)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  changeImageText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: "#FFFFFF"
  },

  // What Will You Learn List
  learnHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  addPointBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  addPointBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: "#5B3CF5"
  },
  pointInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5FF",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 46,
    gap: 8
  },
  pointNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },
  pointNumText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#5B3CF5"
  },
  pointTextInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#181725"
  },
  trashBtn: {
    padding: 6
  },

  // Select Dropdowns
  selectWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48
  },
  selectText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#181725"
  },
  optionsDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBE5FF",
    marginTop: 4,
    overflow: "hidden",
    ...shadow.soft
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F3FA"
  },
  dropdownOptionText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#4A4A68"
  },
  dropdownOptionTextActive: {
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },

  helperText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 3
  },

  // PDF Document Picker Card
  pdfCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F8FF",
    borderWidth: 1.5,
    borderColor: "#EBE5FF",
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 12,
    gap: 12
  },
  pdfIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },
  pdfTitleText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  pdfSubText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 1
  },

  // Submit Publish Button
  publishBtn: {
    backgroundColor: "#5B3CF5",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    ...shadow.medium
  },
  publishBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#FFFFFF"
  },

  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  calendarModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  calendarTitleText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  calendarSubText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#5B3CF5",
    marginTop: 1
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 6
  },
  weekDayText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: "#7C7C9A",
    width: 36,
    textAlign: "center"
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-start",
    marginTop: 4
  },
  dayCell: {
    width: 42,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8F8FC",
    alignItems: "center",
    justifyContent: "center"
  },
  dayCellActive: {
    backgroundColor: "#5B3CF5"
  },
  dayCellText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: "#181725"
  },
  dayCellTextActive: {
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  timeSectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    marginTop: 8
  },
  // Digital Time Picker Styles
  // Interactive Clock Time Grid Picker Styles
  timeSelectedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  timeSelectedPillText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: "#5B3CF5"
  },
  timeGridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  timeChipCell: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F4F3FA",
    borderWidth: 1,
    borderColor: "#EBE5FF"
  },
  timeChipCellActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  timeChipCellText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: "#4A4A68"
  },
  timeChipCellTextActive: {
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  confirmDateBtn: {
    backgroundColor: "#5B3CF5",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    ...shadow.medium
  },
  confirmDateBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  }
});
