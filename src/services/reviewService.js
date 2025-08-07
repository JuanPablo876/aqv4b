// Review Service - Handles all review-related operations
import { supabase } from '../supabaseClient';
import authManager from './authManager';

export const reviewService = {
  // Get all reviews with optional filters
  async getReviews(filters = {}) {
    try {
      // Check if reviews table exists by doing a simple query first
      const { count, error: countError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        if (countError.code === '42P01') {
          // Table doesn't exist
          console.warn('Reviews table does not exist. Please run the database migration.');
          return [];
        }
        throw countError;
      }

      let query = supabase
        .from('reviews')
        .select(`
          *,
          client:clients(name, email),
          product:products(name),
          service:maintenances(service_type, notes),
          order:orders(order_number)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.review_type) {
        query = query.eq('review_type', filters.review_type);
      }
      if (filters.rating) {
        query = query.eq('rating', filters.rating);
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }
      if (filters.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      
      // Return empty array for missing table instead of throwing
      if (error.code === '42P01') {
        console.warn('Reviews table not found. Please run database migrations.');
        return [];
      }
      
      throw error;
    }
  },

  // Get review statistics
  async getReviewStats() {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating, status, review_type, created_at');

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, return default stats
          console.warn('Reviews table does not exist. Returning default stats.');
          return {
            total: 0,
            averageRating: 0,
            statusCounts: { pending: 0, approved: 0, rejected: 0, archived: 0 },
            typeCounts: { service: 0, product: 0, general: 0 },
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            monthlyTrend: []
          };
        }
        throw error;
      }

      const stats = {
        total: reviews.length,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        statusDistribution: { pending: 0, approved: 0, rejected: 0, archived: 0 },
        typeDistribution: { service: 0, product: 0, general: 0 },
        recentReviews: 0 // last 30 days
      };

      if (reviews.length > 0) {
        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        stats.averageRating = (totalRating / reviews.length).toFixed(1);

        // Calculate distributions
        reviews.forEach(review => {
          stats.ratingDistribution[review.rating]++;
          stats.statusDistribution[review.status]++;
          stats.typeDistribution[review.review_type]++;

          // Count recent reviews (last 30 days)
          const reviewDate = new Date(review.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (reviewDate > thirtyDaysAgo) {
            stats.recentReviews++;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  },

  // Create a new review
  async createReview(reviewData) {
    try {
      // Use AuthManager instead of direct supabase.auth.getUser()
      const user = await authManager.getCurrentUser();
      
      const newReview = {
        ...reviewData,
        created_by: user?.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert([newReview])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Update a review
  async updateReview(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  // Delete a review
  async deleteReview(id) {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  // Respond to a review
  async respondToReview(id, response) {
    try {
      // Use AuthManager instead of direct supabase.auth.getUser()
      const user = await authManager.getCurrentUser();
      
      const { data, error } = await supabase
        .from('reviews')
        .update({
          response,
          response_date: new Date().toISOString(),
          responded_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error responding to review:', error);
      throw error;
    }
  },

  // Update review status
  async updateReviewStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating review status:', error);
      throw error;
    }
  },

  // Toggle review public status
  async togglePublicStatus(id, isPublic) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling public status:', error);
      throw error;
    }
  },

  // Toggle featured status
  async toggleFeaturedStatus(id, isFeatured) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          is_featured: isFeatured,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling featured status:', error);
      throw error;
    }
  },

  // Get public reviews for external display
  async getPublicReviews(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          content,
          rating,
          review_type,
          created_at,
          response,
          response_date,
          tags,
          client:clients(name)
        `)
        .eq('status', 'approved')
        .eq('is_public', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching public reviews:', error);
      throw error;
    }
  },

  // Get reviews by rating
  async getReviewsByRating(rating) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('rating', rating)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reviews by rating:', error);
      throw error;
    }
  }
};
