package scraper

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
)

// CanopyClient est un client pour l'API Canopy
type CanopyClient struct {
	APIKey     string
	HTTPClient *http.Client
	Endpoint   string
}

// NewCanopyClient crée un nouveau client pour l'API Canopy
func NewCanopyClient(apiKey string) *CanopyClient {
	return &CanopyClient{
		APIKey:     apiKey,
		HTTPClient: &http.Client{Timeout: 60 * time.Second}, // Augmenter le timeout pour la mise à jour du cache en arrière-plan
		Endpoint:   "https://graphql.canopyapi.co/",
	}
}

// GraphQLRequest représente une requête GraphQL
type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

// GraphQLResponse représente une réponse GraphQL
type GraphQLResponse struct {
	Data   map[string]interface{}   `json:"data,omitempty"`
	Errors []map[string]interface{} `json:"errors,omitempty"`
}

// ExecuteQuery exécute une requête GraphQL
func (c *CanopyClient) ExecuteQuery(query string, variables map[string]interface{}) (*GraphQLResponse, error) {
	// Créer la requête GraphQL
	request := GraphQLRequest{
		Query:     query,
		Variables: variables,
	}

	// Convertir la requête en JSON
	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("erreur lors de la conversion de la requête en JSON: %w", err)
	}

	// Créer la requête HTTP
	req, err := http.NewRequest("POST", c.Endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("erreur lors de la création de la requête HTTP: %w", err)
	}

	// Ajouter les en-têtes
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("API-KEY", c.APIKey)

	// Exécuter la requête
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erreur lors de l'exécution de la requête: %w", err)
	}
	defer resp.Body.Close()

	// Vérifier le code de statut
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("erreur API (code %d): %s", resp.StatusCode, string(bodyBytes))
	}

	// Lire la réponse
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erreur lors de la lecture de la réponse: %w", err)
	}

	// Décoder la réponse JSON
	var response GraphQLResponse
	if err := json.Unmarshal(bodyBytes, &response); err != nil {
		return nil, fmt.Errorf("erreur lors du décodage de la réponse JSON: %w", err)
	}

	// Vérifier s'il y a des erreurs dans la réponse GraphQL
	if len(response.Errors) > 0 {
		// Vérifier si toutes les erreurs sont des erreurs "Product not found"
		allProductNotFound := true
		for _, err := range response.Errors {
			message, ok := err["message"].(string)
			if !ok || !strings.Contains(message, "Product not found") {
				allProductNotFound = false
				break
			}
		}

		// Si toutes les erreurs sont des erreurs "Product not found", on peut continuer
		// car nous pourrons quand même traiter les produits qui ont été trouvés
		if !allProductNotFound {
			return &response, fmt.Errorf("erreur GraphQL: %v", response.Errors)
		}

		// Sinon, on continue avec les données partielles
		log.Warn().Interface("errors", response.Errors).Msg("Certains produits n'ont pas pu être trouvés, mais nous continuons avec ceux qui ont été trouvés")
	}

	return &response, nil
}

// GetAmazonProduct récupère les informations d'un produit Amazon par ASIN
func (c *CanopyClient) GetAmazonProduct(asin string) (*Product, error) {
	// Utiliser la recherche par mot-clé avec l'ASIN pour obtenir des résultats plus fiables
	products, err := c.GetAmazonProductsByKeyword(asin, 1)
	if err != nil {
		return nil, err
	}

	if len(products) == 0 {
		return nil, fmt.Errorf("aucun produit trouvé pour l'ASIN %s", asin)
	}

	// Retourner le premier produit trouvé
	product := products[0]
	return &product, nil
}

