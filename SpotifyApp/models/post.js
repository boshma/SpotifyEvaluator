//models/post.js

module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    content: DataTypes.TEXT,
    timestamp: DataTypes.DATE,
  });

  Post.associate = function(models) {
    Post.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'author',
    });
    Post.belongsTo(models.Thread);
  };

  return Post;
};
