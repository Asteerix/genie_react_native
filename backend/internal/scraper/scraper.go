package scraper

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
)

// Product représente un produit d'une marque
type Product struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Currency    string  `json:"currency"`
	ImageURL    string  `json:"imageUrl"`
	Brand       string  `json:"brand"`
	Category    string  `json:"category"`
	URL         string  `json:"url"`
	IsNew       bool    `json:"isNew"`
	AddedDate   string  `json:"addedDate,omitempty"`
}

// BrandScraper est l'interface pour les scrapers spécifiques à chaque marque
type BrandScraper interface {
	GetProducts() ([]Product, error)
	GetNewProducts() ([]Product, error)
}

// Inspiration représente une catégorie d'inspiration avec ses produits
type Inspiration struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Image    string    `json:"image"`
	Products []Product `json:"products"`
}

// ScraperManager gère tous les scrapers de marques et les caches
type ScraperManager struct {
	scrapers                  map[string]BrandScraper
	cache                     map[string][]Product // Cache produits par marque
	cacheMu                   sync.RWMutex
	cacheExp                  time.Time
	cacheFilePath             string
	inspirationsCache         map[string]Inspiration // Nouveau cache pour les inspirations
	inspirationsCacheMu       sync.RWMutex
	inspirationsCacheExp      time.Time // Utilise la même expiration que le cache produits
	inspirationsCacheFilePath string
	updateTicker              *time.Ticker
	stopChan                  chan struct{}
}

// NewScraperManager crée un nouveau gestionnaire de scrapers
func NewScraperManager() *ScraperManager {
	// Créer le répertoire de cache s'il n'existe pas
	cacheDir := "./cache"
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		log.Error().Err(err).Msg("Impossible de créer le répertoire de cache")
	}

	productsCacheFilePath := filepath.Join(cacheDir, "products_cache.json")
	inspirationsCacheFilePath := filepath.Join(cacheDir, "inspirations_cache.json")

	manager := &ScraperManager{
		scrapers:                  make(map[string]BrandScraper),
		cache:                     make(map[string][]Product),
		cacheExp:                  time.Now().Add(-1 * time.Hour), // Initialiser à une date passée pour forcer la vérification
		cacheFilePath:             productsCacheFilePath,
		inspirationsCache:         make(map[string]Inspiration),
		inspirationsCacheExp:      time.Now().Add(-1 * time.Hour), // Utilise la même logique d'expiration
		inspirationsCacheFilePath: inspirationsCacheFilePath,
		stopChan:                  make(chan struct{}),
	}

	// Initialiser les scrapers pour chaque marque
	manager.registerScrapers()

	// Charger les caches depuis les fichiers
	manager.loadCacheFromFile()
	manager.loadInspirationsCacheFromFile() // Charger le nouveau cache

	// Vérifier si une mise à jour est nécessaire (le cache sera vérifié dans UpdateCache)
	log.Info().Msg("Vérification si une mise à jour du cache est nécessaire")
	go manager.UpdateCache() // Exécuter dans une goroutine pour ne pas bloquer le démarrage

	// Démarrer la mise à jour périodique
	manager.startDailyUpdate()

	return manager
}

// loadCacheFromFile charge le cache depuis un fichier
func (sm *ScraperManager) loadCacheFromFile() {
	// Vérifier si le fichier de cache existe
	fileInfo, err := os.Stat(sm.cacheFilePath)
	if os.IsNotExist(err) {
		log.Info().Msg("Fichier de cache non trouvé, création d'un nouveau cache")
		// Forcer une mise à jour immédiate en définissant une date d'expiration passée
		sm.cacheMu.Lock()
		sm.cacheExp = time.Now().Add(-1 * time.Hour)
		sm.cacheMu.Unlock()
		return
	}

	// Vérifier si le fichier est vide (taille 0)
	if fileInfo != nil && fileInfo.Size() == 0 {
		log.Warn().Msg("Fichier de cache vide, création d'un nouveau cache et forçage d'une mise à jour")
		// Forcer une mise à jour immédiate en définissant une date d'expiration passée
		sm.cacheMu.Lock()
		sm.cacheExp = time.Now().Add(-1 * time.Hour)
		sm.cacheMu.Unlock()
		return
	}

	// Lire le fichier de cache
	data, err := os.ReadFile(sm.cacheFilePath)
	if err != nil {
		log.Error().Err(err).Msg("Impossible de lire le fichier de cache")
		// Forcer une mise à jour immédiate en définissant une date d'expiration passée
		sm.cacheMu.Lock()
		sm.cacheExp = time.Now().Add(-1 * time.Hour)
		sm.cacheMu.Unlock()
		return
	}

	// Vérifier si le fichier est vide (contenu vide ou juste des espaces)
	if len(data) == 0 || strings.TrimSpace(string(data)) == "" {
		log.Warn().Msg("Fichier de cache vide ou ne contient que des espaces, création d'un nouveau cache")
		// Forcer une mise à jour immédiate en définissant une date d'expiration passée
		sm.cacheMu.Lock()
		sm.cacheExp = time.Now().Add(-1 * time.Hour)
		sm.cacheMu.Unlock()
		return
	}

	// Structure pour décoder le cache avec la date de mise à jour
	var cacheData struct {
		LastUpdated string               `json:"lastUpdated"`
		Products    map[string][]Product `json:"products"`
	}

	// Essayer d'abord de décoder avec la nouvelle structure
	if err := json.Unmarshal(data, &cacheData); err != nil {
		// Si ça échoue, essayer avec l'ancienne structure (pour la compatibilité)
		var oldCache map[string][]Product
		if oldErr := json.Unmarshal(data, &oldCache); oldErr != nil {
			log.Error().Err(err).Msg("Impossible de décoder le cache")
			// Sauvegarder le fichier corrompu pour analyse
			backupFile := sm.cacheFilePath + ".corrupted"
			if err := os.WriteFile(backupFile, data, 0644); err != nil {
				log.Error().Err(err).Msg("Impossible de sauvegarder le fichier de cache corrompu")
			} else {
				log.Info().Str("backupFile", backupFile).Msg("Fichier de cache corrompu sauvegardé pour analyse")
			}
			return
		}
		// Si l'ancienne structure a fonctionné, l'utiliser
		cacheData.Products = oldCache
		cacheData.LastUpdated = time.Now().Format(time.RFC3339) // Date actuelle par défaut
		log.Info().Msg("Cache décodé avec l'ancienne structure, mise à jour vers la nouvelle structure")
	} else {
		log.Info().Str("lastUpdated", cacheData.LastUpdated).Msg("Cache décodé avec la date de dernière mise à jour")
	}

	// Vérifier si le cache est vide
	if len(cacheData.Products) == 0 {
		log.Warn().Msg("Cache décodé vide, création d'un nouveau cache")
		return
	}

	// Compter le nombre total de produits dans le cache
	totalProducts := 0
	for brandID, products := range cacheData.Products {
		totalProducts += len(products)
		log.Info().
			Str("brandID", brandID).
			Int("productCount", len(products)).
			Msg("Produits chargés depuis le cache pour la marque")
	}

	// Mettre à jour le cache
	sm.cacheMu.Lock()
	sm.cache = cacheData.Products

	// Calculer la date d'expiration en fonction de la date de dernière mise à jour
	lastUpdated, err := time.Parse(time.RFC3339, cacheData.LastUpdated)
	if err != nil {
		log.Warn().Err(err).Msg("Impossible de parser la date de dernière mise à jour, utilisation de la date actuelle")
		lastUpdated = time.Now()
	}

	// Définir la date d'expiration à 72 heures après la dernière mise à jour
	sm.cacheExp = lastUpdated.Add(72 * time.Hour)

	// Vérifier si le cache est déjà expiré
	if time.Now().After(sm.cacheExp) {
		log.Info().
			Time("lastUpdated", lastUpdated).
			Time("cacheExp", sm.cacheExp).
			Msg("Cache expiré, une mise à jour sera déclenchée")
	} else {
		log.Info().
			Time("lastUpdated", lastUpdated).
			Time("cacheExp", sm.cacheExp).
			Msg("Cache encore valide, pas de mise à jour immédiate nécessaire")
	}

	sm.cacheMu.Unlock()

	log.Info().
		Str("lastUpdated", cacheData.LastUpdated).
		Int("totalBrands", len(cacheData.Products)).
		Int("totalProducts", totalProducts).
		Msg("Cache chargé depuis le fichier")
}

// saveCacheToFile sauvegarde le cache dans un fichier
func (sm *ScraperManager) saveCacheToFile() {
	sm.cacheMu.RLock()
	defer sm.cacheMu.RUnlock()

	// Vérifier si le cache est vide
	if len(sm.cache) == 0 {
		log.Warn().Msg("Cache vide, aucune sauvegarde effectuée")
		return
	}

	// Compter le nombre total de produits dans le cache
	totalProducts := 0
	for brandID, products := range sm.cache {
		totalProducts += len(products)
		log.Info().
			Str("brandID", brandID).
			Int("productCount", len(products)).
			Msg("Produits en cache pour la marque")
	}

	if totalProducts == 0 {
		log.Warn().Msg("Aucun produit dans le cache, aucune sauvegarde effectuée")
		return
	}

	// Créer une structure qui inclut la date et l'heure de la dernière mise à jour
	cacheData := struct {
		LastUpdated string               `json:"lastUpdated"`
		Products    map[string][]Product `json:"products"`
	}{
		LastUpdated: time.Now().Format(time.RFC3339),
		Products:    sm.cache,
	}

	// Encoder le cache avec la date de mise à jour et une indentation pour une meilleure lisibilité
	data, err := json.MarshalIndent(cacheData, "", "  ")
	if err != nil {
		log.Error().Err(err).Msg("Impossible d'encoder le cache")
		return
	}

	// Écrire d'abord dans un fichier temporaire
	tempFile := sm.cacheFilePath + ".tmp"
	if err := os.WriteFile(tempFile, data, 0644); err != nil {
		log.Error().Err(err).Msg("Impossible d'écrire le fichier de cache temporaire")
		return
	}

	// Renommer le fichier temporaire pour remplacer l'ancien
	if err := os.Rename(tempFile, sm.cacheFilePath); err != nil {
		log.Error().Err(err).Msg("Impossible de renommer le fichier de cache temporaire")
		return
	}

	log.Info().
		Int("totalBrands", len(sm.cache)).
		Int("totalProducts", totalProducts).
		Int("dataSize", len(data)).
		Msg("Cache sauvegardé dans le fichier")
}

// startDailyUpdate démarre la mise à jour du cache tous les 3 jours
func (sm *ScraperManager) startDailyUpdate() {
	// Créer un ticker qui se déclenche toutes les 72 heures
	sm.updateTicker = time.NewTicker(72 * time.Hour)

	// Démarrer la goroutine de mise à jour
	go func() {
		for {
			select {
			case <-sm.updateTicker.C:
				// Mettre à jour le cache
				log.Info().Msg("Mise à jour du cache tous les 3 jours")
				sm.UpdateCache()
			case <-sm.stopChan:
				// Arrêter le ticker
				sm.updateTicker.Stop()
				return
			}
		}
	}()

	log.Info().Msg("Mise à jour tous les 3 jours démarrée")
}

// stopDailyUpdate arrête la mise à jour du cache tous les 3 jours
func (sm *ScraperManager) stopDailyUpdate() {
	close(sm.stopChan)
	log.Info().Msg("Mise à jour tous les 3 jours arrêtée")
}

// Liste des marques à traiter (exclut les plateformes qui ne sont pas des marques)
// Optimisée pour correspondre exactement aux marques dans allBrands du frontend
var validBrands = []string{
	"adidas", "decathlon", "diesel", "h_and_m", "ikea", "king_jouet",
	"lego", "maisons_du_monde", "nike", "samsung", "schleich", "sephora",
	"timberland", "uniqlo", "yves_rocher", "zara", "apple",
}

// Map pour recherche rapide O(1) des marques valides
var validBrandsMap map[string]bool

// init initialise la map des marques valides
func init() {
	validBrandsMap = make(map[string]bool, len(validBrands))
	for _, brand := range validBrands {
		validBrandsMap[brand] = true
	}
}

// UpdateCache met à jour le cache pour toutes les marques si nécessaire
func (sm *ScraperManager) UpdateCache() {
	// Vérifier si le fichier de cache existe et n'est pas vide
	fileInfo, err := os.Stat(sm.cacheFilePath)
	fileExists := err == nil && fileInfo.Size() > 0

	// Vérifier si le cache produits est expiré
	sm.cacheMu.RLock()
	productsCacheExpired := time.Now().After(sm.cacheExp)
	productsCacheEmpty := len(sm.cache) == 0
	sm.cacheMu.RUnlock()

	// Vérifier si le cache inspirations est expiré ou vide
	sm.inspirationsCacheMu.RLock()
	inspirationsCacheExpired := time.Now().After(sm.inspirationsCacheExp)
	inspirationsCacheEmpty := len(sm.inspirationsCache) == 0
	inspirationsFileInfo, inspirationsErr := os.Stat(sm.inspirationsCacheFilePath)
	inspirationsFileExists := inspirationsErr == nil && inspirationsFileInfo.Size() > 0
	sm.inspirationsCacheMu.RUnlock()

	// Si les deux caches sont valides, que leurs fichiers existent et ne sont pas vides, ne pas mettre à jour
	if !productsCacheExpired && fileExists && !productsCacheEmpty && !inspirationsCacheExpired && inspirationsFileExists && !inspirationsCacheEmpty {
		log.Info().
			Time("productsCacheExp", sm.cacheExp).
			Time("inspirationsCacheExp", sm.inspirationsCacheExp).
			Msg("Caches produits et inspirations encore valides, pas de mise à jour nécessaire")
		return
	}

	// Déterminer la raison de la mise à jour
	var reason string
	if productsCacheExpired {
		reason = "Cache produits expiré"
	} else if inspirationsCacheExpired {
		reason = "Cache inspirations expiré"
	} else if !fileExists {
		reason = "Fichier cache produits inexistant/vide"
	} else if !inspirationsFileExists {
		reason = "Fichier cache inspirations inexistant/vide"
	} else if productsCacheEmpty {
		reason = "Cache produits vide en mémoire"
	} else if inspirationsCacheEmpty {
		reason = "Cache inspirations vide en mémoire"
	} else {
		reason = "Mise à jour forcée" // Cas par défaut si aucune autre condition n'est remplie
	}

	log.Info().Str("reason", reason).Msg("Démarrage de la mise à jour du cache")

	updateTime := time.Now()
	totalProductsUpdated := 0
	brandsUpdated := 0

	// Créer une liste triée des marques valides pour les traiter dans l'ordre alphabétique
	var sortedBrands []string
	for brandID := range sm.scrapers {
		// Ne traiter que les marques valides (exclure les plateformes)
		if validBrandsMap[brandID] {
			sortedBrands = append(sortedBrands, brandID)
		}
	}
	sort.Strings(sortedBrands)

	log.Info().
		Int("totalValidBrands", len(sortedBrands)).
		Msg("Marques valides à traiter")

	// Mettre à jour le cache pour chaque marque valide dans l'ordre alphabétique
	// Traiter chaque marque une seule fois
	processedBrands := make(map[string]bool)
	for _, brandID := range sortedBrands {
		// Vérifier si la marque a déjà été traitée
		if processedBrands[brandID] {
			log.Warn().
				Str("brandID", brandID).
				Msg("Marque déjà traitée, ignorée")
			continue
		}

		// Marquer la marque comme traitée
		processedBrands[brandID] = true

		// Vérifier si un scraper existe pour cette marque
		scraper, exists := sm.scrapers[brandID]
		if !exists {
			log.Warn().
				Str("brandID", brandID).
				Msg("Aucun scraper trouvé pour cette marque, création d'un scraper générique")

			// Utiliser le scraper générique basé sur Canopy
			brandName := strings.ToUpper(brandID[:1]) + brandID[1:]
			scraper = &GenericScraper{
				BrandID:      brandID,
				BrandName:    brandName,
				CanopyClient: NewCanopyClient("2ea2fa43-aec8-4963-8c08-1b51191e81f8"),
			}
			sm.scrapers[brandID] = scraper
			log.Info().
				Str("brandID", brandID).
				Str("brandName", brandName).
				Msg("Scraper générique créé pour cette marque")
		}

		// Mettre à jour les produits normaux
		// Ajouter un délai entre les requêtes pour éviter de surcharger l'API
		if brandsUpdated > 0 {
			time.Sleep(300 * time.Millisecond)
		}

		// Récupérer les produits avec un timeout simple
		products, err := scraper.GetProducts()
		if err != nil {
			log.Error().
				Err(err).
				Str("brandID", brandID).
				Msg("Erreur lors de la mise à jour des produits")
			continue
		}

		// Filtrer les produits sans marque et organiser les produits par marque
		var filteredProducts []Product
		var amazonProducts []Product

		for _, product := range products {
			// Supprimer les produits sans marque
			if product.Brand == "" {
				continue
			}

			// Vérifier si la marque correspond au brandID demandé
			if strings.EqualFold(product.Brand, brandID) || strings.EqualFold(product.Brand, scraper.(*GenericScraper).BrandName) {
				// Normaliser la marque pour qu'elle corresponde exactement au brandID
				product.Brand = brandID
				filteredProducts = append(filteredProducts, product)
			} else {
				// Si la marque est différente, placer le produit dans "amazon"
				// Conserver la marque originale
				amazonProducts = append(amazonProducts, product)
			}
		}

		// Vérifier si des produits ont été récupérés après filtrage
		if len(filteredProducts) == 0 {
			log.Warn().Str("brandID", brandID).Msg("Aucun produit avec marque correspondante récupéré lors de la mise à jour du cache")

			// Vérifier si le cache existant contient des produits
			sm.cacheMu.RLock()
			existingProducts, exists := sm.cache[brandID]
			hasExistingProducts := exists && len(existingProducts) > 0
			sm.cacheMu.RUnlock()

			if hasExistingProducts {
				log.Info().
					Str("brandID", brandID).
					Int("existingProductCount", len(existingProducts)).
					Msg("Conservation des produits existants dans le cache")
				continue
			}
		} else {
			totalProductsUpdated += len(filteredProducts)
			brandsUpdated++

			log.Info().
				Str("brandID", brandID).
				Int("productCount", len(filteredProducts)).
				Int("filteredOut", len(products)-len(filteredProducts)).
				Time("updateTime", updateTime).
				Msg("Produits récupérés pour la mise à jour du cache")
		}

		// Récupérer les produits existants pour comparer et identifier les nouveaux
		sm.cacheMu.RLock()
		existingProducts, exists := sm.cache[brandID]
		sm.cacheMu.RUnlock()

		// Créer une map des produits existants pour une recherche rapide
		existingProductMap := make(map[string]Product)
		if exists {
			for _, p := range existingProducts {
				existingProductMap[p.ID] = p
			}
		}

		// Marquer les nouveaux produits et conserver les dates d'ajout des produits existants
		currentDate := time.Now().Format(time.RFC3339)
		for i := range filteredProducts {
			existingProduct, productExists := existingProductMap[filteredProducts[i].ID]

			if !productExists {
				// Nouveau produit: marquer comme nouveau et ajouter la date
				filteredProducts[i].IsNew = true
				filteredProducts[i].AddedDate = currentDate
				log.Debug().
					Str("productID", filteredProducts[i].ID).
					Str("addedDate", currentDate).
					Msg("Nouveau produit ajouté et marqué comme nouveau")
			} else {
				// Produit existant: conserver la date d'ajout et mettre à jour isNew
				// Si le produit était déjà marqué comme nouveau, le conserver comme tel
				filteredProducts[i].AddedDate = existingProduct.AddedDate

				// Si le produit est mis à jour, retirer le statut isNew
				if existingProduct.IsNew && filteredProducts[i].Title != existingProduct.Title ||
					filteredProducts[i].Price != existingProduct.Price ||
					filteredProducts[i].Description != existingProduct.Description {
					filteredProducts[i].IsNew = false
					log.Debug().
						Str("productID", filteredProducts[i].ID).
						Msg("Produit existant mis à jour, statut 'nouveau' retiré")
				} else {
					// Sinon, conserver le statut isNew
					filteredProducts[i].IsNew = existingProduct.IsNew
				}
			}
		}

		sm.cacheMu.Lock()
		sm.cache[brandID] = filteredProducts
		sm.cacheMu.Unlock()

		// Ajouter les produits avec marque différente à "amazon"
		if len(amazonProducts) > 0 {
			sm.cacheMu.Lock()
			existingAmazonProducts, exists := sm.cache["amazon"]
			if exists {
				// Fusionner avec les produits Amazon existants
				amazonProductMap := make(map[string]Product)

				// D'abord ajouter les produits existants
				for _, p := range existingAmazonProducts {
					amazonProductMap[p.ID] = p
				}

				// Ensuite ajouter les nouveaux produits
				for _, p := range amazonProducts {
					amazonProductMap[p.ID] = p
				}

				// Reconvertir la map en slice
				var mergedAmazonProducts []Product
				for _, p := range amazonProductMap {
					mergedAmazonProducts = append(mergedAmazonProducts, p)
				}

				sm.cache["amazon"] = mergedAmazonProducts
			} else {
				sm.cache["amazon"] = amazonProducts
			}
			sm.cacheMu.Unlock()

			log.Info().
				Int("amazonProductCount", len(amazonProducts)).
				Msg("Produits avec marque différente ajoutés à 'amazon'")
		}

		// Sauvegarder le cache après chaque mise à jour de marque
		sm.saveCacheToFile()

		// Commenté pour limiter le nombre de requêtes à exactement 17 (une par marque valide)
		/*
			// Récupérer les nouveaux produits
			newProducts, err := scraper.GetNewProducts()
			if err != nil {
				log.Error().Err(err).Str("brandID", brandID).Msg("Erreur lors de la mise à jour des nouveaux produits")
				continue
			}

			// Filtrer les nouveaux produits sans marque et organiser par marque
			var filteredNewProducts []Product
			var newAmazonProducts []Product

			for _, product := range newProducts {
				// Supprimer les produits sans marque
				if product.Brand == "" {
					continue
				}

				// S'assurer que le produit est marqué comme nouveau
				product.IsNew = true

				// Vérifier si la marque correspond au brandID demandé
				if strings.EqualFold(product.Brand, brandID) || strings.EqualFold(product.Brand, scraper.(*GenericScraper).BrandName) {
					// Normaliser la marque pour qu'elle corresponde exactement au brandID
					product.Brand = brandID
					filteredNewProducts = append(filteredNewProducts, product)
				} else {
					// Si la marque est différente, placer le produit dans "amazon"
					// Conserver la marque originale
					newAmazonProducts = append(newAmazonProducts, product)
				}
			}

			if len(filteredNewProducts) > 0 {
				log.Info().
					Str("brandID", brandID).
					Int("newProductCount", len(filteredNewProducts)).
					Int("filteredOut", len(newProducts)-len(filteredNewProducts)).
					Msg("Nouveaux produits récupérés pour la mise à jour du cache")

				// Ajouter les nouveaux produits à la liste principale des produits
				sm.cacheMu.Lock()
				existingProducts := sm.cache[brandID]

				// Fusionner les nouveaux produits avec les produits existants
				// en évitant les doublons (basés sur l'ID)
				productMap := make(map[string]Product)

				// D'abord ajouter les produits existants
				for _, p := range existingProducts {
					productMap[p.ID] = p
				}

				// Ensuite ajouter les nouveaux produits (ils remplaceront les existants avec le même ID)
				for _, p := range filteredNewProducts {
					productMap[p.ID] = p
				}

				// Reconvertir la map en slice
				var mergedProducts []Product
				for _, p := range productMap {
					mergedProducts = append(mergedProducts, p)
				}

				// Mettre à jour le cache avec les produits fusionnés
				sm.cache[brandID] = mergedProducts
				sm.cacheMu.Unlock()

				// Sauvegarder le cache après la fusion
				sm.saveCacheToFile()
			}

			// Ajouter les nouveaux produits avec marque différente à "amazon"
			if len(newAmazonProducts) > 0 {
				sm.cacheMu.Lock()
				existingAmazonProducts, exists := sm.cache["amazon"]
				if exists {
					// Fusionner avec les produits Amazon existants
					amazonProductMap := make(map[string]Product)

					// D'abord ajouter les produits existants
					for _, p := range existingAmazonProducts {
						amazonProductMap[p.ID] = p
					}

					// Ensuite ajouter les nouveaux produits
					for _, p := range newAmazonProducts {
						amazonProductMap[p.ID] = p
					}

					// Reconvertir la map en slice
					var mergedAmazonProducts []Product
					for _, p := range amazonProductMap {
						mergedAmazonProducts = append(mergedAmazonProducts, p)
					}

					sm.cache["amazon"] = mergedAmazonProducts
				} else {
					sm.cache["amazon"] = newAmazonProducts
				}
				sm.cacheMu.Unlock()

				log.Info().
					Int("newAmazonProductCount", len(newAmazonProducts)).
					Msg("Nouveaux produits avec marque différente ajoutés à 'amazon'")

				// Sauvegarder le cache après la fusion
				sm.saveCacheToFile()
			}
		*/

		// Petite pause pour éviter de surcharger les API
		// Réduire la pause pour améliorer les performances
		time.Sleep(300 * time.Millisecond)
	}

	// Mettre à jour la date d'expiration du cache
	// Utiliser 72 heures (3 jours) comme demandé par l'utilisateur
	sm.cacheMu.Lock()
	sm.cacheExp = time.Now().Add(72 * time.Hour)
	sm.cacheMu.Unlock()

	// Sauvegarder le cache produits dans un fichier
	sm.saveCacheToFile()

	// Mettre à jour et sauvegarder le cache inspirations APRÈS la mise à jour du cache produits
	log.Info().Msg("Démarrage de la mise à jour du cache inspirations")
	sm.UpdateInspirationsCache()
	log.Info().Msg("Cache inspirations mis à jour")

	log.Info().
		Int("brandsUpdated", brandsUpdated).
		Int("totalProductsUpdated", totalProductsUpdated).
		Time("updateTime", updateTime).
		Time("cacheExpiration", sm.cacheExp). // cacheExp est mis à jour dans UpdateCache
		Msg("Caches produits et inspirations mis à jour")
}

