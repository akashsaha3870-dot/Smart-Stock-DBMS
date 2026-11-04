import { useEffect, useState } from "react";
import { apiGet } from "./services/api";

type Supplier = {
  supplier_id: number;
  supplier_name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  created_at?: string;
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    supplier_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadSuppliers() {
    setLoading(true);
    setError("");

    try {
      const data = await apiGet<Supplier[]>("/suppliers/");
      setSuppliers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load suppliers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

    function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function resetForm() {
    setForm({
      supplier_name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
    });
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const url = editingId
        ? `/suppliers/${editingId}`
        : "/suppliers/";

      const response = await fetch(`http://127.0.0.1:8000${url}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      setMessage(editingId ? "Supplier updated!" : "Supplier added!");
      resetForm();
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    }
  }

  function editSupplier(supplier: Supplier) {
    setForm({
      supplier_name: supplier.supplier_name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });

    setEditingId(supplier.supplier_id);
    setMessage("");
    setError("");
  }

  async function deleteSupplier(id: number) {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/suppliers/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      setMessage("Supplier deleted successfully!");
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

    return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">INVENTORY MANAGEMENT</p>
          <h1>Suppliers</h1>
          <p>Manage your suppliers and their contact details.</p>
        </div>

        <button onClick={loadSuppliers}>Refresh Data</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <div className="dashboard-card" style={{ padding: 24, marginBottom: 20 }}>
        <h2>{editingId ? "Edit Supplier" : "Add New Supplier"}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 15
          }}>
            <input
              name="supplier_name"
              placeholder="Supplier Name *"
              value={form.supplier_name}
              onChange={handleChange}
              required
            />

            <input
              name="contact_person"
              placeholder="Contact Person"
              value={form.contact_person}
              onChange={handleChange}
            />

            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />

            <input
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit">
              {editingId ? "Update Supplier" : "Add Supplier"}
            </button>

            {editingId !== null && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="dashboard-card" style={{ padding: 24 }}>
        <h2>Supplier Directory</h2>
        <p>Total Suppliers: {suppliers.length}</p>

        {loading ? (
          <p>Loading suppliers...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Supplier ID</th>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.supplier_id}>
                    <td>{supplier.supplier_id}</td>
                    <td>{supplier.supplier_name}</td>
                    <td>{supplier.contact_person || "-"}</td>
                    <td>{supplier.phone || "-"}</td>
                    <td>{supplier.email || "-"}</td>
                    <td>{supplier.address || "-"}</td>
                    <td>
                      <button onClick={() => editSupplier(supplier)}>
                        Edit
                      </button>{" "}
                      <button
                        onClick={() => deleteSupplier(supplier.supplier_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={7}>No suppliers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}