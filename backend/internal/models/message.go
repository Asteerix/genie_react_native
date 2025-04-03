package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// MessageType defines the type of message
type MessageType string

const (
	MessageTypeText  MessageType = "text"
	MessageTypeImage MessageType = "image"
	MessageTypeVideo MessageType = "video"
	MessageTypeFile  MessageType = "file"
	MessageTypeSystem MessageType = "system"
)

// MessageStatus represents the status of a message
type MessageStatus string

const (
	MessageStatusSent      MessageStatus = "sent"
	MessageStatusDelivered MessageStatus = "delivered"
	MessageStatusRead      MessageStatus = "read"
)

// Message represents a message in a conversation
type Message struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	ChatID    primitive.ObjectID `bson:"chatId" json:"chatId"`
	SenderID  primitive.ObjectID `bson:"senderId" json:"senderId"`
	Type      MessageType        `bson:"type" json:"type"`
	Content   string             `bson:"content" json:"content"`
	MediaURL  string             `bson:"mediaUrl,omitempty" json:"mediaUrl,omitempty"`
	Status    MessageStatus      `bson:"status" json:"status"`
	ReadBy    []primitive.ObjectID `bson:"readBy,omitempty" json:"readBy,omitempty"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// MessageResponse represents a message response for the API
type MessageResponse struct {
	ID        string      `json:"id"`
	ChatID    string      `json:"chatId"`
	SenderID  string      `json:"senderId"`
	Type      MessageType `json:"type"`
	Content   string      `json:"content"`
	MediaURL  string      `json:"mediaUrl,omitempty"`
	Status    MessageStatus `json:"status"`
	ReadBy    []string    `json:"readBy,omitempty"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
}

// ToResponse converts a Message to MessageResponse
func (m *Message) ToResponse() MessageResponse {
	readBy := make([]string, len(m.ReadBy))
	for i, id := range m.ReadBy {
		readBy[i] = id.Hex()
	}

	return MessageResponse{
		ID:        m.ID.Hex(),
		ChatID:    m.ChatID.Hex(),
		SenderID:  m.SenderID.Hex(),
		Type:      m.Type,
		Content:   m.Content,
		MediaURL:  m.MediaURL,
		Status:    m.Status,
		ReadBy:    readBy,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

// NewMessageRequest represents a new message request
type NewMessageRequest struct {
	ChatID   string      `json:"chatId" binding:"required"`
	Type     MessageType `json:"type" binding:"required"`
	Content  string      `json:"content"`
	MediaURL string      `json:"mediaUrl,omitempty"`
}

// UpdateMessageRequest represents a request to update a message
type UpdateMessageRequest struct {
	Status MessageStatus `json:"status,omitempty"`
}

// ChatType represents the type of chat
type ChatType string

const (
	ChatTypeDirect ChatType = "direct"
	ChatTypeGroup  ChatType = "group"
	ChatTypeEvent  ChatType = "event"
)

// Chat represents a conversation between users
type Chat struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id,omitempty"`
	Type        ChatType             `bson:"type" json:"type"`
	Name        string               `bson:"name,omitempty" json:"name,omitempty"`
	Participants []primitive.ObjectID `bson:"participants" json:"participants"`
	EventID     primitive.ObjectID   `bson:"eventId,omitempty" json:"eventId,omitempty"`
	LastMessage *Message             `bson:"lastMessage,omitempty" json:"lastMessage,omitempty"`
	CreatedBy   primitive.ObjectID   `bson:"createdBy" json:"createdBy"`
	CreatedAt   time.Time            `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time            `bson:"updatedAt" json:"updatedAt"`
}

// ChatResponse represents a chat response for the API
type ChatResponse struct {
	ID          string          `json:"id"`
	Type        ChatType        `json:"type"`
	Name        string          `json:"name,omitempty"`
	Participants []string        `json:"participants"`
	EventID     string          `json:"eventId,omitempty"`
	LastMessage *MessageResponse `json:"lastMessage,omitempty"`
	CreatedBy   string          `json:"createdBy"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

// ToResponse converts a Chat to ChatResponse
func (c *Chat) ToResponse() ChatResponse {
	participants := make([]string, len(c.Participants))
	for i, id := range c.Participants {
		participants[i] = id.Hex()
	}

	var lastMessageResponse *MessageResponse
	if c.LastMessage != nil {
		response := c.LastMessage.ToResponse()
		lastMessageResponse = &response
	}

	response := ChatResponse{
		ID:          c.ID.Hex(),
		Type:        c.Type,
		Name:        c.Name,
		Participants: participants,
		CreatedBy:   c.CreatedBy.Hex(),
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
		LastMessage: lastMessageResponse,
	}

	if !c.EventID.IsZero() {
		response.EventID = c.EventID.Hex()
	}

	return response
}

// NewChatRequest represents a request to create a new chat
type NewChatRequest struct {
	Type        ChatType `json:"type" binding:"required,oneof=direct group event"`
	Name        string   `json:"name,omitempty"`
	Participants []string `json:"participants" binding:"required,min=1"`
	EventID     string   `json:"eventId,omitempty"`
}

// UpdateChatRequest represents a request to update a chat
type UpdateChatRequest struct {
	Name        string   `json:"name,omitempty"`
	Participants []string `json:"participants,omitempty"`
}