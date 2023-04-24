module.exports = (sequelize, DataTypes) => {
  const SpotifyData = sequelize.define('SpotifyData', {
    topArtists: DataTypes.TEXT, // Use TEXT or VARCHAR as column type
    topSongs: DataTypes.TEXT, // Use TEXT or VARCHAR as column type
    topGenres: DataTypes.TEXT, // Use TEXT or VARCHAR as column type
    listeningHistory: DataTypes.TEXT
  });

  SpotifyData.associate = function(models) {
    SpotifyData.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return SpotifyData;
};
