// server.js

const express = require('express');
const bodyParser = require('body-parser');
const { sequelize, User, Post } = require('./db');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/views/register.html');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    await User.create({ username, password });
    res.render('message', { message: 'Account created successfully, you can login now.' });
  } catch (err) {
    console.error('Error inserting user:', err.message);
    res.render('message', { message: 'Failed to create account. ' + err.message });
  }
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username, password } });
    if (user) {
      res.redirect(`/forum?user_id=${user.id}`);
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Error logging in:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/forum', async (req, res) => {
  const user_id = req.query.user_id;
  try {
    const posts = await Post.findAll({ include: User });
    res.render('forum', { posts, user_id });
  } catch (err) {
    console.error('Error fetching posts:', err.message);
    res.status(500).send('Internal Server Error');
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
    res.status(500).send('Failed to create post.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
