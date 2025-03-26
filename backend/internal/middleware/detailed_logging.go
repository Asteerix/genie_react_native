package middleware

import (
	"bytes"
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// DetailedLoggingMiddleware logs detailed information about each HTTP request and response
func DetailedLoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		// Log request details
		logger := log.With().
			Str("method", method).
			Str("path", path).
			Str("client_ip", c.ClientIP()).
			Str("user_agent", c.Request.UserAgent()).
			Logger()

		logger.Info().Msg("API Request")

		// Read request body
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			// Restore the body so it can be read again by the handlers
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Log request body for non-GET requests (but omit sensitive data)
		if method != "GET" && len(requestBody) > 0 {
			// Don't log full passwords - this is a simple example
			sanitizedBody := string(requestBody)
			// You might want to implement more sophisticated sanitization
			if len(sanitizedBody) > 1000 {
				sanitizedBody = sanitizedBody[:1000] + "... [truncated]"
			}
			logger.Info().Str("body", sanitizedBody).Msg("Request payload")
		}

		// Create a response writer that captures the response
		blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = blw

		// Process request
		c.Next()

		// After response is processed
		latency := time.Since(start)
		statusCode := c.Writer.Status()
		
		// Log response details
		responseLogger := logger.With().
			Int("status", statusCode).
			Dur("latency_ms", latency).
			Int("body_size", c.Writer.Size()).
			Logger()

		responseLogger.Info().Msg("API Response")

		// For non-successful responses, log more details
		if statusCode >= 400 {
			errLogger := logger.With().
				Int("status", statusCode).
				Str("error", c.Errors.String()).
				Logger()
				
			errLogger.Warn().Msg("Request error")
		}
	}
}

// bodyLogWriter captures the response body for logging
type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}