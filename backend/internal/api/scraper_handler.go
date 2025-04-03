package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"genie/internal/scraper"
)

// Article représente un article lié à un produit
type Article struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	ImageURL    string    `json:"imageUrl"`
	PublishedAt time.Time `json:"publishedAt"`
	URL         string    `json:"url"`
	ProductID   string    `json:"productId"`
	BrandID     string    `json:"brandId"`
}

// ScraperHandler gère les requêtes liées au scraper
type ScraperHandler struct {
	scraperManager *scraper.ScraperManager
}

// UpdateCache met à jour le cache des produits
func (h *ScraperHandler) UpdateCache() {
	log.Info().Msg("Mise à jour du cache des produits via le handler")
	h.scraperManager.UpdateCache()
}

// NewScraperHandler crée un nouveau gestionnaire de scraper
func NewScraperHandler() *ScraperHandler {
	return &ScraperHandler{
		scraperManager: scraper.NewScraperManager(),
	}
}

// RegisterRoutes enregistre les routes du scraper
func (h *ScraperHandler) RegisterRoutes(router gin.IRouter) {
	log.Info().Msg("Enregistrement des routes du scraper")

	// Enregistrement explicite des routes pour les produits par marque et inspiration
	log.Info().Str("route", "/scraper/brands/:brandID/products").Msg("Route enregistrée")
	router.GET("/scraper/brands/:brandID/products", h.GetProductsByBrand)

	log.Info().Str("route", "/scraper/inspirations/:inspiration/products").Msg("Route enregistrée")
	router.GET("/scraper/inspirations/:inspiration/products", h.GetProductsByInspiration)

	// Les routes suivantes sont peut-être aussi dans main.go, mais on les laisse commentées ici pour l'instant
	// log.Info().Str("route", "/scraper/brands/:brandID/new-products").Msg("Route enregistrée")
	// router.GET("/scraper/brands/:brandID/new-products", h.GetNewProductsByBrand) // Assurez-vous que ce handler existe si décommenté
	// log.Info().Str("route", "/scraper/test").Msg("Route enregistrée")
	// router.GET("/scraper/test", h.SomeTestHandler) // Assurez-vous que ce handler existe si décommenté
	// Nouvelles routes pour les articles des produits
	log.Info().Str("route", "/scraper/brands/:brandID/products/:productID/articles").Msg("Route enregistrée")
	router.GET("/scraper/brands/:brandID/products/:productID/articles", h.GetProductArticles)

	log.Info().Str("route", "/scraper/brands/:brandID/new-products/:productID/articles").Msg("Route enregistrée")
	router.GET("/scraper/brands/:brandID/new-products/:productID/articles", h.GetNewProductArticles)

	log.Info().Str("route", "/scraper/inspirations/:inspiration/products/:productID/articles").Msg("Route enregistrée")
	router.GET("/scraper/inspirations/:inspiration/products/:productID/articles", h.GetInspirationProductArticles)

	// Routes pour les filtres
	log.Info().Str("route", "/scraper/filters").Msg("Route enregistrée")
	router.GET("/scraper/filters", h.GetFilters)

	// Route pour les catégories (même contenu que les filtres)
	log.Info().Str("route", "/scraper/categories").Msg("Route enregistrée")
	router.GET("/scraper/categories", h.GetCategories)

	log.Info().Str("route", "/scraper/filters/:filterID/brands").Msg("Route enregistrée")
	router.GET("/scraper/filters/:filterID/brands", h.GetFilterBrands)

	// Route pour récupérer toutes les marques
	log.Info().Str("route", "/scraper/brands").Msg("Route enregistrée")
	router.GET("/scraper/brands", h.GetAllBrands)

	// Nouvelles routes pour les nouveautés et les inspirations
	log.Info().Str("route", "/scraper/new-products").Msg("Route enregistrée")
	router.GET("/scraper/new-products", h.GetNewProducts)

	log.Info().Str("route", "/scraper/inspirations").Msg("Route enregistrée")
	router.GET("/scraper/inspirations", h.GetInspirations)

	// Nouvelle route pour lire uniquement depuis le cache
	log.Info().Str("route", "/scraper/cached-brands/:brandID/products").Msg("Route enregistrée (cache only)")
	router.GET("/scraper/cached-brands/:brandID/products", h.GetCachedProductsByBrand)

	// Nouvelle route pour récupérer les inspirations depuis le cache
	log.Info().Str("route", "/scraper/cached-inspirations").Msg("Route enregistrée (cache only)")
	router.GET("/scraper/cached-inspirations", h.GetCachedInspirations)
}

