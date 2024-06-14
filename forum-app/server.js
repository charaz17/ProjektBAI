const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { sequelize, User, Post } = require('./db'); // Import the sequelize instance and models
const { QueryTypes } = require('sequelize');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');

// Middleware to set userId in locals for all routes
app.use((req, res, next) => {
  res.locals.userId = req.session.user ? req.session.user.id : null;
  next();
});

// Routes

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/views/register.html');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.create({ username, password });
    res.render('message', { message: 'Account created successfully, you can login now.' });
  } catch (err) {
    console.error('Error inserting user:', err.message);
    res.render('message', { message: 'Failed to create account. ' + err.message });
  }
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

//VULNERABLE
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT "id", "username", "password", "createdAt", "updatedAt" FROM "Users" WHERE "username" = '${username}' AND "password" = '${password}'`;

  try {
    const [results, metadata] = await sequelize.query(query);
    const user = results[0];
    if (user) {
      res.redirect(`/forum?user_id=${user.id}`);
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Error logging in:', err.message);
    res.redirect('/login');
  }
});

//SECURE
// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   sanitized_username = username;
//   sanitized_password = password;
//   sanitized_username = sanitized_username.replace(/'/g, "").replace(/-/g, "");
//   sanitized_password = sanitized_password.replace(/'/g, "").replace(/-/g, "");
//   const query = `SELECT "id", "username", "password", "createdAt", "updatedAt" FROM "Users" WHERE "username" = '${sanitized_username}' AND "password" = '${sanitized_password}'`;

//   try {
//     const [results, metadata] = await sequelize.query(query);
//     const user = results[0];
//     if (user) {
//       res.redirect(`/forum?user_id=${user.id}`);
//     } else {
//       res.redirect('/login');
//     }
//   } catch (err) {
//     console.error('Error logging in:', err.message);
//     res.redirect('/login');
//   }
// });



app.get('/forum', async (req, res) => {
  const user_id = req.query.user_id;
  try {
    const posts = await Post.findAll({
      include: [{ model: User, attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });

    res.render('forum', { posts, user_id });
  } catch (err) {
    console.error('Error fetching posts:', err.message);
    res.render('forum', { posts: [], user_id });
  }
});

app.get('/post', (req, res) => {
  const user_id = req.query.user_id;
  res.render('post', { user_id });
});

app.post('/post', async (req, res) => {
  const { user_id, content } = req.body;
  try {
    await Post.create({ user_id, content });
    res.redirect(`/forum?user_id=${user_id}`);
  } catch (err) {
    console.error('Error creating post:', err.message);
    res.redirect(`/forum?user_id=${user_id}`);
  }
});

// CSRF Attack route
app.get('/csrf_attack', (req, res) => {
  try {
    const userId = req.session.user ? req.session.user.id : null;
    res.render('csrf_attack', { userId });
  } catch (err) {
    console.error('Error rendering CSRF attack page:', err);
    res.status(500).send('Internal Server Error');
  }
});



// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
