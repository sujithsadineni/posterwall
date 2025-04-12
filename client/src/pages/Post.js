import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Form, Input } from "antd";
import axios from "axios";
import "../App.css";
import "../css/AllPosts.css";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

function Post() {
  const { id } = useParams();
  const [post, setPost] = useState({});
  const [comments, setComments] = useState([]);
  const [form] = Form.useForm();
  const { token } = useAuth();
  const decoded = token ? jwtDecode(token) : null;

  // Fetch post by ID
  useEffect(() => {
    axios
      .get(`http://localhost:4000/api/posts/post/${id}`)
      .then((response) => {
        setPost(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the post!", error);
      });
  }, [id]);

  // Fetch comments for the post
  useEffect(() => {
    axios
      .get(`http://localhost:4000/api/comments/${id}`)
      .then((response) => {
        setComments(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching comments!", error);
      });
  }, [id]);

  // Submit a new comment
  const onFinish = (values) => {
    axios
      .post(
        "http://localhost:4000/api/comments",
        {
          postId: id,
          comment: values.comment,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      )
      .then((response) => {
        setComments([...comments, response.data]);
        form.resetFields();
      })
      .catch((error) => {
        console.error("There was an error creating the comment!", error);
        alert(error.response?.data?.message || "Something went wrong");
      });
  };

  // Delete a comment
  const deleteComment = (commentId) => {
    axios
      .delete(`http://localhost:4000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(() => {
        setComments(comments.filter((comment) => comment.id !== commentId));
      })
      .catch((error) => {
        console.error("There was an error deleting the comment!", error);
      });
  };

  return (
    <div>
      <div className="card">
        <div className="title">{post.title}</div>
        <div>{post.content}</div>
        <div className="author">{post.author}</div>
      </div>

      {/* Add comment form */}
      <div>
        <Form
          form={form}
          name="wrap"
          layout="vertical"
          style={{
            maxWidth: 300,
            margin: "0.5rem auto",
            padding: "1rem",
            fontSize: "1.2rem",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(231, 0, 0, 0.58)",
          }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Enter Your Comment"
            name="comment"
            rules={[{ required: true, message: "Please enter comment!" }]}
          >
            <Input.TextArea placeholder="Enter post comment" rows={4} />
          </Form.Item>

          <Form.Item label="" wrapperCol={{ align: "center" }}>
            <Button type="primary" htmlType="submit">
              Add Comment
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* Comments Section */}
      <h2>Comments</h2>
      <div>
        {comments.map((comment) => (
          <div className="card" key={comment.id}>
            <div>{comment.comment}</div>
            <p></p>
            <div>{"@" + comment.username}</div>
            <p></p>
            {decoded?.username === comment.username && (
              <Button
                className="default"
                onClick={() => deleteComment(comment.id)}
              >
                ❌
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Post;
