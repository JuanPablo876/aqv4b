import React, { useEffect, useRef } from 'react';
import VenetianTile from './VenetianTile';

const DashboardChartCard = ({ title, data, type }) => {
  const canvasRef = useRef(null);
  
  // Get current theme colors
  const getThemeColors = () => {
    const isDark = document.documentElement.classList.contains('dark');
    
    return {
      axisColor: isDark ? '#4b5563' : '#e5e7eb',
      gridColor: isDark ? '#374151' : '#f3f4f6',
      textColor: isDark ? '#d1d5db' : '#6b7280',
      labelColor: isDark ? '#9ca3af' : '#9ca3af',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      primaryBlue: isDark ? '#60a5fa' : '#3b82f6',
      lightBlue: isDark ? '#3b82f6' : '#93c5fd'
    };
  };
  
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (type === 'bar') {
      drawBarChart(ctx, data, width, height);
    } else if (type === 'line') {
      drawLineChart(ctx, data, width, height);
    } else if (type === 'doughnut') {
      drawDoughnutChart(ctx, data, width, height);
    }
  }, [data, type]);
  
  const drawBarChart = (ctx, data, width, height) => {
    const colors = getThemeColors();
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find max value for scaling
    const maxValue = Math.max(...data.map(item => item.sales));
    const barWidth = chartWidth / data.length - 10;
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = colors.axisColor;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.sales / maxValue) * chartHeight;
      const x = padding + index * (barWidth + 10) + 5;
      const y = height - padding - barHeight;
      
      // Create gradient for bar
      const gradient = ctx.createLinearGradient(x, y, x, height - padding);
      gradient.addColorStop(0, colors.primaryBlue);
      gradient.addColorStop(1, colors.lightBlue);
      
      // Draw bar
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw label
      ctx.fillStyle = colors.textColor;
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.month, x + barWidth / 2, height - padding + 15);
    });
    
    // Draw y-axis labels
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * i;
      const y = height - padding - (chartHeight / 4) * i;
      
      ctx.fillStyle = colors.labelColor;
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(formatNumber(value), padding - 10, y + 3);
      
      // Draw grid line
      ctx.beginPath();
      ctx.strokeStyle = colors.gridColor;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  };
  
  const drawLineChart = (ctx, data, width, height) => {
    const colors = getThemeColors();
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find max value for scaling
    const maxValue = Math.max(...data.map(item => item.sales));
    const pointSpacing = chartWidth / (data.length - 1);
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = colors.axisColor;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Create gradient for area under the line
    const areaGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    areaGradient.addColorStop(0, `${colors.primaryBlue}33`); // Add transparency
    areaGradient.addColorStop(1, `${colors.primaryBlue}0D`); // More transparent
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = colors.primaryBlue;
    ctx.lineWidth = 2;
    
    data.forEach((item, index) => {
      const x = padding + index * pointSpacing;
      const y = height - padding - (item.sales / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw point
      ctx.fillStyle = colors.backgroundColor;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.primaryBlue;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = colors.textColor;
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.month, x, height - padding + 15);
    });
    
    ctx.stroke();
    
    // Fill area under the line
    ctx.lineTo(padding + (data.length - 1) * pointSpacing, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.fillStyle = areaGradient;
    ctx.fill();
    
    // Draw y-axis labels
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * i;
      const y = height - padding - (chartHeight / 4) * i;
      
      ctx.fillStyle = colors.labelColor;
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(formatNumber(value), padding - 10, y + 3);
      
      // Draw grid line
      ctx.beginPath();
      ctx.strokeStyle = colors.gridColor;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  };
  
  const drawDoughnutChart = (ctx, data, width, height) => {
    const colors = getThemeColors();
    const isDark = document.documentElement.classList.contains('dark');
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.percentage, 0);
    
    // Colors for segments (theme-aware)
    const segmentColors = isDark ? [
      colors.primaryBlue, '#10b981', '#8b5cf6', '#f59e0b', 
      '#ef4444', '#ec4899', '#6366f1', '#14b8a6'
    ] : [
      colors.primaryBlue, '#059669', '#7c3aed', '#d97706', 
      '#dc2626', '#db2777', '#4f46e5', '#0f766e'
    ];
    
    let startAngle = -0.5 * Math.PI; // Start at top
    
    // Draw segments
    data.forEach((item, index) => {
      const sliceAngle = (item.percentage / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      
      ctx.beginPath();
      ctx.fillStyle = segmentColors[index % segmentColors.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      
      // Calculate position for label
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(midAngle);
      const labelY = centerY + labelRadius * Math.sin(midAngle);
      
      // Draw label
      ctx.fillStyle = colors.backgroundColor;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${item.percentage}%`, labelX, labelY);
      
      startAngle = endAngle;
    });
    
    // Draw center hole
    ctx.beginPath();
    ctx.fillStyle = colors.backgroundColor;
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw legend
    const legendX = width - 100;
    const legendY = 30;
    
    data.forEach((item, index) => {
      const y = legendY + index * 20;
      
      // Draw color box
      ctx.fillStyle = segmentColors[index % segmentColors.length];
      ctx.fillRect(legendX, y, 12, 12);
      
      // Draw label
      ctx.fillStyle = colors.textColor;
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.category, legendX + 18, y + 9);
    });
  };
  
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };
  
  return (
    <VenetianTile className="p-6">
      <h3 className="text-blue-800 font-medium mb-4">{title}</h3>
      <div className="h-64 w-full">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={250} 
          className="w-full h-full"
        ></canvas>
      </div>
    </VenetianTile>
  );
};

export default DashboardChartCard;
