import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCartItemsCount } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cartItemsCount = useCartItemsCount();

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-primary">The Green Crumb</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>Home</Link>
          <Link href="/menu" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/menu' ? 'text-primary' : 'text-muted-foreground'}`}>Menu</Link>
          <Link href="/order" className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            <ShoppingBag className="w-5 h-5" />
            <span>Cart ({cartItemsCount})</span>
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <Link href="/order" className="relative p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
            <ShoppingBag className="w-6 h-6" />
            {cartItemsCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col py-4">
            <Link href="/" onClick={closeMenu} className={`px-6 py-3 text-lg font-medium ${location === '/' ? 'text-primary bg-primary/5' : 'text-foreground'}`}>
              Home
            </Link>
            <Link href="/menu" onClick={closeMenu} className={`px-6 py-3 text-lg font-medium ${location === '/menu' ? 'text-primary bg-primary/5' : 'text-foreground'}`}>
              Menu
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