// GetCachedInspirations récupère les inspirations depuis le cache
func (h *ScraperHandler) GetCachedInspirations(c *gin.Context) {
	// Accéder au cache d'inspirations via le scraperManager (suppose une méthode GetCachedInspirations)
	inspirations, lastUpdated, cacheValid := h.scraperManager.GetCachedInspirations()

	if !cacheValid {
		log.Warn().Msg("Le cache inspirations n'est pas valide ou est expiré, renvoi des données potentiellement obsolètes")
		// Optionnel: Déclencher une mise à jour asynchrone si le cache est expiré
		// go h.scraperManager.UpdateCache() // Déclenche la mise à jour des deux caches
	}

	if len(inspirations) == 0 {
		log.Info().Msg("Cache inspirations vide ou non trouvé")
		// Renvoyer un tableau vide plutôt qu'une erreur 404
		c.JSON(http.StatusOK, []scraper.Inspiration{})
		return
	}

	// Convertir la map en slice pour la réponse JSON
	var inspirationsList []scraper.Inspiration
	for _, insp := range inspirations {
		inspirationsList = append(inspirationsList, insp)
	}

	// Trier la liste par nom pour une réponse cohérente
	sort.Slice(inspirationsList, func(i, j int) bool {
		return inspirationsList[i].Name < inspirationsList[j].Name
	})

	log.Info().Int("count", len(inspirationsList)).Time("lastUpdated", lastUpdated).Bool("cacheValid", cacheValid).Msg("Inspirations récupérées depuis le cache")
	c.JSON(http.StatusOK, inspirationsList)
}

// GetAllBrands récupère toutes les marques disponibles
func (h *ScraperHandler) GetAllBrands(c *gin.Context) {
	// Lire directement le fichier JSON
	cacheFilePath := "./cache/products_cache.json"
	data, err := os.ReadFile(cacheFilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la lecture du fichier de cache"})
		return
	}

	// Structure pour décoder le cache
	var cacheData struct {
		LastUpdated string                       `json:"lastUpdated"`
		Products    map[string][]scraper.Product `json:"products"`
	}

	// Décoder le JSON
	if err := json.Unmarshal(data, &cacheData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage du cache"})
		return
	}

	// Récupérer les détails des marques qui ont au moins un produit
	var brandDetails []map[string]string

	// Parcourir les marques dans le cache
	for brandID, products := range cacheData.Products {
		if len(products) > 0 {
			// Convertir l'ID de la marque en nom d'affichage
			brandName := convertBrandIDToName(brandID)

			// Construire l'URL du logo
			logoURL := getBrandLogoURL(brandID)

			brandDetails = append(brandDetails, map[string]string{
				"id":   brandID,
				"name": brandName,
				"logo": logoURL,
			})
		}
	}

	c.JSON(http.StatusOK, brandDetails)
}

// GetProductsByBrand récupère les produits d'une marque
func (h *ScraperHandler) GetProductsByBrand(c *gin.Context) {
	brandID := c.Param("brandID")

	products, err := h.scraperManager.GetProductsByBrand(brandID)
	if err != nil {
		log.Error().Err(err).Str("brandID", brandID).Msg("Erreur lors de la récupération des produits")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des produits"})
		return
	}

	c.JSON(http.StatusOK, products)
}

