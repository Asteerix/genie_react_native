import Footer from "@/components/ui/footer";

const PrivacyPolicy = () => {
  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold mb-12">
          Politique de Confidentialité
        </h1>
        
        <div className="space-y-8 text-gray-700">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
            <p>
              Chez Genie, nous accordons une grande importance à la protection de vos données personnelles. 
              Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations 
              lorsque vous utilisez notre application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. Collecte des Données</h2>
            <p>
              Nous collectons les informations que vous nous fournissez directement, notamment :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Informations de profil (nom, prénom, email)</li>
              <li>Listes de souhaits et préférences</li>
              <li>Informations sur les événements que vous créez ou auxquels vous participez</li>
              <li>Communications avec le service client</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. Utilisation des Données</h2>
            <p>
              Nous utilisons vos données pour :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Personnaliser votre expérience utilisateur</li>
              <li>Gérer vos listes et événements</li>
              <li>Améliorer nos services</li>
              <li>Communiquer avec vous concernant votre compte</li>
              <li>Assurer la sécurité de notre plateforme</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">4. Protection des Données</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre 
              tout accès non autorisé, modification, divulgation ou destruction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">5. Vos Droits</h2>
            <p>
              Vous disposez des droits suivants concernant vos données personnelles :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d'opposition</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">6. Contact</h2>
            <p>
              Pour toute question concernant notre politique de confidentialité ou pour exercer vos droits, 
              vous pouvez nous contacter à l'adresse suivante : privacy@genie-app.com
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
