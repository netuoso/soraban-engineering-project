import React from 'react';
import { Link } from 'react-router-dom';

const DashboardCard = ({ title, count, loading, linkTo, buttonText, buttonClass = "btn-primary", description }) => {
  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100">
        <div className="card-body">
          <h5 className="card-title">{title}</h5>
          {loading ? (
            <div className="placeholder-glow">
              <h2 className="placeholder col-6"></h2>
            </div>
          ) : (
            <h2 className={`card-text ${buttonClass.replace('btn-', 'text-')}`}>{count}</h2>
          )}
          
          {loading ? (
            <div className="placeholder-glow">
              <span className="placeholder col-6 btn"></span>
            </div>
          ) : (
            <Link to={linkTo} className={`btn ${buttonClass}`}>
              {buttonText}
            </Link>
          )}
          
          {description && (
            <div className="mt-3">
              <small className="text-muted">{description}</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
