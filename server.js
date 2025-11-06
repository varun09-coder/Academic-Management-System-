// server.js

// 1. MODULE IMPORTS
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// 2. SERVER SETUP & CONFIGURATION
const app = express();
const PORT = 3000;
const MONGO_URI = 'mongodb://localhost:27017/university_portal';
const TEACHER_SECRET_KEY = 'admin123';

// Middleware
app.use(express.json());

// 3. MONGODB CONNECTION
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully.');
        initializeData();
    })
    .catch(err => console.error('❌ MongoDB connection error:', err.message));


// 4. MONGOOSE SCHEMAS AND MODELS
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    studentId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    coursesTaught: [String]
});
const User = mongoose.model('User', userSchema);

const Course = mongoose.model('Course', new mongoose.Schema({
    courseCode: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    teacherUsername: { type: String, required: true },
    maxSeats: { type: Number, default: 30 },
    enrolledStudents: [{ type: String }],
    waitlistStudents: [{ type: String }],
}));

const Fee = mongoose.model('Fee', new mongoose.Schema({
    studentId: { type: String, required: true },
    amountDue: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Unpaid', 'Partially Paid', 'Fully Paid'], default: 'Unpaid' },
    dueDate: { type: Date, required: true },
    semester: String,
}));

const Appointment = mongoose.model('Appointment', new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    teacherUsername: { type: String, required: true },
    date: { type: Date, required: true },
    topic: String,
    status: { type: String, enum: ['Pending', 'Confirmed', 'Completed'], default: 'Pending' }
}));

const Ticket = mongoose.model('Ticket', new mongoose.Schema({
    submittedBy: { type: String, required: true },
    submittedRole: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
    date: { type: Date, default: Date.now },
}));

const timetableSchema = new mongoose.Schema({
    course: { type: String, required: true },
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    teacherUsername: { type: String, required: true }
});
const Timetable = mongoose.model('Timetable', timetableSchema, 'timetables');


const Attendance = mongoose.model('Attendance', new mongoose.Schema({
    studentId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
    course: { type: String, required: true },
}));

const Mark = mongoose.model('Mark', new mongoose.Schema({
    studentId: { type: String, required: true },
    course: { type: String, required: true },
    examType: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, default: 100 },
}));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    postedBy: { type: String, default: 'Admin' },
    date: { type: Date, default: Date.now },
    targetRole: { type: String, enum: ['student', 'teacher', 'all'], default: 'all' }
}));


