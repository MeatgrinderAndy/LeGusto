'use client'
import Link from 'next/link'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="foot">
      <div className="foot-wrapper">
        <div className="foot-grid-layout">
          <div className="foot-branding">
            <h3 className="foot-logo-text foot-glow">Le Gusto</h3>
            <p className="foot-subtext">Авторская кухня в центре города</p>
          </div>

          <nav className="foot-navigation">
            <ul className="foot-nav-items">
              {[
                { href: "/about", label: "О РЕСТОРАНЕ" },
                { href: "/menu", label: "МЕНЮ" },
                { href: "/contacts", label: "КОНТАКТЫ" },
                { href: "/reservations", label: "ЗАКАЗАТЬ СТОЛИК" },
              ].map((item, index) => (
                <li 
                  key={item.href} 
                  className="foot-nav-element" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Link href={item.href} className="foot-nav-link foot-glow">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="foot-bottom-section">
          <p className="foot-legal-text">
            © {new Date().getFullYear()} Le Gusto. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}