// Définition des inspirations et de leurs mots-clés
var inspirationDefinitions = map[string]struct {
	Name     string
	Image    string
	Keywords []string // Mots-clés en français et anglais, minuscules
}{
	"christmas": {
		Name:     "Noël",
		Image:    "https://api.a0.dev/assets/image?text=Noel&aspect=1:1&seed=1",
		Keywords: []string{"noël", "noel", "christmas", "cadeau", "gift", "fête", "hiver", "winter", "santa", "père", "sapin", "tree", "decoration", "guirlande", "garland", "boule", "ornament", "bas", "stocking", "couronne", "wreath", "calendar", "calendrier", "lights", "lumières", "bûche", "yule", "rennes", "reindeer", "bonhomme", "snowman", "neige", "snow", "écharpe", "scarf", "gants", "gloves", "chaussettes", "socks", "pull", "sweater", "dinde", "turkey", "chocolat", "chocolate", "vin", "wine", "jouets", "toys", "jeux", "games", "bricolage", "diy", "étoile", "star", "cloches", "bells", "casse", "nutcracker", "chaussons", "slippers", "pyjama", "pajamas", "films", "movies", "musique", "music", "bougie", "candle", "marché", "market", "carte", "card", "emballage", "wrapping", "traîneau", "sleigh", "ski", "skating", "patinage", "cacao", "cocoa", "pain", "gingerbread", "sucre", "candy", "boîte", "box", "ange", "angel", "houx", "holly", "gui", "mistletoe", "décorations", "decorations", "feu", "fireplace", "bredele", "cookies", "sablés", "shortbread", "appareil", "camera", "album", "montre", "watch", "bijoux", "jewelry", "parfum", "perfume", "écouteurs", "headphones", "console", "gaming", "smartphone", "livre", "book", "champagne", "whisky", "whiskey", "cognac", "brandy", "chocolats", "coffret", "portefeuille", "wallet", "sac", "bag", "chapeau", "hat", "pulls", "chaussettes", "pyjama", "pyjamas", "robe", "bathrobe", "couverture", "blanket", "plaid", "throw", "service", "set", "machine", "computer", "tablette", "tablet", "enceinte", "speaker", "casque", "headphones", "montre", "smartwatch", "liseuse", "reader", "imprimante", "printer", "puzzle", "jeux", "videogames", "livres", "cookbooks", "romans", "novels", "biographies", "documentaires", "documentaries", "séries", "shows", "vinyles", "vinyl", "cd", "dvd", "bluray", "kit", "ustensiles", "utensils", "robot", "processor", "balance", "scale", "machine", "maker", "raclette", "fondue", "théière", "teapot", "tasse", "mug", "bouteille", "thermos", "gourde", "bottle", "cocktail", "tire", "corkscrew", "accessoires", "accessories", "outils", "tools", "plantes", "plants", "plantation", "hamac", "hammock", "spa", "tub", "enceinte", "waterproof", "glacière", "cooler", "sac", "backpack", "valise", "suitcase", "camping", "drone", "caméra", "trottinette", "scooter", "vélo", "bike", "skateboard", "roller", "rollers", "instrument", "musical", "guitare", "guitar", "piano", "digital", "batterie", "drums", "microphone", "podcast", "dessin", "drawing", "peinture", "painting", "machine", "coudre", "broderie", "embroidery", "tricot", "knitting", "crochet", "bière", "beer", "cocktail", "cours", "class", "expérience", "experience", "carte", "card", "abonnement", "subscription", "magazine"},
	},
	"valentine": {
		Name:     "Saint-Valentin",
		Image:    "https://api.a0.dev/assets/image?text=Saint-Valentin&aspect=1:1&seed=2",
		Keywords: []string{"valentinte", "valentin", "valentine", "amour", "love", "couple", "romantique", "romantic", "cadeau", "gift", "dîner", "dinner", "chandelles", "candlelight", "roses", "rose", "fleurs", "flowers", "bouquet", "coeur", "heart", "chocolat", "chocolate", "bijoux", "jewelry", "bague", "ring", "collier", "necklace", "bracelet", "montre", "watch", "parfum", "perfume", "lingerie", "sous", "underwear", "champagne", "vin", "wine", "massage", "spa", "weekend", "getaway", "voyage", "trip", "photoshoot", "séance", "album", "photo", "cadre", "frame", "lettre", "letter", "poème", "poem", "chanson", "song", "playlist", "sérénade", "serenade", "peluche", "teddy", "ours", "bear", "cœur", "plush", "pétales", "petals", "bougies", "candles", "parfumées", "scented", "gastronomique", "gourmet", "restaurant", "cuisine", "cooking", "cours", "class", "dégustation", "tasting", "coffret", "box", "atelier", "workshop", "danse", "dance", "shooting", "session", "livre", "book", "personnalisé", "personalized", "album", "étoile", "star", "lune", "moon", "montre", "watches", "bijou", "engraved", "personnalisé", "beauté", "beauty", "bien", "wellness", "massage", "domicile", "home", "soins", "treatments", "spa", "jacuzzi", "privatif", "private", "sauna", "hammam", "croisière", "cruise", "montgolfière", "balloon", "parachute", "skydiving", "élastique", "bungee", "parapente", "paragliding", "kayak", "paddle", "randonnée", "hiking", "pique", "picnic", "cinéma", "movie", "concert", "spectacle", "show", "théâtre", "theater", "opéra", "opera", "ballet", "exposition", "exhibition", "musée", "museum", "parc", "attractions", "zoo", "aquarium", "planétarium", "planetarium", "observatoire", "observatory", "escape", "game", "jeu", "évasion", "aventure", "adventure", "activité", "unusual", "poterie", "pottery", "peinture", "painting", "parfum", "perfume", "chocolat", "chocolate", "pâtisserie", "pastry", "boîte", "message", "lampe", "lamp", "coussin", "pillow", "mug", "vêtements", "clothes", "boxer", "boxers", "culotte", "panties", "soutien", "bra", "chemise", "nightgown", "pyjama", "pajamas", "robe", "bathrobe", "chaussons", "slippers", "huile", "oil", "bougie", "candle", "jeu", "naughty", "érotique", "erotic", "couple", "game", "livre", "book", "accessoire", "accessory", "sextoy", "toy", "ensemble", "outfit", "déguisement", "costume", "jeu", "roleplay", "menottes", "handcuffs", "masque", "mask", "bandeau", "blindfold", "livre", "book", "miroir", "mirror", "séjour", "stay", "abonnement", "subscription", "carte", "card", "bon", "voucher", "chèque", "check", "expérience", "experience", "coffret", "gift", "découverte", "discovery", "cosmétiques", "cosmetics", "maquillage", "makeup", "soins", "skincare", "crème", "cream", "sérum", "serum", "huile", "oil", "produits", "products", "bain", "bath", "moussant", "bubble", "sel", "salt", "bombe", "bomb", "gel", "shower", "savon", "soap", "artisanal", "handmade", "porte", "dish", "diffuseur", "diffuser", "huiles", "essential", "encens", "incense", "oreiller", "pillow", "couette", "duvet", "linge", "linen", "théière", "teapot", "tasse", "cup", "service", "set", "vaisselle", "dishes", "verre", "glass", "flûte", "champagne", "carafe", "decanter", "décapsuleur", "opener", "tire", "corkscrew", "accessoires", "accessories"},
	},
	"girl_birthday": {
		Name:     "Anniversaire Fille",
		Image:    "https://api.a0.dev/assets/image?text=Anniversaire%20Fille&aspect=1:1&seed=3",
		Keywords: []string{"anniversaire", "birthday", "cadeau", "gift", "jouet", "toy", "poupée", "doll", "princesse", "princess", "barbie", "lol", "surprise", "poupées", "dolls", "lego", "friends", "playmobil", "polly", "pocket", "littlest", "pet", "monster", "high", "little", "pony", "petit", "licorne", "unicorn", "fée", "fairy", "sirène", "mermaid", "disney", "frozen", "reine", "neiges", "elsa", "anna", "moana", "vaiana", "mulan", "belle", "ariel", "cendrillon", "cinderella", "raiponce", "rapunzel", "jasmine", "tiana", "aurore", "aurora", "pocahontas", "blanche", "snow", "white", "minnie", "hello", "kitty", "pusheen", "kawaii", "cute", "peppa", "pig", "paw", "patrol", "pat", "patrouille", "miraculous", "ladybug", "raya", "encanto", "turning", "red", "alana", "soul", "peluche", "plush", "doudou", "stuffed", "animal", "robot", "interactif", "interactive", "furby", "tamagotchi", "jeu", "société", "board", "game", "adresse", "skill", "cartes", "card", "puzzle", "casse", "teaser", "lego", "meccano", "éducatif", "educational", "livre", "book", "histoire", "story", "coloriage", "coloring", "activités", "activity", "dessin", "drawing", "peinture", "painting", "feutres", "markers", "crayons", "colored", "pencils", "pâte", "modeler", "clay", "slime", "kit", "origami", "perles", "beads", "bracelet", "collier", "necklace", "bijoux", "jewelry", "maquillage", "makeup", "vernis", "nail", "polish", "parfum", "perfume", "trousse", "kit", "déguisement", "costume", "robe", "dress", "tutu", "jupe", "skirt", "accessoires", "hair", "accessories", "serre", "headband", "élastiques", "ties", "barrettes", "clips", "bandeau", "instrument", "musique", "musical", "piano", "guitare", "guitar", "micro", "microphone", "karaoké", "karaoke", "tablette", "tablet", "appareil", "camera", "montre", "smartwatch", "casque", "headphones", "enceinte", "speaker", "veilleuse", "light", "lampe", "lamp", "projecteur", "projector", "tente", "tent", "maison", "house", "cuisine", "kitchen", "dinette", "tea", "marchande", "shop", "poussette", "stroller", "landau", "carriage", "cheval", "rocking", "horse", "toboggan", "slide", "balançoire", "swing", "trampoline", "vélo", "bike", "trottinette", "scooter", "rollers", "skates", "patins", "ice", "skateboard", "hoverboard", "draisienne", "balance", "corde", "jump", "rope", "frisbee", "ballon", "ball", "jeu", "water", "pistolet", "gun", "piscine", "pool", "accessoires", "maillot", "swimsuit", "lunettes", "goggles", "bonnet", "cap", "serviette", "towel", "sac", "bag", "chapeau", "hat", "parapluie", "umbrella", "manteau", "coat", "veste", "jacket", "pull", "sweater", "tshirt", "shirt", "robe", "dress", "jupe", "skirt", "pantalon", "pants", "legging", "chaussettes", "socks", "chaussures", "shoes", "baskets", "sneakers", "bottes", "boots", "cartable", "school", "trousse", "pencil", "case", "gourde", "bottle", "lunch", "box", "boîte", "goûter", "snack", "bouteille", "thermos", "porte", "wallet", "tirelire", "piggy", "bank", "réveil", "alarm", "clock", "montre", "watch", "bijoux", "jewelry", "parfum", "perfume", "cosmétiques", "cosmetics", "soins", "skincare", "maquillage", "makeup", "nail", "art", "vernis", "polish", "tatouages", "tattoos", "teinture", "dye", "coloration", "temporary", "extension", "hair", "perruque", "wig", "kit", "coiffure", "hairstyling", "journal", "diary", "carnet", "notebook", "stylos", "pens", "papeterie", "stationery", "stickers", "washi", "tape", "appareil", "instant", "film", "drone", "kit", "science", "télescope", "telescope", "microscope", "expériences", "experiments", "robotique", "robotics", "ordinateur", "computer", "console", "gaming", "jeu", "video", "game", "casque", "vr", "kit", "couture", "sewing", "broderie", "embroidery", "tricot", "knitting", "machine", "coudre", "machine", "tissage", "weaving", "métier", "loom", "kit", "creative", "bricolage", "diy", "set", "manucure", "manicure", "kit", "cosmetics", "savon", "soap", "bougies", "candles", "parfum", "perfume", "cuisine", "cooking", "pâtisserie", "baking", "moule", "mold", "décorations", "decorations", "bougies", "candles", "appareil", "maker", "chocolats", "chocolates", "bonbons", "candy", "gâteaux", "cakes", "ballons", "balloons", "décorations", "birthday", "banderole", "banner", "piñata", "cotillons", "favors", "chapeaux", "hats", "cartes", "invitation", "cards", "appareil", "karaoke", "jeux", "games", "figurines", "figures", "cartes", "collectible", "cards", "pokémon", "pokemon", "jeu", "role", "playing", "magie", "magic", "tour", "trick", "bon", "gift", "carte", "card", "expérience", "experience", "cours", "class", "chant", "singing", "musique", "music", "art", "atelier", "workshop", "spa", "manucure", "manicure", "pédicure", "pedicure", "massage", "soins", "beauty", "journée", "wellness", "shooting", "photo", "séance", "session", "portrait", "tableau", "painting", "cadre", "frame", "album", "livre", "book", "écouteurs", "earphones", "enceinte", "speaker", "radio", "lecteur", "player", "livre", "audio", "audiobook", "musique", "music", "projecteur", "projector", "cinéma", "cinema", "télévision", "television", "écran", "screen", "abonnement", "subscription", "netflix", "disney", "amazon", "prime", "hulu", "musique", "music", "spotify", "apple", "deezer", "tidal", "magazine"},
	},
	"boy_birthday": {
		Name:     "Anniversaire Garçon",
		Image:    "https://api.a0.dev/assets/image?text=Anniversaire%20Garcon&aspect=1:1&seed=4",
		Keywords: []string{"anniversaire", "birthday", "cadeau", "gift", "jouet", "toy", "voiture", "car", "super", "superhero", "spiderman", "batman", "superman", "iron", "man", "avengers", "hulk", "thor", "captain", "america", "flash", "wonder", "woman", "star", "wars", "lego", "technic", "city", "ninjago", "marvel", "dc", "harry", "potter", "minecraft", "playmobil", "nerf", "pistolet", "gun", "construction", "meccano", "knex", "robot", "interactif", "interactive", "voiture", "télécommandée", "rc", "drone", "hélicoptère", "helicopter", "avion", "plane", "bateau", "boat", "sous", "submarine", "camion", "truck", "tracteur", "tractor", "pelleteuse", "excavator", "grue", "crane", "pompier", "firefighter", "police", "ambulance", "train", "circuit", "track", "piste", "course", "race", "électrique", "electric", "scientifique", "science", "expérience", "experiment", "chimie", "chemistry", "physique", "physics", "astronomie", "astronomy", "télescope", "telescope", "microscope", "programmable", "code", "coding", "programmation", "programming", "électronique", "electronics", "kit", "jeu", "vidéo", "video", "game", "console", "playstation", "ps5", "ps4", "xbox", "series", "nintendo", "switch", "wii", "pc", "game", "ordinateur", "computer", "tablette", "tablet", "vr", "réalité", "virtuelle", "virtual", "reality", "casque", "headset", "minecraft", "fortnite", "roblox", "among", "us", "fifa", "nba", "call", "duty", "mario", "zelda", "pokemon", "cartes", "cards", "yugioh", "yu", "gi", "oh", "magic", "gathering", "collectible", "figurine", "figure", "articulée", "action", "transformers", "power", "rangers", "godzilla", "dinosaure", "dinosaur", "animal", "animaux", "animals", "sauvage", "wild", "ferme", "farm", "zoo", "jungle", "forêt", "forest", "océan", "ocean", "espace", "space", "astronaute", "astronaut", "alien", "extraterrestre", "extraterrestrial", "robot", "cyborg", "ninja", "samouraï", "samurai", "chevalier", "knight", "pirate", "cowboy", "indien", "indian", "soldat", "soldier", "policier", "police", "officer", "pompier", "firefighter", "médecin", "doctor", "vétérinaire", "veterinarian", "pilote", "pilot", "course", "driver", "moto", "motorcycle", "football", "soccer", "basketball", "rugby", "tennis", "golf", "natation", "swimming", "ski", "snowboard", "skate", "skateboard", "roller", "rollers", "trottinette", "scooter", "vélo", "bike", "bmx", "vtt", "mountain", "ballon", "ball", "but", "goal", "filet", "net", "raquette", "racket", "club", "batte", "bat", "gants", "gloves", "casque", "helmet", "protections", "pads", "sac", "sport", "bag", "vêtements", "sportswear", "maillot", "jersey", "short", "shorts", "chaussettes", "socks", "chaussures", "shoes", "crampons", "cleats", "baskets", "sneakers", "sweat", "hoodie", "tshirt", "shirt", "pantalon", "pants", "jean", "jeans", "veste", "jacket", "manteau", "coat", "chemise", "shirt", "polo", "boxer", "boxers", "slip", "briefs", "chaussettes", "socks", "pyjama", "pajamas", "robe", "bathrobe", "chaussons", "slippers", "chapeau", "hat", "casquette", "cap", "bonnet", "beanie", "écharpe", "scarf", "gants", "gloves", "montre", "watch", "montre", "smartwatch", "bracelet", "chaîne", "chain", "collier", "necklace", "bague", "ring", "porte", "monnaie", "wallet", "portefeuille", "sac", "bag", "sac", "backpack", "valise", "suitcase", "trousse", "pencil", "case", "smartphone", "téléphone", "phone", "coque", "case", "écouteurs", "earphones", "casque", "headphones", "enceinte", "speaker", "appareil", "camera", "caméra", "sport", "gopro", "console", "portable", "handheld", "nintendo", "switch", "lite", "psp", "vita", "calculatrice", "calculator", "livre", "book", "bd", "comic", "manga", "roman", "novel", "aventure", "adventure", "fantastique", "fantasy", "science", "fiction", "sci-fi", "policier", "detective", "horreur", "horror", "audio", "audiobook", "magazine", "subscription", "journal", "newspaper", "carnet", "notebook", "agenda", "planner", "stylo", "pen", "feutre", "marker", "crayon", "pencil", "papeterie", "stationery", "instrument", "musical", "guitare", "guitar", "piano", "batterie", "drums", "synthétiseur", "synthesizer", "flûte", "flute", "harmonica", "violon", "violin", "saxophone", "trompette", "trumpet", "micro", "microphone", "karaoké", "karaoke", "société", "board", "monopoly", "trivial", "pursuit", "risk", "cluedo", "clue", "uno", "cartes", "card", "poker", "échecs", "chess", "dames", "checkers", "backgammon", "puissance", "connect", "puzzle", "3d", "rubiks", "cube", "casse", "teaser", "adresse", "skill", "jenga", "mikado", "pick", "up", "sticks", "domino", "machine", "bubble", "cerf", "volant", "kite", "yo", "yo", "frisbee", "boomerang", "jouet", "bain", "bath", "pistolet", "eau", "water", "jeu", "game", "piscine", "pool", "bouée", "float", "lunettes", "goggles", "maillot", "swimsuit", "serviette", "towel", "tente", "tent", "couchage", "sleeping", "bag", "lampe", "flashlight", "jumelles", "binoculars", "boussole", "compass", "couteau", "swiss", "army", "knife", "multi", "outil", "tool", "kit", "survie", "survival", "premiers", "secours", "aid", "sifflet", "whistle", "bricolage", "diy", "outil", "établi", "workbench", "perceuse", "drill", "marteau", "hammer", "tournevis", "screwdriver", "kit", "construction", "building", "maison", "house", "cabane", "cabin", "fort", "fortress", "château", "castle", "vaisseau", "spaceship", "fusée", "rocket", "avion", "plane", "hélicoptère", "helicopter", "bateau", "boat", "sous", "submarine", "robot", "tank", "char", "véhicule", "military", "vehicle", "cuisine", "cooking", "pâtisserie", "baking", "kit", "chocolate", "bonbons", "candy", "barbe", "papa", "cotton", "candy", "pop", "corn", "popcorn", "glace", "ice", "cream", "cookies", "biscuits", "gâteau", "cake", "appareil", "cupcakes", "maker", "crêpes", "pancake", "gaufres", "waffle", "espion", "spy", "jumelles", "binoculars", "détective", "detective", "microscope", "loupe", "magnifying", "glass", "empreintes", "fingerprints", "encre", "invisible", "ink", "code", "secret", "talkie", "walkie", "drone", "espion", "spy", "caméra", "montre", "watch", "journal", "diary", "cadenas", "padlock", "coffre", "safe", "aquarium", "terrarium", "fourmilière", "ant", "farm", "insectes", "insects", "reptiles", "poissons", "fish", "chien", "dog", "chat", "cat", "hamster", "cochon", "guinea", "pig", "lapin", "rabbit", "tortue", "turtle", "oiseau", "bird", "perroquet", "parrot", "nourriture", "pet", "food", "accessoires", "accessories", "cage", "jouet", "toy", "lit", "bed", "abonnement", "streaming", "subscription", "netflix", "disney", "amazon", "apple", "tv", "musique", "music", "spotify", "deezer", "jeu", "game", "playstation", "plus", "xbox", "pass", "nintendo", "online", "carte", "cadeau", "gift", "card", "itunes", "google", "play", "steam", "fortnite", "roblox", "minecraft", "discord", "twitch", "expérience", "experience", "baptême", "flight", "pilotage", "driving", "karting", "quad", "jet", "ski", "parc", "attractions", "amusement", "park", "aquatique", "water", "zoo", "safari", "aquarium", "spectacle", "show", "concert", "match", "escape", "game", "laser", "paintball", "accrobranche", "tree", "climbing", "rafting", "canyoning", "escalade", "climbing", "spéléologie", "caving", "plongée", "diving", "snorkeling", "surf", "kitesurf", "windsurf", "paddle", "kayak", "canoë", "canoe", "voile", "sailing", "ski", "snowboard", "motoneige", "snowmobile", "quad", "buggy", "kart", "moto", "motorcycle", "équitation", "horse", "riding", "cours", "class", "atelier", "workshop", "stage", "camp", "séjour", "stay", "voyage", "trip", "weekend", "vacances", "holidays", "camping", "rando", "hiking", "vtt", "biking", "pêche", "fishing", "chasse", "hunting", "musique", "music", "danse", "dance", "théâtre", "theater", "art", "magie", "magic", "cuisine", "cooking", "sport", "sports", "natation", "swimming", "ski", "surf", "equitation", "riding", "golf", "tennis", "judo", "karaté", "karate", "taekwondo", "boxe", "boxing", "yoga", "abonnement", "gym", "membership", "piscine", "pool", "club", "sportif", "sports", "magazine"},
	},
	"wedding": {
		Name:     "Mariage",
		Image:    "https://api.a0.dev/assets/image?text=Mariage&aspect=1:1&seed=5",
		Keywords: []string{"mariage", "wedding", "cadeau", "gift", "liste", "list", "nouveau", "couple", "new", "déco", "decoration", "boutonnière", "boutonniere", "album", "photo", "cadre", "frame", "livre", "book", "guest", "chemin", "table", "runner", "centre", "centerpiece", "vases", "photophore", "candle", "holder", "lanterne", "lantern", "guirlande", "garland", "ballons", "balloons", "arche", "arch", "fleurs", "flowers", "bouquet", "rose", "roses", "pivoine", "peony", "lys", "lily", "orchidée", "orchid", "gypsophile", "baby's", "breath", "eucalyptus", "fougère", "fern", "verdure", "greenery", "plante", "plant", "succulente", "succulent", "cactus", "terrarium", "vaisselle", "dishes", "assiettes", "plates", "verres", "glasses", "couverts", "cutlery", "serviettes", "napkins", "porcelaine", "porcelain", "cristal", "crystal", "argenterie", "silverware", "service", "tea", "set", "cafetière", "coffee", "maker", "théière", "teapot", "bouilloire", "kettle", "grille", "pain", "toaster", "robot", "cuisine", "food", "processor", "robot", "pâtissier", "stand", "mixer", "mixeur", "blender", "appareil", "fondue", "set", "raclette", "crêpière", "crepe", "maker", "gaufrier", "waffle", "machine", "bread", "four", "oven", "micro", "ondes", "microwave", "lave", "vaisselle", "dishwasher", "réfrigérateur", "refrigerator", "congélateur", "freezer", "cave", "vin", "wine", "cooler", "aspirateur", "vacuum", "cleaner", "fer", "iron", "centrale", "vapeur", "steam", "generator", "machine", "laver", "washing", "machine", "sèche", "linge", "dryer", "planche", "repasser", "ironing", "board", "appareil", "vapeur", "steamer", "ustensiles", "utensils", "couteaux", "knives", "planches", "cutting", "boards", "batterie", "cookware", "set", "poêles", "pan", "casseroles", "pot", "moules", "molds", "plats", "cuisson", "bakeware", "cocotte", "dutch", "oven", "mijoteuse", "slow", "cooker", "cuiseur", "steamer", "friteuse", "deep", "fryer", "sorbetière", "ice", "cream", "maker", "robot", "multifonction", "multi", "cooker", "balance", "scale", "minuteur", "timer", "thermomètre", "thermometer", "passoire", "colander", "essoreuse", "salad", "spinner", "moulin", "sel", "salt", "mill", "poivre", "pepper", "épices", "spices", "huile", "oil", "vinaigre", "vinegar", "machine", "café", "coffee", "machine", "cafetière", "maker", "expresso", "espresso", "moulin", "grinder", "dosettes", "pods", "capsules", "café", "grains", "beans", "moulu", "ground", "thé", "tea", "infusion", "herbal", "chocolat", "chocolate", "biscuits", "cookies", "confiserie", "confectionery", "bonbons", "candy", "vin", "wine", "rouge", "red", "blanc", "white", "rosé", "rose", "mousseux", "sparkling", "champagne", "prosecco", "cava", "spiritueux", "spirits", "whisky", "whiskey", "bourbon", "cognac", "armagnac", "calvados", "rhum", "rum", "vodka", "gin", "tequila", "mezcal", "vermouth", "pastis", "absinthe", "eau", "vie", "liqueur", "crème", "cassis", "creme", "cointreau", "grand", "marnier", "baileys", "amaretto", "limoncello", "malibu", "bière", "beer", "blonde", "lager", "brune", "brown", "ale", "blanche", "wheat", "ambrée", "amber", "ipa", "artisanale", "craft", "cidre", "cider", "brut", "dry", "doux", "sweet", "poiré", "perry", "hydromel", "mead", "kombucha", "jus", "juice", "orange", "pomme", "apple", "raisin", "grape", "ananas", "pineapple", "pamplemousse", "grapefruit", "cranberry", "smoothie", "sirop", "syrup", "érable", "maple", "agave", "miel", "honey", "eau", "water", "minérale", "mineral", "gazeuse", "sparkling", "aromatisée", "flavored", "soda", "cola", "limonade", "lemonade", "glacé", "iced", "vaisselle", "tableware", "assiette", "plate", "bol", "bowl", "tasse", "cup", "mug", "théière", "teapot", "cafetière", "coffee", "pot", "verre", "glass", "carafe", "pitcher", "pichet", "couvert", "cutlery", "couteau", "knife", "fourchette", "fork", "cuillère", "spoon", "café", "teaspoon", "soupe", "tablespoon", "louche", "ladle", "écumoire", "skimmer", "spatule", "spatula", "fouet", "whisk", "pince", "tongs", "râpe", "grater", "éplucheur", "peeler", "office", "paring", "chef", "chef's", "pain", "bread", "ciseaux", "scissors", "planche", "cutting", "board", "mortier", "mortar", "pilon", "pestle", "moulin", "mill", "casserole", "saucepan", "poêle", "pan", "faitout", "stockpot", "cocotte", "dutch", "oven", "wok", "sauteuse", "saute", "marmite", "pot", "autocuiseur", "pressure", "cooker", "cuiseur", "vapeur", "steamer", "lit", "bed", "drap", "sheet", "housse", "cover", "oreiller", "pillow", "couette", "duvet", "couverture", "blanket", "plaid", "throw", "dessus", "bedspread", "couvre", "bedcover", "serviettes", "bath", "towels", "peignoir", "bathrobe", "tapis", "bath", "mat", "accessoires", "bathroom", "accessories", "porte", "savon", "soap", "dish", "distributeur", "dispenser", "gobelet", "cup", "brosse", "toothbrush", "holder", "rideau", "shower", "curtain", "panier", "linge", "laundry", "basket", "corbeille", "papier", "waste", "poubelle", "trash", "can", "balai", "broom", "serpillière", "mop", "vapeur", "steam", "éponge", "sponge", "brosse", "brush", "gants", "gloves", "tapis", "rug", "carpette", "mat", "moquette", "carpet", "parquet", "wooden", "floor", "sol", "stratifié", "laminate", "flooring", "carrelage", "tile", "lino", "linoleum", "papier", "peint", "wallpaper", "peinture", "paint", "tableau", "painting", "cadre", "frame", "miroir", "mirror", "horloge", "clock", "réveil", "alarm", "lampe", "lamp", "lampadaire", "floor", "lamp", "suspension", "pendant", "light", "lustre", "chandelier", "applique", "wall", "sconce", "spot", "spotlight", "ampoule", "bulb", "led", "bougie", "candle", "parfumée", "scented", "diffuseur", "diffuser", "parfum", "ambiance", "room", "fragrance", "huile", "essentielle", "essential", "oil", "encens", "incense", "photophore", "candle", "holder", "vase", "pot", "cache", "plant", "jardinière", "planter", "serre", "greenhouse", "outils", "jardinage", "gardening", "tools", "arrosoir", "watering", "can", "tuyau", "arrosage", "garden", "hose", "tondeuse", "lawn", "mower", "taille", "haie", "hedge", "trimmer", "sécateur", "pruner", "râteau", "rake", "pelle", "shovel", "brouette", "wheelbarrow", "composteur", "composter", "barbecue", "grill", "plancha", "griddle", "salon", "jardin", "garden", "furniture", "table", "chaise", "chair", "fauteuil", "armchair", "banc", "bench", "hamac", "hammock", "bain", "soleil", "sun", "lounger", "parasol", "umbrella", "tonnelle", "gazebo", "store", "awning", "piscine", "pool", "spa", "jacuzzi", "sauna", "douche", "extérieure", "outdoor", "shower", "jeux", "extérieur", "outdoor", "games", "balançoire", "swing", "toboggan", "slide", "trampoline", "vélo", "bicycle", "trottinette", "scooter", "électrique", "electric", "scooter", "vélo", "bicycle", "skateboard", "roller", "rollers", "camping", "tente", "tent", "sac", "couchage", "sleeping", "bag", "matelas", "gonflable", "air", "mattress", "réchaud", "stove", "glacière", "cooler", "thermos", "randonnée", "hiking", "sac", "dos", "backpack", "gourde", "water", "bottle", "jumelles", "binoculars", "boussole", "compass", "appareil", "camera", "caméra", "objectif", "lens", "trépied", "tripod", "drone", "caméra", "sportive", "action", "gopro", "imprimante", "photo", "printer", "cadre", "numérique", "digital", "frame", "ordinateur", "computer", "portable", "laptop", "tablette", "tablet", "smartphone", "téléphone", "phone", "montre", "smartwatch", "enceinte", "speaker", "casque", "headphones", "écouteurs", "earphones", "téléviseur", "television", "home", "cinéma", "theater", "projecteur", "projector", "console", "jeux", "game", "console", "jeu", "vidéo", "video", "game", "livre", "book", "roman", "novel", "biographie", "biography", "cuisine", "cookbook", "art", "art", "book", "voyage", "travel", "book", "guide", "guidebook", "carte", "map", "magazine", "revue", "review", "journal", "newspaper", "abonnement", "subscription", "voyage", "travel", "séjour", "stay", "week", "end", "weekend", "croisière", "cruise", "vol", "flight", "hôtel", "hotel", "location", "rental", "gîte", "cottage", "valise", "suitcase", "bagage", "luggage", "sac", "voyage", "travel", "bag", "trousse", "toilette", "toiletry", "bag", "adaptateur", "adapter", "guide", "voyage", "travel", "guide", "appareil", "camera", "jumelles", "binoculars", "boussole", "compass", "gps", "montre", "watch", "bijou", "jewelry", "collier", "necklace", "bracelet", "bague", "ring", "boucles", "oreilles", "earrings", "montre", "watch", "boutons", "manchette", "cufflinks", "épingle", "cravate", "tie", "pin", "parfum", "perfume", "coffret", "set", "eau", "toilette", "cologne", "après", "rasage", "aftershave", "rasoir", "razor", "tondeuse", "trimmer", "épilateur", "epilator", "sèche", "cheveux", "hair", "dryer", "lisseur", "straightener", "fer", "friser", "curling", "iron", "brosse", "chauffante", "hot", "brush", "brosse", "cheveux", "hairbrush", "peigne", "comb", "miroir", "mirror", "trousse", "maquillage", "makeup", "bag", "palette", "eyeshadow", "rouge", "lèvres", "lipstick", "mascara", "fond", "teint", "foundation", "blush", "poudre", "powder", "vernis", "ongles", "nail", "polish", "kit", "manucure", "manicure", "kit", "spa", "massage", "soins", "treatments", "hammam", "bien", "être", "wellness", "relaxation", "détente", "yoga", "pilates", "fitness", "sport", "salle", "gym", "cours", "classes", "coaching", "abonnement", "subscription", "chèque", "voucher", "carte", "card", "bon", "gift", "certificate", "coffret", "box", "set", "panier", "hamper", "corbeille", "gourmande", "gourmet", "basket", "box", "cuisine", "kitchen", "vin", "wine", "bien", "être", "wellness", "beauté", "beauty", "voyage", "travel", "nuit", "unusual", "night", "cours", "class", "atelier", "workshop", "dégustation", "tasting", "spectacle", "show", "concert", "théâtre", "theater", "opéra", "opera", "ballet", "cirque", "circus", "exposition", "exhibition", "musée", "museum", "visite", "tour", "guided", "karting", "saut", "parachute", "skydiving", "élastique", "bungee", "jumping", "baptême", "flight", "montgolfière", "balloon", "simulateur", "simulator", "réalité", "virtuelle", "virtual", "reality", "escape", "game", "circuit", "track", "rafting", "canyoning", "spéléologie", "caving", "plongée", "diving", "snorkeling", "équitation", "horse", "riding", "ski", "snowboard", "surf", "kitesurf", "windsurf", "voile", "sailing", "kayak", "canoë", "canoe", "croisière", "cruise", "bateau", "boat", "catamaran", "yacht", "jet", "ski", "quad", "buggy", "moto", "motorcycle", "vol", "hélicoptère", "helicopter", "flight", "avion", "plane", "ulm", "microlight", "stage", "pilotage", "driving", "experience", "cours", "cuisine", "cooking", "class", "oenologie", "wine", "tasting", "mixologie", "mixology", "pâtisserie", "pastry", "art", "art", "photo", "photo", "séance", "session", "shooting", "shoot", "portrait", "photographie", "photography", "album", "book", "cadre", "frame", "expérience", "experience", "activité", "activity", "découverte", "discovery", "aventure", "adventure", "sensation", "forte", "thrill", "détente", "relaxation", "gastronomie", "gastronomy", "dégustation", "tasting", "vin", "wine", "champagne", "spiritueux", "spirits", "bière", "beer", "repas", "gastronomique", "gourmet", "meal", "dîner", "dinner", "restaurant", "table", "guest", "cours", "cooking", "cuisine", "domicile", "home", "cooking", "chef", "home", "livre", "guest", "book", "album", "wedding", "cagnotte", "money", "pot", "voyage", "noces", "honeymoon", "lune", "miel", "honeymoon"},
	},
	"baby_shower": {
		Name:     "Baby Shower",
		Image:    "https://api.a0.dev/assets/image?text=Baby%20Shower&aspect=1:1&seed=6",
		Keywords: []string{"baby", "shower", "naissance", "birth", "cadeau", "gift", "bébé", "baby", "nouveau", "newborn", "puériculture", "bavoir", "bib", "body", "onesie", "pyjama", "pajamas", "grenouillère", "sleepsuit", "bonnet", "hat", "chaussettes", "socks", "chaussons", "booties", "combinaison", "bodysuit", "salopette", "dungarees", "gigoteuse", "sleeping", "bag", "couverture", "blanket", "plaid", "throw", "drap", "sheet", "housse", "cover", "matelas", "mattress", "oreiller", "pillow", "tour", "lit", "cot", "bumper", "mobile", "berceau", "cradle", "couffin", "bassinet", "lit", "bed", "crib", "cododo", "sleeper", "parc", "playpen", "tapis", "éveil", "play", "mat", "transat", "bouncer", "balancelle", "swing", "siège", "auto", "car", "seat", "poussette", "stroller", "porte", "carrier", "écharpe", "portage", "wrap", "sac", "langer", "diaper", "bag", "table", "changing", "table", "matelas", "mat", "baignoire", "bathtub", "anneau", "bain", "bath", "ring", "thermomètre", "thermometer", "cape", "towel", "sortie", "gant", "toilette", "washcloth", "serviette", "shampoing", "shampoo", "gel", "lavant", "body", "wash", "savon", "soap", "crème", "cream", "huile", "oil", "lingettes", "wipes", "coton", "cotton", "coupe", "ongles", "nail", "clipper", "brosse", "brush", "peigne", "comb", "mouche", "nasal", "aspirator", "thermomètre", "thermometer", "humidificateur", "humidifier", "stérilisateur", "sterilizer", "chauffe", "biberon", "bottle", "warmer", "tire", "lait", "breast", "pump", "coussin", "allaitement", "nursing", "pillow", "biberon", "bottle", "tétine", "pacifier", "sucette", "goupillon", "brush", "stérilisateur", "sterilizer", "chaise", "haute", "high", "chair", "réhausseur", "booster", "seat", "barrière", "baby", "gate", "veilleuse", "night", "light", "moniteur", "monitor", "écoute", "doudou", "comfort", "blanket", "peluche", "plush", "hochet", "rattle", "anneau", "dentition", "teething", "ring", "livre", "book", "éveil", "baby", "tissu", "cloth", "bain", "bath", "jouet", "toy", "jeu", "game", "puzzle", "mobile", "musical", "tapis", "play", "mat", "ballon", "ball", "cube", "block", "porteur", "ride", "toy", "trotteur", "walker", "draisienne", "balance", "bike", "tricycle", "pousseur", "push", "toy", "culotte", "apprentissage", "training", "pants", "pot", "potty", "réducteur", "toilet", "seat", "reducer", "marche", "pied", "step", "stool", "couche", "diaper", "lavable", "cloth", "culotte", "protection", "cover", "lingette", "wipe", "insert", "seau", "couches", "pail", "poubelle", "bin", "corbeille", "basket", "panier", "boîte", "box", "coffre", "jouets", "toy", "rangement", "storage", "tiroir", "drawer", "étagère", "shelf", "tableau", "painting", "affiche", "poster", "cadre", "frame", "sticker", "wall", "mobile", "guirlande", "garland", "veilleuse", "light", "lampe", "lamp", "horloge", "clock", "toise", "height", "chart", "babyphone", "monitor", "moniteur", "vidéo", "video", "coussin", "pillow", "chaise", "chair", "fauteuil", "armchair", "canapé", "sofa", "bureau", "desk", "commode", "chest", "drawers", "armoire", "wardrobe", "bibliothèque", "bookcase", "tapis", "rug", "frise", "frieze", "rideau", "curtain", "store", "blind", "paravent", "screen", "jouet", "bain", "bath", "toy", "cape", "bath", "peignoir", "bathrobe", "serviette", "towel", "gant", "glove", "brosse", "dents", "toothbrush", "dentifrice", "toothpaste", "mouchoir", "tissue", "soin", "care", "crème", "hydratante", "moisturizer", "change", "diaper", "cream", "liniment", "sérum", "physiologique", "saline", "solution", "lotion", "shampoing", "shampoo", "savon", "soap", "gel", "lavant", "body", "wash", "eau", "nettoyante", "cleansing", "water", "huile", "massage", "massage", "oil", "talc", "talcum", "powder", "coupe", "ongles", "nail", "clipper", "ciseaux", "scissors", "thermomètre", "thermometer", "mouche", "nasal", "aspirator", "compresse", "compress", "pansement", "bandage", "sparadrap", "adhesive", "tape", "boîte", "pharmacie", "medicine", "box", "sérum", "physiologique", "saline", "solution", "paracétamol", "paracetamol", "vitamine", "vitamin", "complément", "alimentaire", "dietary", "supplement", "biberon", "bottle", "tétine", "nipple", "goupillon", "brush", "chauffe", "warmer", "stérilisateur", "sterilizer", "doseur", "measuring", "spoon", "tire", "lait", "pump", "coussin", "allaitement", "nursing", "pillow", "coussin", "grossesse", "pregnancy", "pillow", "ceinture", "belt", "soutien", "gorge", "nursing", "bra", "compresse", "allaitement", "pad", "lait", "infantile", "infant", "formula", "petit", "pot", "food", "jar", "purée", "puree", "compote", "applesauce", "céréale", "cereal", "biscuit", "cookie", "assiette", "plate", "bol", "bowl", "cuillère", "spoon", "fourchette", "fork", "gobelet", "cup", "bavette", "bib", "tablier", "apron", "gant", "mitten", "chancelière", "footmuff", "habillage", "pluie", "rain", "cover", "ombrelle", "parasol", "moustiquaire", "mosquito", "net", "vêtements", "clothes", "body", "bodysuit", "pyjama", "pajamas", "grenouillère", "sleepsuit", "gigoteuse", "sleeping", "bag", "combinaison", "bodysuit", "salopette", "dungarees", "robe", "dress", "jupe", "skirt", "pantalon", "pants", "legging", "short", "shorts", "tshirt", "shirt", "pull", "sweater", "gilet", "cardigan", "sweat", "sweatshirt", "manteau", "coat", "veste", "jacket", "imperméable", "raincoat", "bonnet", "hat", "casquette", "cap", "chapeau", "bandana", "écharpe", "scarf", "snood", "gants", "gloves", "moufles", "mittens", "chaussettes", "socks", "collants", "tights", "chaussons", "slippers", "chaussures", "shoes", "bottes", "boots", "sandales", "sandals", "maillot", "bain", "swimsuit", "couche", "piscine", "swim", "diaper", "lunettes", "soleil", "sunglasses", "crème", "solaire", "sunscreen", "protège", "cou", "neck", "protector", "parapluie", "umbrella", "montre", "watch", "bracelet", "identité", "identity", "pendentif", "pendant", "boîte", "dents", "tooth", "box", "mèche", "lock", "coffret", "box", "empreinte", "footprint", "kit", "album", "journal", "baby", "livre", "book", "souvenirs", "memory", "appareil", "camera", "caméscope", "camcorder", "imprimante", "printer", "cadre", "frame", "kit", "photo", "casting", "coffret", "repas", "meal", "set", "toilette", "toiletry", "naissance", "birth", "cadeau", "gift", "panier", "basket", "boîte", "box", "valise", "suitcase", "sac", "bag", "trousse", "pouch", "box", "subscription", "abonnement", "subscription", "carte", "card", "bon", "voucher", "chèque", "check", "personnalisé", "personalized", "vêtement", "clothing", "doudou", "comforter", "livre", "book", "vaisselle", "tableware", "bijou", "jewelry", "gourmette", "bracelet", "chaîne", "chain", "médaille", "medal", "pendentif", "pendant", "mobile", "peluche", "plush", "doudou", "comfort", "hochet", "rattle", "anneau", "dentition", "teething", "livre", "book", "jeu", "game", "jouet", "toy", "bois", "wooden", "éveil", "educational", "motricité", "motor", "skill", "sensoriel", "sensory", "puzzle", "tapis", "mat", "parc", "playpen", "portique", "gym", "transat", "bouncer", "balancelle", "swing", "trotteur", "walker", "youpala", "porteur", "ride", "draisienne", "balance", "poussette", "stroller", "tricycle", "siège", "car", "seat", "rehausseur", "booster", "organisateur", "organizer", "rétroviseur", "mirror", "pare", "soleil", "sunshade", "protection", "pluie", "rain", "cover", "habillage", "moustiquaire", "mosquito", "net", "organisateur", "organizer", "poussette", "canne", "umbrella", "stroller", "poussette", "double", "double", "stroller", "poussette", "trio", "travel", "system", "landau", "pram", "nacelle", "bassinet", "couffin", "porte", "baby", "carrier", "écharpe", "portage", "wrap", "physiologique", "ergonomic", "sac", "langer", "diaper", "bag", "organisateur", "couches", "organizer", "tapis", "changing", "pad", "matelas", "changing", "mat", "commode", "changing", "dresser", "table", "changing", "table", "baignoire", "bathtub", "siège", "bath", "seat", "anneau", "bath", "ring", "thermomètre", "thermometer", "jouet", "toy", "gant", "toilette", "washcloth", "serviette", "towel", "peignoir", "bathrobe", "cape", "bath", "cape", "sortie", "bath", "towel", "transat", "lounger", "lit", "bed", "berceau", "cradle", "couffin", "bassinet", "bébé", "crib", "parapluie", "travel", "cot", "cododo", "sleeper", "matelas", "mattress", "alèse", "protector", "drap", "sheet", "housse", "cover", "oreiller", "pillow", "couverture", "blanket", "plaid", "throw", "gigoteuse", "sleeping", "bag", "tour", "cot", "bumper", "ciel", "canopy", "mobile", "veilleuse", "night", "light", "projecteur", "projector", "boîte", "musique", "music", "box", "turbulette", "sleeping", "bag", "emmaillotage", "swaddle", "nid", "ange", "bunting", "bag", "couverture", "emmaillotage", "swaddle", "blanket", "cocoon", "réducteur", "reducer", "cale", "wedge", "protection", "tête", "head", "protection", "sac", "couchage", "sleeping", "bag", "sac", "voyage", "travel", "bag", "valise", "maternité", "maternity", "suitcase", "trousse", "toilette", "toiletry", "bag", "mobile", "éveil", "awakening", "jouet", "toy", "jeu", "game", "livre", "book", "peluche", "plush", "doudou", "comfort", "hochet", "rattle", "anneau", "dentition", "teething", "tapis", "play", "mat", "portique", "gym", "transat", "bouncer", "balancelle", "swing", "trotteur", "walker", "porteur", "ride", "draisienne", "balance", "bike", "tricycle", "vélo", "bike", "trottinette", "scooter", "casque", "helmet", "genouillères", "knee", "pads", "coudières", "elbow", "pads", "protège", "poignets", "wrist", "guards", "siège", "vélo", "bike", "seat", "remorque", "trailer", "drap", "sheet", "housse", "cover", "oreiller", "pillow", "couette", "duvet", "couverture", "blanket", "plaid", "throw", "matelas", "mattress", "alèse", "protector", "protège", "matelas", "lit", "bed", "berceau", "cradle", "couffin", "bassinet", "cododo", "sleeper", "parapluie", "travel", "cot", "matelas", "parc", "playpen", "mattress", "oreiller", "pillow", "traversin", "bolster", "couette", "duvet", "couverture", "blanket", "plaid", "throw", "gigoteuse", "sleeping", "bag", "turbulette", "tour", "lit", "cot", "bumper", "ciel", "canopy", "moustiquaire", "mosquito", "net", "drap", "housse", "fitted", "sheet", "plat", "flat", "housse", "couette", "duvet", "cover", "taie", "oreiller", "pillowcase", "alèse", "protector", "gigoteuse", "sleeping", "bag", "emmaillotage", "swaddle", "nid", "ange", "bunting", "bag", "couverture", "emmaillotage", "swaddle", "blanket", "cocoon", "réducteur", "reducer", "cale", "wedge", "protection", "tête", "head", "protection", "sac", "couchage", "sleeping", "bag", "sac", "voyage", "travel", "bag", "valise", "maternité", "maternity", "suitcase", "kit", "naissance", "birth", "kit", "valise", "suitcase", "organisateur", "organizer", "rangement", "storage", "boîte", "box", "panier", "basket", "coffre", "jouets", "toy", "chest", "bibliothèque", "bookshelf", "étagère", "shelf", "commode", "dresser", "armoire", "wardrobe", "table", "chaise", "chair", "bureau", "desk", "fauteuil", "armchair", "pouf", "ottoman", "banc", "bench", "tabouret", "stool", "table", "changing", "table", "commode", "changing", "dresser", "chaise", "haute", "high", "chair", "réhausseur", "booster", "seat", "siège", "seat", "coussin", "cushion", "repose", "pieds", "footrest", "tapis", "rug", "jeu", "play", "rug", "éveil", "play", "mat", "bain", "bath", "mat", "paravent", "screen", "barrière", "gate", "barrière", "lit", "bed", "rail", "rideau", "curtain", "store", "blind", "voilage", "sheer", "curtain", "coussin", "cushion", "oreiller", "pillow", "traversin", "bolster", "veilleuse", "night", "light", "lampe", "lamp", "lampadaire", "floor", "lamp", "suspension", "pendant", "light", "applique", "wall", "light", "projecteur", "projector", "guirlande", "garland", "lumineuse", "string", "lights", "peinture", "paint", "papier", "peint", "wallpaper", "sticker", "wall", "sticker", "tableau", "painting", "affiche", "poster", "cadre", "frame", "miroir", "mirror", "horloge", "clock", "toise", "height", "chart", "thermomètre", "thermometer", "hygromètre", "hygrometer", "humidificateur", "humidifier", "purificateur", "purifier", "déshumidificateur", "dehumidifier", "radiateur", "radiator", "ventilateur", "fan", "climatiseur", "air", "conditioner", "chauffage", "heater", "babyphone", "baby", "monitor", "moniteur", "vidéo", "video", "caméra", "camera", "alarme", "alarm", "détecteur", "detector", "interphone", "intercom", "surveillance", "surveillance", "sécurité", "security", "serrure", "lock", "bloque", "porte", "door", "stopper", "bloque", "tiroir", "drawer", "stopper", "cache", "prise", "outlet", "cover", "coin", "table", "corner", "protège", "coin", "corner", "protector", "pare", "feu", "fireplace", "guard", "barrière", "sécurité", "safety", "gate", "filet", "net", "alarme", "piscine", "pool", "alarm", "brassard", "armband", "bouée", "float", "maillot", "bain", "swimsuit", "couche", "piscine", "swim", "diaper", "peignoir", "bathrobe", "serviette", "towel", "matelas", "plage", "beach", "mat", "tente", "tent", "parasol", "crème", "solaire", "sunscreen", "après", "soleil", "after", "sun", "chapeau", "hat", "lunettes", "soleil", "sunglasses", "masque", "mask", "tuba", "snorkel", "palmes", "fins", "bouée", "float", "jeux", "plage", "beach", "toys", "ballon", "ball", "frisbee", "raquette", "racket", "trottinette", "scooter", "tricycle", "vélo", "bike", "draisienne", "balance", "bike", "casque", "helmet", "genouillères", "knee", "pads", "coudières", "elbow", "pads", "protège", "poignets", "wrist", "guards", "chaussures", "shoes", "baskets", "sneakers", "sandales", "sandals", "bottes", "boots", "chaussons", "slippers", "chaussettes", "socks", "collants", "tights", "legging", "leggings", "bonnet", "hat", "casquette", "cap", "chapeau", "cagoule", "balaclava", "écharpe", "scarf", "snood", "gants", "gloves", "moufles", "mittens", "combinaison", "snowsuit", "ski", "suit", "pluie", "rain", "suit", "imperméable", "raincoat", "parapluie", "umbrella", "cape", "manteau", "coat", "veste", "jacket", "gilet", "vest", "pull", "sweater", "sweat", "sweatshirt", "tshirt", "body", "bodysuit", "pyjama", "pajamas", "grenouillère", "sleepsuit", "salopette", "dungarees", "robe", "dress", "jupe", "skirt", "short", "shorts", "pantalon", "pants", "jean", "jeans", "legging", "leggings", "collant", "tights", "chaussettes", "socks", "chaussons", "slippers", "bavette", "bib", "bavoir", "tablier", "apron", "gant", "mitten", "maillot", "bain", "swimsuit", "lunettes", "glasses", "soleil", "sunglasses", "sac", "bag", "cartable", "satchel", "valise", "suitcase", "trousse", "pouch", "thermomètre", "thermometer", "tensiomètre", "blood", "pressure", "monitor", "oxymètre", "oximeter", "stéthoscope", "stethoscope", "balance", "scale", "pilulier", "pill", "box", "test", "grossesse", "pregnancy", "test", "ovulation", "ovulation", "test", "coussin", "grossesse", "pregnancy", "pillow", "ceinture", "belt", "vêtement", "maternity", "clothing", "soutien", "gorge", "allaitement", "nursing", "bra", "coussin", "nursing", "pillow", "chemise", "shirt", "tire", "lait", "breast", "pump", "compresse", "allaitement", "nursing", "pad", "coquillage", "breast", "shell", "accessoire", "breastfeeding", "accessory", "cours", "préparation", "preparation", "class", "sage", "femme", "midwife", "doula", "péridurale", "epidural", "césarienne", "cesarean", "accouchement", "childbirth", "naissance", "birth", "maternité", "maternity", "grossesse", "pregnancy", "nouveau", "newborn", "bébé", "baby", "enfant", "child", "maman", "mom", "papa", "dad", "parent", "famille", "family", "prénom", "name", "faire", "part", "birth", "announcement", "baptême", "baptism", "parrain", "godfather", "marraine", "godmother", "fête", "prénatale", "baby", "shower", "gender", "reveal", "naissance", "birth", "party", "livre", "book", "album", "santé", "health", "carnet", "suivi", "monitoring", "book", "rendez", "appointment", "suivi", "follow", "consultation", "échographie", "ultrasound", "amniocentèse", "amniocentesis", "test", "sanguin", "blood", "test", "vaccination", "vitamine", "vitamin", "supplément", "supplement", "fer", "iron", "acide", "folique", "folic", "acid", "calcium", "magnésium", "magnesium", "zinc", "probiotique", "probiotic", "huile", "poisson", "fish", "oil", "oméga", "omega", "multivitamine", "multivitamin", "complément", "alimentaire", "dietary", "supplement", "régime", "diet", "nutrition", "hydratation", "hydration", "exercice", "exercise", "yoga", "pilates", "natation", "swimming", "marche", "walking", "méditation", "meditation", "relaxation", "sommeil", "sleep", "repos", "rest", "massage", "spa", "bien", "être", "wellness", "soin", "care", "crème", "cream", "huile", "oil", "sérum", "serum", "lotion", "gel", "baume", "balm", "spray", "mousse", "foam", "shampooing", "shampoo", "après", "shampooing", "conditioner", "masque", "mask", "gommage", "scrub", "savon", "soap", "gel", "douche", "shower", "gel", "sel", "bain", "bath", "salt", "bombe", "bath", "bomb", "huile", "bain", "bath", "oil", "bain", "moussant", "bubble", "bath", "déodorant", "deodorant", "parfum", "perfume", "eau", "toilette", "eau", "toilette", "maquillage", "makeup", "démaquillant", "makeup", "remover", "crème", "hydratante", "moisturizer", "anti", "vergetures", "stretch", "mark", "cream", "huile", "oil", "crème", "seins", "breast", "cream", "mamelons", "nipple", "cream", "jambes", "leg", "cream", "pieds", "foot", "cream", "décongestionnant", "decongestant", "antinauséeux", "anti", "nausea", "antiacide", "antacid", "laxatif", "laxative", "probiotique", "probiotic", "supplément", "supplement", "tisane", "herbal", "tea", "thé", "tea", "infusion", "bouillotte", "hot", "water", "bottle", "coussin", "chauffant", "heating", "pad", "compresse", "compress", "pansement", "bandage", "sérum", "physiologique", "saline", "solution", "coton", "cotton", "coton", "tige", "swab", "lingette", "wipe", "mouchoir", "tissue", "thermomètre", "thermometer", "tensiomètre", "blood", "pressure", "monitor", "oxymètre", "oximeter", "stéthoscope", "stethoscope", "balance", "scale", "pilulier", "pill", "box", "humidificateur", "humidifier", "purificateur", "purifier"},
	},
	"fathers_day": {
		Name:     "Fête des Pères",
		Image:    "https://api.a0.dev/assets/image?text=Fete%20des%20Peres&aspect=1:1&seed=8",
		Keywords: []string{"père", "father", "papa", "dad", "daddy", "papi", "grandpa", "papy", "fête", "celebration", "cadeau", "gift", "homme", "man", "masculin", "masculine", "barbe", "beard", "moustache", "mustache", "rasage", "shaving", "rasoir", "razor", "lame", "blade", "mousse", "foam", "blaireau", "brush", "savon", "soap", "aftershave", "lotion", "gel", "tondeuse", "trimmer", "toilettage", "grooming", "kit", "set", "coiffure", "hairstyle", "coupe", "cut", "cheveux", "hair", "shampoing", "shampoo", "peigne", "comb", "brosse", "brush", "parfum", "perfume", "cologne", "déodorant", "deodorant", "soin", "care", "visage", "face", "crème", "cream", "hydratant", "moisturizer", "gommage", "scrub", "masque", "mask", "baume", "balm", "douche", "shower", "bain", "bath", "serviette", "towel", "peignoir", "bathrobe", "accessoire", "accessory", "cuir", "leather", "portefeuille", "wallet", "porte", "cartes", "cardholder", "porte", "monnaie", "coin", "portefeuille", "purse", "sac", "bag", "sacoche", "satchel", "besace", "messenger", "bandoulière", "shoulder", "bourse", "pouch", "bagage", "luggage", "valise", "suitcase", "voyage", "travel", "ceinture", "belt", "boucle", "buckle", "bretelles", "suspenders", "noeud", "knot", "papillon", "bow", "tie", "cravate", "necktie", "boutons", "buttons", "manchette", "cuff", "liens", "links", "épingle", "pin", "montre", "watch", "automatique", "automatic", "mécanique", "mechanical", "quartz", "bracelet", "bracelet", "chronographe", "chronograph", "squelette", "skeleton", "connectée", "connected", "intelligente", "smart", "sport", "sportive", "sports", "chronométre", "stopwatch", "bijou", "jewelry", "collier", "necklace", "pendentif", "pendant", "bracelet", "chaine", "chain", "gourmette", "id", "bague", "ring", "chevalière", "signet", "alliance", "wedding", "pince", "clip", "chapeau", "hat", "casquette", "cap", "béret", "beret", "panama", "fedora", "melon", "bowler", "haut", "top", "forme", "canotier", "boater", "cowboy", "bonnet", "beanie", "écharpe", "scarf", "foulard", "neckerchief", "gants", "gloves", "mitaines", "mittens", "lunettes", "glasses", "soleil", "sun", "solaires", "sunglasses", "parapluie", "umbrella", "canne", "cane", "bâton", "walking", "vêtement", "clothing", "costume", "suit", "smoking", "tuxedo", "veston", "jacket", "blazer", "sport", "coat", "veste", "jeans", "jean", "denim", "chino", "pantalon", "pants", "trousers", "short", "shorts", "bermuda", "chemise", "shirt", "polo", "dress", "casual", "tshirt", "tee", "maillot", "jersey", "sweat", "sweatshirt", "pull", "sweater", "gilet", "vest", "cardigan", "hoodie", "capuche", "parka", "manteau", "coat", "imperméable", "raincoat", "trench", "duffle", "doudoune", "puffer", "blouson", "bomber", "veste", "jacket", "cuir", "leather", "costume", "bain", "swimsuit", "maillot", "swimming", "boxer", "boxers", "slip", "briefs", "chaussettes", "socks", "collants", "tights", "pyjama", "pajamas", "robe", "chambre", "bathrobe", "peignoir", "chaussons", "slippers", "pantoufles", "chaussure", "shoe", "mocassin", "loafer", "bateau", "boat", "derby", "richelieu", "oxford", "boots", "bottines", "chelsea", "desert", "baskets", "sneakers", "running", "trail", "tennis", "skate", "skateboard", "randonnée", "hiking", "trekking", "sport", "sports", "football", "soccer", "rugby", "basketball", "handball", "volleyball", "tennis", "golf", "ski", "snowboard", "surf", "paddle", "skateboard", "skate", "roller", "rollers", "patins", "skates", "vélo", "bike", "bicycle", "cyclisme", "cycling", "vtt", "mountain", "course", "racing", "natation", "swimming", "plongée", "diving", "snorkeling", "voile", "sailing", "nautique", "nautical", "pêche", "fishing", "chasse", "hunting", "tir", "shooting", "escalade", "climbing", "alpinisme", "mountaineering", "camping", "randonnée", "hiking", "trekking", "équipement", "equipment", "accessoire", "accessory", "tente", "tent", "sac", "couchage", "sleeping", "bag", "matelas", "mattress", "gonflable", "inflatable", "réchaud", "stove", "gourde", "flask", "thermos", "couteau", "knife", "suisse", "swiss", "multifonction", "multitool", "lampe", "lamp", "torche", "torch", "frontale", "headlamp", "jumelles", "binoculars", "boussole", "compass", "gps", "sifflet", "whistle", "briquet", "lighter", "allumettes", "matches", "survie", "survival", "premiers", "secours", "first", "aid", "boisson", "drink", "vin", "wine", "whisky", "whiskey", "cognac", "rhum", "rum", "vodka", "gin", "tequila", "bière", "beer", "champagne", "cidre", "cider", "spiritueux", "spirits", "liqueur", "dégustation", "tasting", "cave", "cellar", "carafe", "decanter", "verre", "glass", "flûte", "flute", "gobelet", "tumbler", "chope", "mug", "tire", "bouchon", "corkscrew", "décapsuleur", "opener", "cigare", "cigar", "cigarette", "pipe", "tabac", "tobacco", "narguilé", "hookah", "chicha", "shisha", "briquet", "lighter", "cuisine", "cooking", "chef", "barbecue", "grill", "plancha", "grillade", "grilling", "smoking", "fumoir", "smoker", "couteau", "knife", "ustensile", "utensil", "planche", "board", "tablier", "apron", "gant", "glove", "recette", "recipe", "livre", "book", "épice", "spice", "condiment", "sauce", "marinade", "rub", "café", "coffee", "machine", "maker", "expresso", "espresso", "capsule", "pod", "moulin", "grinder", "cafetière", "percolator", "filtre", "filter", "thé", "tea", "théière", "teapot", "infuseur", "infuser", "chocolat", "chocolate", "confiserie", "confectionery", "gâteau", "cake", "pâtisserie", "pastry", "boulangerie", "bakery", "fromage", "cheese", "charcuterie", "delicatessen", "viande", "meat", "poisson", "fish", "foie", "gras", "caviar", "truffe", "truffle", "champignon", "mushroom", "restaurant", "gastronomie", "gastronomy", "repas", "meal", "déjeuner", "lunch", "dîner", "dinner", "réservation", "reservation", "cuisine", "cookery", "cours", "course", "atelier", "workshop", "dégustation", "tasting", "stage", "training", "expérience", "experience", "musique", "music", "instrument", "guitare", "guitar", "électrique", "electric", "acoustique", "acoustic", "basse", "bass", "batterie", "drums", "piano", "clavier", "keyboard", "saxophone", "saxophone", "trompette", "trumpet", "violon", "violin", "harmonica", "flûte", "flute", "concert", "musique", "music", "album", "disque", "record", "vinyle", "vinyl", "platine", "turntable", "enceinte", "speaker", "bluetooth", "casque", "headphone", "écouteurs", "earbuds", "ampli", "amplifier", "home", "cinema", "théâtre", "theater", "lecteur", "player", "radio", "chaîne", "stereo", "streaming", "abonnement", "subscription", "sport", "sports", "football", "soccer", "rugby", "tennis", "golf", "basket", "basketball", "handball", "volleyball", "baseball", "hockey", "boxe", "boxing", "mma", "ufc", "billets", "tickets", "places", "seats", "match", "game", "tournoi", "tournament", "abonnement", "subscription", "saison", "season", "maillot", "jersey", "ballon", "ball", "balle", "écharpe", "scarf", "fanion", "pennant", "drapeau", "flag", "mug", "stade", "stadium", "jeu", "game", "société", "board", "cartes", "cards", "échecs", "chess", "backgammon", "dames", "checkers", "puzzle", "dominos", "poker", "casino", "roulette", "blackjack", "console", "gaming", "jeux", "video", "games", "ordinateur", "computer", "portable", "laptop", "tablette", "tablet", "smartphone", "téléphone", "phone", "appareil", "device", "gadget", "accessoire", "accessory", "informatique", "computing", "technologie", "technology", "high", "tech", "électronique", "electronics", "appareil", "photo", "camera", "caméra", "caméscope", "camcorder", "objectif", "lens", "drone", "gopro", "action", "vidéo", "video", "audio", "casque", "headset", "enceinte", "speaker", "micro", "microphone", "écouteurs", "earphones", "ampli", "amplifier", "home", "cinema", "theater", "télévision", "television", "écran", "screen", "projecteur", "projector", "livre", "book", "roman", "novel", "policier", "thriller", "science", "fiction", "fantasy", "fantastique", "biographie", "biography", "histoire", "history", "politique", "politics", "philosophie", "philosophy", "science", "sciences", "art", "arts", "littérature", "literature", "poésie", "poetry", "cuisine", "cooking", "recette", "recipe", "voyage", "travel", "guide", "nature", "magazine", "revue", "review", "journal", "newspaper", "abonnement", "subscription", "bd", "comic", "manga", "dessin", "drawing", "peinture", "painting", "photographie", "photography", "sculpture", "poterie", "pottery", "céramique", "ceramic", "verrerie", "glassware", "artisanat", "craft", "bricolage", "diy", "outil", "tool", "outillage", "tools", "perceuse", "drill", "visseuse", "screwdriver", "scie", "saw", "ponceuse", "sander", "meuleuse", "grinder", "tournevis", "screwdriver", "marteau", "hammer", "pince", "pliers", "clé", "wrench", "niveau", "level", "mètre", "measure", "tape", "établi", "workbench", "rangement", "storage", "boîte", "box", "caisse", "crate", "jardinage", "gardening", "jardin", "garden", "plante", "plant", "fleur", "flower", "arbre", "tree", "arbuste", "shrub", "potager", "vegetable", "graine", "seed", "terreau", "soil", "pot", "jardinière", "planter", "serre", "greenhouse", "tondeuse", "mower", "taille", "haie", "hedge", "trimmer", "débroussailleuse", "brush", "cutter", "souffleur", "blower", "arrosoir", "watering", "tuyau", "hose", "râteau", "rake", "pelle", "shovel", "bêche", "spade", "gant", "glove", "tracteur", "tractor", "voiture", "car", "automobile", "auto", "moto", "motorcycle", "scooter", "quad", "vélo", "bike", "bicycle", "accessoire", "accessory", "casque", "helmet", "gant", "glove", "blouson", "jacket", "combinaison", "suit", "botte", "boot", "entretien", "maintenance", "nettoyage", "cleaning", "polish", "wax", "housse", "cover", "modèle", "model", "miniature", "réplique", "replica", "collection", "collectible", "vintage", "retro", "ancien", "antique", "antiquité", "antiquity", "brocante", "flea", "market", "occasion", "second", "hand", "décoration", "decoration", "design", "intérieur", "interior", "meuble", "furniture", "table", "chaise", "chair", "fauteuil", "armchair", "canapé", "sofa", "lit", "bed", "bureau", "desk", "bibliothèque", "bookcase", "étagère", "shelf", "commode", "chest", "armoire", "wardrobe", "luminaire", "lighting", "lampe", "lamp", "lustre", "chandelier", "applique", "sconce", "suspension", "pendant", "abat", "jour", "lampshade", "ampoule", "bulb", "led", "tableau", "painting", "affiche", "poster", "cadre", "frame", "miroir", "mirror", "tapis", "rug", "coussin", "cushion", "plaid", "throw", "bougie", "candle", "photophore", "holder", "parfum", "perfume", "diffuseur", "diffuser", "vase", "statue", "sculpture", "objet", "object", "voyage", "travel", "séjour", "stay", "week", "end", "weekend", "vacances", "vacation", "holiday", "étranger", "abroad", "destination", "transport", "avion", "plane", "train", "voiture", "car", "croisière", "cruise", "camping", "hôtel", "hotel", "billet", "ticket", "réservation", "booking", "visite", "visit", "guidée", "guided", "tour", "excursion", "activité", "activity", "aventure", "adventure", "découverte", "discovery", "sport", "extrême", "extreme", "sports", "saut", "parachute", "skydiving", "parapente", "paragliding", "deltaplane", "hang", "gliding", "montgolfière", "balloon", "hélicoptère", "helicopter", "ulm", "microlight", "avion", "plane", "pilotage", "piloting", "simulateur", "simulator", "karting", "rallye", "rally", "circuit", "course", "racing", "vitesse", "speed", "sensations", "fortes", "thrills", "adrénaline", "adrenaline", "rafting", "canyoning", "kayak", "canoë", "canoe", "voile", "sailing", "plongée", "diving", "surf", "kitesurf", "windsurf", "ski", "snowboard", "motoneige", "snowmobile", "quad", "jetski", "4x4", "offroad", "escalade", "climbing", "via", "ferrata", "accrobranche", "zip", "line", "tyrolienne", "bungee", "saut", "élastique", "jump", "spa", "massage", "bien", "être", "wellness", "relaxation", "détente", "relaxation", "sauna", "hammam", "jacuzzi", "thalasso", "thalassotherapy", "thermal", "thermae", "soins", "treatments", "thérapie", "therapy", "yoga", "méditation", "meditation", "retraite", "retreat", "stage", "cours", "class", "formation", "training", "coaching", "développement", "development", "personnel", "personal", "professionnel", "professional", "carrière", "career", "photo", "photographie", "photography", "appareil", "camera", "objectif", "lens", "photoshoot", "shooting", "session", "portrait", "album", "livre", "book", "cours", "class", "atelier", "workshop", "sculpture", "sculpture", "poterie", "pottery", "céramique", "ceramic", "peinture", "painting", "dessin", "drawing", "art", "artisanat", "craft", "couture", "sewing", "tricot", "knitting", "broderie", "embroidery", "crochet", "tissage", "weaving", "bijou", "jewelry", "joaillerie", "jewellery", "vin", "wine", "œnologie", "oenology", "dégustation", "tasting", "visite", "visit", "cave", "cellar", "vignoble", "vineyard", "château", "castle", "domaine", "estate", "whisky", "whiskey", "rhum", "rum", "cognac", "armagnac", "spiritueux", "spirits", "cocktail", "mixologie", "mixology", "atelier", "workshop", "gastronomie", "gastronomy", "cuisine", "cooking", "chef", "cours", "class", "démonstration", "demonstration", "restaurant", "étoilé", "starred", "michelin", "table", "gastronomique", "gourmet", "spectacle", "show", "théâtre", "theater", "comédie", "comedy", "drame", "drama", "opéra", "opera", "ballet", "danse", "dance", "concert", "musique", "music", "festival", "cirque", "circus", "cabaret", "humour", "humor", "stand", "comedy", "magie", "magic", "mentalisme", "mentalism", "illusion", "exposition", "exhibition", "musée", "museum", "galerie", "gallery", "foire", "fair", "salon", "show", "conférence", "conference", "livre", "book", "auteur", "author", "dédicace", "signing", "rencontre", "meeting", "carte", "card", "cadeau", "gift", "chèque", "check", "bon", "voucher", "coffret", "box", "box", "mensuelle", "monthly", "expérience", "experience", "activité", "activity", "inscription", "registration", "abonnement", "subscription", "adhésion", "membership", "collection", "collector", "édition", "edition", "limitée", "limited", "numérotée", "numbered", "luxe", "luxury", "prestige", "premium", "haut", "gamme", "high", "end", "exclusif", "exclusive", "unique", "personnalisé", "personalized", "gravé", "engraved", "brodé", "embroidered", "sur", "mesure", "custom", "made", "artisanal", "handcrafted", "fait", "main", "handmade"},
	},
	"mothers_day": {
		Name:     "Fête des Mères",
		Image:    "https://api.a0.dev/assets/image?text=Fete%20des%20Meres&aspect=1:1&seed=7",
		Keywords: []string{"fête", "mères", "mother", "day", "cadeau", "mom", "gift", "maman", "mom", "mère", "mother", "fleurs", "flowers", "bouquet", "roses", "rose", "pivoine", "peony", "lys", "lily", "orchidée", "orchid", "tulipe", "tulip", "gerbera", "gypsophile", "muguet", "chrysanthème", "tournesol", "marguerite", "hortensia", "dahlia", "œillet", "iris", "freesia", "lisianthus", "renoncule", "arum", "alstroemeria", "glaïeul", "amaryllis", "protea", "anthurium", "strelitzia", "plante", "plant", "intérieur", "cactus", "succulente", "bonsaï", "ficus", "monstera", "calathea", "pothos", "fougère", "pilea", "sanseveria", "aloe", "spathiphyllum", "zamioculcas", "begonia", "azalée", "cyclamen", "violette", "géranium", "pelargonium", "jasmin", "hibiscus", "verveine", "lavande", "romarin", "thym", "basilic", "menthe", "ciboulette", "persil", "coriandre", "sauge", "estragon", "aneth", "origan", "mélisse", "terrarium", "pot", "cache", "serre", "mini", "arrosoir", "vaporisateur", "outil", "jardinage", "gant", "tablier", "panier", "coffret", "boîte", "cadeau", "garni", "corbeille", "gourmand", "thé", "café", "chocolat", "vin", "champagne", "spiritueux", "fromage", "charcuterie", "épicerie", "cuisine", "pâtisserie", "confiserie", "beauté", "soin", "parfum", "maquillage", "bien", "spa", "massage", "détente", "bain", "linge", "déco", "livre", "musique", "film", "voyage", "expérience", "box", "mensuelle", "abonnement", "littéraire", "beauté", "cuisine", "jardinage", "créative", "zéro", "déchet", "fromage", "chocolat", "yoga", "sport", "boîte", "coffret", "épices", "confiture", "miel", "tartiner", "sirop", "huile", "vinaigre", "sel", "poivre", "épice", "herbe", "condiment", "sauce", "moutarde", "ketchup", "mayonnaise", "vinaigrette", "pesto", "tapenade", "houmous", "guacamole", "dip", "tartare", "aïoli", "tarama", "caviar", "foie", "gras", "terrine", "pâté", "rillettes", "saucisson", "jambon", "chorizo", "salami", "coppa", "pancetta", "bacon", "lard", "saumon", "truite", "magret", "anchois", "olive", "cornichon", "câpre", "oignon", "ail", "échalote", "tomate", "champignon", "truffe", "morille", "cèpe", "girolle", "shiitake", "pleurote", "fromage", "chèvre", "brebis", "vache", "bleu", "camembert", "brie", "reblochon", "comté", "emmental", "gruyère", "parmesan", "mozzarella", "burrata", "ricotta", "mascarpone", "feta", "halloumi", "cheddar", "gouda", "edam", "munster", "maroilles", "livarot", "pont", "époisses", "chaource", "brillat", "roquefort", "auvergne", "fourme", "gorgonzola", "stilton", "pain", "baguette", "campagne", "complet", "céréales", "levain", "olives", "noix", "raisins", "chocolat", "croissant", "brioche", "focaccia", "ciabatta", "bagel", "muffin", "cookie", "biscuit", "gâteau", "tarte", "quiche", "cracker", "biscotte", "grillé", "céréales", "chocolat", "noir", "lait", "blanc", "truffe", "bonbon", "caramel", "nougat", "calisson", "guimauve", "fruit", "dragée", "praline", "marron", "amande", "réglisse", "berlingot", "sucette", "chewing", "thé", "café", "chocolat", "cacao", "infusion", "tisane", "maté", "rooibos", "chaï", "cappuccino", "espresso", "latte", "mocaccino", "vin", "rouge", "blanc", "rosé", "mousseux", "champagne", "prosecco", "cava", "spiritueux", "whisky", "whiskey", "bourbon", "cognac", "armagnac", "calvados", "rhum", "vodka", "gin", "tequila", "mezcal", "vermouth", "pastis", "absinthe", "vie", "liqueur", "cassis", "cointreau", "marnier", "baileys", "amaretto", "limoncello", "malibu", "bière", "blonde", "brune", "blanche", "ambrée", "ipa", "artisanale", "cidre", "brut", "doux", "rosé", "poiré", "hydromel", "kombucha", "jus", "orange", "pomme", "raisin", "ananas", "pamplemousse", "cranberry", "smoothie", "sirop", "érable", "agave", "miel", "eau", "minérale", "gazeuse", "aromatisée", "soda", "cola", "limonade", "glacé", "vaisselle", "assiette", "bol", "tasse", "mug", "théière", "cafetière", "verre", "carafe", "pichet", "couvert", "couteau", "fourchette", "cuillère", "café", "soupe", "louche", "écumoire", "spatule", "fouet", "pince", "râpe", "éplucheur", "office", "chef", "pain", "ciseaux", "planche", "mortier", "pilon", "moulin", "casserole", "poêle", "faitout", "cocotte", "wok", "sauteuse", "marmite", "autocuiseur", "cuiseur", "vapeur", "friteuse", "sorbetière", "robot", "balance", "minuteur", "thermomètre", "passoire", "essoreuse", "sel", "poivre", "machine", "cafetière", "expresso", "moulin", "dosettes", "capsules", "grains", "moulu", "thé", "infusion", "chocolat", "biscuits", "confiserie", "bonbons", "vin", "champagne", "spiritueux", "bière", "cidre", "jus", "sirop", "eau", "vaisselle", "assiette", "bol", "tasse", "mug", "verre", "carafe", "couvert", "couteau", "fourchette", "cuillère", "spatule", "planche", "tablier", "torchon", "blouse", "lingettes", "vaisselle", "couverts", "verres", "assiettes", "tasses", "mugs", "bols", "saladier", "plat", "service", "planche", "plateau", "porte", "serviettes", "set", "table", "sous", "verre", "nappe", "serviettes", "carafe", "pichet", "jug", "bouteille", "saucière", "sucrier", "crémier", "beurrier", "huilier", "vinaigrier", "salière", "poivrière", "linge", "lit", "draps", "housse", "couette", "couette", "oreiller", "taie", "couverture", "plaid", "dessus", "couvre", "serviettes", "bain", "peignoir", "tapis", "accessoires", "salle", "porte", "savon", "distributeur", "gobelet", "porte", "brosse", "dents", "rideau", "douche", "panier", "linge", "corbeille", "papier", "poubelle", "balai", "serpillière", "vapeur", "éponge", "brosse", "gants", "tapis", "carpette", "moquette", "parquet", "stratifié", "carrelage", "lino", "papier", "peint", "peinture", "tableau", "cadre", "miroir", "horloge", "réveil", "lampe", "lampadaire", "suspension", "lustre", "applique", "spot", "ampoule", "led", "bougie", "parfumée", "diffuseur", "parfum", "ambiance", "huile", "essentielle", "encens", "photophore", "vase", "cache", "jardinière", "serre", "outils", "jardinage", "arrosoir", "tuyau", "arrosage", "tondeuse", "taille", "haie", "sécateur", "râteau", "pelle", "brouette", "composteur", "barbecue", "plancha", "salon", "jardin", "table", "chaise", "fauteuil", "banc", "hamac", "bain", "soleil", "parasol", "tonnelle", "store", "piscine", "spa", "jacuzzi", "sauna", "douche", "extérieure", "jeux", "extérieur", "balançoire", "toboggan", "trampoline", "vélo", "trottinette", "électrique", "skateboard", "roller", "camping", "tente", "sac", "couchage", "matelas", "gonflable", "réchaud", "glacière", "thermos", "randonnée", "sac", "dos", "gourde", "jumelles", "boussole", "appareil", "photo", "caméra", "objectif", "trépied", "drone", "sportive", "action", "gopro", "imprimante", "photo", "cadre", "numérique", "ordinateur", "portable", "tablette", "smartphone", "téléphone", "montre", "connectée", "enceinte", "casque", "écouteurs", "téléviseur", "cinéma", "projecteur", "console", "jeux", "vidéo", "livre", "roman", "biographie", "cuisine", "art", "voyage", "guide", "carte", "magazine", "revue", "journal", "abonnement", "voyage", "séjour", "week", "end", "croisière", "vol", "hôtel", "location", "gîte", "valise", "bagage", "sac", "voyage", "trousse", "toilette", "adaptateur", "guide", "voyage", "appareil", "jumelles", "boussole", "gps", "montre", "bijou", "collier", "bracelet", "bague", "boucles", "oreilles", "montre", "pendentif", "parfum", "coffret", "eau", "toilette", "cologne", "rasoir", "tondeuse", "épilateur", "sèche", "cheveux", "lisseur", "fer", "friser", "brosse", "chauffante", "cheveux", "peigne", "miroir", "trousse", "maquillage", "palette", "rouge", "lèvres", "mascara", "fond", "teint", "blush", "poudre", "vernis", "ongles", "kit", "manucure", "spa", "massage", "soins", "hammam", "être", "relaxation", "détente", "yoga", "pilates", "fitness", "sport", "salle", "cours", "coaching", "abonnement", "chèque", "carte", "bon", "coffret", "panier", "corbeille", "gourmande", "box", "cuisine", "vin", "être", "beauté", "voyage", "nuit", "insolite", "cours", "atelier", "dégustation", "spectacle", "concert", "théâtre", "opéra", "ballet", "cirque", "exposition", "musée", "visite", "guidée", "karting", "saut", "parachute", "élastique", "bungee", "baptême", "montgolfière", "simulateur", "réalité", "virtuelle", "escape", "game", "circuit", "rafting", "canyoning", "spéléologie", "plongée", "snorkeling", "équitation", "ski", "snowboard", "surf", "kitesurf", "windsurf", "voile", "kayak", "canoë", "croisière", "bateau", "catamaran", "yacht", "jet", "ski", "quad", "buggy", "moto", "vol", "hélicoptère", "avion", "ulm", "stage", "pilotage", "cuisine", "œnologie", "wine", "mixologie", "pâtisserie", "art", "photo", "séance", "shooting", "portrait", "photographie", "album", "cadre", "expérience", "activité", "découverte", "aventure", "sensation", "forte", "détente", "gastronomie", "dégustation", "vin", "champagne", "spiritueux", "bière", "repas", "gastronomique", "dîner", "restaurant", "table", "cours", "cuisine", "domicile", "chef", "album", "bijou", "montre", "accessoire", "vêtement", "sac", "chaussures", "chapeau", "foulard", "gants", "portefeuille", "lunettes", "soleil", "bague", "bracelet", "collier", "boucles", "pendentif", "diamant", "or", "argent", "perle", "pierre", "précieuse", "cristal", "fantasie", "artisanal", "gravé", "personnalisé"},
	},
}

