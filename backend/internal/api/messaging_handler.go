package api

import (
	"errors"
	"net/http"
	"strconv"

	"genie/internal/messaging"
	"genie/internal/middleware"
	"genie/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// MessagingHandler handles messaging related API endpoints
type MessagingHandler struct {
	service *messaging.Service
}

// NewMessagingHandler creates a new messaging handler
func NewMessagingHandler(service *messaging.Service) *MessagingHandler {
	return &MessagingHandler{
		service: service,
	}
}

// RegisterRoutes registers the messaging routes
func (h *MessagingHandler) RegisterRoutes(router *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	messagingRoutes := router.Group("/messages")
	messagingRoutes.Use(authMiddleware)
	{
		// Chat management
		messagingRoutes.POST("/chats", h.createChat)
		messagingRoutes.GET("/chats", h.listChats)
		messagingRoutes.GET("/chats/:chatId", h.getChat)
		messagingRoutes.PUT("/chats/:chatId", h.updateChat)
		messagingRoutes.DELETE("/chats/:chatId", h.leaveChat)
		
		// Event chats
		messagingRoutes.GET("/events/:eventId/chats", h.getEventChats)
		
		// Message management
		messagingRoutes.POST("/chats/:chatId/messages", h.sendMessage)
		messagingRoutes.GET("/chats/:chatId/messages", h.getMessages)
		messagingRoutes.PUT("/messages/:messageId/read", h.markMessageRead)
		messagingRoutes.DELETE("/messages/:messageId", h.deleteMessage)
	}
}

// createChat creates a new chat
func (h *MessagingHandler) createChat(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.NewChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Warn().Err(err).Msg("Invalid request for creating chat")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	chat, err := h.service.CreateChat(c.Request.Context(), req, userID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create chat")
		
		if errors.Is(err, messaging.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
			return
		}
		
		if errors.Is(err, messaging.ErrInvalidDirectChatUsers) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "direct chat must have exactly 2 participants"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create chat"})
		return
	}

	c.JSON(http.StatusCreated, chat.ToResponse())
}

// listChats lists all chats for the current user
func (h *MessagingHandler) listChats(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	chats, err := h.service.ListChats(c.Request.Context(), userID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to list chats")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list chats"})
		return
	}

	// Convert chats to response format
	chatResponses := make([]models.ChatResponse, len(chats))
	for i, chat := range chats {
		chatResponses[i] = chat.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{"chats": chatResponses})
}

// getChat gets a specific chat
func (h *MessagingHandler) getChat(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	chatID := c.Param("chatId")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chat ID is required"})
		return
	}

	chat, err := h.service.GetChat(c.Request.Context(), chatID, userID)
	if err != nil {
		log.Error().Err(err).Str("chatID", chatID).Msg("Failed to get chat")
		
		if errors.Is(err, messaging.ErrChatNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "chat not found"})
			return
		}
		
		if errors.Is(err, messaging.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get chat"})
		return
	}

	c.JSON(http.StatusOK, chat.ToResponse())
}

// updateChat updates a chat's properties
func (h *MessagingHandler) updateChat(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	chatID := c.Param("chatId")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chat ID is required"})
		return
	}

	var req models.UpdateChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Warn().Err(err).Msg("Invalid request for updating chat")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	chat, err := h.service.UpdateChat(c.Request.Context(), chatID, req, userID)
	if err != nil {
		log.Error().Err(err).Str("chatID", chatID).Msg("Failed to update chat")
		
		if errors.Is(err, messaging.ErrChatNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "chat not found"})
			return
		}
		
		if errors.Is(err, messaging.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update chat"})
		return
	}

	c.JSON(http.StatusOK, chat.ToResponse())
}

// leaveChat removes the current user from a chat
func (h *MessagingHandler) leaveChat(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	chatID := c.Param("chatId")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chat ID is required"})
		return
	}

	err := h.service.LeaveChat(c.Request.Context(), chatID, userID)
	if err != nil {
		log.Error().Err(err).Str("chatID", chatID).Msg("Failed to leave chat")
		
		if errors.Is(err, messaging.ErrChatNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "chat not found"})
			return
		}
		
		if errors.Is(err, messaging.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to leave chat"})
		return
	}

	c.Status(http.StatusNoContent)
}