// 5. SAMPLE DATA INITIALIZATION
async function initializeData() {
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const feeCount = await Fee.countDocuments();

    // Check for inconsistent data or empty user base
    if (userCount === 0 || courseCount === 0 || feeCount === 0) {
        if (userCount > 0) {
             console.log('⚠️ Partial data detected! Forcing complete data reset.');
        } else {
             console.log('--- Initializing Sample Data ---');
        }

        // Clear ALL data to ensure consistency across collections
        await User.deleteMany({});
        await Course.deleteMany({});
        await Fee.deleteMany({});
        await Appointment.deleteMany({});
        await Ticket.deleteMany({});
        await Mark.deleteMany({});
        await Timetable.deleteMany({});
        await Attendance.deleteMany({});
        await Announcement.deleteMany({});
        console.log('Previous data cleared. Starting fresh initialization.');

        try {
            await User.create([
                { username: 'amita', password: 'pass', role: 'teacher', name: 'Amita Sharma', coursesTaught: ['CS101', 'PHY101'] },
                { username: 'sachin', password: 'pass', role: 'teacher', name: 'Sachin Verma', coursesTaught: ['ENG101'] },
                { username: 'mehak', password: 'pass', role: 'teacher', name: 'Mehak Kaur', coursesTaught: ['MATH101'] },
                { username: 'admin1', password: 'pass', role: 'admin', name: 'Portal Admin', coursesTaught: ['CS101', 'PHY101'] },
                
                { username: 'student1', password: 'pass', role: 'student', studentId: 'S001', name: 'Alice Smith' },
                { username: 'student2', password: 'pass', role: 'student', studentId: 'S002', name: 'Bob Jones' },
                { username: 'student3', password: 'pass', role: 'student', studentId: 'S003', name: 'Charlie Brown' },
                { username: 'student4', password: 'pass', role: 'student', studentId: 'S004', name: 'Diana Prince' },
            ]);

            await Course.create([
                { courseCode: 'CS101', title: 'Intro to Programming', teacherUsername: 'amita', maxSeats: 4, enrolledStudents: ['S001', 'S002', 'S003'], waitlistStudents: ['S004'] },
                { courseCode: 'MATH101', title: 'Calculus I', teacherUsername: 'mehak', maxSeats: 3, enrolledStudents: ['S001', 'S002'], waitlistStudents: ['S003'] },
                { courseCode: 'ENG101', title: 'Academic Writing', teacherUsername: 'sachin', maxSeats: 5, enrolledStudents: ['S004'], waitlistStudents: [] },
            ]);

            await Fee.create([
                { studentId: 'S001', amountDue: 5000, paymentStatus: 'Fully Paid', dueDate: new Date('2026-01-15'), semester: 'Fall 2025' },
                { studentId: 'S002', amountDue: 5000, paymentStatus: 'Unpaid', dueDate: new Date('2026-01-15'), semester: 'Fall 2025' },
                { studentId: 'S003', amountDue: 5000, paymentStatus: 'Partially Paid', dueDate: new Date('2026-01-15'), semester: 'Fall 2025' },
                { studentId: 'S004', amountDue: 4500, paymentStatus: 'Fully Paid', dueDate: new Date('2026-01-15'), semester: 'Fall 2025' },
            ]);

            await Appointment.create([
                { studentId: 'S001', studentName: 'Alice Smith', teacherUsername: 'amita', date: new Date('2025-11-01T10:00:00Z'), topic: 'Course Selection', status: 'Pending' },
            ]);

            await Ticket.create([
                { submittedBy: 'student1', submittedRole: 'student', title: 'LMS Password Reset', description: 'Can\'t log into the Learning Management System.', status: 'Open' },
            ]);

            await Mark.create([
                { studentId: 'S001', course: 'MATH101', examType: 'Midterm', score: 85, maxScore: 100 },
                { studentId: 'CLASS_AVG', course: 'MATH101', examType: 'Midterm', score: 78, maxScore: 100 },
            ]);

            await Timetable.create([
                { course: 'MATH101', day: 'Monday', startTime: '09:00', endTime: '10:00', teacherUsername: 'mehak' }, 
                { course: 'CS101', day: 'Tuesday', startTime: '10:00', endTime: '11:30', teacherUsername: 'amita' },
                { course: 'ENG101', day: 'Wednesday', startTime: '14:00', endTime: '15:00', teacherUsername: 'sachin' }, 
            ]);
            await Attendance.create([
                { studentId: 'S001', date: new Date('2025-10-20'), status: 'Present', course: 'MATH101' },
                { studentId: 'S001', date: new Date('2025-10-22'), status: 'Present', course: 'CS101' },
            ]);
            
            await Announcement.create([
                { title: 'Welcome Back!', content: 'Check your schedules.', postedBy: 'Admin', targetRole: 'all' },
                { title: 'Faculty Meeting Next Week', content: 'Mandatory meeting on Tuesday.', postedBy: 'Admin', targetRole: 'teacher' },
                { title: 'Important Math Update', content: 'Math midterm rescheduled.', postedBy: 'Dr. Bob Johnson', targetRole: 'student' },
            ]);

            console.log('Sample data created successfully.');
        } catch (error) {
            console.error('CRITICAL: Failed to initialize sample data. Check MongoDB connection/permissions:', error.message);
        }
    } else {
        console.log('Sample data already exists. Skipping initialization.');
    }
}


// --- ROLE AUTHORIZATION MIDDLEWARE ---
function isTeacher(req, res, next) {
    const userRole = req.headers['x-user-role'];
    if (userRole === 'teacher' || userRole === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access Denied: Teachers/Admins only.' });
    }
}


// 6. API ENDPOINTS

// --- AUTHENTICATION & USER MANAGEMENT ---