// UpdateInspirationsCache génère le cache des inspirations basé sur le cache produits (optimisé)
func (sm *ScraperManager) UpdateInspirationsCache() {
	sm.cacheMu.RLock()
	// Vérifier si le cache produits est vide
	if len(sm.cache) == 0 {
		log.Warn().Msg("Cache produits vide, impossible de générer le cache inspirations")
		sm.cacheMu.RUnlock()
		return
	}
	// Créer une copie du cache produits pour éviter les problèmes de concurrence pendant l'itération
	productsCacheCopy := make(map[string][]Product)
	totalProducts := 0
	for k, v := range sm.cache {
		productsCacheCopy[k] = v
		totalProducts += len(v)
	}
	sm.cacheMu.RUnlock()

	log.Info().Int("totalProducts", totalProducts).Msg("Génération du cache inspirations à partir du cache produits...")

	// Map temporaire pour construire les inspirations
	inspirationsProductsMap := make(map[string][]Product)
	inspirationProductCount := make(map[string]int) // Compteur pour la limite par inspiration
	maxProductsPerInspiration := 30                 // Limiter le nombre de produits par inspiration

	// Itérer une seule fois sur tous les produits
	for _, products := range productsCacheCopy {
		for _, product := range products {
			lowerTitle := strings.ToLower(product.Title)
			lowerDesc := strings.ToLower(product.Description)

			// Itérer sur les définitions d'inspiration pour ce produit
			for inspID, inspDef := range inspirationDefinitions {
				// Vérifier si la limite pour cette inspiration est atteinte
				if count, ok := inspirationProductCount[inspID]; ok && count >= maxProductsPerInspiration {
					continue // Passer à l'inspiration suivante si la limite est atteinte
				}

				// Vérifier si un mot-clé correspond
				matchFound := false
				for _, keyword := range inspDef.Keywords {
					// Utiliser des vérifications plus rapides si possible (ex: présence directe)
					if strings.Contains(lowerTitle, keyword) || strings.Contains(lowerDesc, keyword) {
						matchFound = true
						break
					}
				}

				// Si correspondance trouvée, ajouter le produit à l'inspiration correspondante
				if matchFound {
					inspirationsProductsMap[inspID] = append(inspirationsProductsMap[inspID], product)
					inspirationProductCount[inspID]++ // Incrémenter le compteur
					// Important: On ne met PAS de 'break' ici pour permettre à un produit
					// d'appartenir potentiellement à plusieurs inspirations si les mots-clés correspondent,
					// mais la limite par inspiration s'appliquera toujours.
					// Si un produit ne doit appartenir qu'à UNE SEULE inspiration (la première trouvée),
					// décommentez le break ci-dessous et ajoutez la map processedProductIDs comme avant.
					// break
				}
			}
		}
	}

	// Construire le cache final à partir de la map temporaire
	newInspirationsCache := make(map[string]Inspiration)
	for inspID, products := range inspirationsProductsMap {
		if len(products) > 0 {
			inspDef := inspirationDefinitions[inspID] // Récupérer les détails de l'inspiration
			newInspirationsCache[inspID] = Inspiration{
				ID:       inspID,
				Name:     inspDef.Name,
				Image:    inspDef.Image,
				Products: products, // Utiliser directement les produits collectés
			}
			log.Info().Str("inspirationID", inspID).Int("productCount", len(products)).Msg("Inspiration ajoutée au cache")
		}
	}

	// Mettre à jour le cache inspirations en mémoire
	sm.inspirationsCacheMu.Lock()
	sm.inspirationsCache = newInspirationsCache
	// L'expiration est liée à celle du cache produits, mise à jour dans UpdateCache
	sm.inspirationsCacheExp = sm.cacheExp
	sm.inspirationsCacheMu.Unlock()

	// Sauvegarder le nouveau cache inspirations dans un fichier
	sm.saveInspirationsCacheToFile()

	log.Info().Int("inspirationsCount", len(newInspirationsCache)).Msg("Cache inspirations généré et sauvegardé")
}

