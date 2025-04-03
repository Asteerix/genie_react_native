package api

import (
	"net/http"

	"genie/internal/middleware" // Importer le middleware
	"genie/internal/models"
	"genie/internal/stories"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// StoriesHandler handles API endpoints for stories
type StoriesHandler struct {
	storiesService *stories.Service
}

// NewStoriesHandler creates a new instance of StoriesHandler
func NewStoriesHandler(storiesService *stories.Service) *StoriesHandler {
	return &StoriesHandler{
		storiesService: storiesService,
	}
}

// RegisterRoutes registers all the stories routes
func (h *StoriesHandler) RegisterRoutes(router *gin.Engine) {
	// Créer le groupe et appliquer le middleware d'authentification
	storiesGroup := router.Group("/api/stories-v2", middleware.AuthRequired())
	{
		storiesGroup.GET("/friends", h.GetFriendStories)
		storiesGroup.POST("", h.CreateStory)
		storiesGroup.POST("/view", h.MarkStoryAsViewed)
		storiesGroup.DELETE("/:id", h.DeleteStory)
		storiesGroup.GET("/me", h.GetMyStories)
	}
}

// getFriendStoriesResponse is the response structure for friend stories
type getFriendStoriesResponse struct {
	Friends []models.FriendWithStories `json:"friends"`
}

// GetFriendStories retrieves all stories from friends
func (h *StoriesHandler) GetFriendStories(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get friends with stories
	friendsWithStories, err := h.storiesService.GetFriendsWithStories(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get friends' stories"})
		return
	}

	// Return response
	c.JSON(http.StatusOK, getFriendStoriesResponse{
		Friends: friendsWithStories,
	})
}

// createStoryRequest is the request structure for creating a story
type createStoryRequest struct {
	MediaURL  string `json:"mediaUrl" binding:"required"`
	MediaType string `json:"mediaType" binding:"required,oneof=image video"`
}

// createStoryResponse is the response structure for creating a story
type createStoryResponse struct {
	Story models.Story `json:"story"`
}

// CreateStory creates a new story
func (h *StoriesHandler) CreateStory(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse request
	var request createStoryRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate media type
	var mediaType models.StoryMediaType
	switch request.MediaType {
	case "image":
		mediaType = models.MediaTypeImage
	case "video":
		mediaType = models.MediaTypeVideo
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid media type"})
		return
	}

	// Create story
	story, err := h.storiesService.CreateStory(
		c.Request.Context(),
		userID,
		mediaType,
		request.MediaURL,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create story"})
		return
	}

	// Return response
	c.JSON(http.StatusCreated, createStoryResponse{
		Story: *story,
	})
}

// markStoryAsViewedRequest is the request structure for marking a story as viewed
type markStoryAsViewedRequest struct {
	StoryID string `json:"storyId" binding:"required"`
}

// MarkStoryAsViewed marks a story as viewed by the current user
func (h *StoriesHandler) MarkStoryAsViewed(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse request
	var request markStoryAsViewedRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Convert story ID
	storyID, err := primitive.ObjectIDFromHex(request.StoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid story ID"})
		return
	}

	// Mark story as viewed
	err = h.storiesService.MarkStoryAsViewed(c.Request.Context(), storyID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark story as viewed"})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{"message": "Story marked as viewed"})
}

// DeleteStory removes a story
func (h *StoriesHandler) DeleteStory(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get story ID from URL
	storyIDStr := c.Param("id")
	storyID, err := primitive.ObjectIDFromHex(storyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid story ID"})
		return
	}

	// Delete story
	err = h.storiesService.DeleteStory(c.Request.Context(), storyID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete story"})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{"message": "Story deleted successfully"})
}

// getMyStoriesResponse is the response structure for a user's own stories
type getMyStoriesResponse struct {
	Stories []models.Story `json:"stories"`
}

// GetMyStories retrieves all stories created by the current user
func (h *StoriesHandler) GetMyStories(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get the user's stories
	stories, err := h.storiesService.GetUserStories(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stories"})
		return
	}

	// Return response
	c.JSON(http.StatusOK, getMyStoriesResponse{
		Stories: stories,
	})
}
