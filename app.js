const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const session = require('express-session');

const app = express();



// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://exclusiveshahzod:zh0YsqKsMMMJ2HCM@cluster0.p7nhdnz.mongodb.net/mydatabase')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: { type: Boolean, default: false },
  creationDate: { type: Date, default: Date.now },
  updateDate: { type: Date, default: Date.now },
  deletionDate: { type: Date, default: null }
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up express-session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route handler for the main page
app.get('/', (req, res) => {
  const user = req.session.user || null; // Get the authenticated user from the session
  res.render('index', { user }); // Pass the user object to the index template
});

// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;
    if (user.isAdmin) {
      res.redirect('/admin'); // Redirect to the admin page if the user is an admin
    } else {
      res.redirect('/welcome'); // Redirect to the welcome page for regular users
    }
  } else {
    res.send('Invalid username or password.');
  }
});

// Signup route
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const newUser = await User.create({ username, password: hashedPassword });
    req.session.user = newUser;
    res.redirect('/welcome'); // Redirect to the welcome page after successful registration
  } catch (error) {
    console.error(error);
    res.send('Error creating user.');
  }
});

// Main page route
app.get('/main', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    const user = req.session.user;
    res.render('main', { user });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Admin page route
app.get('/admin', async (req, res) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    res.redirect('/login');
  } else {
    try {
      const users = await User.find();
      res.render('admin', { users });
    } catch (error) {
      console.error(error);
      res.send('Error fetching users.');
    }
  }
});

// POST route for adding a user by admin
app.post('/admin', async (req, res) => {
  const { username, password, isAdmin } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    await User.create({ username, password: hashedPassword, isAdmin });
    res.redirect('/admin'); // Redirect to the admin page after successfully adding a user
  } catch (error) {
    console.error(error);
    res.send('Error creating user.');
  }
});

// POST route for removing a user by admin
app.post('/admin/remove', async (req, res) => {
  const userId = req.body.userId;

  try {
    // Delete the user from the database
    await User.findByIdAndDelete(userId);
    // Redirect back to the admin page
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.send('Error removing user.');
  }
});

// Login route for admin
app.get('/adminpage', (req, res) => {
  res.render('adminLogin'); // You need to create the adminLogin.ejs page
});

app.post('/adminpage', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && bcrypt.compareSync(password, user.password) && user.isAdmin) {
    req.session.user = user;
    res.redirect('/admin'); // Redirect to the admin page after successful login
  } else {
    res.send('Invalid username or password.');
  }
});

// Welcome page route
app.get('/welcome', (req, res) => {
  res.render('welcome'); 
});
//2api keys
app.get('/news', async (req, res) => {
  const theme = req.query.theme;
  const url  = `https://newsapi.org/v2/everything?q=${theme}&from=2024-01-12&sortBy=publishedAt&apiKey=535018e772fe41c586383c482e2e39c7`;
  const response = await axios.get(url);
  const articles = response.data.articles.slice(0,30);
  res.render('news',{articles});
});
app.get('/facts', async (req, res) => {
   const url = 'https://api.api-ninjas.com/v1/facts?limit=20';
    const response = await axios.get(url,{
      headers:{
        'X-Api-Key': 'sFqQ8nUjQGOmqCqY1NqUlQ==XycsoRYDFVs8ZIKi'
      }
    });
    const facts = response.data;
    res.render('facts',{facts});
});

app.listen(3000, () => console.log('Server started on port 3000'));
