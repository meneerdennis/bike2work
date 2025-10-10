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

export default function App() {
  const [fietsDagen, setFietsDagen] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = "defaultUser"; // Voor nu: één gebruiker. Later kan dit dynamisch met login

  // Helper voor datum
  const getLokaleDatum = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  // ✅ Data ophalen uit Firestore
  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFietsDagen(docSnap.data().fietsDagen || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // ✅ Data opslaan naar Firestore
  const saveData = async (newData) => {
    setFietsDagen(newData);
    await setDoc(doc(db, "users", userId), { fietsDagen: newData });
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
    await setDoc(doc(db, "users", userId), { fietsDagen: [] });
    setFietsDagen([]);
  };

  // Kalender click
  const toggleDag = (day) => {
    const dag = getLokaleDatum(day);
    if (fietsDagen.includes(dag)) saveData(fietsDagen.filter((d) => d !== dag));
    else saveData([...fietsDagen, dag]);
  };

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

  if (loading)
    return <div style={{ textAlign: "center", marginTop: 50 }}>Laden...</div>;

  return (
    <div className="app-container">
      <h2>Totaal gefietste dagen: {fietsDagen.length}</h2>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={registreerVandaag}>Vandaag gefietst 🚴</button>
        <button
          onClick={wisAlles}
          style={{ background: "#e53935", marginLeft: "10px" }}
        >
          Alles wissen 🗑️
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
    </div>
  );
}
