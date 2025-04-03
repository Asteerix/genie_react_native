package events

import (
	"context"
	"fmt"
	"strings"
	"time"

	"genie/internal/models"
)

// PredefinedEvent represents an event template with predefined parameters
type PredefinedEvent struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Type        string   `json:"type"` // collectif, individuel, special
	Icon        string   `json:"icon"`
	Emojis      []string `json:"emojis"`
	DefaultDate string   `json:"defaultDate,omitempty"`
	Invitations string   `json:"invitations"`
	Info        string   `json:"info,omitempty"`
	DateFormat  string   `json:"dateFormat,omitempty"`
}

// List of all collective predefined events in the system
var collectiveEvents = []PredefinedEvent{
	{
		ID:          "noel",
		Name:        "Noël",
		Type:        "collectif",
		Icon:        "🎄",
		Emojis:      []string{"🎄", "🎅", "☃️", "❄️"},
		DefaultDate: "25 Décembre",
		Invitations: "Tous le monde",
	},
	{
		ID:          "saint_valentin",
		Name:        "Saint Valentin",
		Type:        "collectif",
		Icon:        "❤️",
		Emojis:      []string{"💝", "❤️", "💕", "💘"},
		DefaultDate: "14 Février",
		Invitations: "Qté 1 personne de +18 ans",
	},
	{
		ID:          "nouvel_an_lunaire",
		Name:        "Nouvel an lunaire",
		Type:        "collectif",
		Icon:        "🏮",
		Emojis:      []string{"🧧", "🐲", "🎊", "🌙"},
		DefaultDate: "29 Janvier",
		Invitations: "Tous le monde",
	},
	{
		ID:          "nouvel_an",
		Name:        "Nouvel an",
		Type:        "collectif",
		Icon:        "🎉",
		Emojis:      []string{"🎆", "🍾", "🎊", "🎇"},
		DefaultDate: "1 Janvier",
		Invitations: "Tous le monde",
	},
	{
		ID:          "kwanzaa",
		Name:        "Kwanzaa",
		Type:        "collectif",
		Icon:        "🕯️",
		Emojis:      []string{"🕯️", "🌟", "🥣", "📚"},
		DefaultDate: "26 Décembre",
		Invitations: "Tous le monde",
	},
	{
		ID:          "raksha_bandhan",
		Name:        "Raksha Bandhan",
		Type:        "collectif",
		Icon:        "🪢",
		Emojis:      []string{"🪢", "🌸", "🎁", "🥘"},
		DefaultDate: "19 Août",
		Invitations: "Tous le monde",
	},
	{
		ID:          "vesak",
		Name:        "Vesak",
		Type:        "collectif",
		Icon:        "🪷",
		Emojis:      []string{"🪷", "🛕", "🪔", "🧎‍♂️"},
		DefaultDate: "12 Mai",
		Invitations: "Tous le monde",
	},
	{
		ID:          "pesach",
		Name:        "Pesach",
		Type:        "collectif",
		Icon:        "🍷",
		Emojis:      []string{"🍷", "🥖", "🥗", "✡️"},
		DefaultDate: "15 Avril",
		Invitations: "Tous le monde",
	},
	{
		ID:          "hanoukka",
		Name:        "Hanoukka",
		Type:        "collectif",
		Icon:        "🕎",
		Emojis:      []string{"🕎", "🕯️", "🍩", "✡️"},
		DefaultDate: "25 Décembre",
		Invitations: "Tous le monde",
	},
	{
		ID:          "diwali",
		Name:        "Diwali",
		Type:        "collectif",
		Icon:        "🪔",
		Emojis:      []string{"🪔", "🪄", "🟣", "✨"},
		DefaultDate: "31 Octobre",
		Invitations: "Tous le monde",
	},
	{
		ID:          "eid_al_adha",
		Name:        "Eid al-Adha",
		Type:        "collectif",
		Icon:        "🐑",
		Emojis:      []string{"🐑", "☪️", "🍲", "🥮"},
		DefaultDate: "5 Juin",
		Invitations: "Tous le monde",
	},
	{
		ID:          "eid_al_fitr",
		Name:        "Eid al-Fitr",
		Type:        "collectif",
		Icon:        "🌙",
		Emojis:      []string{"🌙", "☪️", "🍲", "🥮"},
		DefaultDate: "20 Mars",
		Invitations: "Tous le monde",
	},
	{
		ID:          "carnaval",
		Name:        "Carnaval",
		Type:        "collectif",
		Icon:        "🎭",
		Emojis:      []string{"🎭", "🎪", "🎵", "🥂"},
		DefaultDate: "27 Février",
		Invitations: "Tous le monde",
	},
	{
		ID:          "mi_automne",
		Name:        "Mi-automne",
		Type:        "collectif",
		Icon:        "🥮",
		Emojis:      []string{"🥮", "🏮", "🎑", "🌕"},
		DefaultDate: "17 Septembre",
		Invitations: "Tous le monde",
	},
	{
		ID:          "saint_jean",
		Name:        "Saint-Jean",
		Type:        "collectif",
		Icon:        "🔥",
		Emojis:      []string{"🔥", "🪵", "🟣", "🏕️"},
		DefaultDate: "24 Juin",
		Invitations: "Tous le monde",
	},
}

