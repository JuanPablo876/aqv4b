// Utility function to generate placeholder images without external dependencies

// Generate a placeholder image as a data URL
export const generatePlaceholderImage = (width = 150, height = 150, text = `${width}x${height}`, bgColor = '#ddd', textColor = '#999') => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial" font-size="14" fill="${textColor}" text-anchor="middle" dy=".3em">${text}</text>
</svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Pre-generated common placeholder images
export const PLACEHOLDER_IMAGES = {
  product: generatePlaceholderImage(150, 150, 'Producto'),
  avatar: generatePlaceholderImage(40, 40, 'Avatar', '#e5e5e5', '#aaa'),
  large: generatePlaceholderImage(300, 200, 'Imagen', '#f0f0f0', '#bbb'),
  square: generatePlaceholderImage(100, 100, '100x100'),
  thumbnail: generatePlaceholderImage(50, 50, '50x50', '#eee', '#ccc')
};

// Default product placeholder
export const DEFAULT_PRODUCT_IMAGE = PLACEHOLDER_IMAGES.product;

export default {
  generatePlaceholderImage,
  PLACEHOLDER_IMAGES,
  DEFAULT_PRODUCT_IMAGE
};
