import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css"; // 👈 Zorg dat dit bestand in dezelfde map staat
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function App() {
  const [fietsDagen, setFietsDagen] = useState([]);
  const [date, setDate] = useState(new Date());

  // Data laden uit localStorage
  useEffect(() => {
    const stored = localStorage.getItem("fietsDagen");
    if (stored) setFietsDagen(JSON.parse(stored));
  }, []);

  // Data opslaan in localStorage
  const saveData = (newData) => {
    setFietsDagen(newData);
    localStorage.setItem("fietsDagen", JSON.stringify(newData));
  };

  // 👇 Helperfunctie voor lokale datum
  const getLokaleDatum = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Vandaag registreren
  const registreerVandaag = () => {
    const dagString = getLokaleDatum(new Date());
    if (!fietsDagen.includes(dagString)) {
      saveData([...fietsDagen, dagString]);
    }
  };

  // Dag toevoegen of verwijderen via kalender
  const toggleDag = (day) => {
    const dateString = getLokaleDatum(day);
    if (fietsDagen.includes(dateString)) {
      saveData(fietsDagen.filter((d) => d !== dateString));
    } else {
      saveData([...fietsDagen, dateString]);
    }
  };

  // Alles wissen
  const wisAlles = () => {
    if (
      window.confirm("Weet je zeker dat je alle fietsdagen wilt verwijderen?")
    ) {
      saveData([]);
    }
  };

  // Statistieken per maand
  const stats = {};
  fietsDagen.forEach((d) => {
    const [year, month] = d.split("-");
    const maandKey = `${year}-${month}`;
    stats[maandKey] = (stats[maandKey] || 0) + 1;
  });

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const barData = Object.keys(stats)
    .sort()
    .map((m) => {
      const [year, month] = m.split("-");
      return {
        month: `${monthNames[parseInt(month) - 1]} ${year}`,
        count: stats[m],
      };
    });

  // Hulpfunctie voor voorbije dagen
  const isPast = (d) => getLokaleDatum(d) < getLokaleDatum(new Date());

  const totaalFietsdagen = fietsDagen.length;

  return (
    <div className="app-container">
      <h2>Totaal gefietste dagen: {totaalFietsdagen}</h2>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={registreerVandaag}>Vandaag gefietst 🚴</button>
        <button onClick={wisAlles} style={{ background: "#e53935" }}>
          Alles wissen 🗑️
        </button>
      </div>

      <h3>Kalender</h3>
      <Calendar
        onClickDay={toggleDag}
        value={date}
        tileClassName={({ date: d }) => {
          const dateString = getLokaleDatum(d);
          if (fietsDagen.includes(dateString)) return "fietsdag";
          if (isPast(d) && !fietsDagen.includes(dateString)) return "pastday";
          return null;
        }}
      />

      <h3>Fietsdagen per maand</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={barData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value} fietsdagen`, "Aantal"]} />
          <Bar dataKey="count" fill="#4caf50" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
