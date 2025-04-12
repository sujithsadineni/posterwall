import React from "react";
import { Button, Form, Input } from "antd";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

function CreatePost() {
  const [form] = Form.useForm();
  const { token } = useAuth();

  // Decode token once and reuse
  const decodedUser = token ? jwtDecode(token) : null;

  const onFinish = async (values) => {
    if (!decodedUser) {
      alert("Please login to create a post!");
      return;
    }

    const postData = {
      title: values.title,
      content: values.content,
      userId: decodedUser.id,
      author: decodedUser.username,
    };

    try {
      const response = await axios.post(
        "http://localhost:4000/api/posts",
        postData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ Post created:", response.data);
      alert(`${decodedUser.username} created a post successfully!`);
      form.resetFields();
    } catch (error) {
      console.error("❌ Post creation failed:", error);
      alert(error.response?.data?.message || "Post creation failed!");
    }
  };

  return (
    <Form
      form={form}
      name="wrap"
      layout="vertical"
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        padding: "2rem",
        fontSize: "1.2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(18, 17, 17, 0.58)",
      }}
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="Title"
        name="title"
        rules={[{ required: true, message: "Please input your Title!" }]}
      >
        <Input placeholder="Enter post title" />
      </Form.Item>

      <Form.Item
        label="Content"
        name="content"
        rules={[{ required: true, message: "Please input Content!" }]}
      >
        <Input.TextArea placeholder="Enter post content" rows={4} />
      </Form.Item>

      <Form.Item label="" wrapperCol={{ align: "center" }}>
        <Button type="primary" htmlType="submit">
          Create Post
        </Button>
      </Form.Item>
    </Form>
  );
}

export default CreatePost;
