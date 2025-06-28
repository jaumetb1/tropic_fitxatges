function netejarFitxatges() {
  const tx = db.transaction("fitxatges", "readwrite");
  const store = tx.objectStore("fitxatges");
  const req = store.clear();

  req.onsuccess = () => {
    console.log("🧼 Base de dades netejada amb èxit");
    // Esborrem també els esdeveniments del calendari
    calendar.getEvents().forEach(e => e.remove());
  };

  req.onerror = () => {
    console.error("❌ Error netejant la base de dades");
  };
}
