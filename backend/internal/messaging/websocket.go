package messaging

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"genie/internal/middleware"
	"genie/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
)

// WebsocketMessage represents a message sent over websocket
type WebsocketMessage struct {
	Type      string                 `json:"type"`
	Payload   map[string]interface{} `json:"payload,omitempty"`
	ChatID    string                 `json:"chatId,omitempty"`
	MessageID string                 `json:"messageId,omitempty"`
}

// Client represents a connected websocket client
type Client struct {
	ID           string
	UserID       string
	Conn         *websocket.Conn
	Send         chan []byte
	Hub          *WebsocketHub
	ActiveChats  map[string]bool // ChatIDs the client is listening to
	LastActivity time.Time
	mu           sync.Mutex
}

// WebsocketHub maintains the set of active clients and broadcasts messages
type WebsocketHub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from the clients
	broadcast chan []byte

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Map of chatID -> []clients
	chatSubscriptions map[string]map[*Client]bool

	// Mutex for thread-safe access to maps
	mu sync.Mutex

	// Service for message operations
	service *Service
}

// NewWebsocketHub creates a new WebSocket hub
func NewWebsocketHub(service *Service) *WebsocketHub {
	return &WebsocketHub{
		broadcast:         make(chan []byte),
		register:          make(chan *Client),
		unregister:        make(chan *Client),
		clients:           make(map[*Client]bool),
		chatSubscriptions: make(map[string]map[*Client]bool),
		service:           service,
	}
}

// Run starts the WebSocket hub
func (h *WebsocketHub) Run() {
	log.Info().Msg("Starting WebSocket hub")
	
	// Start a goroutine to remove inactive clients
	go h.cleanInactiveClients()
	
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)
		
		case client := <-h.unregister:
			h.unregisterClient(client)
		
		case message := <-h.broadcast:
			h.broadcastMessage(message)
		}
	}
}

// registerClient registers a new client
func (h *WebsocketHub) registerClient(client *Client) {
	h.mu.Lock()
	h.clients[client] = true
	h.mu.Unlock()
	log.Info().Str("clientID", client.ID).Str("userID", client.UserID).Msg("Client registered")
}

// unregisterClient unregisters a client and closes the connection
func (h *WebsocketHub) unregisterClient(client *Client) {
	h.mu.Lock()
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		// Remove client from all chat subscriptions
		for chatID, clients := range h.chatSubscriptions {
			if _, exists := clients[client]; exists {
				delete(h.chatSubscriptions[chatID], client)
				// If no more clients in this chat, remove the chat subscription
				if len(h.chatSubscriptions[chatID]) == 0 {
					delete(h.chatSubscriptions, chatID)
				}
			}
		}
	}
	h.mu.Unlock()
	
	// Close the send channel and connection
	close(client.Send)
	client.Conn.Close()
	
	log.Info().Str("clientID", client.ID).Str("userID", client.UserID).Msg("Client unregistered")
}

// broadcastMessage sends a message to all connected clients
func (h *WebsocketHub) broadcastMessage(message []byte) {
	// Try to parse the message to determine if it's for a specific chat
	var wsMsg WebsocketMessage
	if err := json.Unmarshal(message, &wsMsg); err != nil {
		log.Error().Err(err).Msg("Error parsing WebSocket message for broadcast")
		return
	}
	
	// If it's a chat message, only send to clients subscribed to that chat
	if wsMsg.ChatID != "" {
		h.mu.Lock()
		clients, exists := h.chatSubscriptions[wsMsg.ChatID]
		h.mu.Unlock()
		
		if exists {
			for client := range clients {
				select {
				case client.Send <- message:
					// Update client's last activity
					client.mu.Lock()
					client.LastActivity = time.Now()
					client.mu.Unlock()
				default:
					// If the client's send buffer is full, unregister the client
					h.unregister <- client
				}
			}
		}
		return
	}
	
	// If no chatID specified, broadcast to all clients
	h.mu.Lock()
	for client := range h.clients {
		select {
		case client.Send <- message:
			// Update client's last activity
			client.mu.Lock()
			client.LastActivity = time.Now()
			client.mu.Unlock()
		default:
			// If the client's send buffer is full, unregister the client
			h.unregister <- client
		}
	}
	h.mu.Unlock()
}

