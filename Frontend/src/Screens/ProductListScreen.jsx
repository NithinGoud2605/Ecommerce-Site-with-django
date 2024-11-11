import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance'; // Updated to use axios instance
import Loader from '../components/Loader';
import Message from '../components/Message';

function ProductListScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [errorCreate, setErrorCreate] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasFetched, setHasFetched] = useState(false);
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    if (!hasFetched) {
      fetchProducts(page);
      setHasFetched(true);
    }
  }, [navigate, userInfo, hasFetched, page]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      const { data } = await axiosInstance.get(`/api/products/?page=${page}`, config);
      setProducts(data.products);
      setPage(data.page);
      setTotalPages(data.pages);
      setLoading(false);
    } catch (err) {
      setError(err.response ? err.response.data.detail : 'Error loading products');
      setLoading(false);
    }
  };

  const createProductHandler = async () => {
    if (window.confirm('Are you sure you want to create a new product?')) {
      try {
        setLoadingCreate(true);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        const { data } = await axiosInstance.post('/api/products/create/', {}, config);
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
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        await axiosInstance.delete(`/api/products/delete/${id}/`, config);
        setProducts(products.filter(product => product._id !== id));
        setLoading(false);
      } catch (err) {
        setError(err.response ? err.response.data.detail : 'Error deleting product');
        setLoading(false);
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setHasFetched(false); // Allow fetching on page change
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
        <>
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
          <Pagination>
            {[...Array(totalPages).keys()].map(x => (
              <Pagination.Item key={x + 1} active={x + 1 === page} onClick={() => handlePageChange(x + 1)}>
                {x + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </>
      )}
    </div>
  );
}

export default ProductListScreen;
