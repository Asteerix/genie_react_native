package scraper

// GenericScraper est un scraper générique qui peut être utilisé pour toutes les marques
type GenericScraper struct {
	BrandID      string
	BrandName    string
	CanopyClient *CanopyClient
}

// GetProducts récupère les produits d'une marque
func (s *GenericScraper) GetProducts() ([]Product, error) {
	// Utiliser l'API Canopy pour obtenir 20 produits de la marque
	return s.CanopyClient.GetAmazonProductsByKeyword(s.BrandName, 20)
}

// GetNewProducts récupère les nouveaux produits d'une marque
func (s *GenericScraper) GetNewProducts() ([]Product, error) {
	// Rechercher 10 nouveaux produits de la marque
	products, err := s.CanopyClient.GetAmazonProductsByKeyword("new "+s.BrandName, 10)
	if err != nil {
		return nil, err
	}

	// Marquer les produits comme nouveaux
	for i := range products {
		products[i].IsNew = true
	}

	return products, nil
}

// Créer des instances de GenericScraper pour chaque marque
// Note: NewAmazonScraper est maintenant défini dans amazon_scrapers.go

func NewEtsyScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "etsy",
		BrandName:    "Etsy",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewCdiscountScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "cdiscount",
		BrandName:    "Cdiscount",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewSheinScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "shein",
		BrandName:    "Shein",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewTemuScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "temu",
		BrandName:    "Temu",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewWonderboxScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "wonderbox",
		BrandName:    "Wonderbox",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewMaisonsDuMondeScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "maisons_du_monde",
		BrandName:    "Maisons du Monde",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewToysRUsScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "toys_r_us",
		BrandName:    "Toys R Us",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewDecathlonScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "decathlon",
		BrandName:    "Decathlon",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewAsosScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "asos",
		BrandName:    "Asos",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

// Note: NewLegoScraper est maintenant défini dans amazon_scrapers.go

func NewHMScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "h_and_m",
		BrandName:    "H&M",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

// Note: NewNikeScraper est maintenant défini dans amazon_scrapers.go

func NewUniqloScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "uniqlo",
		BrandName:    "Uniqlo",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewZaraScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "zara",
		BrandName:    "Zara",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewDieselScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "diesel",
		BrandName:    "Diesel",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

// Note: NewAdidasScraper est maintenant défini dans amazon_scrapers.go

func NewZalandoScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "zalando",
		BrandName:    "Zalando",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewSephoraScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "sephora",
		BrandName:    "Sephora",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewFnacScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "fnac",
		BrandName:    "Fnac",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewYvesRocherScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "yves_rocher",
		BrandName:    "Yves Rocher",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewVeepeeScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "veepee",
		BrandName:    "Veepee",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewLeclercScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "leclerc",
		BrandName:    "E. Leclerc",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewIkeaScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "ikea",
		BrandName:    "Ikea",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewManoManoScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "mano_mano",
		BrandName:    "Mano Mano",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewLeroyMerlinScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "leroy_merlin",
		BrandName:    "Leroy Merlin",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewDartyScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "darty",
		BrandName:    "Darty",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewCitadiumScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "citadium",
		BrandName:    "Citadium",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewRakutenScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "rakuten",
		BrandName:    "Rakuten",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

// Note: NewSamsungScraper est maintenant défini dans amazon_scrapers.go

func NewTimberlandScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "timberland",
		BrandName:    "Timberland",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewPrintempsScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "printemps",
		BrandName:    "Printemps Paris",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewEbayScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "ebay",
		BrandName:    "Ebay",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewBookingScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "booking",
		BrandName:    "Booking",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewCarrefourScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "carrefour",
		BrandName:    "Carrefour",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewAliexpressScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "aliexpress",
		BrandName:    "Aliexpress",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewAuchanScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "auchan",
		BrandName:    "Auchan",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewLidlScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "lidl",
		BrandName:    "Lidl",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewCourseraScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "coursera",
		BrandName:    "Coursera",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewUdemyScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "udemy",
		BrandName:    "Udemy",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewSchleichScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "schleich",
		BrandName:    "Schleich",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewKingJouetScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "king_jouet",
		BrandName:    "King Jouet",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

// DefineLegoScraper et autres fonctions spécifiques peuvent aller ici
func NewAmazonScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "amazon",
		BrandName:    "Amazon",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewLegoScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "lego",
		BrandName:    "Lego",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewNikeScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "nike",
		BrandName:    "Nike",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewAdidasScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "adidas",
		BrandName:    "Adidas",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewSamsungScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "samsung",
		BrandName:    "Samsung",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}

func NewAppleScraper() BrandScraper {
	return &GenericScraper{
		BrandID:      "apple",
		BrandName:    "Apple",
		CanopyClient: NewCanopyClient("d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"),
	}
}
