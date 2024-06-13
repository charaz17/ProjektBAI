const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
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

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
    if (err) return console.error(err.message);
    res.render('message.ejs', { message: 'Account created successfully, you can login now.' });
  });
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (err) return console.error(err.message);
    if (row) {
      res.redirect(`/forum?user_id=${row.id}`);
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/forum', (req, res) => {
  const user_id = req.query.user_id;
  db.all(`SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id`, (err, rows) => {
    if (err) return console.error(err.message);
    res.render('forum.ejs', { posts: rows, user_id: user_id });
  });
});

app.get('/post', (req, res) => {
  const user_id = req.query.user_id;
  res.render('post.ejs', { user_id: user_id });
});

app.post('/post', (req, res) => {
  const { user_id, content } = req.body;
  db.run(`INSERT INTO posts (user_id, content) VALUES (?, ?)`, [user_id, content], function(err) {
    if (err) return console.error(err.message);
    res.redirect(`/forum?user_id=${user_id}`);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
