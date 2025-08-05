// Test script to create reviews table and add sample data
import { supabase } from '../supabaseClient';

export const initializeReviewsTable = async () => {
  try {

    
    // Create the reviews table
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
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
            responded_by UUID REFERENCES auth.users(id),
            
            -- Tracking and timestamps
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            created_by UUID REFERENCES auth.users(id),
            
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
        CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

        -- Enable RLS
        ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY IF NOT EXISTS "Reviews are viewable by authenticated users" ON reviews
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY IF NOT EXISTS "Reviews can be created by authenticated users" ON reviews
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY IF NOT EXISTS "Reviews can be updated by authenticated users" ON reviews
            FOR UPDATE USING (auth.role() = 'authenticated');

        CREATE POLICY IF NOT EXISTS "Reviews can be deleted by authenticated users" ON reviews
            FOR DELETE USING (auth.role() = 'authenticated');
      `
    });

    if (error) {
      console.error('Error creating reviews table:', error);
      return false;
    }



    // Add sample data
    const sampleReviews = [
      {
        review_type: 'general',
        title: 'Excelente servicio al cliente',
        content: 'El equipo de AquaLiquim siempre responde rápidamente a nuestras consultas y necesidades. Muy profesionales.',
        rating: 5,
        status: 'approved',
        is_public: true,
        source: 'internal',
        tags: ['servicio-cliente', 'comunicacion'],
        priority: 'medium'
      },
      {
        review_type: 'general',
        title: 'Productos de alta calidad',
        content: 'Los químicos que compramos siempre llegan en perfectas condiciones y con excelente calidad.',
        rating: 5,
        status: 'approved',
        is_public: true,
        source: 'internal',
        tags: ['calidad', 'productos'],
        priority: 'medium'
      },
      {
        review_type: 'general',
        title: 'Entrega rápida',
        content: 'Siempre cumplen con los tiempos de entrega acordados. Muy confiables.',
        rating: 4,
        status: 'approved',
        is_public: true,
        source: 'internal',
        tags: ['entrega', 'puntualidad'],
        priority: 'medium'
      },
      {
        review_type: 'service',
        title: 'Mantenimiento de piscina excelente',
        content: 'El técnico llegó puntual y realizó un trabajo impecable. La piscina quedó cristalina.',
        rating: 5,
        status: 'pending',
        is_public: false,
        source: 'internal',
        tags: ['mantenimiento', 'piscina'],
        priority: 'high'
      },
      {
        review_type: 'general',
        title: 'Precios competitivos',
        content: 'Los precios son justos para la calidad de productos y servicios que ofrecen.',
        rating: 4,
        status: 'approved',
        is_public: true,
        source: 'internal',
        tags: ['precios', 'valor'],
        priority: 'low'
      },
      {
        review_type: 'general',
        title: 'Necesita mejorar comunicación',
        content: 'A veces es difícil contactarlos por teléfono. Deberían tener más líneas disponibles.',
        rating: 3,
        status: 'pending',
        is_public: false,
        source: 'internal',
        tags: ['comunicacion', 'telefono'],
        priority: 'medium'
      }
    ];

    // Insert sample reviews
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .insert(sampleReviews);

    if (reviewsError) {
      console.error('Error inserting sample reviews:', reviewsError);
      return false;
    }


    return true;

  } catch (error) {
    console.error('Error initializing reviews table:', error);
    return false;
  }
};

// Run the initialization if called directly
if (typeof window !== 'undefined') {
  window.initializeReviewsTable = initializeReviewsTable;
}
