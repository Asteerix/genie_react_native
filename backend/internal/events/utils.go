package events

import (
	"fmt"
	"strings"
	"time"

	"genie/internal/models"
)

// FormatEventInfo processes an event with predefined type and returns formatted information
// This replaces placeholders in the info template with actual data
func FormatEventInfo(event *models.Event, predefined *PredefinedEvent) string {
	if predefined == nil || predefined.Info == "" {
		return event.Description
	}

	formattedInfo := predefined.Info

	// Replace placeholders based on event type
	switch predefined.Type {
	case "individuel":
		// Handle {name} replacement
		if strings.Contains(formattedInfo, "{name}") {
			// Use title or subtitle for the name if not explicitly provided
			name := event.Title
			if event.Subtitle != "" {
				name = event.Subtitle
			}
			formattedInfo = strings.ReplaceAll(formattedInfo, "{name}", name)
		}

		// Handle {names} replacement for couple events (wedding, engagement)
		if strings.Contains(formattedInfo, "{names}") {
			names := event.Title
			if event.Subtitle != "" {
				names = event.Subtitle
			}
			formattedInfo = strings.ReplaceAll(formattedInfo, "{names}", names)
		}

		// Handle {age} replacement for birthdays and similar events
		if strings.Contains(formattedInfo, "{age}") {
			// Calculate age if possible
			age := calculateAge(event.StartDate)
			formattedInfo = strings.ReplaceAll(formattedInfo, "{age}", fmt.Sprintf("%d", age))
		}
	}

	return formattedInfo
}

// calculateAge is a helper function to calculate age based on a birthday
func calculateAge(birthDate time.Time) int {
	now := time.Now()
	age := now.Year() - birthDate.Year()

	// If the birthday hasn't occurred yet this year, subtract one year
	if now.Month() < birthDate.Month() || (now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
		age--
	}

	return age
}

// GenerateEventDescription generates a description for an event based on its type and predefined settings
func GenerateEventDescription(event *models.Event, predefined *PredefinedEvent) string {
	if predefined == nil {
		return event.Description
	}

	// Use the predefined description template if available
	if predefined.Info != "" {
		return FormatEventInfo(event, predefined)
	}

	// Generate a default description
	switch predefined.Type {
	case "collectif":
		return fmt.Sprintf("Célébration de %s", predefined.Name)
	case "individuel":
		switch predefined.ID {
		case "anniversaire":
			age := calculateAge(event.StartDate)
			return fmt.Sprintf("Anniversaire - %d ans", age)
		case "mariage":
			return "Célébration de mariage"
		case "bapteme":
			return "Cérémonie de baptême"
		default:
			return fmt.Sprintf("Célébration de %s", predefined.Name)
		}
	}

	return event.Description
}
