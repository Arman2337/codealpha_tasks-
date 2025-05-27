import React from 'react';
import { Container } from 'react-bootstrap';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">ProjectHub</h5>
            <small className="text-muted">© 2024 All rights reserved</small>
          </div>
          <div className="d-flex gap-3">
            <a href="#" className="text-light">
              <FaGithub size={20} />
            </a>
            <a href="#" className="text-light">
              <FaLinkedin size={20} />
            </a>
            <a href="#" className="text-light">
              <FaTwitter size={20} />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer; 