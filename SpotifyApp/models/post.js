//models/post.js

module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    content: DataTypes.TEXT,
    timestamp: DataTypes.DATE,
  });

  Post.associate = function(models) {
    Post.belongsTo(models.User, {
      foreignKey: {
        name: 'spotifyId',
        allowNull: false,
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
      as: 'author',
    });
    Post.belongsTo(models.Thread, {
      foreignKey: {
        name: 'ThreadId',
        allowNull: false,
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Post;
};




