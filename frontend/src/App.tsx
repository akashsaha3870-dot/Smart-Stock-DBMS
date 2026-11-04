import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Truck,
  ShoppingCart,
  TrendingUp,
  ChartColumn,
  RefreshCw,
  CircleAlert,
  IndianRupee,
  Boxes,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import "./App.css";
import Products from "./Products";
import Inventory from "./InventoryPage";
import Suppliers from "./Suppliers";
import Purchases from "./Purchases";
import Sales from "./Sales";
import DemandForecast from "./DemandForecast";
import ExpiryAlerts from "./ExpiryAlerts";
import Reports from "./Reports";

const API_BASE_URL = "http://127.0.0.1:8000";

type Product = {
  product_id: number;
  product_name?: string;
  name?: string;
  sku: string;
  category_id?: number;
  supplier_id?: number;
  unit_price: number | string;
  cost_price: number | string;
  reorder_level: number;
  is_active: boolean;
};

type Inventory = {
  product_id: number;
  quantity: number;
  reserved_quantity: number;
};

type ApiList<T> = T[] | { value: T[] };

async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`);

  if (!response.ok) {
    throw new Error(`${response.status}: ${endpoint}`);
  }

  return response.json() as Promise<T>;
}

function getList<T>(response: ApiList<T>): T[] {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.value)) return response.value;
  return [];
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [salesData, setSalesData] = useState<any[]>([]);

  async function loadDashboard() {
    setLoading(true);
    setApiError("");

    try {
      const [productResponse, inventoryResponse, alertResponse, salesResponse] =
  await Promise.all([
    apiGet<ApiList<Product>>("products/"),
    apiGet<ApiList<Inventory>>("inventory/"),
    apiGet<Record<string, unknown>>("stock-alerts/count"),
    apiGet<any[]>("sales/"),
  ]);
      const productList = getList(productResponse);
      const inventoryList = getList(inventoryResponse);

      setProducts(productList.filter((p) => p.is_active));
      setInventory(inventoryList);
      setSalesData(getList(salesResponse));

      const count =
        typeof alertResponse.low_stock_count === "number"
          ? alertResponse.low_stock_count
          : typeof alertResponse.count === "number"
            ? alertResponse.count
            : 0;

      setLowStockCount(count);
    } catch (error) {
      console.error("Dashboard API error:", error);
      setApiError(
        error instanceof Error ? error.message : "Unable to load live data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const inventoryByProduct = new Map(
    inventory.map((item) => [item.product_id, item])
  );

  const availableUnits = inventory.reduce(
    (sum, item) =>
      sum + Math.max(0, item.quantity - item.reserved_quantity),
    0
  );

  const inventoryValue = products.reduce((sum, product) => {
    const stock = inventoryByProduct.get(product.product_id);
    const quantity = stock
      ? Math.max(0, stock.quantity - stock.reserved_quantity)
      : 0;

    return sum + quantity * Number(product.cost_price || 0);
  }, 0);

  const totalSales = salesData.reduce(
  (sum, sale) => sum + Number(sale.total_amount || 0),
  0
);

const salesCount = salesData.length;

const averageSale = salesCount > 0
  ? totalSales / salesCount
  : 0;

  const lowStockProducts = products.filter((product) => {
    const stock = inventoryByProduct.get(product.product_id);
    const quantity = stock
      ? Math.max(0, stock.quantity - stock.reserved_quantity)
      : 0;

    return quantity <= product.reorder_level;
  });

  const healthyCount = products.filter((product) => {
    const stock = inventoryByProduct.get(product.product_id);
    const quantity = stock
      ? Math.max(0, stock.quantity - stock.reserved_quantity)
      : 0;

    return quantity > product.reorder_level;
  }).length;

  const stockHealthData = [
    { name: "Healthy stock", value: healthyCount, color: "#22b58b" },
    { name: "Low stock", value: lowStockProducts.length, color: "#ffb547" },
    {
      name: "Out of stock",
      value: products.filter((product) => {
        const stock = inventoryByProduct.get(product.product_id);
        return !stock || stock.quantity - stock.reserved_quantity <= 0;
      }).length,
      color: "#f36b79",
    },
  ];
  const navigation = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Products", icon: Package },
    { label: "Inventory", icon: Warehouse },
    { label: "Expiry Alerts", icon: CircleAlert },
    { label: "Suppliers", icon: Truck },
    { label: "Purchases", icon: ShoppingCart },
    { label: "Sales", icon: TrendingUp },
    { label: "Demand Forecast", icon: ArrowUpRight },
    { label: "Reports", icon: ChartColumn },
  ];

  const cards = [
    {
      title: "Total Products",
      value: products.length.toLocaleString("en-IN"),
      subtitle: "Active products in database",
      icon: Package,
      color: "purple",
    },
    {
      title: "Inventory Value",
      value: `₹${inventoryValue.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`,
      subtitle: "Based on stock × cost price",
      icon: IndianRupee,
      color: "blue",
    },
    {
      title: "Low Stock Items",
      value: lowStockCount.toLocaleString("en-IN"),
      subtitle: "Reported by stock alerts API",
      icon: CircleAlert,
      color: "orange",
    },
          {
        title: "Available Units",
        value: availableUnits.toLocaleString("en-IN"),
        subtitle: "Stock minus reserved units",
        icon: Boxes,
        color: "green",
      },
      {
        title: "Total Sales",
        value: `₹${totalSales.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}`,
        subtitle: "Total revenue from sales",
        icon: TrendingUp,
        color: "green",
      },
      {
        title: "Average Sale",
        value: `₹${averageSale.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}`,
        subtitle: "Average value per sale",
        icon: IndianRupee,
        color: "blue",
      },
    ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div>
            <h2>Smart Stock</h2>
            <p>Inventory intelligence</p>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav className="navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => setActivePage(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Inventory" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <div>
            <strong>Smart Stock</strong>
            <p>Inventory workspace</p>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <span className={`api-status ${apiError ? "error" : "success"}`}>
              {loading ? "CONNECTING" : apiError ? "API ERROR" : "API CONNECTED"}
            </span>
            <div className="avatar">A</div>
          </div>
        </header>

{activePage === "Products" ? (
  <Products />
) : activePage === "Inventory" ? (
  <Inventory />
) : activePage === "Suppliers" ? (
  <Suppliers />
) : activePage === "Purchases" ? (
  <Purchases />
) : activePage === "Sales" ? (
  <Sales />
)  : activePage === "Expiry Alerts" ? (
  <ExpiryAlerts />
)
 : activePage === "Demand Forecast" ? (
  <DemandForecast />
) : activePage === "Reports" ? (
  <Reports />
) : (
        <section className="dashboard-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">INVENTORY MANAGEMENT</p>
              <h1>
                {activePage === "Dashboard" ? "Good morning 👋" : activePage}
              </h1>
              <p className="welcome-subtitle">
                Here’s what’s happening with your store today.
              </p>
            </div>

            <button className="refresh-button" onClick={() => void loadDashboard()}>
              <RefreshCw size={15} />
              Refresh data
            </button>
          </div>

          {apiError && (
            <p className="error-message">
              Unable to load live data: {apiError}
            </p>
          )}

          {loading && <p className="loading-message">Loading database data…</p>}

          <div className="stats-grid">
            {cards.map(({ title, value, subtitle, icon: Icon, color }) => (
              <article className="stat-card" key={title}>
                <div className="stat-top">
                  <span>{title}</span>
                  <div className={`stat-icon ${color}`}>
                    <Icon size={19} />
                  </div>
                </div>
                <h2>{value}</h2>
                <p>{subtitle}</p>
              </article>
            ))}
          </div>
          <div className="dashboard-grid">
            <section className="panel sales-panel">
  <div className="panel-heading">
    <div>
      <h3>Sales overview</h3>
      <p>Live sales analytics from your database</p>
    </div>
    <span className="panel-badge">
      {salesData.length} Sales
    </span>
  </div>

  <div className="sales-placeholder">
    {salesData.length === 0 ? (
      <p>No sales recorded yet.</p>
    ) : (
      <div>
        <h3>Recent Sales</h3>
        {salesData.slice(0, 5).map((sale) => (
          <div key={sale.sale_id}>
            <strong>Sale #{sale.sale_id}</strong>
            <span>
              ₹{Number(sale.total_amount).toLocaleString("en-IN")}
            </span>
            <p>
              {sale.sale_date
                ? new Date(sale.sale_date).toLocaleDateString("en-IN")
                : "Date unavailable"}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
</section>
            <section className="panel stock-panel">
              <div className="panel-heading">
                <div>
                  <h3>Stock health</h3>
                  <p>Based on current product stock levels</p>
                </div>
                <span className="panel-symbol">◉</span>
              </div>

              <div className="stock-chart">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={stockHealthData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={57}
                      outerRadius={84}
                      paddingAngle={2}
                    >
                      {stockHealthData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="chart-center">
                  <strong>{products.length}</strong>
                  <span>Products</span>
                </div>
              </div>

              <div className="legend">
                {stockHealthData.map((item) => (
                  <div className="legend-row" key={item.name}>
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="panel products-panel">
            <div className="panel-heading">
              <div>
                <h3>{activePage === "Products" ? "Products" : "Product inventory"}</h3>
                <p>Live products retrieved from your database</p>
              </div>
              <button
                className="small-button"
                onClick={() => void loadDashboard()}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Cost price</th>
                    <th>Unit price</th>
                    <th>Available stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const stock = inventoryByProduct.get(product.product_id);
                    const quantity = stock
                      ? Math.max(0, stock.quantity - stock.reserved_quantity)
                      : 0;
                    const isLow = quantity <= product.reorder_level;

                    return (
                      <tr key={product.product_id}>
                        <td>
                          <strong>
                            {product.product_name ?? product.name ?? "Unnamed product"}
                          </strong>
                        </td>
                        <td>{product.sku}</td>
                        <td>₹{Number(product.cost_price).toFixed(2)}</td>
                        <td>₹{Number(product.unit_price).toFixed(2)}</td>
                        <td>{quantity}</td>
                        <td>
                          <span className={`stock-badge ${isLow ? "low" : "healthy"}`}>
                            {quantity <= 0
                              ? "Out of stock"
                              : isLow
                                ? "Low stock"
                                : "Healthy"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        {apiError
                          ? "Could not retrieve products. Check the API error above."
                          : "No active products found in the database."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {lowStockProducts.length > 0 && (
            <section className="panel low-stock-panel">
              <div className="panel-heading">
                <div>
                  <h3>
                    <CircleAlert size={17} /> Products needing attention
                  </h3>
                  <p>Products at or below their reorder level</p>
                </div>
              </div>
              <ul className="low-stock-list">
                {lowStockProducts.map((product) => (
                  <li key={product.product_id}>
                    <span>
                      {product.product_name ?? product.name ?? product.sku}
                    </span>
                    <span>Reorder level: {product.reorder_level}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
)}
      </main>
    </div>
  );
}

export default App;