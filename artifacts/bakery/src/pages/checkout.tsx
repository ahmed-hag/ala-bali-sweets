import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useGetOrder, useConfirmPayment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Initialize Stripe outside of component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

// Module-level guard — survives component unmount/remount and React StrictMode
// Maps orderId → clientSecret so we never create two intents for the same order
const intentCache = new Map<number, string>();
const intentInFlight = new Set<number>();

function CheckoutForm({ orderId, clientSecret, totalAmount }: { orderId: number; clientSecret: string; totalAmount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const confirmPaymentMutation = useConfirmPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      confirmPaymentMutation.mutate(
        { data: { orderId, paymentIntentId: paymentIntent.id } },
        {
          onSuccess: () => setLocation(`/order-confirmation/${orderId}`),
          onError: () => {
            toast.error("Payment succeeded but order update failed. Please contact us.");
            setIsProcessing(false);
          },
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : `Pay $${totalAmount.toFixed(2)}`}
      </Button>
    </form>
  );
}

export function Checkout() {
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = Number(searchParams.get("orderId"));

  const [clientSecret, setClientSecret] = useState<string | null>(
    () => intentCache.get(orderId) ?? null
  );
  const [initError, setInitError] = useState(false);

  const { data: order, isLoading: isLoadingOrder, error: orderError } = useGetOrder(orderId, {
    query: {
      queryKey: ["order", orderId],
      enabled: !!orderId && !isNaN(orderId),
    },
  });

  useEffect(() => {
    if (!order?.id) return;
    // Already have a secret for this order (cached or from state initialiser)
    if (intentCache.has(order.id)) {
      setClientSecret(intentCache.get(order.id)!);
      return;
    }
    // Request already in flight
    if (intentInFlight.has(order.id)) return;

    intentInFlight.add(order.id);

    fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to create intent");
        return r.json();
      })
      .then((data: { clientSecret: string }) => {
        intentCache.set(order.id, data.clientSecret);
        setClientSecret(data.clientSecret);
      })
      .catch(() => {
        intentInFlight.delete(order.id);
        setInitError(true);
        toast.error("Failed to initialize payment");
      });
  }, [order?.id]);

  if (!orderId || isNaN(orderId) || orderError) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-serif text-destructive mb-4">Invalid Order</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the order you're trying to pay for.</p>
        <Button asChild>
          <Link href="/menu">Return to Menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <Link href="/order" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Order Details
        </Link>

        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-10 text-foreground">Secure Payment</h1>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-primary">
              <Lock className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Payment Details</h2>
            </div>

            {initError ? (
              <div className="text-center py-6 text-destructive text-sm">
                Failed to load payment form.{" "}
                <button
                  className="underline"
                  onClick={() => {
                    setInitError(false);
                    intentInFlight.delete(orderId);
                  }}
                >
                  Try again
                </button>
              </div>
            ) : !clientSecret ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-14 w-full mt-6" />
              </div>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
                <CheckoutForm orderId={orderId} clientSecret={clientSecret} totalAmount={order?.totalAmount || 0} />
              </Elements>
            )}
          </div>

          <div className="bg-secondary/30 border border-border/50 p-6 md:p-8 rounded-xl">
            <h2 className="text-xl font-semibold mb-6 font-serif">Order Summary</h2>

            {isLoadingOrder ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : order ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${(order.totalAmount - (order.deliveryType === "delivery" ? 3 : 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery/Pickup</span>
                    <span>{order.deliveryType === "delivery" ? "$3.00" : "Free"}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex justify-between items-center">
                  <span className="text-lg font-semibold">Total to pay</span>
                  <span className="text-2xl font-bold text-primary">${order.totalAmount.toFixed(2)}</span>
                </div>

                <div className="bg-background rounded-lg p-4 text-sm mt-6">
                  <p className="font-medium mb-1">Customer Info:</p>
                  <p className="text-muted-foreground">{order.customerName}</p>
                  <p className="text-muted-foreground">{order.customerEmail}</p>
                  <p className="text-muted-foreground capitalize mt-2">
                    <span className="font-medium">Method:</span> {order.deliveryType}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