// GetCachedProductsByBrand récupère les produits d'une marque UNIQUEMENT depuis le cache
func (h *ScraperHandler) GetCachedProductsByBrand(c *gin.Context) {
	brandID := c.Param("brandID")

	// Utiliser la nouvelle méthode GetCachedProducts du scraperManager
	cachedProducts, exists := h.scraperManager.GetCachedProducts(brandID)

	if !exists {
		log.Warn().Str("brandID", brandID).Msg("Marque non trouvée dans le cache (cache only route)")
		// Retourner un tableau vide si la marque n'est pas dans le cache
		c.JSON(http.StatusOK, []scraper.Product{}) // Retourner un tableau vide et non une erreur 404
		return
	}

	log.Debug().Str("brandID", brandID).Int("productCount", len(cachedProducts)).Msg("Produits récupérés depuis le cache (cache only route)")
	c.JSON(http.StatusOK, cachedProducts)
}

// GetNewProductsByBrand récupère les nouveaux produits d'une marque
func (h *ScraperHandler) GetNewProductsByBrand(c *gin.Context) {
	brandID := c.Param("brandID")

	products, err := h.scraperManager.GetNewProductsByBrand(brandID)
	if err != nil {
		log.Error().Err(err).Str("brandID", brandID).Msg("Erreur lors de la récupération des nouveaux produits")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des nouveaux produits"})
		return
	}

	c.JSON(http.StatusOK, products)
}

// GetProductsByInspiration récupère les produits correspondant à une inspiration depuis le cache
func (h *ScraperHandler) GetProductsByInspiration(c *gin.Context) {
	inspirationParam := c.Param("inspiration")

	// Convertir l'inspiration en format interne
	inspirationID := convertInspirationToID(inspirationParam)

	// Récupérer le cache d'inspirations
	inspirationsCache, _, cacheValid := h.scraperManager.GetCachedInspirations() // Utilise la méthode existante

	// Vérifier si l'inspiration demandée existe dans le cache
	inspirationData, exists := inspirationsCache[inspirationID]
	if !exists {
		log.Warn().Str("inspirationID", inspirationID).Msg("Inspiration non trouvée dans le cache")
		// Si l'inspiration n'existe pas dans le cache, retourner une liste vide
		c.JSON(http.StatusOK, []scraper.Product{})
		return
	}

	if !cacheValid {
		log.Warn().Str("inspirationID", inspirationID).Msg("Le cache inspirations n'est pas valide ou est expiré, renvoi des données potentiellement obsolètes")
		// On renvoie quand même les données du cache, même si obsolètes,
		// car la mise à jour se fait en arrière-plan.
	}

	log.Info().Str("inspirationID", inspirationID).Int("productCount", len(inspirationData.Products)).Msg("Produits récupérés depuis le cache inspirations")
	c.JSON(http.StatusOK, inspirationData.Products)
}

// convertInspirationToID convertit le nom de l'inspiration en ID interne
func convertInspirationToID(inspiration string) string {
	inspiration = strings.ToLower(inspiration)

	switch inspiration {
	case "noël", "noel", "christmas":
		return "christmas"
	case "saint-valentin", "saint valentin", "valentine":
		return "valentine"
	case "anniversaire fille", "anniversaire-fille", "girl-birthday", "girl_birthday":
		return "girl_birthday"
	case "anniversaire garçon", "anniversaire-garçon", "boy-birthday", "boy_birthday":
		return "boy_birthday"
	case "mariage", "wedding":
		return "wedding"
	case "baby shower", "baby-shower", "baby_shower":
		return "baby_shower"
	case "fête des mères", "fete des meres", "mothers-day", "mothers_day":
		return "mothers_day"
	case "fête des pères", "fete des peres", "fathers-day", "fathers_day":
		return "fathers_day"
	default:
		return inspiration
	}
}

// GetProductArticles récupère les articles d'un produit spécifique d'une marque
func (h *ScraperHandler) GetProductArticles(c *gin.Context) {
	brandID := c.Param("brandID")
	productID := c.Param("productID")

	// Récupérer le produit pour vérifier qu'il existe
	products, err := h.scraperManager.GetProductsByBrand(brandID)
	if err != nil {
		log.Error().Err(err).Str("brandID", brandID).Msg("Erreur lors de la récupération des produits")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des produits"})
		return
	}

	// Vérifier si le produit existe
	var targetProduct *scraper.Product
	for i, product := range products {
		if product.ID == productID {
			targetProduct = &products[i]
			break
		}
	}

	if targetProduct == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produit non trouvé"})
		return
	}

	// Générer des articles fictifs pour le produit
	articles := generateArticlesForProduct(targetProduct, brandID, false)
	c.JSON(http.StatusOK, articles)
}