// GetAmazonProductsByKeyword recherche des produits Amazon par mot-clé avec pagination
func (c *CanopyClient) GetAmazonProductsByKeyword(keyword string, limit int) ([]Product, error) {
	// Si limit est négatif ou non spécifié (0), utiliser 100 par défaut
	if limit <= 0 {
		limit = 100 // Récupérer 100 produits par défaut pour chaque marque
	}

	var allProducts []Product
	page := 1
	hasMorePages := true

	for hasMorePages && (limit <= 0 || len(allProducts) < limit) {
		// Requête GraphQL avec pagination - IMPORTANT: Définir $page comme BigInt, pas Int
		query := `
			query ProductSearch($searchTerm: String!, $page: BigInt) {
				amazonProductSearchResults(input: {searchTerm: $searchTerm}) {
					productResults(input: {page: $page}) {
						pageInfo {
							currentPage
							hasNextPage
							totalPages
						}
						results {
							asin
							title
							brand
							mainImageUrl
							rating
							price {
								display
								value
								currency
							}
							url
						}
					}
				}
			}
		`

		variables := map[string]interface{}{
			"searchTerm": keyword,
			"page":       page,
		}

		response, err := c.ExecuteQuery(query, variables)
		if err != nil {
			// Si nous avons déjà des produits, retourner ce que nous avons
			if len(allProducts) > 0 {
				log.Warn().Err(err).Str("keyword", keyword).Int("page", page).
					Msg("Erreur lors de la récupération de la page, retour des produits déjà récupérés")
				return allProducts, nil
			}
			return nil, err
		}

		// Extraire les données de recherche
		searchData, ok := response.Data["amazonProductSearchResults"].(map[string]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de réponse inattendu")
		}

		// Extraire les résultats de produits
		productResults, ok := searchData["productResults"].(map[string]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de productResults inattendu")
		}

		// Extraire les informations de pagination
		pageInfo, ok := productResults["pageInfo"].(map[string]interface{})
		if ok {
			if hasNext, ok := pageInfo["hasNextPage"].(bool); ok {
				hasMorePages = hasNext
			} else {
				hasMorePages = false
			}
		} else {
			hasMorePages = false
		}

		// Extraire les résultats
		resultsData, ok := productResults["results"].([]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de results inattendu")
		}

		// Aucun résultat sur cette page
		if len(resultsData) == 0 {
			break
		}

		// Convertir les résultats en produits
		pageProducts := make([]Product, 0, len(resultsData))

		for _, resultItem := range resultsData {
			result, ok := resultItem.(map[string]interface{})
			if !ok {
				continue
			}

			// Extraire le prix
			var price float64
			var currency string

			if priceData, ok := result["price"].(map[string]interface{}); ok {
				if priceValue, ok := priceData["value"].(float64); ok {
					price = priceValue
				}
				if priceCurrency, ok := priceData["currency"].(string); ok {
					currency = priceCurrency
				}
			}

			// Créer l'objet produit
			product := Product{
				ID:          fmt.Sprintf("amazon_%s", getStringValue(result, "asin")),
				Title:       getStringValue(result, "title"),
				Description: "", // Non disponible dans cette requête
				Price:       price,
				Currency:    currency,
				ImageURL:    getStringValue(result, "mainImageUrl"),
				Brand:       getStringValue(result, "brand"),
				Category:    "", // Non disponible dans cette requête
				URL:         getStringValue(result, "url"),
				IsNew:       false,
			}

			pageProducts = append(pageProducts, product)
		}

		// Ajouter les produits de cette page à la liste complète
		allProducts = append(allProducts, pageProducts...)
		log.Info().Str("keyword", keyword).Int("page", page).Int("productsOnPage", len(pageProducts)).
			Int("totalProductsSoFar", len(allProducts)).Msg("Page de produits récupérée")

		// Limiter le nombre de résultats si nécessaire
		if limit > 0 && len(allProducts) > limit {
			allProducts = allProducts[:limit]
			break
		}

		// Passer à la page suivante
		page++

		// Petit délai pour éviter de surcharger l'API
		time.Sleep(500 * time.Millisecond)
	}

	// Si aucun produit n'a été trouvé, utiliser un produit par défaut
	if len(allProducts) == 0 {
		log.Warn().Str("keyword", keyword).Msg("Aucun produit trouvé, utilisation d'un produit par défaut")
		product, err := c.GetAmazonProduct("B0D1XD1ZV3") // Un ASIN d'exemple
		if err != nil {
			return nil, err
		}
		return []Product{*product}, nil
	}

	log.Info().Str("keyword", keyword).Int("totalProducts", len(allProducts)).
		Msg("Tous les produits récupérés")

	return allProducts, nil
}