app.post('/api/auth/signup', async (req, res) => {
    const { name, studentId, username, password, secretKey } = req.body;
    
    if (!name || !username || !password || (!studentId && secretKey !== TEACHER_SECRET_KEY)) {
        return res.status(400).json({ message: 'Missing required fields or secret key.' });
    }

    let role = 'student';
    if (secretKey === TEACHER_SECRET_KEY) {
        role = 'teacher';
    } else if (secretKey) {
        return res.status(403).json({ message: 'Invalid secret key for Teacher registration.' });
    }
    
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(409).json({ message: 'Username already taken.' });
        
        if (role === 'student' && await User.findOne({ studentId, role: 'student' })) {
             return res.status(409).json({ message: 'Student ID already registered.' });
        }
        
        // FIX: Ensure coursesTaught is only set for teachers/admins
        const newUser = new User({
            name, 
            studentId: studentId || null, 
            username, 
            password, 
            role, 
            coursesTaught: role === 'teacher' || role === 'admin' ? [] : undefined 
        });

        await newUser.save();
        res.status(201).json({ message: `${role} registered successfully!`, user: newUser });
        
        // FIX: If a new student is registered, automatically create an 'Unpaid' fee record
        if (role === 'student' && newUser.studentId) {
             await Fee.create({ 
                 studentId: newUser.studentId, 
                 amountDue: 5000, // Default fee
                 paymentStatus: 'Unpaid', 
                 dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Due next year
                 semester: 'New Enrollment'
             });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        res.json({ 
            message: 'Login successful', 
            user: { role: user.role, studentId: user.studentId, name: user.name, username: user.username, coursesTaught: user.coursesTaught } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during authentication' });
    }
});

app.get('/api/users/students', isTeacher, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students.' });
    }
});

app.post('/api/users/students', isTeacher, async (req, res) => {
    const { name, studentId, username, password } = req.body;
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { studentId }] });
        if (existingUser) return res.status(409).json({ message: 'Username or Student ID already exists.' });

        const newUser = new User({ name, studentId, username, password, role: 'student' });
        await newUser.save();
        res.status(201).json({ message: 'Student added successfully!', user: newUser });

        // FIX: If a new student is added via Teacher tool, automatically create an 'Unpaid' fee record
        await Fee.create({ 
             studentId: newUser.studentId, 
             amountDue: 5000, 
             paymentStatus: 'Unpaid', 
             dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
             semester: 'New Enrollment'
        });

    } catch (error) {
        res.status(500).json({ message: 'Error adding student.' });
    }
});

app.put('/api/users/students/:id', isTeacher, async (req, res) => {
    const { id } = req.params;
    const { name, studentId, username } = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, studentId, username },
            { new: true, runValidators: true }
        ).select('-password');
        if (!updatedUser) return res.status(404).json({ message: 'Student not found.' });

        res.json({ message: 'Student details updated successfully.', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error updating student details.' });
    }
});

app.delete('/api/users/students/:id', isTeacher, async (req, res) => {
    const { id } = req.params;
    try {
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) return res.status(404).json({ message: 'Student not found.' });

        await Mark.deleteMany({ studentId: deletedUser.studentId });
        await Attendance.deleteMany({ studentId: deletedUser.studentId });
        await Fee.deleteMany({ studentId: deletedUser.studentId });
        // FIX: Delete Appointments and Tickets created by the student too
        await Appointment.deleteMany({ studentId: deletedUser.studentId });
        await Ticket.deleteMany({ submittedBy: deletedUser.username, submittedRole: 'student' });

        res.json({ message: 'Student and all associated records deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student.' });
    }
});


// --- COURSE MANAGEMENT ENDPOINTS ---

app.post('/api/management/courses', isTeacher, async (req, res) => {
    const { courseCode, title, maxSeats } = req.body;
    const teacherUsername = req.headers['x-user-username'];
    
    if (!courseCode || !title || !maxSeats || !teacherUsername) {
        return res.status(400).json({ message: 'Missing course code, title, max seats, or teacher username.' });
    }
    
    try {
        const existingCourse = await Course.findOne({ courseCode });
        if (existingCourse) {
            return res.status(409).json({ message: 'Course Code already exists.' });
        }

        const newCourse = await Course.create({
            courseCode,
            title,
            teacherUsername,
            maxSeats: parseInt(maxSeats),
            enrolledStudents: [],
            waitlistStudents: []
        });

        res.status(201).json({ message: 'Course added successfully!', course: newCourse });
    } catch (error) {
        res.status(500).json({ message: 'Error adding course.', error: error.message });
    }
});

