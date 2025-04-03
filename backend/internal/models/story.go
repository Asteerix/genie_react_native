package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// StoryMediaType represents the type of media in a story
type StoryMediaType string

const (
	// MediaTypeImage represents image type media
	MediaTypeImage StoryMediaType = "image"
	// MediaTypeVideo represents video type media
	MediaTypeVideo StoryMediaType = "video"
)

// StoryMedia represents a media item within a story
type StoryMedia struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Type      StoryMediaType     `json:"type" bson:"type"`
	URL       string             `json:"url" bson:"url"`
	Timestamp time.Time          `json:"timestamp" bson:"timestamp"`
}

// Story represents a user's story that expires after 24 hours
type Story struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"userId" bson:"userId"`
	Media     []StoryMedia       `json:"media" bson:"media"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
	ExpiresAt time.Time          `json:"expiresAt" bson:"expiresAt"`
}

// StoryView represents a record of a user viewing a story
type StoryView struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	StoryID   primitive.ObjectID `json:"storyId" bson:"storyId"`
	UserID    primitive.ObjectID `json:"userId" bson:"userId"`
	ViewedAt  time.Time          `json:"viewedAt" bson:"viewedAt"`
}

// StoryWithViewStatus combines a story with info about whether the current user has viewed it
type StoryWithViewStatus struct {
	Story  Story `json:"story" bson:"story"`
	Viewed bool  `json:"viewed" bson:"viewed"`
}

// FriendWithStories represents a friend with their stories
type FriendWithStories struct {
	ID          primitive.ObjectID    `json:"id" bson:"_id,omitempty"`
	Name        string                `json:"name" bson:"name"`
	Username    string                `json:"username" bson:"username"`
	Avatar      string                `json:"avatar" bson:"avatar"`
	PhoneNumber string                `json:"phoneNumber,omitempty" bson:"phoneNumber,omitempty"`
	Email       string                `json:"email,omitempty" bson:"email,omitempty"`
	Stories     []StoryWithViewStatus `json:"stories" bson:"stories"`
	HasStory    bool                  `json:"hasStory" bson:"hasStory"`
}