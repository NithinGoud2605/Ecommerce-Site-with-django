import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import axiosInstance from '../axiosInstance'; // Ensure axiosInstance is configured
import Loader from '../Components/Loader';
import Message from '../Components/Message';
import { setMeta } from '../lib/seo.js';

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
    const [successUpdate, setSuccessUpdate] = useState(false);

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
                    const { data } = await axiosInstance.get(`/api/products/${productId}/`);
                    setName(data.name);
                    setPrice(data.price);
                    setImage(data.image);
                    setCountInStock(data.countInStock);
                    setDescription(data.description);
                    setProductLoaded(true);
                    setLoading(false);
                } catch (err) {
                    setError(err.response?.data?.detail || 'Error loading product');
                    setLoading(false);
                }
            }
        };

        fetchProductDetails();
    }, [navigate, productId, userInfo, productLoaded]);

    useEffect(() => {
        setMeta({ title: 'Edit Product – Admin – Handmade Hub', description: 'Admin: edit product.' });
    }, []);

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoadingUpdate(true);
        try {
            await axiosInstance.put(`/api/products/update/${productId}/`, {
                _id: productId,
                name,
                price,
                image,
                countInStock,
                description,
            });
            setLoadingUpdate(false);
            setSuccessUpdate(true); // Set success state
            navigate('/admin/productlist');
        } catch (err) {
            setErrorUpdate(err.response?.data?.detail || 'Error updating product');
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
            const { data } = await axiosInstance.post('/api/products/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setImage(data.image); // Ensure data contains the image URL
            setUploading(false);
            e.target.value = null; // Reset file input
        } catch (err) {
            setUploading(false);
            setError(err.response?.data?.detail || 'Error uploading image');
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
                    {successUpdate && <Message variant='success'>Product updated successfully</Message>}
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
                                />
                            </Form.Group>

                            <Form.Group controlId='price' className="mb-3">
                                <Form.Label>Price</Form.Label>
                                <Form.Control
                                    type='number'
                                    placeholder='Enter price'
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group controlId='image' className="mb-3">
                                <Form.Label>Image</Form.Label>
                                <Form.Control
                                    type='text'
                                    placeholder='Enter image URL'
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                />
                                <Form.Control
                                    type='file'
                                    label='Choose File'
                                    onChange={uploadFileHandler}
                                />
                                {uploading && <Loader />}
                            </Form.Group>

                            <Form.Group controlId='countinstock' className="mb-3">
                                <Form.Label>Stock</Form.Label>
                                <Form.Control
                                    type='number'
                                    placeholder='Enter stock'
                                    value={countInStock}
                                    onChange={(e) => setCountInStock(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group controlId='description' className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    type='text'
                                    placeholder='Enter description'
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
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
