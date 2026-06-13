import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/layout";
import NotFound from "@/pages/not-found";

// The Green Crumb - chosen as the bakery name
import { Home } from "@/pages/home";
import { Menu } from "@/pages/menu";
import { Order } from "@/pages/order";
import { Checkout } from "@/pages/checkout";
import { OrderConfirmation } from "@/pages/order-confirmation";
import { Admin } from "@/pages/admin";
import { AdminLogin } from "@/pages/admin-login";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/menu" component={Menu} />
      <Route path="/order" component={Order} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation/:id" component={OrderConfirmation} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
        <Sonner richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