// loadInspirationsCacheFromFile charge le cache des inspirations depuis un fichier
func (sm *ScraperManager) loadInspirationsCacheFromFile() {
	fileInfo, err := os.Stat(sm.inspirationsCacheFilePath)
	if os.IsNotExist(err) || fileInfo.Size() == 0 {
		log.Info().Msg("Fichier de cache inspirations non trouvé ou vide, sera généré lors de la prochaine mise à jour")
		// Pas besoin de forcer l'expiration ici, elle suivra celle du cache produits
		return
	}

	data, err := os.ReadFile(sm.inspirationsCacheFilePath)
	if err != nil {
		log.Error().Err(err).Msg("Impossible de lire le fichier de cache inspirations")
		return
	}

	if len(data) == 0 || strings.TrimSpace(string(data)) == "" {
		log.Warn().Msg("Fichier de cache inspirations vide ou ne contient que des espaces")
		return
	}

	var cacheData struct {
		LastUpdated  string                 `json:"lastUpdated"`
		Inspirations map[string]Inspiration `json:"inspirations"`
	}

	if err := json.Unmarshal(data, &cacheData); err != nil {
		log.Error().Err(err).Msg("Impossible de décoder le cache inspirations")
		// Sauvegarder le fichier corrompu
		backupFile := sm.inspirationsCacheFilePath + ".corrupted"
		os.WriteFile(backupFile, data, 0644)
		return
	}

	if len(cacheData.Inspirations) == 0 {
		log.Warn().Msg("Cache inspirations décodé vide")
		return
	}

	sm.inspirationsCacheMu.Lock()
	sm.inspirationsCache = cacheData.Inspirations
	// L'expiration sera définie lors du chargement du cache produits ou de sa mise à jour
	// Pour l'instant, on peut utiliser la date du fichier comme référence temporaire
	lastUpdated, err := time.Parse(time.RFC3339, cacheData.LastUpdated)
	if err == nil {
		sm.inspirationsCacheExp = lastUpdated.Add(72 * time.Hour) // Utiliser la même durée
	} else {
		sm.inspirationsCacheExp = time.Now().Add(-1 * time.Hour) // Forcer la vérification si date invalide
	}
	sm.inspirationsCacheMu.Unlock()

	log.Info().
		Str("lastUpdated", cacheData.LastUpdated).
		Int("inspirationsCount", len(cacheData.Inspirations)).
		Msg("Cache inspirations chargé depuis le fichier")
}

