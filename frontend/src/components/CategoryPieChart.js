import React from 'react';
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
    <div style={{ height: '300px', marginBottom: '1rem' }}>
      <Pie 
        data={{
          ...chartData,
          datasets: [{
            ...chartData.datasets[0],
            backgroundColor: chartData.datasets[0].backgroundColor.map((color, index) => 
              data[index].category === selectedCategory ? color : `${color}80`
            )
          }]
        }} 
        options={options}
      />
      {selectedCategory && (
        <div className="text-center mt-2">
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onCategoryClick(null)}
          >
            Clear Category Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryPieChart;
