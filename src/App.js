import React, { useState, useEffect } from "react";
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
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAEKQwPgQ7oJ5Sr7N-sjxtGnKnMCFNkmgM",
  authDomain: "bike2work-db0dc.firebaseapp.com",
  projectId: "bike2work-db0dc",
  storageBucket: "bike2work-db0dc.firebasestorage.app",
  messagingSenderId: "640800387841",
  appId: "1:640800387841:web:fe8725beb26dbedf5da100",
  measurementId: "G-2DDSP1G2WR",
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [fietsDagen, setFietsDagen] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set the browser tab title. If a user is logged in, show their name.
  useEffect(() => {
    if (user) {
      document.title = `Bike2Work — ${user.displayName || user.email}`;
    } else {
      document.title = "Bike2Work — Inloggen";
    }
  }, [user]);

  // Helper voor datum
  const getLokaleDatum = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  // 🔹 Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFietsDagen(docSnap.data().fietsDagen || []);
        } else {
          await setDoc(docRef, { fietsDagen: [] });
          setFietsDagen([]);
        }
      } else {
        setFietsDagen([]);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // 🔹 Data opslaan
  const saveData = async (newData) => {
    if (!user) return;
    setFietsDagen(newData);
    await setDoc(doc(db, "users", user.uid), { fietsDagen: newData });
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
    await setDoc(doc(db, "users", user.uid), { fietsDagen: [] });
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

  // ✅ Download data als JSON
  const downloadData = () => {
    const data = { fietsDagen, laatsteUpdate: new Date().toISOString() };
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
        alert(`✅ ${json.fietsDagen.length} fietsdagen geïmporteerd!`);
      } else {
        alert("❌ Ongeldig JSON-bestand.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Fout bij het inlezen van het bestand.");
    }
  };

  // 🔹 Inloggen via Google
  const loginMetGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Fout bij Google login:", err);
      alert("Fout bij Google login");
    }
  };

  // 🔹 Uitloggen
  const logout = () => signOut(auth);

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
          <div className="header">
            <button className="btn-purple" onClick={logout}>
              Uitloggen
            </button>
          </div>

          <h2>Totaal gefietste dagen: {fietsDagen.length}</h2>

          <div className="button-row">
            <button className="btn-primary" onClick={registreerVandaag}>
              Vandaag gefietst 🚴
            </button>
          </div>

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

          <div className="button-row">
            <button className="btn-danger" onClick={wisAlles}>
              Alles wissen 🗑️
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
          </div>
        </>
      )}
    </div>
  );
}