app.put('/api/management/courses/:courseCode', isTeacher, async (req, res) => {
    const { courseCode } = req.params;
    const { title, maxSeats, teacherUsername } = req.body;
    
    try {
        const updatedCourse = await Course.findOneAndUpdate(
            { courseCode },
            { $set: { title, maxSeats: parseInt(maxSeats), teacherUsername } },
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.json({ message: 'Course updated successfully.', course: updatedCourse });
    } catch (error) {
        res.status(500).json({ message: 'Error updating course.', error: error.message });
    }
});


// FIX: Added delete endpoint for course management
app.delete('/api/management/courses/:courseCode', isTeacher, async (req, res) => {
    const { courseCode } = req.params;
    try {
        const deletedCourse = await Course.findOneAndDelete({ courseCode });

        if (!deletedCourse) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        
        // Also delete associated records
        await Timetable.deleteMany({ course: courseCode });
        await Mark.deleteMany({ course: courseCode });
        await Attendance.deleteMany({ course: courseCode });
        
        res.json({ message: 'Course and all associated records deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting course.', error: error.message });
    }
});


app.get('/api/management/enrollment/:courseCode', isTeacher, async (req, res) => {
    try {
        const { courseCode } = req.params;
        const course = await Course.findOne({ courseCode });

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const enrolledStudents = await User.find({ studentId: { $in: course.enrolledStudents } }).select('studentId name');
        const waitlistStudents = await User.find({ studentId: { $in: course.waitlistStudents } }).select('studentId name');

        res.json({
            course,
            enrolled: enrolledStudents,
            waitlist: waitlistStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching enrollment details.', error });
    }
});

app.post('/api/management/enrollment/:courseCode', isTeacher, async (req, res) => {
    const { courseCode } = req.params;
    const { studentId, action } = req.body;
    
    if (!studentId || !action) return res.status(400).json({ message: 'Missing studentId or action.' });

    try {
        const course = await Course.findOne({ courseCode });
        const student = await User.findOne({ studentId, role: 'student' });

        if (!course || !student) return res.status(404).json({ message: 'Course or Student not found.' });

        // Remove student from both lists first to ensure no duplicates after action
        course.enrolledStudents = course.enrolledStudents.filter(id => id !== studentId);
        course.waitlistStudents = course.waitlistStudents.filter(id => id !== studentId);

        let message = '';
        if (action === 'enroll') {
            if (course.enrolledStudents.length < course.maxSeats) {
                course.enrolledStudents.push(studentId);
                message = `Student ${student.name} (${studentId}) successfully enrolled in ${courseCode}.`;
            } else {
                course.waitlistStudents.push(studentId);
                message = `Course ${courseCode} is full. Student ${student.name} (${studentId}) added to waitlist.`;
            }
        } else if (action === 'waitlist') {
            course.waitlistStudents.push(studentId);
            message = `Student ${student.name} (${studentId}) successfully placed on waitlist for ${courseCode}.`;
        } else if (action === 'drop') {
            message = `Student ${student.name} (${studentId}) successfully dropped from ${courseCode}/waitlist.`;
        } else {
            return res.status(400).json({ message: 'Invalid action.' });
        }

        await course.save();
        res.json({ message, course });
    } catch (error) {
        res.status(500).json({ message: 'Error updating enrollment status.', error: error.message });
    }
});


// --- FEES MANAGEMENT ENDPOINTS ---

// FIX: Aggregation pipeline modified to ensure ALL students appear, even if they have no fee record
app.get('/api/management/fees', async (req, res) => { 
    try {
        const fees = await User.aggregate([
            // 1. Filter only student users
            { $match: { role: 'student', studentId: { $ne: null } } }, 
            
            // 2. Left join with the fee records (current or new/default)
            {
                $lookup: {
                    from: 'fees', // The collection name is explicitly 'fees'
                    localField: 'studentId',
                    foreignField: 'studentId',
                    as: 'feeDetails'
                }
            },
            
            // 3. Unwind the fees (if multiple records, it expands; if zero, it keeps the user due to 'preserveNullAndEmptyArrays')
            {
                 $unwind: { path: '$feeDetails', preserveNullAndEmptyArrays: true }
            },
            
            // 4. Project the final structure, providing default values for missing fee records
            {
                $project: {
                    _id: { $ifNull: ['$feeDetails._id', { $toString: '$_id' }] }, // Use fee ID or User ID as fallback ID
                    studentId: '$studentId',
                    studentName: '$name',
                    amountDue: { $ifNull: ['$feeDetails.amountDue', 5000] },
                    paymentStatus: { $ifNull: ['$feeDetails.paymentStatus', 'No Record'] }, // Set default status
                    dueDate: { $ifNull: ['$feeDetails.dueDate', new Date(new Date().setFullYear(new Date().getFullYear() + 1))] },
                    semester: { $ifNull: ['$feeDetails.semester', 'N/A'] }
                }
            }
        ]);
        
        res.json(fees);
    } catch (error) {
        console.error('Fees fetch failed:', error.message);
        res.status(500).json({ message: 'Error fetching fee data.', error });
    }
});

app.put('/api/management/fees/:id', isTeacher, async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        if (!['Unpaid', 'Partially Paid', 'Fully Paid'].includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status.' });
        }
        
        // When updating, we rely on the Fee collection ID (which is passed as _id)
        const updatedFee = await Fee.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true }
        );
        
        if (!updatedFee) {
            // This case handles attempts to update a fee for a student who has "No Record" (using User ID as fallback)
            // In a production system, a new Fee document would be created here.
            return res.status(404).json({ message: 'Fee record not found. Please add a new fee record for this student first.' });
        }
        
        res.json({ message: 'Fee status updated successfully.', fee: updatedFee });
    } catch (error) {
        res.status(500).json({ message: 'Error updating fee status.', error });
    }
});