// GetNewProductArticles récupère les articles d'un nouveau produit spécifique d'une marque
func (h *ScraperHandler) GetNewProductArticles(c *gin.Context) {
	brandID := c.Param("brandID")
	productID := c.Param("productID")

	// Récupérer le produit pour vérifier qu'il existe
	products, err := h.scraperManager.GetNewProductsByBrand(brandID)
	if err != nil {
		log.Error().Err(err).Str("brandID", brandID).Msg("Erreur lors de la récupération des nouveaux produits")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des nouveaux produits"})
		return
	}

	// Vérifier si le produit existe
	var targetProduct *scraper.Product
	for i, product := range products {
		if product.ID == productID {
			targetProduct = &products[i]
			break
		}
	}

	if targetProduct == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nouveau produit non trouvé"})
		return
	}

	// Générer des articles fictifs pour le produit
	articles := generateArticlesForProduct(targetProduct, brandID, true)
	c.JSON(http.StatusOK, articles)
}

// GetInspirationProductArticles récupère les articles d'un produit spécifique d'une inspiration
func (h *ScraperHandler) GetInspirationProductArticles(c *gin.Context) {
	inspiration := c.Param("inspiration")
	productID := c.Param("productID")

	// Convertir l'inspiration en format interne
	inspirationID := convertInspirationToID(inspiration)

	// Récupérer le produit pour vérifier qu'il existe
	products, err := h.scraperManager.GetProductsByInspiration(inspirationID)
	if err != nil {
		log.Error().Err(err).Str("inspiration", inspiration).Msg("Erreur lors de la récupération des produits par inspiration")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des produits par inspiration"})
		return
	}

	// Vérifier si le produit existe
	var targetProduct *scraper.Product
	for i, product := range products {
		if product.ID == productID {
			targetProduct = &products[i]
			break
		}
	}

	if targetProduct == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produit d'inspiration non trouvé"})
		return
	}

	// Générer des articles fictifs pour le produit d'inspiration
	articles := generateArticlesForInspiration(targetProduct, inspirationID)
	c.JSON(http.StatusOK, articles)
}

// GetFilters récupère les filtres qui ont des marques avec des produits
func (h *ScraperHandler) GetFilters(c *gin.Context) {
	// Lire le cache des produits
	cacheFilePath := "./cache/products_cache.json"
	data, err := os.ReadFile(cacheFilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la lecture du cache"})
		return
	}

	// Décoder le cache
	var cacheData struct {
		LastUpdated string                       `json:"lastUpdated"`
		Products    map[string][]scraper.Product `json:"products"`
	}
	if err := json.Unmarshal(data, &cacheData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage du cache"})
		return
	}

	// Préparer tous les filtres possibles avec leurs noms d'affichage
	var allFilters []map[string]interface{}
	for filterID, displayName := range filterNames {
		allFilters = append(allFilters, map[string]interface{}{
			"id":   filterID,
			"name": displayName,
		})
	}

	// Filtrer les catégories qui ont des marques avec des produits
	var activeFilters []map[string]interface{}
	for _, filter := range allFilters {
		filterID := filter["id"].(string)
		// Vérifier si des marques de cette catégorie ont des produits
		hasBrandsWithProducts := false

		// Vérifier chaque marque dans la catégorie
		for brandID := range cacheData.Products {
			if len(cacheData.Products[brandID]) > 0 {
				// Vérifier si la marque appartient à cette catégorie
				brands, exists := brandCategories[filterID]
				if exists && contains(brands, brandID) {
					hasBrandsWithProducts = true
					break
				}
			}
		}

		if hasBrandsWithProducts {
			activeFilters = append(activeFilters, filter)
		}
	}

	c.JSON(http.StatusOK, activeFilters)
}

// contains vérifie si une string est présente dans un slice
func contains(slice []string, str string) bool {
	for _, v := range slice {
		if v == str {
			return true
		}
	}
	return false
}

