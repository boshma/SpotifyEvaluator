//models/thread.js
module.exports = (sequelize, DataTypes) => {
  const Thread = sequelize.define('Thread', {
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    timestamp: DataTypes.DATE,
  });

  Thread.associate = function(models) {
    Thread.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
      as: 'author',
    });
    Thread.hasMany(models.Post);
  };

  return Thread;
};


