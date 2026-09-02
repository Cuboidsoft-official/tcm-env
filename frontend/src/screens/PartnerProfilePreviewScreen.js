import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PartnerProfilePreviewScreen({ partner = {}, onBack }) {
  const { theme } = useTheme();
  const [isFavorite, setIsFavorite] = useState(false);

  // Fullscreen Image Lightbox Modal state
  const [activeImageIndex, setActiveImageIndex] = useState(null);

  const instituteName = partner.instituteName || partner.name || 'Future Tech Institute';
  const partnerCategory = partner.partnerCategory || 'Last Class Partner Institute';
  const location = partner.location || 'Bilaspur, Chhattisgarh';
  const distance = partner.distance || '1.2 km away';
  const rating = partner.rating !== undefined ? partner.rating : 4.6;
  const reviewsCount = partner.reviewsCount || '128 Reviews';
  const fee = partner.fee || '₹0 - ₹100 /hr';
  const contactNumber = partner.contactNumber || '+91 98765 43210';
  const email = partner.email || 'info@futuretechinstitute.in';
  const bio =
    partner.bio ||
    `${instituteName} is a leading IT training center in Bilaspur offering industry-relevant courses with practical hands-on training. Our goal is to bridge the gap between learning and industry.`;
  const logoUrl =
    partner.avatarUrl ||
    partner.image ||
    'https://images.unsplash.com/photo-1562774053-701939374585?w=500';
  const heroCoverUrl =
    partner.heroCover ||
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800';

  const galleryImages = partner.galleryPhotos?.length
    ? partner.galleryPhotos
    : [
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500',
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500',
        'https://images.unsplash.com/photo-1562774053-701939374585?w=500',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500'
      ];

  // All previewable images combined
  const allPreviewImages = [
    { url: heroCoverUrl, title: `${instituteName} Cover Photo` },
    { url: logoUrl, title: `${instituteName} Logo` },
    ...galleryImages.map((gUrl, idx) => ({ url: gUrl, title: `Gallery Photo ${idx + 1}` }))
  ];

  const coursesList = partner.existingCourses?.length
    ? partner.existingCourses
    : [
        { name: 'Full Stack Development', duration: '6 Months', icon: 'code-tags' },
        { name: 'Python Programming', duration: '3 Months', icon: 'language-python' },
        { name: 'Django Framework', duration: '3 Months', icon: 'server-network' },
        { name: 'Data Analytics', duration: '4 Months', icon: 'chart-bar' }
      ];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${instituteName} on Last Class App! Accredited IT lab access & courses in ${location}.`
      });
    } catch (e) {}
  };

  const handleCall = () => {
    Linking.openURL(`tel:${contactNumber}`).catch(() => {
      Alert.alert('Contact Number', contactNumber);
    });
  };

  const handleWhatsApp = () => {
    const cleanPhone = contactNumber.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(instituteName)}`).catch(() => {
      Alert.alert('WhatsApp', `Message ${instituteName} at ${contactNumber}`);
    });
  };

  const handleGetDirections = () => {
    const targetUrl = partner.gmbLink || `https://maps.google.com/?q=${encodeURIComponent(instituteName + ' ' + location)}`;
    Linking.openURL(targetUrl).catch(() => {
      Alert.alert('Location', `${instituteName}, ${location}`);
    });
  };

  const handlePrevImage = () => {
    if (activeImageIndex !== null && activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (activeImageIndex !== null && activeImageIndex < allPreviewImages.length - 1) {
      setActiveImageIndex(activeImageIndex + 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg || colors.bg }]}>
      {/* 1. Flush Top Header (52px Height, No Gaps) */}
      <View style={[styles.screenHeader, { borderBottomColor: theme.border || colors.border, backgroundColor: theme.bg || colors.bg }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
          <Feather name="arrow-left" size={18} color={theme.text || colors.ink} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text || colors.ink }]} numberOfLines={1}>
            Partner Profile
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext || colors.muted }]} numberOfLines={1}>
            {instituteName}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={[styles.headerActionBtn, { backgroundColor: colors.mint }]}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#EF4444' : colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.headerActionBtn, { backgroundColor: colors.mint }]}>
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Hero Cover Image (Full Width Full Bleed - Clickable for Image Preview) */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => setActiveImageIndex(0)} style={styles.heroCoverWrap}>
          <Image source={{ uri: heroCoverUrl }} style={styles.heroCoverImage} />
          <View style={styles.coverOverlayGradient} />
          <View style={styles.coverExpandBadge}>
            <Ionicons name="expand-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.coverExpandText}>Tap to View Cover</Text>
          </View>
        </TouchableOpacity>

        {/* 3. Overlapping Logo Badge & Badges Row */}
        <View style={styles.profileHeaderSection}>
          <View style={styles.logoBadgeRow}>
            {/* Clickable Logo for Image Preview */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveImageIndex(1)} style={styles.logoWrap}>
              <Image source={{ uri: logoUrl }} style={styles.logoImg} />
            </TouchableOpacity>

            <View style={styles.badgesCluster}>
              <View style={[styles.statusTagPill, { backgroundColor: colors.mint }]}>
                <View style={styles.greenDot} />
                <Text style={[styles.statusTagText, { color: colors.primary }]}>Available Now</Text>
              </View>
              <View style={[styles.statusTagPill, { backgroundColor: '#F0F5FF' }]}>
                <Ionicons name="checkmark-circle" size={13} color="#2563EB" style={{ marginRight: 3 }} />
                <Text style={[styles.statusTagText, { color: '#2563EB' }]}>Last Class Verified Partner</Text>
              </View>
            </View>
          </View>

          {/* Title & Metadata */}
          <View style={styles.titleMetaBlock}>
            <View style={styles.titlePriceRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.instituteName, { color: theme.text || colors.ink }]} numberOfLines={1}>{instituteName}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.categorySub, { color: colors.muted }]} numberOfLines={1}>{partnerCategory}</Text>
              </View>

              {/* Fee Pricing Card */}
              <View style={[styles.pricingCard, { backgroundColor: theme.isDark ? '#1E263B' : colors.lavender, borderColor: theme.border }]}>
                <Text style={[styles.pricingFeeText, { color: theme.text }]}>{fee}</Text>
                <Text style={[styles.pricingFeeSub, { color: theme.subtext }]}>Lab Access Fee</Text>
                <TouchableOpacity onPress={() => Alert.alert('Lab Pricing', 'Standard Lab Access: ₹0 - ₹100/hr based on workstation configuration.')} style={[styles.viewPricingBtn, { backgroundColor: theme.primary }]}>
                  <Text style={styles.viewPricingBtnText}>View Pricing</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location & Directions */}
            <View style={styles.locationDirectionsRow}>
              <Ionicons name="location" size={14} color={colors.muted} />
              <Text style={[styles.locText, { color: colors.muted }]} numberOfLines={1}>{location}</Text>
              <Text style={{ color: colors.muted }}>•</Text>
              <Text style={[styles.locText, { color: colors.muted }]}>{distance}</Text>
              <TouchableOpacity onPress={handleGetDirections} style={styles.getDirectionsBtn}>
                <Ionicons name="navigate-outline" size={13} color={colors.primary} style={{ marginRight: 3 }} />
                <Text style={[styles.getDirectionsText, { color: colors.primary }]}>Get Directions</Text>
              </TouchableOpacity>
            </View>

            {/* Rating & Recommendation */}
            <View style={styles.ratingRecRow}>
              <Ionicons name="star" size={14} color={colors.amber} style={{ marginRight: 3 }} />
              <Text style={[styles.ratingVal, { color: theme.text || colors.ink }]}>{rating}</Text>
              <Text style={[styles.reviewsCount, { color: colors.muted }]}>({reviewsCount})</Text>
              <Text style={{ color: colors.muted, marginHorizontal: 6 }}>|</Text>
              <Ionicons name="thumbs-up-outline" size={13} color={colors.primary} style={{ marginRight: 3 }} />
              <Text style={[styles.recText, { color: colors.primary }]}>95% Recommended</Text>
            </View>
          </View>
        </View>

        {/* 4. Responsive Facility Features Horizontal Scroll Grid */}
        <View style={styles.quickFeaturesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresScrollContent}>
            {[
              { label: 'Lab Access', val: 'Yes', icon: 'desktop-outline' },
              { label: 'WiFi', val: 'High Speed', icon: 'wifi-outline' },
              { label: 'Project Support', val: 'Yes', icon: 'ribbon-outline' },
              { label: 'Mentor Support', val: 'Yes', icon: 'people-outline' },
              { label: 'Timings', val: '9:00 AM - 8:00 PM', icon: 'time-outline' }
            ].map((item, idx) => (
              <View key={idx} style={[styles.featureBox, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
                <Ionicons name={item.icon} size={18} color={colors.primary} style={{ marginBottom: 4 }} />
                <Text style={[styles.featureLabel, { color: colors.muted }]} numberOfLines={1}>{item.label}</Text>
                <Text style={[styles.featureVal, { color: theme.text || colors.ink }]} numberOfLines={1}>{item.val}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 5. Gallery Section (Clickable Photos for Fullscreen Lightbox) */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>Gallery</Text>
            <TouchableOpacity onPress={() => setActiveImageIndex(2)}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All ({galleryImages.length})</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
            {galleryImages.map((imgUrl, i) => (
              <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => setActiveImageIndex(2 + i)} style={styles.galleryCardWrap}>
                <Image source={{ uri: imgUrl }} style={styles.galleryCardImg} />
                {i === 0 && (
                  <View style={styles.photosBadgeOverlay}>
                    <Ionicons name="camera-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.photosBadgeText}>{galleryImages.length} Photos</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 6. About Institute */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.text || colors.ink, marginBottom: 8 }]}>About Institute</Text>
          <Text style={[styles.aboutText, { color: colors.muted }]}>{bio}</Text>

          {/* 3 Stats Responsive Grid */}
          <View style={styles.aboutStatsGrid}>
            <View style={[styles.statCell, { backgroundColor: theme.isDark ? '#1E263B' : colors.lavender, borderColor: theme.border }]}>
              <Ionicons name="image-outline" size={16} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statCellLabel, { color: theme.subtext }]} numberOfLines={1}>Established</Text>
                <Text style={[styles.statCellVal, { color: theme.text }]} numberOfLines={1}>2018</Text>
              </View>
            </View>

            <View style={[styles.statCell, { backgroundColor: theme.isDark ? '#1E263B' : colors.lavender, borderColor: theme.border }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statCellLabel, { color: theme.subtext }]} numberOfLines={1}>Partner Since</Text>
                <Text style={[styles.statCellVal, { color: theme.text }]} numberOfLines={1}>Jan 2024</Text>
              </View>
            </View>

            <View style={[styles.statCell, { backgroundColor: theme.isDark ? '#1E263B' : colors.lavender, borderColor: theme.border }]}>
              <Ionicons name="school-outline" size={16} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statCellLabel, { color: theme.subtext }]} numberOfLines={1}>Students</Text>
                <Text style={[styles.statCellVal, { color: theme.text }]} numberOfLines={1}>56</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 7. Existing Courses */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>Existing Courses</Text>
            <TouchableOpacity onPress={() => Alert.alert('All Courses', `Exploring all accredited programs offered at ${instituteName}.`)}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All Courses</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coursesScroll}>
            {coursesList.map((item, idx) => {
              const courseName = typeof item === 'string' ? item : item.name;
              const duration = typeof item === 'object' && item.duration ? item.duration : '3-6 Months';
              const iconName = typeof item === 'object' && item.icon ? item.icon : 'code-tags';
              return (
                <View key={idx} style={[styles.courseCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
                  <View style={[styles.courseIconBox, { backgroundColor: colors.mint }]}>
                    <MaterialCommunityIcons name={iconName} size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courseTitle, { color: theme.text || colors.ink }]} numberOfLines={1}>{courseName}</Text>
                    <Text style={[styles.courseDuration, { color: colors.muted }]}>{duration}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* 8. Contact Information & Map Location */}
        <View style={styles.sectionWrap}>
          <View style={styles.contactMapGrid}>
            <View style={[styles.contactBox, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
              <Text style={[styles.boxTitle, { color: theme.text || colors.ink }]}>Contact Information</Text>
              <TouchableOpacity onPress={handleCall} style={styles.contactItemRow}>
                <Ionicons name="call-outline" size={15} color={colors.primary} />
                <Text style={[styles.contactItemText, { color: colors.ink }]} numberOfLines={1}>{contactNumber}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${email}`)} style={styles.contactItemRow}>
                <Ionicons name="mail-outline" size={15} color={colors.primary} />
                <Text style={[styles.contactItemText, { color: colors.ink }]} numberOfLines={1}>{email}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Linking.openURL('https://tcm.com')} style={styles.contactItemRow}>
                <Ionicons name="globe-outline" size={15} color={colors.primary} />
                <Text style={[styles.contactItemText, { color: colors.ink }]} numberOfLines={1}>www.futuretechinstitute.in</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.mapBox, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
              <Text style={[styles.boxTitle, { color: theme.text || colors.ink }]}>Location</Text>
              <TouchableOpacity onPress={handleGetDirections} style={styles.mapMockContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=500' }}
                  style={styles.mapMockImg}
                />
                <View style={styles.mapPinOverlay}>
                  <Ionicons name="location" size={24} color="#EF4444" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.mapAddressText, { color: colors.muted }]} numberOfLines={2}>
                Near City Center, Gandhi Chowk, Bilaspur, Chhattisgarh 495001
              </Text>
            </View>
          </View>
        </View>

        {/* 9. Reviews & Ratings */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>Reviews & Ratings</Text>
            <TouchableOpacity onPress={() => Alert.alert('All Reviews', `Reading 128 verified student reviews for ${instituteName}.`)}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All Reviews</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewsGrid}>
            <View style={[styles.ratingBreakdownCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
              <Text style={[styles.bigRatingScore, { color: theme.text || colors.ink }]}>{rating}</Text>
              <View style={{ flexDirection: 'row', gap: 2, marginVertical: 4 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={13} color={colors.amber} />
                ))}
              </View>
              <Text style={[styles.ratingCountSub, { color: colors.muted }]}>({reviewsCount})</Text>
            </View>

            <View style={[styles.studentReviewCard, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
              <View style={styles.reviewUserHeader}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
                  style={styles.reviewerAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewerName, { color: theme.text || colors.ink }]} numberOfLines={1}>Aman Verma</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={11} color={colors.amber} />
                    ))}
                    <Text style={{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: theme.text || colors.ink, marginLeft: 4 }}>5.0</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.reviewComment, { color: colors.muted }]} numberOfLines={2}>
                Best institute for practical learning. Workstations are high speed & mentors are very supportive!
              </Text>
              <Text style={[styles.reviewDate, { color: colors.muted }]}>2 days ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 10. Fixed Bottom Action Bar: Call Now | WhatsApp | Directions */}
      <View style={[styles.fixedBottomBar, { backgroundColor: theme.cardBg || colors.card, borderTopColor: theme.border || colors.border }]}>
        <TouchableOpacity onPress={handleCall} style={[styles.bottomBtnOutline, { borderColor: colors.primary }]}>
          <Ionicons name="call-outline" size={17} color={colors.primary} style={{ marginRight: 5 }} />
          <Text style={[styles.bottomBtnOutlineText, { color: colors.primary }]}>Call Now</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleWhatsApp} style={[styles.bottomBtnOutline, { borderColor: '#16A34A' }]}>
          <Ionicons name="logo-whatsapp" size={17} color="#16A34A" style={{ marginRight: 5 }} />
          <Text style={[styles.bottomBtnOutlineText, { color: '#16A34A' }]}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGetDirections} style={[styles.bottomBtnPrimary, { backgroundColor: colors.primary }]}>
          <Ionicons name="navigate-outline" size={17} color="#FFFFFF" style={{ marginRight: 5 }} />
          <Text style={styles.bottomBtnPrimaryText}>Directions</Text>
        </TouchableOpacity>
      </View>

      {/* 11. FULLSCREEN INTERACTIVE IMAGE LIGHTBOX PREVIEW MODAL */}
      <Modal
        visible={activeImageIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveImageIndex(null)}
      >
        {activeImageIndex !== null && (
          <View style={styles.lightboxOverlay}>
            {/* Top Header Bar */}
            <View style={styles.lightboxTopBar}>
              <View style={styles.lightboxMetaInfo}>
                <Text style={styles.lightboxTitleText}>
                  {allPreviewImages[activeImageIndex]?.title || 'Photo Preview'}
                </Text>
                <Text style={styles.lightboxCountText}>
                  Photo {activeImageIndex + 1} of {allPreviewImages.length}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setActiveImageIndex(null)} style={styles.lightboxCloseBtn}>
                <Feather name="x" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Main Fullscreen Image Area */}
            <View style={styles.lightboxMainImageArea}>
              <Image
                source={{ uri: allPreviewImages[activeImageIndex]?.url }}
                style={styles.lightboxFullImage}
                resizeMode="contain"
              />
            </View>

            {/* Bottom Controls Bar with Prev / Next Navigation Arrows */}
            <View style={styles.lightboxBottomBar}>
              <TouchableOpacity
                disabled={activeImageIndex === 0}
                onPress={handlePrevImage}
                style={[styles.lightboxNavBtn, activeImageIndex === 0 && { opacity: 0.3 }]}
              >
                <Feather name="chevron-left" size={24} color="#FFFFFF" />
                <Text style={styles.lightboxNavText}>Previous</Text>
              </TouchableOpacity>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lightboxThumbsScroll}>
                {allPreviewImages.map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setActiveImageIndex(idx)}
                    style={[
                      styles.lightboxThumbBorder,
                      activeImageIndex === idx && { borderColor: colors.primary, borderWidth: 2 }
                    ]}
                  >
                    <Image source={{ uri: img.url }} style={styles.lightboxThumbImg} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                disabled={activeImageIndex === allPreviewImages.length - 1}
                onPress={handleNextImage}
                style={[styles.lightboxNavBtn, activeImageIndex === allPreviewImages.length - 1 && { opacity: 0.3 }]}
              >
                <Text style={styles.lightboxNavText}>Next</Text>
                <Feather name="chevron-right" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },

  /* FLUSH TOP HEADER */
  screenHeader: {
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
  headerRightActions: {
    flexDirection: 'row',
    gap: 6
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },

  scrollContent: {
    paddingBottom: 90
  },

  /* HERO COVER */
  heroCoverWrap: {
    position: 'relative',
    height: 180,
    width: '100%'
  },
  heroCoverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  coverOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.25)'
  },
  coverExpandBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  coverExpandText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    fontSize: 10
  },

  /* PROFILE HEADER SECTION */
  profileHeaderSection: {
    paddingHorizontal: 16,
    marginTop: -36
  },
  logoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 4
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  badgesCluster: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6
  },
  statusTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 5
  },
  statusTagText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10.5
  },

  titleMetaBlock: {
    marginTop: 12
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  instituteName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17
  },
  categorySub: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    marginTop: 1
  },

  pricingCard: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-end'
  },
  pricingFeeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14
  },
  pricingFeeSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    marginBottom: 4
  },
  viewPricingBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  viewPricingBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10
  },

  locationDirectionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    flexWrap: 'wrap'
  },
  locText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11
  },
  getDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4
  },
  getDirectionsText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11
  },

  ratingRecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  ratingVal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12
  },
  reviewsCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginLeft: 3
  },
  recText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11
  },

  /* 5-COLUMN QUICK FEATURES */
  quickFeaturesSection: {
    marginTop: 14
  },
  featuresScrollContent: {
    paddingHorizontal: 16,
    gap: 8
  },
  featureBox: {
    width: 96,
    minHeight: 64,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  featureLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    textAlign: 'center'
  },
  featureVal: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 2
  },

  /* SECTIONS WRAPPER */
  sectionWrap: {
    paddingHorizontal: 16,
    marginTop: 18
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14
  },
  viewAllText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5
  },

  galleryScroll: {
    gap: 10
  },
  galleryCardWrap: {
    position: 'relative',
    width: 135,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden'
  },
  galleryCardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  photosBadgeOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  photosBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    fontSize: 9.5
  },

  aboutText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18
  },
  aboutStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  statCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  statCellLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 8.5
  },
  statCellVal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11
  },

  coursesScroll: {
    gap: 10
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 165,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1
  },
  courseIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  courseTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5
  },
  courseDuration: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9.5
  },

  contactMapGrid: {
    flexDirection: 'row',
    gap: 10
  },
  contactBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  mapBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  boxTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12.5,
    marginBottom: 6
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4
  },
  contactItemText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10.5
  },
  mapMockContainer: {
    height: 65,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 6
  },
  mapMockImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  mapPinOverlay: {
    position: 'absolute',
    top: '25%',
    left: '42%'
  },
  mapAddressText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9.5,
    lineHeight: 13
  },

  reviewsGrid: {
    flexDirection: 'row',
    gap: 10
  },
  ratingBreakdownCard: {
    width: 95,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bigRatingScore: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24
  },
  ratingCountSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9.5
  },
  studentReviewCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1
  },
  reviewUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  reviewerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14
  },
  reviewerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11
  },
  reviewComment: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10.5,
    lineHeight: 15
  },
  reviewDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 8.5,
    marginTop: 3
  },

  /* FIXED BOTTOM BAR */
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1
  },
  bottomBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  bottomBtnOutlineText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12
  },
  bottomBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10
  },
  bottomBtnPrimaryText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12
  },

  /* LIGHTBOX MODAL STYLES */
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.95)',
    justifyContent: 'space-between'
  },
  lightboxTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingBottom: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.6)'
  },
  lightboxMetaInfo: {
    flex: 1
  },
  lightboxTitleText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15
  },
  lightboxCountText: {
    color: '#94A3B8',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11
  },
  lightboxCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lightboxMainImageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  lightboxFullImage: {
    width: '100%',
    height: '100%'
  },
  lightboxBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.8)'
  },
  lightboxNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  lightboxNavText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    marginHorizontal: 4
  },
  lightboxThumbsScroll: {
    gap: 6,
    paddingHorizontal: 10
  },
  lightboxThumbBorder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden'
  },
  lightboxThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
});
