package stories

import (
	"context"
	"errors"
	"log"
	"time"

	"genie/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Service handles operations related to stories
type Service struct {
	db *mongo.Database
}

// NewService creates a new stories service
func NewService(db *mongo.Database) *Service {
	// Ensure indexes for performance
	ctx := context.Background()

	// Index on UserID for efficient querying of user's stories
	userIndex := mongo.IndexModel{
		Keys:    bson.D{primitive.E{Key: "userId", Value: 1}},
		Options: options.Index().SetBackground(true),
	}

	// TTL index on ExpiresAt to automatically delete expired stories
	ttlIndex := mongo.IndexModel{
		Keys:    bson.D{primitive.E{Key: "expiresAt", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(0).SetBackground(true),
	}

	// Compound index for StoryView collection
	viewIndex := mongo.IndexModel{
		Keys:    bson.D{primitive.E{Key: "storyId", Value: 1}, primitive.E{Key: "userId", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	}

	_, err := db.Collection("stories").Indexes().CreateMany(ctx, []mongo.IndexModel{userIndex, ttlIndex})
	if err != nil {
		log.Printf("Warning: failed to create indexes on stories collection: %v", err)
	}

	_, err = db.Collection("storyViews").Indexes().CreateOne(ctx, viewIndex)
	if err != nil {
		log.Printf("Warning: failed to create indexes on storyViews collection: %v", err)
	}

	return &Service{db: db}
}

// CreateStory creates a new story for a user
func (s *Service) CreateStory(ctx context.Context, userID primitive.ObjectID, mediaType models.StoryMediaType, mediaURL string) (*models.Story, error) {
	// Create a new story media
	storyMedia := models.StoryMedia{
		ID:        primitive.NewObjectID(),
		Type:      mediaType,
		URL:       mediaURL,
		Timestamp: time.Now(),
	}

	// Story expires after 24 hours
	expiresAt := time.Now().Add(24 * time.Hour)

	// Create the story
	story := &models.Story{
		ID:        primitive.NewObjectID(),
		UserID:    userID,
		Media:     []models.StoryMedia{storyMedia},
		CreatedAt: time.Now(),
		ExpiresAt: expiresAt,
	}

	// Insert the story into the database
	_, err := s.db.Collection("stories").InsertOne(ctx, story)
	if err != nil {
		return nil, err
	}

	return story, nil
}

// GetUserStories retrieves all stories for a specific user
func (s *Service) GetUserStories(ctx context.Context, userID primitive.ObjectID) ([]models.Story, error) {
	// Find stories that haven't expired yet
	filter := bson.M{
		"userId":    userID,
		"expiresAt": bson.M{"$gt": time.Now()},
	}

	// Use sort to get the most recent stories first
	opts := options.Find().SetSort(bson.M{"createdAt": -1})

	cursor, err := s.db.Collection("stories").Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	// Decode the stories
	var stories []models.Story
	if err := cursor.All(ctx, &stories); err != nil {
		return nil, err
	}

	return stories, nil
}

// GetStory retrieves a specific story by ID
func (s *Service) GetStory(ctx context.Context, storyID primitive.ObjectID) (*models.Story, error) {
	filter := bson.M{"_id": storyID}

	var story models.Story
	err := s.db.Collection("stories").FindOne(ctx, filter).Decode(&story)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("story not found")
		}
		return nil, err
	}

	return &story, nil
}

// DeleteStory removes a story
func (s *Service) DeleteStory(ctx context.Context, storyID, userID primitive.ObjectID) error {
	filter := bson.M{
		"_id":    storyID,
		"userId": userID, // Ensure the user owns the story
	}

	result, err := s.db.Collection("stories").DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("story not found or user is not the owner")
	}

	// Also delete all associated views
	_, err = s.db.Collection("storyViews").DeleteMany(ctx, bson.M{"storyId": storyID})
	return err
}

// MarkStoryAsViewed records that a user has viewed a story
func (s *Service) MarkStoryAsViewed(ctx context.Context, storyID, viewerID primitive.ObjectID) error {
	// Check if story exists
	story, err := s.GetStory(ctx, storyID)
	if err != nil {
		return err
	}

	// Don't mark your own story as viewed
	if story.UserID == viewerID {
		return nil
	}

	// Create view record
	storyView := models.StoryView{
		ID:       primitive.NewObjectID(),
		StoryID:  storyID,
		UserID:   viewerID,
		ViewedAt: time.Now(),
	}

	// Insert or update view record
	opts := options.Update().SetUpsert(true)
	filter := bson.M{
		"storyId": storyID,
		"userId":  viewerID,
	}
	update := bson.M{
		"$set": storyView,
	}

	_, err = s.db.Collection("storyViews").UpdateOne(ctx, filter, update, opts)
	return err
}

// HasUserViewedStory checks if a user has viewed a specific story
func (s *Service) HasUserViewedStory(ctx context.Context, storyID, userID primitive.ObjectID) (bool, error) {
	filter := bson.M{
		"storyId": storyID,
		"userId":  userID,
	}

	count, err := s.db.Collection("storyViews").CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetFriendsWithStories retrieves all friends of a user with their stories
func (s *Service) GetFriendsWithStories(ctx context.Context, userID primitive.ObjectID) ([]models.FriendWithStories, error) {
	// We need to get the user's friends. In this application, we'll query a different way
	// as the User model doesn't have a Friends field.
	// For now, let's query the friends collection or similar table

	// For this fix, since we don't have the actual friends implementation at hand,
	// we'll simulate getting the list of friend IDs
	var friendObjectIDs []primitive.ObjectID

	// Query friends collection or relationship table to get friend IDs
	cursor, err := s.db.Collection("friendships").Find(ctx, bson.M{
		"userId": userID,
		"status": "accepted",
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	// Structure for the friendship document
	type Friendship struct {
		ID       primitive.ObjectID `bson:"_id"`
		UserID   primitive.ObjectID `bson:"userId"`
		FriendID primitive.ObjectID `bson:"friendId"`
		Status   string             `bson:"status"`
	}

	var friendships []Friendship
	if err := cursor.All(ctx, &friendships); err != nil {
		return nil, err
	}

	// Extract friend IDs
	for _, friendship := range friendships {
		friendObjectIDs = append(friendObjectIDs, friendship.FriendID)
	}

	// If no friends found, return an empty slice
	if len(friendObjectIDs) == 0 {
		return []models.FriendWithStories{}, nil
	}

	// Get friends' information
	friendsCursor, err := s.db.Collection("users").Find(ctx, bson.M{"_id": bson.M{"$in": friendObjectIDs}})
	if err != nil {
		return nil, err
	}
	defer friendsCursor.Close(ctx)

	var friends []models.User
	if err := friendsCursor.All(ctx, &friends); err != nil {
		return nil, err
	}

	// Get all active stories for these friends
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"userId":    bson.M{"$in": friendObjectIDs},
				"expiresAt": bson.M{"$gt": time.Now()},
			},
		},
		{
			"$sort": bson.M{"createdAt": -1},
		},
		{
			"$group": bson.M{
				"_id": "$userId",
				"stories": bson.M{
					"$push": "$$ROOT",
				},
			},
		},
	}

	storiesCursor, err := s.db.Collection("stories").Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer storiesCursor.Close(ctx)

	// Map of user ID to their stories
	type userStories struct {
		UserID  primitive.ObjectID `bson:"_id"`
		Stories []models.Story     `bson:"stories"`
	}

	var storiesResult []userStories
	if err := storiesCursor.All(ctx, &storiesResult); err != nil {
		return nil, err
	}

	// Create a map for quick lookup
	storiesMap := make(map[primitive.ObjectID][]models.Story)
	for _, item := range storiesResult {
		storiesMap[item.UserID] = item.Stories
	}

	// Get all stories the current user has viewed
	viewedFilter := bson.M{"userId": userID}
	viewsCursor, err := s.db.Collection("storyViews").Find(ctx, viewedFilter)
	if err != nil {
		return nil, err
	}
	defer viewsCursor.Close(ctx)

	var storyViews []models.StoryView
	if err := viewsCursor.All(ctx, &storyViews); err != nil {
		return nil, err
	}

	// Create a map of viewed story IDs for quick lookup
	viewedStoryIDs := make(map[primitive.ObjectID]bool)
	for _, view := range storyViews {
		viewedStoryIDs[view.StoryID] = true
	}

	// Build the result
	var result []models.FriendWithStories
	for _, friend := range friends {
		friendWithStories := models.FriendWithStories{
			ID:          friend.ID,
			Name:        friend.FirstName + " " + friend.LastName, // Combine first and last name
			Username:    friend.Email,                             // Use email as username since we don't have a username field
			Avatar:      friend.AvatarURL,                         // Use the avatar URL
			PhoneNumber: friend.Phone,
			Email:       friend.Email,
			Stories:     []models.StoryWithViewStatus{},
			HasStory:    false,
		}

		// Add stories for this friend if they have any
		if stories, ok := storiesMap[friend.ID]; ok {
			friendWithStories.HasStory = true

			for _, story := range stories {
				storyWithStatus := models.StoryWithViewStatus{
					Story:  story,
					Viewed: viewedStoryIDs[story.ID],
				}
				friendWithStories.Stories = append(friendWithStories.Stories, storyWithStatus)
			}
		}

		// Only add friends who have stories
		if friendWithStories.HasStory {
			result = append(result, friendWithStories)
		}
	}

	return result, nil
}
