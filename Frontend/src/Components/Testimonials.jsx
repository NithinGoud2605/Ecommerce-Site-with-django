import React from 'react';
import { Carousel, Container } from 'react-bootstrap';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

function Testimonials() {
  const reviews = [
    {
      text: "Amazing products! The craftsmanship is outstanding.",
      author: "Jane Doe",
      rating: 5,
    },
    {
      text: "I love supporting local artisans. Great experience!",
      author: "John Smith",
      rating: 4.5,
    },
    {
      text: "The quality and uniqueness of the items are incredible.",
      author: "Emily Rose",
      rating: 4,
    },
  ];

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <>
        {Array(fullStars).fill(<FaStar className="star-icon" />)}
        {halfStar && <FaStarHalfAlt className="star-icon" />}
        {Array(emptyStars).fill(<FaRegStar className="star-icon" />)}
      </>
    );
  };

  return (
    <section className="testimonials">
      <Container>
        <h2 className="section-title">What Our Customers Say</h2>
        <Carousel>
          {reviews.map((review, index) => (
            <Carousel.Item key={index}>
              <div className="review-content">
                <p className="review-text">"{review.text}"</p>
                <div className="review-rating">{renderStars(review.rating)}</div>
                <h5 className="review-author">- {review.author}</h5>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </Container>
    </section>
  );
}

export default Testimonials;