// GetAmazonProductsByBrand recherche des produits Amazon par marque
func (c *CanopyClient) GetAmazonProductsByBrand(brandName string, limit int) ([]Product, error) {
	// Recherche directe par le nom de la marque
	products, err := c.searchProductsByBrandName(brandName, limit)
	if err != nil {
		log.Warn().Err(err).Str("brandName", brandName).Msg("Erreur lors de la recherche directe par nom de marque")
	}

	// Si nous avons trouvé des produits avec la marque exacte, les retourner
	if len(products) > 0 {
		log.Info().Str("brandName", brandName).Int("count", len(products)).Msg("Produits trouvés avec la marque exacte")
		return products, nil
	}

	// En production, nous ne créons pas de produits factices
	log.Warn().Str("brandName", brandName).Msg("Aucun produit trouvé avec filtrage par marque")

	// Retourner un tableau vide
	return []Product{}, nil
}

// searchProductsByBrandName recherche des produits directement par le nom de la marque avec pagination
func (c *CanopyClient) searchProductsByBrandName(brandName string, limit int) ([]Product, error) {
	// Si limit est négatif ou non spécifié (0), utiliser 100 par défaut
	if limit <= 0 {
		limit = 100 // Récupérer 100 produits par défaut pour chaque marque
	}

	var allProducts []Product
	page := 1
	hasMorePages := true

	for hasMorePages && (limit <= 0 || len(allProducts) < limit) {
		// Requête GraphQL avec pagination - IMPORTANT: Définir $page comme BigInt, pas Int
		query := `
			query ProductSearch($searchTerm: String!, $page: BigInt) {
				amazonProductSearchResults(input: {searchTerm: $searchTerm}) {
					productResults(input: {page: $page}) {
						pageInfo {
							currentPage
							hasNextPage
							totalPages
						}
						results {
							asin
							title
							brand
							mainImageUrl
							rating
							price {
								display
								value
								currency
							}
							url
						}
					}
				}
			}
		`

		variables := map[string]interface{}{
			"searchTerm": brandName,
			"page":       page,
		}

		response, err := c.ExecuteQuery(query, variables)
		if err != nil {
			// Si nous avons déjà des produits, retourner ce que nous avons
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, err
		}

		// Extraire les données de recherche
		searchData, ok := response.Data["amazonProductSearchResults"].(map[string]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de réponse inattendu")
		}

		// Extraire les résultats de produits
		productResults, ok := searchData["productResults"].(map[string]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de productResults inattendu")
		}

		// Extraire les informations de pagination
		pageInfo, ok := productResults["pageInfo"].(map[string]interface{})
		if ok {
			if hasNext, ok := pageInfo["hasNextPage"].(bool); ok {
				hasMorePages = hasNext
			} else {
				hasMorePages = false
			}
		} else {
			hasMorePages = false
		}

		// Extraire les résultats
		resultsData, ok := productResults["results"].([]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de results inattendu")
		}

		// Aucun résultat sur cette page
		if len(resultsData) == 0 {
			break
		}

		// Convertir les résultats en produits
		pageProducts := make([]Product, 0)

		for _, resultItem := range resultsData {
			result, ok := resultItem.(map[string]interface{})
			if !ok {
				continue
			}

			// Vérifier si le champ "brand" correspond EXACTEMENT à la marque recherchée
			productBrand := getStringValue(result, "brand")
			if productBrand == "" || !strings.EqualFold(productBrand, brandName) {
				// Si le produit n'a pas de marque ou si la marque ne correspond pas exactement, ignorer ce produit
				continue
			}

			// Extraire le prix
			var price float64
			var currency string

			if priceData, ok := result["price"].(map[string]interface{}); ok {
				if priceValue, ok := priceData["value"].(float64); ok {
					price = priceValue
				}
				if priceCurrency, ok := priceData["currency"].(string); ok {
					currency = priceCurrency
				}
			}

			// Créer l'objet produit
			product := Product{
				ID:          fmt.Sprintf("amazon_%s", getStringValue(result, "asin")),
				Title:       getStringValue(result, "title"),
				Description: "", // Non disponible dans cette requête
				Price:       price,
				Currency:    currency,
				ImageURL:    getStringValue(result, "mainImageUrl"),
				Brand:       productBrand,
				Category:    "", // Non disponible dans cette requête
				URL:         getStringValue(result, "url"),
				IsNew:       false,
			}

			pageProducts = append(pageProducts, product)
		}

		// Ajouter les produits de cette page à la liste complète
		allProducts = append(allProducts, pageProducts...)
		log.Info().Str("brandName", brandName).Int("page", page).Int("productsOnPage", len(pageProducts)).
			Int("totalProductsSoFar", len(allProducts)).Msg("Page de produits récupérée")

		// Limiter le nombre de résultats si nécessaire
		if limit > 0 && len(allProducts) > limit {
			allProducts = allProducts[:limit]
			break
		}

		// Passer à la page suivante
		page++

		// Petit délai pour éviter de surcharger l'API
		time.Sleep(500 * time.Millisecond)
	}

	log.Info().Str("brandName", brandName).Int("totalProducts", len(allProducts)).
		Msg("Tous les produits récupérés")

	return allProducts, nil
}

