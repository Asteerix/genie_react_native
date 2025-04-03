/**
 * Configuration Manager
 * 
 * This utility helps manage API configuration and easily switch between
 * local development and ngrok environments.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration file path
const CONFIG_FILE_PATH = path.join(__dirname, 'config.ts');

// Available environments
const ENVIRONMENTS = {
  LOCAL: {
    name: 'local',
    url: 'https://https://6de4-92-184-145-214.ngrok-free.app'
  },
  NGROK: {
    name: 'ngrok',
    url: 'https://6de4-92-184-145-214.ngrok-free.app'
  }
};

/**
 * Updates the config.ts file with the specified API base URL
 */
function updateConfig(environment: 'local' | 'ngrok' | string): void {
  let apiBaseUrl: string;
  
  // Determine which environment to use
  if (environment === 'local') {
    apiBaseUrl = ENVIRONMENTS.LOCAL.url;
    console.log(`Switching to LOCAL environment (${apiBaseUrl})`);
  } else if (environment === 'ngrok') {
    apiBaseUrl = ENVIRONMENTS.NGROK.url;
    console.log(`Switching to NGROK environment (${apiBaseUrl})`);
  } else {
    // Custom URL
    apiBaseUrl = environment;
    console.log(`Setting custom API URL: ${apiBaseUrl}`);
  }

  // Generate config file content
  const configContent = `// Configuration de l'API
export const API_BASE_URL = '${apiBaseUrl}';

// Pour compatibilité avec require() dans des scripts Node.js
module.exports = {
  API_BASE_URL
};
`;

  // Write to file
  fs.writeFileSync(CONFIG_FILE_PATH, configContent);
  console.log(`✅ Configuration updated successfully!`);
}

// Check command-line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Current configuration:');
  
  try {
    const currentConfig = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    const urlMatch = currentConfig.match(/API_BASE_URL = '(.+?)'/);
    if (urlMatch && urlMatch[1]) {
      console.log(`API_BASE_URL: ${urlMatch[1]}`);
      
      if (urlMatch[1] === ENVIRONMENTS.LOCAL.url) {
        console.log('Environment: LOCAL');
      } else if (urlMatch[1] === ENVIRONMENTS.NGROK.url) {
        console.log('Environment: NGROK');
      } else {
        console.log('Environment: CUSTOM');
      }
    }
  } catch (error) {
    console.error('Error reading config file:', error);
  }
  
  console.log('\nUsage:');
  console.log('  npx ts-node config-manager.ts local     # Switch to local environment');
  console.log('  npx ts-node config-manager.ts ngrok     # Switch to ngrok environment');
  console.log('  npx ts-node config-manager.ts <url>     # Set custom API URL');
} else {
  updateConfig(args[0]);
}