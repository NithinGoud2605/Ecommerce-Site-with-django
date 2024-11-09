// Rating.jsx
import React from 'react';
import PropTypes from 'prop-types';

function Rating({ value = 0, text, color = '#f8e825' }) {
  const numericValue = Number(value);

  return (
    <div className="rating">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index}>
          <i
            style={{ color }}
            className={
              numericValue >= index + 1
                ? 'fas fa-star'
                : numericValue >= index + 0.5
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
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  text: PropTypes.string,
  color: PropTypes.string,
};

export default Rating;
