const axios = require('axios');
const API_URL = 'https://https://6de4-92-184-145-214.ngrok-free.app';

// Function to create a wishlist
async function createWishlist(title, description) {
  try {
    console.log(`Creating wishlist: ${title}`);
    console.log(`API URL: ${API_URL}/api/wishlists`);
    
    // Log request headers and body
    const requestBody = {
      title,
      description: description || '',
      isPublic: false,
      isFavorite: false
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Make the request
    const response = await axios.post(`${API_URL}/api/wishlists`, requestBody);
    
    // Log response
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error creating wishlist:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run the test
createWishlist('Debug Wishlist', 'Created from debug-api.js')
  .then(wishlist => {
    console.log('Wishlist created successfully!');
  })
  .catch(error => {
    console.error('Failed to create wishlist');
  });