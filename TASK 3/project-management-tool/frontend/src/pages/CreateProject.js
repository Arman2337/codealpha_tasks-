import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

// --- Imports for the calendar date picker ---
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CreateProject = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // Use Date objects for the date picker state
    startDate: new Date(),
    endDate: new Date(),
    members: [], // This will be an array of email strings
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMemberChange = (e) => {
    const emails = e.target.value
      .split(',')
      .map(email => email.trim())
      .filter(email => email); // Remove any empty strings
    setFormData({ ...formData, members: emails });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setError('End date cannot be before the start date.');
        return;
    }

    setLoading(true);

    try {
      const res = await axiosInstance.post('/api/projects', formData);
      
      // --- FIX for the '/undefined' redirect bug ---
      // The new project object is nested inside res.data.project
      if (res.data && res.data.project && res.data.project._id) {
        navigate(`/project/${res.data.project._id}`);
      } else {
        // Fallback in case the response structure is different
        navigate('/dashboard');
      }
      // --- END FIX ---

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <h2 className="text-center mb-4">Create New Project</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Title</Form.Label>
                  <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., New Website Launch" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} required placeholder="Describe the project goals" />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date</Form.Label>
                      {/* --- CALENDAR PICKER --- */}
                      <DatePicker
                        selected={formData.startDate}
                        onChange={(date) => setFormData({ ...formData, startDate: date })}
                        className="form-control" // Apply Bootstrap styling
                        dateFormat="MMMM d, yyyy"
                        selectsStart
                        startDate={formData.startDate}
                        endDate={formData.endDate}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Date</Form.Label>
                      {/* --- CALENDAR PICKER --- */}
                      <DatePicker
                        selected={formData.endDate}
                        onChange={(date) => setFormData({ ...formData, endDate: date })}
                        className="form-control"
                        dateFormat="MMMM d, yyyy"
                        selectsEnd
                        startDate={formData.startDate}
                        endDate={formData.endDate}
                        minDate={formData.startDate} // Prevent selecting an end date before the start date
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Team Members</Form.Label>
                  <Form.Control
                    type="text"
                    name="members"
                    onChange={handleMemberChange}
                    placeholder="Enter team member emails, separated by commas"
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={loading} size="lg">
                    {loading ? 'Creating...' : 'Create Project'}
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
