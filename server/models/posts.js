module.exports = (sequelize, DataTypes) => {
  const posts = sequelize.define("posts", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  posts.associate = (models) => {
    posts.hasMany(models.comments, {
      foreignKey: "postId",
      as: "comments",
      onDelete: "CASCADE",
    });
    posts.hasMany(models.likes, {
      foreignKey: "postId",
      as: "likes",
      onDelete: "CASCADE",
    });
  };

  return posts;
};
