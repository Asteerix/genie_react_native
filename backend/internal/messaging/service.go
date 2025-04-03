package messaging

import (
	"context"
	"errors"
	"fmt"
	"time"

	"genie/internal/db"
	"genie/internal/models"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrChatNotFound           = errors.New("chat not found")
	ErrMessageNotFound        = errors.New("message not found")
	ErrInvalidObjectID        = errors.New("invalid object ID")
	ErrUserNotInChat          = errors.New("user is not a participant in this chat")
	ErrInvalidDirectChatUsers = errors.New("direct chat must have exactly 2 participants")
)

// Service provides messaging related operations
type Service struct {
	db *db.Database
}

// NewService creates a new messaging service
func NewService(database *db.Database) *Service {
	return &Service{
		db: database,
	}
}

// CreateChat creates a new chat
func (s *Service) CreateChat(ctx context.Context, request models.NewChatRequest, userID string) (*models.Chat, error) {
	log.Info().Str("userID", userID).Str("type", string(request.Type)).Msg("Creating new chat")

	currentUserID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	// Check if participants are valid
	if len(request.Participants) == 0 {
		return nil, errors.New("participants list cannot be empty")
	}

	// For direct chat, check if there are exactly 2 participants
	if request.Type == models.ChatTypeDirect && len(request.Participants) != 1 {
		return nil, ErrInvalidDirectChatUsers
	}

	// Convert participant strings to ObjectIDs
	participantIDs := make([]primitive.ObjectID, 0, len(request.Participants)+1)
	participantIDs = append(participantIDs, currentUserID) // Add current user

	for _, participantStr := range request.Participants {
		participantID, err := primitive.ObjectIDFromHex(participantStr)
		if err != nil {
			return nil, ErrInvalidObjectID
		}
		
		// Don't add duplicates (in case the user tries to add themselves)
		if participantID != currentUserID {
			participantIDs = append(participantIDs, participantID)
		}
	}

	// For direct chats, check if a chat already exists between these users
	if request.Type == models.ChatTypeDirect {
		existingChat, err := s.findDirectChat(ctx, currentUserID, participantIDs[1])
		if err == nil && existingChat != nil {
			log.Info().Str("chatID", existingChat.ID.Hex()).Msg("Found existing direct chat")
			return existingChat, nil
		}
	}

	// Set up event ID if provided
	var eventID primitive.ObjectID
	if request.EventID != "" {
		eventID, err = primitive.ObjectIDFromHex(request.EventID)
		if err != nil {
			return nil, ErrInvalidObjectID
		}
	}

	// Create a new chat
	chat := &models.Chat{
		ID:           primitive.NewObjectID(),
		Type:         request.Type,
		Name:         request.Name,
		Participants: participantIDs,
		CreatedBy:    currentUserID,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Add event ID if it exists
	if !eventID.IsZero() {
		chat.EventID = eventID
	}

	_, err = s.db.Chats.InsertOne(ctx, chat)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create chat")
		return nil, err
	}

	log.Info().Str("chatID", chat.ID.Hex()).Msg("Chat created successfully")
	return chat, nil
}

// findDirectChat tries to find an existing direct chat between two users
func (s *Service) findDirectChat(ctx context.Context, user1ID, user2ID primitive.ObjectID) (*models.Chat, error) {
	// Direct chats have exactly 2 participants
	filter := bson.M{
		"type": models.ChatTypeDirect,
		"participants": bson.M{
			"$all": []primitive.ObjectID{user1ID, user2ID},
			"$size": 2, // Exactly 2 participants
		},
	}

	var chat models.Chat
	err := s.db.Chats.FindOne(ctx, filter).Decode(&chat)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrChatNotFound
		}
		return nil, err
	}

	return &chat, nil
}

// GetChat retrieves a chat by ID
func (s *Service) GetChat(ctx context.Context, chatID, userID string) (*models.Chat, error) {
	log.Info().Str("chatID", chatID).Str("userID", userID).Msg("Getting chat")

	chatObjID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	// Find chat and ensure user is a participant
	filter := bson.M{
		"_id": chatObjID,
		"participants": userObjID,
	}

	var chat models.Chat
	err = s.db.Chats.FindOne(ctx, filter).Decode(&chat)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			log.Warn().Str("chatID", chatID).Str("userID", userID).Msg("Chat not found or user not a participant")
			return nil, ErrChatNotFound
		}
		log.Error().Err(err).Str("chatID", chatID).Msg("Error finding chat")
		return nil, err
	}

	// Get last message for the chat
	lastMessage, err := s.getLastMessage(ctx, chatObjID)
	if err == nil && lastMessage != nil {
		chat.LastMessage = lastMessage
	}

	return &chat, nil
}

