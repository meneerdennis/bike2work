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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [fietsDagen, setFietsDagen] = useState([]);

  // ✅ Bij inloggen of uitloggen data laden
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setFietsDagen(snap.data().fietsDagen || []);
        else await setDoc(ref, { fietsDagen: [] });
      } else {
        setFietsDagen([]);
      }
    });
    return unsub;
  }, []);

  // Helper voor datum
  const getLokaleDatum = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  // ✅ Vandaag registreren
  const registreerVandaag = async () => {
    if (!user) return;
    const vandaag = new Date().toISOString().slice(0, 10);
    if (!fietsDagen.includes(vandaag)) {
      const nieuwe = [...fietsDagen, vandaag];
      setFietsDagen(nieuwe);
      await setDoc(doc(db, "users", user.uid), { fietsDagen: nieuwe });
    }
  };

  // ✅ Alles wissen
  const wisAlles = async () => {
    if (!window.confirm("Alles wissen?")) return;
    await setDoc(doc(db, "users", user.uid), { fietsDagen: [] });
    setFietsDagen([]);
  };

  // ✅ Inloggen via e-mail
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, wachtwoord);
    } catch {
      if (window.confirm("Gebruiker niet gevonden. Nieuw account maken?")) {
        await createUserWithEmailAndPassword(auth, email, wachtwoord);
      }
    }
  };

  // ✅ Inloggen via Google
  const loginMetGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Fout bij Google login:", err);
      alert("Fout bij Google login");
    }
  };

  // ✅ Uitloggen
  const logout = () => signOut(auth);

  // // Kalender click
  // const toggleDag = (day) => {
  //   const dag = getLokaleDatum(day);
  //   if (fietsDagen.includes(dag)) saveData(fietsDagen.filter((d) => d !== dag));
  //   else saveData([...fietsDagen, dag]);
  // };

  const isPast = (d) => getLokaleDatum(d) < getLokaleDatum(new Date());

  const grafiekData = () => {
    // Groepeer per maand
    const maanden = {};
    fietsDagen.forEach((dag) => {
      const [jaar, maand, _] = dag.split("-");
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

  // ✅ Importeer data uit JSON-bestand
  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (json.fietsDagen && Array.isArray(json.fietsDagen)) {
        setFietsDagen(json.fietsDagen);
        localStorage.setItem("fietsDagen", JSON.stringify(json.fietsDagen));
        alert(`✅ ${json.fietsDagen.length} fietsdagen geïmporteerd!`);
      } else {
        alert("❌ Ongeldig JSON-bestand.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Fout bij het inlezen van het bestand.");
    }
  };

  return (
    <div className="app-container">
      {!user ? (
        <div className="login-form">
          <h2>Login</h2>
          <input
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
          />
          <button className="btn-blue" onClick={login}>
            Login / Registreer
          </button>
          <div className="divider">of</div>
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
          <h1>Welkom, {user.displayName || user.email}</h1>
          <button className="btn-purple" onClick={logout}>
            Uitloggen
          </button>

          <div className="button-row">
            <button className="btn-primary" onClick={registreerVandaag}>
              Vandaag gefietst 🚴
            </button>
            <button className="btn-danger" onClick={wisAlles}>
              Alles wissen 🗑️
            </button>
          </div>

          <ul className="date-list">
            {fietsDagen.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
