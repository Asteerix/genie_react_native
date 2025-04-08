import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { motion } from "framer-motion";
import { ASSETS } from "../../constants/paths";
import { STORE_URLS } from "../../constants/store-urls";
import SingleCTAButton from "../SingleCTAButton";
import QRCodesSection from "../ui/qr-codes";
import { useEffect } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface Faq3Props {
  heading: string;
  items?: FaqItem[];
  supportHeading: string;
  supportDescription: string;
  supportButtonText?: string;
  supportButtonUrl?: string;
}

const defaultFaqItems: FaqItem[] = [
  {
    id: "create-wishlist",
    question: "Comment créer ma première liste de souhaits ?",
    answer: "Créez votre première liste en quelques clics sur Genie. Donnez-lui un nom, choisissez une occasion et ajoutez vos envies depuis n'importe quel site web."
  },
  {
    id: "is-free",
    question: "Est-ce que Genie est gratuit ?",
    answer: "Oui, Genie est entièrement gratuit pour créer des listes de souhaits, les partager et réserver des cadeaux."
  },
  {
    id: "avoid-duplicates",
    question: "Comment éviter les doublons de cadeaux ?",
    answer: "Genie permet à vos proches de réserver les cadeaux qu'ils souhaitent offrir. Une fois réservé, le cadeau n'est plus visible pour les autres utilisateurs."
  },
  {
    id: "create-events",
    question: "Puis-je créer mes propres événements sur Genie ?",
    answer: "Absolument ! Vous pouvez créer des événements personnalisés sur Genie pour toutes vos occasions spéciales."
  },
  {
    id: "create-pot",
    question: "Comment créer une cagnotte ?",
    answer: "Dans votre liste de souhaits, cliquez sur 'Ajouter une cagnotte', définissez un objectif et partagez-la avec vos proches."
  },
  {
    id: "pot-fees",
    question: "Quel sont les commissions sur mes cagnottes ?",
    answer: "Les cagnottes sur Genie sont sans frais cachés. Seuls les frais bancaires standards s'appliquent (1.5%)."
  }
];

const Faq3 = ({
  heading = "",
  items = defaultFaqItems,
  supportHeading = "",
  supportDescription = "",
}: Faq3Props) => {
  // Add FAQ Schema when component mounts
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": items?.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };

    const existingScript = document.getElementById('faq-schema');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'faq-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const script = document.getElementById('faq-schema');
      if (script) {
        script.remove();
      }
    };
  }, [items]);

  return (
    <section 
      className="py-12 px-1 sm:px-4 md:px-6" 
      aria-labelledby="faq-heading"
      itemScope 
      itemType="https://schema.org/FAQPage"
      role="complementary"
      data-testid="faq-section"
    >
      <meta itemProp="mainContentOfPage" content="true" />
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-3xl flex-col"
        >
          <h2 
            id="faq-heading" 
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-center"
            itemProp="name"
            data-testid="faq-heading"
          >
            <meta itemProp="headline" content={heading} />
            {heading}
          </h2>
        </motion.div>
        <Accordion
          type="single"
          collapsible
          className="mx-auto w-full lg:max-w-3xl"
          role="region"
          aria-label="Questions fréquentes"
        >
          {items?.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <AccordionItem 
                value={item.id}
                data-testid={`faq-item-${item.id}`}
                data-analytics-id={`faq-${item.id}`}
                className="text-left"
              >
                <AccordionTrigger 
                  className="transition-opacity duration-200 hover:no-underline hover:opacity-60 text-left"
                  aria-controls={`answer-${item.id}`}
                  id={`question-${item.id}`}
                >
                  <div 
                    className="font-medium sm:py-1 lg:py-2 lg:text-lg text-left"
                    itemProp="name"
                  >
                    {item.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent 
                  className="sm:mb-1 lg:mb-2"
                  id={`answer-${item.id}`}
                  role="region"
                  aria-labelledby={`question-${item.id}`}
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <div 
                    className="text-muted-foreground lg:text-lg prose prose-sm max-w-none"
                    itemProp="text"
                    data-testid={`faq-answer-${item.id}`}
                  >
                    <meta itemProp="datePublished" content={new Date().toISOString()} />
                    <meta itemProp="author" content="Genie App" />
                    {item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto flex w-full max-w-4xl flex-col items-center rounded-3xl bg-gradient-to-br from-[#FFCACA59] via-[#FFFACA59] via-[#CAEFFF59] to-[#D8CAFF59] border border-black/10 sm:p-4 text-center md:p-6 lg:p-8"
        >
          <img 
            src={ASSETS.SVG.GENIE_LOGO} 
            alt="Genie Logo - Your Wishlist & Gift Registry App" 
            className="h-32 w-32 pointer-events-none select-none"
            draggable="false"
            width="128"
            height="128"
            loading="lazy"
            decoding="async"
            fetchPriority="high"
            itemProp="image"
          />
          <h3 className="p-4 max-w-3xl font-bold text-xl lg:text-2xl xl:text-2xl">
            {supportHeading}
          </h3>
          <p className="max-w-3xl text-center text-muted-foreground lg:text-sm xl:text-md">
            {supportDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full lg:hidden mb-8 pt-4 px-4 sm:px-0">
              <button
                onClick={() => window.open(STORE_URLS.APP_STORE, '_blank')}
                className="relative bg-[#1A1A1A] text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 overflow-hidden group border border-white/100 group-hover:border-white/10 duration-300"
                aria-label="Télécharger sur l'App Store"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#FFCACA40] via-[#FFFACA40] to-[#CAEFFF40] opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-103 group-hover:animate-gradient-wave bg-[length:300%_100%]" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                    <img 
                      src={ASSETS.IMAGES.STORE.APP_STORE}
                      alt="Logo App Store"
                      className="w-6 h-6 object-contain pointer-events-none select-none"
                      draggable="false"
                      width="24"
                      height="24"
                    />
                  App Store
                </div>
              </button>
              <button 
                onClick={() => window.open(STORE_URLS.PLAY_STORE, '_blank')}
                className="relative bg-[#1A1A1A] text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 overflow-hidden group border border-white/100 group-hover:border-white/10 duration-300"
                aria-label="Télécharger sur le Play Store"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#FFCACA40] via-[#FFFACA40] to-[#CAEFFF40] opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-103 group-hover:animate-gradient-wave bg-[length:300%_100%]" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                    <img 
                      src={ASSETS.IMAGES.STORE.PLAY_STORE}
                      alt="Logo Play Store"
                      className="w-6 h-6 object-contain pointer-events-none select-none"
                      draggable="false"
                      width="24"
                      height="24"
                    />
                  Play Store
                </div>
              </button>
              <button 
                className="relative bg-white text-[#1A1A1A] sm:w-12 sm:h-12 px-6 py-3 sm:p-0 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105 overflow-hidden group border border-black/10"
                aria-label="Utiliser Genie sur la version web"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#CAEFFF40] via-[#D8CAFF40] to-[#FFCACA40] opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-103 group-hover:animate-gradient-wave bg-[length:300%_100%]" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <img 
                    src={ASSETS.SVG.CONTINUE_DESKTOP}
                    alt="Icône continuer"
                    className="w-5 h-5 pointer-events-none select-none"
                    draggable="false"
                    width="20"
                    height="20"
                  />
                  <span className="sm:hidden">Continuer sur le web</span>
                </div>
              </button>
          </div>
          <QRCodesSection />
          <div className="hidden lg:block mt-12">
            <SingleCTAButton />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export { Faq3 };