// getLastMessage retrieves the most recent message in a chat
func (s *Service) getLastMessage(ctx context.Context, chatID primitive.ObjectID) (*models.Message, error) {
	opts := options.FindOne().SetSort(bson.M{"createdAt": -1})
	
	var message models.Message
	err := s.db.Messages.FindOne(ctx, bson.M{"chatId": chatID}, opts).Decode(&message)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil // No messages yet, not an error
		}
		return nil, err
	}
	
	return &message, nil
}

// ListChats retrieves all chats for a user
func (s *Service) ListChats(ctx context.Context, userID string) ([]*models.Chat, error) {
	log.Info().Str("userID", userID).Msg("Listing chats for user")

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	// Find all chats where user is a participant
	filter := bson.M{
		"participants": userObjID,
	}

	opts := options.Find().SetSort(bson.M{"updatedAt": -1})

	cursor, err := s.db.Chats.Find(ctx, filter, opts)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Error finding chats")
		return nil, err
	}
	defer cursor.Close(ctx)

	var chats []*models.Chat
	for cursor.Next(ctx) {
		var chat models.Chat
		if err := cursor.Decode(&chat); err != nil {
			log.Error().Err(err).Msg("Error decoding chat")
			continue
		}

		// Get last message for the chat
		lastMessage, err := s.getLastMessage(ctx, chat.ID)
		if err == nil && lastMessage != nil {
			chat.LastMessage = lastMessage
		}

		chats = append(chats, &chat)
	}

	if err := cursor.Err(); err != nil {
		log.Error().Err(err).Msg("Cursor error while listing chats")
		return nil, err
	}

	log.Info().Str("userID", userID).Int("count", len(chats)).Msg("Found chats for user")
	return chats, nil
}

// GetEventChats retrieves all chats for an event
func (s *Service) GetEventChats(ctx context.Context, eventID, userID string) ([]*models.Chat, error) {
	log.Info().Str("eventID", eventID).Str("userID", userID).Msg("Getting event chats")

	eventObjID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	// Find all chats for the event where user is a participant
	filter := bson.M{
		"eventId": eventObjID,
		"participants": userObjID,
	}

	cursor, err := s.db.Chats.Find(ctx, filter)
	if err != nil {
		log.Error().Err(err).Str("eventID", eventID).Msg("Error finding event chats")
		return nil, err
	}
	defer cursor.Close(ctx)

	var chats []*models.Chat
	for cursor.Next(ctx) {
		var chat models.Chat
		if err := cursor.Decode(&chat); err != nil {
			log.Error().Err(err).Msg("Error decoding chat")
			continue
		}

		// Get last message for the chat
		lastMessage, err := s.getLastMessage(ctx, chat.ID)
		if err == nil && lastMessage != nil {
			chat.LastMessage = lastMessage
		}

		chats = append(chats, &chat)
	}

	if err := cursor.Err(); err != nil {
		log.Error().Err(err).Msg("Cursor error while listing event chats")
		return nil, err
	}

	log.Info().Str("eventID", eventID).Int("count", len(chats)).Msg("Found event chats")
	return chats, nil
}

// UpdateChat updates a chat's properties
func (s *Service) UpdateChat(ctx context.Context, chatID string, request models.UpdateChatRequest, userID string) (*models.Chat, error) {
	log.Info().Str("chatID", chatID).Str("userID", userID).Msg("Updating chat")

	chatObjID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	// First verify the user is in the chat
	var chat models.Chat
	err = s.db.Chats.FindOne(ctx, bson.M{
		"_id": chatObjID,
		"participants": userObjID,
	}).Decode(&chat)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrChatNotFound
		}
		return nil, err
	}

	// Prepare update 
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	// Update name if provided
	if request.Name != "" {
		update["$set"].(bson.M)["name"] = request.Name
	}

	// Update participants if provided
	if len(request.Participants) > 0 {
		// Convert participant strings to ObjectIDs
		participantIDs := make([]primitive.ObjectID, 0, len(request.Participants)+1)
		
		// Always include the current user
		participantIDs = append(participantIDs, userObjID)
		
		for _, participantStr := range request.Participants {
			participantID, err := primitive.ObjectIDFromHex(participantStr)
			if err != nil {
				return nil, ErrInvalidObjectID
			}
			
			// Avoid duplicates
			if participantID != userObjID {
				participantIDs = append(participantIDs, participantID)
			}
		}
		
		update["$set"].(bson.M)["participants"] = participantIDs
	}

	// Apply the update
	_, err = s.db.Chats.UpdateOne(
		ctx,
		bson.M{"_id": chatObjID},
		update,
	)

	if err != nil {
		log.Error().Err(err).Str("chatID", chatID).Msg("Error updating chat")
		return nil, err
	}

	// Retrieve the updated chat
	return s.GetChat(ctx, chatID, userID)
}

