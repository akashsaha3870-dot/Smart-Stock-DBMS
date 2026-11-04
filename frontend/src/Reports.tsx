
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

type Sale = {
  sale_id: number;
  total_amount: number;
  sale_date: string;
};

type SaleItem = {
  product_id: number;
  quantity: number;
  subtotal: number;
};

type Product = {
  product_id: number;
  product_name: string;
  sku: string;
  cost_price: number;
  reorder_level: number;
};

type Inventory = {
  product_id: number;
  quantity: number;
  reserved_quantity: number;
};

function getList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  return [];
}

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const [s, si, p, inv] = await Promise.all([
        fetch(`${API}/sales/`),
        fetch(`${API}/sale-items/`),
        fetch(`${API}/products/`),
        fetch(`${API}/inventory/`),
      ]);

      if (![s, si, p, inv].every((r) => r.ok)) {
        throw new Error("Could not load all report data.");
      }

      const [sd, sid, pd, invd] = await Promise.all([
        s.json(),
        si.json(),
        p.json(),
        inv.json(),
      ]);

      setSales(getList(sd));
      setItems(getList(sid));
      setProducts(getList(pd));
      setInventory(getList(invd));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const revenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );

  const averageSale = sales.length ? revenue / sales.length : 0;

  const inventoryValue = inventory.reduce((sum, stock) => {
    const product = products.find(
      (p) => p.product_id === stock.product_id
    );
    return sum + Number(stock.quantity || 0) * Number(product?.cost_price || 0);
  }, 0);

  const lowStock = inventory.filter((stock) => {
    const product = products.find(
      (p) => p.product_id === stock.product_id
    );
    return product && stock.quantity <= product.reorder_level;
  });

  const productSales = products.map((product) => {
    const sold = items.filter(
      (item) => item.product_id === product.product_id
    );

    return {
      ...product,
      quantitySold: sold.reduce(
        (sum, item) => sum + Number(item.quantity || 0), 0
      ),
      revenue: sold.reduce(
        (sum, item) => sum + Number(item.subtotal || 0), 0
      ),
    };
  }).sort((a, b) => b.quantitySold - a.quantitySold);

  function exportCSV() {
    const rows = [
      ["Product", "SKU", "Quantity Sold", "Sales Revenue"],
      ...productSales.map((p) => [
        p.product_name,
        p.sku,
        String(p.quantitySold),
        String(p.revenue),
      ]),
    ];

    const csv = rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart-stock-sales-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const money = (value: number) =>
    `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  if (loading) return <div style={{ padding: 25 }}>Loading reports...</div>;

  return (
    <div style={{ padding: 25, color: "#172033" }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 12
      }}>
        <div>
          <h1>Reports & Analytics</h1>
          <p>Business performance and inventory reports.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadReports}>Refresh Data</button>
          <button onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      {error && (
        <p style={{ color: "red", padding: 12 }}>{error}</p>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: 16, marginTop: 25
      }}>
        {[
          ["Total Sales", String(sales.length)],
          ["Total Revenue", money(revenue)],
          ["Average Sale", money(averageSale)],
          ["Inventory Value", money(inventoryValue)],
          ["Low Stock Items", String(lowStock.length)],
        ].map(([label, value]) => (
          <div key={label} style={{
            background: "white", padding: 20, borderRadius: 12,
            border: "1px solid #e5e7eb"
          }}>
            <p style={{ color: "#64748b" }}>{label}</p>
            <h2>{value}</h2>
          </div>
        ))}
      </div>

      <section style={{ marginTop: 35 }}>
        <h2>Best-Selling Products</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Product</th>
                <th align="left">SKU</th>
                <th align="left">Quantity Sold</th>
                <th align="left">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {productSales.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.product_name}</td>
                  <td>{p.sku}</td>
                  <td>{p.quantitySold}</td>
                  <td>{money(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 35 }}>
        <h2>Low Stock Report</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Product</th>
                <th align="left">Current Stock</th>
                <th align="left">Reorder Level</th>
                <th align="left">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((stock) => {
                const product = products.find(
                  (p) => p.product_id === stock.product_id
                )!;
                return (
                  <tr key={stock.product_id}>
                    <td>{product.product_name}</td>
                    <td>{stock.quantity}</td>
                    <td>{product.reorder_level}</td>
                    <td style={{ color: "#dc2626" }}>Low Stock</td>
                  </tr>
                );
              })}
              {lowStock.length === 0 && (
                <tr><td colSpan={4}>No low-stock products.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 35 }}>
        <h2>Recent Sales</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Sale ID</th>
                <th align="left">Date</th>
                <th align="left">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 10).map((sale) => (
                <tr key={sale.sale_id}>
                  <td>{sale.sale_id}</td>
                  <td>
                    {sale.sale_date
                      ? new Date(sale.sale_date).toLocaleString()
                      : "-"}
                  </td>
                  <td>{money(Number(sale.total_amount))}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={3}>No sales available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
