
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface ExpiryAlert {
  alert_id: number;
  batch_id: number;
  product_id: number | null;
  expiry_date: string | null;
  days_remaining: number;
  risk_level: string | null;
  suggested_action: string | null;
  status: string;
  created_at: string;
}

function getRiskLevel(alert: ExpiryAlert): string {
  if (alert.risk_level) return alert.risk_level;

  if (alert.days_remaining <= 0) return "Critical";
  if (alert.days_remaining <= 30) return "Warning";

  return "Safe";
}

function getSuggestedAction(alert: ExpiryAlert): string {
  if (alert.suggested_action) return alert.suggested_action;

  if (alert.days_remaining <= 0) {
    return "Remove expired stock immediately";
  }

  if (alert.days_remaining <= 30) {
    return "Prioritize sale before expiry";
  }

  return "Monitor stock regularly";
}

function getRiskColor(level: string) {
  switch (level.toLowerCase()) {
    case "critical":
      return { background: "#fee2e2", color: "#b91c1c" };
    case "warning":
      return { background: "#fef3c7", color: "#92400e" };
    default:
      return { background: "#dcfce7", color: "#166534" };
  }
}

export default function ExpiryAlerts() {
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAlerts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/expiry-alerts/`);

      if (!response.ok) {
        throw new Error("Could not load expiry alerts.");
      }

      const data = await response.json();

      setAlerts(
        Array.isArray(data) ? data : Array.isArray(data.value) ? data.value : []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateAlerts() {
    try {
      setGenerating(true);
      setMessage("");
      setError("");

      const response = await fetch(`${API}/expiry-alerts/generate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not generate expiry alerts.");
      }

      setMessage("Expiry alerts generated successfully!");
      await loadAlerts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function resolveAlert(alertId: number) {
    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API}/expiry-alerts/${alertId}/resolve`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        throw new Error("Could not resolve alert.");
      }

      setMessage(`Alert #${alertId} resolved successfully!`);
      await loadAlerts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const activeCount = alerts.filter(
    (alert) => alert.status?.toLowerCase() === "active"
  ).length;

  const criticalCount = alerts.filter(
    (alert) => getRiskLevel(alert).toLowerCase() === "critical"
  ).length;

  const warningCount = alerts.filter(
    (alert) => getRiskLevel(alert).toLowerCase() === "warning"
  ).length;

  const cardStyle: React.CSSProperties = {
    flex: 1,
    minWidth: "150px",
    padding: "20px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
  };

  const badgeStyle = (background: string, color: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    background,
    color,
    fontSize: "12px",
    fontWeight: 600,
  });

  return (
    <div style={{ padding: "24px", color: "#1f2937" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ marginBottom: "8px" }}>Expiry Alerts</h2>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Monitor products approaching or past their expiry dates.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div style={cardStyle}>
          <p style={{ color: "#6b7280", margin: 0 }}>Total Alerts</p>
          <h2 style={{ margin: "10px 0 0" }}>{alerts.length}</h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280", margin: 0 }}>Active Alerts</p>
          <h2 style={{ margin: "10px 0 0" }}>{activeCount}</h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280", margin: 0 }}>Critical Alerts</p>
          <h2 style={{ margin: "10px 0 0", color: "#dc2626" }}>
            {criticalCount}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280", margin: 0 }}>Warning Alerts</p>
          <h2 style={{ margin: "10px 0 0", color: "#d97706" }}>
            {warningCount}
          </h2>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={generateAlerts}
          disabled={generating}
          style={{
            padding: "10px 16px",
            background: "#635bdb",
            color: "#ffffff",
            border: "none",
            borderRadius: "7px",
            cursor: generating ? "not-allowed" : "pointer",
          }}
        >
          {generating ? "Generating..." : "Generate Expiry Alerts"}
        </button>

        <button
          onClick={loadAlerts}
          disabled={loading}
          style={{
            padding: "10px 16px",
            background: "#ffffff",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
            cursor: "pointer",
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "1050px",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              {[
                "Alert ID",
                "Batch ID",
                "Product ID",
                "Expiry Date",
                "Days Remaining",
                "Risk Level",
                "Suggested Action",
                "Status",
                "Action",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: "15px 12px",
                    color: "#64748b",
                    fontSize: "12px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {alerts.map((alert) => {
              const risk = getRiskLevel(alert);
              const riskColor = getRiskColor(risk);
              const isActive = alert.status?.toLowerCase() === "active";

              return (
                <tr key={alert.alert_id}>
                  <td style={{ padding: "15px 12px" }}>
                    {alert.alert_id}
                  </td>
                  <td style={{ padding: "15px 12px" }}>
                    {alert.batch_id}
                  </td>
                  <td style={{ padding: "15px 12px" }}>
                    {alert.product_id ?? "-"}
                  </td>
                  <td style={{ padding: "15px 12px" }}>
                    {alert.expiry_date ?? "-"}
                  </td>
                  <td
                    style={{
                      padding: "15px 12px",
                      color: alert.days_remaining <= 0 ? "#dc2626" : "#374151",
                      fontWeight: 600,
                    }}
                  >
                    {alert.days_remaining}
                  </td>
                  <td style={{ padding: "15px 12px" }}>
                    <span style={badgeStyle(riskColor.background, riskColor.color)}>
                      {risk}
                    </span>
                  </td>
                  <td style={{ padding: "15px 12px" }}>
                    {getSuggestedAction(alert)}
                  </td>
                  <td style={{ padding: "15px 12px" }}>
                    <span
                      style={badgeStyle(
                        isActive ? "#dcfce7" : "#e5e7eb",
                        isActive ? "#166534" : "#374151"
                      )}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td style={{ padding: "15px 12px" }}>
                    {isActive ? (
                      <button
                        onClick={() => resolveAlert(alert.alert_id)}
                        style={{
                          padding: "6px 12px",
                          background: "#ffffff",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Resolve
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}

            {!loading && alerts.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No expiry alerts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
