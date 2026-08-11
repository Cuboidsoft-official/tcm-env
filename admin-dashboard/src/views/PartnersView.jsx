import React, { useState } from 'react';
import { IconMentor, IconCross, IconUsers, IconCheck } from '../components/Icons';

export function PartnersView({ partners, onCreatePartner, onUpdatePartner, onDeletePartner, search }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  // Form states for Create & Edit
  const [instituteName, setInstituteName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [partnerCategory, setPartnerCategory] = useState('IT Partner');
  const [location, setLocation] = useState('Bilaspur, Chhattisgarh');
  const [city, setCity] = useState('Bilaspur');
  const [gmbLink, setGmbLink] = useState('');
  const [heroCover, setHeroCover] = useState('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1562774053-701939374585?w=500');
  const [galleryPhotos, setGalleryPhotos] = useState([
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500',
    'https://images.unsplash.com/photo-1562774053-701939374585?w=500'
  ]);
  const [contactNumber, setContactNumber] = useState('+91 98765 43210');
  const [totalRevenue, setTotalRevenue] = useState('₹48,750');
  const [monthlyRevenue, setMonthlyRevenue] = useState('₹18,250');
  const [totalStudentsCount, setTotalStudentsCount] = useState('56');
  const [activeMentorsCount, setActiveMentorsCount] = useState('8');
  const [rating, setRating] = useState('4.6');
  const [reviewsCount, setReviewsCount] = useState('128 Reviews');
  const [labFee, setLabFee] = useState('₹0 - ₹100 /hr');
  const [timings, setTimings] = useState('9:00 AM - 8:00 PM');
  const [existingCourses, setExistingCourses] = useState('Full Stack Development, Python Programming, Web Development');
  const [bio, setBio] = useState('Leading technical educational institute offering TCM certified courses.');

  const filtered = partners.filter((p) =>
    (p.instituteName || p.name)?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase())
  );

  // File Uploader Handlers
  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleHeroFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setHeroCover(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleGalleryFiles = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const readPromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((dataUrls) => {
      setGalleryPhotos((prev) => {
        const currentList = Array.isArray(prev) ? prev : typeof prev === 'string' ? prev.split(',').map(s => s.trim()).filter(Boolean) : [];
        return [...currentList, ...dataUrls];
      });
    });
  };

  const handleRemoveGalleryPhoto = (indexToRemove) => {
    setGalleryPhotos((prev) => {
      const currentList = Array.isArray(prev) ? prev : typeof prev === 'string' ? prev.split(',').map(s => s.trim()).filter(Boolean) : [];
      return currentList.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleStartEdit = (partner) => {
    setEditingPartner(partner);
    setInstituteName(partner.instituteName || partner.name || '');
    setEmail(partner.email || '');
    setPassword('');
    setPartnerCategory(partner.partnerCategory || 'IT Partner');
    setLocation(partner.location || 'Bilaspur, Chhattisgarh');
    setCity(partner.city || (partner.location || 'Bilaspur').split(',')[0].trim());
    setGmbLink(partner.gmbLink || '');
    setHeroCover(partner.heroCover || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800');
    setAvatarUrl(partner.avatarUrl || 'https://images.unsplash.com/photo-1562774053-701939374585?w=500');
    setGalleryPhotos(Array.isArray(partner.galleryPhotos) ? partner.galleryPhotos : typeof partner.galleryPhotos === 'string' ? partner.galleryPhotos.split(',').map(s => s.trim()).filter(Boolean) : []);
    setContactNumber(partner.contactNumber || '+91 98765 43210');
    setTotalRevenue(partner.totalRevenue || '₹48,750');
    setMonthlyRevenue(partner.monthlyRevenue || '₹18,250');
    setTotalStudentsCount(String(partner.totalStudentsCount || 56));
    setActiveMentorsCount(String(partner.activeMentorsCount || 8));
    setRating(String(partner.rating || 4.6));
    setReviewsCount(partner.reviewsCount || '128 Reviews');
    setLabFee(partner.labFee || '₹0 - ₹100 /hr');
    setTimings(partner.timings || '9:00 AM - 8:00 PM');
    setExistingCourses(Array.isArray(partner.existingCourses) ? partner.existingCourses.join(', ') : (partner.existingCourses || ''));
    setBio(partner.bio || '');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingPartner) return;

    const payload = {
      instituteName,
      email,
      partnerCategory,
      location,
      city,
      gmbLink,
      heroCover,
      avatarUrl,
      galleryPhotos: Array.isArray(galleryPhotos) ? galleryPhotos : typeof galleryPhotos === 'string' ? galleryPhotos.split(',').map((s) => s.trim()).filter(Boolean) : [],
      contactNumber,
      totalRevenue,
      monthlyRevenue,
      totalStudentsCount: Number(totalStudentsCount),
      activeMentorsCount: Number(activeMentorsCount),
      rating: Number(rating),
      reviewsCount,
      labFee,
      timings,
      existingCourses,
      bio
    };
    if (password.trim()) payload.password = password.trim();

    onUpdatePartner(editingPartner.id || editingPartner._id, payload);
    setEditingPartner(null);
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    onCreatePartner({
      instituteName,
      email,
      password,
      partnerCategory,
      location,
      city,
      gmbLink,
      heroCover,
      avatarUrl,
      galleryPhotos: Array.isArray(galleryPhotos) ? galleryPhotos : typeof galleryPhotos === 'string' ? galleryPhotos.split(',').map((s) => s.trim()).filter(Boolean) : [],
      contactNumber,
      totalRevenue,
      monthlyRevenue,
      totalStudentsCount,
      activeMentorsCount,
      rating,
      reviewsCount,
      labFee,
      timings,
      existingCourses,
      bio
    });
    setInstituteName('');
    setEmail('');
    setShowAddForm(false);
  };

  const galleryList = Array.isArray(galleryPhotos)
    ? galleryPhotos
    : typeof galleryPhotos === 'string'
    ? galleryPhotos.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div>
      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconUsers style={{ color: 'var(--accent-primary)' }} />
              <span>Partner Onboarding & Institute Accounts ({filtered.length})</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Upload logo & multiple gallery photos, configure GMB links, courses, fees, and location.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Onboard New Partner Institute'}
          </button>
        </div>

        {/* Create Partner Form */}
        {showAddForm && (
          <form onSubmit={handleSubmitCreate} style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', color: '#0F172A', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
              Partner Institute Onboarding Form
            </h3>

            {/* Direct Image Uploaders Section */}
            <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #CBD5E1' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0A6836', marginBottom: '0.5rem' }}>
                Direct Image Uploaders (Logo, Cover & Gallery Photos)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {/* 1. Avatar Logo Uploader */}
                <div>
                  <label className="form-label">Upload Institute Logo Avatar</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px' }}>
                    <img src={avatarUrl} alt="Logo" style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border-glass)' }} />
                    <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                {/* 2. Hero Cover Uploader */}
                <div>
                  <label className="form-label">Upload Hero Cover Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px' }}>
                    <img src={heroCover} alt="Cover" style={{ width: '80px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '2px solid var(--border-glass)' }} />
                    <input type="file" accept="image/*" onChange={handleHeroFile} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>

              {/* 3. Multiple Gallery Photos Uploader */}
              <div style={{ marginTop: '1rem' }}>
                <label className="form-label">📸 Upload Multiple Gallery Photos (Select Multiple Images)</label>
                <input type="file" accept="image/*" multiple onChange={handleMultipleGalleryFiles} style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }} />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  {galleryList.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: '70px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                      <img src={url} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryPhoto(i)}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Institute Name *</label>
                <input type="text" className="form-input" value={instituteName} onChange={(e) => setInstituteName(e.target.value)} required placeholder="e.g. Future Tech Institute" />
              </div>

              <div className="form-group">
                <label className="form-label">Login Email *</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="partner@institute.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Account Password *</label>
                <input type="text" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={partnerCategory} onChange={(e) => setPartnerCategory(e.target.value)}>
                  <option value="IT Partner">IT Partner (Lab Access & Support)</option>
                  <option value="Gov Institution">Gov Institution (Govt. & Public)</option>
                  <option value="Academic">Academic (Schools, Colleges & More)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bilaspur / Raipur / Bhilai" />
              </div>

              <div className="form-group">
                <label className="form-label">Full Address / Location</label>
                <input type="text" className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bilaspur, Chhattisgarh" />
              </div>

              <div className="form-group">
                <label className="form-label">📍 Google My Business / Maps Link</label>
                <input type="text" className="form-input" value={gmbLink} onChange={(e) => setGmbLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input type="text" className="form-input" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+91 98765 43210" />
              </div>

              <div className="form-group">
                <label className="form-label">Lab Access Fee</label>
                <input type="text" className="form-input" value={labFee} onChange={(e) => setLabFee(e.target.value)} placeholder="₹0 - ₹100 /hr" />
              </div>

              <div className="form-group">
                <label className="form-label">Opening Timings</label>
                <input type="text" className="form-input" value={timings} onChange={(e) => setTimings(e.target.value)} placeholder="9:00 AM - 8:00 PM" />
              </div>

              <div className="form-group">
                <label className="form-label">Rating Score</label>
                <input type="text" className="form-input" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="4.6" />
              </div>

              <div className="form-group">
                <label className="form-label">Reviews Count</label>
                <input type="text" className="form-input" value={reviewsCount} onChange={(e) => setReviewsCount(e.target.value)} placeholder="128 Reviews" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">Existing Courses Offered (Comma Separated)</label>
              <input type="text" className="form-input" value={existingCourses} onChange={(e) => setExistingCourses(e.target.value)} placeholder="Full Stack, Python, Web Dev" />
            </div>

            <div className="form-group">
              <label className="form-label">About / Description</label>
              <textarea className="form-input" rows="2" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Detailed institute bio..."></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              + Create & Onboard Partner Account
            </button>
          </form>
        )}

        {/* Edit Partner Modal */}
        {editingPartner && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <form onSubmit={handleSaveEdit} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#0F172A', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                Edit Partner Profile ({editingPartner.instituteName || editingPartner.name})
              </h3>

              {/* Direct File Uploader Section in Edit Modal */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0A6836', marginBottom: '0.5rem' }}>
                  Direct Image Uploaders (Logo, Cover & Gallery Photos)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {/* 1. Avatar Logo Uploader */}
                  <div>
                    <label className="form-label">Upload Institute Logo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px' }}>
                      <img src={avatarUrl} alt="Logo" style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border-glass)' }} />
                      <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {/* 2. Hero Cover Uploader */}
                  <div>
                    <label className="form-label">Upload Hero Cover Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px' }}>
                      <img src={heroCover} alt="Cover" style={{ width: '80px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '2px solid var(--border-glass)' }} />
                      <input type="file" accept="image/*" onChange={handleHeroFile} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>

                {/* 3. Multiple Gallery Photos Uploader */}
                <div style={{ marginTop: '1rem' }}>
                  <label className="form-label">📸 Upload Multiple Gallery Photos (Select Multiple Files)</label>
                  <input type="file" accept="image/*" multiple onChange={handleMultipleGalleryFiles} style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }} />

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {galleryList.map((url, i) => (
                      <div key={i} style={{ position: 'relative', width: '70px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                        <img src={url} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryPhoto(i)}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Institute Name *</label>
                  <input type="text" className="form-input" value={instituteName} onChange={(e) => setInstituteName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Login Email *</label>
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password (Optional)</label>
                  <input type="text" className="form-input" placeholder="Leave blank to keep same" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={partnerCategory} onChange={(e) => setPartnerCategory(e.target.value)}>
                    <option value="IT Partner">IT Partner (Lab Access & Support)</option>
                    <option value="Gov Institution">Gov Institution (Govt. & Public)</option>
                    <option value="Academic">Academic (Schools, Colleges & More)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Address / Location</label>
                  <input type="text" className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">📍 Google My Business / Maps Link</label>
                  <input type="text" className="form-input" value={gmbLink} onChange={(e) => setGmbLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input type="text" className="form-input" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Lab Access Fee</label>
                  <input type="text" className="form-input" value={labFee} onChange={(e) => setLabFee(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Opening Timings</label>
                  <input type="text" className="form-input" value={timings} onChange={(e) => setTimings(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Rating Score</label>
                  <input type="text" className="form-input" value={rating} onChange={(e) => setRating(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Reviews Count</label>
                  <input type="text" className="form-input" value={reviewsCount} onChange={(e) => setReviewsCount(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label className="form-label">Existing Courses Offered (Comma Separated)</label>
                <input type="text" className="form-input" value={existingCourses} onChange={(e) => setExistingCourses(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">About / Description</label>
                <textarea className="form-input" rows="2" value={bio} onChange={(e) => setBio(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setEditingPartner(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Partner Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Onboarded Partners Grid / List */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Institute</th>
                <th>Login Email</th>
                <th>City & Location</th>
                <th>Google Maps / GMB Link</th>
                <th>Revenue & Fee</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No partner accounts onboarded yet. Click "+ Onboard New Partner Institute" to create credentials.
                  </td>
                </tr>
              ) : (
                filtered.map((partner) => (
                  <tr key={partner.id || partner._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={partner.avatarUrl || 'https://images.unsplash.com/photo-1562774053-701939374585?w=100'}
                          alt={partner.instituteName}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>{partner.instituteName || partner.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#0284C7' }}>{partner.partnerCategory || 'TCM Partner'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{partner.email}</td>
                    <td>
                      <div>{partner.location || 'Bilaspur, Chhattisgarh'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 City: {partner.city || 'Bilaspur'}</div>
                    </td>
                    <td>
                      {partner.gmbLink ? (
                        <a href={partner.gmbLink} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', fontSize: '0.8rem', textDecoration: 'underline' }}>
                          View GMB Profile ↗
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No GMB Link</span>
                      )}
                    </td>
                    <td>
                      <div style={{ color: '#34D399', fontWeight: '600' }}>{partner.totalRevenue || '₹48,750'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fee: {partner.labFee || '₹0 - ₹100 /hr'}</div>
                    </td>
                    <td>⭐ {partner.rating || 4.6} ({partner.reviewsCount || '128 Reviews'})</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#3B82F6', color: 'white' }}
                          onClick={() => handleStartEdit(partner)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-reject"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => onDeletePartner(partner.id || partner._id)}
                        >
                          <IconCross /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
