import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

type Supplier = {
  supplier_id: number;
  supplier_name: string;
};

type Purchase = {
  purchase_id: number;
  supplier_id: number;
  total_amount: string | number;
  purchase_date?: string | null;
  status: string;
};

type ApiList<T> = T[] | { value: T[] };

function getList<T>(data: ApiList<T>): T[] {
  return Array.isArray(data) ? data : data.value;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [purchaseData, supplierData] = await Promise.all([
        request<ApiList<Purchase>>("/purchases/"),
        request<ApiList<Supplier>>("/suppliers/"),
      ]);

      setPurchases(getList(purchaseData));
      setSuppliers(getList(supplierData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
     loadProducts();
  }, []);

  async function createPurchase(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await request("/purchases/", {
        method: "POST",
        body: JSON.stringify({
          supplier_id: Number(supplierId),
          total_amount: Number(amount),
          status,
        }),
      });

      setMessage("Purchase created successfully!");
      setSupplierId("");
      setAmount("");
      setStatus("pending");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create purchase");
    }
  }

    const [products, setProducts] = useState<
    { product_id: number; product_name: string }[]
  >([]);
  const [itemPurchaseId, setItemPurchaseId] = useState("");
  const [itemProductId, setItemProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemCost, setItemCost] = useState("");

  async function loadProducts() {
    try {
      const data = await request<ApiList<{
        product_id: number;
        product_name: string;
      }>>("/products/");

      setProducts(getList(data).filter((p) => p.product_id));
    } catch {
      setError("Could not load products.");
    }
  }

  async function addPurchaseItem(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await request("/purchase-items/", {
        method: "POST",
        body: JSON.stringify({
          purchase_id: Number(itemPurchaseId),
          product_id: Number(itemProductId),
          quantity: Number(itemQuantity),
          unit_cost: Number(itemCost),
        }),
      });

      setMessage("Product added to purchase successfully!");
      setItemPurchaseId("");
      setItemProductId("");
      setItemQuantity("1");
      setItemCost("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item");
    }
  }

    return (
    <section className="dashboard-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">INVENTORY MANAGEMENT</p>
          <h1>Purchases</h1>
          <p className="welcome-subtitle">
            Create and manage supplier purchases.
          </p>
        </div>

        <button onClick={loadData}>Refresh Data</button>
      </div>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Create Purchase</h2>

          <form onSubmit={createPurchase}>
            <label>Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  {s.supplier_name}
                </option>
              ))}
            </select>

            <label>Total Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button type="submit">Create Purchase</button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Add Product to Purchase</h2>

          <form onSubmit={addPurchaseItem}>
            <label>Purchase ID</label>
            <select
              value={itemPurchaseId}
              onChange={(e) => setItemPurchaseId(e.target.value)}
              required
            >
              <option value="">Select purchase</option>
              {purchases.map((p) => (
                <option key={p.purchase_id} value={p.purchase_id}>
                  Purchase #{p.purchase_id}
                </option>
              ))}
            </select>

            <label>Product</label>
            <select
              value={itemProductId}
              onChange={(e) => setItemProductId(e.target.value)}
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name}
                </option>
              ))}
            </select>

            <label>Quantity</label>
            <input
              type="number"
              min="1"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              required
            />

            <label>Unit Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={itemCost}
              onChange={(e) => setItemCost(e.target.value)}
              required
            />

            <button type="submit">Add Purchase Item</button>
          </form>
        </div>
      </div>

      <div className="dashboard-card" style={{ marginTop: "24px" }}>
        <h2>Purchase Directory</h2>
        <p>Total Purchases: {purchases.length}</p>

        {loading ? (
          <p>Loading purchases...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Supplier ID</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {purchases.map((p) => (
                  <tr key={p.purchase_id}>
                    <td>{p.purchase_id}</td>
                    <td>{p.supplier_id}</td>
                    <td>
                      {p.purchase_date
                        ? new Date(p.purchase_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>₹{Number(p.total_amount).toFixed(2)}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}

                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={5}>No purchases found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}