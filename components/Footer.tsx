import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>Veeer Sukhadiya Books</h3>
            <p>
              A complete digital bookstore and publishing platform offering curated eBooks and standalone web readers for readers worldwide.
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
              <li><Link href="/bundles">Bundles</Link></li>
              <li><Link href="/#collections">All Collections</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Publishing</h4>
            <ul>
              <li><Link href="/publish">Publish Your Book</Link></li>
              <li><Link href="/author/dashboard">Author Dashboard</Link></li>
              <li><Link href="/publishing-agreement">Publishing Agreement</Link></li>
              <li><Link href="/admin/publishing">Editorial Queue</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Support & Legal</h4>
            <ul>
              <li><Link href="/help-centre">Help Centre</Link></li>
              <li><Link href="/contact-us">Contact Us</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Veeer Sukhadiya Books. All rights reserved. Designed for excellence.
        </div>
      </div>
    </footer>
  );
}
