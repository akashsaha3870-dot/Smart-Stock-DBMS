import { useEffect, useState, type FormEvent } from "react";

const API = "http://127.0.0.1:8000";

type Product = {
  product_id: number;
  product_name?: string;
  name?: string;
  sku: string;
};

type InventoryItem = {
  inventory_id: number;
  product_id: number;
  quantity: number;
  reserved_quantity: number;
};

type Batch = {
  batch_id: number;
  product_id: number;
  batch_number: string;
  quantity: number;
  received_date: string;
  expiry_date: string;
  unit_cost: string;
};

async function request(path: string, options?: RequestInit) {
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

  return response.json();
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reserved, setReserved] = useState("");

  const [batchProduct, setBatchProduct] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [batchQuantity, setBatchQuantity] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [unitCost, setUnitCost] = useState("");

  async function loadData() {
    try {
      setError("");

      const [p, i, b] = await Promise.all([
        request("/products/"),
        request("/inventory/"),
        request("/batches/"),
      ]);

      setProducts(Array.isArray(p) ? p : p.value ?? []);
      setItems(Array.isArray(i) ? i : []);
      setBatches(Array.isArray(b) ? b : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load inventory");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function productName(id: number) {
    const product = products.find((p) => p.product_id === id);
    return product?.product_name ?? product?.name ?? `Product ${id}`;
  }

   async function updateStock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await request(`/inventory/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity: Number(quantity),
          reserved_quantity: Number(reserved),
        }),
      });

      setMessage("Stock updated successfully!");
      setError("");
      setSelectedId("");
      setQuantity("");
      setReserved("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stock update failed");
    }
  }

  async function createBatch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await request("/batches/", {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(batchProduct),
          batch_number: batchNumber,
          quantity: Number(batchQuantity),
          received_date: receivedDate,
          expiry_date: expiryDate,
          unit_cost: Number(unitCost),
        }),
      });

      setMessage("New batch added successfully!");
      setError("");

      setBatchProduct("");
      setBatchNumber("");
      setBatchQuantity("");
      setReceivedDate("");
      setExpiryDate("");
      setUnitCost("");

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch creation failed");
    }
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <p>INVENTORY MANAGEMENT</p>
          <h1>Inventory</h1>
          <span>Manage stock levels and product batches.</span>
        </div>

        <button onClick={loadData}>Refresh Data</button>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="inventory-stats">
        <div className="inventory-card">
          <h3>Total Products</h3>
          <h2>{products.length}</h2>
        </div>

        <div className="inventory-card">
          <h3>Total Stock Units</h3>
          <h2>{items.reduce((sum, item) => sum + item.quantity, 0)}</h2>
        </div>

        <div className="inventory-card">
          <h3>Total Batches</h3>
          <h2>{batches.length}</h2>
        </div>
      </div>

      <section className="inventory-section">
        <h2>Update Stock</h2>

        <form onSubmit={updateStock} className="inventory-form">
          <label>Inventory Item</label>

          <select
            value={selectedId}
            onChange={(e) => {
              const selected = items.find(
                (item) => item.inventory_id === Number(e.target.value)
              );

              setSelectedId(e.target.value);
              setQuantity(selected ? String(selected.quantity) : "");
              setReserved(
                selected ? String(selected.reserved_quantity) : ""
              );
            }}
            required
          >
            <option value="">Select inventory item</option>

            {items.map((item) => (
              <option key={item.inventory_id} value={item.product_id}>
                {productName(item.product_id)}
              </option>
            ))}
          </select>

          <label>Quantity</label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <label>Reserved Quantity</label>
          <input
            type="number"
            min="0"
            value={reserved}
            onChange={(e) => setReserved(e.target.value)}
            required
          />

          <button type="submit">Update Stock</button>
        </form>
      </section>

      <section className="inventory-section">
        <h2>Add New Batch</h2>

        <form onSubmit={createBatch} className="inventory-form">
          <label>Product</label>
          <select
            value={batchProduct}
            onChange={(e) => setBatchProduct(e.target.value)}
            required
          >
            <option value="">Select product</option>

            {products.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.product_name ?? product.name ?? product.sku}
              </option>
            ))}
          </select>

          <label>Batch Number</label>
          <input
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="Example: BATCH-001"
            required
          />

          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={batchQuantity}
            onChange={(e) => setBatchQuantity(e.target.value)}
            required
          />

          <label>Received Date</label>
          <input
            type="date"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            required
          />

          <label>Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />

          <label>Unit Cost</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            required
          />

          <button type="submit">Add Batch</button>
        </form>
      </section>

      <section className="inventory-section">
        <h2>Current Inventory</h2>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Reserved</th>
              <th>Available</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.inventory_id}>
                <td>{productName(item.product_id)}</td>
                <td>{item.quantity}</td>
                <td>{item.reserved_quantity}</td>
                <td>{item.quantity - item.reserved_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="inventory-section">
        <h2>Inventory Batches</h2>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Product</th>
              <th>Batch Number</th>
              <th>Quantity</th>
              <th>Received Date</th>
              <th>Expiry Date</th>
              <th>Unit Cost</th>
            </tr>
          </thead>

          <tbody>
            {batches.map((batch) => (
              <tr key={batch.batch_id}>
                <td>{batch.batch_id}</td>
                <td>{productName(batch.product_id)}</td>
                <td>{batch.batch_number}</td>
                <td>{batch.quantity}</td>
                <td>{batch.received_date}</td>
                <td>{batch.expiry_date}</td>
                <td>₹{batch.unit_cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}