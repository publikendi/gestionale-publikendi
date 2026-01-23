const express = require('express');
const path = require('path');
const http = require('http');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const upload = require('express-fileupload');

const route = require('./routes/route');
const loadSalesforceUser = require('./middleware/loadSalesforceUser');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// BODY
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// FILE UPLOAD
app.use(upload({
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// SESSION
app.use(cookieParser());
app.use(session({
  name: 'publikendi.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

// VIEWS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'partials/layout-vertical');
app.use(expressLayouts);

// STATIC
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES
app.use('/', loadSalesforceUser, route);

// SERVER
const server = http.createServer(app);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});