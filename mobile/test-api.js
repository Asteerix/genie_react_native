import axios from 'axios';
import { API_BASE_URL } from './config.js';

// Initialize API URL
const API_URL = `${API_BASE_URL}/api`;

console.log(`Testing API connection to: ${API_URL}`);

// Test health endpoint
async function testHealth() {
  try {
    console.log(`Attempting to connect to: ${API_BASE_URL}/health`);
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('✅ Health check successful:', response.data);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('❌ Health check failed with status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
    } else if (error instanceof Error) {
      console.error('❌ Health check failed:', error.message);
    } else {
      console.error('❌ Health check failed:', String(error));
    }
    return false;
  }
}

// Test auth check endpoint
async function testAuthCheck() {
  try {
    const response = await axios.post(`${API_URL}/auth/check`, {
      emailOrPhone: 'janesmith@example.com'
    });
    console.log('✅ Auth check successful:', response.data);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('❌ Auth check failed with status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    } else if (error instanceof Error) {
      console.error('❌ Auth check failed:', error.message);
    } else {
      console.error('❌ Auth check failed:', String(error));
    }
    return false;
  }
}

// Test signin endpoint
async function testSignIn() {
  try {
    const response = await axios.post(`${API_URL}/auth/signin`, {
      emailOrPhone: 'janesmith@example.com',
      password: 'StrongPass123'
    });
    console.log('✅ Sign in successful!');
    // Don't log the whole response as it contains tokens
    console.log(`  User: ${response.data.user.firstName} ${response.data.user.lastName}`);
    return response.data;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('❌ Sign in failed with status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    } else if (error instanceof Error) {
      console.error('❌ Sign in failed:', error.message);
    } else {
      console.error('❌ Sign in failed:', String(error));
    }
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('=== STARTING API TESTS ===');
  
  // Test basic health endpoint
  const healthOk = await testHealth();
  if (!healthOk) {
    console.error('Health check failed. Aborting other tests.');
    return;
  }
  
  // Test auth check endpoint
  const authCheckOk = await testAuthCheck();
  if (!authCheckOk) {
    console.error('Auth check failed. Aborting other tests.');
    return;
  }
  
  // Test signin endpoint
  const signinData = await testSignIn();
  if (!signinData) {
    console.error('Sign in failed. Aborting other tests.');
    return;
  }
  
  console.log('\n=== ALL TESTS COMPLETED ===');
  console.log('✅ API connection verified successfully!');
}

runTests();