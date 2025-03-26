import axios from 'axios';
import { API_BASE_URL } from './config';

// Initialize API URL
const API_URL = `${API_BASE_URL}/api`;

console.log(`Testing API connection to: ${API_URL}`);

// Define response types
interface HealthResponse {
  status: string;
  time: string;
}

interface AuthCheckResponse {
  exists: boolean;
}

// Type guard for error with response property
interface AxiosLikeError {
  response?: { 
    status?: number; 
    data?: any 
  };
  message: string;
}

function isAxiosLikeError(error: any): error is AxiosLikeError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'response' in error && 
    typeof error.message === 'string'
  );
}

// Test health endpoint
async function testHealth(): Promise<boolean> {
  try {
    console.log(`Attempting to connect to: ${API_BASE_URL}/health`);
    const response = await axios.get<HealthResponse>(`${API_BASE_URL}/health`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('✅ Health check successful:', response.data);
    return true;
  } catch (error: any) {
    if (isAxiosLikeError(error)) {
      console.error('❌ Health check failed with status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
    } else {
      console.error('❌ Health check failed:', error?.message || String(error));
    }
    return false;
  }
}

// Test auth check endpoint
async function testAuthCheck(): Promise<boolean> {
  try {
    const response = await axios.post<AuthCheckResponse>(`${API_URL}/auth/check`, {
      emailOrPhone: 'janesmith@example.com'
    });
    console.log('✅ Auth check successful:', response.data);
    return true;
  } catch (error: any) {
    if (isAxiosLikeError(error)) {
      console.error('❌ Auth check failed with status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    } else {
      console.error('❌ Auth check failed:', error?.message || String(error));
    }
    return false;
  }
}

// Define response type for sign in
interface SignInResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    gender?: string;
    birthDate?: string;
    isVerified: boolean;
    isTwoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
  };
}

// Test signin endpoint
async function testSignIn(): Promise<SignInResponse | null> {
  try {
    const response = await axios.post<SignInResponse>(`${API_URL}/auth/signin`, {
      emailOrPhone: 'janesmith@example.com',
      password: 'StrongPass123'
    });
    console.log('✅ Sign in successful!');
    // Don't log the whole response as it contains tokens
    console.log(`  User: ${response.data.user.firstName} ${response.data.user.lastName}`);
    return response.data;
  } catch (error: any) {
    if (isAxiosLikeError(error)) {
      console.error('❌ Sign in failed with status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    } else {
      console.error('❌ Sign in failed:', error?.message || String(error));
    }
    return null;
  }
}

// Run tests
async function runTests(): Promise<void> {
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