import React from 'react';
import VenetianTile from './VenetianTile';

const DashboardStatsCard = ({ title, value, change, icon, color, onClick }) => {
  // Define color classes based on the color prop
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      iconBg: 'bg-purple-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      iconBg: 'bg-amber-100'
    }
  };

  const classes = colorClasses[color] || colorClasses.blue;
  
  // Determine if change is positive or negative
  const isPositive = change >= 0;
  
  return (
    <VenetianTile className={`p-6 cursor-pointer ${onClick ? 'hover:shadow-lg transition-shadow' : ''}`} onClick={onClick}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-blue-800">{value}</h3>
          
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-3 w-3 ml-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d={isPositive 
                    ? "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" 
                    : "M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
                  } 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-xs text-gray-500 ml-1">vs. anterior</span>
            </div>
          )}
        </div>
        
        <div className={`${classes.iconBg} ${classes.text} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </VenetianTile>
  );
};

export default DashboardStatsCard;