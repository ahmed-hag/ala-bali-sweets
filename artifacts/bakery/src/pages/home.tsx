import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@workspace/api-client-react";
import { ArrowRight, Leaf, Heart, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

export function Home() {
  const { data: products, isLoading } = useListProducts();
  const addItem = useCart(state => state.addItem);

  const featuredProducts = products?.slice(0, 3) || [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero.png" 
            alt="Artisan bakery spread" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center flex flex-col items-center">
          <span className="inline-block py-1 px-3 mb-6 border border-white/30 rounded-full text-white/90 text-sm tracking-widest uppercase backdrop-blur-md">
            Artisan Bakery
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl drop-shadow-lg">
            Handcrafted indulgences for your quiet moments
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-light">
            Specializing in deeply fudgy brownies and elegantly piped cupcakes, baked fresh daily with botanical inspirations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="text-lg px-8 h-14 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/menu">Order Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 h-14 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-md">
              <Link href="#our-story">Our Story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="our-story" className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative h-[600px] rounded-xl overflow-hidden shadow-2xl">
              <img 
                src="/images/cupcake-2.png" 
                alt="Matcha cupcake" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] pointer-events-none" />
            </div>
            
            <div className="flex flex-col justify-center space-y-8">
              <div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
                  Baked with intention.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  At The Green Crumb, we believe that pastry is an art form best enjoyed slowly. We don't rush the process, and we don't compromise on ingredients. Our chocolate is dark and complex, our vanilla is fragrant, and our aesthetic is rooted in the quiet beauty of nature.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-border">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold">Botanical Notes</h3>
                  <p className="text-muted-foreground">Infusions of matcha, sage, and earl grey weave through our classic recipes.</p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold">Handcrafted</h3>
                  <p className="text-muted-foreground">Every brownie is hand-cut, every cupcake piped individually.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
                Signature Offerings
              </h2>
              <p className="text-lg text-muted-foreground">
                A curated selection of our most beloved pastries.
              </p>
            </div>
            <Link href="/menu" className="hidden md:flex items-center gap-2 text-primary font-medium hover:underline">
              View full menu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))
            ) : (
              featuredProducts.map((product) => (
                <div key={product.id} className="group relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border">
                  <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image available
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col justify-between h-48">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-serif text-xl font-bold line-clamp-1">{product.name}</h3>
                        <span className="font-medium text-primary">${product.price.toFixed(2)}</span>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{product.description}</p>
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        addItem(product, 1);
                        toast.success(`Added ${product.name} to cart`);
                      }}
                      disabled={!product.available}
                    >
                      {product.available ? 'Add to Cart' : 'Sold Out'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8 flex justify-center md:hidden">
            <Button asChild variant="ghost" className="text-primary">
              <Link href="/menu">
                View full menu <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Delivery Info */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
          <Clock className="w-12 h-12 mx-auto mb-6 text-primary-foreground/80" />
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
            Delivered to your door, or waiting for you.
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 leading-relaxed font-light">
            We offer careful, hand-delivered service within city limits to ensure your pastries arrive in pristine condition. Visiting from out of town? Pre-order online and pick up at our charming boutique window.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 px-8">
            <Link href="/menu">Start your order</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
