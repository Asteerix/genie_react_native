/**
 * Switch Environment Script
 * This is a simple script to help switch between local and ngrok environments
 */

// Available environments
const ENVIRONMENTS = {
  LOCAL: {
    name: 'local',
    url: 'https://http://217.182.129.10:8081'
  },
  NGROK: {
    name: 'ngrok',
    url: 'http://217.182.129.10:8081'
  }
};

// Get environment from command-line args
const args = process.argv.slice(2);
const env = args[0] || '';

function showHelp() {
  console.log('Switch API Environment Tool');
  console.log('---------------------------');
  console.log('Usage:');
  console.log('  node switch-env.js local     # Switch to local environment');
  console.log('  node switch-env.js ngrok     # Switch to ngrok environment');
  console.log('  node switch-env.js custom    # Set custom API URL');
  console.log('');
}

if (env === 'local') {
  generateConfig(ENVIRONMENTS.LOCAL.url);
} else if (env === 'ngrok') {
  generateConfig(ENVIRONMENTS.NGROK.url);
} else if (env === 'custom') {
  console.log('Enter your custom API URL:');
  process.stdin.once('data', (data) => {
    const customUrl = data.toString().trim();
    if (customUrl) {
      generateConfig(customUrl);
    } else {
      console.log('No URL provided. Exiting.');
    }
  });
} else {
  showHelp();
}

function generateConfig(apiUrl) {
  console.log(`\nConfiguring for API URL: ${apiUrl}\n`);

  const configContent = `// Configuration de l'API
export const API_BASE_URL = '${apiUrl}';

// Pour compatibilité avec require() dans des scripts Node.js
module.exports = {
  API_BASE_URL
};
`;

  console.log('Replace the contents of config.ts with:');
  console.log('-------------------------------------');
  console.log(configContent);
  console.log('-------------------------------------');
  
  if (env !== 'custom') {
    process.exit(0);
  }
}