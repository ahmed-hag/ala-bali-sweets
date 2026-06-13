import { useListProducts, useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function ProductQuickView({ productId, isOpen, onClose }: { productId: number | null, isOpen: boolean, onClose: () => void }) {
  const { data: product, isLoading } = useGetProduct(productId || 0, {
    query: { enabled: !!productId && isOpen, queryKey: getGetProductQueryKey(productId || 0) }
  });
  const addItem = useCart(state => state.addItem);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-card border-border">
        {isLoading || !product ? (
          <div className="h-[400px] flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2">
            <div className="aspect-square sm:aspect-auto sm:h-full bg-muted relative">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <Badge variant="outline" className="mb-4 capitalize">{product.category}</Badge>
                <DialogHeader className="mb-4 text-left">
                  <DialogTitle className="font-serif text-2xl md:text-3xl">{product.name}</DialogTitle>
                  <DialogDescription className="text-primary font-medium text-lg mt-1">
                    ${product.price.toFixed(2)}
                  </DialogDescription>
                </DialogHeader>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {product.description}
                </p>
                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <p>✓ Handcrafted daily</p>
                  <p>✓ Premium artisan ingredients</p>
                  <p>✓ Botanically inspired</p>
                </div>
              </div>
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg" 
                onClick={() => {
                  addItem(product, 1);
                  toast.success(`Added to cart`, {
                    description: `${product.name} - $${product.price.toFixed(2)}`
                  });
                  onClose();
                }}
                disabled={!product.available}
              >
                {product.available ? "Add to Cart" : "Sold Out"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function Menu() {
  const { data: products, isLoading } = useListProducts();
  const addItem = useCart(state => state.addItem);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickViewId, setQuickViewId] = useState<number | null>(null);

  const categories = products ? Array.from(new Set(products.map(p => p.category))) : [];

  const filteredProducts = products?.filter(product => {
    const matchesCategory = activeCategory ? product.category === activeCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">Our Menu</h1>
          <p className="text-lg text-muted-foreground">
            Explore our collection of handcrafted pastries. Each item is baked fresh daily in limited quantities.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex flex-wrap justify-center gap-2">
            <Badge 
              variant={activeCategory === null ? "default" : "outline"}
              className="cursor-pointer text-sm py-1.5 px-4"
              onClick={() => setActiveCategory(null)}
            >
              All
            </Badge>
            {categories.map(category => (
              <Badge 
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className="cursor-pointer text-sm py-1.5 px-4 capitalize"
                onClick={() => setActiveCategory(category)}
              >
                {category}s
              </Badge>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search pastries..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full aspect-square rounded-xl" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            ))
          ) : filteredProducts?.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-xl text-muted-foreground">No pastries found matching your criteria.</p>
              <Button 
                variant="link" 
                onClick={() => { setActiveCategory(null); setSearchQuery(""); }}
                className="mt-4"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            filteredProducts?.map((product) => (
              <div key={product.id} className="group flex flex-col bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
                <div 
                  className="aspect-square overflow-hidden bg-muted relative cursor-pointer"
                  onClick={() => setQuickViewId(product.id)}
                >
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                      No image
                    </div>
                  )}
                  {!product.available && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="font-serif text-xl font-semibold border border-foreground px-4 py-2 bg-background">Sold Out</span>
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="font-serif text-xl font-semibold leading-tight cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setQuickViewId(product.id)}
                    >
                      {product.name}
                    </h3>
                    <span className="font-medium text-primary ml-4">${product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-muted-foreground text-sm flex-1 mb-6 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <Button 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                    onClick={() => {
                      addItem(product, 1);
                      toast.success(`Added to cart`, {
                        description: `${product.name} - $${product.price.toFixed(2)}`
                      });
                    }}
                    disabled={!product.available}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ProductQuickView 
        productId={quickViewId} 
        isOpen={quickViewId !== null} 
        onClose={() => setQuickViewId(null)} 
      />
    </div>
  );
}