// GetCategories récupère toutes les catégories disponibles (même contenu que les filtres)
func (h *ScraperHandler) GetCategories(c *gin.Context) {
	// Récupérer les catégories (mêmes que les filtres)
	// Ne pas inclure "all" car il est déjà ajouté côté frontend
	categories := []map[string]interface{}{
		{"id": "fashion", "name": "Mode"},
		{"id": "home", "name": "Maison"},
		{"id": "makeup", "name": "Maquillage"},
		{"id": "entertainment", "name": "Divertissement"},
		{"id": "tech", "name": "Tech"},
		{"id": "beauty", "name": "Beauté"},
		{"id": "sport", "name": "Sport"},
		{"id": "love", "name": "Amour"},
		{"id": "travel", "name": "Voyage"},
		{"id": "books", "name": "Livres"},
		{"id": "kids", "name": "Enfants"},
		{"id": "pets", "name": "Animaux"},
		{"id": "education", "name": "Éducation"},
		{"id": "food", "name": "Nourriture"},
		{"id": "outdoor", "name": "Extérieur"},
		{"id": "photography", "name": "Photographie"},
		{"id": "videogames", "name": "Jeux Vidéos"},
		{"id": "car", "name": "Voiture"},
	}

	c.JSON(http.StatusOK, categories)
}

// Marques génériques qui ne sont pas catégorisées car elles vendent de tout
var genericBrands = map[string]bool{
	"amazon": true, "etsy": true, "cdiscount": true, "rakuten": true,
	"zalando": true, "aliexpress": true, "ebay": true,
}

// Mapping global des marques spécialisées par catégorie
var brandCategories = map[string][]string{
	"fashion": {"timberland", "diesel", "zara", "h_and_m", "uniqlo"},
	"sport":   {"nike", "adidas", "decathlon"},
	"tech":    {"samsung", "apple"},
	"beauty":  {"yves_rocher"},
	"makeup":  {"sephora"},
	"kids":    {"lego", "schleich", "king_jouet"},
	"home":    {"ikea", "maisons_du_monde"},
}

// Noms d'affichage des filtres
var filterNames = map[string]string{
	"fashion": "Mode",
	"sport":   "Sport",
	"tech":    "Tech",
	"beauty":  "Beauté",
	"makeup":  "Maquillage",
	"kids":    "Enfants",
	"home":    "Maison",
}

// GetFilterBrands récupère les marques associées à un filtre spécifique
func (h *ScraperHandler) GetFilterBrands(c *gin.Context) {
	filterID := c.Param("filterID")
	showOnlyNew := c.Query("new") == "true"

	// Récupérer les marques pour le filtre spécifié
	brands, exists := brandCategories[filterID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Filtre non trouvé"})
		return
	}

	// Lire directement le fichier JSON pour plus de performance
	cacheFilePath := "./cache/products_cache.json"
	data, err := os.ReadFile(cacheFilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la lecture du fichier de cache"})
		return
	}

	// Structure pour décoder le cache
	var cacheData struct {
		LastUpdated string                       `json:"lastUpdated"`
		Products    map[string][]scraper.Product `json:"products"`
	}

	// Décoder le JSON
	if err := json.Unmarshal(data, &cacheData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage du cache"})
		return
	}

	// Créer la liste des marques filtrées
	var brandDetails []map[string]string
	for _, brandID := range brands {
		if products, exists := cacheData.Products[brandID]; exists && len(products) > 0 {
			if showOnlyNew {
				hasNewProducts := false
				for _, product := range products {
					if product.IsNew {
						hasNewProducts = true
						break
					}
				}
				if !hasNewProducts {
					continue
				}
			}

			brandName := convertBrandIDToName(brandID)
			logoURL := getBrandLogoURL(brandID)

			brandDetails = append(brandDetails, map[string]string{
				"id":   brandID,
				"name": brandName,
				"logo": logoURL,
			})
		}
	}

	log.Info().Int("count", len(brandDetails)).Str("filter", filterID).Msg("Marques filtrées récupérées")
	c.JSON(http.StatusOK, brandDetails)
}

