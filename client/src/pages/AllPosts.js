import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/AllPosts.css";
import { useNavigate } from "react-router-dom";

function AllPosts() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);
  // Fetch posts from the server
  const fetchPosts = () => {
    axios
      .get("http://localhost:4000/api/posts")
      .then((response) => {
        setPosts(response.data);
      })
      .catch((error) => {
        console.error("There was an error!", error);
      });
  };
  // like a post
  const handleLike = (postId, e) => {
    e.stopPropagation(); // prevent navigation
    axios
      .post(
        "http://localhost:4000/api/likes",
        { postId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      .then((response) => {
        console.log(response.data.message);
        // update the like count locally
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likesCount:
                    response.data.message === "Post liked successfully."
                      ? (post.likesCount || 0) + 1
                      : (post.likesCount || 0) - 1,
                }
              : post
          )
        );
      })
      .catch((error) => {
        console.error("There was an error liking the post!", error);
        alert(error.response?.data?.message || "Post like failed");
      });
  };

  return (
    <div className="posts-container">
      {posts.map((post) => (
        <div
          className="post"
          key={post.id}
          onClick={() => navigate(`/home/post/${post.id}`)}
        >
          <div className="title">{post.title}</div>
          <div className="content">{post.content}</div>
          <div className="author">{post.author}</div>
          <div className="post-actions">
            <button onClick={(e) => handleLike(post.id, e)}>
              🩷 {post.likesCount || 0}
            </button>
            <button onClick={() => navigate(`/home/post/${post.id}`)}>
              💬 {post.commentsCount || 0}
            </button>
            {/* <button>🔗</button> */}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AllPosts;
