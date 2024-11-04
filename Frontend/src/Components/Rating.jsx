import React from 'react';
import PropTypes from 'prop-types';

function Rating({ value, text }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="rating">
      {stars.map((star) => (
        <span key={star}>
          <i
            style={{ color: '#f8e825' }}
            className={
              value >= star
                ? 'fas fa-star'
                : value >= star - 0.5
                ? 'fas fa-star-half-alt'
                : 'far fa-star'
            }
          ></i>
        </span>
      ))}
      {text && <span>{text}</span>}
    </div>
  );
}

Rating.propTypes = {
  value: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
};

export default Rating;
