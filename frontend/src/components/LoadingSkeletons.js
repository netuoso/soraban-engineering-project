import React from 'react';

const TableSkeleton = ({ rows = 10, columns = 6 }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            {[...Array(columns)].map((_, index) => (
              <th key={index}>
                <div className="placeholder-glow">
                  <span className="placeholder col-8"></span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex}>
                  <div className="placeholder-glow">
                    <span className={`placeholder col-${colIndex === 0 ? '3' : colIndex === 1 ? '12' : colIndex === 2 ? '6' : '8'}`}></span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FiltersSkeleton = () => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="row g-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="placeholder-glow">
              <span className="placeholder col-6"></span>
            </div>
            <div className="placeholder-glow">
              <span className="placeholder col-4"></span>
            </div>
          </div>
          {[...Array(4)].map((_, index) => (
            <div key={index} className="col-md-3">
              <div className="placeholder-glow">
                <span className="placeholder col-8"></span>
                <span className="placeholder col-12 mt-2" style={{ height: '38px' }}></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChartSkeleton = () => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="placeholder-glow">
          <h5 className="placeholder col-4"></h5>
          <div className="d-flex justify-content-center mt-4">
            <div className="placeholder" style={{ 
              width: '300px', 
              height: '300px', 
              borderRadius: '50%' 
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { TableSkeleton, FiltersSkeleton, ChartSkeleton };