// generateArticlesForProduct génère des articles fictifs pour un produit
func generateArticlesForProduct(product *scraper.Product, brandID string, isNew bool) []Article {
	// Générer 3 articles fictifs
	articles := make([]Article, 0, 3)

	// Article 1: Présentation du produit
	articles = append(articles, Article{
		ID:    product.ID + "_article_1",
		Title: "Présentation de " + product.Title,
		Content: "Découvrez " + product.Title + ", un produit exceptionnel de la marque " + product.Brand + ". " +
			"Ce produit offre une qualité supérieure et un design élégant qui saura vous séduire.",
		ImageURL:    product.ImageURL,
		PublishedAt: time.Now().AddDate(0, 0, -7),
		URL:         product.URL,
		ProductID:   product.ID,
		BrandID:     brandID,
	})

	// Article 2: Caractéristiques du produit
	articles = append(articles, Article{
		ID:    product.ID + "_article_2",
		Title: "Les caractéristiques de " + product.Title,
		Content: "Explorez les caractéristiques uniques de " + product.Title + ". " +
			"Ce produit se distingue par sa durabilité et sa polyvalence, le rendant parfait pour tous vos besoins.",
		ImageURL:    product.ImageURL,
		PublishedAt: time.Now().AddDate(0, 0, -5),
		URL:         product.URL,
		ProductID:   product.ID,
		BrandID:     brandID,
	})

	// Article 3: Avis sur le produit
	var titlePrefix string
	if isNew {
		titlePrefix = "Nouveau produit: "
	} else {
		titlePrefix = "Avis sur "
	}
	articles = append(articles, Article{
		ID:    product.ID + "_article_3",
		Title: titlePrefix + product.Title,
		Content: "Les utilisateurs adorent " + product.Title + "! " +
			"Avec une note moyenne de 4.5/5, ce produit est plébiscité pour sa qualité et son rapport qualité-prix.",
		ImageURL:    product.ImageURL,
		PublishedAt: time.Now().AddDate(0, 0, -2),
		URL:         product.URL,
		ProductID:   product.ID,
		BrandID:     brandID,
	})

	return articles
}

// generateArticlesForInspiration génère des articles fictifs pour un produit d'inspiration
func generateArticlesForInspiration(product *scraper.Product, inspiration string) []Article {
	// Générer 3 articles fictifs
	articles := make([]Article, 0, 3)

	// Obtenir le titre de l'inspiration
	inspirationTitle := getInspirationTitle(inspiration)

	// Article 1: Produit pour l'inspiration
	articles = append(articles, Article{
		ID:    product.ID + "_inspiration_" + inspiration + "_1",
		Title: product.Title + " pour " + inspirationTitle,
		Content: "Découvrez pourquoi " + product.Title + " est parfait pour " + inspirationTitle + ". " +
			"Ce produit a été spécialement sélectionné pour répondre à vos besoins pour cette occasion spéciale.",
		ImageURL:    product.ImageURL,
		PublishedAt: time.Now().AddDate(0, 0, -10),
		URL:         product.URL,
		ProductID:   product.ID,
		BrandID:     product.Brand,
	})

	// Article 2: Idées cadeaux
	articles = append(articles, Article{
		ID:    product.ID + "_inspiration_" + inspiration + "_2",
		Title: "Idées cadeaux: " + product.Title + " pour " + inspirationTitle,
		Content: "Cherchez-vous le cadeau parfait pour " + inspirationTitle + "? " +
			product.Title + " est une option idéale qui fera plaisir à coup sûr. Découvrez pourquoi ce produit est si apprécié.",
		ImageURL:    product.ImageURL,
		PublishedAt: time.Now().AddDate(0, 0, -6),
		URL:         product.URL,
		ProductID:   product.ID,
		BrandID:     product.Brand,
	})

	// Article 3: Guide d'achat
	articles = append(articles, Article{
		ID:    product.ID + "_inspiration_" + inspiration + "_3",
		Title: "Guide d'achat: " + product.Title + " pour " + inspirationTitle,
		Content: "Notre guide complet pour l'achat de " + product.Title + " pour " + inspirationTitle + ". " +
			"Découvrez les critères à prendre en compte et pourquoi ce produit est un excellent choix.",
		ImageURL:    product.ImageURL,
		PublishedAt: time.Now().AddDate(0, 0, -3),
		URL:         product.URL,
		ProductID:   product.ID,
		BrandID:     product.Brand,
	})

	return articles
}

