// models/post.js
module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    content: DataTypes.TEXT,
    timestamp: DataTypes.DATE,
    ReplyTo: DataTypes.INTEGER,
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
    Post.belongsTo(models.Post, {
      foreignKey: {
        name: 'ReplyTo',
        allowNull: true,
      },
      as: 'ReplyToPost',
    });
  };

  return Post;
};
