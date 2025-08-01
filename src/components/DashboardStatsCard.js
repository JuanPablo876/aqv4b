import React from 'react';
import VenetianTile from './VenetianTile';

const DashboardStatsCard = ({ title, value, change, icon, color, onClick }) => {
  // Define color classes based on the color prop - using CSS variables
  const colorClasses = {
    blue: {
      bg: 'bg-secondary',
      text: 'text-secondary-foreground',
      iconBg: 'bg-accent'
    },
    green: {
      bg: 'bg-secondary',
      text: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-accent'
    },
    teal: {
      bg: 'bg-secondary',
      text: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-accent'
    },
    amber: {
      bg: 'bg-secondary',
      text: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-accent'
    }
  };

  const classes = colorClasses[color] || colorClasses.blue;
  
  // Determine if change is positive or negative
  // Handle both number and string formats for change
  const isPositive = typeof change === 'string' 
    ? change.startsWith('+') || (!change.startsWith('-') && parseFloat(change) >= 0)
    : change >= 0;
  
  return (
    <VenetianTile className={`p-6 cursor-pointer ${onClick ? 'hover:shadow-lg transition-shadow' : ''}`} onClick={onClick}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-primary">{value}</h3>
          
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {typeof change === 'string' ? change : `${isPositive ? '+' : ''}${change}%`}
              </span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-3 w-3 ml-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} 
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
              <span className="text-xs text-muted-foreground ml-1">vs. anterior</span>
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
