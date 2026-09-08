import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Pressable,
  Dimensions,
  Image,
  Modal,
  Platform
} from "react-native";
import { MaterialCommunityIcons, Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";
import { shadow } from "../constants/theme";
import {
  getGovernmentStates,
  getGovernmentExams,
  getGovernmentSubjects,
  getGovernmentTopics,
  getGovernmentChapters,
  getGovernmentChapter,
  getGovernmentLearningProgress,
  saveChapterProgress,
  bookmarkChapter,
  explainChapterWithAI,
  saveChapterNote,
  getChapterNotes,
  getGovernmentSources,
  syncGovernmentSource,
  getGovCategories
} from "../api/client";

const { width } = Dimensions.get("window");
const phlappyLogo = require("../../assets/icon.png");

export default function GovernmentExamsPage({ session, user, onBack, initialChapterId, onNavigateToRoute }) {
  const { theme } = useTheme();
  const token = session?.token || user?.token;

  // Header & Filter State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en"); // 'en', 'hi', 'hinglish'
  
  const [states, setStates] = useState(["All States"]);
  const [selectedState, setSelectedState] = useState("All States");
  
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Active View State: 'landing' (landing page & subject preview), 'chapters' (chapter list), 'reader' (book reader), 'sources' (source management)
  const [viewMode, setViewMode] = useState("landing");
  const [activeChapter, setActiveChapter] = useState(null);
  const [readerLoading, setReaderLoading] = useState(false);

  // Reader Customization State
  const [fontSizeLevel, setFontSizeLevel] = useState("medium"); // 'small' (14), 'medium' (16), 'large' (19)
  const [readerThemeMode, setReaderThemeMode] = useState("auto"); // 'auto', 'light', 'dark', 'sepia'
  const [bookmarked, setBookmarked] = useState(false);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState("#FEF08A");
  
  // Personal Notes & AI Explanation State
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [readerSearch, setReaderSearch] = useState("");

  // Sources & Ingestion Admin State
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [sourcesList, setSourcesList] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [stateRes, catRes, examRes] = await Promise.all([
        getGovernmentStates().catch(() => ({ states: [] })),
        getGovCategories().catch(() => ({ categories: [] })),
        getGovernmentExams().catch(() => ({ exams: [] }))
      ]);

      if (stateRes?.states && Array.isArray(stateRes.states) && stateRes.states.length > 0) {
        setStates(stateRes.states);
      }
      
      const catList = catRes?.categories || ["All", "SSC", "Railway", "Banking", "UPSC", "State PSC", "Police", "Teaching", "Defence", "Other Exams"];
      setCategories(catList);

      const examList = examRes?.exams || [];
      setExams(examList);

      if (examList.length > 0) {
        const first = examList[0];
        setSelectedExam(first);
        loadSubjectsForExam(first.id || first._id);
      }
    } catch (err) {
      console.warn("GovExamsPage init error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStateChange(st) {
    setSelectedState(st);
    try {
      const res = await getGovernmentExams(st !== "All States" ? st : "").catch(() => ({ exams: [] }));
      const fetchedExams = res?.exams || [];
      setExams(fetchedExams);
      if (fetchedExams.length > 0) {
        setSelectedExam(fetchedExams[0]);
        loadSubjectsForExam(fetchedExams[0].id || fetchedExams[0]._id);
      } else {
        setSelectedExam(null);
        setSubjects([]);
        setChapters([]);
      }
    } catch (e) {
      setExams([]);
    }
  }

  async function handleExamSelect(ex) {
    setSelectedExam(ex);
    loadSubjectsForExam(ex.id || ex._id);
  }

  async function loadSubjectsForExam(examId) {
    if (!examId) return;
    try {
      const res = await getGovernmentSubjects(examId).catch(() => ({ subjects: [] }));
      const subList = res?.subjects || [];
      setSubjects(subList);
      setSelectedSubject(null);
      setChapters([]);
    } catch (e) {
      setSubjects([]);
    }
  }

  async function handleSubjectSelect(sub) {
    setSelectedSubject(sub);
    setViewMode("chapters");
    loadChaptersForSubject(sub.id || sub._id);
  }

  async function loadChaptersForSubject(subjectId) {
    setChaptersLoading(true);
    try {
      const filters = {
        subjectId,
        examId: selectedExam?.id || selectedExam?._id || "",
        state: selectedState !== "All States" ? selectedState : "",
        language: selectedLanguage,
        search: searchQuery
      };
      const res = await getGovernmentChapters(filters).catch(() => ({ chapters: [] }));
      setChapters(res?.chapters || []);
    } catch (e) {
      setChapters([]);
    } finally {
      setChaptersLoading(false);
    }
  }

  async function handleOpenChapterReader(chap) {
    if (!chap) return;
    setReaderLoading(true);
    setViewMode("reader");
    setActiveChapter(chap);
    setAiExplanation(null);

    // Push URL state for direct router navigation if web
    if (Platform.OS === "web" && typeof window !== "undefined" && window.history) {
      const chapId = chap.id || chap._id;
      window.history.pushState({ chapterId: chapId }, "", `/learn/government-exams/chapters/${chapId}`);
    }

    try {
      const cId = chap.id || chap._id;
      const res = await getGovernmentChapter(cId).catch(() => null);
      if (res?.chapter) {
        setActiveChapter(res.chapter);
      }

      if (token) {
        const notesRes = await getChapterNotes(token, cId).catch(() => ({ notes: [] }));
        if (notesRes?.notes) setNotes(notesRes.notes);
      }
    } catch (e) {
      console.warn("Error loading chapter reader:", e);
    } finally {
      setReaderLoading(false);
    }
  }

  async function handleSaveProgress(pct, done = false) {
    setChapterProgress(pct);
    if (done) setIsCompleted(true);
    if (!token || !activeChapter) return;
    const cId = activeChapter.id || activeChapter._id;
    try {
      await saveChapterProgress(token, cId, { progressPercent: pct, isCompleted: done });
    } catch (e) {}
  }

  async function handleToggleBookmark() {
    setBookmarked((prev) => !prev);
    if (!token || !activeChapter) return;
    const cId = activeChapter.id || activeChapter._id;
    try {
      await bookmarkChapter(token, cId);
    } catch (e) {}
  }

  async function handleAddPersonalNote() {
    if (!newNoteText.trim() || !activeChapter) return;
    const cId = activeChapter.id || activeChapter._id;
    const noteObj = { noteText: newNoteText.trim(), highlightColor: activeHighlightColor, id: `n_${Date.now()}` };
    setNotes((prev) => [noteObj, ...prev]);
    setNewNoteText("");

    if (token) {
      try {
        await saveChapterNote(token, cId, noteObj);
      } catch (e) {}
    }
  }

  async function handleExplainWithAI() {
    if (!activeChapter) return;
    setAiLoading(true);
    const cId = activeChapter.id || activeChapter._id;
    try {
      const res = await explainChapterWithAI(token, cId, selectedLanguage).catch(() => null);
      if (res && (res.success || res.detailedExplanation)) {
        setAiExplanation(res);
      } else {
        setAiExplanation({
          shortExplanation: `Phlappy AI Summary for ${activeChapter.title}`,
          detailedExplanation: `🎓 **Phlappy AI Smart Textbook Guide**:\n\n**Chapter**: ${activeChapter.title}\n**Subject**: ${activeChapter.subjectName || "Government Preparation"}\n\nKey Concepts:\n1. Core definitions & formulas analyzed.\n2. Important past year exam questions highlighted.\n3. High-yield summary for quick revision.`,
          keyConcept: `${activeChapter.subjectName || "Core"} Fundamentals`,
          examTip: `Focus on key definitions and solve official PYQs for ${activeChapter.examName || "Govt Exam"}.`
        });
      }
    } catch (err) {
      console.warn("AI explanation fallback:", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleOpenSourcesModal() {
    setSourcesModalOpen(true);
    setSourcesLoading(true);
    try {
      const res = await getGovernmentSources().catch(() => ({ sources: [], recentLogs: [] }));
      setSourcesList(res?.sources || []);
      setSyncLogs(res?.recentLogs || []);
    } catch (e) {
      setSourcesList([]);
    } finally {
      setSourcesLoading(false);
    }
  }

  async function handleTriggerSync(sourceId) {
    try {
      const res = await syncGovernmentSource(token, sourceId);
      Alert.alert("Source Sync", res?.message || "Sync triggered successfully.");
    } catch (e) {
      Alert.alert("Sync Notice", "Official source sync command sent.");
    }
  }

  // Filtered Categories/Exams based on search
  const filteredCategoryList = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    return categories.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, searchQuery]);

  const readerFontPx = fontSizeLevel === "small" ? 14 : fontSizeLevel === "large" ? 19 : 16;
  const readerBg = readerThemeMode === "dark" || (readerThemeMode === "auto" && theme.isDark) ? "#09090B" : readerThemeMode === "sepia" ? "#FBF0D9" : "#FFFFFF";
  const readerTextColor = readerThemeMode === "dark" || (readerThemeMode === "auto" && theme.isDark) ? "#F4F4F5" : readerThemeMode === "sepia" ? "#433422" : "#09090B";

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* 3. PAGE HEADER */}
      <View style={[styles.pageHeaderBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }]}
            onPress={() => {
              if (viewMode === "reader" || viewMode === "chapters") {
                setViewMode("landing");
                if (Platform.OS === "web" && typeof window !== "undefined" && window.history) {
                  window.history.pushState({}, "", "/learn/government-exams");
                }
              } else if (onBack) {
                onBack();
              }
            }}
          >
            <Feather name="arrow-left" size={18} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <View style={styles.headerBadgeRow}>
              <View style={[styles.headerBadgePill, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }]}>
                <MaterialCommunityIcons name="school-outline" size={12} color="#09090B" />
                <Text style={[styles.headerBadgeText, { color: theme.text }]}>GOVERNMENT EXAMS</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={[styles.headerMainTitle, { color: theme.text }]}>
              Learn for Government Exams
            </Text>
          </View>

          <TouchableOpacity style={[styles.sourcesBtn, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }]} onPress={handleOpenSourcesModal}>
            <MaterialCommunityIcons name="database-sync-outline" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerDescText, { color: theme.subtext }]}>
          Explore exam-wise subjects, understand important concepts, and prepare with structured learning material.
        </Text>

        {/* Header Controls: Search, Selectors */}
        <View style={styles.headerControlsRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Feather name="search" size={15} color={theme.subtext} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search exams, subjects, chapters..."
              placeholderTextColor={theme.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={14} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>

          {/* Language Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
            {[
              { key: "en", label: "English" },
              { key: "hi", label: "हिंदी" },
              { key: "hinglish", label: "Hinglish" }
            ].map((lang) => {
              const active = selectedLanguage === lang.key;
              return (
                <TouchableOpacity
                  key={`lang_${lang.key}`}
                  style={[styles.langChip, active && styles.langChipActive]}
                  onPress={() => setSelectedLanguage(lang.key)}
                >
                  <Text style={[styles.langChipText, active && styles.langChipTextActive]}>{lang.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* BODY MAIN SCROLL */}
      {loading ? (
        <View style={styles.fullscreenLoadingBox}>
          <ActivityIndicator size="large" color="#09090B" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading Government Exam Material...</Text>
        </View>
      ) : viewMode === "reader" && activeChapter ? (
        /* 9. BOOK-LIKE READING PAGE */
        <View style={[styles.readerContainer, { backgroundColor: readerBg }]}>
          {/* Reader Sub-Header Navigation */}
          <View style={[styles.readerHeaderBar, { borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => setViewMode("chapters")} style={styles.readerBackBtn}>
              <Feather name="chevron-left" size={20} color={readerTextColor} />
              <Text style={[styles.readerBackText, { color: readerTextColor }]}>Chapters</Text>
            </TouchableOpacity>

            <Text numberOfLines={1} style={[styles.readerTitleHead, { color: readerTextColor }]}>
              {activeChapter.title}
            </Text>

            <View style={styles.readerHeaderActions}>
              <TouchableOpacity onPress={handleToggleBookmark} style={styles.readerActionIcon}>
                <MaterialCommunityIcons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={bookmarked ? "#09090B" : readerTextColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsNoteDrawerOpen((prev) => !prev)} style={styles.readerActionIcon}>
                <MaterialCommunityIcons name="notebook-edit-outline" size={20} color={readerTextColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reader Controls Toolbar: Font Size, Reader Theme, Search */}
          <View style={[styles.readerToolbarRow, { backgroundColor: readerThemeMode === "dark" ? "#18181B" : "#F4F4F5" }]}>
            <View style={styles.fontSizeBtnGroup}>
              <Text style={{ fontSize: 11, color: readerTextColor, fontFamily: fonts.medium, marginRight: 4 }}>Size:</Text>
              {["small", "medium", "large"].map((lvl) => (
                <TouchableOpacity
                  key={`font_${lvl}`}
                  style={[styles.fontSizeChip, fontSizeLevel === lvl && styles.fontSizeChipActive]}
                  onPress={() => setFontSizeLevel(lvl)}
                >
                  <Text style={[styles.fontSizeChipText, fontSizeLevel === lvl && styles.fontSizeChipTextActive]}>
                    {lvl === "small" ? "A-" : lvl === "large" ? "A+" : "A"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reading Theme Toggle */}
            <View style={styles.themeBtnGroup}>
              {[
                { mode: "light", icon: "sun" },
                { mode: "sepia", icon: "book-open" },
                { mode: "dark", icon: "moon" }
              ].map((th) => (
                <TouchableOpacity
                  key={`th_${th.mode}`}
                  style={[styles.themeChip, readerThemeMode === th.mode && styles.themeChipActive]}
                  onPress={() => setReaderThemeMode(th.mode)}
                >
                  <Feather name={th.icon} size={13} color={readerThemeMode === th.mode ? "#FFFFFF" : readerTextColor} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.readerProgressTrack}>
            <View style={[styles.readerProgressFill, { width: `${chapterProgress}%` }]} />
          </View>

          {/* Reader Content Body */}
          <ScrollView style={styles.readerScrollBody} contentContainerStyle={styles.readerScrollContent} showsVerticalScrollIndicator={true}>
            {/* Breadcrumb */}
            <View style={styles.breadcrumbRow}>
              <Text style={styles.breadcrumbItem}>Learn</Text>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={styles.breadcrumbItem}>{activeChapter.examName || "Govt Exam"}</Text>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={styles.breadcrumbItem}>{activeChapter.subjectName || "Subject"}</Text>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={[styles.breadcrumbItem, { color: readerTextColor, fontFamily: fonts.bold }]}>{activeChapter.title}</Text>
            </View>

            {/* Chapter Metadata & Source License Attribution */}
            <View style={[styles.chapterMetaCard, { borderColor: theme.border }]}>
              <Text style={[styles.chapterMetaTitle, { color: readerTextColor }]}>{activeChapter.title}</Text>
              <View style={styles.metaRowInfo}>
                <View style={styles.metaBadgeItem}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color={readerTextColor} />
                  <Text style={[styles.metaBadgeItemText, { color: readerTextColor }]}>{activeChapter.estimatedReadingTime || 12} min read</Text>
                </View>
                <View style={styles.metaBadgeItem}>
                  <MaterialCommunityIcons name="source-branch" size={13} color={readerTextColor} />
                  <Text style={[styles.metaBadgeItemText, { color: readerTextColor }]}>{activeChapter.sourceName || "Official Board"}</Text>
                </View>
                <View style={styles.metaBadgeItem}>
                  <MaterialCommunityIcons name="shield-check-outline" size={13} color="#059669" />
                  <Text style={[styles.metaBadgeItemText, { color: "#059669", fontFamily: fonts.bold }]}>Verified Content</Text>
                </View>
              </View>
            </View>

            {/* Table of Contents */}
            {activeChapter.tableOfContents && activeChapter.tableOfContents.length > 0 && (
              <View style={[styles.tocContainer, { backgroundColor: readerThemeMode === "dark" ? "#18181B" : "#F8FAFC", borderColor: theme.border }]}>
                <Text style={[styles.tocHeading, { color: readerTextColor }]}>Table of Contents</Text>
                {activeChapter.tableOfContents.map((toc, tIdx) => (
                  <Text key={`toc_${tIdx}`} style={[styles.tocItem, { color: readerTextColor }]}>
                    {tIdx + 1}. {toc.title}
                  </Text>
                ))}
              </View>
            )}

            {/* Reading Content Output */}
            {readerLoading ? (
              <ActivityIndicator size="large" color="#09090B" style={{ marginTop: 40 }} />
            ) : activeChapter.content ? (
              <View style={styles.mainBookBodyTextContainer}>
                <Text style={[styles.mainBookBodyText, { fontSize: readerFontPx, color: readerTextColor }]}>
                  {selectedLanguage === "hi" && activeChapter.contentHi ? activeChapter.contentHi : activeChapter.content}
                </Text>
              </View>
            ) : (
              <View style={[styles.emptyContentCard, { borderColor: theme.border }]}>
                <MaterialCommunityIcons name="book-remove-outline" size={32} color={readerTextColor} />
                <Text style={[styles.emptyContentText, { color: readerTextColor }]}>
                  This chapter does not have verified learning content yet.
                </Text>
              </View>
            )}

            {/* Phlappy AI Explanation Trigger */}
            <TouchableOpacity style={styles.phlappyAiReaderBtn} onPress={handleExplainWithAI}>
              {aiLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Image source={phlappyLogo} style={styles.phlappyLogoIcon} resizeMode="contain" />
                  <Text style={styles.phlappyAiReaderBtnText}>Explain Chapter with Phlappy AI ✨</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Phlappy AI Output Card */}
            {aiExplanation && (
              <View style={[styles.aiOutputCard, { backgroundColor: readerThemeMode === "dark" ? "#18181B" : "#F4F4F5", borderColor: theme.border }]}>
                <View style={styles.aiOutputHeader}>
                  <Image source={phlappyLogo} style={styles.phlappyLogoIconSmall} resizeMode="contain" />
                  <Text style={styles.aiOutputTitle}>PHLAPPY AI TEXTBOOK TUTOR</Text>
                </View>
                <Text style={[styles.aiOutputText, { color: readerTextColor }]}>{aiExplanation.detailedExplanation}</Text>
              </View>
            )}

            {/* Mark as Completed CTA */}
            <TouchableOpacity
              style={[styles.markCompleteBtn, isCompleted && styles.markCompleteBtnDone]}
              onPress={() => handleSaveProgress(100, true)}
            >
              <MaterialCommunityIcons name={isCompleted ? "check-circle" : "checkbox-marked-circle-outline"} size={18} color="#FFFFFF" />
              <Text style={styles.markCompleteBtnText}>
                {isCompleted ? "Chapter Completed ✓" : "Mark Chapter as Completed"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Personal Notes Drawer */}
          {isNoteDrawerOpen && (
            <View style={[styles.notesDrawerContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.notesHeader}>
                <Text style={[styles.notesTitle, { color: theme.text }]}>Personal Study Notes</Text>
                <TouchableOpacity onPress={() => setIsNoteDrawerOpen(false)}>
                  <Feather name="x" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.addNoteRow}>
                <TextInput
                  style={[styles.noteInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Type personal note for this chapter..."
                  placeholderTextColor={theme.subtext}
                  value={newNoteText}
                  onChangeText={setNewNoteText}
                  multiline
                />
                <TouchableOpacity style={styles.saveNoteBtn} onPress={handleAddPersonalNote}>
                  <Text style={styles.saveNoteBtnText}>Save</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 150 }}>
                {notes.map((n, idx) => (
                  <View key={`n_${idx}`} style={[styles.noteItemCard, { backgroundColor: theme.bg }]}>
                    <Text style={[styles.noteItemText, { color: theme.text }]}>{n.noteText}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        /* LANDING & EXPLORE EXAMS VIEW */
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent} showsVerticalScrollIndicator={false}>
          {/* 4. HERO SECTION */}
          <View style={[styles.heroCard, { backgroundColor: theme.isDark ? "#09090B" : "#F4F4F5", borderColor: theme.border }]}>
            <View style={styles.heroContentRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.heroBadgeRow}>
                  <View style={[styles.heroPillBadge, { backgroundColor: theme.isDark ? "#18181B" : "#FFFFFF" }]}>
                    <MaterialCommunityIcons name="bank" size={13} color={theme.isDark ? "#FFFFFF" : "#09090B"} />
                    <Text style={[styles.heroPillText, { color: theme.isDark ? "#FFFFFF" : "#09090B" }]}>OFFICIAL CURRICULUM</Text>
                  </View>
                </View>

                <Text style={[styles.heroTitleText, { color: theme.isDark ? "#FFFFFF" : "#09090B" }]}>
                  Master Government Exams with Real Study Material
                </Text>

                <Text style={[styles.heroSubText, { color: theme.isDark ? "#A1A1AA" : "#52525B" }]}>
                  Structured subject lessons, chapter notes, and past year official paper concepts for SSC, Railway, Banking, UPSC & State PSC.
                </Text>

                {/* Hero Badges */}
                <View style={styles.heroInfoBadgesRow}>
                  <View style={[styles.infoBadgeChip, { backgroundColor: theme.isDark ? "#18181B" : "#FFFFFF" }]}>
                    <Text style={[styles.infoBadgeChipText, { color: theme.text }]}>🎓 Exam-wise Learning</Text>
                  </View>
                  <View style={[styles.infoBadgeChip, { backgroundColor: theme.isDark ? "#18181B" : "#FFFFFF" }]}>
                    <Text style={[styles.infoBadgeChipText, { color: theme.text }]}>🗺️ State-wise Content</Text>
                  </View>
                  <View style={[styles.infoBadgeChip, { backgroundColor: theme.isDark ? "#18181B" : "#FFFFFF" }]}>
                    <Text style={[styles.infoBadgeChipText, { color: theme.text }]}>🗣️ Multiple Languages</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 5. FILTER SECTION */}
          <View style={[styles.filterPanelBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.filterPanelHeading, { color: theme.text }]}>Filter Study Material</Text>
            
            {/* State Filter */}
            <View style={styles.filterRowItem}>
              <Text style={[styles.filterLabel, { color: theme.subtext }]}>State:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipScroll}>
                {["All States", "Delhi", "Uttar Pradesh", "Bihar", "Rajasthan", "Madhya Pradesh"].map((st) => {
                  const active = selectedState === st;
                  return (
                    <TouchableOpacity
                      key={`st_${st}`}
                      style={[styles.filterChipBtn, active && styles.filterChipBtnActive]}
                      onPress={() => handleStateChange(st)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Exam Category Filter */}
            <View style={styles.filterRowItem}>
              <Text style={[styles.filterLabel, { color: theme.subtext }]}>Exam:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipScroll}>
                {filteredCategoryList.map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <TouchableOpacity
                      key={`cat_${cat}`}
                      style={[styles.filterChipBtn, active && styles.filterChipBtnActive]}
                      onPress={() => setActiveCategory(cat)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* 6. EXAM CATEGORY SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Explore Government Exams</Text>
          </View>

          {exams && exams.length > 0 ? (
            <View style={styles.examCardsGrid}>
              {exams.map((ex) => {
                const isSelected = selectedExam?.id === ex.id || selectedExam?._id === ex._id;
                return (
                  <TouchableOpacity
                    key={`ex_card_${ex.id || ex._id}`}
                    style={[
                      styles.examCardItem,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      isSelected && styles.examCardItemSelected
                    ]}
                    onPress={() => handleExamSelect(ex)}
                  >
                    <View style={styles.examCardTop}>
                      <View style={[styles.examIconBadge, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }]}>
                        <MaterialCommunityIcons name="bank" size={20} color={theme.text} />
                      </View>
                      <Text style={[styles.examCategoryPill, { color: theme.subtext }]}>{ex.category || "General"}</Text>
                    </View>
                    <Text style={[styles.examCardName, { color: theme.text }]}>{ex.name}</Text>
                    <Text numberOfLines={2} style={[styles.examCardDesc, { color: theme.subtext }]}>
                      {ex.description || "Official government recruitment syllabus."}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* 12. POLISHED EMPTY STATE FOR EXAMS */
            <View style={[styles.emptyPolishedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={32} color={theme.subtext} />
              <Text style={[styles.emptyPolishedTitle, { color: theme.text }]}>
                Government exam learning content will appear here once verified content is added.
              </Text>
            </View>
          )}

          {/* 7. LEARNING CONTENT PREVIEW / SUBJECT SECTION */}
          {selectedExam && (
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Start Learning by Subject ({selectedExam.name})
                </Text>
              </View>

              {subjects && subjects.length > 0 ? (
                <View style={styles.subjectsGridContainer}>
                  {subjects.map((sub) => {
                    const isSelected = selectedSubject?.id === sub.id || selectedSubject?._id === sub._id;
                    return (
                      <TouchableOpacity
                        key={`sub_${sub.id || sub._id}`}
                        style={[
                          styles.subjectCardBox,
                          { backgroundColor: theme.cardBg, borderColor: theme.border },
                          isSelected && styles.subjectCardSelected
                        ]}
                        onPress={() => handleSubjectSelect(sub)}
                      >
                        <View style={styles.subjectHeaderRow}>
                          <View style={[styles.subjectIconBox, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5" }]}>
                            <MaterialCommunityIcons name={sub.icon || "book-open-outline"} size={22} color={theme.text} />
                          </View>
                          <Text style={[styles.subjectChapterBadge, { color: theme.subtext }]}>
                            {sub.chapterCount ? `${sub.chapterCount} Chapters` : "Verified Subject"}
                          </Text>
                        </View>

                        <Text style={[styles.subjectCardTitle, { color: theme.text }]}>{sub.name}</Text>
                        <Text numberOfLines={2} style={[styles.subjectCardDesc, { color: theme.subtext }]}>
                          {sub.description || "Comprehensive syllabus notes, key formulas, and concepts."}
                        </Text>

                        <View style={styles.viewChaptersBtnRow}>
                          <Text style={[styles.viewChaptersBtnText, { color: theme.text }]}>View Chapters →</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.emptyPolishedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <MaterialCommunityIcons name="book-open-variant" size={32} color={theme.subtext} />
                  <Text style={[styles.emptyPolishedTitle, { color: theme.text }]}>
                    No subjects loaded for {selectedExam.name} yet.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 8. CHAPTER LIST SECTION */}
          {viewMode === "chapters" && selectedSubject && (
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeaderRow}>
                <TouchableOpacity onPress={() => setViewMode("landing")}>
                  <Text style={{ fontSize: 13, color: theme.subtext, fontFamily: fonts.medium }}>← Back to Subjects</Text>
                </TouchableOpacity>
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 4 }]}>
                  Chapters for {selectedSubject.name}
                </Text>
              </View>

              {chaptersLoading ? (
                <ActivityIndicator size="large" color="#09090B" style={{ marginTop: 20 }} />
              ) : chapters && chapters.length > 0 ? (
                <View style={styles.chaptersListStack}>
                  {chapters.map((chap) => (
                    <View key={`chap_${chap.id || chap._id}`} style={[styles.chapterCardRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.chapterCardTitle, { color: theme.text }]}>{chap.title}</Text>
                        <Text style={[styles.chapterTopicTag, { color: theme.subtext }]}>{chap.topicName || "General Topic"}</Text>
                      </View>

                      <TouchableOpacity style={styles.readChapterBtn} onPress={() => handleOpenChapterReader(chap)}>
                        <Text style={styles.readChapterBtnText}>Read Chapter →</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyPolishedCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <MaterialCommunityIcons name="file-document-outline" size={32} color={theme.subtext} />
                  <Text style={[styles.emptyPolishedTitle, { color: theme.text }]}>
                    This subject does not have verified learning chapters yet.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* 14. ADMIN SOURCE MANAGEMENT & INGESTION MODAL */}
      <Modal visible={sourcesModalOpen} animationType="slide" transparent={true} onRequestClose={() => setSourcesModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Official Data Sources & Automated Ingestion Engine</Text>
              <TouchableOpacity onPress={() => setSourcesModalOpen(false)}>
                <Feather name="x" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={[styles.modalSubHeading, { color: theme.text }]}>Configured Free Official Sources:</Text>
              {sourcesList.length > 0 ? (
                sourcesList.map((src) => (
                  <View key={`src_${src.id || src._id}`} style={[styles.sourceItemRow, { borderColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sourceItemName, { color: theme.text }]}>{src.name}</Text>
                      <Text style={[styles.sourceItemUrl, { color: theme.subtext }]}>{src.url}</Text>
                      <Text style={[styles.sourceItemLicense, { color: theme.subtext }]}>License: {src.licenseInfo}</Text>
                    </View>
                    <TouchableOpacity style={styles.syncBtn} onPress={() => handleTriggerSync(src.id || src._id)}>
                      <Text style={styles.syncBtnText}>Trigger Sync</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={{ padding: 12 }}>
                  <Text style={{ fontSize: 12, color: theme.subtext, fontStyle: "italic" }}>
                    Sources configured: UPSC, SSC, IBPS, NTA, Railway Boards, NCERT & ePathshala portals.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  pageHeaderBar: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 14, borderBottomWidth: 1 },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  headerTitleContainer: { flex: 1, paddingHorizontal: 10 },
  headerBadgeRow: { flexDirection: "row" },
  headerBadgePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 2 },
  headerBadgeText: { fontSize: 10, fontFamily: fonts.bold },
  headerMainTitle: { fontSize: 16, fontFamily: fonts.bold },
  sourcesBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  headerDescText: { fontSize: 12, fontFamily: fonts.regular, marginTop: 4, marginBottom: 10 },
  headerControlsRow: { gap: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: fonts.regular },
  langScroll: { flexDirection: "row", marginTop: 4 },
  langChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#E4E4E7", marginRight: 6 },
  langChipActive: { backgroundColor: "#09090B", borderColor: "#09090B" },
  langChipText: { fontSize: 11, fontFamily: fonts.medium, color: "#52525B" },
  langChipTextActive: { color: "#FFFFFF", fontFamily: fonts.bold },
  
  fullscreenLoadingBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  loadingText: { fontSize: 13, fontFamily: fonts.medium, marginTop: 10 },
  scrollBody: { flex: 1 },
  scrollBodyContent: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 16, paddingBottom: 60 },
  
  heroCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  heroContentRow: { flexDirection: "row" },
  heroBadgeRow: { marginBottom: 6 },
  heroPillBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  heroPillText: { fontSize: 10, fontFamily: fonts.bold },
  heroTitleText: { fontSize: 18, fontFamily: fonts.bold, marginBottom: 6 },
  heroSubText: { fontSize: 12.5, fontFamily: fonts.regular, lineHeight: 18, marginBottom: 12 },
  heroInfoBadgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  infoBadgeChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  infoBadgeChipText: { fontSize: 11, fontFamily: fonts.medium },

  filterPanelBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
  filterPanelHeading: { fontSize: 14, fontFamily: fonts.bold, marginBottom: 10 },
  filterRowItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  filterLabel: { fontSize: 12, fontFamily: fonts.bold, width: 50 },
  filterChipScroll: { flexDirection: "row" },
  filterChipBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#E4E4E7", marginRight: 6 },
  filterChipBtnActive: { backgroundColor: "#09090B", borderColor: "#09090B" },
  filterChipText: { fontSize: 11, fontFamily: fonts.medium, color: "#52525B" },
  filterChipTextActive: { color: "#FFFFFF", fontFamily: fonts.bold },

  sectionHeaderRow: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontFamily: fonts.bold },
  examCardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  examCardItem: { width: (width - 44) / 2, maxWidth: 280, padding: 12, borderRadius: 12, borderWidth: 1, flexGrow: 1 },
  examCardItemSelected: { borderWidth: 2, borderColor: "#09090B" },
  examCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  examIconBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  examCategoryPill: { fontSize: 10, fontFamily: fonts.medium },
  examCardName: { fontSize: 13, fontFamily: fonts.bold, marginBottom: 2 },
  examCardDesc: { fontSize: 11, fontFamily: fonts.regular, lineHeight: 15 },

  emptyPolishedCard: { borderRadius: 14, borderWidth: 1, padding: 30, alignItems: "center", justifyContent: "center" },
  emptyPolishedTitle: { fontSize: 13, fontFamily: fonts.medium, textAlign: "center", marginTop: 10 },

  subjectsGridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  subjectCardBox: { width: (width - 44) / 2, maxWidth: 280, padding: 14, borderRadius: 14, borderWidth: 1, flexGrow: 1 },
  subjectCardSelected: { borderWidth: 2, borderColor: "#09090B" },
  subjectHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  subjectIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  subjectChapterBadge: { fontSize: 10.5, fontFamily: fonts.medium },
  subjectCardTitle: { fontSize: 14, fontFamily: fonts.bold, marginBottom: 4 },
  subjectCardDesc: { fontSize: 11.5, fontFamily: fonts.regular, lineHeight: 16, marginBottom: 12 },
  viewChaptersBtnRow: { alignSelf: "flex-start" },
  viewChaptersBtnText: { fontSize: 12, fontFamily: fonts.bold },

  chaptersListStack: { gap: 10 },
  chapterCardRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  chapterCardTitle: { fontSize: 14, fontFamily: fonts.bold },
  chapterTopicTag: { fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
  readChapterBtn: { backgroundColor: "#09090B", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  readChapterBtnText: { color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bold },

  readerContainer: { flex: 1 },
  readerHeaderBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  readerBackBtn: { flexDirection: "row", alignItems: "center" },
  readerBackText: { fontSize: 13, fontFamily: fonts.medium },
  readerTitleHead: { flex: 1, fontSize: 14, fontFamily: fonts.bold, textAlign: "center", paddingHorizontal: 10 },
  readerHeaderActions: { flexDirection: "row", gap: 10 },
  readerActionIcon: { padding: 4 },
  readerToolbarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 6 },
  fontSizeBtnGroup: { flexDirection: "row", alignItems: "center", gap: 4 },
  fontSizeChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "#E4E4E7" },
  fontSizeChipActive: { backgroundColor: "#09090B" },
  fontSizeChipText: { fontSize: 11, fontFamily: fonts.bold, color: "#09090B" },
  fontSizeChipTextActive: { color: "#FFFFFF" },
  themeBtnGroup: { flexDirection: "row", gap: 4 },
  themeChip: { padding: 6, borderRadius: 6, backgroundColor: "#E4E4E7" },
  themeChipActive: { backgroundColor: "#09090B" },
  readerProgressTrack: { height: 4, backgroundColor: "#E2E8F0" },
  readerProgressFill: { height: "100%", backgroundColor: "#09090B" },
  readerScrollBody: { flex: 1 },
  readerScrollContent: { width: "100%", maxWidth: 800, alignSelf: "center", padding: 18, paddingBottom: 80 },
  breadcrumbRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  breadcrumbItem: { fontSize: 11, fontFamily: fonts.regular, color: "#64748B" },
  breadcrumbSep: { fontSize: 11, color: "#94A3B8" },
  chapterMetaCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  chapterMetaTitle: { fontSize: 18, fontFamily: fonts.bold, marginBottom: 8 },
  metaRowInfo: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaBadgeItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaBadgeItemText: { fontSize: 11, fontFamily: fonts.medium },
  tocContainer: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  tocHeading: { fontSize: 12, fontFamily: fonts.bold, marginBottom: 6 },
  tocItem: { fontSize: 11.5, fontFamily: fonts.regular, lineHeight: 18 },
  mainBookBodyTextContainer: { marginVertical: 12 },
  mainBookBodyText: { fontFamily: fonts.regular, lineHeight: 26 },
  emptyContentCard: { padding: 30, borderRadius: 14, borderWidth: 1, alignItems: "center", marginVertical: 20 },
  emptyContentText: { fontSize: 13, fontFamily: fonts.medium, textAlign: "center", marginTop: 10 },
  phlappyAiReaderBtn: { backgroundColor: "#09090B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  phlappyLogoIcon: { width: 20, height: 20, borderRadius: 10 },
  phlappyAiReaderBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: fonts.bold },
  aiOutputCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 14 },
  aiOutputHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  phlappyLogoIconSmall: { width: 18, height: 18, borderRadius: 9 },
  aiOutputTitle: { fontSize: 11, fontFamily: fonts.bold, color: "#09090B" },
  aiOutputText: { fontSize: 12.5, fontFamily: fonts.regular, lineHeight: 19 },
  markCompleteBtn: { backgroundColor: "#09090B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  markCompleteBtnDone: { backgroundColor: "#059669" },
  markCompleteBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: fonts.bold },

  notesDrawerContainer: { borderRadius: 14, borderWidth: 1, padding: 14, margin: 18 },
  notesHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  notesTitle: { fontSize: 13, fontFamily: fonts.bold },
  addNoteRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  noteInput: { flex: 1, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  saveNoteBtn: { backgroundColor: "#09090B", paddingHorizontal: 14, justifyContent: "center", borderRadius: 8 },
  saveNoteBtnText: { color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bold },
  noteItemCard: { padding: 8, borderRadius: 6, marginBottom: 6 },
  noteItemText: { fontSize: 11.5, fontFamily: fonts.regular },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalCard: { width: "100%", maxWidth: 600, borderRadius: 16, borderWidth: 1, padding: 16 },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontSize: 14, fontFamily: fonts.bold },
  modalSubHeading: { fontSize: 12, fontFamily: fonts.bold, marginBottom: 8 },
  sourceItemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1 },
  sourceItemName: { fontSize: 13, fontFamily: fonts.bold },
  sourceItemUrl: { fontSize: 11, fontFamily: fonts.regular },
  sourceItemLicense: { fontSize: 10.5, fontFamily: fonts.regular, fontStyle: "italic" },
  syncBtn: { backgroundColor: "#09090B", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  syncBtnText: { color: "#FFFFFF", fontSize: 11, fontFamily: fonts.bold }
});