// SubscribeToChat subscribes a client to a specific chat
func (h *WebsocketHub) SubscribeToChat(client *Client, chatID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	
	// Initialize map for this chat if it doesn't exist
	if _, exists := h.chatSubscriptions[chatID]; !exists {
		h.chatSubscriptions[chatID] = make(map[*Client]bool)
	}
	
	// Add client to chat subscription
	h.chatSubscriptions[chatID][client] = true
	
	// Update client's active chats
	client.mu.Lock()
	client.ActiveChats[chatID] = true
	client.mu.Unlock()
	
	log.Info().Str("clientID", client.ID).Str("chatID", chatID).Msg("Client subscribed to chat")
}

// UnsubscribeFromChat unsubscribes a client from a specific chat
func (h *WebsocketHub) UnsubscribeFromChat(client *Client, chatID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	
	// Remove client from chat subscription
	if chatClients, exists := h.chatSubscriptions[chatID]; exists {
		delete(chatClients, client)
		
		// If no more clients in this chat, remove the chat subscription
		if len(chatClients) == 0 {
			delete(h.chatSubscriptions, chatID)
		}
	}
	
	// Update client's active chats
	client.mu.Lock()
	delete(client.ActiveChats, chatID)
	client.mu.Unlock()
	
	log.Info().Str("clientID", client.ID).Str("chatID", chatID).Msg("Client unsubscribed from chat")
}

// SendMessageToChat sends a message to all clients subscribed to a chat
func (h *WebsocketHub) SendMessageToChat(chatID string, message []byte) {
	h.mu.Lock()
	clients, exists := h.chatSubscriptions[chatID]
	h.mu.Unlock()
	
	if exists {
		for client := range clients {
			select {
			case client.Send <- message:
				// Update client's last activity
				client.mu.Lock()
				client.LastActivity = time.Now()
				client.mu.Unlock()
			default:
				// If the client's send buffer is full, unregister the client
				h.unregister <- client
			}
		}
	}
}

// NotifyNewMessage sends a notification about a new message to all clients subscribed to a chat
func (h *WebsocketHub) NotifyNewMessage(message *models.Message) {
	// Don't notify clients about their own messages
	chatID := message.ChatID.Hex()
	senderID := message.SenderID.Hex()
	
	// Prepare message data
	wsMsg := WebsocketMessage{
		Type:      "new_message",
		ChatID:    chatID,
		MessageID: message.ID.Hex(),
		Payload: map[string]interface{}{
			"message": message.ToResponse(),
		},
	}
	
	// Convert to JSON
	data, err := json.Marshal(wsMsg)
	if err != nil {
		log.Error().Err(err).Msg("Error serializing new message notification")
		return
	}
	
	// Send to all clients in the chat (except sender)
	h.mu.Lock()
	clients, exists := h.chatSubscriptions[chatID]
	h.mu.Unlock()
	
	if exists {
		for client := range clients {
			// Skip the sender
			if client.UserID == senderID {
				continue
			}
			
			select {
			case client.Send <- data:
				// Update client's last activity
				client.mu.Lock()
				client.LastActivity = time.Now()
				client.mu.Unlock()
			default:
				// If the client's send buffer is full, unregister the client
				h.unregister <- client
			}
		}
	}
}