// saveInspirationsCacheToFile sauvegarde le cache des inspirations dans un fichier
func (sm *ScraperManager) saveInspirationsCacheToFile() {
	sm.inspirationsCacheMu.RLock()
	defer sm.inspirationsCacheMu.RUnlock()

	if len(sm.inspirationsCache) == 0 {
		log.Warn().Msg("Cache inspirations vide, aucune sauvegarde effectuée")
		return
	}

	cacheData := struct {
		LastUpdated  string                 `json:"lastUpdated"`
		Inspirations map[string]Inspiration `json:"inspirations"`
	}{
		LastUpdated:  time.Now().Format(time.RFC3339),
		Inspirations: sm.inspirationsCache,
	}

	// Utiliser json.MarshalIndent pour une meilleure lisibilité du fichier
	data, err := json.MarshalIndent(cacheData, "", "  ")
	if err != nil {
		log.Error().Err(err).Msg("Impossible d'encoder le cache inspirations")
		return
	}

	// Écriture atomique: écrire dans un fichier temporaire puis renommer
	tempFile := sm.inspirationsCacheFilePath + ".tmp"
	if err := os.WriteFile(tempFile, data, 0644); err != nil {
		log.Error().Err(err).Msg("Impossible d'écrire le fichier de cache inspirations temporaire")
		// Essayer de supprimer le fichier temporaire en cas d'erreur
		os.Remove(tempFile)
		return
	}

	// Renommer le fichier temporaire pour remplacer l'ancien (opération atomique sur la plupart des systèmes)
	if err := os.Rename(tempFile, sm.inspirationsCacheFilePath); err != nil {
		log.Error().Err(err).Msg("Impossible de renommer le fichier de cache inspirations temporaire")
		// Essayer de supprimer le fichier temporaire si le renommage échoue
		os.Remove(tempFile)
		return
	}

	log.Info().
		Int("inspirationsCount", len(sm.inspirationsCache)).
		Int("dataSize", len(data)).
		Msg("Cache inspirations sauvegardé dans le fichier")
}

