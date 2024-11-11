import React, { useState, useEffect } from 'react';
import { Form, Button, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import FormContainer from '../components/FormContainer';
import CheckoutSteps from '../components/CheckoutSteps';

function PaymentScreen() {
  const [paymentMethod, setPaymentMethod] = useState('PayPal');
  const navigate = useNavigate();
  const shippingAddress = JSON.parse(localStorage.getItem('shippingAddress'));

  useEffect(() => {
    if (!shippingAddress || !shippingAddress.address) {
      navigate('/shipping');
    }
  }, [navigate, shippingAddress]);

  const submitHandler = (e) => {
    e.preventDefault();
    localStorage.setItem('paymentMethod', paymentMethod);
    navigate('/placeorder');
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <h2>Payment Method</h2>
      <Form onSubmit={submitHandler}>
        <Form.Group>
          <Form.Label as="legend">Select Method</Form.Label>
          <Col>
            <Form.Check
              type="radio"
              label="PayPal or Credit Card"
              id="paypal"
              name="paymentMethod"
              value="PayPal"
              checked={paymentMethod === 'PayPal'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </Col>
        </Form.Group> 

        <Button type="submit" variant="primary">
          Continue
        </Button>
      </Form>
    </FormContainer>
  );
}

export default PaymentScreen;
