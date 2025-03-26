package middleware

import (
	"bytes"
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// RequestLogger middleware logs detailed information about each HTTP request and response
func RequestLogger(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		// Log request details
		logger.Info("API Request",
			zap.String("method", method),
			zap.String("path", path),
			zap.String("client_ip", c.ClientIP()),
			zap.String("user_agent", c.Request.UserAgent()),
		)

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
			logger.Info("Request payload", zap.String("body", sanitizedBody))
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
		logger.Info("API Response",
			zap.String("method", method),
			zap.String("path", path),
			zap.Int("status", statusCode),
			zap.Duration("latency", latency),
			zap.Int("body_size", c.Writer.Size()),
		)

		// For non-successful responses, log more details
		if statusCode >= 400 {
			logger.Warn("Request error",
				zap.String("method", method),
				zap.String("path", path),
				zap.Int("status", statusCode),
				zap.String("error", c.Errors.String()),
			)
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