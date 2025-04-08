const Footer = () => {
  return (
    <footer className="w-full py-8 mt-12 bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center md:items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12">
          <a href="/" className="text-center text-sm text-muted-foreground hover:text-gray-900 transition-colors">Accueil</a>
          <a href="/privacy-policy" className="text-center text-sm text-muted-foreground hover:text-gray-900 transition-colors">Politique de confidentialité</a>
          <a href="/terms" className="text-center text-sm text-muted-foreground hover:text-gray-900 transition-colors">Conditions d'utilisation</a>
          <a href="/blogs" className="text-center text-sm text-muted-foreground hover:text-gray-900 transition-colors">Blogs</a>
          <a href="#" className="text-center text-sm text-muted-foreground hover:text-gray-900 transition-colors">Press</a>
          <a href="#" className="text-center text-sm text-muted-foreground hover:text-gray-900 transition-colors">Nous contacter</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
