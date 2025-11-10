import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  signOut,
  onAuthStateChanged,
  deleteUser,
} from "firebase/auth";

// 🔹 Firebase config loader: prefer CRA environment variables; fall back to local `src/firebaseConfig.js` if env not present.
let firebaseConfig;
const envApiKey = process.env.REACT_APP_FIREBASE_API_KEY;
if (envApiKey) {
  // Build config from environment variables (Create React App REACT_APP_*)
  firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "",
  };
  // Helpful runtime log for debugging which source is used
  // eslint-disable-next-line no-console
  console.info(
    "Firebase config: using environment variables (REACT_APP_FIREBASE_*)"
  );
} else {
  // Avoid static require() so bundlers don't fail when the file is intentionally missing.
  // Try a dynamic import at runtime; if it fails, fall back to empty defaults.
  firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: "",
  };
  (async () => {
    try {
      // Dynamic import: this will only run in the browser at runtime when the file exists.
      // eslint-disable-next-line import/no-unresolved, global-require
      // prettier-ignore
      // Using import() avoids bundler resolution errors when the file is absent.
      // Note: import() returns a promise.
      // If the file exists, replace firebaseConfig and (re)initialize Firebase.
      // We guard re-initialization by checking app.name (but initializeApp already ran with empty defaults above),
      // so we'll only log the detection here and advise a page reload if necessary.
      // eslint-disable-next-line no-undef
      const mod = await import("./firebaseConfig").catch(() => null);
      if (mod && mod.default) {
        firebaseConfig = mod.default;
        // eslint-disable-next-line no-console
        console.info(
          "Firebase config: loaded local src/firebaseConfig.js at runtime"
        );
      }
    } catch (err) {
      // ignore — we'll just keep the empty defaults
    }
  })();
}

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [lastFirestoreError, setLastFirestoreError] = useState(null);
  const [fietsDagen, setFietsDagen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [afstand, setAfstand] = useState(5); // km enkele rit
  const [vergoeding, setVergoeding] = useState(0.22);
  const [showSettings, setShowSettings] = useState(false);

  // Helper voor datum
  const getLokaleDatum = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  // 🔹 Auth: attach auth state listener for popup-based sign-in
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      unsub = onAuthStateChanged(auth, async (u) => {
        // eslint-disable-next-line no-console
        console.info(
          "onAuthStateChanged, user:",
          u ? { uid: u.uid, email: u.email } : null
        );
        setUser(u);
        if (u) {
          try {
            const docRef = doc(db, "users", u.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setFietsDagen(data.fietsDagen || []);
              setAfstand(data.afstand || 5);
              setVergoeding(data.vergoeding || 0.22);
            } else {
              await setDoc(docRef, {
                fietsDagen: [],
                afstand: 5,
                vergoeding: 0.22,
              });
            }
          } catch (e) {
            // Log Firestore read errors (e.g., permissions)
            // eslint-disable-next-line no-console
            console.error("Error fetching user doc:", e);
            setLastFirestoreError(e && e.message ? e.message : String(e));
            setFietsDagen([]);
          }
        } else {
          setFietsDagen([]);
        }
        setLoading(false);
      });
    })();

    return () => unsub();
  }, []);

  // 🔹 Data opslaan
  const saveData = async (newData) => {
    if (!user) return;
    setFietsDagen(newData);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { fietsDagen: newData, afstand, vergoeding },
        { merge: true }
      );
      setLastFirestoreError(null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error saving user doc:", e);
      setLastFirestoreError(e && e.message ? e.message : String(e));
    }
  };

  // 🔹 Instellingen opslaan
  const saveSettings = async () => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { afstand, vergoeding },
        { merge: true }
      );
      setLastFirestoreError(null);
      alert("Instellingen opgeslagen ✅");
      setShowSettings(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error saving settings:", e);
      setLastFirestoreError(e && e.message ? e.message : String(e));
      alert("Kon instellingen niet opslaan.");
    }
  };

  // Vandaag registreren
  const registreerVandaag = () => {
    const dag = getLokaleDatum(new Date());
    if (!fietsDagen.includes(dag)) saveData([...fietsDagen, dag]);
  };

  // Alles wissen
  const wisAlles = async () => {
    if (
      !window.confirm("Weet je zeker dat je alle fietsdagen wilt verwijderen?")
    )
      return;
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      { fietsDagen: [] },
      { merge: true }
    );
    setFietsDagen([]);
  };

  // Kalender click
  const toggleDag = (day) => {
    const dag = getLokaleDatum(day);
    if (fietsDagen.includes(dag)) saveData(fietsDagen.filter((d) => d !== dag));
    else saveData([...fietsDagen, dag]);
  };

  const isPast = (d) => getLokaleDatum(d) < getLokaleDatum(new Date());

  // Groepeer per maand
  const grafiekData = () => {
    const maanden = {};
    fietsDagen.forEach((dag) => {
      const [jaar, maand] = dag.split("-");
      const key = `${jaar}-${maand}`;
      maanden[key] = (maanden[key] || 0) + 1;
    });
    return Object.entries(maanden)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([maand, aantal]) => ({ maand, aantal }));
  };

  // ✅ Download data
  const downloadData = () => {
    const data = {
      fietsDagen,
      afstand,
      vergoeding,
      laatsteUpdate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fietsdata_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Importeer data
  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (json.fietsDagen && Array.isArray(json.fietsDagen)) {
        await saveData(json.fietsDagen);
        if (json.afstand) setAfstand(json.afstand);
        if (json.vergoeding) setVergoeding(json.vergoeding);
        alert(`✅ ${json.fietsDagen.length} fietsdagen geïmporteerd!`);
      } else {
        alert("❌ Ongeldig JSON-bestand.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Fout bij het inlezen van het bestand.");
    }
  };

  const loginMetGoogle = async () => {
    try {
      // Set persistence to local storage so the session survives page reloads
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Could not set persistence, continuing:", e);
      }
      // Use popup-based auth which works perfectly on GitHub Pages
      await signInWithPopup(auth, provider);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Fout bij Google login:", err);
      alert("Fout bij Google login");
    }
  };

  const logout = () => signOut(auth);

  const verwijderAccount = async () => {
    if (!user) return;
    const bevestig = window.confirm(
      "⚠️ Weet je zeker dat je je account en data wilt verwijderen?"
    );
    if (!bevestig) return;
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      alert("✅ Account verwijderd.");
      setLastFirestoreError(null);
    } catch (err) {
      console.error(err);
      alert("❌ Kon account niet verwijderen.");
      setLastFirestoreError(err && err.message ? err.message : String(err));
    }
  };

  const totaalKm = fietsDagen.length * afstand * 2;
  const totaalBedrag = (totaalKm * vergoeding).toFixed(2);

  // Tab state: 'calendar' or 'overview'
  const [activeTab, setActiveTab] = useState("calendar");
  const calendarTabRef = useRef(null);
  const overviewTabRef = useRef(null);

  const onTabKeyDown = (e, tab) => {
    const key = e.key;
    const LEFT = "ArrowLeft";
    const RIGHT = "ArrowRight";
    const HOME = "Home";
    const END = "End";

    if (key === "Enter" || key === " ") {
      e.preventDefault();
      setActiveTab(tab);
      return;
    }

    if (key === RIGHT) {
      e.preventDefault();
      overviewTabRef.current?.focus();
      return;
    }

    if (key === LEFT) {
      e.preventDefault();
      calendarTabRef.current?.focus();
      return;
    }

    if (key === HOME) {
      e.preventDefault();
      calendarTabRef.current?.focus();
      return;
    }

    if (key === END) {
      e.preventDefault();
      overviewTabRef.current?.focus();
      return;
    }
  };

  if (loading)
    return <div style={{ textAlign: "center", marginTop: 50 }}>Laden...</div>;

  return (
    <div className="app-container">
      {!user ? (
        <div className="login-form">
          <h2>Login</h2>
          <button className="btn-google" onClick={loginMetGoogle}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="google-icon"
            />
            Log in met Google
          </button>
        </div>
      ) : (
        <>
          <div className="profile-card">
            {user.photoURL && (
              <img src={user.photoURL} alt="Profiel" className="profile-pic" />
            )}
            <div>
              <h2>{user.displayName || "Onbekende gebruiker"}</h2>
              <p>
                <strong>Gefietste dagen:</strong> {fietsDagen.length}
              </p>
              <p>
                <strong>Totaal km:</strong> {totaalKm} km
              </p>
              <p>
                <strong>Vergoeding:</strong> € {totaalBedrag}
              </p>
            </div>
            <div className="profile-buttons">
              <button
                className="btn-purple"
                onClick={() => setShowSettings(!showSettings)}
              >
                ⚙️
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="settings-panel">
              <h3>Instellingen</h3>
              <label>Afstand enkele rit (km):</label>
              <input
                type="number"
                value={afstand}
                onChange={(e) => setAfstand(Number(e.target.value))}
              />
              <label>Vergoeding per km (€):</label>
              <input
                type="number"
                step="0.01"
                value={vergoeding}
                onChange={(e) => setVergoeding(Number(e.target.value))}
              />
              <button className="btn-blue" onClick={saveSettings}>
                Opslaan 💾
              </button>
              <div className="button-row">
                <button className="btn-logout" onClick={logout}>
                  Uitloggen
                </button>

                <button className="btn-blue" onClick={downloadData}>
                  Download data 💾
                </button>
                <input
                  type="file"
                  accept="application/json"
                  id="importInput"
                  style={{ display: "none" }}
                  onChange={importData}
                />

                <button
                  className="btn-purple"
                  onClick={() => document.getElementById("importInput").click()}
                >
                  Importeer data 📂
                </button>
                <button className="btn-danger" onClick={wisAlles}>
                  Alle fietsdagen wissen 🗑️
                </button>
                <button className="btn-danger" onClick={verwijderAccount}>
                  Account verwijderen
                </button>
              </div>
            </div>
          )}

          <div className="button">
            <button className="btn-primary" onClick={registreerVandaag}>
              🚴 Vandaag gefietst 🚴
            </button>
          </div>

          <div className="tabs" role="tablist" aria-label="Weergave kiezen">
            <button
              ref={calendarTabRef}
              id="tab-calendar"
              role="tab"
              aria-selected={activeTab === "calendar"}
              aria-controls="panel-calendar"
              tabIndex={activeTab === "calendar" ? 0 : -1}
              className={`tab-btn ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => setActiveTab("calendar")}
              onKeyDown={(e) => onTabKeyDown(e, "calendar")}
            >
              Kalender
            </button>
            <button
              ref={overviewTabRef}
              id="tab-overview"
              role="tab"
              aria-selected={activeTab === "overview"}
              aria-controls="panel-overview"
              tabIndex={activeTab === "overview" ? 0 : -1}
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
              onKeyDown={(e) => onTabKeyDown(e, "overview")}
            >
              Overzicht
            </button>
          </div>

          {activeTab === "calendar" && (
            <div
              id="panel-calendar"
              role="tabpanel"
              aria-labelledby="tab-calendar"
            >
              <h3>Kalender</h3>
              <Calendar
                onClickDay={toggleDag}
                tileClassName={({ date: d }) => {
                  const dag = getLokaleDatum(d);
                  if (fietsDagen.includes(dag)) return "fietsdag";
                  if (isPast(d) && !fietsDagen.includes(dag)) return "pastday";
                  return null;
                }}
              />
            </div>
          )}

          {activeTab === "overview" && (
            <div
              id="panel-overview"
              role="tabpanel"
              aria-labelledby="tab-overview"
            >
              <h3>Overzicht per maand</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={grafiekData()}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="maand" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="aantal" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
