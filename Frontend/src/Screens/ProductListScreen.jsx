import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';

function ProductListScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [errorCreate, setErrorCreate] = useState(null);
  const [hasFetched, setHasFetched] = useState(false); // Prevents continuous calls
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    if (!hasFetched) {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`
            }
          };
          const { data } = await axios.get('/api/products/', config);
          setProducts(data);
          setLoading(false);
          setHasFetched(true); // Prevents repeated fetches
        } catch (err) {
          setError(err.response ? err.response.data.detail : 'Error loading products');
          setLoading(false);
        }
      };

      fetchProducts();
    }
  }, [navigate, userInfo, hasFetched]);

  const createProductHandler = async () => {
    if (window.confirm('Are you sure you want to create a new product?')) {
      try {
        setLoadingCreate(true);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        const { data } = await axios.post('/api/products/create/', {}, config);
        setLoadingCreate(false);
        navigate(`/admin/product/${data._id}/edit`);
      } catch (err) {
        setErrorCreate(err.response ? err.response.data.detail : 'Error creating product');
        setLoadingCreate(false);
      }
    }
  };

  const deleteProductHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        setLoading(true);
        await axios.delete(`/api/products/delete/${id}/`, config);
        setProducts(products.filter(product => product._id !== id));
        setLoading(false);
      } catch (err) {
        setError(err.response ? err.response.data.detail : 'Error deleting product');
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <Row className='align-items-center'>
        <Col>
          <h1>Products</h1>
        </Col>
        <Col className='text-right'>
          <Button className='my-3' onClick={createProductHandler}>
            <i className='fas fa-plus'></i> Create Product
          </Button>
        </Col>
      </Row>

      {loadingCreate && <Loader />}
      {errorCreate && <Message variant="danger">{errorCreate}</Message>}
      
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
              <th>PRICE</th>
              <th>CATEGORY</th>
              <th>BRAND</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>{product._id}</td>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td>{product.category}</td>
                <td>{product.brand}</td>
                <td>
                  <Button variant="light" className="btn-sm" onClick={() => navigate(`/admin/product/${product._id}/edit`)}>
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button variant="danger" className="btn-sm" onClick={() => deleteProductHandler(product._id)}>
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

export default ProductListScreen;
