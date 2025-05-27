import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

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
  const [isEditing, setIsEditing] = useState(false);
  const [userProjects, setUserProjects] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        username: user.username,
        email: user.email
      });
      fetchUserProjects();
    }
  }, [user]);

  const fetchUserProjects = async () => {
    try {
      const res = await axios.get('/api/projects/user');
      setUserProjects(res.data);
    } catch (err) {
      setError('Failed to fetch user projects');
    }
  };

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
        email: formData.email
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const res = await axios.put('/api/users/profile', updateData);
      setUser(res.data);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

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
                <h3>{user?.username}</h3>
                <p className="text-muted mb-0">{user?.email}</p>
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
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter current password"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Enter new password"
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
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="d-flex align-items-center justify-content-center gap-2"
                      >
                        <FaSave />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            ...formData,
                            username: user.username,
                            email: user.email,
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        className="d-flex align-items-center justify-content-center gap-2"
                      >
                        <FaTimes />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline-primary"
                      onClick={() => setIsEditing(true)}
                      className="d-flex align-items-center justify-content-center gap-2"
                    >
                      <FaEdit />
                      Edit Profile
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
              <ListGroup>
                {userProjects.map((project) => (
                  <ListGroup.Item
                    key={project._id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <h5 className="mb-1">{project.title}</h5>
                      <p className="text-muted mb-0">{project.description}</p>
                      <small className="text-muted">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      href={`/project/${project._id}`}
                    >
                      View Details
                    </Button>
                  </ListGroup.Item>
                ))}
                {userProjects.length === 0 && (
                  <ListGroup.Item className="text-center text-muted">
                    No projects found
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile; 