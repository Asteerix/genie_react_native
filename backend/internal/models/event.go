package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EventType string

const (
	EventTypeCollective EventType = "collectif"
	EventTypeIndividual EventType = "individuel"
	EventTypeSpecial    EventType = "special"
)

type EventLocation struct {
	Address     string `json:"address,omitempty" bson:"address,omitempty"`
	City        string `json:"city,omitempty" bson:"city,omitempty"`
	PostalCode  string `json:"postalCode,omitempty" bson:"postalCode,omitempty"`
	Country     string `json:"country,omitempty" bson:"country,omitempty"`
	Coordinates struct {
		Latitude  float64 `json:"latitude,omitempty" bson:"latitude,omitempty"`
		Longitude float64 `json:"longitude,omitempty" bson:"longitude,omitempty"`
	} `json:"coordinates,omitempty" bson:"coordinates,omitempty"`
}

type EventParticipant struct {
	UserID     primitive.ObjectID `json:"userId" bson:"userId"`
	Role       string             `json:"role" bson:"role"` // host, guest, etc.
	Status     string             `json:"status" bson:"status"` // invited, confirmed, declined
	InvitedAt  time.Time          `json:"invitedAt" bson:"invitedAt"`
	RespondedAt *time.Time         `json:"respondedAt,omitempty" bson:"respondedAt,omitempty"`
}

type EventGift struct {
	ID          primitive.ObjectID  `json:"id,omitempty" bson:"_id,omitempty"`
	Title       string              `json:"title" bson:"title"`
	Description string              `json:"description,omitempty" bson:"description,omitempty"`
	Price       float64             `json:"price,omitempty" bson:"price,omitempty"`
	ImageURL    string              `json:"imageUrl,omitempty" bson:"imageUrl,omitempty"`
	ProductURL  string              `json:"productUrl,omitempty" bson:"productUrl,omitempty"`
	AssignedTo  *primitive.ObjectID `json:"assignedTo,omitempty" bson:"assignedTo,omitempty"`
	Status      string              `json:"status" bson:"status"` // available, reserved, purchased
	CreatedAt   time.Time           `json:"createdAt" bson:"createdAt"`
	UpdatedAt   time.Time           `json:"updatedAt" bson:"updatedAt"`
}

type Event struct {
	ID            primitive.ObjectID  `json:"id,omitempty" bson:"_id,omitempty"`
	Title         string              `json:"title" bson:"title"`
	Subtitle      string              `json:"subtitle,omitempty" bson:"subtitle,omitempty"`
	Description   string              `json:"description,omitempty" bson:"description,omitempty"`
	Type          EventType           `json:"type" bson:"type"`
	PredefinedType string              `json:"predefinedType,omitempty" bson:"predefinedType,omitempty"`
	Emoji         string              `json:"emoji,omitempty" bson:"emoji,omitempty"`
	Color         string              `json:"color,omitempty" bson:"color,omitempty"`
	Illustration  string              `json:"illustration,omitempty" bson:"illustration,omitempty"`
	StartDate     time.Time           `json:"startDate" bson:"startDate"`
	EndDate       *time.Time          `json:"endDate,omitempty" bson:"endDate,omitempty"`
	AllDay        bool                `json:"allDay" bson:"allDay"`
	Location      *EventLocation      `json:"location,omitempty" bson:"location,omitempty"`
	CreatorID     primitive.ObjectID  `json:"creatorId" bson:"creatorId"`
	Participants  []EventParticipant  `json:"participants" bson:"participants"`
	Gifts         []EventGift         `json:"gifts,omitempty" bson:"gifts,omitempty"`
	IsPrivate     bool                `json:"isPrivate" bson:"isPrivate"`
	CreatedAt     time.Time           `json:"createdAt" bson:"createdAt"`
	UpdatedAt     time.Time           `json:"updatedAt" bson:"updatedAt"`
	DeletedAt     *time.Time          `json:"deletedAt,omitempty" bson:"deletedAt,omitempty"`
}