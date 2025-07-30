import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const handleGoHome = () => {
    if (session) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
          <div className="text-6xl mb-4">🔍</div>
        </div>
        
        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-2">
            The page you're looking for doesn't exist.
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {location.pathname}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {session ? 'Go to Dashboard' : 'Go to Login'}
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        {session && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Quick navigation:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/products')}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Products
              </button>
              <button
                onClick={() => navigate('/clients')}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Clients
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
