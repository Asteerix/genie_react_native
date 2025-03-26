/**
 * Test script to demonstrate enhanced logging
 * 
 * This script performs a series of API operations to show the detailed logging 
 * we've added in both the frontend and backend.
 */

import { authApi, managedAccountsApi } from './services/api';
import logger from './utils/logger';

// Simple wrapper to catch and log errors
const runTest = async (name, testFn) => {
  logger.info(`Running test: ${name}`);
  try {
    await testFn();
    logger.info(`Test completed: ${name}`);
  } catch (error) {
    logger.error(`Test failed: ${name}`, { error: error.message });
  }
};

// Main test function
export const runLoggingTests = async () => {
  logger.info('=== Starting API Logging Tests ===');
  
  // Test 1: Check if user exists
  await runTest('Check User Exists', async () => {
    logger.info('Testing user existence check API');
    const result = await authApi.checkUserExists('test@example.com');
    logger.info('User check result', result);
  });
  
  // Test 2: Failed login (will trigger error logging)
  await runTest('Failed Login', async () => {
    logger.info('Testing failed login (intentional)');
    try {
      await authApi.signIn('test@example.com', 'wrongpassword');
    } catch (err) {
      // This error is expected
      logger.info('Got expected authentication error', { message: err.message });
      throw err; // Rethrow to show error logging
    }
  });
  
  // Test 3: Try to get managed accounts (will trigger auth middleware)
  await runTest('Get Managed Accounts', async () => {
    logger.info('Testing managed accounts API');
    try {
      const accounts = await managedAccountsApi.getAccounts();
      logger.info('Retrieved accounts', { count: accounts.length });
    } catch (err) {
      // This error is expected if not logged in
      logger.info('Got expected authorization error', { message: err.message });
      throw err;
    }
  });
  
  // Test 4: Health check endpoint
  await runTest('Health Check', async () => {
    const axios = (await import('axios')).default;
    const response = await axios.get('http://localhost:8080/health');
    logger.info('Health check response', response.data);
  });
  
  logger.info('=== API Logging Tests Complete ===');
};

// Export a function to run from App.tsx
export default runLoggingTests;