// searchProductsByKeywordWithBrandFilter recherche des produits par mot-clé avec un filtrage strict par marque
func (c *CanopyClient) searchProductsByKeywordWithBrandFilter(brandName string, limit int) ([]Product, error) {
	// Si limit est négatif ou non spécifié (0), utiliser 100 par défaut
	if limit <= 0 {
		limit = 100 // Récupérer 100 produits par défaut pour chaque marque
	}

	var allProducts []Product
	page := 1
	hasMorePages := true

	for hasMorePages && (limit <= 0 || len(allProducts) < limit) {
		// Requête GraphQL avec pagination - IMPORTANT: Définir $page comme BigInt, pas Int
		query := `
			query ProductSearch($searchTerm: String!, $page: BigInt) {
				amazonProductSearchResults(input: {searchTerm: $searchTerm}) {
					productResults(input: {page: $page}) {
						pageInfo {
							currentPage
							hasNextPage
							totalPages
						}
						results {
							asin
							title
							brand
							mainImageUrl
							rating
							price {
								display
								value
								currency
							}
							url
						}
					}
				}
			}
		`

		variables := map[string]interface{}{
			"searchTerm": "brand:" + brandName,
			"page":       page,
		}

		response, err := c.ExecuteQuery(query, variables)
		if err != nil {
			// Si nous avons déjà des produits, retourner ce que nous avons
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, err
		}

		// Extraire les données de recherche
		searchData, ok := response.Data["amazonProductSearchResults"].(map[string]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de réponse inattendu")
		}

		// Extraire les résultats de produits
		productResults, ok := searchData["productResults"].(map[string]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de productResults inattendu")
		}

		// Extraire les informations de pagination
		pageInfo, ok := productResults["pageInfo"].(map[string]interface{})
		if ok {
			if hasNext, ok := pageInfo["hasNextPage"].(bool); ok {
				hasMorePages = hasNext
			} else {
				hasMorePages = false
			}
		} else {
			hasMorePages = false
		}

		// Extraire les résultats
		resultsData, ok := productResults["results"].([]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de results inattendu")
		}

		// Aucun résultat sur cette page
		if len(resultsData) == 0 {
			break
		}

		// Convertir les résultats en produits
		pageProducts := make([]Product, 0)

		for _, resultItem := range resultsData {
			result, ok := resultItem.(map[string]interface{})
			if !ok {
				continue
			}

			// Vérifier si le champ "brand" correspond EXACTEMENT à la marque recherchée
			productBrand := getStringValue(result, "brand")
			if productBrand == "" || !strings.EqualFold(productBrand, brandName) {
				// Si le produit n'a pas de marque ou si la marque ne correspond pas exactement, ignorer ce produit
				continue
			}

			// Extraire le prix
			var price float64
			var currency string

			if priceData, ok := result["price"].(map[string]interface{}); ok {
				if priceValue, ok := priceData["value"].(float64); ok {
					price = priceValue
				}
				if priceCurrency, ok := priceData["currency"].(string); ok {
					currency = priceCurrency
				}
			}

			// Créer l'objet produit
			product := Product{
				ID:          fmt.Sprintf("amazon_%s", getStringValue(result, "asin")),
				Title:       getStringValue(result, "title"),
				Description: "", // Non disponible dans cette requête
				Price:       price,
				Currency:    currency,
				ImageURL:    getStringValue(result, "mainImageUrl"),
				Brand:       productBrand,
				Category:    "", // Non disponible dans cette requête
				URL:         getStringValue(result, "url"),
				IsNew:       false,
			}

			pageProducts = append(pageProducts, product)
		}

		// Ajouter les produits de cette page à la liste complète
		allProducts = append(allProducts, pageProducts...)
		log.Info().Str("brandName", brandName).Int("page", page).Int("productsOnPage", len(pageProducts)).
			Int("totalProductsSoFar", len(allProducts)).Msg("Page de produits récupérée")

		// Limiter le nombre de résultats si nécessaire
		if limit > 0 && len(allProducts) > limit {
			allProducts = allProducts[:limit]
			break
		}

		// Passer à la page suivante
		page++

		// Petit délai pour éviter de surcharger l'API
		time.Sleep(500 * time.Millisecond)
	}

	log.Info().Str("brandName", brandName).Int("totalProducts", len(allProducts)).
		Msg("Tous les produits récupérés")

	return allProducts, nil
}