// --- APPOINTMENTS & TICKETS ENDPOINTS ---
app.get('/api/tickets/open', isTeacher, async (req, res) => {
    try {
        const tickets = await Ticket.find({ status: { $ne: 'Closed' } }).sort({ date: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tickets.', error });
    }
});

app.put('/api/tickets/:id', isTeacher, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Open', 'In Progress', 'Closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid ticket status.' });
        }
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!updatedTicket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }
        res.json({ message: 'Ticket status updated successfully.', ticket: updatedTicket });
    } catch (error) {
        res.status(500).json({ message: 'Error updating ticket status.', error });
    }
});

app.post('/api/tickets', async (req, res) => {
    try {
        // FIX: Default submittedRole to 'student' if not provided
        const { submittedBy, submittedRole, title, description } = req.body; 
        if (!submittedBy || !title || !description) {
            return res.status(400).json({ message: 'Missing required fields for ticket submission.' });
        }
        const newTicket = await Ticket.create({ submittedBy, submittedRole: submittedRole || 'student', title, description });
        res.status(201).json({ message: 'IT ticket submitted successfully.', ticket: newTicket });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting ticket.', error });
    }
});

app.get('/api/appointments/:teacherUsername', isTeacher, async (req, res) => {
    try {
        const { teacherUsername } = req.params;
        const appointments = await Appointment.find({ teacherUsername, status: { $ne: 'Completed' } }).sort({ date: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointments.', error });
    }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const { studentId, studentName, teacherUsername, date, topic } = req.body;
        const newAppointment = await Appointment.create({ studentId, studentName, teacherUsername, date, topic });
        res.status(201).json({ message: 'Appointment booked successfully.', appointment: newAppointment });
    } catch (error) {
        res.status(500).json({ message: 'Error booking appointment.', error });
    }
});


// --- MARKS, ATTENDANCE, TIMETABLE ENDPOINTS ---

app.post('/api/marks/entry', isTeacher, async (req, res) => { 
    const { studentId, course, examType, score, maxScore } = req.body;
    try {
        // FIX: Ensure studentId is not CLASS_AVG when adding a specific student mark
        if (studentId === 'CLASS_AVG') {
             return res.status(400).json({ message: 'Cannot set individual mark for CLASS_AVG identifier.' });
        }
        const mark = await Mark.findOneAndUpdate(
            { studentId, course, examType },
            { score, maxScore },
            { new: true, upsert: true }
        );
        res.status(201).json({ message: 'Mark recorded successfully.', mark });
    } catch (error) {
        res.status(400).json({ message: 'Error recording mark', error: error.message });
    }
});

app.get('/api/analytics/marks/:studentId', async (req, res) => { 
    try {
        const studentId = req.params.studentId;
        const marksData = await Mark.find({ $or: [{ studentId }, { studentId: 'CLASS_AVG' }] }).sort({ course: 1, examType: 1 });

        const studentScores = {};
        const classAverages = {};

        marksData.forEach(mark => {
            if (mark.studentId === studentId) {
                if (!studentScores[mark.course]) studentScores[mark.course] = [];
                studentScores[mark.course].push(mark);
            } else if (mark.studentId === 'CLASS_AVG') {
                if (!classAverages[mark.course]) classAverages[mark.course] = {};
                classAverages[mark.course][mark.examType] = mark.score;
            }
        });
        
        res.json({ studentScores, classAverages });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching marks analytics', error });
    }
});

app.post('/api/attendance/log', isTeacher, async (req, res) => {
    const { studentId, course, date, status } = req.body;
    try {
        const student = await User.findOne({ studentId, role: 'student' });
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        // FIX: Search for existing attendance record for the day/course before logging
        const existingAttendance = await Attendance.findOne({
            studentId,
            course,
            date: { 
                $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
            }
        });
        
        if (existingAttendance) {
            return res.status(409).json({ message: 'Attendance already logged for this student and course on this date.' });
        }

        const newAttendance = new Attendance({ 
            studentId, 
            course, 
            date: new Date(date), 
            status 
        });
        await newAttendance.save();
        res.status(201).json({ message: 'Attendance logged successfully.' });
    } catch (error) {
        res.status(400).json({ message: 'Error logging attendance', error: error.message });
    }
});

app.get('/api/attendance/summary/:studentId', async (req, res) => { 
    try {
        const studentId = req.params.studentId;

        const summary = await Attendance.aggregate([
            { $match: { studentId: studentId } },
            { $group: {
                _id: '$course',
                totalClasses: { $sum: 1 },
                presentCount: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
            }},
            { $project: {
                _id: 0, course: '$_id', totalClasses: 1, presentCount: 1,
                percentage: { $multiply: [{ $divide: ['$presentCount', '$totalClasses'] }, 100] }
            }}
        ]);
        
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: 'Error calculating attendance summary.', error: error.message });
    }
});

