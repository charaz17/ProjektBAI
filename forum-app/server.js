const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const moment = require('moment');
const app = express();
const port = 3000;

const sequelize = new Sequelize('forum_app', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
  logging: console.log,
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Post = sequelize.define('Post', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
});

User.hasMany(Post, { foreignKey: 'user_id' });
Post.belongsTo(User, { foreignKey: 'user_id' });

sequelize.sync();

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

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  User.findOne({ where: { username, password } }).then(user => {
    if (user) {
      res.redirect(`/forum?user_id=${user.id}`);
    } else {
      res.redirect('/login');
    }
  }).catch(err => {
    console.error('Error logging in:', err.message);
    res.redirect('/login');
  });
});

app.get('/forum', async (req, res) => {
  const user_id = req.query.user_id;
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ['username']
      }
    });

    const formattedPosts = posts.map(post => {
      return {
        ...post.dataValues,
        username: post.User.username,
        formattedTimestamp: moment(post.timestamp).format('MMMM Do YYYY, h:mm:ss a')
      };
    });

    res.render('forum', { posts: formattedPosts, user_id });
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
