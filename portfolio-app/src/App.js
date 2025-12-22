import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingpage";
import Experience from "./pages/experience";
import Education from "./pages/education";
import Projects from "./pages/projects";
import Courses from "./pages/courses";
import Skills from "./pages/skills";
import Navbar from "./components/navBar"; // if you already created a navbar
import Contact from "./components/contact"; // if you have a footer/contact section

function App() {
  return (
    <Router>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/education" element={<Education />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/skills" element={<Skills />} />
        </Routes>
      </div>
      <Contact />
    </Router>
  );
}

export default App;
