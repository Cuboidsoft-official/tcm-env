import React, { useState } from 'react';
import { IconCourses, IconCross, IconUsers, IconCheck } from '../components/Icons';

export function CoursesView({ courses = [], onCreateCourse, onDeleteCourse, search = '' }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [mentorName, setMentorName] = useState('Ayushman Sharma');
  const [mentorTitle, setMentorTitle] = useState('Senior Full Stack Architect');
  const [lessons, setLessons] = useState('24 Lessons');
  const [image, setImage] = useState('');
  const [syllabus, setSyllabus] = useState('Module 1: HTML5/CSS3, Module 2: JS ES6+ APIs, Module 3: React 19, Module 4: Node.js & MongoDB');

  const defaultCourseList = [
    {
      id: 'c1',
      title: 'Full Stack MERN Development Masterclass',
      tags: 'React 19, Node.js, Express, MongoDB',
      category: 'Full Stack Development',
      addedByMentorName: 'Ayushman Sharma',
      addedByMentorTitle: 'Senior Full Stack Architect',
      addedByMentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      lessons: '32 Lessons (4 Modules)',
      enrolledStudents: 42,
      currentBatchProgress: 75,
      currentModuleReached: 'Module 3: React 19 & State Architecture',
      expectedCompletionDate: '25 Sep 2026',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500',
      syllabusModules: [
        { name: 'Module 1: Modern Web Foundations', topics: 'HTML5 Semantic, CSS Grid, Flexbox, Responsive Design' },
        { name: 'Module 2: Advanced JavaScript ES6+', topics: 'Async/Await, Closures, DOM Architecture, Fetch APIs' },
        { name: 'Module 3: React 19 & State Engine', topics: 'Hooks, Context API, Redux Toolkit, Performance' },
        { name: 'Module 4: Node.js & MongoDB Backend', topics: 'REST APIs, JWT Auth, Mongoose Schema, Cloud Deploy' }
      ],
      pastCompletedBatches: [
        { batchName: 'Batch 1 (Jan - Apr 2026)', completedDate: '20 Apr 2026', certifiedStudents: 38, avgRating: '4.9/5' },
        { batchName: 'Batch 2 (May - Jul 2026)', completedDate: '30 Jul 2026', certifiedStudents: 45, avgRating: '5.0/5' }
      ]
    },
    {
      id: 'c2',
      title: 'Python & Machine Learning Zero to Hero',
      tags: 'Python, NumPy, Pandas, Scikit-Learn',
      category: 'AI & Data Science',
      addedByMentorName: 'Neha Gupta',
      addedByMentorTitle: 'AI & ML Lead Specialist',
      addedByMentorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      lessons: '28 Lessons (3 Modules)',
      enrolledStudents: 35,
      currentBatchProgress: 100,
      currentModuleReached: 'Module 3: Machine Learning Model Deployment (Certified)',
      expectedCompletionDate: 'Completed 10 Aug 2026',
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500',
      syllabusModules: [
        { name: 'Module 1: Python Essentials', topics: 'Data Types, Functions, OOPs, File I/O' },
        { name: 'Module 2: Data Science Toolkit', topics: 'NumPy Arrays, Pandas DataFrames, Matplotlib' },
        { name: 'Module 3: ML Algorithms & Models', topics: 'Linear Regression, Decision Trees, Model Deploy' }
      ],
      pastCompletedBatches: [
        { batchName: 'Batch 1 (Feb - Jun 2026)', completedDate: '15 Jun 2026', certifiedStudents: 32, avgRating: '4.8/5' }
      ]
    },
    {
      id: 'c3',
      title: 'React Native Mobile App Architecture',
      tags: 'React Native, Expo, Redux, iOS/Android',
      category: 'Mobile App Development',
      addedByMentorName: 'Ayushman Sharma',
      addedByMentorTitle: 'Senior Full Stack Architect',
      addedByMentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      lessons: '24 Lessons (3 Modules)',
      enrolledStudents: 28,
      currentBatchProgress: 40,
      currentModuleReached: 'Module 2: Navigation & Native Features',
      expectedCompletionDate: '30 Oct 2026',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500',
      syllabusModules: [
        { name: 'Module 1: React Native Core & Layouts', topics: 'Flexbox, View/Text, Touchables, Custom Components' },
        { name: 'Module 2: React Navigation & State', topics: 'Stack/Tab Nav, Redux Toolkit, Async Storage' },
        { name: 'Module 3: Native APIs & App Publishing', topics: 'Camera, Push Notifications, Play Store Deploy' }
      ],
      pastCompletedBatches: [
        { batchName: 'Batch 1 (Mar - Jun 2026)', completedDate: '25 Jun 2026', certifiedStudents: 25, avgRating: '4.9/5' }
      ]
    }
  ];

  const courseList = courses.length > 0
    ? courses.map((c, idx) => ({
        ...c,
        category: c.category || defaultCourseList[idx % 3]?.category || 'Tech Course',
        addedByMentorName: c.addedByMentorName || defaultCourseList[idx % 3]?.addedByMentorName || 'Ayushman Sharma',
        addedByMentorTitle: c.addedByMentorTitle || defaultCourseList[idx % 3]?.addedByMentorTitle || 'Senior Educator',
        addedByMentorAvatar: c.addedByMentorAvatar || defaultCourseList[idx % 3]?.addedByMentorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        enrolledStudents: c.enrolledStudents || defaultCourseList[idx % 3]?.enrolledStudents || 30,
        currentBatchProgress: c.currentBatchProgress || defaultCourseList[idx % 3]?.currentBatchProgress || 65,
        currentModuleReached: c.currentModuleReached || defaultCourseList[idx % 3]?.currentModuleReached || 'Module 2: Core Architecture',
        expectedCompletionDate: c.expectedCompletionDate || defaultCourseList[idx % 3]?.expectedCompletionDate || '15 Oct 2026',
        syllabusModules: c.syllabusModules || defaultCourseList[idx % 3]?.syllabusModules || [],
        pastCompletedBatches: c.pastCompletedBatches || defaultCourseList[idx % 3]?.pastCompletedBatches || []
      }))
    : defaultCourseList;

  const filtered = courseList.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.tags?.toLowerCase().includes(search.toLowerCase()) ||
    c.addedByMentorName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    onCreateCourse({
      title,
      tags,
      addedByMentorName: mentorName,
      addedByMentorTitle: mentorTitle,
      lessons,
      image: image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500',
      syllabus
    });
    setTitle('');
    setTags('');
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconCourses style={{ color: 'var(--accent-primary)' }} />
              <span>Courses & Learning Programs ({filtered.length})</span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '2px' }}>
              Detailed course syllabus, mentor additions, batch completion status, and past completed batches.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddModal(!showAddModal)}>
            {showAddModal ? 'Cancel' : '+ Add New Course'}
          </button>
        </div>

        {showAddModal && (
          <form onSubmit={handleSubmitCreate} style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', color: '#0F172A', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
              Create New Mentor Course
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Course Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Master System Design" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tags / Tech Stack *</label>
                <input type="text" className="form-input" placeholder="e.g. React, Node, System Design" value={tags} onChange={(e) => setTags(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Added By Mentor Name</label>
                <input type="text" className="form-input" value={mentorName} onChange={(e) => setMentorName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Mentor Title / Designation</label>
                <input type="text" className="form-input" value={mentorTitle} onChange={(e) => setMentorTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Lessons / Modules Count</label>
                <input type="text" className="form-input" value={lessons} onChange={(e) => setLessons(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Cover Image URL</label>
                <input type="text" className="form-input" placeholder="https://..." value={image} onChange={(e) => setImage(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Full Syllabus Overview (Comma Separated Modules)</label>
              <textarea className="form-input" rows="2" value={syllabus} onChange={(e) => setSyllabus(e.target.value)}></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Publish Course to App
            </button>
          </form>
        )}

        {/* Redesigned Courses Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((course) => (
            <div key={course.id || course._id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.15s ease' }}>
              {/* Banner Image with Overlay Badges */}
              <div style={{ position: 'relative', width: '100%', height: '140px' }}>
                <img
                  src={course.image || course.imageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500'}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(10, 104, 54, 0.9)', color: 'white', fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                  {course.category || 'Tech Program'}
                </span>
                <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(15, 23, 42, 0.85)', color: 'white', fontSize: '0.68rem', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                  {course.lessons || '24 Lessons'}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '700', lineHeight: '1.3' }}>{course.title}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {course.tags?.split(',').map((t, idx) => (
                      <span key={idx} className="skill-tag">{t.trim()}</span>
                    ))}
                  </div>
                </div>

                {/* Mentor Added Info Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#F8FAFC', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <img src={course.addedByMentorAvatar} alt={course.addedByMentorName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #0A6836' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0F172A' }}>Instructor: {course.addedByMentorName}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{course.addedByMentorTitle}</div>
                  </div>
                </div>

                {/* Batch Progress Bar & Details */}
                <div style={{ background: '#F8FAFC', padding: '0.6rem 0.65rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '700', color: course.currentBatchProgress === 100 ? '#0A6836' : '#2563EB' }}>
                      Batch Progress: {course.currentBatchProgress}%
                    </span>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>{course.enrolledStudents} Enrolled</span>
                  </div>

                  <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${course.currentBatchProgress}%`,
                        height: '100%',
                        background: course.currentBatchProgress === 100 ? '#10B981' : '#2563EB',
                        borderRadius: '3px'
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '5px' }}>
                    <strong>Current Stage:</strong> {course.currentModuleReached}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '2px', fontWeight: '600' }}>
                    <strong>Target Completion:</strong> {course.expectedCompletionDate}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => setSelectedCourseDetails(course)}
                  >
                    View Syllabus & Batches
                  </button>
                  <button
                    className="btn btn-reject"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => onDeleteCourse(course.id || course._id)}
                  >
                    <IconCross />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Detailed Syllabus & Past Batches Modal */}
      {selectedCourseDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                {selectedCourseDetails.title} - Full Syllabus & Batch Details
              </h3>
              <button onClick={() => setSelectedCourseDetails(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}>
                ✕
              </button>
            </div>

            {/* Mentor Info */}
            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={selectedCourseDetails.addedByMentorAvatar} alt="Mentor" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #0A6836' }} />
              <div>
                <div style={{ fontWeight: '700', color: '#0F172A' }}>Course Instructor: {selectedCourseDetails.addedByMentorName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{selectedCourseDetails.addedByMentorTitle}</div>
              </div>
            </div>

            {/* Batch Progress & Completion Target */}
            <div style={{ background: '#E8F5E9', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #C8E6C9' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0A6836' }}>Live Batch Status:</div>
              <div style={{ fontSize: '0.78rem', color: '#0F172A', marginTop: '2px' }}>Current Progress: {selectedCourseDetails.currentBatchProgress}% ({selectedCourseDetails.enrolledStudents} Enrolled Students)</div>
              <div style={{ fontSize: '0.78rem', color: '#0F172A' }}>Module Reached: {selectedCourseDetails.currentModuleReached}</div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700', marginTop: '2px' }}>Completion Target Date: {selectedCourseDetails.expectedCompletionDate}</div>
            </div>

            {/* Full Syllabus Modules */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>Full Syllabus Modules & Curriculum:</h4>
              {selectedCourseDetails.syllabusModules?.length > 0 ? (
                selectedCourseDetails.syllabusModules.map((mod, i) => (
                  <div key={i} style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '6px', marginBottom: '0.4rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0A6836' }}>{mod.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px' }}>Topics: {mod.topics}</div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Standard TCM One Accredited Tech Curriculum.</div>
              )}
            </div>

            {/* Past Completed Batches History */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>Previously Completed Batches History:</h4>
              {selectedCourseDetails.pastCompletedBatches?.length > 0 ? (
                selectedCourseDetails.pastCompletedBatches.map((batch, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F1F5F9', padding: '0.6rem 0.85rem', borderRadius: '6px', marginBottom: '0.35rem' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0F172A' }}>{batch.batchName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Completed: {batch.completedDate}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0A6836' }}>{batch.certifiedStudents} Certified</div>
                      <div style={{ fontSize: '0.72rem', color: '#D97706' }}>Rating: {batch.avgRating}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Batch 1 currently in progress.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={() => setSelectedCourseDetails(null)}>
                Close Details Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
