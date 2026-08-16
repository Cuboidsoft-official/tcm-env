const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDummyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    // 1. Clean Mentors
    const mentorsCollection = db.collection('mentors');
    const dummyMentorIds = ["mentor-ankit", "mentor-priya", "mentor-rohit"];
    const mentorDeleteRes = await mentorsCollection.deleteMany({
      $or: [
        { _id: { $in: dummyMentorIds } },
        { id: { $in: dummyMentorIds } },
        { name: { $in: ["Ankit Sharma", "Priya Verma", "Rohit Singh"] } }
      ]
    });
    console.log(`Deleted ${mentorDeleteRes.deletedCount} dummy mentors from MongoDB.`);

    // 2. Clean Courses
    const coursesCollection = db.collection('courses');
    const dummyCourseIds = ["p1", "p2", "p3", "b1", "b2", "b3"];
    const courseDeleteRes = await coursesCollection.deleteMany({
      $or: [
        { _id: { $in: dummyCourseIds } },
        { id: { $in: dummyCourseIds } },
        { title: { $in: ["Full Stack Web Development", "Data Science with Python", "Machine Learning A-Z"] } }
      ]
    });
    console.log(`Deleted ${courseDeleteRes.deletedCount} dummy courses from MongoDB.`);

    // Print remaining mentors & courses count
    const remainingMentors = await mentorsCollection.countDocuments();
    const remainingCourses = await coursesCollection.countDocuments();
    console.log(`Remaining Mentors in DB: ${remainingMentors}`);
    console.log(`Remaining Courses in DB: ${remainingCourses}`);

  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

cleanDummyData();
