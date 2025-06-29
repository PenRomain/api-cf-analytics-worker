import { useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Metrics {
  timestamp: number;
  count: number;
}

export default function App() {
  const [data, setData] = useState<Metrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState<"users" | "paid_clicks" | "last_scenes">(
    "users",
  );

  const fetchMetric = async (type: typeof metric) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/metrics/${type}`);
      setData(res.data as Metrics[]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Analytics Dashboard</h1>
      <div>
        <button
          onClick={() => {
            setMetric("users");
            fetchMetric("users");
          }}
        >
          Новые пользователи
        </button>
        <button
          onClick={() => {
            setMetric("paid_clicks");
            fetchMetric("paid_clicks");
          }}
        >
          Платные клики
        </button>
        <button
          onClick={() => {
            setMetric("last_scenes");
            fetchMetric("last_scenes");
          }}
        >
          Последняя сцена
        </button>
      </div>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <LineChart
          width={600}
          height={300}
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" />
        </LineChart>
      )}
    </div>
  );
}
