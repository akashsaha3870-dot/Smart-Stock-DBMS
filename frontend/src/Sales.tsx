import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface Product {
  product_id: number;
  product_name: string;
  unit_price: number;
  is_active: boolean;
}

interface Sale {
  sale_id: number;
  customer_id: number | null;
  total_amount: number;
  sale_date: string | null;
}

interface SaleItem {
  sale_item_id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);

  const [saleId, setSaleId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const [salesRes, productsRes, itemsRes] = await Promise.all([
        fetch(`${API}/sales/`),
        fetch(`${API}/products/`),
        fetch(`${API}/sale-items/`)
      ]);

      if (!salesRes.ok || !productsRes.ok || !itemsRes.ok) {
        throw new Error("Could not load sales data");
      }

      const salesData = await salesRes.json();
      const productsData = await productsRes.json();

      setSales(salesData);
      setProducts(productsData.value ?? productsData);
      setItems(await itemsRes.json());
    } catch (error) {
      setMessage("Error loading sales data. Check the backend.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createSale() {
    try {
      const response = await fetch(`${API}/sales/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: null,
          total_amount: 0
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      setMessage(`Sale created successfully! Sale ID: ${result.sale_id}`);
      await loadData();
    } catch (error) {
      setMessage("Could not create sale.");
    }
  }

  async function addSaleItem() {
    if (!saleId || !productId || Number(quantity) <= 0) {
      setMessage("Please enter valid sale and product details.");
      return;
    }

    try {
      const response = await fetch(`${API}/sale-items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_id: Number(saleId),
          product_id: Number(productId),
          quantity: Number(quantity)
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setMessage("Product added to sale successfully!");
      setQuantity("1");
      await loadData();
    } catch (error) {
      setMessage("Could not add product. Check sale ID and available stock.");
    }
  }

  return (
    <div style={{ padding: "25px", color: "inherit" }}>
      <h1>Sales Management</h1>
      <p>Create sales and manage sold products.</p>

      {message && (
        <p style={{ padding: "10px", background: "#e8f5e9" }}>
          {message}
        </p>
      )}

      <section style={{ marginTop: "25px" }}>
        <h2>Create New Sale</h2>
        <button onClick={createSale}>+ Create Sale</button>
      </section>

      <hr style={{ margin: "25px 0" }} />

      <section>
        <h2>Add Product to Sale</h2>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="number"
            placeholder="Sale ID"
            value={saleId}
            onChange={(e) => setSaleId(e.target.value)}
          />

          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Select Product</option>
            {products.filter(p => p.is_active).map(p => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name} - ₹{p.unit_price}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <button onClick={addSaleItem}>Add Product</button>
        </div>
      </section>

      <hr style={{ margin: "25px 0" }} />

      <h2>Sales History</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Sale ID</th>
            <th>Customer ID</th>
            <th>Total Amount</th>
            <th>Sale Date</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.sale_id}>
              <td>{sale.sale_id}</td>
              <td>{sale.customer_id ?? "Walk-in"}</td>
              <td>₹{Number(sale.total_amount).toFixed(2)}</td>
              <td>
                {sale.sale_date
                  ? new Date(sale.sale_date).toLocaleString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "30px" }}>Sold Products</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Sale Item ID</th>
            <th>Sale ID</th>
            <th>Product ID</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.sale_item_id}>
              <td>{item.sale_item_id}</td>
              <td>{item.sale_id}</td>
              <td>{item.product_id}</td>
              <td>{item.quantity}</td>
              <td>₹{Number(item.unit_price).toFixed(2)}</td>
              <td>₹{Number(item.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}