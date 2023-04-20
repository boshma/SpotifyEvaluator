//models/user.js

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    spotifyId: DataTypes.STRING,
    displayName: DataTypes.STRING,
    email: DataTypes.STRING,
    profileImage: DataTypes.STRING,
  });

  User.associate = function(models) {
    User.hasMany(models.Thread);
    User.hasMany(models.Post);
  };

  return User;
};