// getInspirationTitle retourne le titre d'une inspiration
func getInspirationTitle(inspiration string) string {
	switch inspiration {
	case "christmas":
		return "Noël"
	case "valentine":
		return "la Saint-Valentin"
	case "girl_birthday":
		return "l'anniversaire d'une fille"
	case "boy_birthday":
		return "l'anniversaire d'un garçon"
	case "wedding":
		return "un mariage"
	case "baby_shower":
		return "une baby shower"
	case "mothers_day":
		return "la fête des mères"
	case "fathers_day":
		return "la fête des pères"
	default:
		return inspiration
	}
}

// convertBrandIDToName convertit l'ID d'une marque en nom d'affichage
func convertBrandIDToName(brandID string) string {
	switch brandID {
	case "h_and_m":
		return "H&M"
	case "toys_r_us":
		return "Toys R Us"
	case "maisons_du_monde":
		return "Maisons du Monde"
	case "king_jouet":
		return "King Jouet"
	case "yves_rocher":
		return "Yves Rocher"
	default:
		// Capitaliser la première lettre
		if len(brandID) > 0 {
			return strings.ToUpper(brandID[:1]) + brandID[1:]
		}
		return brandID
	}
}

// GetNewProducts récupère tous les produits marqués comme nouveaux
func (h *ScraperHandler) GetNewProducts(c *gin.Context) {
	// Structure pour stocker les nouveautés dans le format attendu par le frontend
	type GiftItem struct {
		ID    string  `json:"id"`
		Title string  `json:"title"`
		Image string  `json:"image"`
		Brand string  `json:"brand"`
		Price *string `json:"price"`
	}

	// Récupérer toutes les marques qui ont des produits nouveaux
	var giftItems []GiftItem

	// Liste des marques à vérifier (toutes les marques disponibles)
	allBrands := []string{
		"amazon", "etsy", "cdiscount", "shein", "temu", "wonderbox", "maisons_du_monde",
		"toys_r_us", "decathlon", "asos", "lego", "h_and_m", "nike", "uniqlo", "zara",
		"diesel", "adidas", "zalando", "sephora", "fnac", "yves_rocher", "veepee",
		"leclerc", "ikea", "mano_mano", "leroy_merlin", "darty", "citadium", "rakuten",
		"samsung", "timberland", "printemps", "ebay", "booking", "carrefour", "aliexpress",
		"auchan", "lidl", "coursera", "udemy", "schleich", "king_jouet",
	}

	for _, brandID := range allBrands {
		// Récupérer tous les produits de la marque
		products, err := h.scraperManager.GetProductsByBrand(brandID)
		if err != nil || len(products) == 0 {
			// Ignorer les marques sans produits
			continue
		}

		// Filtrer les produits nouveaux et les ajouter à la liste
		brandName := convertBrandIDToName(brandID)

		for _, product := range products {
			if product.IsNew {
				// Convertir le prix en string
				var priceStr *string
				if product.Price > 0 {
					temp := fmt.Sprintf("%.2f %s", product.Price, product.Currency)
					priceStr = &temp
				}

				// Ajouter le produit à la liste des nouveautés
				giftItems = append(giftItems, GiftItem{
					ID:    product.ID,
					Title: product.Title,
					Image: product.ImageURL,
					Brand: brandName,
					Price: priceStr,
				})
			}
		}
	}

	c.JSON(http.StatusOK, giftItems)
}

