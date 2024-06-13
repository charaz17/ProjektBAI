const { sequelize, DataTypes } = require('../db');
const User = require('./user');

const Post = sequelize.define('Post', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
}, {
  timestamps: false,
});

Post.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Post;
