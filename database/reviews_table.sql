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
    responded_by UUID REFERENCES auth.users(id),
    
    -- Tracking and timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Reviews are viewable by authenticated users" ON reviews
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Reviews can be created by authenticated users" ON reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Reviews can be updated by authenticated users" ON reviews
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Reviews can be deleted by authenticated users" ON reviews
    FOR DELETE USING (auth.role() = 'authenticated');

-- Sample data for testing
INSERT INTO reviews (review_type, title, content, rating, status, is_public, source, tags, priority) VALUES
('general', 'Excelente servicio al cliente', 'El equipo de AquaLiquim siempre responde rápidamente a nuestras consultas y necesidades. Muy profesionales.', 5, 'approved', true, 'internal', ARRAY['servicio-cliente', 'comunicacion'], 'medium'),
('general', 'Productos de alta calidad', 'Los químicos que compramos siempre llegan en perfectas condiciones y con excelente calidad.', 5, 'approved', true, 'internal', ARRAY['calidad', 'productos'], 'medium'),
('general', 'Entrega rápida', 'Siempre cumplen con los tiempos de entrega acordados. Muy confiables.', 4, 'approved', true, 'internal', ARRAY['entrega', 'puntualidad'], 'medium'),
('service', 'Mantenimiento de piscina excelente', 'El técnico llegó puntual y realizó un trabajo impecable. La piscina quedó cristalina.', 5, 'pending', false, 'internal', ARRAY['mantenimiento', 'piscina'], 'high'),
('general', 'Precios competitivos', 'Los precios son justos para la calidad de productos y servicios que ofrecen.', 4, 'approved', true, 'internal', ARRAY['precios', 'valor'], 'low'),
('general', 'Necesita mejorar comunicación', 'A veces es difícil contactarlos por teléfono. Deberían tener más líneas disponibles.', 3, 'pending', false, 'internal', ARRAY['comunicacion', 'telefono'], 'medium');

COMMENT ON TABLE reviews IS 'Customer reviews and feedback for services, products, and general business operations';
