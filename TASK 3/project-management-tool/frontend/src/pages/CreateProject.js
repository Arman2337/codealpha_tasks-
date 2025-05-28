import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { AuthContext } from '../context/AuthContext';

const CreateProject = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    members: [],
    createdBy: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Check authentication and set user ID
    if (!isAuthenticated || !user.id) {
      navigate('/login');
      return;
    }
    
    setFormData(prevData => ({
      ...prevData,
      createdBy: user.id
    }));
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // Validate dates whenever they change
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end < start) {
        setDateError('End date must be after start date');
      } else {
        setDateError('');
      }
    }
  }, [formData.startDate, formData.endDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if user ID exists
    if (!formData.createdBy) {
      setError('User not authenticated. Please login again.');
      return;
    }

    // Validate dates before submission
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end < start) {
        setDateError('End date must be after start date');
        return;
      }
    }

    if (dateError) {
      return;
    }

    setLoading(true);

    try {
      console.log('Sending request to:', 'http://localhost:5000/api/projects');
      const res = await axiosInstance.post('/api/projects', formData);
      console.log('Project created successfully:', res.data);
      navigate(`/project/${res.data._id}`);
    } catch (err) {
      console.error('Error creating project:', err.response || err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to create project');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <h2 className="text-center mb-4">Create New Project</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter project title"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Enter project description"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        min={today}
                        required
                      />
                      <Form.Text className="text-muted">
                        Select a future date
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate || today}
                        required
                      />
                      {dateError && (
                        <Form.Text className="text-danger">
                          {dateError}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Team Members (Email addresses, separated by commas)</Form.Label>
                  <Form.Control
                    type="text"
                    name="members"
                    value={formData.members.join(', ')}
                    onChange={(e) => {
                      const members = e.target.value
                        .split(',')
                        .map((email) => email.trim())
                        .filter((email) => email);
                      setFormData({ ...formData, members });
                    }}
                    placeholder="Enter team member emails"
                  />
                  <Form.Text className="text-muted">
                    Enter email addresses separated by commas
                  </Form.Text>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="mb-2"
                  >
                    {loading ? 'Creating Project...' : 'Create Project'}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateProject; 