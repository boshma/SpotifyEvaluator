//models/surveyResponse.js
module.exports = (sequelize, DataTypes) => {
    const SurveyResponse = sequelize.define('SurveyResponse', {
      user: DataTypes.STRING,
      question1: DataTypes.STRING,
      question2: DataTypes.STRING,
      question3: DataTypes.STRING,
    });
  
    
  
    return SurveyResponse;
  };
  
  