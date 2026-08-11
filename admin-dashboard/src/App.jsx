import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { adminApi } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthView } from './views/AuthView';
import { OverviewView } from './views/OverviewView';
import { MentorApprovalsView } from './views/MentorApprovalsView';
import { UsersView } from './views/UsersView';
import { CoursesView } from './views/CoursesView';
import { JobsView } from './views/JobsView';
import { WebinarsView } from './views/WebinarsView';
import { PartnersView } from './views/PartnersView';
import { StudentsAnalyticsView } from './views/StudentsAnalyticsView';
import { PurchasedCoursesView } from './views/PurchasedCoursesView';
import { MentorAssignmentsView } from './views/MentorAssignmentsView';
import { WalletTransactionsView } from './views/WalletTransactionsView';
import { PartnerTicketsView } from './views/PartnerTicketsView';

export function App() {
  const { adminUser } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');
  const [search, setSearch] = useState('');

  const [stats, setStats] = useState({
    totalUsers: 0,
    studentsCount: 0,
    mentorsCount: 0,
    pendingMentorsCount: 0,
    approvedMentorsCount: 0,
    coursesCount: 0,
    jobsCount: 0
  });

  const [mentors, setMentors] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [partners, setPartners] = useState([]);
  const [enrollmentsData, setEnrollmentsData] = useState({});
  const [loadingData, setLoadingData] = useState(false);

  const loadData = async () => {
    if (!adminUser) return;
    setLoadingData(true);
    try {
      const [statsRes, mentorsRes, usersRes, coursesRes, jobsRes, partnersRes, enrollmentsRes] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getMentors('all'),
        adminApi.getUsers(),
        adminApi.getCourses(),
        adminApi.getJobs(),
        adminApi.getPartners(),
        adminApi.getEnrollments()
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (mentorsRes.status === 'fulfilled') setMentors(mentorsRes.value);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value);
      if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value);
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value);
      if (partnersRes.status === 'fulfilled') setPartners(partnersRes.value);
      if (enrollmentsRes.status === 'fulfilled') setEnrollmentsData(enrollmentsRes.value);
    } catch (err) {
      console.warn('Backend loading warning:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [adminUser]);

  if (!adminUser) {
    return <AuthView />;
  }

  const pendingMentors = mentors.filter((m) => !m.isApproved);

  const handleApproveMentor = async (id) => {
    try {
      await adminApi.approveMentor(id);
      setMentors((prev) =>
        prev.map((m) => (String(m.id || m._id) === String(id) ? { ...m, isApproved: true } : m))
      );
      setUsers((prev) =>
        prev.map((u) => (String(u.id || u._id) === String(id) ? { ...u, isApproved: true } : u))
      );
      setStats((s) => ({
        ...s,
        pendingMentorsCount: Math.max(0, s.pendingMentorsCount - 1),
        approvedMentorsCount: s.approvedMentorsCount + 1
      }));
    } catch (err) {
      alert('Could not approve mentor: ' + err.message);
    }
  };

  const handleRejectMentor = async (id) => {
    try {
      await adminApi.rejectMentor(id);
      setMentors((prev) =>
        prev.map((m) => (String(m.id || m._id) === String(id) ? { ...m, isApproved: false } : m))
      );
      setUsers((prev) =>
        prev.map((u) => (String(u.id || u._id) === String(id) ? { ...u, isApproved: false } : u))
      );
    } catch (err) {
      alert('Could not reject mentor: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => String(u.id || u._id) !== String(id)));
      setMentors((prev) => prev.filter((m) => String(m.id || m._id) !== String(id)));
    } catch (err) {
      alert('Could not delete user: ' + err.message);
    }
  };

  const handleCreateCourse = async (courseData) => {
    try {
      const created = await adminApi.createCourse(courseData);
      setCourses([created, ...courses]);
    } catch (err) {
      alert('Could not create course: ' + err.message);
    }
  };

  const handleDeleteCourse = async (id) => {
    try {
      await adminApi.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => String(c.id || c._id) !== String(id)));
    } catch (err) {
      alert('Could not delete course: ' + err.message);
    }
  };

  const handleCreateJob = async (jobData) => {
    try {
      const created = await adminApi.createJob(jobData);
      setJobs([created, ...jobs]);
    } catch (err) {
      alert('Could not post job: ' + err.message);
    }
  };

  const handleDeleteJob = async (id) => {
    try {
      await adminApi.deleteJob(id);
      setJobs((prev) => prev.filter((j) => String(j.id || j._id) !== String(id)));
    } catch (err) {
      alert('Could not delete job: ' + err.message);
    }
  };

  const handleCreatePartner = async (partnerData) => {
    try {
      const created = await adminApi.createPartner(partnerData);
      setPartners([created, ...partners]);
      setUsers([created, ...users]);
      alert(`Partner "${created.instituteName || created.name}" onboarded successfully!`);
    } catch (err) {
      alert('Could not onboard partner: ' + err.message);
    }
  };

  const handleUpdateUser = async (id, updates) => {
    try {
      const updated = await adminApi.updateUser(id, updates);
      setUsers((prev) =>
        prev.map((u) => (String(u.id || u._id) === String(id) ? { ...u, ...updated } : u))
      );
      setMentors((prev) =>
        prev.map((m) => (String(m.id || m._id) === String(id) ? { ...m, ...updated } : m))
      );
      alert('User account updated successfully!');
    } catch (err) {
      alert('Could not update user: ' + err.message);
    }
  };

  const handleUpdatePartner = async (id, updates) => {
    try {
      const updated = await adminApi.updatePartner(id, updates);
      setPartners((prev) =>
        prev.map((p) => (String(p.id || p._id) === String(id) ? { ...p, ...updated } : p))
      );
      setUsers((prev) =>
        prev.map((u) => (String(u.id || u._id) === String(id) ? { ...u, ...updated } : u))
      );
      alert(`Partner "${updated.instituteName || updated.name}" updated successfully!`);
    } catch (err) {
      alert('Could not update partner: ' + err.message);
    }
  };

  const handleDeletePartner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partner institute account?')) return;
    try {
      await adminApi.deletePartner(id);
      setPartners((prev) => prev.filter((p) => String(p.id || p._id) !== String(id)));
      setUsers((prev) => prev.filter((u) => String(u.id || u._id) !== String(id)));
    } catch (err) {
      alert('Could not delete partner: ' + err.message);
    }
  };

  const getTitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Admin Platform Overview';
      case 'students':
        return 'Students Directory & Learning Analytics';
      case 'purchases':
        return 'Purchased Courses & Transaction History';
      case 'mentor-assignments':
        return 'Mentor-to-Student Course Assignments';
      case 'wallet':
        return 'Referrals, Wallet & Payment Transactions';
      case 'tickets':
        return 'P-Support Tickets Management';
      case 'approvals':
        return 'Mentor Profile Approval Queue';
      case 'partners':
        return 'Partner Onboarding & Institute Accounts';
      case 'users':
        return 'User Accounts Directory';
      case 'courses':
        return 'Courses & Learning Portal';
      case 'jobs':
        return 'Jobs & Placement Portal';
      case 'webinars':
        return 'Webinars & Live Masterclasses';
      default:
        return 'Admin Dashboard';
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingCount={pendingMentors.length}
      />

      <div className="main-wrapper">
        <Header title={getTitle()} search={search} setSearch={setSearch} />

        <main className="view-content">
          {currentTab === 'overview' && (
            <OverviewView
              stats={stats}
              pendingMentors={pendingMentors}
              onApprove={handleApproveMentor}
              onReject={handleRejectMentor}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'students' && (
            <StudentsAnalyticsView
              enrollmentsData={enrollmentsData}
              search={search}
            />
          )}

          {currentTab === 'purchases' && (
            <PurchasedCoursesView
              enrollmentsData={enrollmentsData}
              search={search}
            />
          )}

          {currentTab === 'mentor-assignments' && (
            <MentorAssignmentsView
              enrollmentsData={enrollmentsData}
              mentors={mentors}
              search={search}
            />
          )}

          {currentTab === 'wallet' && (
            <WalletTransactionsView search={search} />
          )}

          {currentTab === 'tickets' && (
            <PartnerTicketsView search={search} />
          )}

          {currentTab === 'approvals' && (
            <MentorApprovalsView
              mentors={mentors}
              onApprove={handleApproveMentor}
              onReject={handleRejectMentor}
              search={search}
            />
          )}

          {currentTab === 'partners' && (
            <PartnersView
              partners={partners}
              onCreatePartner={handleCreatePartner}
              onUpdatePartner={handleUpdatePartner}
              onDeletePartner={handleDeletePartner}
              search={search}
            />
          )}

          {currentTab === 'users' && (
            <UsersView
              users={users}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              search={search}
            />
          )}

          {currentTab === 'courses' && (
            <CoursesView
              courses={courses}
              onCreateCourse={handleCreateCourse}
              onDeleteCourse={handleDeleteCourse}
              search={search}
            />
          )}

          {currentTab === 'jobs' && (
            <JobsView
              jobs={jobs}
              onCreateJob={handleCreateJob}
              onDeleteJob={handleDeleteJob}
              search={search}
            />
          )}

          {currentTab === 'webinars' && <WebinarsView search={search} />}
        </main>
      </div>
    </div>
  );
}
