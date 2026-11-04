import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface Product {
  product_id: number;
  product_name: string;
  category_id: number;
  supplier_id: number;
  sku: string;
  unit_price: number;
  cost_price: number;
  reorder_level: number;
  shelf_life_days: number;
  is_active: boolean;
}

const emptyForm = {
  product_name: "",
  category_id: "",
  supplier_id: "",
  sku: "",
  unit_price: "",
  cost_price: "",
  reorder_level: "0",
  shelf_life_days: "",
  is_active: true,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/products/`);

      if (!response.ok) {
        throw new Error("Could not load products.");
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.value ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateField(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

    async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const payload = {
      product_name: form.product_name,
      category_id: Number(form.category_id),
      supplier_id: Number(form.supplier_id),
      sku: form.sku,
      unit_price: Number(form.unit_price),
      cost_price: Number(form.cost_price),
      reorder_level: Number(form.reorder_level),
      shelf_life_days: form.shelf_life_days
        ? Number(form.shelf_life_days)
        : null,
      is_active: form.is_active,
    };

    try {
      const response = await fetch(
        editingId
          ? `${API}/products/${editingId}`
          : `${API}/products/`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.detail || "Could not save product."
        );
      }

      setMessage(editingId ? "Product updated successfully!" : "Product added successfully!");
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function startEdit(product: Product) {
    setForm({
      product_name: product.product_name,
      category_id: String(product.category_id),
      supplier_id: String(product.supplier_id),
      sku: product.sku,
      unit_price: String(product.unit_price),
      cost_price: String(product.cost_price),
      reorder_level: String(product.reorder_level),
      shelf_life_days: String(product.shelf_life_days ?? ""),
      is_active: product.is_active,
    });

    setEditingId(product.product_id);
    setShowForm(true);
    setMessage("");
    setError("");
  }

  async function deleteProduct(productId: number) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete product.");
      }

      setMessage("Product deleted successfully!");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

    return (
    <div style={{ padding: "25px", color: "#e5e7eb" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px"
      }}>
        <div>
          <h1 style={{ margin: 0 }}>Products Management</h1>
          <p style={{ color: "#9ca3af" }}>
            Manage your store products
          </p>
        </div>

        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(!showForm);
            setMessage("");
            setError("");
          }}
          style={buttonStyle}
        >
          + Add Product
        </button>
      </div>

      {message && <p style={{ color: "#22c55e" }}>{message}</p>}
      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      {showForm && (
        <form
          onSubmit={saveProduct}
          style={{
            background: "#1f2937",
            padding: "22px",
            borderRadius: "12px",
            marginBottom: "25px"
          }}
        >
          <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>

          <div style={gridStyle}>
            <input name="product_name" placeholder="Product Name"
              value={form.product_name} onChange={updateField} required />

            <input name="sku" placeholder="SKU"
              value={form.sku} onChange={updateField} required />

            <input name="category_id" type="number" placeholder="Category ID"
              value={form.category_id} onChange={updateField} required min="1" />

            <input name="supplier_id" type="number" placeholder="Supplier ID"
              value={form.supplier_id} onChange={updateField} required min="1" />

            <input name="unit_price" type="number" step="0.01"
              placeholder="Selling Price" value={form.unit_price}
              onChange={updateField} required min="0" />

            <input name="cost_price" type="number" step="0.01"
              placeholder="Cost Price" value={form.cost_price}
              onChange={updateField} required min="0" />

            <input name="reorder_level" type="number"
              placeholder="Reorder Level" value={form.reorder_level}
              onChange={updateField} min="0" />

            <input name="shelf_life_days" type="number"
              placeholder="Shelf Life (Days)" value={form.shelf_life_days}
              onChange={updateField} min="0" />
          </div>

          <label style={{ display: "block", marginTop: "15px" }}>
            <input type="checkbox" name="is_active"
              checked={form.is_active} onChange={updateField} />
            {" "}Active Product
          </label>

          <div style={{ marginTop: "20px" }}>
            <button type="submit" style={buttonStyle}>
              {editingId ? "Update Product" : "Save Product"}
            </button>

            <button type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
              style={{ ...buttonStyle, background: "#4b5563", marginLeft: "10px" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{
        background: "#1f2937",
        padding: "20px",
        borderRadius: "12px",
        overflowX: "auto"
      }}>
        <h2>All Products ({products.length})</h2>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left"
          }}>
            <thead>
              <tr>
                {["ID", "Product", "SKU", "Selling Price", "Cost Price",
                  "Reorder Level", "Status", "Actions"].map((heading) => (
                  <th key={heading} style={cellStyle}>{heading}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.product_id}>
                  <td style={cellStyle}>{product.product_id}</td>
                  <td style={cellStyle}>{product.product_name}</td>
                  <td style={cellStyle}>{product.sku}</td>
                  <td style={cellStyle}>₹{product.unit_price}</td>
                  <td style={cellStyle}>₹{product.cost_price}</td>
                  <td style={cellStyle}>{product.reorder_level}</td>
                  <td style={cellStyle}>
                    {product.is_active ? "Active" : "Inactive"}
                  </td>
                  <td style={cellStyle}>
                    <button onClick={() => startEdit(product)}
                      style={smallButtonStyle}>
                      Edit
                    </button>

                    <button onClick={() => deleteProduct(product.product_id)}
                      style={{ ...smallButtonStyle, background: "#dc2626" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  padding: "10px 18px",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer"
};

const smallButtonStyle: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  padding: "6px 10px",
  border: "none",
  borderRadius: "5px",
  marginRight: "6px",
  cursor: "pointer"
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "12px"
};

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #374151"
};