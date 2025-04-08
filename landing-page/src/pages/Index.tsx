import { Hero } from "@/components/ui/animated-hero";
import { FeatureSteps } from "@/components/ui/feature-section";
import { Faq3 } from "@/components/blocks/faq3";
import { MobileTestimonials } from "@/components/ui/testimonials";
import ConfettiEffect from "@/components/ui/confetti";
import { BentoGridExample } from "@/components/ui/bento-grid";
import { ASSETS } from "@/constants/paths";
import Footer from "@/components/ui/footer";

const FAQ_ITEMS = [
  {
    id: "faq-1",
    question: "Comment créer ma première liste de souhaits ?",
    answer: "Inscrivez-vous, cliquez sur 'Créer une liste', ajoutez vos souhaits depuis l'onglet Shopping ou grâce à un lien du web et partagez le lien avec vos proches ou dans des événements.",
  },
  {
    id: "faq-2",
    question: "Est-ce que Genie est gratuit ?",
    answer: "Oui, Genie est entièrement gratuit.",
  },
  {
    id: "faq-3",
    question: "Comment éviter les doublons de cadeaux ?",
    answer: "Une fois qu'un vœu est réservé par quelqu'un, il apparaît grisé aux autres utilisateurs et sans le révéler au destinataire.",
  },
  {
    id: "faq-4",
    question: "Puis-je créer mes propres événements sur Genie ?",
    answer: "Absolument ! Genie te permet de créer des événements personnalisés collaboratifs (chaque invités peut s'offrir des cadeaux) ou indivuels (une personne/couple reçoit des cadeaux) pour tous types d'occasions.",
  },
  {
    id: "faq-5",
    question: "Comment créer une cagnotte ?",
    answer: "Créez un événement, activez l'option 'cagnotte', définissez le montant cible et partagez. Vos proches pourront y contribuer facilement.",
  },
  {
    id: "faq-6",
    question: "Quel sont les commissions sur mes cagnottes ?",
    answer: "Nous proposons des commissions les plus basses du marché. Pour les cagnottes, nous prenons 2.5% au moment du retrait contre minimum 4% pour les autres plateformes.",
  },
];

const FEATURES = [
  { 
    step: "Step 1", 
    title: "Trouve des idées de cadeaux",
    content: "Fini le stress, Genie te guide pour dénicher facilement des cadeaux parfaits pour chacun de tes proches.", 
    image: ASSETS.IMAGES.SCREENS.SHOPPING
  },
  { 
    step: "Step 2",
    title: "Crée tes listes de vœux",
    content: "Garde une trace de tes envies toute l'année. Enregistre et organise tes souhaits en un clin d'œil, où que tu sois.",
    image: ASSETS.IMAGES.SCREENS.MY_PROFILE
  },
  { 
    step: "Step 3",
    title: "Organise ou participe à des événements",
    content: "Rends le cadeau collectif amusant ! Crée ou contribue à des cagnottes pour offrir des cadeaux spéciaux qui feront plaisir à coup sûr.",
    image: ASSETS.IMAGES.SCREENS.MY_PROFILE
  },
  { 
    step: "Step 4",
    title: "Réserve puis achète les vœux",
    content: "Adieu les doublons, bonjour les cadeaux qui plaisent ! Réserve les souhaits de tes proches pour offrir des surprises uniques et appréciées.",
    image: ASSETS.IMAGES.SCREENS.MY_PROFILE
  },
  { 
    step: "Step 5",
    title: "Participe à des cagnottes et cadeaux collectifs",
    content: "Savoure le plaisir d'offrir à plusieurs. Unis tes forces avec d'autres pour des cadeaux mémorables qui marquent les esprits.",
    image: ASSETS.IMAGES.SCREENS.MY_PROFILE
  },
  { 
    step: "Step 6",
    title: "Partage des moments avec tes proches",
    content: "Renforce tes liens. Ajoute, discute et explore les profils de tes amis et famille pour rester connecté au quotidien.",
    image: ASSETS.IMAGES.SCREENS.MY_PROFILE
  },
];

const Index = () => {
  return (
    <ConfettiEffect
      confettiColors={[
        "#FF0000", "#00FF00", "#0000FF", "#FFFF00", 
        "#FF00FF", "#00FFFF", "#FFA500", "#800080",
        "#FFC0CB", "#32CD32", "#4169E1", "#FFD700"
      ]}
      confettiSize={6}
      fallSpeed={2}
      confettiCount={60}
      spread={45}
    >
      <div className="bg-[#F7F7F7]">
      <Hero />
      
      <FeatureSteps
        title="L'app qui réalise nos vœux"
        features={FEATURES}
        autoPlayInterval={4000}
        imageHeight="h-[500px]"
      />
      
      <div className="max-w-7xl mx-auto px-4 pt-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">Fonctionnalités</h2>
      </div>

      <div>
        <BentoGridExample />
      </div>

      <MobileTestimonials />
      
      <div className="max-w-7xl mx-auto lg:pt-32 px-4">
        <Faq3
          heading="Questions fréquentes"
          items={FAQ_ITEMS}
          supportHeading="Télécharge Genie maintenant, c'est 100% gratuit !"
          supportDescription="Rejoins tes amis et ta famille sur Genie pour célébrer des événements inoubliables."
          supportButtonText={""}
          supportButtonUrl={""}
        />
      </div>
      
      <Footer />
      </div>
    </ConfettiEffect>
  );
};

export default Index;
