import { useRoute, Link } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { CheckCircle2, Package, MapPin, Receipt, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:id");
  const orderId = params?.id ? Number(params.id) : null;
  const clearCart = useCart(state => state.clearCart);

  const { data: order, isLoading, error } = useGetOrder(orderId!, {
    query: { enabled: !!orderId }
  });

  // Clear cart upon successful order load (meaning payment went through and we hit this page)
  useEffect(() => {
    if (order && order.status !== "cancelled") {
      clearCart();
    }
  }, [order, clearCart]);

  if (error || (!isLoading && !order)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-serif text-destructive mb-4">Could not load order details</h1>
        <p className="text-muted-foreground mb-8">We couldn't find an order with this ID.</p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-24 space-y-8">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container max-w-3xl mx-auto px-4">
        
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Thank you for your order!</h1>
          <p className="text-lg text-muted-foreground">
            We've received your order and are beginning to prepare it with care.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-secondary/50 p-6 md:p-8 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="font-mono text-xl font-medium">#{order.id.toString().padStart(6, '0')}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-muted-foreground mb-1">Date</p>
              <p className="font-medium">{format(new Date(order.createdAt), "MMMM d, yyyy h:mm a")}</p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-4 text-foreground">
                  <Receipt className="w-5 h-5 text-primary" /> Customer Info
                </h3>
                <div className="space-y-1 text-muted-foreground">
                  <p className="font-medium text-foreground">{order.customerName}</p>
                  <p>{order.customerEmail}</p>
                  {order.customerPhone && <p>{order.customerPhone}</p>}
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-4 text-foreground">
                  {order.deliveryType === 'delivery' ? <MapPin className="w-5 h-5 text-primary" /> : <Package className="w-5 h-5 text-primary" />}
                  {order.deliveryType === 'delivery' ? 'Delivery Address' : 'Pickup Instructions'}
                </h3>
                <div className="space-y-1 text-muted-foreground">
                  {order.deliveryType === 'delivery' ? (
                    <p className="whitespace-pre-wrap">{order.deliveryAddress}</p>
                  ) : (
                    <>
                      <p className="font-medium text-foreground">The Green Crumb Bakery</p>
                      <p>123 Pastry Lane</p>
                      <p>Greenville, CA 90210</p>
                      <p className="text-sm mt-2 pt-2 border-t border-border">Your order will be ready shortly. Show this receipt upon arrival.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Special Instructions:</p>
                <p className="text-sm text-muted-foreground italic">{order.notes}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-4 text-foreground">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground">
                        {item.quantity}
                      </span>
                      <span className="font-medium">{item.productName}</span>
                    </div>
                    <span className="text-muted-foreground">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary text-xl">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex justify-center pt-8">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/menu">Continue Shopping <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
