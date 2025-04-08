import Footer from "@/components/ui/footer";

const Terms = () => {
  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold mb-12">
          Conditions d'Utilisation
        </h1>
        
        <div className="space-y-8 text-gray-700">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. Acceptation des Conditions</h2>
            <p>
              En utilisant l'application Genie, vous acceptez d'être lié par les présentes conditions d'utilisation. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. Description du Service</h2>
            <p>
              Genie est une application permettant aux utilisateurs de :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Créer et gérer des listes de souhaits</li>
              <li>Organiser des événements</li>
              <li>Participer à des cagnottes collectives</li>
              <li>Partager des moments avec leurs proches</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. Conditions d'Utilisation</h2>
            <p>
              Pour utiliser Genie, vous devez :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Avoir l'âge légal dans votre pays de résidence</li>
              <li>Fournir des informations exactes lors de l'inscription</li>
              <li>Maintenir la confidentialité de votre compte</li>
              <li>Respecter les droits des autres utilisateurs</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">4. Propriété Intellectuelle</h2>
            <p>
              Tous les contenus présents sur Genie (textes, images, logos, code) sont protégés par le droit d'auteur. 
              Leur reproduction ou utilisation sans autorisation expresse est interdite.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">5. Responsabilités</h2>
            <p>
              En tant qu'utilisateur, vous êtes responsable :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Du contenu que vous publiez</li>
              <li>De la sécurité de votre compte</li>
              <li>Du respect des autres utilisateurs</li>
              <li>De l'utilisation légale du service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">6. Modifications</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. 
              Les modifications prennent effet dès leur publication sur l'application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">7. Contact</h2>
            <p>
              Pour toute question concernant ces conditions d'utilisation, 
              vous pouvez nous contacter à : contact@genie-app.com
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;
