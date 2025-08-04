import React, { useEffect, useRef, useState } from 'react';
import VenetianTile from './VenetianTile';

const DashboardChartCard = ({ title, data, type }) => {
  const canvasRef = useRef(null);
  const [currentTheme, setCurrentTheme] = useState(
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  
  // Monitor theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setCurrentTheme(isDark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);
  
  // Get current theme colors
  const getThemeColors = () => {
    const isDark = currentTheme === 'dark';
    
    return {
      axisColor: isDark ? '#6b7280' : '#d1d5db',
      gridColor: isDark ? '#4b5563' : '#e5e7eb', 
      textColor: isDark ? '#e5e7eb' : '#374151',
      labelColor: isDark ? '#d1d5db' : '#6b7280',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      primaryBlue: isDark ? '#60a5fa' : '#3b82f6',
      lightBlue: isDark ? '#93c5fd' : '#60a5fa'
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
  }, [data, type, currentTheme]); // Add currentTheme to dependencies
  
  const drawBarChart = (ctx, data, width, height) => {
    const colors = getThemeColors();
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find max value for scaling - ensure it's never zero
    const maxValue = Math.max(...data.map(item => item.sales), 100); // Minimum scale of 100
    const barWidth = data.length > 0 ? (chartWidth / data.length) - 10 : 50;
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = colors.axisColor;
    ctx.lineWidth = 1;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw y-axis labels and horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * i;
      const y = height - padding - (chartHeight / 4) * i;
      
      // Draw grid line
      ctx.beginPath();
      ctx.strokeStyle = colors.gridColor;
      ctx.lineWidth = 1;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = colors.labelColor;
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(formatNumber(value), padding - 10, y + 3);
    }

    // Draw vertical grid lines for X-axis divisions
    data.forEach((item, index) => {
      const x = padding + index * (barWidth + 10) + barWidth / 2 + 5;
      
      // Draw vertical grid line
      ctx.beginPath();
      ctx.strokeStyle = colors.gridColor;
      ctx.lineWidth = 1;
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    });
    
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
      // Use category for category charts, month for time-based charts
      const label = item.category || item.month || item.name || '';
      ctx.fillText(label, x + barWidth / 2, height - padding + 15);
    });
  };
  
  const drawLineChart = (ctx, data, width, height) => {
    const colors = getThemeColors();
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find max value for scaling - ensure it's never zero
    const maxValue = Math.max(...data.map(item => item.sales), 100); // Minimum scale of 100
    const pointSpacing = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = colors.axisColor;
    ctx.lineWidth = 1;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw y-axis labels and horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * i;
      const y = height - padding - (chartHeight / 4) * i;
      
      // Draw grid line
      ctx.beginPath();
      ctx.strokeStyle = colors.gridColor;
      ctx.lineWidth = 1;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = colors.labelColor;
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(formatNumber(value), padding - 10, y + 3);
    }

    // Draw vertical grid lines for X-axis divisions  
    data.forEach((item, index) => {
      const x = data.length === 1 ? width / 2 : padding + index * pointSpacing;
      
      // Draw vertical grid line
      ctx.beginPath();
      ctx.strokeStyle = colors.gridColor;
      ctx.lineWidth = 1;
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    });
    
    // Only draw line and points if we have data
    if (data.length > 0) {
      // Create gradient for area under the line
      const areaGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
      areaGradient.addColorStop(0, `${colors.primaryBlue}33`); // Add transparency
      areaGradient.addColorStop(1, `${colors.primaryBlue}0D`); // More transparent
      
      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = colors.primaryBlue;
      ctx.lineWidth = 2;
      
      // Calculate positions for all points
      const points = data.map((item, index) => {
        const x = data.length === 1 ? width / 2 : padding + index * pointSpacing;
        const y = height - padding - (item.sales / maxValue) * chartHeight;
        return { x, y, item, index };
      });
      
      // Draw line connecting points
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
      
      // Fill area under the line
      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((point, index) => {
          if (index > 0) {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.lineTo(points[points.length - 1].x, height - padding);
        ctx.lineTo(points[0].x, height - padding);
        ctx.closePath();
        ctx.fillStyle = areaGradient;
        ctx.fill();
      }
      
      // Draw points and labels
      points.forEach((point) => {
        // Draw point with better contrast
        ctx.beginPath();
        ctx.fillStyle = colors.backgroundColor;
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw point border
        ctx.beginPath();
        ctx.strokeStyle = colors.primaryBlue;
        ctx.lineWidth = 3;
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner point
        ctx.beginPath();
        ctx.fillStyle = colors.primaryBlue;
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw label
        ctx.fillStyle = colors.textColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        // Use category for category charts, month for time-based charts
        const label = point.item.category || point.item.month || point.item.name || '';
        ctx.fillText(label, point.x, height - padding + 15);
      });
    }
  };
  
  const drawDoughnutChart = (ctx, data, width, height) => {
    const colors = getThemeColors();
    const isDark = currentTheme === 'dark';
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    // Calculate total for percentages - handle zero case
    const total = data.reduce((sum, item) => sum + parseFloat(item.percentage || 0), 0);
    
    // Colors for segments (theme-aware with better contrast)
    const segmentColors = isDark ? [
      '#60a5fa', // Blue
      '#34d399', // Green  
      '#a78bfa', // Purple
      '#fbbf24', // Yellow
      '#f87171', // Red
      '#fb7185', // Pink
      '#818cf8', // Indigo
      '#4dd0e1'  // Cyan
    ] : [
      '#3b82f6', // Blue
      '#059669', // Green
      '#7c3aed', // Purple
      '#d97706', // Orange
      '#dc2626', // Red
      '#db2777', // Pink
      '#4f46e5', // Indigo
      '#0891b2'  // Cyan
    ];
    
    // Handle case when no data or all zero
    if (total === 0 || data.length === 0) {
      // Draw empty circle
      ctx.beginPath();
      ctx.fillStyle = colors.gridColor;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw center hole
      ctx.beginPath();
      ctx.fillStyle = colors.backgroundColor;
      ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw "No data" text with better contrast
      ctx.fillStyle = colors.textColor;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sin datos', centerX, centerY);
      return;
    }
    
    let startAngle = -0.5 * Math.PI; // Start at top
    
    // Draw segments
    data.forEach((item, index) => {
      const percentage = parseFloat(item.percentage || 0);
      if (percentage > 0) {
        const sliceAngle = (percentage / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        
        ctx.beginPath();
        ctx.fillStyle = item.color || segmentColors[index % segmentColors.length];
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        // Only draw label if slice is big enough
        if (percentage > 5) {
          const midAngle = startAngle + sliceAngle / 2;
          const labelRadius = radius * 0.7;
          const labelX = centerX + labelRadius * Math.cos(midAngle);
          const labelY = centerY + labelRadius * Math.sin(midAngle);
          
          // Draw label background (theme-aware)
          ctx.fillStyle = isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = isDark ? 'rgba(75, 85, 99, 0.8)' : 'rgba(209, 213, 219, 0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(labelX, labelY, 14, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          
          // Draw label text
          ctx.fillStyle = isDark ? '#ffffff' : '#374151';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${percentage}%`, labelX, labelY);
        }
        
        startAngle = endAngle;
      }
    });
    
    // Draw center hole
    ctx.beginPath();
    ctx.fillStyle = colors.backgroundColor;
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw legend
    const legendX = width - 120;
    const legendY = 30;
    
    data.forEach((item, index) => {
      if (parseFloat(item.percentage || 0) > 0) {
        const y = legendY + index * 20;
        
        // Draw color box
        ctx.fillStyle = item.color || segmentColors[index % segmentColors.length];
        ctx.fillRect(legendX, y, 12, 12);
        
        // Draw label
        ctx.fillStyle = colors.textColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        const categoryName = item.category.length > 12 ? item.category.substring(0, 12) + '...' : item.category;
        ctx.fillText(categoryName, legendX + 18, y + 9);
      }
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
