import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/AllPosts.css";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

function YourPosts() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { token } = useAuth();
  const decoded = token ? jwtDecode(token) : null;

  // fetch posts by user id
  useEffect(() => {
    if (!decoded?.id) return; // Guard: wait for decoded token

    axios
      .get(`http://localhost:4000/api/posts/user/${decoded.id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Optional but good to secure
        },
      })
      .then((response) => {
        setPosts(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the posts!", error);
      });
  }, [decoded?.id, token]);

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
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/home/post/${post.id}`);
              }}
            >
              🩷 {post.likesCount || 0}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/home/post/${post.id}`);
              }}
            >
              💬 {post.commentsCount || 0}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default YourPosts;
