import { useEffect, useState } from "react";
import AuthPage, { type AuthSession } from "./AuthPage";
import "./App.css";

interface Observation {
  _id: string;
  object: string;
  observer: string;
  date: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminAnalytics {
  totalUsers: number;
  totalObservations: number;
  observationsToday: number;
  topObjects: { object: string; count: number }[];
  monthlyObservations: { label: string; count: number }[];
}

interface CelestialObject {
  name: string;
  type: string;
  description: string;
  distance: string;
}

function App() {
  const [auth, setAuth] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem("astrotrack_session");
      return saved ? JSON.parse(saved) as AuthSession : null;
    } catch {
      localStorage.removeItem("astrotrack_session");
      return null;
    }
  });
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<CelestialObject | null>(null);
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [observationDate, setObservationDate] = useState("");
  const [observationNotes, setObservationNotes] = useState("");
  const [observationMessage, setObservationMessage] = useState("");
  const [observationLoading, setObservationLoading] = useState(false);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/astro/status")
      .then((response) => response.json())
      .then((data) => {
        setBackendStatus(data.message);
      })
      .catch(() => {
        setBackendStatus("Backend offline");
      });
  }, []);

  useEffect(() => {
    if (auth?.token) fetchObservations();
    if (auth?.token && auth.user.role === "admin") fetchAdminAnalytics();
    else setAnalytics(null);
  }, [auth?.token, auth?.user.role]);

  const handleAuthenticated = (session: AuthSession) => {
    localStorage.setItem("astrotrack_session", JSON.stringify(session));
    setAuth(session);
  };

  const handleLogout = () => {
    localStorage.removeItem("astrotrack_session");
    setAuth(null);
    setObservations([]);
    setAnalytics(null);
    setObservationMessage("");
  };

  if (!auth) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchError("Please enter a celestial object.");
      setResult(null);
      return;
    }

    setLoading(true);
    setSearchError("");
    setResult(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/astro/object/${search.trim()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Object not found");
      }

      setResult(data.data);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };
    const handleObservationSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!observationDate) {
      setObservationMessage("Please enter the observation date.");
      return;
    }

    setObservationLoading(true);
    setObservationMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/observations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            object: search || "Unknown",
            date: observationDate,
            notes: observationNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add observation");
      }

      setObservationMessage("✅ Observation added successfully!");
      fetchObservations();
      setObservationDate("");
      setObservationNotes("");
    } catch (error) {
      setObservationMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setObservationLoading(false);
    }
  };

  const fetchObservations = async () => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/observations",
      { headers: { Authorization: `Bearer ${auth?.token || ""}` } }
    );

    if (response.status === 401) {
      handleLogout();
      return;
    }

    const data = await response.json();

    if (response.ok) {
      setObservations(data.data);
    }
  } catch (error) {
    console.error("Failed to fetch observations:", error);
  }
};

  const fetchAdminAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const response = await fetch("http://localhost:5000/api/admin/analytics", {
        headers: { Authorization: `Bearer ${auth?.token || ""}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load analytics.");
      setAnalytics(data.data as AdminAnalytics);
    } catch (error) {
      setAnalyticsError(error instanceof Error ? error.message : "Could not load analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const exportObservationsCsv = () => {
    const quote = (value: string) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Object", "Observer", "Observation Date", "Notes"],
      ...observations.map((item) => [item.object, item.observer, item.date, item.notes]),
    ];
    const csv = rows.map((row) => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "astrotrack-observations.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteObservation = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/observations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth?.token || ""}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete observation");
      }

      setObservationMessage("Observation deleted successfully.");
      fetchObservations();
    } catch (error) {
      setObservationMessage(
        error instanceof Error ? error.message : "Failed to delete observation."
      );
    }
  };

  return (
    <div className="app">

      {/* Navigation */}
      <nav className="navbar">
        <div className="logo">🌌 AstroTrack</div>

        <div className="nav-links">
          <a href="#dashboard">Dashboard</a>
          <a href="#observations">Observations</a>
          {auth.user.role === "admin" && <a href="#admin-analytics">Admin Analytics</a>}
          <a href="#about">About</a>
        </div>
        <div className="account-actions">
          <span className={`role-pill ${auth.user.role}`}>{auth.user.role === "admin" ? "🛡️ Admin" : "👤 User"}</span>
          <span className="account-name">{auth.user.name}</span>
          <button type="button" className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" id="dashboard">
        <div className="hero-content">
          <p className="tagline">SPACE • DATA • DISCOVERY</p>

          <h1>
            Explore the
            <span> Universe.</span>
          </h1>

          <p className="hero-text">
            AstroTrack is your platform for exploring astronomical
            observations, celestial objects and space data.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              document
                .getElementById("search")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            🔭 Explore Space
          </button>
        </div>

        <div className="planet">
          <div className="planet-ring"></div>
          <div className="planet-body">🌍</div>
        </div>
      </section>

      {/* Search */}
      <section className="search-section" id="search">
        <h2>🔎 Search the Universe</h2>

        <p>
          Search for planets and celestial objects such as Mercury, Venus,
  Earth, Moon, Mars, Jupiter, Saturn, Uranus, Neptune or Sun.
        </p>

        <div className="search-box">
          <input
  type="text"
  placeholder="Enter a celestial object..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

          <button onClick={handleSearch}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        <div className="quick-search">
  <p>Quick Search:</p>

  {[
    "Mercury",
    "Venus",
    "Earth",
    "Moon",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Sun",
  ].map((object) => (
    <button
      key={object}
      onClick={() => {
        setSearch(object);
        setSearchError("");
      }}
    >
      {object}
    </button>
  ))}
</div>

        {/* Search Error */}
        {searchError && (
          <div className="search-error">
            ❌ {searchError}
          </div>
        )}

        {/* Search Result */}
        {result && (
          <div className="result-card">
            <div className="result-icon">
              {result.type === "Planet"
                ? "🪐"
                : result.type === "Star"
                ? "☀️"
                : "🌙"}
            </div>

            <div>
              <p className="result-type">{result.type}</p>

              <h2>{result.name}</h2>

              <p>{result.description}</p>

              <strong>
                📍 Distance: {result.distance}
              </strong>
            </div>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <h3>Celestial Objects</h3>
          <p>Explore stars, planets and galaxies</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔭</div>
          <h3>Observations</h3>
          <p>Track astronomical observations</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <h3>Space Data</h3>
          <p>Analyze astronomical information</p>
        </div>
      </section>

      {/* Admin-only analytics: the API independently enforces the admin role. */}
      {auth.user.role === "admin" && <section className="admin-analytics" id="admin-analytics">
        <div className="section-heading">
          <p className="tagline">ADMIN CONTROL CENTER</p>
          <h2>📊 Astronomy Analytics</h2>
          <p>Platform-wide activity overview available only to administrators.</p>
        </div>
        <div className="admin-actions">
          <button type="button" className="secondary-button" onClick={fetchAdminAnalytics} disabled={analyticsLoading}>
            {analyticsLoading ? "Refreshing..." : "↻ Refresh analytics"}
          </button>
          <button type="button" className="primary-button" onClick={exportObservationsCsv}>
            ⬇ Export observations CSV
          </button>
        </div>
        {analyticsError && <p className="admin-error">{analyticsError}</p>}
        {analyticsLoading && !analytics ? <p className="admin-empty">Loading analytics...</p> : analytics && <>
          <div className="analytics-cards">
            <div className="analytics-card"><span>👥</span><p>Registered users</p><strong>{analytics.totalUsers}</strong></div>
            <div className="analytics-card"><span>🔭</span><p>Total observations</p><strong>{analytics.totalObservations}</strong></div>
            <div className="analytics-card"><span>🌠</span><p>Recorded today</p><strong>{analytics.observationsToday}</strong></div>
          </div>
          <div className="analytics-panels">
            <div className="analytics-panel">
              <h3>Observations over the last 6 months</h3>
              {analytics.monthlyObservations.map((month) => {
                const maximum = Math.max(1, ...analytics.monthlyObservations.map((item) => item.count));
                return <div className="bar-row" key={month.label}>
                  <span>{month.label}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(month.count / maximum) * 100}%` }} /></div>
                  <strong>{month.count}</strong>
                </div>;
              })}
            </div>
            <div className="analytics-panel">
              <h3>Most observed objects</h3>
              {analytics.topObjects.length ? analytics.topObjects.map((item) => <div className="top-object" key={item.object}>
                <span>🪐 {item.object}</span><strong>{item.count}</strong>
              </div>) : <p className="admin-empty">No observation data available yet.</p>}
            </div>
          </div>
        </>}
      </section>}

      {/* Observations */}
      <section className="observations" id="observations">
        <div className="section-heading">
          <p className="tagline">ASTRONOMICAL DATA</p>

          <h2>{auth.user.role === "admin" ? "Admin Observation Center" : "Observation Center"}</h2>

          <p>
            {auth.user.role === "admin"
              ? "Review observations submitted by all AstroTrack users."
              : "Monitor and manage your astronomical observations."}
          </p>
        </div>

        <div className="observation-grid">

          <div className="observation-card">
            <span>🌙</span>
            <h3>Moon</h3>
            <p>Track lunar information and observations.</p>
            <button
              onClick={() => {
                setSearch("moon");
                document
                  .getElementById("search")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Details
            </button>
          </div>

          <div className="observation-card">
            <span>🪐</span>
            <h3>Planets</h3>
            <p>Explore planetary data and characteristics.</p>
            <button
              onClick={() => {
                setSearch("mars");
                document
                  .getElementById("search")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Details
            </button>
          </div>

          <div className="observation-card">
            <span>🌟</span>
            <h3>Stars</h3>
            <p>Discover stars and deep-space objects.</p>
            <button
              onClick={() => {
                setSearch("sun");
                document
                  .getElementById("search")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Details
            </button>
          </div>

        </div>
        {/* Recent Observations */}

<div className="recent-observations">

  <h2>📋 Recent Observations</h2>

  {observations.length === 0 ? (
    <p className="no-observations">
      {auth.user.role === "admin" ? "No user observations have been recorded yet." : "You have not recorded any observations yet."}
    </p>
  ) : (
    <div className="observation-list">

      {observations.map((observation) => (
        <div
          className="observation-item"
          key={observation._id}
        >

          <h3>🔭 {observation.object}</h3>

          <p>
            <strong>Observer:</strong>{" "}
            {observation.observer}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {observation.date}
          </p>

          {observation.notes && (
            <p>
              <strong>Notes:</strong>{" "}
              {observation.notes}
            </p>
          )}

          <button
            type="button"
            onClick={() => handleDeleteObservation(observation._id)}
            className="secondary-button"
          >
            🗑️ Delete
          </button>

        </div>
      ))}

    </div>
  )}

</div>
                {/* Regular users submit observations; admins review and moderate them. */}
        {auth.user.role === "user" && <div className="observation-form">

          <h2>🔭 Add New Observation</h2>

          <p>Record your astronomical observation.</p>

          <form onSubmit={handleObservationSubmit}>

            <div className="form-group">
              <label>Celestial Object</label>

              <select
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                required
              >
                <option value="">Select an object</option>
                <option value="mercury">Mercury</option>
                <option value="venus">Venus</option>
                <option value="earth">Earth</option>
                <option value="moon">Moon</option>
                <option value="mars">Mars</option>
                <option value="jupiter">Jupiter</option>
                <option value="saturn">Saturn</option>
                <option value="uranus">Uranus</option>
                <option value="neptune">Neptune</option>
                <option value="sun">Sun</option>
              </select>
            </div>

            <div className="form-group">
              <label>Observation Date</label>

              <input
                type="date"
                value={observationDate}
                onChange={(e) => setObservationDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Notes</label>

              <textarea
                placeholder="Enter observation notes..."
                value={observationNotes}
                onChange={(e) => setObservationNotes(e.target.value)}
                rows={4}
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={observationLoading}
            >
              {observationLoading
                ? "Adding..."
                : "🔭 Add Observation"}
            </button>

          </form>

          {observationMessage && (
            <div className="observation-message">
              {observationMessage}
            </div>
          )}

        </div>}
      </section>

      {/* Backend Status */}
      <section className="system-status">
        <h2>System Status</h2>

        <div className="status">
          <span className="status-dot"></span>

          <div>
            <strong>AstroTrack Backend</strong>
            <p>{backendStatus}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about">
        <h3>🌌 AstroTrack</h3>
        <p>Explore. Observe. Discover.</p>

        <p className="copyright">
          © 2026 AstroTrack
        </p>
      </footer>

    </div>
  );
}

export default App;