app.get('/api/attendance/:studentId/:date', async (req, res) => { 
    try {
        const { studentId, date } = req.params;
        const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
        
        const records = await Attendance.find({ 
            studentId, 
            date: { $gte: startOfDay, $lt: endOfDay }
        }).sort({ date: 1 });
        
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance by date', error });
    }
});

app.post('/api/timetable', isTeacher, async (req, res) => {
    const { course, day, startTime, endTime, teacherUsername } = req.body;
    try {
        const teacher = await User.findOne({ username: teacherUsername, role: { $in: ['teacher', 'admin'] } });
        if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

        const newSlot = new Timetable({ course, day, startTime, endTime, teacherUsername });
        await newSlot.save();
        res.status(201).json({ message: 'Timetable slot created successfully.', slot: newSlot });
    } catch (error) {
        res.status(400).json({ message: 'Error adding timetable slot', error: error.message });
    }
});

// FIX: CORRECTED ENDPOINT for student timetable access.
app.get('/api/timetable/:userRole/:username', async (req, res) => { 
    try {
        const { userRole, username } = req.params;
        let query = {};
        
        if (userRole === 'teacher' || userRole === 'admin') {
            query = { teacherUsername: username }; 
        } else if (userRole === 'student') {
            const student = await User.findOne({ username });
            
            // 1. CRITICAL FIX: Ensure student user is found and has a studentId
            if (!student || !student.studentId) {
                // Return empty schedule if student user not fully set up
                return res.json([]); 
            }
            
            const studentId = student.studentId;
            // 2. Fetch ALL courses the student is *ENROLLED* OR *WAITLISTED* in.
            const relatedCourses = await Course.find({ 
                $or: [
                    { enrolledStudents: studentId },
                    { waitlistStudents: studentId } // Also include waitlisted courses for visibility
                ]
            }).select('courseCode');
            
            const courseCodes = relatedCourses.map(c => c.courseCode);
            
            // 3. Return empty array if student is not in any course
            if (courseCodes.length === 0) {
                 return res.json([]);
            }

            // 4. Query Timetable for all relevant course codes
            query = { course: { $in: courseCodes } };
        } else {
            return res.status(403).json({ message: 'Unauthorized role for timetable access.' });
        }
        
        const schedule = await Timetable.find(query).sort({ day: 1, startTime: 1 });
        res.json(schedule);
    } catch (error) {
        console.error('Timetable fetch failed:', error.message);
        res.status(500).json({ message: 'Error fetching schedule', error });
    }
});


