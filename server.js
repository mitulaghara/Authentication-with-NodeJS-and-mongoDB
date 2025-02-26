// server.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');


const app = express();

// Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: 'fmax41309@gmail.com',
        pass: 'orif syze zxep anop',
    },
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auth-example', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // verified: { type: Boolean, default: false },
});

const User = mongoose.model('User ', UserSchema); // Fixed model name

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/auth-example' }),
}));

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

//home page
app.get('/home', (req, res) => {
    res.render('home', { user: req.session.user });
});


// Register
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, email });
        await user.save();

        // Send verification email (commented out for now)
        const verificationLink = `http://localhost:3000/verify/${user._id}`;
        await transporter.sendMail({
            to: email,
            subject: 'Verify your email',
            text: `Click this link to verify your email: ${verificationLink}`,
        });

        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.render('register', { error: 'Registration failed. Username or email may already be in use.' });
    }
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = user;
            res.redirect('/');
        } else {
            res.render('login', { error: 'Invalid username or password.' });
        }
    } catch (error) {
        console.error(error);
        res.render('login', { error: 'Login failed. Please try again.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});