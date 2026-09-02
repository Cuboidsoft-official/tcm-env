import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colors, shadow } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Date filter presets
const DATE_FILTERS = [
  {
    id: 'this_month',
    label: 'May 1 – May 31, 2025',
    tag: 'This Month',
    totalRevenue: '₹0',
    monthlyRevenue: '₹0',
    studentsCount: 0,
    mentorsCount: 0,
    growth: '0% vs last month'
  },
  {
    id: 'last_month',
    label: 'April 1 – April 30, 2025',
    tag: 'Last Month',
    totalRevenue: '₹0',
    monthlyRevenue: '₹0',
    studentsCount: 0,
    mentorsCount: 0,
    growth: '0% vs previous month'
  },
  {
    id: 'quarter',
    label: 'Mar 1 – May 31, 2025',
    tag: 'Last 3 Months',
    totalRevenue: '₹0',
    monthlyRevenue: '₹0',
    studentsCount: 0,
    mentorsCount: 0,
    growth: '0% vs previous quarter'
  },
  {
    id: 'year',
    label: 'Jan 1 – May 31, 2025',
    tag: 'This Year (2025)',
    totalRevenue: '₹0',
    monthlyRevenue: '₹0',
    studentsCount: 0,
    mentorsCount: 0,
    growth: '0% YoY Growth'
  }
];

