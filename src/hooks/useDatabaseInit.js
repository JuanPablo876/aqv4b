// Database initialization hook
import { useEffect, useState } from 'react';
import databaseService from '../services/databaseService';

export const useDatabaseInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await databaseService.initialize();
        
        setIsInitialized(true);

      } catch (err) {
        console.error('❌ Database initialization failed:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  return { isInitialized, isLoading, error };
};
