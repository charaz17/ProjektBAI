const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { sequelize, User, Post } = require('./db'); // Import the sequelize instance and models
const { QueryTypes } = require('sequelize');
const path = require('path');  // Import the path module
const fs = require('fs');




const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'tajne',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');

// Middleware to set userId in locals for all routes
app.use((req, res, next) => {
  res.locals.userId = req.session.user ? req.session.user.id : null;
 // res.locals.csrfToken = req.csrfToken(); // Make csrfToken available in all views
  next();
});


// CSRF SECURE
// const csrf = require('csurf');
// const csrfProtection = csrf({ cookie: true });
// app.use(csrfProtection);

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

//VULNERABLE LOGIN
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

//SECURE LOGIN
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
    // Ensure user_id is parsed as an integer
    const userId = parseInt(user_id);

    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
    }

    await Post.create({ user_id: userId, content });
    res.redirect(`/forum?user_id=${userId}`);
  } catch (err) {
    console.error('Error creating post:', err.message);
    res.redirect(`/forum?user_id=${user_id}`);
  }
});

// CSRF POST  VALIDATION
// app.post('/post', (req, res) => {
//   const { _csrf, user_id, content } = req.body;

//   // Verify CSRF token
//   if (!req.csrfToken() || req.csrfToken() !== _csrf) {
//     return res.status(403).send('Invalid CSRF token');
//   }

//   // Handle form submission logic
//   // Ensure user_id and content are properly handled

//   // Example: Insert post into database
//   Post.create({
//     user_id: user_id,
//     content: content
//   })
//     .then(post => {
//       console.log('Post created successfully:', post);
//       res.redirect('/forum'); // Redirect to forum page or wherever appropriate
//     })
//     .catch(err => {
//       console.error('Error creating post:', err);
//       res.status(500).send('Error creating post');
//     });
// });



// CSRF Attack route
app.get('/csrf_attack', (req, res) => {
  try {
    const userId = req.query.user_id; // Retrieve user_id from query parameter
    res.render('csrf_attack', { userId });
  } catch (err) {
    console.error('Error rendering CSRF attack page:', err);
    res.status(500).send('Internal Server Error');
  }
});

const { exec } = require('child_process');

const projectRoot = path.resolve(__dirname);

// Route for creating a batch file and running it
app.get('/command_injection', (req, res) => {
  const { filename, content } = req.query;

  if (!filename || !content) {
    return res.status(400).send('Filename and content are required.');
  }

  // Append .bat extension if not present
  const sanitizedFilename = filename.endsWith('.bat') ? filename : `${filename}.bat`;

  // Command for creating the batch file
  const createCommand = `echo ${content} > ${sanitizedFilename}`;

  exec(createCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating the file: ${error}`);
      res.status(500).send(`Error creating the file: ${error.message}`);
      return;
    }
    console.log(`File ${sanitizedFilename} created successfully`);
    res.send(`File ${sanitizedFilename} created successfully`);
  });
});

// Route for executing a program
app.get('/execute', (req, res) => {
  const { program } = req.query;

  if (!program) {
    return res.status(400).send('Error: No program specified');
  }

  // Resolve the full path of the program
  const programPath = path.resolve(program);

  // Check if the program path is within the project root directory
  if (programPath.startsWith(projectRoot)) {
    return res.status(400).send('Error: Access to project files is forbidden');
  }

  // Execute command to open specified program
  exec(`start ${program}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error opening ${program}: ${error}`);
      res.status(500).send(`Error opening ${program}: ${error.message}`);
      return;
    }
    console.log(`${program} opened successfully`);
    res.send(`${program} opened successfully`);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
