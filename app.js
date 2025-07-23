//////////////////////////////////////////////////
// Initialize modules
//////////////////////////////////////////////////

const express = require('express');
const app = express();
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');

// Set up view engine
app.set('view engine', 'ejs');
//  enable flash messages
app.use(flash());
//  enable static files
app.use(express.static('public'));
// enable form processing
app.use(express.urlencoded({
    extended: false
}));

const validAdminCodes = ['ABCD1234'];

// Setup MySQL connection
const connection = mysql.createConnection({
    host: 'c237-boss.mysql.database.azure.com',
    user: 'c237boss',
    password: 'c237boss!',
    database: 'c237_005_teamfive'
  });

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});


//////////////////////////////////////////////////
//  Register LogIn Modules (by Roshuko)
//////////////////////////////////////////////////

app.use(session({
    secret: 'c237team5', // secret key for session, used for signing the session ID cookie
    resave: false,       // don't save session if unmodified
    saveUninitialized: true,   // save uninitialized session
    cookie: {maxAge : 1000 * 60 * 60 * 12} // last number indicate number of hours session will last
}))

const validateRegistration = (req, res, next) => {
    const { username, email, password, address, contact, authCode } = req.body;

    if (!username || !email || !password || !address || !contact) {
        return res.status(400).send('All fields are required.');
    }   

    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long.');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};

// Checking if user is logged in
const checkAuth = (req, res, next) => {
    if (req.session.user) {
        return next(); // Proceed to the next whatever if session exists (logged in)
    }
    else {
        req.flash('Error', 'You need to log in first.');
        return res.redirect('/login'); // Redirect to login if session does not exist (not logged in)
    }
};

// Check if user is admin
const checkAdmin = (req, res, next) => {
    if (req.session.user.role === 'admin') {
        return next(); // User is admin, let them proceed
    }
    else {
        req.flash('Error', 'Access Denied');
        return res.redirect('/index'); // User is not admin, redirect to home
    }
};



//////////////////////////////////////////////////
//  Routes
//////////////////////////////////////////////////

// Route to Index
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success')});
});

// Route to Register
app.get('/register', (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
}); 

// Route to Login
app.get('/login', (req, res) => {
    res.render('login', { messages: req.flash('error') });
});

// Route to Dashboard (protected)
app.get('/dashboard', checkAuth, (req, res) => {
    res.render('dashboard', {
        user: req.session.user,
    });
});

//////////////////////////////////////////////////
//  POST Routes
//////////////////////////////////////////////////

app.post('/register', validateRegistration, (req, res) => {
    const { username, email, password, address, contact, role, authCode } = req.body;

    // If role is admin, validate the auth code
    if (role === 'admin') {
        if (!validAdminCodes.includes(authCode)) {
            req.flash('error', 'Invalid admin authorization code.');
            return res.redirect('/register');
        }
    }

    const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';
    db.query(sql, [username, email, password, address, contact, role], (err, result) => {
        if (err) {
            throw err;
        }
        console.log(result);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});

//////////////////////////////////////////////////
//  Initialize hosting 
//////////////////////////////////////////////////
const PORT = process.env.PORT || 3000;
// Listen and print port to console
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));