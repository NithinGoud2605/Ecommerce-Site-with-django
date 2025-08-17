import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Breadcrumb } from 'react-bootstrap';
import axiosInstance from '../axiosInstance';
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import FormContainer from '../Components/FormContainer';
import { setMeta } from '../lib/seo.js';

export default function UserEditScreen() {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const headingRef = useRef(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [dirty, setDirty] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const isSelf = userInfo && String(userInfo._id || userInfo.id) === String(userId);

  // Meta + noindex for admin pages
  useEffect(() => {
    setMeta({ title: 'Edit User – Admin – Vyshnavi Pelimelli', description: 'Admin: edit user.' });
    let tag = document.querySelector('meta[name="robots"]');
    if (!tag) { 
      tag = document.createElement('meta'); 
      tag.setAttribute('name','robots'); 
      document.head.appendChild(tag); 
    }
    tag.setAttribute('content','noindex,nofollow');
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (!loading && headingRef.current) {
      headingRef.current.focus();
    }
  }, [loading]);

  // Unsaved changes guard
  useEffect(() => {
    setDirty(true);
  }, [name, email, isAdmin]);

  useEffect(() => {
    const onBeforeUnload = (e) => { 
      if (dirty) { 
        e.preventDefault(); 
        e.returnValue = ''; 
      } 
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Clear stale errors as user types
  useEffect(() => {
    setUpdateError(null);
  }, [name, email, isAdmin]);

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
          setDirty(false); // Reset dirty state after successful load
        } catch (error) {
          // 401/403 handling - kick to login with return path
          if ([401, 403].includes(error?.response?.status)) {
            navigate(`/login?redirect=/admin/user/${userId}`);
            return;
          }
          setError(error?.response?.data?.detail || 'Error fetching user details');
          setLoading(false);
        }
      };

      fetchUserDetails();
    }
  }, [userId, userInfo, navigate, hasFetched]);

  const submitHandler = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      setUpdateError('Name is required');
      return;
    }
    
    if (!/.+@.+\..+/.test(String(email).trim())) {
      setUpdateError('Enter a valid email');
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Protect against accidental lock-out - don't allow admin to remove their own admin flag
      await axiosInstance.put(`/api/users/update/${userId}/`, {
        name: name.trim(),
        email: email.trim(),
        isAdmin: isSelf ? true : isAdmin
      }, config);
      
      setUpdateSuccess(true);
      setDirty(false);
      setTimeout(() => {
        navigate('/admin/userlist');
      }, 1000);
    } catch (error) {
      if ([401, 403].includes(error?.response?.status)) {
        navigate(`/login?redirect=/admin/user/${userId}`);
        return;
      }
      setUpdateError(error?.response?.data?.detail || 'Error updating user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <nav aria-label="breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item><Link to="/admin">Admin</Link></Breadcrumb.Item>
            <Breadcrumb.Item><Link to="/admin/userlist">Users</Link></Breadcrumb.Item>
            <Breadcrumb.Item active aria-current="page">Edit</Breadcrumb.Item>
          </Breadcrumb>
        </nav>
        <div className="d-flex gap-2">
          <Button as={Link} to="/admin/userlist" variant="outline-secondary">Cancel</Button>
          <Button onClick={submitHandler} variant="primary" disabled={loading}>
            {loading ? 'Updating…' : 'Save'}
          </Button>
        </div>
      </div>

      <FormContainer>
        <h1 tabIndex={-1} ref={headingRef}>Edit User</h1>
        
        {/* Accessibility: aria-live region for updates */}
        <div aria-live="polite" className="visually-hidden">
          {updateSuccess ? 'User updated successfully' : ''}
          {updateError ? `Error: ${updateError}` : ''}
        </div>
        
        {updateSuccess && <Message variant='success'>User Updated Successfully</Message>}
        {updateError && <Message variant='danger'>{updateError}</Message>}
        
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId='name' className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId='email' className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type='email'
                placeholder='Enter email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="small text-muted mt-1">Used for login + notifications</div>
            </Form.Group>

            <Form.Group controlId='isadmin' className="mb-3">
              <Form.Check
                type='checkbox'
                label='Is Admin'
                checked={isAdmin}
                disabled={isSelf}
                onChange={(e) => {
                  const next = e.target.checked;
                  if (next === false && !window.confirm('Remove admin privileges?')) return;
                  setIsAdmin(next);
                }}
              />
              {isSelf && (
                <div className="small text-muted mt-1">You cannot remove your own admin privileges</div>
              )}
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type='submit' variant='primary' disabled={loading}>
                {loading ? 'Updating…' : 'Update'}
              </Button>
              <Button as={Link} to="/admin/userlist" variant="outline-secondary">
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </FormContainer>

      {/* Mobile sticky footer actions */}
      <div className="d-md-none position-fixed bottom-0 start-0 end-0 p-3 bg-white border-top">
        <div className="d-flex gap-2">
          <Button as={Link} to="/admin/userlist" variant="outline-secondary" className="flex-fill">
            Cancel
          </Button>
          <Button onClick={submitHandler} variant="primary" disabled={loading} className="flex-fill">
            {loading ? 'Updating…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
