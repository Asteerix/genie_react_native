package events

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"genie/internal/models"
)

const (
	// Collection names
	eventsCollection = "events"
)

var (
	ErrInvalidEvent       = errors.New("invalid event data")
	ErrEventNotFound      = errors.New("event not found")
	ErrUnauthorized       = errors.New("unauthorized access to event")
	ErrInvalidID          = errors.New("invalid event ID")
	ErrInvalidUserID      = errors.New("invalid user ID")
	ErrInvalidParticipant = errors.New("invalid participant data")
	ErrInvalidGift        = errors.New("invalid gift data")
)

// Service handles event business logic
type Service struct {
	db *mongo.Database
}

// NewService creates a new event service
func NewService(db *mongo.Database) *Service {
	return &Service{
		db: db,
	}
}

// CreateEvent creates a new event
func (s *Service) CreateEvent(ctx context.Context, event *models.Event) (*models.Event, error) {
	// Validate event data
	if event.Title == "" || event.CreatorID.IsZero() {
		return nil, ErrInvalidEvent
	}

	// Set metadata
	now := time.Now()
	event.CreatedAt = now
	event.UpdatedAt = now

	if event.ID.IsZero() {
		event.ID = primitive.NewObjectID()
	}

	// If creator is not in participants, add them as host
	creatorExists := false
	for _, p := range event.Participants {
		if p.UserID == event.CreatorID {
			creatorExists = true
			break
		}
	}

	if !creatorExists {
		event.Participants = append(event.Participants, models.EventParticipant{
			UserID:    event.CreatorID,
			Role:      "host",
			Status:    "confirmed",
			InvitedAt: now,
		})
	}

	// Insert document
	_, err := s.db.Collection(eventsCollection).InsertOne(ctx, event)
	if err != nil {
		return nil, err
	}

	return event, nil
}

// GetEvent retrieves an event by ID
func (s *Service) GetEvent(ctx context.Context, eventID string, userID string) (*models.Event, error) {
	id, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, ErrInvalidID
	}

	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidUserID
	}

	// Query to find event by ID where user is a participant or the event is not private
	query := bson.M{
		"_id": id,
		"$or": []bson.M{
			{"participants.userId": uid},
			{"isPrivate": false},
			{"creatorId": uid},
		},
		"deletedAt": nil,
	}

	var event models.Event
	err = s.db.Collection(eventsCollection).FindOne(ctx, query).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrEventNotFound
		}
		return nil, err
	}

	return &event, nil
}

// ListUserEvents lists events where the user is a participant
func (s *Service) ListUserEvents(ctx context.Context, userID string) ([]*models.Event, error) {
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidUserID
	}

	// Find events where user is participant or creator
	query := bson.M{
		"$or": []bson.M{
			{"participants.userId": uid},
			{"creatorId": uid},
		},
		"deletedAt": nil,
	}

	opts := options.Find().SetSort(bson.D{{Key: "startDate", Value: 1}})
	cursor, err := s.db.Collection(eventsCollection).Find(ctx, query, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	events := []*models.Event{}
	if err = cursor.All(ctx, &events); err != nil {
		return nil, err
	}

	return events, nil
}

// UpdateEvent updates an existing event
func (s *Service) UpdateEvent(ctx context.Context, eventID string, userID string, updates *models.Event) (*models.Event, error) {
	id, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, ErrInvalidID
	}

	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidUserID
	}

	// First check if user has permission to update (must be creator or host)
	query := bson.M{
		"_id": id,
		"$or": []bson.M{
			{"creatorId": uid},
			{"participants": bson.M{
				"$elemMatch": bson.M{
					"userId": uid,
					"role":   "host",
				},
			}},
		},
		"deletedAt": nil,
	}

	var existingEvent models.Event
	err = s.db.Collection(eventsCollection).FindOne(ctx, query).Decode(&existingEvent)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrUnauthorized
		}
		return nil, err
	}

	// Prepare updates
	updates.ID = id
	updates.CreatorID = existingEvent.CreatorID // Can't change creator
	updates.UpdatedAt = time.Now()
	updates.CreatedAt = existingEvent.CreatedAt // Preserve creation time

	// Perform update
	updateQuery := bson.M{"_id": id}
	_, err = s.db.Collection(eventsCollection).ReplaceOne(ctx, updateQuery, updates)
	if err != nil {
		return nil, err
	}

	return updates, nil
}

