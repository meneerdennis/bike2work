import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css";

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [fietsDagen, setFietsDagen] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = "defaultUser"; // Voor nu: één gebruiker. Later kan dit een login-ID zijn.

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

  // Kalender click
  const toggleDag = (day) => {
    const dag = getLokaleDatum(day);
    if (fietsDagen.includes(dag)) saveData(fietsDagen.filter((d) => d !== dag));
    else saveData([...fietsDagen, dag]);
  };

  const isPast = (d) => getLokaleDatum(d) < getLokaleDatum(new Date());

  if (loading)
    return <div style={{ textAlign: "center", marginTop: 50 }}>Laden...</div>;

  return (
    <div className="app-container">
      <h2>Totaal gefietste dagen: {fietsDagen.length}</h2>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={registreerVandaag}>Vandaag gefietst 🚴</button>
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
    </div>
  );
}
