module.exports = (sequelize, DataTypes) => {
  const likes = sequelize.define(
    "likes",
    {
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["postId", "userId"], // Composite unique index
        },
      ],
    }
  );

  // define associations
  likes.associate = (models) => {
    likes.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    likes.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  return likes;
};