// DeleteEvent marks an event as deleted (soft delete)
func (s *Service) DeleteEvent(ctx context.Context, eventID string, userID string) error {
	id, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return ErrInvalidID
	}

	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidUserID
	}

	// User must be creator to delete
	query := bson.M{
		"_id":       id,
		"creatorId": uid,
		"deletedAt": nil,
	}

	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"deletedAt": now,
			"updatedAt": now,
		},
	}

	result, err := s.db.Collection(eventsCollection).UpdateOne(ctx, query, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrUnauthorized
	}

	return nil
}

// AddParticipant adds a participant to an event
func (s *Service) AddParticipant(ctx context.Context, eventID string, userID string, participant *models.EventParticipant) error {
	id, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return ErrInvalidID
	}

	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidUserID
	}

	// Check if user has permission to add participants (must be creator or host)
	query := bson.M{
		"_id": id,
		"$or": []bson.M{
			{"creatorId": uid},
			{"participants": bson.M{
				"$elemMatch": bson.M{
					"userId": uid,
					"role":   "host",
				},
			}},
		},
		"deletedAt": nil,
	}

	var event models.Event
	err = s.db.Collection(eventsCollection).FindOne(ctx, query).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return ErrUnauthorized
		}
		return err
	}

	// Set invite time if not provided
	if participant.InvitedAt.IsZero() {
		participant.InvitedAt = time.Now()
	}

	// Add participant to the event
	updateQuery := bson.M{"_id": id}
	update := bson.M{
		"$push": bson.M{"participants": participant},
		"$set":  bson.M{"updatedAt": time.Now()},
	}

	_, err = s.db.Collection(eventsCollection).UpdateOne(ctx, updateQuery, update)
	return err
}

// AddGift adds a gift to an event
func (s *Service) AddGift(ctx context.Context, eventID string, userID string, gift *models.EventGift) error {
	id, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return ErrInvalidID
	}

	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidUserID
	}

	// Check if user has permission to add gifts (must be participant)
	query := bson.M{
		"_id": id,
		"$or": []bson.M{
			{"creatorId": uid},
			{"participants.userId": uid},
		},
		"deletedAt": nil,
	}

	var event models.Event
	err = s.db.Collection(eventsCollection).FindOne(ctx, query).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return ErrUnauthorized
		}
		return err
	}

	// Set gift metadata
	if gift.ID.IsZero() {
		gift.ID = primitive.NewObjectID()
	}
	now := time.Now()
	gift.CreatedAt = now
	gift.UpdatedAt = now

	// Add gift to the event
	updateQuery := bson.M{"_id": id}
	update := bson.M{
		"$push": bson.M{"gifts": gift},
		"$set":  bson.M{"updatedAt": now},
	}

	_, err = s.db.Collection(eventsCollection).UpdateOne(ctx, updateQuery, update)
	return err
}

// UpdateParticipantStatus updates a participant status (accept/decline invitation)
func (s *Service) UpdateParticipantStatus(ctx context.Context, eventID string, userID string, status string) error {
	id, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return ErrInvalidID
	}

	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidUserID
	}

	// Valid statuses
	validStatuses := map[string]bool{
		"confirmed": true,
		"declined":  true,
		"maybe":     true,
	}

	if !validStatuses[status] {
		return errors.New("invalid status value")
	}

	now := time.Now()

	// Update participant status
	query := bson.M{
		"_id":                 id,
		"participants.userId": uid,
		"deletedAt":           nil,
	}

	update := bson.M{
		"$set": bson.M{
			"participants.$.status":      status,
			"participants.$.respondedAt": now,
			"updatedAt":                  now,
		},
	}

	result, err := s.db.Collection(eventsCollection).UpdateOne(ctx, query, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrEventNotFound
	}

	return nil
}