// cleanInactiveClients removes clients that have been inactive for too long
func (h *WebsocketHub) cleanInactiveClients() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		now := time.Now()
		inactiveThreshold := 30 * time.Minute // Disconnect clients inactive for 30 minutes
		
		// Find inactive clients
		var inactiveClients []*Client
		h.mu.Lock()
		for client := range h.clients {
			client.mu.Lock()
			if now.Sub(client.LastActivity) > inactiveThreshold {
				inactiveClients = append(inactiveClients, client)
			}
			client.mu.Unlock()
		}
		h.mu.Unlock()
		
		// Unregister all inactive clients
		for _, client := range inactiveClients {
			log.Info().Str("clientID", client.ID).Str("userID", client.UserID).Msg("Unregistering inactive client")
			h.unregister <- client
		}
	}
}

// readPump pumps messages from the websocket connection to the hub
func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
	}()
	
	// Set read deadline and pong handler
	c.Conn.SetReadLimit(1024 * 1024) // 1MB
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		c.mu.Lock()
		c.LastActivity = time.Now()
		c.mu.Unlock()
		return nil
	})
	
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Error().Err(err).Str("clientID", c.ID).Msg("Unexpected close error")
			}
			break
		}
		
		// Update last activity
		c.mu.Lock()
		c.LastActivity = time.Now()
		c.mu.Unlock()
		
		// Process the message
		go c.processMessage(message)
	}
}

// writePump pumps messages from the hub to the websocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	
	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// The hub closed the channel
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)
			
			// Add queued messages to the current websocket message
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}
			
			if err := w.Close(); err != nil {
				return
			}
		
		case <-ticker.C:
			// Send ping message
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// processMessage processes an incoming message from the client
func (c *Client) processMessage(data []byte) {
	var msg WebsocketMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Error().Err(err).Str("clientID", c.ID).Msg("Invalid message format")
		return
	}
	
	switch msg.Type {
	case "subscribe":
		// Subscribe to a chat
		if chatID, ok := msg.Payload["chatId"].(string); ok {
			// Verify that the user has access to this chat
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			
			_, err := c.Hub.service.GetChat(ctx, chatID, c.UserID)
			if err != nil {
				log.Warn().Err(err).Str("clientID", c.ID).Str("chatID", chatID).Msg("User has no access to chat")
				
				// Send error message back
				errorMsg := WebsocketMessage{
					Type: "error",
					Payload: map[string]interface{}{
						"message": "You don't have access to this chat",
						"code":    "chat_access_denied",
					},
				}
				data, _ := json.Marshal(errorMsg)
				c.Send <- data
				return
			}
			
			// User has access, subscribe
			c.Hub.SubscribeToChat(c, chatID)
			
			// Send confirmation
			confirmMsg := WebsocketMessage{
				Type: "subscribed",
				Payload: map[string]interface{}{
					"chatId": chatID,
				},
			}
			data, _ := json.Marshal(confirmMsg)
			c.Send <- data
		}
	
	case "unsubscribe":
		// Unsubscribe from a chat
		if chatID, ok := msg.Payload["chatId"].(string); ok {
			c.Hub.UnsubscribeFromChat(c, chatID)
			
			// Send confirmation
			confirmMsg := WebsocketMessage{
				Type: "unsubscribed",
				Payload: map[string]interface{}{
					"chatId": chatID,
				},
			}
			data, _ := json.Marshal(confirmMsg)
			c.Send <- data
		}
	
	case "message":
		// Send a new message
		if chatID, ok := msg.Payload["chatId"].(string); ok {
			content, hasContent := msg.Payload["content"].(string)
			mediaURL, hasMediaURL := msg.Payload["mediaUrl"].(string)
			msgType, hasType := msg.Payload["type"].(string)
			
			if !hasContent && !hasMediaURL {
				// Message must have content or media
				errorMsg := WebsocketMessage{
					Type: "error",
					Payload: map[string]interface{}{
						"message": "Message must have content or media",
						"code":    "invalid_message",
					},
				}
				data, _ := json.Marshal(errorMsg)
				c.Send <- data
				return
			}
			
			if !hasType {
				msgType = string(models.MessageTypeText)
			}
			
			// Create message request
			request := models.NewMessageRequest{
				ChatID:   chatID,
				Type:     models.MessageType(msgType),
				Content:  content,
				MediaURL: mediaURL,
			}
			
			// Send the message
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			
			message, err := c.Hub.service.SendMessage(ctx, request, c.UserID)
			if err != nil {
				log.Error().Err(err).Str("clientID", c.ID).Str("chatID", chatID).Msg("Failed to send message")
				
				// Send error message back
				errorMsg := WebsocketMessage{
					Type: "error",
					Payload: map[string]interface{}{
						"message": "Failed to send message: " + err.Error(),
						"code":    "send_failed",
					},
				}
				data, _ := json.Marshal(errorMsg)
				c.Send <- data
				return
			}
			
			// Send success response back to sender
			successMsg := WebsocketMessage{
				Type: "message_sent",
				Payload: map[string]interface{}{
					"messageId": message.ID.Hex(),
					"chatId":    chatID,
					"message":   message.ToResponse(),
				},
			}
			data, _ := json.Marshal(successMsg)
			c.Send <- data
			
			// Notify other clients about the new message
			c.Hub.NotifyNewMessage(message)
		}
	
	case "read":
		// Mark messages as read
		if messageID, ok := msg.Payload["messageId"].(string); ok {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			
			err := c.Hub.service.MarkMessageRead(ctx, messageID, c.UserID)
			if err != nil {
				log.Error().Err(err).Str("clientID", c.ID).Str("messageID", messageID).Msg("Failed to mark message as read")
				return
			}
			
			// No need to send confirmation
		}
	
	case "typing":
		// User is typing in a chat
		if chatID, ok := msg.Payload["chatId"].(string); ok {
			// Broadcast typing notification to other clients in the chat
			typingMsg := WebsocketMessage{
				Type:   "typing",
				ChatID: chatID,
				Payload: map[string]interface{}{
					"userId": c.UserID,
				},
			}
			
			data, _ := json.Marshal(typingMsg)
			c.Hub.SendMessageToChat(chatID, data)
		}
	
	case "ping":
		// Client ping to keep connection alive
		pongMsg := WebsocketMessage{
			Type: "pong",
			Payload: map[string]interface{}{
				"timestamp": time.Now().Unix(),
			},
		}
		data, _ := json.Marshal(pongMsg)
		c.Send <- data
	
	default:
		log.Warn().Str("clientID", c.ID).Str("type", msg.Type).Msg("Unknown message type")
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins in development
		return true
	},
}