// List of all individual predefined events
var individualEvents = []PredefinedEvent{
	{
		ID:          "anniversaire",
		Name:        "Anniversaire",
		Type:        "individuel",
		Icon:        "🎂",
		Emojis:      []string{"🎂", "🎉", "🍰", "🥳"},
		DateFormat:  "personal",
		Info:        "C'est l'anniversaire de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "fiancailles",
		Name:        "Fiançailles",
		Type:        "individuel",
		Icon:        "💍",
		Emojis:      []string{"💍", "❤️", "🥂", "💑"},
		DateFormat:  "date_du_jour",
		Info:        "C'est les fiançailles de {names}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "mariage",
		Name:        "Mariage",
		Type:        "individuel",
		Icon:        "👰",
		Emojis:      []string{"👰", "🤵", "💒", "💐"},
		DateFormat:  "date_du_jour",
		Info:        "C'est le mariage de {names}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "bapteme",
		Name:        "Baptême",
		Type:        "individuel",
		Icon:        "👶",
		Emojis:      []string{"👶", "✝️", "🕊️", "💐"},
		DateFormat:  "date_du_jour",
		Info:        "C'est le baptême de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "communion",
		Name:        "Communion",
		Type:        "individuel",
		Icon:        "🍞",
		Emojis:      []string{"🍞", "✝️", "🕊️", "📿"},
		DateFormat:  "date_du_jour",
		Info:        "C'est la communion de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "confirmation",
		Name:        "Confirmation",
		Type:        "individuel",
		Icon:        "🙏",
		Emojis:      []string{"🙏", "✝️", "🕊️", "📿"},
		DateFormat:  "date_du_jour",
		Info:        "C'est la confirmation de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "naissance",
		Name:        "Naissance",
		Type:        "individuel",
		Icon:        "👶",
		Emojis:      []string{"👶", "🍼", "🧸", "🎀"},
		DateFormat:  "date_du_jour",
		Info:        "Annonce l'arrivée de {name}, {poids} g, {taille} cm",
		Invitations: "Tous le monde",
	},
	{
		ID:          "baby_shower",
		Name:        "Baby Shower",
		Type:        "individuel",
		Icon:        "🍼",
		Emojis:      []string{"🍼", "👶", "🧸", "🎀"},
		DateFormat:  "date_du_jour",
		Info:        "C'est l'arrivée de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "gender_reveal",
		Name:        "Gender Reveal",
		Type:        "individuel",
		Icon:        "👼",
		Emojis:      []string{"👼", "👶", "🧸", "🎀"},
		DateFormat:  "date_du_jour",
		Info:        "C'est l'arrivée de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "fete_des_peres",
		Name:        "Fête des pères",
		Type:        "individuel",
		Icon:        "👨",
		Emojis:      []string{"👨", "👔", "🎁", "❤️"},
		DefaultDate: "18 Juin",
		Info:        "C'est la fête de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "fete_des_meres",
		Name:        "Fête des mères",
		Type:        "individuel",
		Icon:        "👩",
		Emojis:      []string{"👩", "🌸", "🎁", "❤️"},
		DefaultDate: "28 Mai",
		Info:        "C'est la fête de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "retraite",
		Name:        "Retraite",
		Type:        "individuel",
		Icon:        "🏖️",
		Emojis:      []string{"🏖️", "🧓", "🎁", "🏝️"},
		DateFormat:  "date_du_jour",
		Info:        "C'est la fête de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "pot_de_depart",
		Name:        "Pot de départ",
		Type:        "individuel",
		Icon:        "🥂",
		Emojis:      []string{"🥂", "🍾", "🎁", "🎊"},
		DateFormat:  "date_du_jour",
		Info:        "C'est le pot de départ de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "a_la_maison",
		Name:        "À la maison",
		Type:        "individuel",
		Icon:        "🏠",
		Emojis:      []string{"🏠", "🏡", "🌱", "🎈"},
		DateFormat:  "date_du_jour",
		Info:        "C'est la fête chez {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "remise_diplomes",
		Name:        "Remise diplômes",
		Type:        "individuel",
		Icon:        "🎓",
		Emojis:      []string{"🎓", "📜", "📚", "🏆"},
		DateFormat:  "date_du_jour",
		Info:        "C'est la remise des diplômes de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "cremaillere",
		Name:        "Crémaillère",
		Type:        "individuel",
		Icon:        "🏡",
		Emojis:      []string{"🏡", "🔑", "🍽️", "🥂"},
		DateFormat:  "date_du_jour",
		Info:        "C'est la crémaillère de {name}, {age} ans",
		Invitations: "Tous le monde",
	},
	{
		ID:          "quinceanera",
		Name:        "Quinceañera",
		Type:        "individuel",
		Icon:        "👑",
		Emojis:      []string{"👑", "🎂", "💃", "🦋"},
		DateFormat:  "personal",
		Info:        "Afficher grâce à la date de naissance",
		Invitations: "Tous le monde",
	},
	{
		ID:          "bar_bat_mitzvah",
		Name:        "Bar/Bat Mitzvah",
		Type:        "individuel",
		Icon:        "✡️",
		Emojis:      []string{"✡️", "📜", "🕯️", "🎊"},
		DateFormat:  "personal",
		Info:        "Afficher grâce à la date de naissance",
		Invitations: "Tous le monde",
	},
}

