import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale);

// Function to generate random colors
const generateColors = (count) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 137.508) % 360; // Use golden angle approximation
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
};

const CategoryPieChart = ({ data, onCategoryClick, selectedCategory }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  const handleClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedCategory = data[elements[0].index].category;
      onCategoryClick(clickedCategory === selectedCategory ? null : clickedCategory);
    }
  };

  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => Math.abs(item.total)), // Use absolute values for better visualization
        backgroundColor: generateColors(data.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleClick,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = data[context.dataIndex].total;
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(value);
            return `${context.label}: ${formattedValue}`;
          },
        },
      },
    },
  };

  return (
    <>
      {isFullscreen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 1050,
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem',
            overflow: 'hidden'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="m-0">Category Summary</h4>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setIsFullscreen(false)}
            >
              <i className="fas fa-compress"></i> Exit Fullscreen
            </button>
          </div>
          <div style={{ 
            flex: 1, 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ 
              width: 'min(90vw, 90vh)',
              height: 'min(90vw, 90vh)',
              padding: '2rem',
              position: 'relative'
            }}>
              <Pie 
                data={chartData}
                options={{
                  ...options,
                  maintainAspectRatio: true,
                  responsive: true
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      <div style={{ height: '300px', marginBottom: '1rem', position: 'relative' }}>
        <Pie 
          data={chartData}
          options={options}
        />
        <div style={{ 
          position: 'absolute', 
          bottom: 0,
          right: 0,
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setIsFullscreen(true)}
            title="Enlarge Chart"
          >
            <i className="fas fa-expand"></i>
          </button>
          {selectedCategory && (
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onCategoryClick(null)}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryPieChart;
