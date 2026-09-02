import React, { useState, useEffect } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../constants/theme';
import { getPublicPartners } from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CITIES = ['All Cities', 'Bilaspur', 'Raipur', 'Durg', 'Korba', 'Bhilai'];

const SEED_PARTNERS = [];

export default function DiscoverPartnersScreen({ session, onBack, onSelectPartner }) {
  const { theme } = useTheme();

  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'it' | 'gov' | 'academics'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedFilterPill, setSelectedFilterPill] = useState('All');
  const [partnersList, setPartnersList] = useState([]);
  const [showFilterBottomSheet, setShowFilterBottomSheet] = useState(false);

  // Request partner modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqCity, setReqCity] = useState('');
  const [reqNote, setReqNote] = useState('');

  useEffect(() => {
    // Fetch live onboarded partners from backend database
    getPublicPartners()
      .then((partners) => {
        if (partners && Array.isArray(partners)) {
          const formatted = partners.map((p, idx) => ({
            id: p.id || p._id || `backend-${idx}`,
            instituteName: p.instituteName || p.name,
            partnerCategory: p.partnerCategory || 'Last Class Partner Institute',
            categoryType: (p.partnerCategory || '').toLowerCase().includes('gov') ? 'gov' : (p.partnerCategory || '').toLowerCase().includes('academic') ? 'academics' : 'it',
            tagline: p.bio || 'Last Class Accredited Partner Institute',
            location: p.location || 'Bilaspur, Chhattisgarh',
            city: p.city || (p.location || 'Bilaspur').split(',')[0].trim(),
            gmbLink: p.gmbLink || '',
            heroCover: p.heroCover || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
            distance: '1.5 km',
            rating: p.rating !== undefined ? p.rating : 5.0,
            reviewsCount: p.reviewsCount || '0 Reviews',
            fee: p.labFee || 'Free',
            feeLabel: 'Lab Access Fee',
            status: 'Available',
            statusBg: colors.primaryLight,
            statusColor: colors.primary,
            photosCount: `${p.galleryPhotos?.length || 0} Photos`,
            avatarText: (p.instituteName || p.name || 'PI').slice(0, 2).toUpperCase(),
            avatarBg: '#0A6836',
            avatarUrl: p.avatarUrl || 'https://images.unsplash.com/photo-1562774053-701939374585?w=500',
            image: p.avatarUrl || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500',
            galleryPhotos: p.galleryPhotos || [],
            badges: [
              { text: 'Lab Access', icon: 'desktop-outline', bg: colors.mint, color: colors.primary },
              { text: 'Verified', icon: 'checkmark-circle-outline', bg: colors.blueSoft, color: '#0284C7' },
              { text: 'Last Class Support', icon: 'ribbon-outline', bg: colors.yellowSoft, color: '#D97706' }
            ],
            contactNumber: p.contactNumber || '',
            email: p.email,
            existingCourses: Array.isArray(p.existingCourses) ? p.existingCourses : [],
            bio: p.bio || 'Accredited partner institute providing facilities and certified courses.'
          }));

          setPartnersList(formatted);
        }
      })
      .catch(() => {});
  }, []);

  // Filter logic including CITY WISE FILTER
  const filteredPartners = partnersList.filter((p) => {
    // Category match
    if (activeCategory === 'it' && p.categoryType !== 'it') return false;
    if (activeCategory === 'gov' && p.categoryType !== 'gov') return false;
    if (activeCategory === 'academics' && p.categoryType !== 'academics') return false;

    // City match
    if (selectedCity !== 'All Cities') {
      const pLoc = (p.location || p.city || '').toLowerCase();
      if (!pLoc.includes(selectedCity.toLowerCase())) return false;
    }

    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.instituteName.toLowerCase().includes(q);
      const locMatch = p.location.toLowerCase().includes(q);
      const categoryMatch = p.partnerCategory.toLowerCase().includes(q);
      const courseMatch = p.existingCourses?.some((c) => c.toLowerCase().includes(q));
      return nameMatch || locMatch || categoryMatch || courseMatch;
    }
    return true;
  });

  const handleSendRequest = () => {
    if (!reqName.trim()) {
      Alert.alert('Required', 'Please enter institute or partner name.');
      return;
    }
    Alert.alert(
      'Request Submitted!',
      `Thank you! Our Last Class partnership team will reach out to connect ${reqName} in ${reqCity || 'your area'}.`
    );
    setReqName('');
    setReqCity('');
    setReqNote('');
    setShowRequestModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg || colors.bg }]}>
      {/* 1. Header (Flush 52px height) */}
      <View style={[styles.header, { borderBottomColor: theme.border || colors.border, backgroundColor: theme.bg || colors.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
          <Feather name="arrow-left" size={18} color={theme.text || colors.ink} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text || colors.ink }]}>Discover Partners</Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext || colors.muted }]} numberOfLines={1}>
            Find the best institutions & partners near you
          </Text>
        </View>

        {/* Top Header Filter Icon Button */}
        <TouchableOpacity
          onPress={() => setShowFilterBottomSheet(true)}
          style={[
            styles.filterHeaderBtn,
            {
              backgroundColor: (selectedCity !== 'All Cities' || searchQuery.trim() || activeCategory !== 'all')
                ? (theme.isDark ? '#064E3B' : colors.mint)
                : (theme.cardBg || colors.card),
              borderColor: (selectedCity !== 'All Cities' || searchQuery.trim() || activeCategory !== 'all')
                ? colors.primary
                : (theme.border || colors.border)
            }
          ]}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={(selectedCity !== 'All Cities' || searchQuery.trim() || activeCategory !== 'all') ? colors.primary : (theme.text || colors.ink)}
          />
          {(selectedCity !== 'All Cities' || searchQuery.trim() || activeCategory !== 'all') ? (
            <View style={styles.activeFilterDot} />
          ) : null}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Top Category Tabs */}
        <View style={styles.topTabsContainer}>
          {[
            { id: 'it', icon: 'desktop-outline', title: 'IT Partners', subtitle: 'Lab Access & Support' },
            { id: 'gov', icon: 'business-outline', title: 'Gov Institutions', subtitle: 'Govt. & Public Institutes' },
            { id: 'academics', icon: 'school-outline', title: 'Academics', subtitle: 'Schools, Colleges & More' }
          ].map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                style={[
                  styles.topTabCard,
                  {
                    backgroundColor: isSelected ? colors.primary : (theme.cardBg || colors.card),
                    borderColor: isSelected ? colors.primary : (theme.border || colors.border)
                  }
                ]}
              >
                <Ionicons
                  name={cat.icon}
                  size={20}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.topTabTitle, { color: isSelected ? '#FFFFFF' : (theme.text || colors.ink) }]} numberOfLines={1}>
                  {cat.title}
                </Text>
                <Text style={[styles.topTabSub, { color: isSelected ? 'rgba(255,255,255,0.85)' : (theme.subtext || colors.muted) }]} numberOfLines={1}>
                  {cat.subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Partner Cards List */}
        <View style={styles.partnersListWrap}>
          {filteredPartners.length === 0 ? (
            <View style={[styles.emptyWrap, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
              <Ionicons name="search-disagree" size={40} color={colors.muted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: theme.text || colors.ink }]}>No partners found in {selectedCity}</Text>
              <Text style={[styles.emptySub, { color: theme.subtext || colors.muted }]}>Try changing city filter or search with a different term.</Text>
            </View>
          ) : (
            filteredPartners.map((item) => (
              <View key={item.id} style={[styles.partnerCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
                {/* Top Image Preview with Photos Badge */}
                <View style={styles.cardMediaWrap}>
                  <Image source={{ uri: item.image }} style={styles.cardImage} />

                  <View style={styles.openNowBadge}>
                    <Text style={styles.openNowText}>Open Now</Text>
                  </View>

                  <View style={styles.photosCountBadge}>
                    <Ionicons name="camera-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.photosCountText}>{item.photosCount}</Text>
                  </View>
                </View>

                {/* Body Details */}
                <View style={styles.cardBody}>
                  {/* Header Row: Initials Avatar + Name + Checkmark + Category Pill + Status */}
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                      <Text style={styles.avatarText}>{item.avatarText}</Text>
                    </View>

                    <View style={styles.cardTitleMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.partnerName, { color: theme.text || colors.ink }]} numberOfLines={1}>
                          {item.instituteName}
                        </Text>
                        <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                      </View>

                      <View style={[styles.categoryTag, { backgroundColor: colors.mint }]}>
                        <Text style={[styles.categoryTagText, { color: colors.primary }]}>{item.partnerCategory}</Text>
                      </View>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: item.statusBg }]}>
                      <Text style={[styles.statusPillText, { color: item.statusColor }]}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Location & Distance */}
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={13} color={colors.muted} />
                    <Text style={[styles.locationText, { color: colors.muted }]} numberOfLines={1}>
                      {item.location}
                    </Text>
                    <Text style={[styles.dotSep, { color: colors.muted }]}>•</Text>
                    <Ionicons name="navigate-outline" size={12} color={colors.muted} />
                    <Text style={[styles.locationText, { color: colors.muted }]}>{item.distance}</Text>
                  </View>

                  {/* Rating & Fee Row */}
                  <View style={styles.ratingFeeRow}>
                    <View style={styles.ratingBox}>
                      <Ionicons name="star" size={14} color={colors.amber} style={{ marginRight: 3 }} />
                      <Text style={[styles.ratingVal, { color: theme.text || colors.ink }]}>{item.rating}</Text>
                      <Text style={[styles.reviewsCountText, { color: colors.muted }]}>({item.reviewsCount})</Text>
                    </View>

                    <View style={styles.feeBox}>
                      <Text style={[styles.feeVal, { color: theme.text || colors.ink }]}>{item.fee}</Text>
                      <Text style={[styles.feeLabel, { color: colors.muted }]}>{item.feeLabel}</Text>
                    </View>
                  </View>

                  {/* Feature Badges */}
                  <View style={styles.badgesRow}>
                    {item.badges.map((b, i) => (
                      <View key={i} style={[styles.featurePill, { backgroundColor: b.bg }]}>
                        <Ionicons name={b.icon} size={12} color={b.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.featurePillText, { color: b.color }]}>{b.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer Action: View Details -> Opens Full Dedicated Preview Screen */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      onPress={() => (onSelectPartner ? onSelectPartner(item) : Alert.alert(item.instituteName, 'Opening full institute preview...'))}
                      style={[styles.viewDetailsBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}
                    >
                      <Text style={[styles.viewDetailsBtnText, { color: theme.primary }]}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 7. Bottom Banner Card: "Can't find the right partner?" */}
        <View style={[styles.bottomBannerCard, { backgroundColor: theme.isDark ? '#1E263B' : colors.lavender, borderColor: theme.border }]}>
          <View style={styles.bannerLeft}>
            <View style={[styles.mapIconBg, { backgroundColor: theme.badgeBg }]}>
              <Ionicons name="map" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: theme.text }]}>Can't find the right partner?</Text>
              <Text style={[styles.bannerSub, { color: theme.subtext }]}>
                Help us connect you with the best institute.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowRequestModal(true)}
            style={[styles.requestBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.requestBtnText}>Request Partner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* REQUEST PARTNER MODAL */}
      <Modal
        visible={showRequestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowRequestModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              { backgroundColor: theme.isDark ? '#141A29' : colors.card, borderColor: theme.border || colors.border }
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.modalTitle, { color: theme.text || colors.ink, marginBottom: 4 }]}>Request New Partner</Text>
            <Text style={[styles.modalSub, { color: colors.muted, marginBottom: 12 }]}>Tell us which lab or institute you want on Last Class!</Text>

            <TextInput
              value={reqName}
              onChangeText={setReqName}
              placeholder="Institute / Lab Name *"
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border, color: theme.text || colors.ink }]}
            />

            <TextInput
              value={reqCity}
              onChangeText={setReqCity}
              placeholder="City / Area Location *"
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border, color: theme.text || colors.ink }]}
            />

            <TextInput
              value={reqNote}
              onChangeText={setReqNote}
              placeholder="Additional Note (Optional)"
              placeholderTextColor={colors.muted}
              multiline={true}
              numberOfLines={2}
              style={[styles.input, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border, color: theme.text || colors.ink, height: 60 }]}
            />

            <TouchableOpacity onPress={handleSendRequest} style={[styles.modalActionBtn, { backgroundColor: colors.primary, marginTop: 10 }]}>
              <Text style={styles.modalActionBtnText}>Submit Request</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 8. Filter Bottom Sheet Modal (Search & Location / City Concept) */}
      <Modal visible={showFilterBottomSheet} animationType="slide" transparent onRequestClose={() => setShowFilterBottomSheet(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowFilterBottomSheet(false)}
          style={styles.sheetOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }
            ]}
          >
            <View style={styles.sheetHandle} />

            {/* Title Header */}
            <View style={styles.sheetHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="options" size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: theme.text || colors.ink, marginBottom: 0 }]}>
                  Search & Filter Partners
                </Text>
              </View>

              <TouchableOpacity onPress={() => setShowFilterBottomSheet(false)} style={{ padding: 4 }}>
                <Feather name="x" size={20} color={theme.subtext || colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* SECTION 1: SEARCH BAR CONCEPT */}
              <Text style={[styles.sheetSectionLabel, { color: theme.text || colors.ink }]}>
                Search Institute or Course
              </Text>
              <View style={[styles.sheetSearchWrap, { backgroundColor: theme.bg || colors.bg, borderColor: theme.border || colors.border }]}>
                <Ionicons name="search-outline" size={18} color={colors.muted} style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by institute name, course, or location..."
                  placeholderTextColor={colors.muted}
                  style={[styles.sheetSearchInput, { color: theme.text || colors.ink }]}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* SECTION 2: LOCATION / CITY SELECTION CONCEPT */}
              <View style={styles.sheetSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location-sharp" size={16} color={colors.primary} />
                  <Text style={[styles.sheetSectionLabel, { color: theme.text || colors.ink, marginBottom: 0 }]}>
                    Select Location / City
                  </Text>
                </View>
                {selectedCity !== 'All Cities' && (
                  <TouchableOpacity onPress={() => setSelectedCity('All Cities')}>
                    <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.primary }}>Reset Location</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.sheetCityGrid}>
                {CITIES.map((city) => {
                  const isSelected = selectedCity === city;
                  return (
                    <TouchableOpacity
                      key={city}
                      onPress={() => setSelectedCity(city)}
                      style={[
                        styles.sheetCityChip,
                        {
                          backgroundColor: isSelected ? colors.primary : (theme.bg || '#F1F5F9'),
                          borderColor: isSelected ? colors.primary : (theme.border || '#E2E8F0')
                        }
                      ]}
                    >
                      <Ionicons name="location-outline" size={13} color={isSelected ? '#FFFFFF' : colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.sheetCityChipText, { color: isSelected ? '#FFFFFF' : (theme.text || colors.ink) }]}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SECTION 3: CATEGORY TYPE CONCEPT */}
              <Text style={[styles.sheetSectionLabel, { color: theme.text || colors.ink }]}>
                Partner Type Category
              </Text>
              <View style={styles.sheetCategoryRow}>
                {[
                  { id: 'all', title: 'All Partners' },
                  { id: 'it', title: 'IT Partners' },
                  { id: 'gov', title: 'Gov Institutes' },
                  { id: 'academics', title: 'Academics' }
                ].map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setActiveCategory(cat.id)}
                      style={[
                        styles.sheetCategoryChip,
                        {
                          backgroundColor: isSelected ? colors.primary : (theme.bg || '#F1F5F9'),
                          borderColor: isSelected ? colors.primary : (theme.border || '#E2E8F0')
                        }
                      ]}
                    >
                      <Text style={[styles.sheetCategoryText, { color: isSelected ? '#FFFFFF' : (theme.text || colors.ink) }]}>
                        {cat.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* BOTTOM SHEET FOOTER ACTIONS */}
            <View style={[styles.sheetFooterRow, { borderTopColor: theme.border || colors.border }]}>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCity('All Cities');
                  setActiveCategory('all');
                }}
                style={[styles.sheetResetBtn, { borderColor: theme.border || colors.border }]}
              >
                <Text style={[styles.sheetResetBtnText, { color: theme.subtext || colors.muted }]}>Reset All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowFilterBottomSheet(false)}
                style={[styles.sheetApplyBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.sheetApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    marginLeft: 10
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 90
  },
  topTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  topTabCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start'
  },
  topTabTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11
  },
  topTabSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9
  },

  /* CITY WISE FILTER */
  cityFilterSection: {
    marginBottom: 10
  },
  cityFilterHeaderLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    marginBottom: 6
  },
  cityPillsScroll: {
    gap: 6
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1
  },
  cityPillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1
  },
  filterBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12
  },
  filterPillsScroll: {
    gap: 6,
    marginBottom: 14
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1
  },
  filterPillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11
  },
  partnersListWrap: {
    gap: 14
  },
  emptyWrap: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15
  },
  emptySub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    textAlign: 'center'
  },
  partnerCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  cardMediaWrap: {
    position: 'relative',
    height: 145
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  openNowBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  openNowText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10
  },
  photosCountBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  photosCountText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    fontSize: 10
  },
  cardBody: {
    padding: 12
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13
  },
  cardTitleMeta: {
    flex: 1
  },
  partnerName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2
  },
  categoryTagText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  statusPillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8
  },
  locationText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11
  },
  dotSep: {
    fontSize: 11
  },
  ratingFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ratingVal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12
  },
  reviewsCountText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginLeft: 3
  },
  feeBox: {
    alignItems: 'flex-end'
  },
  feeVal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12
  },
  feeLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  featurePillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10
  },
  cardFooter: {
    marginTop: 12
  },
  viewDetailsBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1
  },
  viewDetailsBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12
  },

  /* BOTTOM BANNER */
  bottomBannerCard: {
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    gap: 12
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  mapIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13
  },
  bannerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11
  },
  requestBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10
  },
  requestBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12
  },

  /* MODAL */
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '84%'
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16
  },
  modalSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginBottom: 10
  },

  /* HEADER FILTER BUTTON */
  filterHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  activeFilterDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444'
  },

  /* FILTER BOTTOM SHEET STYLES */
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  sheetSectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    marginBottom: 8
  },
  sheetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  sheetSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 20
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular'
  },
  sheetCityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  sheetCityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20
  },
  sheetCityChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium'
  },
  sheetCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  sheetCategoryChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  sheetCategoryText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium'
  },
  sheetFooterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1
  },
  sheetResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetResetBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13
  },
  sheetApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetApplyBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13
  }
});
