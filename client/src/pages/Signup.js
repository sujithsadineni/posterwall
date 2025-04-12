import React from "react";
import { Form, Input } from "antd";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  // create user
  const onFinish = async (values) => {
    try {
      // check if user already exists
      await axios
        .post("http://localhost:4000/api/users/signup", values)
        .then(() => {
          console.log(" ✔️ User created successfully:");
          form.resetFields();
        })
        .catch((error) => {
          if (error.response && error.response.data) {
            console.error("❌ Signup Failed", error.response.data.message);
            alert(error.response.data.message);
          } else {
            console.error("There was an error creating the user!", error);
            alert("There was an error creating the user!");
          }
        });
      // Auto login after signup
      const loginResponse = await axios.post(
        "http://localhost:4000/api/users/login",
        values
      );
      const { token } = loginResponse.data;
      const user = loginResponse.data.user;
      console.log("✔️ User logged in successfully:");
      login(token, user);
      navigate("/home");
    } catch (error) {
      console.error("❌ Login Failed", error.response.data.message);
      alert(error.response.data.message);
    }
  };

  return (
    <Form
      form={form}
      name="wrap"
      layout="vertical"
      style={{
        maxWidth: 500,
        margin: "2rem auto", // center form horizontally
        padding: "2rem",
        fontSize: "1.2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(18, 17, 17, 0.58)",
      }}
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: "Please input your username!" }]}
      >
        <Input placeholder="Enter username" />
      </Form.Item>

      {/* <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
          <Input placeholder="Enter email" rows={2} />
        </Form.Item> */}

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password placeholder="Enter password" />
      </Form.Item>

      {/* <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
          <Checkbox>Remember me</Checkbox>
        </Form.Item> */}

      <Form.Item label="" wrapperCol={{ align: "center" }}>
        <button type="primary" htmlType="submit">
          Signup for Post.com
        </button>
      </Form.Item>
    </Form>
  );
}

export default Signup;
