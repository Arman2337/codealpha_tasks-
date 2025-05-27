import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaProjectDiagram, FaTasks, FaUsers } from 'react-icons/fa';
import axios from 'axios';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data);
    } catch (err) {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>Dashboard</h2>
        </Col>
        <Col xs="auto">
          <Button
            as={Link}
            to="/create-project"
            variant="primary"
            className="d-flex align-items-center gap-2"
          >
            <FaPlus /> New Project
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <FaProjectDiagram size={32} className="text-primary" />
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Total Projects</h6>
                  <h3 className="mb-0">{projects.length}</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <FaTasks size={32} className="text-success" />
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Active Tasks</h6>
                  <h3 className="mb-0">
                    {projects.reduce((acc, project) => acc + project.tasks.length, 0)}
                  </h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <FaUsers size={32} className="text-info" />
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Team Members</h6>
                  <h3 className="mb-0">
                    {projects.reduce((acc, project) => acc + project.members.length, 0)}
                  </h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Projects List */}
      <Row className="g-4">
        {projects.map((project) => (
          <Col key={project._id} md={6} lg={4}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>{project.title}</Card.Title>
                <Card.Text className="text-muted">{project.description}</Card.Text>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    {project.tasks.length} tasks • {project.members.length} members
                  </small>
                  <Button
                    as={Link}
                    to={`/project/${project._id}`}
                    variant="outline-primary"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {error && (
        <div className="alert alert-danger mt-4" role="alert">
          {error}
        </div>
      )}
    </Container>
  );
};

export default Dashboard; 