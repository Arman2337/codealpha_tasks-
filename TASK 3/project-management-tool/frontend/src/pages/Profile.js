import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUser, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
// FIX 1: Import your custom axiosInstance, not the default axios
import axiosInstance from '../utils/axios';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userProjects, setUserProjects] = useState([]);

  useEffect(() => {
    const fetchUserProjects = async () => {
      try {
        setProjectsLoading(true);
        // FIX 2: Use the correct, existing endpoint for projects
        const res = await axiosInstance.get('/api/projects');
        setUserProjects(res.data);
      } catch (err) {
        setError('Failed to fetch user projects');
      } finally {
        setProjectsLoading(false);
      }
    };

    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username,
        email: user.email
      }));
      fetchUserProjects();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        // Only include password fields if a new password is provided
        ...(formData.newPassword && {
            password: formData.newPassword
        })
      };

      // FIX 3: Use axiosInstance for the update request as well
      const res = await axiosInstance.put('/api/users/profile', updateData);
      
      // The response from the profile update might not be the full user object
      // It's better to update the context with the new form data
      const updatedUser = { ...user, ...res.data.user };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Also update localStorage

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
      return (
          <Container className="py-5 text-center">
              <p>Please log in to view your profile.</p>
          </Container>
      )
  }

  return (
    <Container className="py-5">
      <Row className="g-4">
        {/* Profile Information */}
        <Col md={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '100px', height: '100px' }}>
                  <FaUser size={40} />
                </div>
                <h3>{user.username}</h3>
                <p className="text-muted mb-0">{user.email}</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </Form.Group>

                {isEditing && (
                  <>
                    <hr />
                    <h5>Change Password</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Enter new password (optional)"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                      />
                    </Form.Group>
                  </>
                )}

                <div className="d-grid gap-2">
                  {isEditing ? (
                    <>
                      <Button type="submit" variant="primary" disabled={loading}>
                        <FaSave className="me-2" /> {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline-secondary" onClick={() => setIsEditing(false)}>
                        <FaTimes className="me-2" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline-primary" onClick={() => setIsEditing(true)}>
                      <FaEdit className="me-2" /> Edit Profile
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* User's Projects */}
        <Col md={8}>
          <Card className="shadow">
            <Card.Header>
              <h4 className="mb-0">My Projects</h4>
            </Card.Header>
            <Card.Body>
              {projectsLoading ? (
                <div className="text-center"><Spinner animation="border" /></div>
              ) : (
                <ListGroup variant="flush">
                  {userProjects.length > 0 ? userProjects.map((project) => (
                    <ListGroup.Item key={project._id} action as={Link} to={`/project/${project._id}`}>
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{project.title}</h5>
                        <small>{new Date(project.createdAt).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-1 text-muted">{project.description}</p>
                    </ListGroup.Item>
                  )) : (
                    <div className="text-center text-muted p-3">You are not a member of any projects yet.</div>
                  )}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
