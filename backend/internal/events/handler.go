package events

import (
	"genie/internal/middleware" // Importer le package middleware
	"genie/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Handler is the events API handler
type Handler struct {
	service *Service
}

// NewHandler creates a new events handler
func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

// RegisterRoutes registers the event routes
func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	// Event CRUD operations
	router.POST("", h.CreateEvent)
	router.GET("/list", h.ListEvents) // Changé de "" à "/list"
	router.GET("/:id", h.GetEvent)
	router.PUT("/:id", h.UpdateEvent)
	router.DELETE("/:id", h.DeleteEvent)

	// Participants management
	router.POST("/:id/participants", h.AddParticipant)
	router.DELETE("/:id/participants/:userId", h.RemoveParticipant)
	router.PUT("/:id/participants/status", h.UpdateParticipantStatus)

	// Gifts management
	router.POST("/:id/gifts", h.AddGift)
	router.PUT("/:id/gifts/:giftId", h.UpdateGift)
	router.DELETE("/:id/gifts/:giftId", h.DeleteGift)

	// Predefined events routes
	router.GET("/predefined", h.ListPredefinedEvents)
	router.POST("/predefined/:type", h.CreateFromPredefined)
}

// ListEvents returns all events for the current user
func (h *Handler) ListEvents(c *gin.Context) {
	log.Debug().Msg(">>> HANDLER: ListEvents CALLED") // Ajouter log ici
	// Get user ID from token using the correct key from middleware
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get events for the user
	events, err := h.service.ListUserEvents(c.Request.Context(), userIDValue.(string))
	if err != nil {
		log.Error().Err(err).Msg("Failed to list events")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list events"})
		return
	}

	c.JSON(http.StatusOK, events)
}

// GetEvent returns a single event by ID
func (h *Handler) GetEvent(c *gin.Context) {
	log.Debug().Str("idParam", c.Param("id")).Msg(">>> HANDLER: GetEvent CALLED") // Ajouter log ici
	// Get user ID from token using the correct key from middleware
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get event ID from URL
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Get event
	event, err := h.service.GetEvent(c.Request.Context(), eventID, userIDValue.(string))
	if err != nil {
		if err == ErrEventNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			return
		}
		log.Error().Err(err).Msg("Failed to get event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get event"})
		return
	}

	c.JSON(http.StatusOK, event)
}

// CreateEvent creates a new event
func (h *Handler) CreateEvent(c *gin.Context) {
	// Get user ID from token using the correct key from middleware
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Parse user ID
	objID, err := primitive.ObjectIDFromHex(userIDValue.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse request body
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Set creator ID
	event.CreatorID = objID

	// Create event
	createdEvent, err := h.service.CreateEvent(c.Request.Context(), &event)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, createdEvent)
}

// UpdateEvent updates an existing event
func (h *Handler) UpdateEvent(c *gin.Context) {
	// Get user ID from token using the correct key from middleware
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get event ID from URL
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Parse request body
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Update event
	updatedEvent, err := h.service.UpdateEvent(c.Request.Context(), eventID, userIDValue.(string), &event)
	if err != nil {
		if err == ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this event"})
			return
		}
		if err == ErrEventNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			return
		}
		log.Error().Err(err).Msg("Failed to update event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
		return
	}

	c.JSON(http.StatusOK, updatedEvent)
}

// DeleteEvent deletes an event
func (h *Handler) DeleteEvent(c *gin.Context) {
	// Get user ID from token using the correct key from middleware
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get event ID from URL
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Delete event
	err := h.service.DeleteEvent(c.Request.Context(), eventID, userIDValue.(string))
	if err != nil {
		if err == ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this event"})
			return
		}
		log.Error().Err(err).Msg("Failed to delete event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

// AddParticipant adds a participant to an event
func (h *Handler) AddParticipant(c *gin.Context) {
	// Get user ID from token using the correct key from middleware
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get event ID from URL
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Parse request body
	var participant models.EventParticipant
	if err := c.ShouldBindJSON(&participant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Set invite time
	participant.InvitedAt = time.Now()

	// Add participant
	err := h.service.AddParticipant(c.Request.Context(), eventID, userIDValue.(string), &participant)
	if err != nil {
		if err == ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to add participants to this event"})
			return
		}
		log.Error().Err(err).Msg("Failed to add participant")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add participant"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Participant added successfully"})
}

// RemoveParticipant removes a participant from an event
func (h *Handler) RemoveParticipant(c *gin.Context) {
	// Get user ID from token using the correct key from middleware
	currentUserIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get event ID and target user ID from URL
	eventID := c.Param("id")
	targetUserID := c.Param("userId")
	if eventID == "" || targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID and user ID are required"})
		return
	}

	// For future implementation: Check if currentUserID has permission to remove participants
	log.Info().Str("currentUserID", currentUserIDValue.(string)).Str("targetUserID", targetUserID).Msg("Attempt to remove participant")

	// Remove participant
	// Note: This endpoint is not implemented in the service yet
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"})
}

// UpdateParticipantStatus updates a participant's status (confirm/decline)
func (h *Handler) UpdateParticipantStatus(c *gin.Context) {
	// Get user ID from token using the correct key from middleware
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get event ID from URL
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Parse request body
	var request struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Update status
	err := h.service.UpdateParticipantStatus(c.Request.Context(), eventID, userIDValue.(string), request.Status)
	if err != nil {
		log.Error().Err(err).Msg("Failed to update participant status")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update participant status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

// AddGift adds a gift to an event
func (h *Handler) AddGift(c *gin.Context) {
	// Get user ID from token using the correct key from middleware
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get event ID from URL
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Parse request body
	var gift models.EventGift
	if err := c.ShouldBindJSON(&gift); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Add gift
	err := h.service.AddGift(c.Request.Context(), eventID, userIDValue.(string), &gift)
	if err != nil {
		if err == ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to add gifts to this event"})
			return
		}
		log.Error().Err(err).Msg("Failed to add gift")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add gift"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Gift added successfully"})
}

// UpdateGift updates a gift in an event
func (h *Handler) UpdateGift(c *gin.Context) {
	// This endpoint is not implemented yet
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"})
}

// DeleteGift deletes a gift from an event
func (h *Handler) DeleteGift(c *gin.Context) {
	// This endpoint is not implemented yet
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"})
}

// ListPredefinedEvents returns all predefined event types
func (h *Handler) ListPredefinedEvents(c *gin.Context) {
	// Get all predefined events from service
	predefinedEvents := h.service.GetAllPredefinedEvents()

	// Return the list
	c.JSON(http.StatusOK, predefinedEvents)
}

// CreateFromPredefined creates a new event from a predefined type
func (h *Handler) CreateFromPredefined(c *gin.Context) {
	// Get user ID from token using the correct key from middleware
	userIDValue, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Parse user ID
	objID, err := primitive.ObjectIDFromHex(userIDValue.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get predefined event type from URL
	predefinedType := c.Param("type")
	if predefinedType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Predefined event type is required"})
		return
	}

	// Check if predefined type exists
	_, err = h.service.GetPredefinedEvent(predefinedType)
	if err != nil {
		log.Error().Err(err).Str("predefinedType", predefinedType).Msg("Unknown predefined event type")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Unknown predefined event type: " + predefinedType,
		})
		return
	}

	// Create initial event object from request body
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Set creator ID
	event.CreatorID = objID

	// Create the event using the service
	createdEvent, err := h.service.CreateFromPredefinedType(c.Request.Context(), predefinedType, &event)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create event from predefined type")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, createdEvent)
}
