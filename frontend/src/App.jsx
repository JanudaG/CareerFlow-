import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JobSeeker from "./pages/JobSeeker";
import Company from "./pages/Company";

export default function App() {
  return <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/job-seeker" element={<ProtectedRoute role="jobseeker"><JobSeeker /></ProtectedRoute>} />
      <Route path="/company" element={<ProtectedRoute role="employer"><Company /></ProtectedRoute>} />
      <Route path="*" element={<main style={{padding:40}}>Page not found</main>} />
    </Routes>
  </BrowserRouter>;
}
