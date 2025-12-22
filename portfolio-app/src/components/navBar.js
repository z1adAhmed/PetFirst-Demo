import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../assets/CSS/navBar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleclick = (page) => {
    document.body.classList.add("fade-out");
    setTimeout(() => {
      navigate(page);
      setTimeout(() => {
        document.body.classList.remove("fade-out");
        document.body.classList.add("fade-in");
        setTimeout(() => {
          document.body.classList.add("visible");
        }, 100);
      }, 100);
    }, 1000);
    document.body.classList.remove("fade-in");
    document.body.classList.remove("visible");
  };
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Ziad Matar</Link>
      </div>

      <div
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={toggleMenu}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </div>

      <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <li>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleclick("/");
            }}
          >
            Home
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleclick("/experience");
            }}
          >
            Experience
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleclick("/education");
            }}
          >
            Education
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleclick("/projects");
            }}
          >
            Projects
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleclick("/courses");
            }}
          >
            Courses
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleclick("/skills");
            }}
          >
            Skills
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