// registerScrapers enregistre tous les scrapers de marques
func (sm *ScraperManager) registerScrapers() {
	// Amazon
	sm.scrapers["amazon"] = NewAmazonScraper()

	// Etsy - Plateforme e-commerce commentée
	// sm.scrapers["etsy"] = NewEtsyScraper()

	// Cdiscount - Plateforme e-commerce commentée
	// sm.scrapers["cdiscount"] = NewCdiscountScraper()

	// Shein - Plateforme e-commerce commentée
	// sm.scrapers["shein"] = NewSheinScraper()

	// Temu - Plateforme e-commerce commentée
	// sm.scrapers["temu"] = NewTemuScraper()

	// Wonderbox - Plateforme e-commerce commentée
	// sm.scrapers["wonderbox"] = NewWonderboxScraper()

	// Maisons du Monde
	sm.scrapers["maisons_du_monde"] = NewMaisonsDuMondeScraper()

	// Toys R Us - Plateforme e-commerce commentée
	// sm.scrapers["toys_r_us"] = NewToysRUsScraper()

	// Decathlon
	sm.scrapers["decathlon"] = NewDecathlonScraper()

	// Asos - Plateforme e-commerce commentée
	// sm.scrapers["asos"] = NewAsosScraper()

	// Lego
	sm.scrapers["lego"] = NewLegoScraper()

	// H&M
	sm.scrapers["h_and_m"] = NewHMScraper()

	// Nike
	sm.scrapers["nike"] = NewNikeScraper()

	// Uniqlo
	sm.scrapers["uniqlo"] = NewUniqloScraper()

	// Zara
	sm.scrapers["zara"] = NewZaraScraper()

	// Diesel
	sm.scrapers["diesel"] = NewDieselScraper()

	// Adidas
	sm.scrapers["adidas"] = NewAdidasScraper()

	// Zalando - Plateforme e-commerce commentée
	// sm.scrapers["zalando"] = NewZalandoScraper()

	// Sephora
	sm.scrapers["sephora"] = NewSephoraScraper()

	// Fnac - Plateforme e-commerce commentée
	// sm.scrapers["fnac"] = NewFnacScraper()

	// Yves Rocher
	sm.scrapers["yves_rocher"] = NewYvesRocherScraper()

	// Veepee - Plateforme e-commerce commentée
	// sm.scrapers["veepee"] = NewVeepeeScraper()

	// E. Leclerc - Plateforme e-commerce commentée
	// sm.scrapers["leclerc"] = NewLeclercScraper()

	// Ikea
	sm.scrapers["ikea"] = NewIkeaScraper()

	// Mano Mano - Plateforme e-commerce commentée
	// sm.scrapers["mano_mano"] = NewManoManoScraper()

	// Leroy Merlin - Plateforme e-commerce commentée
	// sm.scrapers["leroy_merlin"] = NewLeroyMerlinScraper()

	// Darty - Plateforme e-commerce commentée
	// sm.scrapers["darty"] = NewDartyScraper()

	// Citadium - Plateforme e-commerce commentée
	// sm.scrapers["citadium"] = NewCitadiumScraper()

	// Rakuten - Plateforme e-commerce commentée
	// sm.scrapers["rakuten"] = NewRakutenScraper()

	// Samsung
	sm.scrapers["samsung"] = NewSamsungScraper()

	// Timberland
	sm.scrapers["timberland"] = NewTimberlandScraper()

	// Printemps Paris - Plateforme e-commerce commentée
	// sm.scrapers["printemps"] = NewPrintempsScraper()

	// Ebay - Plateforme e-commerce commentée
	// sm.scrapers["ebay"] = NewEbayScraper()

	// Booking - Plateforme e-commerce commentée
	// sm.scrapers["booking"] = NewBookingScraper()

	// Carrefour - Plateforme e-commerce commentée
	// sm.scrapers["carrefour"] = NewCarrefourScraper()

	// Aliexpress - Plateforme e-commerce commentée
	// sm.scrapers["aliexpress"] = NewAliexpressScraper()

	// Auchan - Plateforme e-commerce commentée
	// sm.scrapers["auchan"] = NewAuchanScraper()

	// Lidl - Plateforme e-commerce commentée
	// sm.scrapers["lidl"] = NewLidlScraper()

	// Coursera - Plateforme e-commerce commentée
	// sm.scrapers["coursera"] = NewCourseraScraper()

	// Udemy - Plateforme e-commerce commentée
	// sm.scrapers["udemy"] = NewUdemyScraper()

	// Schleich
	sm.scrapers["schleich"] = NewSchleichScraper()

	// King Jouet
	sm.scrapers["king_jouet"] = NewKingJouetScraper()

	// Apple
	sm.scrapers["apple"] = NewAppleScraper()
}