// SendMessage sends a new message to a chat
func (s *Service) SendMessage(ctx context.Context, request models.NewMessageRequest, userID string) (*models.Message, error) {
	log.Info().Str("chatID", request.ChatID).Str("userID", userID).Str("type", string(request.Type)).Msg("Sending message")

	chatObjID, err := primitive.ObjectIDFromHex(request.ChatID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	// Verify the user is a participant in this chat
	count, err := s.db.Chats.CountDocuments(ctx, bson.M{
		"_id": chatObjID,
		"participants": userObjID,
	})

	if err != nil {
		log.Error().Err(err).Str("chatID", request.ChatID).Msg("Error checking chat")
		return nil, err
	}

	if count == 0 {
		return nil, ErrUserNotInChat
	}

	// Create the message
	now := time.Now()
	message := &models.Message{
		ID:        primitive.NewObjectID(),
		ChatID:    chatObjID,
		SenderID:  userObjID,
		Type:      request.Type,
		Content:   request.Content,
		MediaURL:  request.MediaURL,
		Status:    models.MessageStatusSent,
		ReadBy:    []primitive.ObjectID{userObjID}, // The sender has "read" the message
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Insert the message
	_, err = s.db.Messages.InsertOne(ctx, message)
	if err != nil {
		log.Error().Err(err).Str("chatID", request.ChatID).Msg("Error inserting message")
		return nil, err
	}

	// Update the chat's updatedAt timestamp
	_, err = s.db.Chats.UpdateOne(
		ctx,
		bson.M{"_id": chatObjID},
		bson.M{
			"$set": bson.M{
				"updatedAt": now,
			},
		},
	)

	if err != nil {
		log.Warn().Err(err).Str("chatID", request.ChatID).Msg("Failed to update chat timestamp")
		// Don't return an error here, the message is sent
	}

	log.Info().Str("messageID", message.ID.Hex()).Str("chatID", request.ChatID).Msg("Message sent successfully")
	return message, nil
}

// GetMessages retrieves messages from a chat, with pagination
func (s *Service) GetMessages(ctx context.Context, chatID, userID string, limit, offset int) ([]*models.Message, error) {
	log.Info().Str("chatID", chatID).Str("userID", userID).Int("limit", limit).Int("offset", offset).Msg("Getting messages")

	chatObjID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidObjectID
	}

	// Verify the user is a participant in this chat
	count, err := s.db.Chats.CountDocuments(ctx, bson.M{
		"_id": chatObjID,
		"participants": userObjID,
	})

	if err != nil {
		log.Error().Err(err).Str("chatID", chatID).Msg("Error checking chat")
		return nil, err
	}

	if count == 0 {
		return nil, ErrUserNotInChat
	}

	// Set default values for pagination
	if limit <= 0 {
		limit = 50 // Default limit
	}
	if limit > 100 {
		limit = 100 // Maximum limit
	}

	// Find messages in the chat, sorted by creation time (newest first)
	opts := options.Find().
		SetSort(bson.M{"createdAt": -1}).
		SetLimit(int64(limit)).
		SetSkip(int64(offset))

	cursor, err := s.db.Messages.Find(ctx, bson.M{"chatId": chatObjID}, opts)
	if err != nil {
		log.Error().Err(err).Str("chatID", chatID).Msg("Error finding messages")
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []*models.Message
	for cursor.Next(ctx) {
		var message models.Message
		if err := cursor.Decode(&message); err != nil {
			log.Error().Err(err).Msg("Error decoding message")
			continue
		}
		messages = append(messages, &message)
	}

	if err := cursor.Err(); err != nil {
		log.Error().Err(err).Msg("Cursor error while retrieving messages")
		return nil, err
	}

	// Mark messages as read
	go s.markMessagesAsRead(context.Background(), chatObjID, userObjID)

	// Return messages in reverse order (oldest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	log.Info().Str("chatID", chatID).Int("count", len(messages)).Msg("Found messages")
	return messages, nil
}

// MarkMessageRead marks a specific message as read by a user
func (s *Service) MarkMessageRead(ctx context.Context, messageID, userID string) error {
	log.Info().Str("messageID", messageID).Str("userID", userID).Msg("Marking message as read")

	messageObjID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return ErrInvalidObjectID
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidObjectID
	}

	// Find the message and check if the user has access
	var message models.Message
	err = s.db.Messages.FindOne(ctx, bson.M{"_id": messageObjID}).Decode(&message)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrMessageNotFound
		}
		return err
	}

	// Verify user is part of the chat
	count, err := s.db.Chats.CountDocuments(ctx, bson.M{
		"_id": message.ChatID,
		"participants": userObjID,
	})

	if err != nil {
		return err
	}

	if count == 0 {
		return ErrUserNotInChat
	}

	// Add user to readBy array if not already there
	_, err = s.db.Messages.UpdateOne(
		ctx,
		bson.M{
			"_id": messageObjID,
			"readBy": bson.M{"$ne": userObjID},
		},
		bson.M{
			"$addToSet": bson.M{"readBy": userObjID},
			"$set": bson.M{
				"updatedAt": time.Now(),
				"status": models.MessageStatusRead,
			},
		},
	)

	if err != nil {
		log.Error().Err(err).Str("messageID", messageID).Msg("Error marking message as read")
		return err
	}

	log.Info().Str("messageID", messageID).Str("userID", userID).Msg("Message marked as read")
	return nil
}

