const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const sequelize = require('./db'); // Import the sequelize instance

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');

// Routes

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/views/register.html');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const query = `INSERT INTO "Users" ("username", "password", "createdAt", "updatedAt") VALUES ('${username}', '${password}', NOW(), NOW())`;
  
  try {
    await sequelize.query(query);
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

app.get('/forum', async (req, res) => {
  const user_id = req.query.user_id;
  const query = `
    SELECT "Posts"."id", "Posts"."user_id", "Posts"."content", "Posts"."timestamp", "Users"."username"
    FROM "Posts"
    INNER JOIN "Users" ON "Posts"."user_id" = "Users"."id"
  `;

  try {
    const [posts, metadata] = await sequelize.query(query);
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
  const query = `INSERT INTO "Posts" ("user_id", "content", "timestamp") VALUES (${user_id}, '${content}', NOW())`;

  try {
    await sequelize.query(query);
    res.redirect(`/forum?user_id=${user_id}`);
  } catch (err) {
    console.error('Error creating post:', err.message);
    res.redirect(`/forum?user_id=${user_id}`);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