// Special events
var specialEvents = []PredefinedEvent{
	{
		ID:          "secret_santa",
		Name:        "Secret Santa",
		Type:        "special",
		Icon:        "🎅",
		Emojis:      []string{"🎅", "🎁", "🎄", "🦌"},
		DateFormat:  "date_du_jour",
		Info:        "Les participants sont anonymes...",
		Invitations: "Afficher date du jour",
	},
}

// GetAllPredefinedEvents returns all predefined events in the system
func (s *Service) GetAllPredefinedEvents() []PredefinedEvent {
	// Combine all event types
	allEvents := append([]PredefinedEvent{}, collectiveEvents...)
	allEvents = append(allEvents, individualEvents...)
	allEvents = append(allEvents, specialEvents...)
	return allEvents
}

// GetPredefinedEvent returns a specific predefined event by ID
func (s *Service) GetPredefinedEvent(id string) (*PredefinedEvent, error) {
	// Check in collective events
	for _, event := range collectiveEvents {
		if event.ID == id {
			return &event, nil
		}
	}

	// Check in individual events
	for _, event := range individualEvents {
		if event.ID == id {
			return &event, nil
		}
	}

	// Check in special events
	for _, event := range specialEvents {
		if event.ID == id {
			return &event, nil
		}
	}

	return nil, fmt.Errorf("predefined event not found: %s", id)
}

// Helper function to parse predefined date strings into time.Time
func parsePredefinedDate(dateStr string) (time.Time, error) {
	// Handle various date formats
	currentYear := time.Now().Year()

	// Format: "DD Month"
	parts := strings.Split(dateStr, " ")
	if len(parts) == 2 {
		day := strings.TrimSpace(parts[0])
		month := strings.TrimSpace(parts[1])

		// Map French month names to numbers
		monthMap := map[string]int{
			"Janvier": 1, "Février": 2, "Mars": 3, "Avril": 4,
			"Mai": 5, "Juin": 6, "Juillet": 7, "Août": 8,
			"Septembre": 9, "Octobre": 10, "Novembre": 11, "Décembre": 12,
		}

		monthNum, ok := monthMap[month]
		if !ok {
			return time.Time{}, fmt.Errorf("invalid month: %s", month)
		}

		// Parse the day
		var dayNum int
		_, err := fmt.Sscanf(day, "%d", &dayNum)
		if err != nil {
			return time.Time{}, fmt.Errorf("invalid day: %s", day)
		}

		// Create the date for this year
		return time.Date(currentYear, time.Month(monthNum), dayNum, 0, 0, 0, 0, time.Local), nil
	}

	return time.Time{}, fmt.Errorf("cannot parse date format: %s", dateStr)
}

// CreateFromPredefinedType creates a new event based on a predefined event type
func (s *Service) CreateFromPredefinedType(ctx context.Context, predefinedTypeID string, event *models.Event) (*models.Event, error) {
	// Get the predefined event template
	predefined, err := s.GetPredefinedEvent(predefinedTypeID)
	if err != nil {
		return nil, err
	}

	// Apply predefined attributes to the event
	event.PredefinedType = predefinedTypeID

	// If title is not set, use predefined name
	if event.Title == "" {
		event.Title = predefined.Name
	}

	// Set type based on predefined type
	if string(event.Type) == "" {
		event.Type = models.EventType(predefined.Type)
	}

	// Set emoji and illustration if not provided
	if event.Emoji == "" {
		event.Emoji = predefined.Icon
	}

	if event.Illustration == "" && len(predefined.Emojis) > 0 {
		event.Illustration = predefined.Emojis[0]
	}

	// Handle date from predefined template if needed
	if predefined.DefaultDate != "" && event.StartDate.IsZero() {
		startDate, err := parsePredefinedDate(predefined.DefaultDate)
		if err == nil {
			event.StartDate = startDate
		}
	}

	// Ensure we have a valid start date
	if event.StartDate.IsZero() {
		event.StartDate = time.Now()
	}

	// Create the event using the standard create method
	return s.CreateEvent(ctx, event)
}
