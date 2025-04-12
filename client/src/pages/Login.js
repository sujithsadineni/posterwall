import React from "react";
import { Checkbox, Form, Input } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  // login user
  const onFinish = (values) => {
    axios
      .post("http://localhost:4000/api/users/login", values)
      .then((response) => {
        console.log("✔️", response.data.message);
        login(response.data.token);
        // localStorage.setItem("token", response.data.token);
        // alert(values.username + " logged in successfully !");
        // console.log("🔐 Token being sent:", localStorage.getItem("token"));
        form.resetFields();
        // redirect to home page
        navigate("/home");
      })
      .catch((error) => {
        if (error.response && error.response.data) {
          console.error("❌ login Failed", error.response.data.message);
          alert(error.response.data.message);
        } else {
          console.error("There was an error during user login !", error);
          alert("There was an error during user login !");
        }
      });
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
        <Input placeholder="Enter username" rows={2} />
      </Form.Item>

      {/* <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
          <Input placeholder="Enter email" rows={2} />
        </Form.Item> */}

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password placeholder="Enter password" rows={2} />
      </Form.Item>

      <Form.Item
        name="remember"
        valuePropName="checked"
        wrapperCol={{ offset: 8, span: 16 }}
      >
        <Checkbox>Remember me</Checkbox>
      </Form.Item>

      <Form.Item label="" wrapperCol={{ align: "center" }}>
        <button type="primary" htmlType="submit">
          Login 🚀
        </button>
      </Form.Item>
    </Form>
  );
}
export default Login;
