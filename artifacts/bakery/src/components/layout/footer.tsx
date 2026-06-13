import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-2">
          <h2 className="font-serif text-2xl font-bold mb-4">The Green Crumb</h2>
          <p className="text-primary-foreground/80 max-w-sm">
            Handcrafted artisan brownies and cupcakes. Baked with love, delivered with care. A little slice of luxury for your everyday.
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-4">Explore</h3>
          <ul className="space-y-3">
            <li><Link href="/" className="text-primary-foreground/80 hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/menu" className="text-primary-foreground/80 hover:text-white transition-colors">Our Menu</Link></li>
            <li><Link href="/order" className="text-primary-foreground/80 hover:text-white transition-colors">Cart</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-4">Contact</h3>
          <ul className="space-y-3 text-primary-foreground/80">
            <li>hello@thegreencrumb.com</li>
            <li>(555) 123-4567</li>
            <li className="pt-4">
              <strong>Pickup Location:</strong><br />
              123 Pastry Lane<br />
              Greenville, CA 90210
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6 mt-12 pt-8 border-t border-primary-foreground/20 text-sm text-primary-foreground/60 text-center">
        &copy; {new Date().getFullYear()} The Green Crumb. All rights reserved.
      </div>
    </footer>
  );
}
