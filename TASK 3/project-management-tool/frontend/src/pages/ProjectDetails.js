import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  Dropdown,
  ListGroup,
  Badge,
  Modal // Import Modal for the task form
} from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaUser, FaCrown, FaCalendarAlt } from 'react-icons/fa';
import axiosInstance from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import DatePicker from "react-datepicker"; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for the Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // Holds task data for editing
  const [isEditingTask, setIsEditingTask] = useState(false);

  const taskStatuses = ['todo', 'in-progress', 'review', 'completed'];

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axiosInstance.get(`/api/projects/${id}`);
        setProject(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch project details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetails();
  }, [id]);

  const tasksByStatus = useMemo(() => {
    const grouped = {};
    taskStatuses.forEach(status => grouped[status] = []);
    project?.tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [project?.tasks]);

  // --- MODAL AND TASK HANDLERS ---

  const handleShowTaskModal = (task = null) => {
    if (task) {
      // Editing an existing task
      setIsEditingTask(true);
      setCurrentTask({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        assignedTo: task.assignedTo?._id || ''
      });
    } else {
      // Creating a new task
      setIsEditingTask(false);
      setCurrentTask({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: new Date(),
      });
    }
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setCurrentTask(null);
    setIsEditingTask(false);
  };

  const handleSaveTask = async () => {
    try {
      let res;
      const taskData = {
        ...currentTask,
        project: id,
      };

      if (isEditingTask) {
        // Update existing task
        res = await axiosInstance.put(`/api/tasks/${currentTask._id}`, taskData);
        setProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t._id === currentTask._id ? res.data.task : t)
        }));
      } else {
        // Create new task
        res = await axiosInstance.post('/api/tasks', taskData);
        setProject(prev => ({ ...prev, tasks: [...prev.tasks, res.data.task] }));
      }
      handleCloseTaskModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const originalTasks = [...project.tasks];
    const updatedTasks = originalTasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
    );
    setProject(prev => ({ ...prev, tasks: updatedTasks }));

    try {
      await axiosInstance.put(`/api/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      setError('Failed to update task status.');
      setProject(prev => ({ ...prev, tasks: originalTasks }));
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axiosInstance.delete(`/api/projects/${id}`);
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to delete project.');
      }
    }
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (error || !project) return <Container className="py-5"><Alert variant="danger">{error || 'Project not found.'}</Alert></Container>;

  const isOwner = user && project.owner._id === user.id;

  return (
    <Container fluid className="py-4 px-md-4">
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      
      {/* Project Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0">{project.title}</h2>
          <p className="text-muted">{project.description}</p>
        </Col>
        {isOwner && (
          <Col xs="auto">
            <Button variant="outline-primary" className="me-2" onClick={() => navigate(`/project/${id}/edit`)}><FaEdit /> Edit</Button>
            <Button variant="outline-danger" onClick={handleDeleteProject}><FaTrash /> Delete</Button>
          </Col>
        )}
      </Row>

      {/* Project Team Section */}
      <Row>
        <Col lg={12} className="mb-4">
            <Card>
                <Card.Header as="h5">Project Team</Card.Header>
                <Card.Body>
                    <ListGroup horizontal className="flex-wrap">
                        {project.members && project.members.map(member => (
                            <ListGroup.Item key={member._id} className="d-flex align-items-center border-0">
                                <FaUser className="me-2" />
                                <div>
                                    <strong>{member.username}</strong>
                                    {project.owner._id === member._id && (
                                        <Badge bg="primary" className="ms-2"><FaCrown className="me-1" /> Owner</Badge>
                                    )}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-end mb-3">
          <Button onClick={() => handleShowTaskModal()}><FaPlus /> Add New Task</Button>
      </div>

      {/* Kanban Board */}
      <Row>
        {taskStatuses.map(status => (
          <Col key={status} md={6} lg={3} className="mb-4">
            <Card className="h-100 bg-light">
              <Card.Header className="text-capitalize fw-bold">{status.replace('-', ' ')}</Card.Header>
              <Card.Body>
                {tasksByStatus[status] && tasksByStatus[status].length > 0 ? (
                  tasksByStatus[status].map(task => (
                    <Card key={task._id} className="mb-2 shadow-sm">
                      <Card.Body className="p-2">
                        <div className="d-flex justify-content-between">
                          <p className="mb-1 fw-bold">{task.title}</p>
                          <Dropdown>
                            <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${task._id}`} />
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleShowTaskModal(task)}><FaEdit /> Edit Task</Dropdown.Item>
                              <Dropdown.Divider />
                              {taskStatuses.map(s => (
                                <Dropdown.Item key={s} onClick={() => handleStatusChange(task._id, s)}>
                                  Move to {s.replace('-', ' ')}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <small className="text-muted d-flex align-items-center">
                            <FaCalendarAlt className="me-1" />
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                          </small>
                          {task.assignedTo ? (
                            <Badge pill bg="secondary" className="d-flex align-items-center">
                                <FaUser className="me-1" /> {task.assignedTo.username}
                            </Badge>
                          ) : <Badge pill bg="light" text="dark">Unassigned</Badge>}
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted fst-italic small mt-2">No tasks in this stage.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* --- TASK MODAL --- */}
      <Modal show={showTaskModal} onHide={handleCloseTaskModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditingTask ? 'Edit Task' : 'Create New Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentTask && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control type="text" value={currentTask.title} onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={3} value={currentTask.description} onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Assign To</Form.Label>
                <Form.Select value={currentTask.assignedTo} onChange={(e) => setCurrentTask({...currentTask, assignedTo: e.target.value})}>
                  <option value="">Unassigned</option>
                  {project.members.map(member => (
                    <option key={member._id} value={member._id}>{member.username}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Due Date</Form.Label>
                <DatePicker selected={currentTask.dueDate} onChange={(date) => setCurrentTask({...currentTask, dueDate: date})} className="form-control" />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseTaskModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveTask}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default ProjectDetails;
