/**
 * Employee Activity Utilities
 * Helper functions for formatting and displaying employee activity data
 */

/**
 * Format activity timestamp to relative time
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted relative time
 */
export const getRelativeTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now - time) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
  
  return time.toLocaleDateString('es-ES', { 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Get activity type icon
 * @param {string} type - Activity type
 * @returns {string} Unicode emoji
 */
export const getActivityIcon = (type) => {
  switch (type) {
    case 'order':
      return '📦';
    case 'maintenance':
      return '🔧';
    case 'training':
      return '🎓';
    case 'assignment':
      return '📋';
    default:
      return '📌';
  }
};

/**
 * Get status color class for activities
 * @param {string} status - Activity status
 * @returns {string} CSS class string
 */
export const getActivityStatusColor = (status) => {
  switch (status) {
    case 'completed':
    case 'delivered':
    case 'finished':
      return 'text-green-600 bg-green-50';
    case 'in_progress':
    case 'processing':
      return 'text-blue-600 bg-blue-50';
    case 'pending':
    case 'scheduled':
      return 'text-yellow-600 bg-yellow-50';
    case 'cancelled':
    case 'failed':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

/**
 * Calculate performance grade based on metrics
 * @param {Object} stats - Employee statistics
 * @returns {Object} Grade information
 */
export const calculatePerformanceGrade = (stats) => {
  const {
    completionRate = 0,
    satisfactionRate = 0,
    totalActivities = 0
  } = stats;
  
  // Calculate weighted score
  const activityWeight = Math.min(1, totalActivities / 10); // Up to 10 activities = full weight
  const score = (
    (completionRate * 0.4) + 
    (satisfactionRate * 0.4) + 
    (activityWeight * 20) // Activity volume contributes 20%
  );
  
  let grade, color, description;
  
  if (score >= 90) {
    grade = 'A+';
    color = 'text-green-600';
    description = 'Rendimiento Excelente';
  } else if (score >= 80) {
    grade = 'A';
    color = 'text-green-500';
    description = 'Muy Buen Rendimiento';
  } else if (score >= 70) {
    grade = 'B';
    color = 'text-blue-600';
    description = 'Buen Rendimiento';
  } else if (score >= 60) {
    grade = 'C';
    color = 'text-yellow-600';
    description = 'Rendimiento Regular';
  } else {
    grade = 'D';
    color = 'text-red-600';
    description = 'Necesita Mejora';
  }
  
  return {
    grade,
    color,
    description,
    score: Math.round(score)
  };
};

/**
 * Format work hours display
 * @param {number} hours - Number of hours
 * @returns {string} Formatted hours string
 */
export const formatWorkHours = (hours) => {
  if (hours === 0) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  
  const days = Math.floor(hours / 8); // 8 hours per work day
  const remainingHours = hours % 8;
  
  if (remainingHours === 0) {
    return `${days} día${days > 1 ? 's' : ''}`;
  }
  
  return `${days}d ${Math.round(remainingHours)}h`;
};

/**
 * Get activity trend indicator
 * @param {Array} activities - Recent activities array
 * @param {number} days - Period in days
 * @returns {Object} Trend information
 */
export const getActivityTrend = (activities, days = 30) => {
  if (!activities || activities.length === 0) {
    return {
      trend: 'neutral',
      message: 'Sin actividad reciente',
      icon: '📊'
    };
  }
  
  const avgActivitiesPerWeek = (activities.length / days) * 7;
  
  if (avgActivitiesPerWeek >= 5) {
    return {
      trend: 'up',
      message: 'Muy activo',
      icon: '📈'
    };
  } else if (avgActivitiesPerWeek >= 2) {
    return {
      trend: 'stable',
      message: 'Actividad normal',
      icon: '📊'
    };
  } else {
    return {
      trend: 'down',
      message: 'Actividad baja',
      icon: '📉'
    };
  }
};