// GetInspirations récupère toutes les inspirations disponibles
func (h *ScraperHandler) GetInspirations(c *gin.Context) {
	// Structure pour stocker les inspirations
	type InspirationItem struct {
		ID    string `json:"id"`
		Name  string `json:"name"`
		Image string `json:"image"`
	}

	// Liste des inspirations prédéfinies
	inspirations := []InspirationItem{
		{ID: "christmas", Name: "Noël", Image: "https://api.a0.dev/assets/image?text=Noel&aspect=1:1&seed=1"},
		{ID: "valentine", Name: "Saint-Valentin", Image: "https://api.a0.dev/assets/image?text=Saint-Valentin&aspect=1:1&seed=2"},
		{ID: "girl_birthday", Name: "Anniversaire Fille", Image: "https://api.a0.dev/assets/image?text=Anniversaire%20Fille&aspect=1:1&seed=3"},
		{ID: "boy_birthday", Name: "Anniversaire Garçon", Image: "https://api.a0.dev/assets/image?text=Anniversaire%20Garcon&aspect=1:1&seed=4"},
		{ID: "wedding", Name: "Mariage", Image: "https://api.a0.dev/assets/image?text=Mariage&aspect=1:1&seed=5"},
		{ID: "baby_shower", Name: "Baby Shower", Image: "https://api.a0.dev/assets/image?text=Baby%20Shower&aspect=1:1&seed=6"},
		{ID: "mothers_day", Name: "Fête des Mères", Image: "https://api.a0.dev/assets/image?text=Fete%20des%20Meres&aspect=1:1&seed=7"},
		{ID: "fathers_day", Name: "Fête des Pères", Image: "https://api.a0.dev/assets/image?text=Fete%20des%20Peres&aspect=1:1&seed=8"},
	}

	c.JSON(http.StatusOK, inspirations)
}

// getBrandLogoURL retourne l'URL du logo d'une marque
func getBrandLogoURL(brandID string) string {
	// Utiliser les URLs de Wikimedia Commons pour les logos officiels
	switch brandID {
	case "amazon":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png"
	case "adidas":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/1280px-Adidas_Logo.svg.png"
	case "nike":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1280px-Logo_NIKE.svg.png"
	case "h_and_m":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/H%26M-Logo.svg/1280px-H%26M-Logo.svg.png"
	case "ikea":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ikea_logo.svg/1280px-Ikea_logo.svg.png"
	case "zara":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zara_Logo.svg/1280px-Zara_Logo.svg.png"
	case "samsung":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/1280px-Samsung_Logo.svg.png"
	case "lego":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/LEGO_logo.svg/1280px-LEGO_logo.svg.png"
	case "decathlon":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Decathlon_Logo.svg/1280px-Decathlon_Logo.svg.png"
	case "sephora":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Sephora_logo.svg/1280px-Sephora_logo.svg.png"
	case "diesel":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Diesel_logo.svg/1280px-Diesel_logo.svg.png"
	case "uniqlo":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UNIQLO_logo.svg/1280px-UNIQLO_logo.svg.png"
	case "timberland":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Timberland_Logo.svg/1280px-Timberland_Logo.svg.png"
	case "yves_rocher":
		return "https://upload.wikimedia.org/wikipedia/fr/thumb/3/3a/Logo_Yves_Rocher_2009.svg/1280px-Logo_Yves_Rocher_2009.svg.png"
	case "maisons_du_monde":
		return "https://upload.wikimedia.org/wikipedia/fr/thumb/c/c4/Maisons_du_Monde_logo.svg/1280px-Maisons_du_Monde_logo.svg.png"
	case "king_jouet":
		return "https://upload.wikimedia.org/wikipedia/fr/thumb/0/0c/King_Jouet_logo.svg/1280px-King_Jouet_logo.svg.png"
	case "schleich":
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Schleich_logo.svg/1280px-Schleich_logo.svg.png"
	default:
		// Générer un logo générique pour les marques sans logo officiel
		return "https://api.a0.dev/assets/image?text=" + brandID + "%20logo&aspect=1:1&seed=" + brandID
	}
}

// Suppression des fonctions/variables globales incorrectes ajoutées précédemment
// var CacheMu *sync.RWMutex
// var Cache map[string][]scraper.Product
// func (h *ScraperHandler) InitializeCacheAccess() {}
// func (sm *scraper.ScraperManager) GetCacheMutex() *sync.RWMutex {}
// func (sm *scraper.ScraperManager) GetCacheMap() map[string][]scraper.Product {}
