// src/components/Contact.jsx
import React, { useRef } from "react";
import emailjs from "@emailjs/browser";
import "../assets/CSS/contact.css";

const Contact = () => {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_p37grty",
        "template_rumfqwd",
        form.current,
        "mz16gY_3yH00sOE6w"
      )
      .then(
        (result) => {
          alert("Message sent successfully!");
          form.current.reset();
        },
        (error) => {
          alert("Oops! Something went wrong. Please try again.");
          console.error(error);
        }
      );
  };

  return (
    <section id="contact" className="contact-section">
      <h2>Contact Me</h2>
      <form ref={form} onSubmit={sendEmail} className="contact-form">
        <input type="text" name="name" placeholder="Your Name" required />
        <input type="email" name="email" placeholder="Your Email" required />
        <textarea
          name="message"
          placeholder="Your Message"
          required
          rows="5"
        ></textarea>
        <button type="submit">Send Email</button>
      </form>
      <footer className="footer">
        <p>© 2025 Ziad Ahmed Matar | V1.0 | All rights reserved.</p>
      </footer>
    </section>
  );
};

export default Contact;
