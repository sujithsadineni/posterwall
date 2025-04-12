module.exports = (sequelize, DataTypes) => {
  const comments = sequelize.define("comments", {
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  // define associations
  comments.associate = (models) => {
    comments.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    comments.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  return comments;
};
