import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaProjectDiagram, FaUsers, FaTasks, FaComments } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="bg-light min-vh-100">
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4 fw-bold mb-4">
                Manage Your Projects with Ease
              </h1>
              <p className="lead mb-4">
                A social media-inspired project management tool that helps teams collaborate,
                communicate, and complete projects efficiently.
              </p>
              <Button
                as={Link}
                to="/register"
                variant="light"
                size="lg"
                className="me-3"
              >
                Get Started
              </Button>
              <Button
                as={Link}
                to="/login"
                variant="outline-light"
                size="lg"
              >
                Login
              </Button>
            </Col>
            <Col md={6} className="d-none d-md-block">
              <img
                src="/hero-image.png"
                alt="Project Management"
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Key Features</h2>
        <Row className="g-4">
          <Col md={3}>
            <div className="text-center p-4">
              <FaProjectDiagram size={48} className="text-primary mb-3" />
              <h4>Project Management</h4>
              <p className="text-muted">
                Create and manage projects with ease. Track progress and deadlines effectively.
              </p>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center p-4">
              <FaUsers size={48} className="text-primary mb-3" />
              <h4>Team Collaboration</h4>
              <p className="text-muted">
                Work together seamlessly with your team members in real-time.
              </p>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center p-4">
              <FaTasks size={48} className="text-primary mb-3" />
              <h4>Task Management</h4>
              <p className="text-muted">
                Assign and track tasks. Set priorities and deadlines for better organization.
              </p>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center p-4">
              <FaComments size={48} className="text-primary mb-3" />
              <h4>Communication</h4>
              <p className="text-muted">
                Built-in messaging and commenting system for seamless communication.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home; 