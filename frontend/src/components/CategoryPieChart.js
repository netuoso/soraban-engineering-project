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

const CategoryPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

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
    <div style={{ height: '400px', marginBottom: '2rem' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default CategoryPieChart;
