import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>Veeer Sukhadiya Books</h3>
            <p>
              A complete digital bookstore offering curated eBooks for
              students and readers across the world.
              <br />
              <br />
              📧 veeersukhadiyabooks95@gmail.com
              <br />
              📱 WhatsApp: +91-6351440242
              <br />
              📍 Gujarat, India
            </p>
          </div>

          <div className="footer-links">
            <h4>Shop</h4>
            <ul>
              <li><Link href="/best-sellers">Best Sellers</Link></li>
              <li><Link href="/new-arrivals">New Arrivals</Link></li>
              <li><Link href="/gift-cards">Gift Cards</Link></li>
              <li><Link href="/bundles">Bundles</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Support</h4>
            <ul>
              <li><Link href="/help-centre">Help Centre</Link></li>
              <li><Link href="/reading-apps">Reading Apps</Link></li>
              <li><Link href="/contact-us">Contact Us</Link></li>
              <li><Link href="/returns">Returns</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Legal</h4>
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; 2025 Veeer Sukhadiya Books. All rights reserved. Designed for
          excellence.
        </div>
      </div>
    </footer>
  );
}
