import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

type Forecast = {
  product_id: number;
  product_name: string;
  sku: string;
  historical_units_sold_14_days: number;
  average_daily_demand: number;
  forecast_days: number;
  predicted_units: number;
  estimated_purchase_cost: number;
  method: string;
};

type ForecastResponse = {
  forecast_method: string;
  products_forecasted: number;
  forecasts: Forecast[];
};

export default function DemandForecast() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadForecast = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/demand-forecast/?forecast_days=${days}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load forecast"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  return (
    <section style={{ padding: "28px" }}>
      <h2>Demand Forecasting</h2>
      <p>Predict future product demand using historical sales data.</p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          margin: "24px 0",
        }}
      >
        <label>Forecast period:</label>

        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ padding: "10px", borderRadius: "6px" }}
        >
          <option value={7}>7 Days</option>
          <option value={14}>14 Days</option>
          <option value={30}>30 Days</option>
        </select>

        <button
          onClick={loadForecast}
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: "#6956e8",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "Generate Forecast"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && (
        <>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <div>
              <h3>{data.products_forecasted}</h3>
              <p>Products Forecasted</p>
            </div>

            <div>
              <h3>{data.forecast_method}</h3>
              <p>Forecast Method</p>
            </div>
          </div>

          <h3>Forecast Results</h3>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Product",
                    "SKU",
                    "Historical Sales",
                    "Daily Demand",
                    "Forecast Days",
                    "Predicted Units",
                    "Estimated Purchase Cost",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "14px",
                        background: "#f1f2f8",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.forecasts.map((item) => (
                  <tr key={item.product_id}>
                    <td style={{ padding: "14px" }}>
                      {item.product_name}
                    </td>
                    <td style={{ padding: "14px" }}>{item.sku}</td>
                    <td style={{ padding: "14px" }}>
                      {item.historical_units_sold_14_days}
                    </td>
                    <td style={{ padding: "14px" }}>
                      {item.average_daily_demand}
                    </td>
                    <td style={{ padding: "14px" }}>
                      {item.forecast_days}
                    </td>
                    <td style={{ padding: "14px" }}>
                      <strong>{item.predicted_units}</strong>
                    </td>
                    <td style={{ padding: "14px" }}>
                      ₹{item.estimated_purchase_cost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.forecasts.length === 0 && (
            <p>No forecast data available yet.</p>
          )}
        </>
      )}
    </section>
  );
}