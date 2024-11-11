import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

function FormContainer({ children }) {
  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col xs={12} md={8} lg={6}>
          <div className="p-4 border rounded shadow-sm">{children}</div>
        </Col>
      </Row>
    </Container>
  );
}

export default FormContainer;