// markMessagesAsRead marks all messages in a chat as read by a user (run as a goroutine)
func (s *Service) markMessagesAsRead(ctx context.Context, chatID, userID primitive.ObjectID) {
	log.Debug().Str("chatID", chatID.Hex()).Str("userID", userID.Hex()).Msg("Marking all messages as read")

	// Update all messages that aren't sent by this user and haven't been read by this user
	_, err := s.db.Messages.UpdateMany(
		ctx,
		bson.M{
			"chatId": chatID,
			"senderId": bson.M{"$ne": userID},
			"readBy": bson.M{"$ne": userID},
		},
		bson.M{
			"$addToSet": bson.M{"readBy": userID},
			"$set": bson.M{
				"status": models.MessageStatusRead,
				"updatedAt": time.Now(),
			},
		},
	)

	if err != nil {
		log.Error().Err(err).Str("chatID", chatID.Hex()).Msg("Error marking messages as read")
	}
}

// DeleteMessage marks a message as deleted (only the sender can delete)
func (s *Service) DeleteMessage(ctx context.Context, messageID, userID string) error {
	log.Info().Str("messageID", messageID).Str("userID", userID).Msg("Deleting message")

	messageObjID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return ErrInvalidObjectID
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidObjectID
	}

	// Find the message and verify sender
	var message models.Message
	err = s.db.Messages.FindOne(ctx, bson.M{"_id": messageObjID}).Decode(&message)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrMessageNotFound
		}
		return err
	}

	// Only the sender can delete a message
	if message.SenderID != userObjID {
		return errors.New("only the sender can delete a message")
	}

	// Set message content to indicate deletion
	_, err = s.db.Messages.UpdateOne(
		ctx,
		bson.M{"_id": messageObjID},
		bson.M{
			"$set": bson.M{
				"content": "Ce message a été supprimé",
				"type": models.MessageTypeSystem,
				"mediaUrl": "",
				"updatedAt": time.Now(),
			},
		},
	)

	if err != nil {
		log.Error().Err(err).Str("messageID", messageID).Msg("Error deleting message")
		return err
	}

	log.Info().Str("messageID", messageID).Msg("Message deleted successfully")
	return nil
}

// LeaveChat removes a user from a chat
func (s *Service) LeaveChat(ctx context.Context, chatID, userID string) error {
	log.Info().Str("chatID", chatID).Str("userID", userID).Msg("User leaving chat")

	chatObjID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return ErrInvalidObjectID
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidObjectID
	}

	// Verify the chat exists
	var chat models.Chat
	err = s.db.Chats.FindOne(ctx, bson.M{"_id": chatObjID}).Decode(&chat)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return ErrChatNotFound
		}
		return err
	}

	// For direct chats, don't leave - just mark as inactive or delete
	if chat.Type == models.ChatTypeDirect {
		// For direct chats, we could soft delete or mark as inactive
		// This depends on the product requirements
		return errors.New("cannot leave a direct chat")
	}

	// Remove user from participants
	_, err = s.db.Chats.UpdateOne(
		ctx,
		bson.M{"_id": chatObjID},
		bson.M{
			"$pull": bson.M{"participants": userObjID},
			"$set": bson.M{"updatedAt": time.Now()},
		},
	)

	if err != nil {
		log.Error().Err(err).Str("chatID", chatID).Msg("Error removing user from chat")
		return err
	}

	// Add system message about user leaving
	systemMessage := &models.Message{
		ID:        primitive.NewObjectID(),
		ChatID:    chatObjID,
		SenderID:  userObjID,
		Type:      models.MessageTypeSystem,
		Content:   fmt.Sprintf("Un utilisateur a quitté le groupe"),
		Status:    models.MessageStatusSent,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = s.db.Messages.InsertOne(ctx, systemMessage)
	if err != nil {
		log.Warn().Err(err).Str("chatID", chatID).Msg("Failed to add system message for user leaving")
		// Don't return error if we fail to add the system message
	}

	log.Info().Str("chatID", chatID).Str("userID", userID).Msg("User left chat successfully")
	return nil
}