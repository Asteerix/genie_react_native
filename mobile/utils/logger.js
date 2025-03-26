/**
 * Logger utility for mobile app
 * 
 * This utility provides detailed logging for API calls, responses,
 * and application events with timestamp and structured data.
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

// Set this to false in production
const VERBOSE = true;

// ANSI color codes for terminal output
const COLORS = {
  RESET: '\x1b[0m',
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  REQUEST: '\x1b[35m', // Magenta
  RESPONSE: '\x1b[34m', // Blue
  TIMESTAMP: '\x1b[90m' // Gray
};

/**
 * Format a log entry with timestamp, level, and structured data
 */
function formatLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const dataStr = Object.keys(data).length > 0 
    ? `\n${JSON.stringify(data, null, 2)}` 
    : '';
    
  return `${COLORS.TIMESTAMP}[${timestamp}]${COLORS.RESET} ${COLORS[level]}[${level}]${COLORS.RESET} ${message}${dataStr}`;
}

/**
 * Format API request details
 */
function formatRequest(method, url, data) {
  return formatLog('REQUEST', `${method} ${url}`, data);
}

/**
 * Format API response details
 */
function formatResponse(method, url, status, data, duration) {
  return formatLog('RESPONSE', `${method} ${url} (${status}) - ${duration}ms`, data);
}

/**
 * Main logger class
 */
class Logger {
  debug(message, data) {
    if (VERBOSE) {
      console.log(formatLog(LOG_LEVELS.DEBUG, message, data));
    }
  }
  
  info(message, data) {
    console.log(formatLog(LOG_LEVELS.INFO, message, data));
  }
  
  warn(message, data) {
    console.warn(formatLog(LOG_LEVELS.WARN, message, data));
  }
  
  error(message, data) {
    console.error(formatLog(LOG_LEVELS.ERROR, message, data));
  }
  
  /**
   * Log API request
   */
  apiRequest(method, url, data) {
    if (VERBOSE) {
      // Sanitize sensitive data
      const sanitizedData = { ...data };
      if (sanitizedData.password) {
        sanitizedData.password = '******';
      }
      console.log(formatRequest(method, url, sanitizedData));
    }
    return Date.now(); // Return timestamp for duration calculation
  }
  
  /**
   * Log API response
   */
  apiResponse(method, url, status, data, startTime) {
    const duration = Date.now() - startTime;
    const sanitizedData = { ...data };
    
    // Truncate large responses
    if (sanitizedData && typeof sanitizedData === 'object') {
      const keys = Object.keys(sanitizedData);
      if (keys.length > 5) {
        const truncated = {};
        keys.slice(0, 5).forEach(key => {
          truncated[key] = sanitizedData[key];
        });
        truncated['...'] = `(${keys.length - 5} more fields)`;
        sanitizedData._truncated = true;
        console.log(formatResponse(method, url, status, truncated, duration));
      } else {
        console.log(formatResponse(method, url, status, sanitizedData, duration));
      }
    } else {
      console.log(formatResponse(method, url, status, sanitizedData, duration));
    }
  }
  
  /**
   * Log API error
   */
  apiError(method, url, error, startTime) {
    const duration = Date.now() - startTime;
    const errorData = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
    console.error(formatLog(LOG_LEVELS.ERROR, `API Error: ${method} ${url} - ${duration}ms`, errorData));
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;