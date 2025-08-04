import React, { useState, useEffect } from 'react';
import { reviewService } from '../services/reviewService';
import VenetianTile from './VenetianTile';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    review_type: '',
    rating: '',
    priority: ''
  });
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [filters]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getReviews(filters);
      setReviews(data);
    } catch (err) {
      setError('Error al cargar las reseñas');
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await reviewService.getReviewStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
      // Set default stats structure to prevent component crashes
      setStats({
        total: 0,
        averageRating: 0,
        statusDistribution: {
          pending: 0,
          approved: 0,
          rejected: 0
        },
        recentReviews: 0
      });
    }
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      await reviewService.updateReviewStatus(reviewId, newStatus);
      loadReviews();
      loadStats();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleTogglePublic = async (reviewId, isPublic) => {
    try {
      await reviewService.togglePublicStatus(reviewId, !isPublic);
      loadReviews();
    } catch (err) {
      console.error('Error toggling public status:', err);
    }
  };

  const handleToggleFeatured = async (reviewId, isFeatured) => {
    try {
      await reviewService.toggleFeaturedStatus(reviewId, !isFeatured);
      loadReviews();
    } catch (err) {
      console.error('Error toggling featured status:', err);
    }
  };

  const handleResponse = async (reviewId, response) => {
    try {
      await reviewService.respondToReview(reviewId, response);
      setShowResponseModal(false);
      setSelectedReview(null);
      loadReviews();
    } catch (err) {
      console.error('Error responding to review:', err);
    }
  };

  const getRatingStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900',
      approved: 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900',
      rejected: 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900',
      archived: 'text-muted-foreground bg-secondary'
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Gestión de Reseñas</h1>
          <p className="text-muted-foreground">Administra las reseñas y comentarios de los clientes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nueva Reseña
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <VenetianTile className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Reseñas</p>
                <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </VenetianTile>

          <VenetianTile className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold text-primary">
                  {stats?.averageRating && !isNaN(stats.averageRating) 
                    ? Number(stats.averageRating).toFixed(1) 
                    : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">{getRatingStars(Math.round(Number(stats?.averageRating) || 0))}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </VenetianTile>

          <VenetianTile className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-primary">{stats?.statusDistribution?.pending || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </VenetianTile>

          <VenetianTile className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold text-primary">{stats?.recentReviews || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}

      {/* Filters */}
      <VenetianTile className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
              <option value="archived">Archivada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filters.review_type}
              onChange={(e) => setFilters({...filters, review_type: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="service">Servicio</option>
              <option value="product">Producto</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calificación</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option value="5">5 Estrellas</option>
              <option value="4">4 Estrellas</option>
              <option value="3">3 Estrellas</option>
              <option value="2">2 Estrellas</option>
              <option value="1">1 Estrella</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Prioridad</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="w-full venetian-border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 venetian-bg"
            >
              <option value="">Todas</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
        </div>
      </VenetianTile>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{review.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                    {review.status === 'pending' ? 'Pendiente' : 
                     review.status === 'approved' ? 'Aprobada' :
                     review.status === 'rejected' ? 'Rechazada' : 'Archivada'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(review.priority)}`}>
                    {review.priority === 'urgent' ? 'Urgente' :
                     review.priority === 'high' ? 'Alta' :
                     review.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>{getRatingStars(review.rating)} ({review.rating}/5)</span>
                  <span>Tipo: {review.review_type === 'service' ? 'Servicio' : review.review_type === 'product' ? 'Producto' : 'General'}</span>
                  {review.client?.name && <span>Cliente: {review.client.name}</span>}
                  <span>{formatDate(review.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {review.is_public && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Público
                  </span>
                )}
                {review.is_featured && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Destacada
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-700 mb-4">{review.content}</p>

            {review.tags && review.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {review.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {review.response && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Respuesta de la empresa:</span>
                  <span className="text-xs text-gray-500">{formatDate(review.response_date)}</span>
                </div>
                <p className="text-sm text-gray-700">{review.response}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <select
                  value={review.status}
                  onChange={(e) => handleStatusChange(review.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobar</option>
                  <option value="rejected">Rechazar</option>
                  <option value="archived">Archivar</option>
                </select>

                <button
                  onClick={() => handleTogglePublic(review.id, review.is_public)}
                  className={`text-sm px-3 py-1 rounded transition-colors ${
                    review.is_public 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {review.is_public ? 'Ocultar' : 'Hacer Público'}
                </button>

                <button
                  onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                  className={`text-sm px-3 py-1 rounded transition-colors ${
                    review.is_featured
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {review.is_featured ? 'Quitar Destacado' : 'Destacar'}
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedReview(review);
                  setShowResponseModal(true);
                }}
                className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
              >
                {review.response ? 'Editar Respuesta' : 'Responder'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay reseñas</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza agregando una nueva reseña.</p>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <ResponseModal
          review={selectedReview}
          onSave={handleResponse}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedReview(null);
          }}
        />
      )}

      {/* Add Review Modal */}
      {showAddModal && (
        <AddReviewModal
          onSave={loadReviews}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

// Response Modal Component
const ResponseModal = ({ review, onSave, onClose }) => {
  const [response, setResponse] = useState(review.response || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (response.trim()) {
      onSave(review.id, response);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Responder a la Reseña
        </h3>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">{review.title}</h4>
          <p className="text-gray-700 mt-1">{review.content}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu respuesta
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escribe tu respuesta aquí..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Enviar Respuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Review Modal Component
const AddReviewModal = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 5,
    review_type: 'general',
    priority: 'medium',
    tags: '',
    source: 'internal'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const reviewData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      await reviewService.createReview(reviewData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating review:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Nueva Reseña
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={formData.review_type}
                onChange={(e) => setFormData({...formData, review_type: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="service">Servicio</option>
                <option value="product">Producto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calificación</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={5}>5 Estrellas</option>
                <option value={4}>4 Estrellas</option>
                <option value={3}>3 Estrellas</option>
                <option value={2}>2 Estrellas</option>
                <option value={1}>1 Estrella</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas (separadas por comas)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="servicio, calidad, puntualidad"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Crear Reseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewsPage;
