import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import axios from 'axios';

function ProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userInfo) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const config = {
          headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        const { data } = await axios.get(`/api/users/profile/`, config);
        setName(data.name);
        setEmail(data.email);
        setLoading(false);
      } catch (error) {
        setError(
          error.response && error.response.data.detail
            ? error.response.data.detail
            : error.message
        );
        setLoading(false);
      }
    };

    // Run only if userInfo is defined
    if (userInfo) {
      fetchUserDetails();
    }
  }, [navigate]); // Remove `userInfo` from dependency array

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      setMessage('');
      try {
        setLoading(true);
        const config = {
          headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        const { data } = await axios.put(
          `/api/users/profile/update/`,
          { id: userInfo._id, name, email, password },
          config
        );
        setSuccess(true);
        localStorage.setItem('userInfo', JSON.stringify(data));
        setLoading(false);
      } catch (error) {
        setError(
          error.response && error.response.data.detail
            ? error.response.data.detail
            : error.message
        );
        setLoading(false);
      }
    }
  };

  return (
    <Row>
      <Col md={3}>
        <h2>User Profile</h2>
        {message && <Message variant="danger">{message}</Message>}
        {error && <Message variant="danger">{error}</Message>}
        {success && <Message variant="success">Profile Updated</Message>}
        {loading && <Loader />}
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              required
              type="name"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="email">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              required
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="passwordConfirm">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Form.Group>

          <Button type="submit" variant="primary">
            Update
          </Button>
        </Form>
      </Col>
    </Row>
  );
}

export default ProfileScreen;
