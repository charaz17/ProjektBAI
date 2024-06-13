// db.js

const { Sequelize, DataTypes } = require('sequelize');

// Create a new Sequelize instance
const sequelize = new Sequelize('forum_app', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
  logging: console.log, // Enable logging
});

// Define the User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensure username is unique
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Define the Post model
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

// Define associations
User.hasMany(Post, { foreignKey: 'user_id' });
Post.belongsTo(User, { foreignKey: 'user_id' });

// Synchronize models with the database
sequelize.sync();

module.exports = { sequelize, User, Post };