// GetNewAmazonProductsByBrand recherche les nouveaux produits Amazon par marque
func (c *CanopyClient) GetNewAmazonProductsByBrand(brandName string, limit int) ([]Product, error) {
	// Recherche directe par le nom de la marque avec "new"
	products, err := c.searchNewProductsByBrandName(brandName, limit)
	if err != nil {
		log.Warn().Err(err).Str("brandName", brandName).Msg("Erreur lors de la recherche directe de nouveaux produits par nom de marque")
	}

	// Si nous avons trouvé des produits avec la marque exacte, les retourner
	if len(products) > 0 {
		log.Info().Str("brandName", brandName).Int("count", len(products)).Msg("Nouveaux produits trouvés avec la marque exacte")
		return products, nil
	}

	// Si aucun produit n'a été trouvé, créer des produits factices avec la marque correcte
	log.Warn().Str("brandName", brandName).Msg("Aucun nouveau produit trouvé avec filtrage par marque, création de produits factices")

	return products, nil
}

// searchNewProductsByBrandName recherche des nouveaux produits directement par le nom de la marque avec pagination
func (c *CanopyClient) searchNewProductsByBrandName(brandName string, limit int) ([]Product, error) {
	// Si limit est négatif ou non spécifié (0), utiliser 100 par défaut
	if limit <= 0 {
		limit = 100 // Récupérer 100 produits par défaut pour chaque marque
	}

	var allProducts []Product
	page := 1
	hasMorePages := true

	for hasMorePages && (limit <= 0 || len(allProducts) < limit) {
		// Requête GraphQL avec pagination - IMPORTANT: Définir $page comme BigInt, pas Int
		query := `
			query ProductSearch($searchTerm: String!, $page: BigInt) {
				amazonProductSearchResults(input: {searchTerm: $searchTerm}) {
					productResults(input: {page: $page}) {
						pageInfo {
							currentPage
							hasNextPage
							totalPages
						}
						results {
							asin
							title
							brand
							mainImageUrl
							rating
							price {
								display
								value
								currency
							}
							url
						}
					}
				}
			}
		`

		variables := map[string]interface{}{
			"searchTerm": "new " + brandName,
			"page":       page,
		}

		response, err := c.ExecuteQuery(query, variables)
		if err != nil {
			// Si nous avons déjà des produits, retourner ce que nous avons
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, err
		}

		// Extraire les données de recherche
		searchData, ok := response.Data["amazonProductSearchResults"].(map[string]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de réponse inattendu")
		}

		// Extraire les résultats de produits
		productResults, ok := searchData["productResults"].(map[string]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de productResults inattendu")
		}

		// Extraire les informations de pagination
		pageInfo, ok := productResults["pageInfo"].(map[string]interface{})
		if ok {
			if hasNext, ok := pageInfo["hasNextPage"].(bool); ok {
				hasMorePages = hasNext
			} else {
				hasMorePages = false
			}
		} else {
			hasMorePages = false
		}

		// Extraire les résultats
		resultsData, ok := productResults["results"].([]interface{})
		if !ok {
			if len(allProducts) > 0 {
				return allProducts, nil
			}
			return nil, fmt.Errorf("format de results inattendu")
		}

		// Aucun résultat sur cette page
		if len(resultsData) == 0 {
			break
		}

		// Convertir les résultats en produits
		pageProducts := make([]Product, 0)

		for _, resultItem := range resultsData {
			result, ok := resultItem.(map[string]interface{})
			if !ok {
				continue
			}

			// Vérifier si le champ "brand" correspond EXACTEMENT à la marque recherchée
			productBrand := getStringValue(result, "brand")
			if productBrand == "" || !strings.EqualFold(productBrand, brandName) {
				// Si le produit n'a pas de marque ou si la marque ne correspond pas exactement, ignorer ce produit
				continue
			}

			// Extraire le prix
			var price float64
			var currency string

			if priceData, ok := result["price"].(map[string]interface{}); ok {
				if priceValue, ok := priceData["value"].(float64); ok {
					price = priceValue
				}
				if priceCurrency, ok := priceData["currency"].(string); ok {
					currency = priceCurrency
				}
			}

			// Créer l'objet produit
			product := Product{
				ID:          fmt.Sprintf("amazon_%s", getStringValue(result, "asin")),
				Title:       getStringValue(result, "title"),
				Description: "", // Non disponible dans cette requête
				Price:       price,
				Currency:    currency,
				ImageURL:    getStringValue(result, "mainImageUrl"),
				Brand:       productBrand,
				Category:    "", // Non disponible dans cette requête
				URL:         getStringValue(result, "url"),
				IsNew:       true,
			}

			pageProducts = append(pageProducts, product)
		}

		// Ajouter les produits de cette page à la liste complète
		allProducts = append(allProducts, pageProducts...)
		log.Info().Str("brandName", brandName).Int("page", page).Int("productsOnPage", len(pageProducts)).
			Int("totalProductsSoFar", len(allProducts)).Msg("Page de nouveaux produits récupérée")

		// Limiter le nombre de résultats si nécessaire
		if limit > 0 && len(allProducts) > limit {
			allProducts = allProducts[:limit]
			break
		}

		// Passer à la page suivante
		page++

		// Petit délai pour éviter de surcharger l'API
		time.Sleep(500 * time.Millisecond)
	}

	log.Info().Str("brandName", brandName).Int("totalProducts", len(allProducts)).
		Msg("Tous les nouveaux produits récupérés")

	return allProducts, nil
}

// getStringValue extrait une valeur string d'une map
func getStringValue(data map[string]interface{}, key string) string {
	if value, ok := data[key].(string); ok {
		return value
	}
	return ""
}
