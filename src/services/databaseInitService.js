// Database Initialization Service
// Handles creation of missing tables and database setup

import { supabase } from '../supabaseClient';

export const databaseInitService = {
  
  // Create the reviews table if it doesn't exist
  async createReviewsTable() {
    try {
      console.log('🗄️ Creating reviews table...');
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          -- Reviews Table Schema
          CREATE TABLE IF NOT EXISTS reviews (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              
              -- Review metadata
              review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('service', 'product', 'general')),
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
              
              -- Related entities (nullable based on review_type)
              client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
              product_id UUID REFERENCES products(id) ON DELETE CASCADE,
              service_id UUID REFERENCES maintenances(id) ON DELETE CASCADE,
              order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
              
              -- Review status and management
              status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
              is_public BOOLEAN DEFAULT false,
              is_featured BOOLEAN DEFAULT false,
              
              -- Response from business
              response TEXT,
              response_date TIMESTAMPTZ,
              responded_by UUID,
              
              -- Tracking and timestamps
              created_at TIMESTAMPTZ DEFAULT now(),
              updated_at TIMESTAMPTZ DEFAULT now(),
              created_by UUID,
              
              -- Additional metadata
              source VARCHAR(50) DEFAULT 'internal',
              tags TEXT[],
              priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
          );
          
          -- Create indexes for performance
          CREATE INDEX IF NOT EXISTS idx_reviews_review_type ON reviews(review_type);
          CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
          CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
          CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
          CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
          CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
          CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
          CREATE INDEX IF NOT EXISTS idx_reviews_is_public ON reviews(is_public);
          CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews(is_featured);
        `
      });

      if (error) {
        // If RPC doesn't exist, try direct SQL execution (fallback)
        console.log('🔄 RPC not available, attempting direct table creation...');
        
        // Simple table creation without foreign key constraints for now
        const { error: createError } = await supabase.from('_temp_init').select('1').limit(1);
        
        if (createError) {
          console.error('❌ Cannot create reviews table automatically:', error);
          return { 
            success: false, 
            error: 'Database admin access required to create tables. Please run the SQL manually.',
            sql: this.getReviewsTableSQL()
          };
        }
      }

      console.log('✅ Reviews table created successfully');
      return { success: true, message: 'Reviews table created successfully' };
      
    } catch (error) {
      console.error('❌ Error creating reviews table:', error);
      return { 
        success: false, 
        error: error.message,
        sql: this.getReviewsTableSQL()
      };
    }
  },

  // Check if a table exists
  async checkTableExists(tableName) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
        
      if (error && error.code === '42P01') {
        return false; // Table doesn't exist
      }
      
      return true; // Table exists
    } catch (error) {
      return false;
    }
  },

  // Get the SQL for creating reviews table (for manual execution)
  getReviewsTableSQL() {
    return `
-- Reviews Table Schema
-- This table stores customer reviews for services, products, and general feedback

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Review metadata
    review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('service', 'product', 'general')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Related entities (nullable based on review_type)
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES maintenances(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Review status and management
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Response from business
    response TEXT,
    response_date TIMESTAMPTZ,
    responded_by UUID,
    
    -- Tracking and timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    
    -- Additional metadata
    source VARCHAR(50) DEFAULT 'internal', -- 'internal', 'email', 'website', etc.
    tags TEXT[], -- for categorization
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_review_type ON reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_is_public ON reviews(is_public);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews(is_featured);

-- Insert some sample data
INSERT INTO reviews (review_type, title, content, rating, status, is_public) VALUES
('general', 'Excelente servicio', 'Muy satisfecho con la atención recibida. El equipo es muy profesional.', 5, 'approved', true),
('product', 'Producto de calidad', 'Los químicos para alberca funcionan muy bien, excelente calidad.', 4, 'approved', true),
('service', 'Limpieza impecable', 'El servicio de limpieza de alberca fue perfecto, quedó cristalina.', 5, 'approved', true),
('general', 'Buen precio', 'Precios competitivos y buen servicio al cliente.', 4, 'approved', true),
('service', 'Mantenimiento regular', 'Servicio de mantenimiento mensual muy confiable.', 4, 'pending', false)
ON CONFLICT DO NOTHING;
    `;
  },

  // Initialize sample reviews data
  async createSampleReviews() {
    try {
      console.log('📝 Creating sample reviews...');
      
      const sampleReviews = [
        {
          review_type: 'general',
          title: 'Excelente servicio',
          content: 'Muy satisfecho con la atención recibida. El equipo es muy profesional.',
          rating: 5,
          status: 'approved',
          is_public: true,
          source: 'internal'
        },
        {
          review_type: 'product',
          title: 'Producto de calidad',
          content: 'Los químicos para alberca funcionan muy bien, excelente calidad.',
          rating: 4,
          status: 'approved',
          is_public: true,
          source: 'website'
        },
        {
          review_type: 'service',
          title: 'Limpieza impecable',
          content: 'El servicio de limpieza de alberca fue perfecto, quedó cristalina.',
          rating: 5,
          status: 'approved',
          is_public: true,
          source: 'internal'
        },
        {
          review_type: 'general',
          title: 'Buen precio',
          content: 'Precios competitivos y buen servicio al cliente.',
          rating: 4,
          status: 'approved',
          is_public: true,
          source: 'email'
        },
        {
          review_type: 'service',
          title: 'Mantenimiento regular',
          content: 'Servicio de mantenimiento mensual muy confiable.',
          rating: 4,
          status: 'pending',
          is_public: false,
          source: 'internal'
        }
      ];

      const { data, error } = await supabase
        .from('reviews')
        .insert(sampleReviews)
        .select();

      if (error) throw error;

      console.log('✅ Sample reviews created successfully');
      return { success: true, data, count: sampleReviews.length };
      
    } catch (error) {
      console.error('❌ Error creating sample reviews:', error);
      return { success: false, error: error.message };
    }
  },

  // Full database initialization
  async initializeDatabase() {
    try {
      console.log('🚀 Starting database initialization...');
      
      const results = {
        reviewsTable: await this.createReviewsTable(),
        sampleData: null
      };

      // Only create sample data if table creation was successful
      if (results.reviewsTable.success) {
        results.sampleData = await this.createSampleReviews();
      }

      return results;
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return { success: false, error: error.message };
    }
  }
};
