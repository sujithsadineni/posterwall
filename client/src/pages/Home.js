import React from "react";
import { Button } from "antd";
import "../css/AllPosts.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Home() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const decoded = token ? jwtDecode(token) : null;

  return (
    <div className="posts-container">
      {decoded ? (
        <>
          <h2
            style={{ width: "100%", textAlign: "center", marginBottom: "2rem" }}
          >
            Welcome to Posts.com
          </h2>

          <div className="card" onClick={() => navigate("/YourPosts")}>
            <h3>Your Posts</h3>
            <p>View and manage your contributions.</p>
            <Button type="primary">My Posts</Button>
          </div>

          <div className="card" onClick={() => navigate("/CreatePost")}>
            <h3>Create a New Post</h3>
            <p>Share your ideas and content with the community.</p>
            <Button type="primary">Create Post</Button>
          </div>

          <div className="card" onClick={() => navigate("/AllPosts")}>
            <h3>All Posts</h3>
            <p>Explore what others are talking about.</p>
            <Button type="primary">View Posts</Button>
          </div>

          <div className="card" onClick={() => navigate("/TrendingPosts")}>
            <h3>Trending Posts</h3>
            <p>Check out what’s hot and popular right now.</p>
            <Button type="primary">Trending</Button>
          </div>
        </>
      ) : (
        <div className="card">
          <h2
            style={{ width: "100%", textAlign: "center", marginBottom: "2rem" }}
          >
            Welcome to Posts.com
          </h2>
          <p>Please create a new account to get started.</p>
          <Button type="primary" onClick={() => navigate("/SignUp")}>
            Create Account
          </Button>
        </div>
      )}
    </div>
  );
}

export default Home;
