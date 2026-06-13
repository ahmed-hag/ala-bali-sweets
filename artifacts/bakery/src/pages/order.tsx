import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useCart, useCartTotal } from "@/hooks/use-cart";
import { useGetDeliveryOptions, useCreateOrder } from "@workspace/api-client-react";
import { CreateOrderBodyDeliveryType } from "@workspace/api-client-react";

const orderFormSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
  deliveryType: z.enum([CreateOrderBodyDeliveryType.delivery, CreateOrderBodyDeliveryType.pickup]),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.deliveryType === CreateOrderBodyDeliveryType.delivery && (!data.deliveryAddress || data.deliveryAddress.length < 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Delivery address is required for delivery orders",
      path: ["deliveryAddress"],
    });
  }
});

export function Order() {
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const subtotal = useCartTotal();
  const { data: deliveryOptions, isLoading: isLoadingDelivery } = useGetDeliveryOptions();
  
  const createOrder = useCreateOrder();

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      deliveryType: CreateOrderBodyDeliveryType.pickup,
      deliveryAddress: "",
      notes: "",
    },
  });

  const watchDeliveryType = form.watch("deliveryType");
  
  const deliveryFee = watchDeliveryType === CreateOrderBodyDeliveryType.delivery 
    ? (deliveryOptions?.inTownDelivery?.fee || 0) 
    : 0;
    
  const total = subtotal + deliveryFee;

  const onSubmit = (values: z.infer<typeof orderFormSchema>) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    createOrder.mutate({
      data: {
        ...values,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      }
    }, {
      onSuccess: (order) => {
        setLocation(`/checkout?orderId=${order.id}`);
      },
      onError: (err) => {
        toast.error("Failed to create order. Please try again.");
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Looks like you haven't added any delicious treats to your cart yet.
        </p>
        <Button asChild size="lg">
          <Link href="/menu">Explore Our Menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-10 text-foreground">Checkout</h1>
        
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-10">
            {/* Cart Items */}
            <section>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                Your Order
              </h2>
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                    <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                      {item.product.imageUrl && (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg font-serif">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)} each</p>
                        </div>
                        <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center border border-border rounded-md bg-background">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => item.quantity > 1 ? updateQuantity(item.product.id, item.quantity - 1) : removeItem(item.product.id)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Order Details Form */}
            <section>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                Order Details
              </h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="order-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jane@example.com" {...field} className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 123-4567" {...field} className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="deliveryType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>How would you like to receive your order?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-3"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0 p-4 border border-border rounded-lg bg-card cursor-pointer hover:border-primary/50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value={CreateOrderBodyDeliveryType.pickup} />
                                </FormControl>
                                <div className="flex-1">
                                  <FormLabel className="font-medium cursor-pointer">Store Pickup</FormLabel>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {isLoadingDelivery ? "Loading..." : deliveryOptions?.pickup?.description || "Pick up from our bakery."}
                                  </p>
                                </div>
                                <span className="font-medium">Free</span>
                              </FormItem>
                              
                              <FormItem className="flex items-center space-x-3 space-y-0 p-4 border border-border rounded-lg bg-card cursor-pointer hover:border-primary/50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem 
                                    value={CreateOrderBodyDeliveryType.delivery} 
                                    disabled={!isLoadingDelivery && !deliveryOptions?.inTownDelivery?.available}
                                  />
                                </FormControl>
                                <div className="flex-1">
                                  <FormLabel className="font-medium cursor-pointer">
                                    In-Town Delivery
                                    {(!isLoadingDelivery && !deliveryOptions?.inTownDelivery?.available) && " (Currently Unavailable)"}
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {isLoadingDelivery ? "Loading..." : deliveryOptions?.inTownDelivery?.description}
                                  </p>
                                </div>
                                <span className="font-medium">
                                  ${deliveryOptions?.inTownDelivery?.fee.toFixed(2) || "0.00"}
                                </span>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchDeliveryType === CreateOrderBodyDeliveryType.delivery && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                      <FormField
                        control={form.control}
                        name="deliveryAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter full street address, apartment/suite number, city, and zip code." 
                                {...field} 
                                className="min-h-[100px] bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any allergies, special requests, or gift messages?" 
                              {...field} 
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </section>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({items.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span>{deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'Free'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                form="order-form" 
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? "Processing..." : "Continue to Payment"}
                {!createOrder.isPending && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                Payments are secure and encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
