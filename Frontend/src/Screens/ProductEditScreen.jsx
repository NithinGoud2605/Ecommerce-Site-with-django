import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';

function ProductEditScreen() {
    const { id: productId } = useParams();
    const navigate = useNavigate();

    const [productLoaded, setProductLoaded] = useState(false);
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [image, setImage] = useState('');
    const [countInStock, setCountInStock] = useState(0);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [errorUpdate, setErrorUpdate] = useState(null);

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        if (!userInfo || !userInfo.isAdmin) {
            navigate('/login');
            return;
        }

        const fetchProductDetails = async () => {
            if (!productLoaded) {
                try {
                    setLoading(true);
                    const config = {
                        headers: {
                            Authorization: `Bearer ${userInfo.token}`
                        }
                    };
                    const { data } = await axios.get(`/api/products/${productId}/`, config);
                    setName(data.name);
                    setPrice(data.price);
                    setImage(data.image);
                    setCountInStock(data.countInStock);
                    setDescription(data.description);
                    setProductLoaded(true);
                    setLoading(false);
                } catch (err) {
                    setError(err.response && err.response.data.detail ? err.response.data.detail : 'Error loading product');
                    setLoading(false);
                }
            }
        };

        fetchProductDetails();
    }, [navigate, productId, userInfo, productLoaded]);

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoadingUpdate(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                }
            };
            await axios.put(
                `/api/products/update/${productId}/`,
                { _id: productId, name, price, image, countInStock, description },
                config
            );
            setLoadingUpdate(false);
            navigate('/admin/productlist');
        } catch (err) {
            setErrorUpdate(err.response && err.response.data.detail ? err.response.data.detail : 'Error updating product');
            setLoadingUpdate(false);
        }
    };

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('product_id', productId);

        setUploading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`
                }
            };
            const { data } = await axios.post('/api/products/upload/', formData, config);
            setImage(data);
            setUploading(false);
        } catch (err) {
            setUploading(false);
            setError('Error uploading image');
        }
    };

    return (
        <Container>
            <Link to='/admin/productlist' className='btn btn-light my-3'>
                Go Back
            </Link>

            <Row className="justify-content-md-center">
                <Col xs={12} md={8}>
                    <h1>Edit Product</h1>
                    {loadingUpdate && <Loader />}
                    {errorUpdate && <Message variant='danger'>{errorUpdate}</Message>}
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
                                ></Form.Control>
                            </Form.Group>

                            <Form.Group controlId='price' className="mb-3">
                                <Form.Label>Price</Form.Label>
                                <Form.Control
                                    type='number'
                                    placeholder='Enter price'
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                ></Form.Control>
                            </Form.Group>

                            <Form.Group controlId='image' className="mb-3">
                                <Form.Label>Image</Form.Label>
                                <Form.Control
                                    type='text'
                                    placeholder='Enter image URL'
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                ></Form.Control>
                                <Form.Control
                                    type='file'
                                    label='Choose File'
                                    custom
                                    onChange={uploadFileHandler}
                                ></Form.Control>
                                {uploading && <Loader />}
                            </Form.Group>

                            <Form.Group controlId='countinstock' className="mb-3">
                                <Form.Label>Stock</Form.Label>
                                <Form.Control
                                    type='number'
                                    placeholder='Enter stock'
                                    value={countInStock}
                                    onChange={(e) => setCountInStock(e.target.value)}
                                ></Form.Control>
                            </Form.Group>

                            <Form.Group controlId='description' className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    type='text'
                                    placeholder='Enter description'
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></Form.Control>
                            </Form.Group>

                            <Button type='submit' variant='primary'>
                                Update
                            </Button>
                        </Form>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default ProductEditScreen;