// GetProductsByBrand récupère les produits d'une marque spécifique
func (sm *ScraperManager) GetProductsByBrand(brandID string) ([]Product, error) {
	sm.cacheMu.RLock()
	// Vérifier si les données sont en cache
	cachedProducts, cacheExists := sm.cache[brandID]
	cacheValid := time.Now().Before(sm.cacheExp)

	// Vérifier si le cache contient des produits
	hasProducts := cacheExists && len(cachedProducts) > 0

	// Si le cache est valide et contient des produits, l'utiliser
	if hasProducts && cacheValid {
		sm.cacheMu.RUnlock()
		log.Debug().
			Str("brandID", brandID).
			Int("productCount", len(cachedProducts)).
			Time("cacheExpiration", sm.cacheExp).
			Msg("Produits récupérés depuis le cache valide")
		return cachedProducts, nil
	}

	// Si le cache existe mais est expiré ou vide, noter l'état
	if cacheExists {
		if !cacheValid {
			log.Info().
				Str("brandID", brandID).
				Int("productCount", len(cachedProducts)).
				Time("cacheExpiration", sm.cacheExp).
				Msg("Cache expiré, récupération des produits")
		} else if !hasProducts {
			log.Info().
				Str("brandID", brandID).
				Msg("Cache vide, récupération des produits")
		}
	} else {
		log.Info().
			Str("brandID", brandID).
			Msg("Cache non trouvé, récupération des produits")
	}

	sm.cacheMu.RUnlock()

	// Si le scraper existe pour cette marque
	if scraper, ok := sm.scrapers[brandID]; ok {
		products, err := scraper.GetProducts()
		if err != nil {
			log.Error().Err(err).Str("brandID", brandID).Msg("Erreur lors de la récupération des produits")

			// Essayer de récupérer les produits depuis le cache même s'il est expiré ou vide
			sm.cacheMu.RLock()
			if cachedProducts, ok := sm.cache[brandID]; ok {
				sm.cacheMu.RUnlock()
				if len(cachedProducts) > 0 {
					log.Warn().
						Str("brandID", brandID).
						Int("productCount", len(cachedProducts)).
						Time("cacheExpiration", sm.cacheExp).
						Msg("Utilisation du cache expiré suite à une erreur")
					return cachedProducts, nil
				} else {
					log.Warn().
						Str("brandID", brandID).
						Msg("Cache vide et erreur lors de la récupération des produits")
				}
			} else {
				sm.cacheMu.RUnlock()
				log.Warn().
					Str("brandID", brandID).
					Msg("Cache non trouvé et erreur lors de la récupération des produits")
			}

			// Si aucun produit ne peut être récupéré, retourner un tableau vide avec l'erreur
			// pour que le frontend puisse afficher un message approprié
			return []Product{}, err
		}

		// Filtrer les produits sans marque et organiser les produits par marque
		var filteredProducts []Product
		var amazonProducts []Product

		// Récupérer le nom de la marque pour la comparaison
		var brandName string
		if genericScraper, ok := scraper.(*GenericScraper); ok {
			brandName = genericScraper.BrandName
		} else {
			brandName = strings.ToUpper(brandID[:1]) + brandID[1:]
		}

		for _, product := range products {
			// Supprimer les produits sans marque
			if product.Brand == "" {
				continue
			}

			// Vérifier si la marque correspond au brandID demandé
			if strings.EqualFold(product.Brand, brandID) || strings.EqualFold(product.Brand, brandName) {
				// Normaliser la marque pour qu'elle corresponde exactement au brandID
				product.Brand = brandID
				filteredProducts = append(filteredProducts, product)
			} else {
				// Si la marque est différente, placer le produit dans "amazon"
				// Conserver la marque originale
				amazonProducts = append(amazonProducts, product)
			}
		}

		// Vérifier si des produits ont été récupérés après filtrage
		if len(filteredProducts) == 0 {
			log.Warn().
				Str("brandID", brandID).
				Msg("Aucun produit avec marque correspondante récupéré depuis l'API")

			// Si le cache existe et contient des produits, l'utiliser même s'il est expiré
			sm.cacheMu.RLock()
			if cachedProducts, ok := sm.cache[brandID]; ok && len(cachedProducts) > 0 {
				sm.cacheMu.RUnlock()
				log.Info().
					Str("brandID", brandID).
					Int("productCount", len(cachedProducts)).
					Msg("Utilisation du cache existant car aucun produit avec marque correspondante récupéré depuis l'API")
				return cachedProducts, nil
			}
			sm.cacheMu.RUnlock()

			// Si aucun produit n'est trouvé, retourner un tableau vide (pas d'erreur)
			return []Product{}, nil
		} else {
			log.Info().
				Str("brandID", brandID).
				Int("productCount", len(filteredProducts)).
				Int("filteredOut", len(products)-len(filteredProducts)).
				Msg("Produits avec marque correspondante récupérés depuis l'API")
		}

		// Récupérer les produits existants pour comparer et identifier les nouveaux
		sm.cacheMu.RLock()
		existingProducts, exists := sm.cache[brandID]
		sm.cacheMu.RUnlock()

		// Créer une map des produits existants pour une recherche rapide
		existingProductMap := make(map[string]Product)
		if exists {
			for _, p := range existingProducts {
				existingProductMap[p.ID] = p
			}
		}

		// Marquer les nouveaux produits et conserver les dates d'ajout des produits existants
		currentDate := time.Now().Format(time.RFC3339)
		for i := range filteredProducts {
			existingProduct, productExists := existingProductMap[filteredProducts[i].ID]

			if !productExists {
				// Nouveau produit: marquer comme nouveau et ajouter la date
				filteredProducts[i].IsNew = true
				filteredProducts[i].AddedDate = currentDate
				log.Debug().
					Str("productID", filteredProducts[i].ID).
					Str("addedDate", currentDate).
					Msg("Nouveau produit ajouté et marqué comme nouveau")
			} else {
				// Produit existant: conserver la date d'ajout et mettre à jour isNew
				// Si le produit était déjà marqué comme nouveau, le conserver comme tel
				filteredProducts[i].AddedDate = existingProduct.AddedDate

				// Si le produit est mis à jour, retirer le statut isNew
				if existingProduct.IsNew && (filteredProducts[i].Title != existingProduct.Title ||
					filteredProducts[i].Price != existingProduct.Price ||
					filteredProducts[i].Description != existingProduct.Description) {
					filteredProducts[i].IsNew = false
					log.Debug().
						Str("productID", filteredProducts[i].ID).
						Msg("Produit existant mis à jour, statut 'nouveau' retiré")
				} else {
					// Sinon, conserver le statut isNew
					filteredProducts[i].IsNew = existingProduct.IsNew
				}
			}
		}

		// Mettre en cache les résultats filtrés
		sm.cacheMu.Lock()
		sm.cache[brandID] = filteredProducts
		sm.cacheExp = time.Now().Add(72 * time.Hour) // Cache valide pendant 72 heures

		// Ajouter les produits avec marque différente à "amazon"
		if len(amazonProducts) > 0 {
			existingAmazonProducts, exists := sm.cache["amazon"]
			if exists {
				// Fusionner avec les produits Amazon existants
				amazonProductMap := make(map[string]Product)

				// D'abord ajouter les produits existants
				for _, p := range existingAmazonProducts {
					amazonProductMap[p.ID] = p
				}

				// Ensuite ajouter les nouveaux produits
				for _, p := range amazonProducts {
					amazonProductMap[p.ID] = p
				}

				// Reconvertir la map en slice
				var mergedAmazonProducts []Product
				for _, p := range amazonProductMap {
					mergedAmazonProducts = append(mergedAmazonProducts, p)
				}

				sm.cache["amazon"] = mergedAmazonProducts
			} else {
				sm.cache["amazon"] = amazonProducts
			}

			log.Info().
				Int("amazonProductCount", len(amazonProducts)).
				Msg("Produits avec marque différente ajoutés à 'amazon'")
		}

		sm.cacheMu.Unlock()

		// Sauvegarder le cache dans un fichier
		go sm.saveCacheToFile()

		log.Info().
			Str("brandID", brandID).
			Int("productCount", len(filteredProducts)).
			Time("cacheExpiration", sm.cacheExp).
			Msg("Produits avec marque mis en cache")

		return filteredProducts, nil
	}

	// Si la marque n'est pas supportée (aucun scraper spécifique trouvé)
	log.Warn().Str("brandID", brandID).Msg("Aucun scraper spécifique trouvé pour cette marque. Retour du cache (même si expiré) ou d'une liste vide.")
	// Essayer de retourner depuis le cache même s'il est expiré
	sm.cacheMu.RLock()
	cachedProducts, exists := sm.cache[brandID]
	sm.cacheMu.RUnlock()
	if exists {
		return cachedProducts, nil // Retourner le cache existant (potentiellement expiré)
	}
	// Si pas dans le cache, retourner une liste vide sans erreur
	return []Product{}, nil
}

// GetNewProductsByBrand récupère les nouveaux produits d'une marque spécifique
func (sm *ScraperManager) GetNewProductsByBrand(brandID string) ([]Product, error) {
	sm.cacheMu.RLock()
	// Vérifier si les données sont en cache et si le cache est encore valide
	if products, ok := sm.cache[brandID]; ok && time.Now().Before(sm.cacheExp) {
		// Filtrer pour ne retourner que les produits marqués comme nouveaux
		var newProducts []Product
		for _, product := range products {
			if product.IsNew {
				newProducts = append(newProducts, product)
			}
		}
		sm.cacheMu.RUnlock()
		log.Debug().Str("brandID", brandID).Int("productCount", len(newProducts)).Msg("Nouveaux produits récupérés depuis le cache")
		return newProducts, nil
	}
	sm.cacheMu.RUnlock()

	log.Info().Str("brandID", brandID).Msg("Cache expiré ou non trouvé, récupération des produits")

	// Si le scraper existe pour cette marque
	if scraper, ok := sm.scrapers[brandID]; ok {
		// Récupérer tous les produits
		products, err := scraper.GetProducts()
		if err != nil {
			log.Error().Err(err).Str("brandID", brandID).Msg("Erreur lors de la récupération des produits")
			return []Product{}, err
		}

		// Commenté pour limiter le nombre de requêtes à exactement 17 (une par marque valide)
		/*
			// Récupérer également les produits spécifiquement marqués comme nouveaux
			newProductsFromAPI, err := scraper.GetNewProducts()
			if err != nil {
				log.Warn().Err(err).Str("brandID", brandID).Msg("Erreur lors de la récupération des nouveaux produits, utilisation des produits standards uniquement")
			} else {
				// Ajouter les nouveaux produits à la liste
				products = append(products, newProductsFromAPI...)
			}
		*/

		// Nous utilisons uniquement les produits standards pour réduire le nombre de requêtes
		log.Info().Str("brandID", brandID).Msg("Utilisation uniquement des produits standards pour réduire le nombre de requêtes")

		// Filtrer les produits sans marque et organiser les produits par marque
		var filteredProducts []Product
		var amazonProducts []Product

		// Récupérer le nom de la marque pour la comparaison
		var brandName string
		if genericScraper, ok := scraper.(*GenericScraper); ok {
			brandName = genericScraper.BrandName
		} else {
			brandName = strings.ToUpper(brandID[:1]) + brandID[1:]
		}

		for _, product := range products {
			// Supprimer les produits sans marque
			if product.Brand == "" {
				continue
			}

			// Vérifier si la marque correspond au brandID demandé
			if strings.EqualFold(product.Brand, brandID) || strings.EqualFold(product.Brand, brandName) {
				// Normaliser la marque pour qu'elle corresponde exactement au brandID
				product.Brand = brandID
				filteredProducts = append(filteredProducts, product)
			} else {
				// Si la marque est différente, placer le produit dans "amazon"
				// Conserver la marque originale
				amazonProducts = append(amazonProducts, product)
			}
		}

		// Vérifier si des produits ont été récupérés après filtrage
		if len(filteredProducts) == 0 {
			log.Warn().Str("brandID", brandID).Msg("Aucun produit avec marque correspondante récupéré depuis l'API")
			return []Product{}, nil
		}

		// Ajouter les produits avec marque différente à "amazon"
		if len(amazonProducts) > 0 {
			sm.cacheMu.Lock()
			existingAmazonProducts, exists := sm.cache["amazon"]
			if exists {
				// Fusionner avec les produits Amazon existants
				amazonProductMap := make(map[string]Product)

				// D'abord ajouter les produits existants
				for _, p := range existingAmazonProducts {
					amazonProductMap[p.ID] = p
				}

				// Ensuite ajouter les nouveaux produits
				for _, p := range amazonProducts {
					amazonProductMap[p.ID] = p
				}

				// Reconvertir la map en slice
				var mergedAmazonProducts []Product
				for _, p := range amazonProductMap {
					mergedAmazonProducts = append(mergedAmazonProducts, p)
				}

				sm.cache["amazon"] = mergedAmazonProducts
			} else {
				sm.cache["amazon"] = amazonProducts
			}
			sm.cacheMu.Unlock()

			log.Info().
				Int("amazonProductCount", len(amazonProducts)).
				Msg("Produits avec marque différente ajoutés à 'amazon'")
		}

		// Comparer avec le cache précédent pour identifier les nouveaux produits
		sm.cacheMu.RLock()
		previousProducts, hasPreviousCache := sm.cache[brandID]
		sm.cacheMu.RUnlock()

		// Créer une map des produits précédents pour une recherche rapide
		previousProductMap := make(map[string]Product)
		if hasPreviousCache {
			for _, p := range previousProducts {
				previousProductMap[p.ID] = p
			}
		}

		// Marquer les produits qui n'existaient pas dans le cache précédent comme nouveaux
		currentDate := time.Now().Format(time.RFC3339)
		for i := range filteredProducts {
			existingProduct, productExists := previousProductMap[filteredProducts[i].ID]

			if !productExists {
				// Si le produit n'existait pas avant, le marquer comme nouveau et ajouter la date
				filteredProducts[i].IsNew = true
				filteredProducts[i].AddedDate = currentDate
				log.Debug().
					Str("productID", filteredProducts[i].ID).
					Str("addedDate", currentDate).
					Msg("Produit marqué comme nouveau car non présent dans le cache précédent")
			} else {
				// Produit existant: conserver la date d'ajout et mettre à jour isNew
				filteredProducts[i].AddedDate = existingProduct.AddedDate

				// Si le produit est mis à jour, retirer le statut isNew
				if existingProduct.IsNew && (filteredProducts[i].Title != existingProduct.Title ||
					filteredProducts[i].Price != existingProduct.Price ||
					filteredProducts[i].Description != existingProduct.Description) {
					filteredProducts[i].IsNew = false
					log.Debug().
						Str("productID", filteredProducts[i].ID).
						Msg("Produit existant mis à jour, statut 'nouveau' retiré")
				} else {
					// Sinon, conserver le statut isNew
					filteredProducts[i].IsNew = existingProduct.IsNew
				}
			}
		}

		// Filtrer pour ne retourner que les produits marqués comme nouveaux
		var newProducts []Product
		for _, product := range filteredProducts {
			if product.IsNew {
				newProducts = append(newProducts, product)
			}
		}

		log.Info().
			Str("brandID", brandID).
			Int("totalProducts", len(filteredProducts)).
			Int("newProducts", len(newProducts)).
			Msg("Produits récupérés et nouveaux produits identifiés")

		return newProducts, nil
	}

	// Si la marque n'est pas supportée, utiliser le scraper générique
	products, err := sm.getFallbackProducts(brandID)
	if err != nil {
		return []Product{}, err
	}

	// Filtrer pour ne retourner que les produits marqués comme nouveaux
	var newProducts []Product
	for _, product := range products {
		if product.IsNew {
			newProducts = append(newProducts, product)
		}
	}

	return newProducts, nil
}

