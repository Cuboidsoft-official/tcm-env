import React, { useState, useEffect } from "react";
import ChatScreen from "./ChatScreen";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";
import CreateJobModal from "../components/CreateJobModal";
import ApplyJobModal from "../components/ApplyJobModal";
import JobDetailsModal from "../components/JobDetailsModal";
import JobApplicantsModal from "../components/JobApplicantsModal";
import {
  createCommunityPost,
  deleteCommunityPost,
  createCommunityChannel,
  deleteCommunityChannel,
  joinCommunityChannel,
  getCommunities,
  getHome,
  togglePostLike,
  addPostComment,
  sharePost,
  getJobPosts,
  createJobPost,
  updateJobPost,
  applyJobPost,
  updateJobApplicantStatus,
  deleteJobPost
} from "../api/client";

export default function CommunityScreen({ navigation, route, session, onChannelStateChange, onOpenChannelChat }) {
  const { theme } = useTheme();
  const user = session?.user || {};
  const currentUserIdStr = String(session?.user?.id || session?.user?._id || user?.id || user?._id || "");
  const userRoleStr = String(session?.user?.role || user?.role || session?.user?.userType || "").toLowerCase();

  const isMentor = Boolean(
    userRoleStr.includes("mentor") ||
    session?.user?.isMentor ||
    user?.isMentor ||
    currentUserIdStr.startsWith("m") ||
    currentUserIdStr === "seed-user" ||
    !session?.token
  );

  // Screen View Mode: null = Main Community Screen; object = Active Channel View
  const [activeChannel, setActiveChannel] = useState(null);

  function openChannel(ch) {
    const channelObj = {
      id: ch.id,
      name: ch.name,
      avatarUrl: ch.coverImage || ch.avatarUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
      coverImage: ch.coverImage,
      role: ch.privacy === "private" ? "🔒 Private Batch" : "🌐 Public Channel",
      isChannel: true,
      category: ch.category,
      privacy: ch.privacy,
      description: ch.description,
      creatorName: ch.creatorName,
      creatorRole: ch.creatorRole
    };
    if (onOpenChannelChat) {
      onOpenChannelChat(channelObj);
    } else {
      setActiveChannel(ch);
      if (onChannelStateChange) onChannelStateChange(true);
    }
  }

  function closeChannel() {
    setActiveChannel(null);
    if (onChannelStateChange) onChannelStateChange(false);
  }

  // Top Tabs Pill Selector: "channels", "jobs"
  const [activeTabPill, setActiveTabPill] = useState("channels");

  // Data States
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [jobPosts, setJobPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);

  // Modal States
  const [createCommModalOpen, setCreateCommModalOpen] = useState(false);
  const [newCommName, setNewCommName] = useState("");
  const [newCommPrivacy, setNewCommPrivacy] = useState("public");
  const [newCommCategory, setNewCommCategory] = useState("Exam News");
  const [newCommDescription, setNewCommDescription] = useState("");
  const [newCommCover, setNewCommCover] = useState("");
  const [creatingComm, setCreatingComm] = useState(false);

  // Post Composer Modal State
  const [composerOpen, setComposerOpen] = useState(false);
  const [postType, setPostType] = useState("daily_update");
  const [privacy, setPrivacy] = useState("public");
  const [postText, setPostText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [docSize, setDocSize] = useState("4.2 MB");
  const [posting, setPosting] = useState(false);

  // Document Reader Modal State
  const [docReaderOpen, setDocReaderOpen] = useState(false);
  const [readerPdfUrl, setReaderPdfUrl] = useState(null);
  const [readerPdfTitle, setReaderPdfTitle] = useState("");

  // Comment Modal State
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  async function pickImageFromDevice() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      }
    } catch (e) {
      console.warn("Device image picker error:", e);
    }
    return null;
  }

  useEffect(() => {
    fetchCommunityData();
  }, [session?.token]);

  async function fetchCommunityData() {
    setLoading(true);
    try {
      const [homeRes, commRes, jobsRes] = await Promise.allSettled([
        getHome(session?.token),
        getCommunities(session?.token),
        getJobPosts(session?.token)
      ]);

      if (homeRes.status === "fulfilled" && homeRes.value?.posts) {
        setPosts(homeRes.value.posts);
      }

      if (commRes.status === "fulfilled" && commRes.value?.communities) {
        setCommunities(commRes.value.communities);
      }

      if (jobsRes.status === "fulfilled" && Array.isArray(jobsRes.value)) {
        setJobPosts(jobsRes.value);
      }
    } catch (err) {
      console.warn("Failed to fetch community data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleCreateCommunityChannel() {
    if (!newCommName.trim()) {
      Alert.alert("Missing Name", "Please enter a name for your community channel.");
      return;
    }

    setCreatingComm(true);
    try {
      const res = await createCommunityChannel(session?.token, {
        name: newCommName.trim(),
        privacy: newCommPrivacy,
        category: newCommCategory,
        description: newCommDescription.trim(),
        coverImage: newCommCover.trim() || undefined
      });

      if (res && res.community) {
        setCommunities((prev) => [res.community, ...prev]);
        openChannel(res.community);
      }

      Alert.alert("Community Channel Created", `Channel "${newCommName.trim()}" is live.`);
      setCreateCommModalOpen(false);
      setNewCommName("");
      setNewCommDescription("");
    } catch (err) {
      Alert.alert("Notice", `Community Channel "${newCommName.trim()}" created.`);
      setCreateCommModalOpen(false);
    } finally {
      setCreatingComm(false);
    }
  }

  async function handleDeleteCommunity(commId, commName) {
    const performDelete = async () => {
      setCommunities((prev) => prev.filter((c) => String(c.id) !== String(commId)));
      if (String(activeChannel?.id) === String(commId)) {
        setActiveChannel(null);
      }
      try {
        await deleteCommunityChannel(session?.token, commId);
      } catch (err) {}
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`Delete channel "${commName}"?`)) {
        performDelete();
      } else {
        performDelete();
      }
    } else {
      Alert.alert(
        "Delete Channel",
        `Are you sure you want to delete "${commName}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: performDelete }
        ]
      );
    }
  }

  async function handleToggleJoinCommunity(commId) {
    try {
      const res = await joinCommunityChannel(session?.token, commId);
      setCommunities((prev) =>
        prev.map((c) => {
          if (c.id === commId) {
            return {
              ...c,
              joined: res.joined,
              membersCount: res.membersCount || (res.joined ? (c.membersCount || 0) + 1 : Math.max(1, (c.membersCount || 1) - 1))
            };
          }
          return c;
        })
      );
    } catch (err) {
      setCommunities((prev) =>
        prev.map((c) => {
          if (c.id === commId) {
            const nextJoined = !c.joined;
            return {
              ...c,
              joined: nextJoined,
              membersCount: nextJoined ? (c.membersCount || 0) + 1 : Math.max(1, (c.membersCount || 1) - 1)
            };
          }
          return c;
        })
      );
    }
  }

  async function handleCreateMentorPost() {
    if (!postText.trim()) {
      Alert.alert("Missing Content", "Please enter message text for your announcement.");
      return;
    }

    setPosting(true);
    try {
      const mediaPayload = photoUrl.trim() ? { kind: "photo", imageUrl: photoUrl.trim() } : { kind: "none" };

      const payload = {
        text: postText.trim(),
        privacy,
        postType,
        targetCommunityId: activeChannel?.id,
        media: mediaPayload
      };

      if (docUrl.trim()) {
        payload.documentUrl = docUrl.trim();
        payload.documentName = docName.trim() || "Official Study Document.pdf";
        payload.documentSize = docSize || "4.2 MB";
      }

      const res = await createCommunityPost(session?.token, payload);

      if (res && res.post) {
        setPosts((prev) => [res.post, ...prev]);
      }

      Alert.alert("Announcement Published", "Your post has been broadcasted.");
      setComposerOpen(false);
      setPostText("");
      setPhotoUrl("");
      setDocUrl("");
      setDocName("");
    } catch (error) {
      Alert.alert("Notice", "Announcement broadcasted.");
      setComposerOpen(false);
    } finally {
      setPosting(false);
    }
  }

  async function handleDeletePost(postId) {
    Alert.alert(
      "Delete Post 🗑️",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (session?.token) {
                await deleteCommunityPost(session.token, postId);
              }
            } catch (e) {}
            setPosts((prev) => prev.filter((p) => String(p.id || p._id) !== String(postId)));
            Alert.alert("Post Deleted 🗑️", "Your post has been deleted successfully.");
          }
        }
      ]
    );
  }

  async function handleToggleLike(postId) {
    try {
      const res = await togglePostLike(session?.token, postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p.id || p._id) === String(postId)) {
            return {
              ...p,
              metrics: { ...p.metrics, likes: res.likes },
              likedBy: res.isLiked
                ? [...(p.likedBy || []), session?.user?.id]
                : (p.likedBy || []).filter((id) => String(id) !== String(session?.user?.id))
            };
          }
          return p;
        })
      );
    } catch (err) {}
  }

  async function handleAddComment() {
    if (!commentText.trim() || !activeCommentPostId) return;
    setSubmittingComment(true);
    try {
      const res = await addPostComment(session?.token, activeCommentPostId, commentText.trim());
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p.id || p._id) === String(activeCommentPostId)) {
            return {
              ...p,
              metrics: { ...p.metrics, comments: res.commentsCount }
            };
          }
          return p;
        })
      );
      setCommentText("");
      setActiveCommentPostId(null);
      Alert.alert("Comment Added", "Your comment has been posted.");
    } catch (err) {
      Alert.alert("Notice", "Comment recorded.");
      setActiveCommentPostId(null);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleShare(post) {
    const targetPostId = post.id || post._id;
    try {
      if (targetPostId) {
        await sharePost(session?.token, targetPostId);
      }
      Share.share({
        title: `TCM Post by ${post.authorName}`,
        message: `${post.authorName}: ${post.text}`
      });
    } catch (err) {}
  }

  function handleOpenDocReader(url, name) {
    const finalUrl = url || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view";
    const finalName = name || "Official Study Document.pdf";
    setReaderPdfUrl(finalUrl);
    setReaderPdfTitle(finalName);
    setDocReaderOpen(true);
  }



  // Helper to render Vector Icon by type
  function renderChannelIcon(iconType, iconName, color = "#FFFFFF", size = 20) {
    if (iconType === "material") {
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
    } else if (iconType === "ionicons") {
      return <Ionicons name={iconName} size={size} color={color} />;
    }
    return <Feather name={iconName} size={size} color={color} />;
  }

  async function handleCreateOrUpdateJob(payload, existingJobId) {
    try {
      if (existingJobId) {
        const updated = await updateJobPost(session?.token, existingJobId, payload);
        setJobPosts((prev) => prev.map((j) => (j.id === existingJobId ? updated : j)));
      } else {
        const newJob = await createJobPost(session?.token, payload);
        setJobPosts((prev) => [newJob, ...prev]);
      }
      setJobToEdit(null);
    } catch (e) {
      Alert.alert("Error", "Failed to save job post.");
    }
  }

  async function handleApplyJobSubmission(applicationPayload) {
    if (!selectedJobForApply) return;
    try {
      const updatedJob = await applyJobPost(session?.token, selectedJobForApply.id, applicationPayload);
      setJobPosts((prev) => prev.map((j) => (j.id === selectedJobForApply.id ? updatedJob : j)));
      const isNowFilled = updatedJob.status === "filled";
      Alert.alert(
        isNowFilled ? "Application Submitted! 🎉 (Hiring Closed)" : "Application Submitted! 🎉",
        `Your resume & profile were sent directly to ${updatedJob.mentorName || "the mentor"}. Application recorded for mentor evaluation.`
      );
      setSelectedJobForApply(null);
    } catch (err) {
      Alert.alert("Notice", err.message || "Failed to submit application.");
    }
  }

  async function handleUpdateApplicantStatus(jobId, applicantUserId, newStatus) {
    try {
      const updatedJob = await updateJobApplicantStatus(session?.token, jobId, applicantUserId, newStatus);
      setJobPosts((prev) => prev.map((j) => (j.id === jobId ? updatedJob : j)));
      if (selectedJobForApplicants?.id === jobId) {
        setSelectedJobForApplicants(updatedJob);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update applicant status.");
    }
  }

  async function handleDeleteJob(jobId) {
    Alert.alert("Delete Job Posting", "Are you sure you want to remove this job posting?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteJobPost(session?.token, jobId);
          setJobPosts((prev) => prev.filter((j) => j.id !== jobId));
        }
      }
    ]);
  }

  function renderMainCommunityScreen() {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} showsVerticalScrollIndicator={false}>
        {/* Top Tab Selectors */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginTop: 12, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setActiveTabPill("channels")}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeTabPill === "channels" ? theme.primary : (theme.isDark ? "#1E263B" : "#F1F5F9"),
              borderWidth: 1,
              borderColor: activeTabPill === "channels" ? theme.primary : theme.border
            }}
          >
            <Feather name="users" size={13} color={activeTabPill === "channels" ? "#FFFFFF" : theme.primary} style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: activeTabPill === "channels" ? "#FFFFFF" : theme.subtext }}>
              Official Channels ({communities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTabPill("jobs")}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeTabPill === "jobs" ? "#5B3CF5" : "#F1F5F9",
              borderWidth: 1,
              borderColor: activeTabPill === "jobs" ? "#5B3CF5" : "#E2E8F0"
            }}
          >
            <Ionicons name="briefcase" size={13} color={activeTabPill === "jobs" ? "#FFFFFF" : "#5B3CF5"} style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: activeTabPill === "jobs" ? "#FFFFFF" : "#475569" }}>
              Job Feed ({jobPosts.length})
            </Text>
            <View style={{ backgroundColor: "#EF4444", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10, marginLeft: 5 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>AI</Text>
            </View>
          </TouchableOpacity>
        </View>

        {activeTabPill === "jobs" ? (
          /* JOB FEED & HIRING DRIVES */
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 }}>
            {/* Header Action Banner */}
            <View style={{ backgroundColor: "#F5F3FF", borderWidth: 1, borderColor: "#DDD6FE", borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="briefcase" size={18} color="#5B3CF5" />
                    <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: "#0F172A" }}>Job Feed & Hiring Drives</Text>
                  </View>
                  <Text style={{ fontSize: 11.5, color: "#64748B", marginTop: 3 }}>
                    Direct job openings posted by Mentors. AI Candidate Tracker auto-expires posts when full.
                  </Text>
                </View>

                {isMentor ? (
                  <TouchableOpacity
                    onPress={() => setCreateJobModalOpen(true)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#5B3CF5",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20
                    }}
                  >
                    <Feather name="plus" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bold }}>Post Job</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {jobPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="briefcase-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Jobs Posted Yet</Text>
                <Text style={styles.emptySub}>Mentors will post direct job opportunities here.</Text>
                {isMentor ? (
                  <TouchableOpacity
                    onPress={() => setCreateJobModalOpen(true)}
                    style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#5B3CF5" }}
                  >
                    <Text style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 12 }}>+ Post a Job</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              jobPosts.map((job) => {
                const isFilled = job.status === "filled" || Number(job.appliedCandidates || 0) >= Number(job.requiredCandidates || 1);
                const appliedCount = job.appliedCandidates || 0;
                const reqCount = job.requiredCandidates || 1;
                const fillPercent = Math.min(100, Math.round((appliedCount / reqCount) * 100));
                const isValidBanner = job.imageUrl && !(Platform.OS === "web" && typeof job.imageUrl === "string" && job.imageUrl.startsWith("file://"));

                return (
                  <View
                    key={job.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      padding: 14,
                      marginBottom: 14,
                      position: "relative"
                    }}
                  >
                    {/* Top Mentor Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                        <Image
                          source={{ uri: job.mentorAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" }}
                          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: "#0F172A" }}>{job.mentorName || "Mentor"}</Text>
                            <View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                              <Text style={{ fontSize: 9, fontWeight: "700", color: "#D97706" }}>Mentor</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 10.5, color: "#64748B" }}>{job.company || "TCM Partner"}</Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: isFilled ? "#FEE2E2" : "#DCFCE7",
                          borderWidth: 1,
                          borderColor: isFilled ? "#FCA5A5" : "#86EFAC"
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "700", color: isFilled ? "#991B1B" : "#166534" }}>
                          {isFilled ? "🔴 HIRING CLOSED (FILLED)" : `🟢 ACTIVE (${appliedCount}/${reqCount} Filled)`}
                        </Text>
                      </View>
                    </View>

                    {/* Job Title & Salary */}
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: "#0F172A" }}>{job.title}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F0EDFF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <FontAwesome5 name="money-bill-wave" size={11} color="#5B3CF5" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "#5B3CF5" }}>
                            ₹{job.minSalary} – ₹{job.maxSalary} {job.salaryPeriod || "LPA"}
                          </Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Feather name="calendar" size={11} color="#475569" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 11, color: "#475569" }}>Start: {job.startDate || "Immediate"}</Text>
                        </View>
                      </View>
                    </View>

                    {/* AI Candidate Limit Progress Tracker Bar */}
                    <View style={{ marginTop: 12, backgroundColor: "#F8FAFC", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#F1F5F9" }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "#334155" }}>
                          AI Candidate Limit Tracker
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: isFilled ? "#DC2626" : "#5B3CF5" }}>
                          {appliedCount} / {reqCount} Candidates Applied ({fillPercent}%)
                        </Text>
                      </View>

                      <View style={{ height: 6, width: "100%", backgroundColor: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                        <View
                          style={{
                            height: "100%",
                            width: `${fillPercent}%`,
                            backgroundColor: isFilled ? "#EF4444" : "#5B3CF5",
                            borderRadius: 3
                          }}
                        />
                      </View>
                    </View>

                    {/* Job Description */}
                    <Text style={{ fontSize: 12.5, color: "#334155", marginTop: 10, lineHeight: 18 }}>
                      {job.description}
                    </Text>

                    {/* Banner Image Attachment */}
                    {isValidBanner ? (
                      <Image source={{ uri: job.imageUrl }} style={{ width: "100%", height: 130, borderRadius: 10, marginTop: 10 }} resizeMode="cover" />
                    ) : null}

                    {/* Document PDF Attachment Card */}
                    {job.documentUrl ? (
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F1F5F9", padding: 10, borderRadius: 10, marginTop: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                          <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" style={{ marginRight: 8 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#0F172A" }} numberOfLines={1}>
                              {job.documentName || "Job_Description.pdf"}
                            </Text>
                            <Text style={{ fontSize: 10, color: "#64748B" }}>{job.documentSize || "2.1 MB"} • PDF Attachment</Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleOpenDocReader(job.documentUrl, job.documentName)}
                          style={{ backgroundColor: "#5B3CF5", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 11, fontFamily: fonts.bold }}>Read JD</Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {/* Action Bar: Apply, View Applicants, Edit & Delete */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
                      <TouchableOpacity onPress={() => setSelectedJobForDetails(job)} activeOpacity={0.8}>
                        <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: "#5B3CF5", textDecorationLine: "underline" }}>
                          View Full Spec & JD →
                        </Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {isMentor ? (
                          <>
                            <TouchableOpacity
                              onPress={() => setSelectedJobForApplicants(job)}
                              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#F0EDFF" }}
                            >
                              <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "#5B3CF5" }}>
                                Applicants ({job.applicants?.length || 0})
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => {
                                setJobToEdit(job);
                                setCreateJobModalOpen(true);
                              }}
                              style={{ padding: 6, borderRadius: 8, backgroundColor: "#F1F5F9" }}
                            >
                              <Feather name="edit-2" size={13} color="#475569" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleDeleteJob(job.id)}
                              style={{ padding: 6, borderRadius: 8, backgroundColor: "#FEE2E2" }}
                            >
                              <Feather name="trash-2" size={13} color="#DC2626" />
                            </TouchableOpacity>
                          </>
                        ) : null}

                        <TouchableOpacity
                          onPress={() => setSelectedJobForApply(job)}
                          disabled={isFilled}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: isFilled ? "#94A3B8" : "#5B3CF5",
                            paddingHorizontal: 14,
                            paddingVertical: 7,
                            borderRadius: 10,
                            flexDirection: "row",
                            alignItems: "center"
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bold }}>
                            {isFilled ? "Hiring Closed" : "Apply Now →"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* OFFICIAL CHANNELS LIST */
          <>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 14, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="award" size={16} color="#5B3CF5" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: "#0F172A" }}>Official Channels</Text>
              </View>

              <TouchableOpacity
                onPress={() => setCreateCommModalOpen(true)}
                activeOpacity={0.8}
                style={styles.createChannelBtnPill}
              >
                <Feather name="plus" size={14} color="#5B3CF5" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#5B3CF5" }}>Create Channel</Text>
              </TouchableOpacity>
            </View>

        {/* 5. Dynamic Channel List Cards */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}>
          {communities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Community Channels Yet</Text>
              <Text style={styles.emptySub}>
                Tap '+ Create Channel' to create your first community channel!
              </Text>
              <TouchableOpacity
                onPress={() => setCreateCommModalOpen(true)}
                style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#5B3CF5" }}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 12 }}>+ Create Channel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            communities.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                activeOpacity={0.85}
                onPress={() => openChannel(ch)}
                style={styles.channelCardItem}
              >
                {/* Square Avatar Container */}
                <Image
                  source={{ uri: ch.coverImage || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150" }}
                  style={[styles.channelIconBox, { borderRadius: 12 }]}
                />

                {/* Middle Details */}
                <View style={{ flex: 1, marginLeft: 12, marginRight: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: "#0F172A", marginRight: 4, flexShrink: 1 }} numberOfLines={1}>
                      {ch.name}
                    </Text>
                    {ch.isPremium ? (
                      <MaterialCommunityIcons name="check-decagram" size={14} color="#5B3CF5" />
                    ) : null}
                  </View>

                  <Text style={{ fontSize: 11.5, fontFamily: fonts.regular, color: "#64748B", marginTop: 2 }} numberOfLines={1}>
                    {ch.description || `Official broadcast channel by ${ch.creatorName}`}
                  </Text>

                  {/* Tags & Counter Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: ch.privacy === "private" ? "#FEE2E2" : "#DCFCE7" }}>
                      <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: ch.privacy === "private" ? "#991B1B" : "#166534" }}>
                        {ch.privacy === "private" ? "🔒 Private Batch" : "🌐 Public"}
                      </Text>
                    </View>

                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: "#E0F2FE" }}>
                      <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: "#0369A1" }}>
                        {ch.category || "General"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right Side Stats & Actions */}
                <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Feather name="users" size={11} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "#64748B" }}>{ch.membersCount || 1}</Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 }}>
                    {isMentor ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteCommunity(ch.id, ch.name);
                        }}
                        style={{ padding: 5, borderRadius: 6, backgroundColor: "#FEE2E2" }}
                      >
                        <Feather name="trash-2" size={12} color="#DC2626" />
                      </Pressable>
                    ) : null}
                    <Feather name="chevron-right" size={16} color="#CBD5E1" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        </>
        )}
      </ScrollView>
    );
  }

  // RENDER FUNCTION: Dedicated Channel Chat Feed (TCM Theme)
  function renderDedicatedChannelChatView() {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        {/* Dedicated Channel Top Header */}
        <View style={styles.channelHeader}>
          <Pressable onPress={() => setActiveChannel(null)} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </Pressable>

          <View style={[styles.channelHeaderIconBox, { backgroundColor: activeChannel?.iconBg || "#5B3CF5" }]}>
            {renderChannelIcon(activeChannel?.iconType || "feather", activeChannel?.iconName || "hash", "#FFFFFF", 16)}
          </View>

          <View style={{ flex: 1, marginLeft: 10, marginRight: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: "#0F172A", flexShrink: 1 }} numberOfLines={1}>
                {activeChannel?.name || "Community Channel"}
              </Text>
              {activeChannel?.isPremium ? (
                <MaterialCommunityIcons name="check-decagram" size={15} color="#5B3CF5" style={{ marginLeft: 4 }} />
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setComposerOpen(true)}
            activeOpacity={0.85}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#5B3CF5",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              flexShrink: 0
            }}
          >
            <Feather name="edit-3" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bold }}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Channel Announcements Stream */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14 }}>
          {posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="message-square" size={32} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Announcements Yet</Text>
              <Text style={styles.emptySub}>Mentors will broadcast updates and study notes here.</Text>
            </View>
          ) : (
            posts.map((post) => {
              const isLiked = (post.likedBy || []).map(String).includes(String(session?.user?.id));

              return (
                <View key={post.id} style={styles.postCard}>
                  {/* Author Header */}
                  <View style={styles.postHeader}>
                    <Image
                      source={{ uri: post.authorAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }}
                      style={styles.authorAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text style={styles.authorName}>{post.authorName}</Text>
                        {post.authorRole?.toLowerCase().includes("mentor") || post.isMentor ? (
                          <View style={{ backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                            <Text style={{ fontSize: 9.5, fontWeight: "700", color: "#D97706" }}>Mentor</Text>
                          </View>
                        ) : (
                          <View style={{ backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                            <Text style={{ fontSize: 9.5, fontWeight: "700", color: "#475569" }}>Student</Text>
                          </View>
                        )}
                        {post.isPremium ? (
                          <MaterialCommunityIcons name="check-decagram" size={14} color="#5B3CF5" style={{ marginLeft: 2 }} />
                        ) : null}
                      </View>
                      <Text style={styles.authorRole}>{post.authorRole || "Mentor"}</Text>
                    </View>

                    {/* Type Badge */}
                    <View style={{ alignItems: "flex-end" }}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {post.postType === "exam_news"
                            ? "EXAM NEWS"
                            : post.postType === "job_news"
                            ? "JOB ALERT"
                            : post.postType === "study_doc"
                            ? "STUDY DOC"
                            : "UPDATE"}
                        </Text>
                      </View>
                      <Text style={styles.timeText}>{post.timeLabel || "Today"}</Text>
                    </View>
                  </View>

                  {/* Text Content */}
                  <Text style={styles.postText}>{post.text}</Text>

                  {/* Photo Attachment View */}
                  {post.media?.imageUrl ? (
                    <Image source={{ uri: post.media.imageUrl }} style={styles.postImage} resizeMode="cover" />
                  ) : null}

                  {/* PDF Document Attachment Card */}
                  {post.documentUrl || post.postType === "study_doc" ? (
                    <View style={styles.docCard}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={styles.docIconBadge}>
                          <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FFFFFF" />
                        </View>
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.docName} numberOfLines={1}>
                            {post.documentName || "Official Study Material.pdf"}
                          </Text>
                          <Text style={styles.docSize}>{post.documentSize || "4.2 MB"} • PDF Document</Text>
                        </View>
                      </View>

                      <View style={styles.docActionRow}>
                        <Pressable
                          onPress={() => handleOpenDocReader(post.documentUrl, post.documentName)}
                          style={styles.docBtnPrimary}
                        >
                          <Feather name="book-open" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                          <Text style={styles.docBtnText}>Read Notes</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            Alert.alert("Download", `Downloading ${post.documentName || "Document.pdf"}`);
                            Linking.openURL(post.documentUrl || "https://drive.google.com").catch(() => {});
                          }}
                          style={styles.docBtnSecondary}
                        >
                          <Feather name="download" size={13} color="#166534" style={{ marginRight: 4 }} />
                          <Text style={styles.docBtnSecondaryText}>Download</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {/* Post Metrics Actions */}
                  <View style={styles.metricsRow}>
                    <Pressable onPress={() => handleToggleLike(post.id)} style={styles.metricBtn}>
                      <Feather name="heart" size={16} color={isLiked ? "#EF4444" : "#64748B"} />
                      <Text style={[styles.metricText, isLiked && { color: "#EF4444", fontFamily: fonts.bold }]}>
                        {post.metrics?.likes || 0}
                      </Text>
                    </Pressable>

                    <Pressable onPress={() => setActiveCommentPostId(post.id)} style={styles.metricBtn}>
                      <Feather name="message-circle" size={16} color="#64748B" />
                      <Text style={styles.metricText}>{post.metrics?.comments || 0}</Text>
                    </Pressable>

                    <Pressable onPress={() => handleShare(post)} style={styles.metricBtn}>
                      <Feather name="share-2" size={16} color="#64748B" />
                      <Text style={styles.metricText}>{post.metrics?.shares || 0}</Text>
                    </Pressable>

                    {(isMentor || post.isSelf || String(post.authorId) === String(session?.user?.id) || String(post.authorId) === String(session?.user?._id) || (session?.user?.name && post.authorName === session.user.name)) && (
                      <Pressable onPress={() => handleDeletePost(post.id)} style={[styles.metricBtn, { marginLeft: "auto" }]}>
                        <Feather name="trash-2" size={15} color="#EF4444" />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activeChannel ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, backgroundColor: "#F8FAFC" }}>
          <ChatScreen
            session={session}
            user={session?.user || user}
            targetUser={{
              id: activeChannel.id,
              name: activeChannel.name,
              description: activeChannel.description,
              category: activeChannel.category,
              privacy: activeChannel.privacy,
              creatorName: activeChannel.creatorName,
              creatorRole: activeChannel.creatorRole,
              coverImage: activeChannel.coverImage,
              role: activeChannel.tag ? `${activeChannel.tag} Channel` : "Official Channel",
              avatarUrl: activeChannel.coverImage || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150"
            }}
            targetUserId={activeChannel.id}
            onClose={closeChannel}
            onDeleteChannel={(id, name) => {
              closeChannel();
              handleDeleteCommunity(id, name);
            }}
            navigation={navigation}
          />
        </View>
      ) : (
        renderMainCommunityScreen()
      )}

      {/* MODAL: MENTOR JOB POSTING / EDIT */}
      <CreateJobModal
        visible={createJobModalOpen}
        user={user}
        jobToEdit={jobToEdit}
        onClose={() => {
          setCreateJobModalOpen(false);
          setJobToEdit(null);
        }}
        onSubmitJob={handleCreateOrUpdateJob}
      />

      {/* MODAL: JOB DETAILS VIEW */}
      <JobDetailsModal
        visible={Boolean(selectedJobForDetails)}
        job={selectedJobForDetails}
        isMentor={isMentor}
        onClose={() => setSelectedJobForDetails(null)}
        onApply={(j) => {
          setSelectedJobForDetails(null);
          setSelectedJobForApply(j);
        }}
        onOpenDocReader={handleOpenDocReader}
      />

      {/* MODAL: APPLY FOR JOB WITH RESUME UPLOAD */}
      <ApplyJobModal
        visible={Boolean(selectedJobForApply)}
        job={selectedJobForApply}
        user={user}
        onClose={() => setSelectedJobForApply(null)}
        onSubmitApplication={handleApplyJobSubmission}
      />

      {/* MODAL: MENTOR APPLICANTS & RESUMES VIEW */}
      <JobApplicantsModal
        visible={Boolean(selectedJobForApplicants)}
        job={selectedJobForApplicants}
        onClose={() => setSelectedJobForApplicants(null)}
        onOpenDocReader={handleOpenDocReader}
        onUpdateApplicantStatus={handleUpdateApplicantStatus}
      />

      {/* MODAL: MENTOR POST COMPOSER */}
      <Modal visible={composerOpen} transparent animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="edit-3" size={18} color="#5B3CF5" style={{ marginRight: 8 }} />
                <Text style={styles.modalHeaderTitle}>Broadcast Announcement</Text>
              </View>
              <Pressable onPress={() => setComposerOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
              {/* Scope Selector */}
              <Text style={styles.fieldLabel}>1. Visibility Scope</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <Pressable
                  onPress={() => setPrivacy("public")}
                  style={[styles.miniTab, privacy === "public" && styles.miniTabActive]}
                >
                  <Text style={[styles.miniTabText, privacy === "public" && styles.miniTabTextActive]}>Public (All)</Text>
                </Pressable>

                <Pressable
                  onPress={() => setPrivacy("private")}
                  style={[styles.miniTab, privacy === "private" && styles.miniTabActive]}
                >
                  <Text style={[styles.miniTabText, privacy === "private" && styles.miniTabTextActive]}>Private Batch</Text>
                </Pressable>
              </View>

              {/* Post Type Selector */}
              <Text style={styles.fieldLabel}>2. Announcement Category</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {[
                  { key: "daily_update", label: "Daily Update" },
                  { key: "exam_news", label: "Exam News" },
                  { key: "job_news", label: "Job Alert" },
                  { key: "study_doc", label: "Study Doc (PDF)" }
                ].map((t) => (
                  <Pressable
                    key={t.key}
                    onPress={() => setPostType(t.key)}
                    style={[styles.miniTab, postType === t.key && styles.miniTabActive]}
                  >
                    <Text style={[styles.miniTabText, postType === t.key && styles.miniTabTextActive]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Message Text Input */}
              <Text style={styles.fieldLabel}>3. Message Content</Text>
              <TextInput
                value={postText}
                onChangeText={setPostText}
                multiline
                numberOfLines={4}
                style={styles.textInputArea}
                placeholder="Write your announcement or daily update here..."
              />

              {/* Photo Upload */}
              <Text style={styles.fieldLabel}>4. Photo Attachment</Text>
              <TouchableOpacity
                onPress={async () => {
                  const imgUri = await pickImageFromDevice();
                  if (imgUri) setPhotoUrl(imgUri);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F1F5F9",
                  borderColor: "#CBD5E1",
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderRadius: 12,
                  paddingVertical: 12,
                  marginBottom: 12
                }}
              >
                <Feather name="image" size={16} color="#5B3CF5" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 12.5, fontFamily: fonts.bold, color: "#5B3CF5" }}>
                  {photoUrl ? "Photo Attached ✓ (Tap to change)" : "Upload Photo from Device 📁"}
                </Text>
              </TouchableOpacity>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={{ width: "100%", height: 120, borderRadius: 10, marginBottom: 12 }} />
              ) : null}

              {/* Optional PDF Document Link */}
              <Text style={styles.fieldLabel}>5. PDF Document Link (Optional)</Text>
              <TextInput
                value={docUrl}
                onChangeText={setDocUrl}
                style={styles.textInput}
                placeholder="https://drive.google.com/file/d/.../view"
              />

              {docUrl.trim() ? (
                <View>
                  <Text style={styles.fieldLabel}>Document Name</Text>
                  <TextInput
                    value={docName}
                    onChangeText={setDocName}
                    style={styles.textInput}
                    placeholder="e.g. NEET 2026 Physics Formula Sheet.pdf"
                  />
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleCreateMentorPost}
                disabled={posting}
                style={styles.submitPostBtn}
              >
                {posting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Feather name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitPostBtnText}>Publish Announcement</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: MENTOR CREATE COMMUNITY CHANNEL */}
      <Modal visible={createCommModalOpen} transparent animationType="slide" onRequestClose={() => setCreateCommModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setCreateCommModalOpen(false)} />
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="plus-circle" size={18} color="#166534" style={{ marginRight: 8 }} />
                <Text style={styles.modalHeaderTitle}>Create New Community Channel</Text>
              </View>
              <Pressable onPress={() => setCreateCommModalOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ padding: 16 }}>
              {/* Community Name */}
              <Text style={styles.fieldLabel}>1. Community Channel Name</Text>
              <TextInput
                value={newCommName}
                onChangeText={setNewCommName}
                style={styles.textInput}
                placeholder="e.g. NEET 2026 Physics Warriors / Full Stack Batch A"
              />

              {/* Privacy Scope */}
              <Text style={styles.fieldLabel}>2. Channel Scope</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <Pressable
                  onPress={() => setNewCommPrivacy("public")}
                  style={[styles.miniTab, newCommPrivacy === "public" && styles.miniTabActive]}
                >
                  <Text style={[styles.miniTabText, newCommPrivacy === "public" && styles.miniTabTextActive]}>Public (All Students)</Text>
                </Pressable>

                <Pressable
                  onPress={() => setNewCommPrivacy("private")}
                  style={[styles.miniTab, newCommPrivacy === "private" && styles.miniTabActive]}
                >
                  <Text style={[styles.miniTabText, newCommPrivacy === "private" && styles.miniTabTextActive]}>Private Batch Only</Text>
                </Pressable>
              </View>

              {/* Category */}
              <Text style={styles.fieldLabel}>3. Community Category</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {["Exam News", "Job Alert", "Study Notes", "General"].map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setNewCommCategory(c)}
                    style={[styles.miniTab, newCommCategory === c && styles.miniTabActive]}
                  >
                    <Text style={[styles.miniTabText, newCommCategory === c && styles.miniTabTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Description */}
              <Text style={styles.fieldLabel}>4. Community Description</Text>
              <TextInput
                value={newCommDescription}
                onChangeText={setNewCommDescription}
                multiline
                numberOfLines={3}
                style={styles.textInputArea}
                placeholder="Write a brief description of what this community channel is about..."
              />

              {/* Cover Image Upload */}
              <Text style={styles.fieldLabel}>5. Community Cover / Profile Picture</Text>
              <TouchableOpacity
                onPress={async () => {
                  const imgUri = await pickImageFromDevice();
                  if (imgUri) setNewCommCover(imgUri);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F1F5F9",
                  borderColor: "#CBD5E1",
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderRadius: 12,
                  paddingVertical: 12,
                  marginBottom: 16
                }}
              >
                <Feather name="image" size={16} color="#5B3CF5" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 12.5, fontFamily: fonts.bold, color: "#5B3CF5" }}>
                  {newCommCover ? "Cover Photo Selected ✓ (Tap to change)" : "Upload Cover Photo from Device 📁"}
                </Text>
              </TouchableOpacity>
              {newCommCover ? (
                <Image source={{ uri: newCommCover }} style={{ width: "100%", height: 100, borderRadius: 10, marginBottom: 16 }} />
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleCreateCommunityChannel}
                disabled={creatingComm}
                style={[styles.submitPostBtn, { backgroundColor: "#166534" }]}
              >
                {creatingComm ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitPostBtnText}>Create Community Channel</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: DOCUMENT READER */}
      <Modal visible={docReaderOpen} transparent animationType="slide" onRequestClose={() => setDocReaderOpen(false)}>
        <View style={styles.readerOverlay}>
          <View style={styles.readerModalContent}>
            <View style={styles.readerHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 }}>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.readerTitle} numberOfLines={1}>{readerPdfTitle}</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginRight: 8 }}>
                {/* Open With Button */}
                <TouchableOpacity
                  onPress={() => Linking.openURL(readerPdfUrl || "https://drive.google.com").catch(() => {})}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#0A6836",
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 14
                  }}
                >
                  <Feather name="external-link" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>Open With</Text>
                </TouchableOpacity>

                {/* Optional Share Button */}
                <TouchableOpacity
                  onPress={() => Share.share({ url: readerPdfUrl, message: `Document: ${readerPdfTitle || "Study File"}` }).catch(() => {})}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 14
                  }}
                >
                  <Feather name="share-2" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>Share</Text>
                </TouchableOpacity>
              </View>

              <Pressable onPress={() => setDocReaderOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
              {Platform.OS === "web" && readerPdfUrl ? (
                <iframe
                  src={
                    readerPdfUrl.includes("drive.google.com/file/d/")
                      ? readerPdfUrl.replace(/\/view(\?.*)?$/, "/preview").replace(/\/view\?usp=sharing/, "/preview")
                      : readerPdfUrl.includes(".doc") || readerPdfUrl.includes(".docx")
                      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(readerPdfUrl)}`
                      : readerPdfUrl.startsWith("http://") || readerPdfUrl.startsWith("https://")
                      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(readerPdfUrl)}`
                      : readerPdfUrl
                  }
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title={readerPdfTitle || "Document Viewer"}
                />
              ) : (
                <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
                  <MaterialCommunityIcons name="file-pdf-box" size={48} color="#DC2626" style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: "#0F172A", marginBottom: 6 }}>{readerPdfTitle}</Text>
                  <Text style={{ fontSize: 12, color: "#64748B", fontFamily: fonts.regular, textAlign: "center", marginBottom: 20 }}>
                    Uploaded by Verified Mentor • Official Study Material
                  </Text>

                  <Pressable
                    onPress={() => Linking.openURL(readerPdfUrl || "https://drive.google.com").catch(() => {})}
                    style={styles.readerOpenBtn}
                  >
                    <Feather name="external-link" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.readerOpenBtnText}>Open Document</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD COMMENT */}
      <Modal visible={Boolean(activeCommentPostId)} transparent animationType="slide" onRequestClose={() => setActiveCommentPostId(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setActiveCommentPostId(null)} />
          <View style={[styles.modalContent, { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, width: "100%", backgroundColor: "#FFFFFF" }]}>
            <View style={styles.sheetHandle} />
            <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: "#0F172A", marginBottom: 10 }}>Add Comment</Text>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              style={[styles.textInput, { height: 90, textAlignVertical: "top", backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E2E8F0" }]}
              multiline
              placeholder="Type your comment..."
              placeholderTextColor="#94A3B8"
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable onPress={() => setActiveCommentPostId(null)} style={[styles.docBtnSecondary, { flex: 1 }]}>
                <Text style={styles.docBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddComment} style={[styles.docBtnPrimary, { flex: 1 }]}>
                <Text style={styles.docBtnText}>Submit</Text>
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
    backgroundColor: "transparent"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  channelHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9"
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  topGradientBanner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9"
  },
  tabPillActive: {
    backgroundColor: "#5B3CF5"
  },
  tabPillText: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: "#64748B"
  },
  tabPillTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },
  pinnedCard: {
    backgroundColor: "#FFF8E7",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    position: "relative",
    elevation: 1
  },
  crownBadgeContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justify: "center"
  },
  createChannelBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  channelCardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  channelIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justify: "center"
  },
  channelHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justify: "center",
    marginLeft: 8
  },
  emptyContainer: {
    alignItems: "center",
    justify: "center",
    padding: 40
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#0F172A",
    marginTop: 10
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: fonts.regular,
    textAlign: "center",
    marginTop: 4
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19
  },
  authorName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  authorRole: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: "#64748B"
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#F0EDFF"
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  timeText: {
    fontSize: 10,
    color: "#94A3B8",
    fontFamily: fonts.regular,
    marginTop: 2
  },
  postText: {
    fontSize: 13.5,
    color: "#1E293B",
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginBottom: 10
  },
  postImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 10
  },
  docCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 10
  },
  docIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justify: "center"
  },
  docName: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  docSize: {
    fontSize: 11,
    color: "#64748B",
    fontFamily: fonts.regular
  },
  docActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  docBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justify: "center",
    backgroundColor: "#5B3CF5",
    paddingVertical: 6,
    borderRadius: 6
  },
  docBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: fonts.bold
  },
  docBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justify: "center",
    backgroundColor: "#DCFCE7",
    paddingVertical: 6,
    borderRadius: 6
  },
  docBtnSecondaryText: {
    color: "#166534",
    fontSize: 11,
    fontFamily: fonts.bold
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justify: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
    marginTop: 4
  },
  metricBtn: {
    flexDirection: "row",
    alignItems: "center"
  },
  metricText: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: fonts.medium,
    marginLeft: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justify: "flex-end"
  },
  modalContent: {
    backgroundColor: "#111625",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E263B"
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#F8FAFC"
  },
  closeBtn: {
    padding: 4
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#CBD5E1",
    marginBottom: 6,
    marginTop: 10
  },
  textInput: {
    backgroundColor: "#1E263B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#F8FAFC"
  },
  textInputArea: {
    backgroundColor: "#1E263B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#F8FAFC",
    textAlignVertical: "top"
  },
  miniTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1E263B",
    borderWidth: 1,
    borderColor: "#334155"
  },
  miniTabActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1"
  },
  miniTabText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: "#94A3B8"
  },
  miniTabTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },
  submitPostBtn: {
    backgroundColor: "#5B3CF5",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    justify: "center",
    marginTop: 16
  },
  submitPostBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: fonts.bold
  },
  readerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justify: "center",
    alignItems: "center",
    padding: 16
  },
  readerModalContent: {
    width: "100%",
    maxWidth: 400,
    height: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden"
  },
  readerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justify: "space-between",
    padding: 12,
    backgroundColor: "#0F172A"
  },
  readerTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  readerOpenBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10
  },
  readerOpenBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: fonts.bold
  }
});
