import React, { useState, useEffect } from "react";
import "../assets/CSS/landingpage.css";
import profilePhoto from "../assets/profile.jpg";
import cvFile from "../assets/Ziad_Ahmed_CV.pdf";

const LandingPage = () => {
  const sentences = [
    "Welcome to my Portfolio!",
    "Showcasing my projects and skills.",
    "Building scalable web applications.",
    "Expertise in DevOps, Cloud, and Full-Stack Development.",
    "Leveraging the MERN stack to create dynamic solutions.",
    "Streamlining infrastructure with automation.",
    "CI/CD pipelines for seamless development workflows.",
    "Passionate about clean, efficient, and maintainable code.",
    "Working with cloud platforms like AWS and Azure.",
    "Let's build the future of technology together.",
  ];

  const [currentSentence, setCurrentSentence] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [loopNum, setLoopNum] = useState(0);
  const [fadeClass, setFadeClass] = useState("fade-in");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (isTyping) {
      if (charIndex < sentences[loopNum].length) {
        const typingTimer = setTimeout(() => {
          setCurrentSentence((prev) => prev + sentences[loopNum][charIndex]);
          setCharIndex(charIndex + 1);
        }, 100);
        return () => clearTimeout(typingTimer);
      } else {
        setIsTyping(false);
        setTimeout(() => setFadeClass("fade-out"), 1000);
      }
    }
  }, [charIndex, isTyping, loopNum, sentences]);

  useEffect(() => {
    if (!isTyping && fadeClass === "fade-out") {
      const fadeTimer = setTimeout(() => {
        setCurrentSentence(" ");
        setFadeClass("fade-in");
        setIsTyping(true);
        setCharIndex(0);
        setLoopNum((prev) => (prev + 1) % sentences.length);
      }, 1000);
      return () => clearTimeout(fadeTimer);
    }
  }, [fadeClass, isTyping, sentences]);

  return (
    <div className="landing-page-container">
      <header className="header">
        <div className="profile-photo">
          <img src={profilePhoto} alt="Profile" className="profile-image" />
        </div>
      </header>
      <div className={`typing-effect ${fadeClass}`}>
        <h1>{currentSentence}</h1>
      </div>

      <section className="about-me-section">
        <h1>Hi, I'm Ziad Matar 👋</h1>
        <p>Junior DevOps Engineer & Full-Stack Developer</p>
        <p>
          I'm a computer science student in the AI department at Cairo
          University, with a deep passion for DevOps and Cloud technologies. I
          specialize in full-stack development, working primarily with the MERN
          stack. My focus is on building scalable, efficient web applications
          and automating infrastructure processes to help streamline operations.
        </p>
        <p>
          Throughout my academic and practical experience, I have developed
          skills in cloud computing, containerization, CI/CD pipelines, and
          working with tools such as Docker, Kubernetes, MongoDB, Express,
          React, and Node.js. I am also well-versed in working with version
          control systems like Git, and I'm continually exploring new tools and
          methods to improve my workflows.
        </p>
        <p>
          I am committed to writing clean, maintainable code and collaborating
          effectively within teams. I am always seeking new opportunities to
          grow my skills and contribute to the success of tech-driven projects
          and organizations.
        </p>

        <a href={cvFile} download>
          <button className="download-cv-btn">Download CV</button>
        </a>
      </section>
    </div>
  );
};

export default LandingPage;
