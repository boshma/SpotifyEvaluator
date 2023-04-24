//models/surveyResponse.js
module.exports = (sequelize, DataTypes) => {
    const SurveyResponse = sequelize.define('SurveyResponse', {
      user: DataTypes.STRING,
      question1: DataTypes.INTEGER,
      question2: DataTypes.INTEGER,
      question3: DataTypes.INTEGER,
    });
  
    
  
    return SurveyResponse;
  };
  
  