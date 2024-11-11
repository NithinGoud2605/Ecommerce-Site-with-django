import React, { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance'; // Import your configured axios instance
import Loader from '../Components/Loader';
import Message from '../Components/Message';

function UserListScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    if (!hasFetched) {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          const { data } = await axiosInstance.get('/api/users/', config);
          setUsers(data);
          setLoading(false);
          setHasFetched(true);
        } catch (err) {
          setError(err.response ? err.response.data.detail : 'Error loading users');
          setLoading(false);
        }
      };

      fetchUsers();
    }
  }, [navigate, userInfo, hasFetched]);

  const deleteUserHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        setLoading(true);
        await axiosInstance.delete(`/api/users/delete/${id}/`, config);
        setUsers(users.filter(user => user._id !== id));
        setLoading(false);
      } catch (err) {
        setError(err.response ? err.response.data.detail : 'Error deleting user');
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <h1>Users</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>ADMIN</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user._id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                <td>
                  <Button
                    variant="light"
                    className="btn-sm"
                    onClick={() => navigate(`/admin/user/${user._id}`)}
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button
                    variant="danger"
                    className="btn-sm"
                    onClick={() => deleteUserHandler(user._id)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default UserListScreen;
