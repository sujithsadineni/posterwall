import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import AllPosts from "./pages/AllPosts";
import Navbar from "./components/Navbar/Navbar";
import Post from "./pages/Post";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import YourPosts from "./pages/YourPosts";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/createpost" element={<CreatePost />} />
            <Route path="/allposts" element={<AllPosts />} />
            <Route path="/home/post/:id" element={<Post />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/YourPosts" element={<YourPosts />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
