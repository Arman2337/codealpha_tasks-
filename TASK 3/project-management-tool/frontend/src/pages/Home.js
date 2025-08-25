import React, { useContext } from 'react'; // Import useContext
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaProjectDiagram, FaUsers, FaTasks, FaComments } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext'; // Import your AuthContext

const Home = () => {
  // Get the authentication status from the context
  const { isAuthenticated } = useContext(AuthContext);

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
              
              {/* --- CONDITIONAL BUTTONS START --- */}
              {isAuthenticated ? (
                // If user is logged in, show this button
                <Button
                  as={Link}
                  to="/dashboard"
                  variant="light"
                  size="lg"
                >
                  Go to Your Dashboard
                </Button>
              ) : (
                // If user is not logged in, show these buttons
                <>
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
                </>
              )}
              {/* --- CONDITIONAL BUTTONS END --- */}

            </Col>
            <Col md={6} className="d-none d-md-block">
              {/* --- NEW SVG ILLUSTRATION START --- */}
              <svg
                viewBox="0 0 200 120"
                xmlns="http://www.w3.org/2000/svg"
                className="img-fluid rounded shadow"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                <defs>
                  <style>
                    {`
                      .card-float { animation: float 6s ease-in-out infinite; }
                      .bar-grow { animation: grow 2s ease-out forwards; transform-origin: bottom; }
                      @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
                      @keyframes grow { from { transform: scaleY(0); } }
                    `}
                  </style>
                </defs>
                
                {/* Main Board */}
                <rect x="20" y="10" width="160" height="100" rx="5" fill="#FFFFFF" />
                <rect x="25" y="15" width="150" height="10" rx="2" fill="#E9ECEF" />

                {/* Chart Bars */}
                <g transform="translate(40, 40)">
                  <rect className="bar-grow" x="0" y="40" width="10" height="20" rx="2" fill="#0D6EFD" style={{ animationDelay: '0.1s', transform: 'scaleY(0.8)' }} />
                  <rect className="bar-grow" x="15" y="25" width="10" height="35" rx="2" fill="#0D6EFD" style={{ animationDelay: '0.3s', transform: 'scaleY(0.5)' }} />
                  <rect className="bar-grow" x="30" y="15" width="10" height="45" rx="2" fill="#0D6EFD" style={{ animationDelay: '0.5s', transform: 'scaleY(1)' }} />
                </g>

                {/* Task Item */}
                <g transform="translate(90, 35)">
                  <rect width="70" height="15" rx="2" fill="#E9ECEF" />
                  <circle cx="8" cy="7.5" r="3" fill="#198754" />
                  <rect x="15" y="6" width="40" height="3" rx="1.5" fill="#ADB5BD" />
                </g>

                {/* Second Task Item */}
                <g transform="translate(90, 55)">
                  <rect width="70" height="15" rx="2" fill="#E9ECEF" />
                  <circle cx="8" cy="7.5" r="3" fill="#FFC107" />
                  <rect x="15" y="6" width="30" height="3" rx="1.5" fill="#ADB5BD" />
                </g>

                {/* Floating User Icons */}
                <g className="card-float" style={{ animationDelay: '0s' }}>
                  <circle cx="35" cy="25" r="8" fill="#FFFFFF" stroke="#0D6EFD" strokeWidth="1.5" />
                  <circle cx="35" cy="23" r="2.5" fill="#0D6EFD" />
                  <path d="M 30 31 Q 35 26 40 31" stroke="#0D6EFD" strokeWidth="1.5" fill="none" />
                </g>
                <g className="card-float" style={{ animationDelay: '1s' }}>
                  <circle cx="165" cy="85" r="10" fill="#198754" />
                  <path d="M 162 83 L 164 85 L 168 81" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </g>
              </svg>
              {/* --- NEW SVG ILLUSTRATION END --- */}
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