// getEventChats lists all chats for a specific event
func (h *MessagingHandler) getEventChats(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	eventID := c.Param("eventId")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event ID is required"})
		return
	}

	chats, err := h.service.GetEventChats(c.Request.Context(), eventID, userID)
	if err != nil {
		log.Error().Err(err).Str("eventID", eventID).Msg("Failed to get event chats")
		
		if errors.Is(err, messaging.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get event chats"})
		return
	}

	// Convert chats to response format
	chatResponses := make([]models.ChatResponse, len(chats))
	for i, chat := range chats {
		chatResponses[i] = chat.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{"chats": chatResponses})
}

// sendMessage sends a new message to a chat
func (h *MessagingHandler) sendMessage(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	chatID := c.Param("chatId")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chat ID is required"})
		return
	}

	var req models.NewMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Warn().Err(err).Msg("Invalid request for sending message")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// Set chatID from URL parameter
	req.ChatID = chatID

	message, err := h.service.SendMessage(c.Request.Context(), req, userID)
	if err != nil {
		log.Error().Err(err).Str("chatID", chatID).Msg("Failed to send message")
		
		if errors.Is(err, messaging.ErrUserNotInChat) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you are not a participant in this chat"})
			return
		}
		
		if errors.Is(err, messaging.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		return
	}

	c.JSON(http.StatusCreated, message.ToResponse())
}

// getMessages gets messages from a chat with pagination
func (h *MessagingHandler) getMessages(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	chatID := c.Param("chatId")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chat ID is required"})
		return
	}

	// Parse pagination parameters
	limit := 50 // Default limit
	offset := 0 // Default offset

	if limitStr := c.Query("limit"); limitStr != "" {
		if val, err := strconv.Atoi(limitStr); err == nil && val > 0 {
			limit = val
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if val, err := strconv.Atoi(offsetStr); err == nil && val >= 0 {
			offset = val
		}
	}

	messages, err := h.service.GetMessages(c.Request.Context(), chatID, userID, limit, offset)
	if err != nil {
		log.Error().Err(err).Str("chatID", chatID).Msg("Failed to get messages")
		
		if errors.Is(err, messaging.ErrUserNotInChat) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you are not a participant in this chat"})
			return
		}
		
		if errors.Is(err, messaging.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get messages"})
		return
	}

	// Convert messages to response format
	messageResponses := make([]models.MessageResponse, len(messages))
	for i, msg := range messages {
		messageResponses[i] = msg.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messageResponses,
		"pagination": gin.H{
			"offset": offset,
			"limit":  limit,
			"total":  len(messageResponses),
		},
	})
}

// markMessageRead marks a message as read by the current user
func (h *MessagingHandler) markMessageRead(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	messageID := c.Param("messageId")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message ID is required"})
		return
	}

	err := h.service.MarkMessageRead(c.Request.Context(), messageID, userID)
	if err != nil {
		log.Error().Err(err).Str("messageID", messageID).Msg("Failed to mark message as read")
		
		if errors.Is(err, messaging.ErrMessageNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
			return
		}
		
		if errors.Is(err, messaging.ErrUserNotInChat) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you are not a participant in this chat"})
			return
		}
		
		if errors.Is(err, messaging.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark message as read"})
		return
	}

	c.Status(http.StatusNoContent)
}

// deleteMessage deletes a message (only the sender can delete)
func (h *MessagingHandler) deleteMessage(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	messageID := c.Param("messageId")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message ID is required"})
		return
	}

	err := h.service.DeleteMessage(c.Request.Context(), messageID, userID)
	if err != nil {
		log.Error().Err(err).Str("messageID", messageID).Msg("Failed to delete message")
		
		if errors.Is(err, messaging.ErrMessageNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
			return
		}
		
		if errors.Is(err, messaging.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
			return
		}
		
		// If the user is not the sender
		if err.Error() == "only the sender can delete a message" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete message"})
		return
	}

	c.Status(http.StatusNoContent)
}