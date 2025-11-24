const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">About</h3>
            <p className="text-sm leading-relaxed">
              AMR Prediction & Surveillance platform for monitoring and predicting
              antimicrobial resistance patterns.
            </p>
          </div>

          <div></div>

          {/* Links Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/"
                  className="hover:text-primary-400 transition-colors"
                  aria-label="Home"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/prediction"
                  className="hover:text-primary-400 transition-colors"
                  aria-label="AMR Prediction"
                >
                  AMR Prediction
                </a>
              </li>
              <li>
                <a
                  href="/surveillance"
                  className="hover:text-primary-400 transition-colors"
                  aria-label="Surveillance"
                >
                  Surveillance
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-neutral-800 text-center text-sm">
          <p>
            © {currentYear} AMR Prediction & Surveillance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