// ServeWs handles websocket requests from clients
func ServeWs(hub *WebsocketHub, c *gin.Context) {
	// Get user ID from context
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	
	// Generate a client ID
	clientID := fmt.Sprintf("%s_%d", userID, time.Now().UnixNano())
	
	// Upgrade GET request to a websocket connection
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to upgrade to websocket connection")
		return
	}
	
	// Create a new client
	client := &Client{
		ID:           clientID,
		UserID:       userID,
		Conn:         conn,
		Send:         make(chan []byte, 256),
		Hub:          hub,
		ActiveChats:  make(map[string]bool),
		LastActivity: time.Now(),
	}
	
	// Register the client with the hub
	client.Hub.register <- client
	
	// Start goroutines for reading from and writing to the client
	go client.readPump()
	go client.writePump()
	
	// Send welcome message to client
	welcomeMsg := WebsocketMessage{
		Type: "connected",
		Payload: map[string]interface{}{
			"clientId": clientID,
			"message":  "Connected to messaging service",
		},
	}
	data, _ := json.Marshal(welcomeMsg)
	client.Send <- data
}

// SetupWebsocketHandler sets up the WebSocket handler
func SetupWebsocketHandler(service *Service, router *gin.RouterGroup, authMiddleware gin.HandlerFunc) *WebsocketHub {
	hub := NewWebsocketHub(service)
	go hub.Run()
	
	// WebSocket endpoint
	router.GET("/ws", authMiddleware, func(c *gin.Context) {
		ServeWs(hub, c)
	})
	
	return hub
}