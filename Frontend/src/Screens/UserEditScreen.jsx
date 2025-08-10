import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import axiosInstance from '../axiosInstance'; // Ensure you import the configured axios instance
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import FormContainer from '../components/FormContainer';
import { setMeta } from '../lib/seo.js';

function UserEditScreen() {
  const { id: userId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    if (!hasFetched) {
      const fetchUserDetails = async () => {
        try {
          setLoading(true);
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          const { data } = await axiosInstance.get(`/api/users/${userId}/`, config);
          setName(data.name);
          setEmail(data.email);
          setIsAdmin(data.isAdmin);
          setLoading(false);
          setHasFetched(true);
        } catch (error) {
          setError(
            error.response && error.response.data.detail
              ? error.response.data.detail
              : 'Error fetching user details'
          );
          setLoading(false);
        }
      };

      fetchUserDetails();
    }
  }, [userId, userInfo, navigate, hasFetched]);

  useEffect(() => {
    setMeta({ title: 'Edit User – Admin – Handmade Hub', description: 'Admin: edit user.' });
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setUpdateError('Name and email fields cannot be empty');
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axiosInstance.put(`/api/users/update/${userId}/`, { name, email, isAdmin }, config);
      setUpdateSuccess(true);
      navigate('/admin/userlist');
    } catch (error) {
      setUpdateError(
        error.response && error.response.data.detail
          ? error.response.data.detail
          : 'Error updating user'
      );
    }
  };

  return (
    <div>
      <Link to='/admin/userlist'>Go Back</Link>

      <FormContainer>
        <h1>Edit User</h1>
        {updateSuccess && <Message variant='success'>User Updated Successfully</Message>}
        {updateError && <Message variant='danger'>{updateError}</Message>}
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId='name'>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter name'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId='email'>
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type='email'
                placeholder='Enter email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId='isadmin'>
              <Form.Check
                type='checkbox'
                label='Is Admin'
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
            </Form.Group>

            <Button type='submit' variant='primary'>
              Update
            </Button>
          </Form>
        )}
      </FormContainer>
    </div>
  );
}

export default UserEditScreen;