export default function PartnerDashboardScreen({ session, onBack }) {
  const { theme } = useTheme();

  // Internal Section Tab State: 'Overview' | 'Students' | 'Mentors' | 'Revenue' | 'Profile'
  const [activeSection, setActiveSection] = useState('Overview');

  const user = session?.user || {};

  // Extract user values
  const [overrideMetrics, setOverrideMetrics] = useState(null);

  // Date Filter Modal State & Selected Filter
  const [showDateFilterSheet, setShowDateFilterSheet] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState(DATE_FILTERS[0]);

  // General Bottom Sheet Item Modal State (for non-editable cards)
  const [selectedSheetItem, setSelectedSheetItem] = useState(null);

  // Help & Support Bottom Sheet Modal State
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [helpViewMode, setHelpViewMode] = useState('menu'); // 'menu' | 'request_changes' | 'raise_ticket'

  // Form states for Request Changes
  const [changeField, setChangeField] = useState('Institute Name');
  const [changeValue, setChangeValue] = useState('');
  const [changeReason, setChangeReason] = useState('');

  // Form states for Support Ticket
  const [ticketCategory, setTicketCategory] = useState('Billing & Payouts');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');

  const instituteName = user.instituteName || user.name || 'Partner Institute';
  const partnerCategory = user.partnerCategory || 'Last Class Partner Institute';
  const location = user.location || 'Bilaspur, Chhattisgarh';
  const rating = user.rating !== undefined && user.rating !== null ? user.rating : 0;
  const reviewsCount = user.reviewsCount !== undefined && user.reviewsCount !== null ? user.reviewsCount : '0 Reviews';
  const contactNumber = user.contactNumber || 'Not Provided';
  const logoUrl =
    user.avatarUrl ||
    'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=400&q=80';

  // Dynamic values
  const totalRevenue = overrideMetrics ? overrideMetrics.totalRevenue : (user.totalRevenue || activeDateFilter.totalRevenue || '₹0');
  const monthlyRevenue = overrideMetrics ? overrideMetrics.monthlyRevenue : (user.monthlyRevenue || activeDateFilter.monthlyRevenue || '₹0');
  const totalStudents = overrideMetrics ? overrideMetrics.studentsCount : (user.totalStudentsCount !== undefined ? user.totalStudentsCount : activeDateFilter.studentsCount);
  const activeMentors = overrideMetrics ? overrideMetrics.mentorsCount : (user.activeMentorsCount !== undefined ? user.activeMentorsCount : activeDateFilter.mentorsCount);

  const existingCourses = Array.isArray(user.existingCourses) && user.existingCourses.length > 0
    ? user.existingCourses
    : [];

  const recentStudents = Array.isArray(user.recentStudents) && user.recentStudents.length > 0
    ? user.recentStudents
    : [];

  const galleryImages = Array.isArray(user.galleryPhotos) && user.galleryPhotos.length > 0
    ? user.galleryPhotos
    : [
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500',
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'
      ];

  // Reset ALL metrics to 0
  const handleResetData = () => {
    setOverrideMetrics({
      totalRevenue: '₹0',
      monthlyRevenue: '₹0',
      studentsCount: 0,
      mentorsCount: 0
    });
    setActiveDateFilter(DATE_FILTERS[0]);
    Alert.alert('Metrics Reset', 'All overview stats and revenue figures reset to ₹0.');
  };

  // Submit Request for Changes
  const handleSubmitChangeRequest = () => {
    if (!changeValue.trim()) {
      Alert.alert('Required Field', 'Please enter the new requested value.');
      return;
    }
    const ticketId = `REQ-${Date.now().toString().slice(-4)}`;
    Alert.alert(
      'Request Submitted Successfully! 🎉',
      `Ticket ID: ${ticketId}\nField: ${changeField}\nRequested Value: ${changeValue}\n\nTCM Admin will review your profile edit request within 24 hours.`
    );
    setChangeValue('');
    setChangeReason('');
    setShowHelpSheet(false);
    setHelpViewMode('menu');
  };

  // Submit Support Ticket
  const handleSubmitSupportTicket = () => {
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      Alert.alert('Required Fields', 'Please enter both Subject and Description.');
      return;
    }
    const ticketId = `TCK-${Date.now().toString().slice(-4)}`;
    Alert.alert(
      'Support Ticket Raised! 🎫',
      `Ticket ID: ${ticketId}\nCategory: ${ticketCategory}\nSubject: ${ticketSubject}\nStatus: Open (Admin Reviewing)\n\nOur partner support team will contact you shortly.`
    );
    setTicketSubject('');
    setTicketDescription('');
    setShowHelpSheet(false);
    setHelpViewMode('menu');
  };

  // Open item sheet helper
  const openItemSheet = (type) => {
    switch (type) {
      case 'profile_picture':
        setSelectedSheetItem({
          type: 'profile_picture',
          icon: 'image-outline',
          color: colors.primary,
          title: 'Institute Profile Logo',
          subtitle: 'Official Brand Asset',
          details: 'Your official verified institute emblem displayed across Last Class search & student course cards.',
          image: logoUrl
        });
        break;
      case 'gallery_photos':
        setSelectedSheetItem({
          type: 'gallery_photos',
          icon: 'images-outline',
          color: colors.primaryDark,
          title: 'Campus & Facility Gallery',
          subtitle: `${galleryImages.length} Campus Photographs Uploaded`,
          details: 'High resolution photos of labs, classrooms, and campus events displayed on your public partner page.',
          photos: galleryImages
        });
        break;
      case 'description':
        setSelectedSheetItem({
          type: 'description',
          icon: 'document-text-outline',
          color: colors.primary,
          title: 'Institute Description',
          subtitle: 'About Your Educational Center',
          details: user.bio || `${instituteName} is an accredited educational partner with Last Class.`
        });
        break;
      case 'existing_courses':
        setSelectedSheetItem({
          type: 'existing_courses',
          icon: 'book-outline',
          color: colors.primary,
          title: 'Courses Offered',
          subtitle: `${existingCourses.length} Certified Training Programs`,
          details: existingCourses.length > 0 ? 'Programs currently offered at your institute under Last Class accreditation.' : 'No courses registered yet.',
          coursesList: existingCourses
        });
        break;
      case 'contact_number':
        setSelectedSheetItem({
          type: 'contact_number',
          icon: 'call-outline',
          color: colors.primary,
          title: 'Official Contact Info',
          subtitle: 'Primary Institute Support',
          details: `Phone: ${contactNumber}\nEmail: ${user.email || 'partner@tcm.com'}\nHours: Mon - Sat (9:00 AM - 7:00 PM)`,
          phone: contactNumber
        });
        break;
      case 'map_location':
        setSelectedSheetItem({
          type: 'map_location',
          icon: 'location-outline',
          color: colors.primary,
          title: 'Campus Location & Address',
          subtitle: location,
          details: `Address: ${location}.\nPin Code: 495001\nLandmark: Near Last Class Tech Hub`
        });
        break;
      case 'reviews_ratings':
        setSelectedSheetItem({
          type: 'reviews_ratings',
          icon: 'star-outline',
          color: colors.amber,
          title: 'Student Ratings & Feedback',
          subtitle: `${rating} ⭐ Stars (${reviewsCount})`,
          details: `Overall rating calculated from ${reviewsCount} verified student reviews.`
        });
        break;
      default:
        break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg || colors.bg }]}>
      {/* Top Header: Back Button + Title + HELP ICON */}
      <View style={[styles.screenHeader, { borderBottomColor: theme.border || colors.border, backgroundColor: theme.bg || colors.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
          <Feather name="arrow-left" size={18} color={theme.text || colors.ink} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text || colors.ink }]}>Partner Console</Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext || colors.muted }]} numberOfLines={1}>
            {instituteName}
          </Text>
        </View>

        {/* HELP ICON BUTTON */}
        <TouchableOpacity
          onPress={() => {
            setHelpViewMode('menu');
            setShowHelpSheet(true);
          }}
          style={[styles.helpHeaderBtn, { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }]}
        >
          <Ionicons name="help-circle" size={18} color={colors.badgeText} />
          <Text style={[styles.helpBtnLabel, { color: colors.badgeText }]}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={[styles.card, { backgroundColor: colors.lavender, borderColor: colors.lavenderLine }]}>
          <View style={styles.profileLeft}>
            <View style={styles.logoContainer}>
              <Image source={{ uri: logoUrl }} style={styles.logoImage} />
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.verifiedIcon} />
            </View>
            <View style={styles.profileMeta}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.instituteName, { color: colors.ink }]} numberOfLines={1}>
                  {instituteName}
                </Text>
                <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
              </View>
              <Text style={[styles.categoryText, { color: colors.muted }]} numberOfLines={1}>{partnerCategory}</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={13} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.muted }]} numberOfLines={1}>{location}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="star" size={13} color={colors.amber} />
                <Text style={[styles.infoText, { fontWeight: '600', color: colors.ink }]}>
                  {rating}
                </Text>
                <Text style={[styles.infoText, { color: colors.muted }]}>({reviewsCount})</Text>
              </View>
            </View>
          </View>
        </View>

        {/* NATURE THEME INTERNAL SECTION TABS */}
        <View style={styles.sectionTabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabsContent}>
            {[
              { id: 'Overview', label: 'Overview', icon: 'grid-outline' },
              { id: 'Students', label: 'Students', icon: 'people-outline' },
              { id: 'Mentors', label: 'Mentors', icon: 'school-outline' },
              { id: 'Revenue', label: 'Revenue', icon: 'cash-outline' },
              { id: 'Profile', label: 'Profile', icon: 'business-outline' }
            ].map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveSection(tab.id)}
                  style={[
                    styles.sectionTabPill,
                    {
                      backgroundColor: isActive ? colors.primary : (theme.cardBg || colors.card),
                      borderColor: isActive ? colors.primary : (theme.border || colors.border)
                    }
                  ]}
                >
                  <Ionicons name={tab.icon} size={15} color={isActive ? '#FFFFFF' : (theme.subtext || colors.muted)} style={{ marginRight: 5 }} />
                  <Text style={[styles.sectionTabText, { color: isActive ? '#FFFFFF' : (theme.text || colors.ink), fontWeight: isActive ? '700' : '500' }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SECTION 1: OVERVIEW */}
        {activeSection === 'Overview' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>Overview Metrics</Text>
                <TouchableOpacity onPress={handleResetData} style={[styles.resetBadgeBtn, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="refresh" size={12} color={colors.primary} />
                  <Text style={[styles.resetBadgeText, { color: colors.primary }]}>Reset (Set 0)</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setShowDateFilterSheet(true)}
                style={[styles.dateFilterPill, { backgroundColor: theme.cardBg || colors.card, borderColor: colors.lavenderLine }]}
              >
                <Ionicons name="calendar-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.dateFilterText, { color: theme.text || colors.ink }]}>{activeDateFilter.tag}</Text>
                <Ionicons name="chevron-down" size={13} color={theme.subtext || colors.muted} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* Overview 4 Stat Cards */}
            <View style={styles.overviewGrid}>
              <View style={styles.overviewRow}>
                {/* Card 1: Total Revenue */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Total Revenue', `Total Revenue: ${totalRevenue}`)}
                  style={[styles.statBox, { backgroundColor: colors.lavender, borderColor: colors.lavenderLine }]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="currency-rupee" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statBoxTitle} numberOfLines={1}>Total Revenue</Text>
                  <Text style={[styles.statBoxVal, { color: colors.ink }]} numberOfLines={1}>{totalRevenue}</Text>
                  <Text style={[styles.statBoxSub, { color: colors.primary }]} numberOfLines={1}>{activeDateFilter.tag}</Text>
                </TouchableOpacity>

                {/* Card 2: Students from Last Class */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Students Count', `Total Students enrolled: ${totalStudents}`)}
                  style={[styles.statBox, { backgroundColor: colors.mint, borderColor: colors.badgeBorder }]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                    <Ionicons name="people-outline" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statBoxTitle} numberOfLines={1}>Students from Last Class</Text>
                  <Text style={[styles.statBoxVal, { color: colors.ink }]} numberOfLines={1}>{totalStudents}</Text>
                  <Text style={[styles.statBoxSub, { color: colors.primary }]} numberOfLines={1}>Total Students</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.overviewRow}>
                {/* Card 3: Mentors */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Active Mentors', `${activeMentors} Certified Instructors.`)}
                  style={[styles.statBox, { backgroundColor: colors.yellowSoft, borderColor: '#FFE082' }]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.amber }]}>
                    <Ionicons name="person-outline" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statBoxTitle} numberOfLines={1}>Mentors</Text>
                  <Text style={[styles.statBoxVal, { color: colors.ink }]} numberOfLines={1}>{activeMentors}</Text>
                  <Text style={[styles.statBoxSub, { color: '#D97706' }]} numberOfLines={1}>Active Mentors</Text>
                </TouchableOpacity>

                {/* Card 4: Monthly Revenue */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Monthly Revenue', `Monthly Revenue: ${monthlyRevenue}`)}
                  style={[styles.statBox, { backgroundColor: colors.lavender, borderColor: colors.lavenderLine }]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.primaryDark }]}>
                    <Ionicons name="trending-up-outline" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statBoxTitle} numberOfLines={1}>Monthly Revenue</Text>
                  <Text style={[styles.statBoxVal, { color: colors.ink }]} numberOfLines={1}>{monthlyRevenue}</Text>
                  <Text style={[styles.statBoxSub, { color: colors.primaryDark }]} numberOfLines={1}>{activeDateFilter.tag}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Student & Revenue Summary Cards */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>
                Student & Revenue Summary
              </Text>
              <TouchableOpacity onPress={() => setShowDateFilterSheet(true)}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>Change Filter</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
                <Text style={[styles.summaryLabel, { color: theme.subtext || colors.muted }]}>Students from Last Class</Text>
                <Text style={[styles.summaryVal, { color: theme.text || colors.ink }]}>{totalStudents}</Text>
                <View style={styles.growthRow}>
                  <Ionicons name="arrow-up" size={12} color={colors.primary} />
                  <Text style={[styles.growthText, { color: colors.primary }]}>{activeDateFilter.growth}</Text>
                </View>
                <View style={styles.sparklineMock}>
                  <View style={[styles.sparkWave, { borderColor: colors.primary }]} />
                </View>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
                <Text style={[styles.summaryLabel, { color: theme.subtext || colors.muted }]}>Monthly Revenue</Text>
                <Text style={[styles.summaryVal, { color: theme.text || colors.ink }]}>{monthlyRevenue}</Text>
                <View style={styles.growthRow}>
                  <Ionicons name="arrow-up" size={12} color={colors.primary} />
                  <Text style={[styles.growthText, { color: colors.primary }]}>0% vs previous month</Text>
                </View>
                <View style={styles.sparklineMock}>
                  <View style={[styles.sparkWave, { borderColor: colors.primaryDark }]} />
                </View>
              </View>
            </View>
          </>
        )}

        {/* SECTION 2: STUDENTS TAB */}
        {activeSection === 'Students' && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>Enrolled Students ({recentStudents.length})</Text>
            </View>
            {recentStudents.length === 0 ? (
              <View style={[styles.card, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border, alignItems: 'center', padding: 24 }]}>
                <Ionicons name="people-outline" size={36} color={theme.subtext || colors.muted} style={{ marginBottom: 6 }} />
                <Text style={{ fontFamily: 'Poppins_500Medium', color: theme.subtext || colors.muted, fontSize: 13 }}>No recent students enrolled yet.</Text>
              </View>
            ) : (
              <View style={styles.studentsList}>
                {recentStudents.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Student Profile', `${item.name}\nCourse: ${item.course}\nEnrolled: ${item.date}`)}
                    style={[styles.studentCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}
                  >
                    <Image source={{ uri: item.avatarUrl }} style={styles.studentAvatar} />
                    <View style={styles.studentMeta}>
                      <Text style={[styles.studentName, { color: theme.text || colors.ink }]}>{item.name}</Text>
                      <Text style={[styles.studentCourse, { color: theme.subtext || colors.muted }]}>{item.course}</Text>
                    </View>
                    <View style={styles.studentRight}>
                      <Text style={[styles.studentDate, { color: theme.subtext || colors.muted }]}>Enrolled: {item.date}</Text>
                      <View style={[styles.activeBadge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.activeBadgeText, { color: colors.primary }]}>{item.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* SECTION 3: MENTORS TAB */}
        {activeSection === 'Mentors' && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>Active Institute Mentors ({activeMentors})</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.lavender, borderColor: colors.lavenderLine, padding: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.infoIconBg, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="school" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', color: colors.ink, fontSize: 14 }}>Last Class Certified Instructors</Text>
                  <Text style={{ fontFamily: 'Poppins_400Regular', color: colors.muted, fontSize: 12 }}>{activeMentors} instructors assigned to institute courses.</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 4: REVENUE TAB */}
        {activeSection === 'Revenue' && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>Revenue Analytics</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.lavender, borderColor: colors.lavenderLine }]}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Gross Revenue</Text>
              <Text style={[styles.summaryVal, { color: colors.ink, fontSize: 26 }]}>{totalRevenue}</Text>
              <Text style={{ color: colors.primary, fontFamily: 'Poppins_600SemiBold', marginTop: 4 }}>
                Settlement Status: All Payouts Cleared
              </Text>
            </View>
          </View>
        )}

        {/* SECTION 5: PROFILE GRID (OR DISPLAYED ON OVERVIEW) */}
        {(activeSection === 'Overview' || activeSection === 'Profile') && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>
                Institution Profile (Not Editable)
              </Text>
            </View>

            <View style={styles.alignedGridContainer}>
              {/* Row 1 */}
              <View style={styles.alignedGridRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openItemSheet('profile_picture')}
                  style={[styles.alignedInfoCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}
                >
                  <View style={styles.infoCardContent}>
                    <View style={[styles.infoIconBg, { backgroundColor: colors.mint }]}>
                      <Ionicons name="image-outline" size={17} color={colors.primary} />
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={[styles.infoCardTitle, { color: theme.text || colors.ink }]} numberOfLines={1}>Profile Picture</Text>
                      <Text style={[styles.infoCardSub, { color: theme.subtext || colors.muted }]} numberOfLines={1}>Your institute logo</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openItemSheet('gallery_photos')}
                  style={[styles.alignedInfoCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}
                >
                  <View style={styles.infoCardContent}>
                    <View style={[styles.infoIconBg, { backgroundColor: colors.mint }]}>
                      <Ionicons name="images-outline" size={17} color={colors.primary} />
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={[styles.infoCardTitle, { color: theme.text || colors.ink }]} numberOfLines={1}>Gallery Photos</Text>
                      <Text style={[styles.infoCardSub, { color: theme.subtext || colors.muted }]} numberOfLines={1}>Institute photos</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.alignedGridRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openItemSheet('description')}
                  style={[styles.alignedInfoCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}
                >
                  <View style={styles.infoCardContent}>
                    <View style={[styles.infoIconBg, { backgroundColor: colors.blueSoft }]}>
                      <Ionicons name="document-text-outline" size={17} color="#0284C7" />
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={[styles.infoCardTitle, { color: theme.text || colors.ink }]} numberOfLines={1}>Description</Text>
                      <Text style={[styles.infoCardSub, { color: theme.subtext || colors.muted }]} numberOfLines={1}>About institute</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openItemSheet('existing_courses')}
                  style={[styles.alignedInfoCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}
                >
                  <View style={styles.infoCardContent}>
                    <View style={[styles.infoIconBg, { backgroundColor: colors.mint }]}>
                      <Ionicons name="book-outline" size={17} color={colors.primary} />
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={[styles.infoCardTitle, { color: theme.text || colors.ink }]} numberOfLines={1}>Existing Courses</Text>
                      <Text style={[styles.infoCardSub, { color: theme.subtext || colors.muted }]} numberOfLines={1}>{existingCourses.length} courses</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Row 3 */}
              <View style={styles.alignedGridRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openItemSheet('contact_number')}
                  style={[styles.alignedInfoCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}
                >
                  <View style={styles.infoCardContent}>
                    <View style={[styles.infoIconBg, { backgroundColor: colors.mint }]}>
                      <Ionicons name="call-outline" size={17} color={colors.primary} />
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={[styles.infoCardTitle, { color: theme.text || colors.ink }]} numberOfLines={1}>Contact Number</Text>
                      <Text style={[styles.infoCardSub, { color: theme.subtext || colors.muted }]} numberOfLines={1}>{contactNumber}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openItemSheet('map_location')}
                  style={[styles.alignedInfoCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}
                >
                  <View style={styles.infoCardContent}>
                    <View style={[styles.infoIconBg, { backgroundColor: '#FEF2F2' }]}>
                      <Ionicons name="location-outline" size={17} color="#DC2626" />
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={[styles.infoCardTitle, { color: theme.text || colors.ink }]} numberOfLines={1}>Map Location</Text>
                      <Text style={[styles.infoCardSub, { color: theme.subtext || colors.muted }]} numberOfLines={1}>{location}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Row 4 - Full Width Reviews Card */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openItemSheet('reviews_ratings')}
                style={[styles.fullWidthInfoCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}
              >
                <View style={styles.infoCardContent}>
                  <View style={[styles.infoIconBg, { backgroundColor: colors.yellowSoft }]}>
                    <Ionicons name="star-outline" size={17} color={colors.amber} />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={[styles.infoCardTitle, { color: theme.text || colors.ink }]}>Reviews & Ratings</Text>
                    <Text style={[styles.infoCardSub, { color: theme.subtext || colors.muted }]}>{rating} ⭐ ({reviewsCount})</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* 1. DATE FILTER BOTTOM SHEET MODAL */}
      <Modal
        visible={showDateFilterSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateFilterSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowDateFilterSheet(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              { backgroundColor: theme.isDark ? '#141A29' : colors.card, borderColor: theme.border || colors.border }
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.text || colors.ink, marginBottom: 14 }]}>
              Select Date Range Filter
            </Text>

            {DATE_FILTERS.map((df) => {
              const isSelected = activeDateFilter.id === df.id;
              return (
                <TouchableOpacity
                  key={df.id}
                  onPress={() => {
                    setActiveDateFilter(df);
                    setShowDateFilterSheet(false);
                  }}
                  style={[
                    styles.dateOptionCard,
                    {
                      backgroundColor: isSelected ? colors.mint : (theme.cardBg || colors.card),
                      borderColor: isSelected ? colors.primary : (theme.border || colors.border)
                    }
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: theme.text || colors.ink }}>
                      {df.tag}
                    </Text>
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: theme.subtext || colors.muted }}>
                      {df.label}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 2. HELP & SUPPORT BOTTOM SHEET MODAL */}
      <Modal
        visible={showHelpSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowHelpSheet(false);
          setHelpViewMode('menu');
        }}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowHelpSheet(false);
            setHelpViewMode('menu');
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              { backgroundColor: theme.isDark ? '#141A29' : colors.card, borderColor: theme.border || colors.border }
            ]}
          >
            <View style={styles.sheetHandle} />

            {helpViewMode === 'menu' && (
              <View>
                <View style={styles.sheetHeader}>
                  <View style={[styles.sheetIconBg, { backgroundColor: colors.mint }]}>
                    <Ionicons name="help-buoy-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetTitle, { color: theme.text || colors.ink }]}>Partner Support & Help</Text>
                    <Text style={[styles.sheetSub, { color: theme.subtext || colors.muted }]}>How can we assist your institute?</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowHelpSheet(false)} style={styles.sheetCloseBtn}>
                    <Ionicons name="close" size={20} color={theme.subtext || colors.muted} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.sheetDivider, { backgroundColor: theme.border || colors.border }]} />

                <TouchableOpacity
                  onPress={() => setHelpViewMode('request_changes')}
                  style={[styles.helpOptionCard, { backgroundColor: colors.mint, borderColor: colors.badgeBorder }]}
                >
                  <View style={[styles.infoIconBg, { backgroundColor: colors.primary }]}>
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: theme.text || colors.ink }}>
                      Request Profile Changes
                    </Text>
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: theme.subtext || colors.muted }}>
                      Request edit for name, location, courses or contact details.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setHelpViewMode('raise_ticket')}
                  style={[styles.helpOptionCard, { backgroundColor: colors.mint, borderColor: colors.badgeBorder }]}
                >
                  <View style={[styles.infoIconBg, { backgroundColor: colors.primaryDark }]}>
                    <Ionicons name="ticket-outline" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: theme.text || colors.ink }}>
                      Raise Support Ticket
                    </Text>
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: theme.subtext || colors.muted }}>
                      Submit query for payouts, students or technical issues.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
                </TouchableOpacity>
              </View>
            )}

            {helpViewMode === 'request_changes' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => setHelpViewMode('menu')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="arrow-back" size={18} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={{ color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>Back</Text>
                  </TouchableOpacity>
                  <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: theme.text || colors.ink }}>Request Profile Edit</Text>
                </View>

                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: theme.subtext || colors.muted, marginBottom: 8 }}>
                  Select Field to Update:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {['Institute Name', 'Location', 'Courses Offered', 'Contact Number', 'Logo Image'].map((f) => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setChangeField(f)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 14,
                        backgroundColor: changeField === f ? colors.primary : (theme.cardBg || colors.card),
                        borderWidth: 1,
                        borderColor: changeField === f ? colors.primary : (theme.border || colors.border)
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: changeField === f ? '#FFFFFF' : (theme.text || colors.ink) }}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: theme.subtext || colors.muted, marginBottom: 4 }}>
                  New Value Requested *
                </Text>
                <TextInput
                  value={changeValue}
                  onChangeText={setChangeValue}
                  placeholder="e.g. Future Tech Institute Bilaspur Branch"
                  placeholderTextColor={theme.subtext || colors.muted}
                  style={[styles.inputField, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border, color: theme.text || colors.ink }]}
                />

                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: theme.subtext || colors.muted, marginTop: 8, marginBottom: 4 }}>
                  Reason / Additional Note (Optional)
                </Text>
                <TextInput
                  value={changeReason}
                  onChangeText={setChangeReason}
                  placeholder="Reason for change..."
                  placeholderTextColor={theme.subtext || colors.muted}
                  multiline={true}
                  numberOfLines={2}
                  style={[styles.inputField, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border, color: theme.text || colors.ink, height: 60 }]}
                />

                <TouchableOpacity
                  onPress={handleSubmitChangeRequest}
                  style={[styles.sheetActionBtn, { backgroundColor: colors.primary, marginTop: 14 }]}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.sheetActionBtnText}>Submit Change Request</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {helpViewMode === 'raise_ticket' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => setHelpViewMode('menu')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="arrow-back" size={18} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={{ color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>Back</Text>
                  </TouchableOpacity>
                  <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: theme.text || colors.ink }}>Raise Support Ticket</Text>
                </View>

                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: theme.subtext || colors.muted, marginBottom: 8 }}>
                  Support Category:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {['Billing & Payouts', 'Student Enrollment', 'Tech Support', 'Account Access'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setTicketCategory(cat)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 14,
                        backgroundColor: ticketCategory === cat ? colors.primary : (theme.cardBg || colors.card),
                        borderWidth: 1,
                        borderColor: ticketCategory === cat ? colors.primary : (theme.border || colors.border)
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: ticketCategory === cat ? '#FFFFFF' : (theme.text || colors.ink) }}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: theme.subtext || colors.muted, marginBottom: 4 }}>
                  Subject *
                </Text>
                <TextInput
                  value={ticketSubject}
                  onChangeText={setTicketSubject}
                  placeholder="e.g. Monthly Revenue Payout Inquiry"
                  placeholderTextColor={theme.subtext || colors.muted}
                  style={[styles.inputField, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border, color: theme.text || colors.ink }]}
                />

                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: theme.subtext || colors.muted, marginTop: 8, marginBottom: 4 }}>
                  Query Description *
                </Text>
                <TextInput
                  value={ticketDescription}
                  onChangeText={setTicketDescription}
                  placeholder="Describe your issue or query..."
                  placeholderTextColor={theme.subtext || colors.muted}
                  multiline={true}
                  numberOfLines={3}
                  style={[styles.inputField, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border, color: theme.text || colors.ink, height: 75 }]}
                />

                <TouchableOpacity
                  onPress={handleSubmitSupportTicket}
                  style={[styles.sheetActionBtn, { backgroundColor: colors.primary, marginTop: 14 }]}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.sheetActionBtnText}>Raise Support Ticket</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 3. NON-EDITABLE ITEM DETAILS SHEET MODAL */}
      <Modal
        visible={Boolean(selectedSheetItem)}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSheetItem(null)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setSelectedSheetItem(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              { backgroundColor: theme.isDark ? '#141A29' : colors.card, borderColor: theme.border || colors.border }
            ]}
          >
            <View style={styles.sheetHandle} />

            {selectedSheetItem && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
                <View style={styles.sheetHeader}>
                  <View style={[styles.sheetIconBg, { backgroundColor: selectedSheetItem.color + '20' }]}>
                    <Ionicons name={selectedSheetItem.icon} size={24} color={selectedSheetItem.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetTitle, { color: theme.text || colors.ink }]}>{selectedSheetItem.title}</Text>
                    <Text style={[styles.sheetSub, { color: theme.subtext || colors.muted }]}>{selectedSheetItem.subtitle}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedSheetItem(null)} style={styles.sheetCloseBtn}>
                    <Ionicons name="close" size={20} color={theme.subtext || colors.muted} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.sheetDivider, { backgroundColor: theme.border || colors.border }]} />

                {selectedSheetItem.type === 'profile_picture' && (
                  <View style={{ alignItems: 'center', marginVertical: 12 }}>
                    <Image source={{ uri: selectedSheetItem.image }} style={styles.fullLogoImage} />
                    <Text style={[styles.sheetBodyText, { color: theme.text || colors.ink, textAlign: 'center', marginTop: 12 }]}>
                      {selectedSheetItem.details}
                    </Text>
                  </View>
                )}

                {selectedSheetItem.type === 'gallery_photos' && (
                  <View style={{ marginVertical: 8 }}>
                    <Text style={[styles.sheetBodyText, { color: theme.subtext || colors.muted, marginBottom: 12 }]}>
                      {selectedSheetItem.details}
                    </Text>
                    <View style={styles.galleryGrid}>
                      {selectedSheetItem.photos?.map((imgUrl, i) => (
                        <Image key={i} source={{ uri: imgUrl }} style={styles.galleryThumb} />
                      ))}
                    </View>
                  </View>
                )}

                {selectedSheetItem.type === 'existing_courses' && (
                  <View style={{ marginVertical: 8 }}>
                    <Text style={[styles.sheetBodyText, { color: theme.subtext || colors.muted, marginBottom: 12 }]}>
                      {selectedSheetItem.details}
                    </Text>
                    {selectedSheetItem.coursesList && selectedSheetItem.coursesList.length > 0 ? (
                      <View style={styles.coursesPillsWrap}>
                        {selectedSheetItem.coursesList.map((courseName, i) => (
                          <View key={i} style={[styles.coursePill, { backgroundColor: colors.mint, borderColor: colors.primary }]}>
                            <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                            <Text style={{ color: theme.text || colors.ink, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>{courseName}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={{ color: theme.subtext || colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
                        No courses registered yet.
                      </Text>
                    )}
                  </View>
                )}

                {selectedSheetItem.type === 'contact_number' && (
                  <View style={{ marginVertical: 8 }}>
                    <Text style={[styles.sheetBodyText, { color: theme.text || colors.ink, fontSize: 14, lineHeight: 22, marginBottom: 16 }]}>
                      {selectedSheetItem.details}
                    </Text>
                    {selectedSheetItem.phone !== 'Not Provided' && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${selectedSheetItem.phone}`)}
                        style={[styles.sheetActionBtn, { backgroundColor: colors.primary }]}
                      >
                        <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.sheetActionBtnText}>Call Institute Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {selectedSheetItem.type !== 'profile_picture' &&
                 selectedSheetItem.type !== 'gallery_photos' &&
                 selectedSheetItem.type !== 'existing_courses' &&
                 selectedSheetItem.type !== 'contact_number' && (
                  <View style={{ marginVertical: 8 }}>
                    <Text style={[styles.sheetBodyText, { color: theme.text || colors.ink, fontSize: 13, lineHeight: 22 }]}>
                      {selectedSheetItem.details}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setSelectedSheetItem(null)}
                  style={[styles.sheetDoneBtn, { backgroundColor: theme.isDark ? '#1E293B' : colors.lavender }]}
                >
                  <Text style={[styles.sheetDoneBtnText, { color: theme.text || colors.ink }]}>Close Details</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  screenHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  headerTitleWrap: {
    alignItems: 'center'
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    maxWidth: 180
  },
  helpHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4
  },
  helpBtnLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 90
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  logoContainer: {
    position: 'relative'
  },
  logoImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.primary
  },
  verifiedIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10
  },
  profileMeta: {
    flex: 1
  },
  instituteName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15
  },
  categoryText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    marginBottom: 4
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  infoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11
  },
  sectionTabsWrapper: {
    marginBottom: 12
  },
  sectionTabsContent: {
    gap: 8
  },
  sectionTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1
  },
  sectionTabText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14
  },
  resetBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  resetBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10
  },
  dateFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1
  },
  dateFilterText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11
  },
  overviewGrid: {
    gap: 10,
    marginBottom: 14
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  statBoxTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.muted
  },
  statBoxVal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    marginVertical: 2
  },
  statBoxSub: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10
  },
  viewAllText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1
  },
  summaryLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11
  },
  summaryVal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 19,
    marginVertical: 2
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  growthText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10
  },
  sparklineMock: {
    height: 18,
    marginTop: 6,
    justifyContent: 'center'
  },
  sparkWave: {
    borderTopWidth: 2,
    borderRadius: 10
  },

  /* ALIGNED 2-COLUMN GRID */
  alignedGridContainer: {
    gap: 10,
    marginBottom: 14
  },
  alignedGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  alignedInfoCard: {
    flex: 1,
    minHeight: 58,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1
  },
  fullWidthInfoCard: {
    width: '100%',
    minHeight: 58,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  infoIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoTextWrap: {
    flex: 1
  },
  infoCardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12
  },
  infoCardSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10
  },

  studentsList: {
    gap: 10
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  studentMeta: {
    flex: 1
  },
  studentName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13
  },
  studentCourse: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11
  },
  studentRight: {
    alignItems: 'flex-end'
  },
  studentDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    marginBottom: 3
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  activeBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10
  },

  /* BOTTOM SHEET MODAL STYLES */
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '82%'
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 16
  },
  sheetContent: {
    paddingBottom: 20
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  sheetIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16
  },
  sheetSub: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12
  },
  sheetCloseBtn: {
    padding: 6
  },
  sheetDivider: {
    height: 1,
    marginVertical: 14
  },
  sheetBodyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20
  },
  dateOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10
  },
  helpOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12
  },
  inputField: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13
  },
  fullLogoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  galleryThumb: {
    width: (SCREEN_WIDTH - 60) / 2,
    height: 100,
    borderRadius: 10,
    objectFit: 'cover'
  },
  coursesPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  coursePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  sheetActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10
  },
  sheetActionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14
  },
  sheetDoneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20
  },
  sheetDoneBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13
  }
});
