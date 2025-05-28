import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Form,
  Badge,
  Alert
} from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaUser, FaComment } from 'react-icons/fa';
import axiosInstance from 'axios';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axiosInstance.get(`/api/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      setError('Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const res = await axiosInstance.post(`/api/projects/${id}/tasks`, {
        title: newTask
      });
      setProject({ ...project, tasks: [...project.tasks, res.data] });
      setNewTask('');
    } catch (err) {
      setError('Failed to add task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await axiosInstance.post(`/api/projects/${id}/comments`, {
        content: newComment
      });
      setProject({ ...project, comments: [...project.comments, res.data] });
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axiosInstance.delete(`/api/projects/${id}`);
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Project not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h2>{project.title}</h2>
          <p className="text-muted">{project.description}</p>
        </Col>
        <Col xs="auto">
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={() => navigate(`/project/${id}/edit`)}
          >
            <FaEdit className="me-2" />
            Edit
          </Button>
          <Button variant="outline-danger" onClick={handleDeleteProject}>
            <FaTrash className="me-2" />
            Delete
          </Button>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Tasks Section */}
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Tasks</h5>
              <Button variant="primary" size="sm" onClick={() => setNewTask('')}>
                <FaPlus className="me-2" />
                Add Task
              </Button>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddTask} className="mb-3">
                <Form.Group className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task"
                  />
                  <Button type="submit" variant="primary">
                    Add
                  </Button>
                </Form.Group>
              </Form>

              <ListGroup>
                {project.tasks.map((task) => (
                  <ListGroup.Item
                    key={task._id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <span className={task.completed ? 'text-decoration-line-through' : ''}>
                        {task.title}
                      </span>
                      <Badge bg={task.completed ? 'success' : 'warning'} className="ms-2">
                        {task.completed ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => {/* Handle edit task */}}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {/* Handle delete task */}}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Comments Section */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Comments</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddComment} className="mb-3">
                <Form.Group>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment"
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="mt-2">
                  <FaComment className="me-2" />
                  Post Comment
                </Button>
              </Form>

              <ListGroup>
                {project.comments.map((comment) => (
                  <ListGroup.Item key={comment._id}>
                    <div className="d-flex align-items-center mb-2">
                      <FaUser className="me-2" />
                      <strong>{comment.author.username}</strong>
                      <small className="text-muted ms-2">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <p className="mb-0">{comment.content}</p>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mt-4">
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default ProjectDetails; 