// --- ANNOUNCEMENTS ENDPOINTS ---
app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find({}).sort({ date: -1 }).limit(10);
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements', error });
    }
});

app.post('/api/announcements', isTeacher, async (req, res) => { 
    const { title, content, postedBy, targetRole } = req.body;
    try {
        if (!title || !content || !postedBy || !targetRole) {
            return res.status(400).json({ message: 'Missing announcement title, content, postedBy, or targetRole.' });
        }

        const newAnnouncement = new Announcement({ title, content, postedBy, targetRole });
        await newAnnouncement.save();
        res.status(201).json({ message: 'Announcement posted successfully!', announcement: newAnnouncement });
    } catch (error) {
        res.status(500).json({ message: 'Error posting announcement.', error: error.message });
    }
});

app.put('/api/announcements/:id', isTeacher, async (req, res) => { 
    try {
        const { title, content, targetRole } = req.body;
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            req.params.id,
            { title, content, targetRole, date: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedAnnouncement) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }
        res.json({ message: 'Announcement updated successfully.', announcement: updatedAnnouncement });
    } catch (error) {
        res.status(500).json({ message: 'Error updating announcement.', error: error.message });
    }
});

app.delete('/api/announcements/:id', isTeacher, async (req, res) => { 
    try {
        const deletedAnnouncement = await Announcement.findByIdAndDelete(req.params.id);

        if (!deletedAnnouncement) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }
        res.json({ message: 'Announcement deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting announcement.', error: error.message });
    }
});


// --- STUDENT COURSE ENDPOINTS ---
// FIX: Corrected aggregation pipeline for robustness and added counts.
app.get('/api/courses/all', async (req, res) => {
    try {
        const courses = await Course.aggregate([
            {
                // 1. Join Course with User to get teacher details
                $lookup: {
                    from: 'users',
                    localField: 'teacherUsername',
                    foreignField: 'username',
                    as: 'teacherDetails'
                }
            },
            {
                // 2. Unwind the teacherDetails array (safe to use as-is if teacherUsername is always present)
                $unwind: { path: '$teacherDetails', preserveNullAndEmptyArrays: true }
            },
            {
                // 3. Project the final data structure
                $project: {
                    _id: 1,
                    courseCode: 1,
                    title: 1,
                    maxSeats: 1,
                    enrolledCount: { $size: "$enrolledStudents" }, // Useful for frontend
                    waitlistCount: { $size: "$waitlistStudents" }, // Useful for frontend
                    teacherUsername: 1,
                    
                    // FIX: Use $ifNull for robust handling of teacherName if lookup fails
                    teacherName: { $ifNull: ['$teacherDetails.name', 'Unassigned Teacher'] },
                    
                    // Keep the lists of student IDs for student-side enrollment checks
                    enrolledStudents: 1, 
                    waitlistStudents: 1
                }
            }
        ]);
        res.json(courses);
    } catch (error) {
        console.error("Error fetching course list:", error.message);
        res.status(500).json({ message: 'Error fetching course list.', error: error.message });
    }
});

// FIX: New endpoint for teachers to easily fetch only the courses they teach.
app.get('/api/courses/my-courses', isTeacher, async (req, res) => {
    const teacherUsername = req.headers['x-user-username'];
    
    if (!teacherUsername) {
        return res.status(401).json({ message: 'Teacher username header missing.' });
    }
    
    try {
        const courses = await Course.find({ teacherUsername: teacherUsername });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses taught by this user.', error: error.message });
    }
});


// 7. SERVE FRONTEND FILE - Final Catch-All Route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// 8. START SERVER
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('Frontend served from index.html');
});