// GetProductsByInspiration récupère les produits correspondant à une inspiration
func (sm *ScraperManager) GetProductsByInspiration(inspiration string) ([]Product, error) {
	cacheKey := "inspiration_" + inspiration

	sm.cacheMu.RLock()
	// Vérifier si les données sont en cache et si le cache est encore valide
	if products, ok := sm.cache[cacheKey]; ok && time.Now().Before(sm.cacheExp) {
		sm.cacheMu.RUnlock()
		log.Debug().Str("inspiration", inspiration).Int("productCount", len(products)).Msg("Produits d'inspiration récupérés depuis le cache")
		return products, nil
	}
	sm.cacheMu.RUnlock()

	log.Info().Str("inspiration", inspiration).Msg("Cache expiré ou non trouvé, récupération des produits d'inspiration")

	// Récupérer les produits correspondant à l'inspiration
	products, err := sm.getInspirationProducts(inspiration)
	if err != nil {
		log.Error().Err(err).Str("inspiration", inspiration).Msg("Erreur lors de la récupération des produits d'inspiration")

		// Essayer de récupérer les produits depuis le cache même s'il est expiré
		sm.cacheMu.RLock()
		if cachedProducts, ok := sm.cache[cacheKey]; ok {
			sm.cacheMu.RUnlock()
			log.Warn().Str("inspiration", inspiration).Msg("Utilisation du cache expiré suite à une erreur")
			return cachedProducts, nil
		}
		sm.cacheMu.RUnlock()

		// Si aucun produit ne peut être récupéré, retourner un tableau vide avec l'erreur
		return []Product{}, err
	}

	// Filtrer les produits sans marque
	var filteredProducts []Product
	for _, product := range products {
		if product.Brand != "" {
			filteredProducts = append(filteredProducts, product)
		}
	}

	// Vérifier si des produits ont été récupérés après filtrage
	if len(filteredProducts) == 0 {
		log.Warn().
			Str("inspiration", inspiration).
			Int("beforeFiltering", len(products)).
			Msg("Aucun produit d'inspiration avec marque récupéré")

		// Si le cache existe et contient des produits, l'utiliser même s'il est expiré
		sm.cacheMu.RLock()
		if cachedProducts, ok := sm.cache[cacheKey]; ok && len(cachedProducts) > 0 {
			sm.cacheMu.RUnlock()
			log.Info().
				Str("inspiration", inspiration).
				Int("productCount", len(cachedProducts)).
				Msg("Utilisation du cache existant car aucun produit d'inspiration avec marque récupéré")
			return cachedProducts, nil
		}
		sm.cacheMu.RUnlock()

		// Si aucun produit n'est trouvé après filtrage des marques pertinentes, retourner une liste vide.
		// NE PAS appeler getFallbackInspirationProducts ici.
		log.Warn().Str("inspiration", inspiration).Msg("Aucun produit trouvé pour cette inspiration après filtrage des marques pertinentes. Retour d'une liste vide.")
		return []Product{}, nil
	}

	log.Info().
		Str("inspiration", inspiration).
		Int("beforeFiltering", len(products)).
		Int("afterFiltering", len(filteredProducts)).
		Msg("Produits d'inspiration avec marque récupérés")

	// Mettre en cache les résultats filtrés
	sm.cacheMu.Lock()
	sm.cache[cacheKey] = filteredProducts
	sm.cacheExp = time.Now().Add(72 * time.Hour) // Cache valide pendant 72 heures
	sm.cacheMu.Unlock()

	// Sauvegarder le cache dans un fichier
	go sm.saveCacheToFile()

	log.Info().Str("inspiration", inspiration).Int("productCount", len(filteredProducts)).Msg("Produits d'inspiration avec marque mis en cache")

	return filteredProducts, nil
}

// getFallbackProducts récupère des produits génériques pour une marque
func (sm *ScraperManager) getFallbackProducts(brandID string) ([]Product, error) {
	// Créer un client Canopy pour récupérer des produits
	canopyClient := NewCanopyClient("2ea2fa43-aec8-4963-8c08-1b51191e81f8")

	// Utiliser le nom de la marque comme mot-clé de recherche
	brandName := strings.ToUpper(brandID[:1]) + brandID[1:]

	log.Info().
		Str("brandID", brandID).
		Str("brandName", brandName).
		Msg("Utilisation de Canopy pour récupérer des produits génériques")

	// Récupérer 30 produits depuis Canopy pour avoir suffisamment de produits après filtrage
	// tout en maintenant des performances optimales
	products, err := canopyClient.GetAmazonProductsByKeyword(brandName, 30)
	if err != nil {
		log.Error().
			Err(err).
			Str("brandID", brandID).
			Str("brandName", brandName).
			Msg("Erreur lors de la récupération des produits génériques depuis Canopy")

		// Retourner un tableau vide avec l'erreur
		return []Product{}, err
	}

	// Mettre à jour les informations de marque pour s'assurer qu'elles sont correctes
	// et filtrer les produits sans marque
	var filteredProducts []Product
	for i := range products {
		products[i].Brand = brandName // Assurer que tous les produits ont la bonne marque
		filteredProducts = append(filteredProducts, products[i])
	}

	// Si aucun produit n'a été trouvé après filtrage, simplement retourner un tableau vide
	if len(filteredProducts) == 0 {
		log.Warn().
			Str("brandID", brandID).
			Str("brandName", brandName).
			Msg("Aucun produit trouvé pour cette marque")
		return []Product{}, nil
	}

	log.Info().
		Str("brandID", brandID).
		Str("brandName", brandName).
		Int("productCount", len(filteredProducts)).
		Msg("Produits génériques récupérés avec marque")

	return filteredProducts, nil
}

// getFallbackNewProducts récupère des nouveaux produits génériques pour une marque
// Cette fonction est maintenue pour compatibilité mais n'est plus utilisée directement
func (sm *ScraperManager) getFallbackNewProducts(brandID string) ([]Product, error) {
	// Créer un client Canopy pour récupérer des produits
	canopyClient := NewCanopyClient("2ea2fa43-aec8-4963-8c08-1b51191e81f8")

	// Utiliser le nom de la marque comme mot-clé de recherche
	brandName := strings.ToUpper(brandID[:1]) + brandID[1:]

	log.Info().
		Str("brandID", brandID).
		Str("brandName", brandName).
		Msg("Utilisation de Canopy pour récupérer des nouveaux produits génériques")

	// Récupérer 30 produits depuis Canopy avec "new" dans la recherche pour avoir suffisamment de produits après filtrage
	// tout en maintenant des performances optimales
	products, err := canopyClient.GetAmazonProductsByKeyword("new "+brandName, 30)
	if err != nil {
		log.Error().
			Err(err).
			Str("brandID", brandID).
			Str("brandName", brandName).
			Msg("Erreur lors de la récupération des nouveaux produits génériques depuis Canopy")

		// Retourner un tableau vide avec l'erreur
		return []Product{}, err
	}

	// Marquer tous les produits comme nouveaux et filtrer ceux sans marque
	var filteredProducts []Product
	for i := range products {
		products[i].IsNew = true
		products[i].Brand = brandName // Assurer que la marque est correcte
		filteredProducts = append(filteredProducts, products[i])
	}

	// Si aucun produit n'a été trouvé après filtrage, simplement retourner un tableau vide
	if len(filteredProducts) == 0 {
		log.Warn().
			Str("brandID", brandID).
			Str("brandName", brandName).
			Msg("Aucun nouveau produit trouvé pour cette marque")
		return []Product{}, nil
	}

	log.Info().
		Str("brandID", brandID).
		Str("brandName", brandName).
		Int("productCount", len(filteredProducts)).
		Msg("Nouveaux produits génériques récupérés avec marque")

	return filteredProducts, nil
}

// GetCachedProducts récupère les produits d'une marque UNIQUEMENT depuis le cache
func (sm *ScraperManager) GetCachedProducts(brandID string) ([]Product, bool) {
	sm.cacheMu.RLock()
	defer sm.cacheMu.RUnlock()
	products, exists := sm.cache[brandID]
	if !exists {
		// Retourner nil et false si la marque n'est pas dans le cache
		return nil, false
	}
	// Retourner une copie pour éviter les modifications concurrentes si nécessaire,
	// mais pour une simple lecture, retourner directement est souvent suffisant.
	// Si des modifications sont possibles ailleurs pendant la lecture, une copie est plus sûre.
	// productsCopy := make([]Product, len(products))
	// copy(productsCopy, products)
	// return productsCopy, true
	return products, true
}

// getInspirationProducts récupère des produits correspondant à une inspiration
func (sm *ScraperManager) getInspirationProducts(inspiration string) ([]Product, error) {
	// Récupérer des produits de différentes marques en fonction de l'inspiration
	var products []Product
	var relevantBrands []string

	// Trier les marques par ordre alphabétique pour assurer une récupération cohérente
	switch inspiration {
	case "christmas":
		relevantBrands = []string{"amazon", "fnac", "king_jouet", "lego", "toys_r_us"}
	case "valentine":
		relevantBrands = []string{"h_and_m", "sephora", "wonderbox", "yves_rocher", "zara"}
	case "girl_birthday":
		relevantBrands = []string{"h_and_m", "king_jouet", "sephora", "toys_r_us", "wonderbox"}
	case "boy_birthday":
		relevantBrands = []string{"adidas", "king_jouet", "lego", "nike", "toys_r_us"}
	case "wedding":
		relevantBrands = []string{"ikea", "maisons_du_monde", "printemps", "wonderbox", "zalando"}
	case "baby_shower":
		relevantBrands = []string{"amazon", "h_and_m", "king_jouet", "maisons_du_monde", "toys_r_us"}
	case "mothers_day":
		relevantBrands = []string{"fnac", "maisons_du_monde", "sephora", "wonderbox", "yves_rocher"}
	case "fathers_day":
		relevantBrands = []string{"adidas", "fnac", "leroy_merlin", "nike", "wonderbox"}
	default:
		relevantBrands = []string{"amazon", "carrefour", "cdiscount", "fnac", "zalando"}
	}

	// S'assurer que Apple est inclus dans les marques pertinentes si ce n'est pas déjà le cas
	if !contains(relevantBrands, "apple") {
		// Ajouter Apple à la fin de la liste
		relevantBrands = append(relevantBrands, "apple")
	}

	// Récupérer quelques produits de chaque marque pertinente
	for _, brand := range relevantBrands {
		if scraper, ok := sm.scrapers[brand]; ok {
			brandProducts, err := scraper.GetProducts()
			if err != nil {
				continue
			}

			// Filtrer les produits sans marque
			var filteredProducts []Product
			for _, product := range brandProducts {
				if product.Brand != "" {
					filteredProducts = append(filteredProducts, product)
				}
			}

			// Prendre les 3 premiers produits avec marque de chaque marque (limité)
			count := 0
			for _, p := range filteredProducts {
				if count >= 3 {
					break
				}
				products = append(products, p)
				count++
			}
		}
	}

	// Si aucun produit n'a été trouvé via les marques pertinentes
	if len(products) == 0 {
		log.Warn().Str("inspiration", inspiration).Msg("Aucun produit trouvé pour cette inspiration via les marques pertinentes. Retour d'une liste vide.")
		// Ne pas appeler getFallbackInspirationProducts pour éviter l'appel à Canopy
		return []Product{}, nil
	}

	// Adapter le titre des produits en fonction de l'inspiration, de la langue et de la marque
	for i := range products {
		// Déterminer si le titre est principalement en français ou en anglais
		isFrench := detectFrenchLanguage(products[i].Title)

		// Obtenir le préfixe adapté en fonction de l'inspiration et de la langue
		prefix := getInspirationPrefix(inspiration, isFrench, products[i].Brand)

		// Ajouter le préfixe au titre
		products[i].Title = prefix + products[i].Title
	}

	return products, nil
}

// contains vérifie si une chaîne est présente dans un tableau de chaînes
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// getFallbackInspirationProducts récupère des produits génériques pour une inspiration
func (sm *ScraperManager) getFallbackInspirationProducts(inspiration string) ([]Product, error) {
	// Créer un client Canopy pour récupérer des produits
	canopyClient := NewCanopyClient("2ea2fa43-aec8-4963-8c08-1b51191e81f8")

	// Déterminer le mot-clé de recherche en fonction de l'inspiration
	var searchTerm string
	switch inspiration {
	case "christmas":
		searchTerm = "christmas gift"
	case "valentine":
		searchTerm = "valentine gift"
	case "girl_birthday":
		searchTerm = "girl birthday gift"
	case "boy_birthday":
		searchTerm = "boy birthday gift"
	case "wedding":
		searchTerm = "wedding gift"
	case "baby_shower":
		searchTerm = "baby shower gift"
	case "mothers_day":
		searchTerm = "mother's day gift"
	case "fathers_day":
		searchTerm = "father's day gift"
	default:
		searchTerm = "popular gift"
	}

	log.Info().
		Str("inspiration", inspiration).
		Str("searchTerm", searchTerm).
		Msg("Utilisation de Canopy pour récupérer des produits d'inspiration")

	// Récupérer 30 produits depuis Canopy pour avoir suffisamment de produits après filtrage
	// tout en maintenant des performances optimales
	products, err := canopyClient.GetAmazonProductsByKeyword(searchTerm, 30)
	if err != nil {
		log.Error().
			Err(err).
			Str("inspiration", inspiration).
			Str("searchTerm", searchTerm).
			Msg("Erreur lors de la récupération des produits d'inspiration depuis Canopy")

		// Retourner un tableau vide avec l'erreur
		return []Product{}, err
	}

	// Filtrer les produits sans marque
	var filteredProducts []Product
	for _, product := range products {
		if product.Brand != "" {
			filteredProducts = append(filteredProducts, product)
		}
	}

	// Si aucun produit n'a été trouvé après filtrage, simplement retourner un tableau vide
	if len(filteredProducts) == 0 {
		log.Warn().
			Str("inspiration", inspiration).
			Str("searchTerm", searchTerm).
			Int("totalProductsBeforeFiltering", len(products)).
			Msg("Aucun produit d'inspiration avec marque trouvé")
		return []Product{}, nil
	}

	log.Info().
		Str("inspiration", inspiration).
		Int("totalProductsBeforeFiltering", len(products)).
		Int("totalProductsAfterFiltering", len(filteredProducts)).
		Msg("Produits d'inspiration filtrés")

	// Limiter à 15 produits maximum après filtrage
	if len(filteredProducts) > 15 {
		filteredProducts = filteredProducts[:15]
	}

	// Adapter le titre des produits en fonction de l'inspiration, de la langue et de la marque
	for i := range filteredProducts {
		// Déterminer si le titre est principalement en français ou en anglais
		isFrench := detectFrenchLanguage(filteredProducts[i].Title)

		// Obtenir le préfixe adapté en fonction de l'inspiration et de la langue
		prefix := getInspirationPrefix(inspiration, isFrench, filteredProducts[i].Brand)

		// Ajouter le préfixe au titre
		filteredProducts[i].Title = prefix + filteredProducts[i].Title
	}

	return filteredProducts, nil
}

// detectFrenchLanguage détermine si un texte est principalement en français
func detectFrenchLanguage(text string) bool {
	// Liste de mots français courants pour la détection
	frenchWords := []string{
		"cadeau", "pour", "avec", "et", "les", "des", "un", "une", "le", "la", "de", "du", "au", "aux",
		"noël", "anniversaire", "fête", "mariage", "bébé", "mère", "père", "saint", "valentin",
		"garçon", "fille", "enfant", "homme", "femme", "jouet", "jeu", "livre", "vêtement", "bijou",
	}

	// Liste de mots anglais courants pour la détection
	englishWords := []string{
		"gift", "for", "with", "and", "the", "of", "a", "an", "to", "in", "on", "at",
		"christmas", "birthday", "valentine", "wedding", "baby", "mother", "father", "day",
		"boy", "girl", "child", "man", "woman", "toy", "game", "book", "clothing", "jewelry",
	}

	// Convertir le texte en minuscules pour une comparaison insensible à la casse
	lowerText := strings.ToLower(text)

	// Compter les occurrences de mots français et anglais
	frenchCount := 0
	englishCount := 0

	for _, word := range frenchWords {
		if strings.Contains(lowerText, word) {
			frenchCount++
		}
	}

	for _, word := range englishWords {
		if strings.Contains(lowerText, word) {
			englishCount++
		}
	}

	// Si plus de mots français que de mots anglais, considérer comme français
	return frenchCount >= englishCount
}

// getInspirationPrefix retourne le préfixe approprié en fonction de l'inspiration, de la langue et de la marque
func getInspirationPrefix(inspiration string, isFrench bool, brand string) string {
	// Préfixes par défaut en français
	frenchPrefixes := map[string]string{
		"christmas":     "Cadeau de Noël - ",
		"valentine":     "Cadeau Saint Valentin - ",
		"girl_birthday": "Cadeau Anniversaire Fille - ",
		"boy_birthday":  "Cadeau Anniversaire Garçon - ",
		"wedding":       "Cadeau Mariage - ",
		"baby_shower":   "Cadeau Baby Shower - ",
		"mothers_day":   "Cadeau Fête des Mères - ",
		"fathers_day":   "Cadeau Fête des Pères - ",
	}

	// Préfixes en anglais
	englishPrefixes := map[string]string{
		"christmas":     "Christmas Gift - ",
		"valentine":     "Valentine's Day Gift - ",
		"girl_birthday": "Girl Birthday Gift - ",
		"boy_birthday":  "Boy Birthday Gift - ",
		"wedding":       "Wedding Gift - ",
		"baby_shower":   "Baby Shower Gift - ",
		"mothers_day":   "Mother's Day Gift - ",
		"fathers_day":   "Father's Day Gift - ",
	}

	// Préfixes spécifiques par marque (pour certaines marques populaires)
	brandSpecificPrefixes := map[string]map[string]string{
		"lego": {
			"christmas":     "LEGO Cadeau de Noël - ",
			"boy_birthday":  "LEGO Cadeau Anniversaire - ",
			"girl_birthday": "LEGO Cadeau Anniversaire - ",
		},
		"apple": {
			"christmas":   "Apple Cadeau High-Tech - ",
			"fathers_day": "Apple Cadeau Tech - ",
			"mothers_day": "Apple Cadeau Tech - ",
		},
		"sephora": {
			"valentine":   "Sephora Cadeau Beauté - ",
			"mothers_day": "Sephora Cadeau Beauté - ",
		},
		"nike": {
			"fathers_day":  "Nike Cadeau Sport - ",
			"boy_birthday": "Nike Cadeau Sport - ",
		},
		"adidas": {
			"fathers_day":  "Adidas Cadeau Sport - ",
			"boy_birthday": "Adidas Cadeau Sport - ",
		},
		"h_and_m": {
			"girl_birthday": "H&M Cadeau Mode - ",
			"valentine":     "H&M Cadeau Mode - ",
		},
		"ikea": {
			"wedding":     "IKEA Cadeau Maison - ",
			"baby_shower": "IKEA Cadeau Maison - ",
		},
		"maisons_du_monde": {
			"wedding":     "Maisons du Monde Cadeau Déco - ",
			"mothers_day": "Maisons du Monde Cadeau Déco - ",
		},
		"king_jouet": {
			"christmas":     "King Jouet Cadeau Enfant - ",
			"girl_birthday": "King Jouet Cadeau Enfant - ",
			"boy_birthday":  "King Jouet Cadeau Enfant - ",
		},
	}

	// Vérifier d'abord si un préfixe spécifique à la marque existe
	lowerBrand := strings.ToLower(brand)
	for brandKey, prefixes := range brandSpecificPrefixes {
		if strings.Contains(lowerBrand, brandKey) || strings.Contains(brandKey, lowerBrand) {
			if prefix, ok := prefixes[inspiration]; ok {
				return prefix
			}
		}
	}

	// Sinon, utiliser le préfixe standard en fonction de la langue
	if isFrench {
		if prefix, ok := frenchPrefixes[inspiration]; ok {
			return prefix
		}
	} else {
		if prefix, ok := englishPrefixes[inspiration]; ok {
			return prefix
		}
	}

	// Préfixe par défaut si aucune correspondance n'est trouvée
	return "Cadeau - "
}

// GetCachedInspirations retourne le cache actuel des inspirations et sa validité
func (sm *ScraperManager) GetCachedInspirations() (map[string]Inspiration, time.Time, bool) {
	sm.inspirationsCacheMu.RLock()
	defer sm.inspirationsCacheMu.RUnlock()

	// Récupérer la date de dernière mise à jour depuis le cache produits (car ils sont liés)
	sm.cacheMu.RLock()
	cacheExp := sm.cacheExp // Utiliser l'expiration du cache produits
	sm.cacheMu.RUnlock()

	// Calculer la date de dernière mise à jour (approximative)
	// L'expiration est 72h après la dernière mise à jour
	lastUpdated := cacheExp.Add(-72 * time.Hour)

	cacheValid := time.Now().Before(cacheExp)

	// Retourner une copie pour la sécurité des threads si nécessaire
	// inspirationsCopy := make(map[string]Inspiration)
	// for k, v := range sm.inspirationsCache {
	// 	inspirationsCopy[k] = v
	// }
	// return inspirationsCopy, lastUpdated, cacheValid

	return sm.inspirationsCache, lastUpdated, cacheValid
}
