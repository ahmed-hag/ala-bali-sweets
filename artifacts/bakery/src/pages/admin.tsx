import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "completed" | "cancelled";

interface OrderItem {
  productName: string;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryType: "delivery" | "pickup";
  deliveryAddress?: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid:      "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-purple-100 text-purple-800 border-purple-200",
  ready:     "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_OPTIONS: OrderStatus[] = ["pending", "paid", "preparing", "ready", "completed", "cancelled"];

export function Admin() {
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.isAdmin) {
          setLocation("/admin/login");
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => setLocation("/admin/login"));
  }, [setLocation]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      if (res.status === 401) {
        setLocation("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  useEffect(() => {
    if (!authChecked) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [authChecked, fetchOrders]);

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success(`Order #${orderId} marked as ${status}`);
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setLocation("/admin/login");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Checking credentials…</div>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCount = orders.filter(
    (o) => o.status === "pending" || o.status === "paid" || o.status === "preparing"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Order Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">The Green Crumb — Admin</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-foreground">{orders.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Active Orders</p>
            <p className="text-3xl font-bold text-primary">{pendingCount}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">All Orders</h2>
            <button
              onClick={fetchOrders}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No orders yet. They will appear here once customers place them.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-start gap-4">
                  {/* Order ID + Date */}
                  <div className="w-20 shrink-0">
                    <p className="text-sm font-semibold text-foreground">#{order.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="w-44 shrink-0">
                    <p className="text-sm font-medium text-foreground truncate">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.customerEmail}</p>
                    {order.customerPhone && (
                      <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item, i) => (
                        <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                          {item.quantity}x {item.productName}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        order.deliveryType === "delivery"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-orange-50 text-orange-700 border-orange-200"
                      }`}>
                        {order.deliveryType === "delivery" ? "Delivery" : "Pickup"}
                      </span>
                      {order.deliveryAddress && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {order.deliveryAddress}
                        </span>
                      )}
                      {order.notes && (
                        <span className="text-xs text-muted-foreground italic truncate max-w-[160px]">
                          "{order.notes}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="w-20 shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">${order.totalAmount.toFixed(2)}</p>
                  </div>

                  {/* Status */}
                  <div className="w-36 shrink-0">
                    <Select
                      value={order.status}
                      onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}
                      disabled={updating === order.id}
                    >
                      <SelectTrigger className={`h-8 text-xs border ${STATUS_COLORS[order.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
