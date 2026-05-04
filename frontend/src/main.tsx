import React from "react";
import ReactDOM from "react-dom/client";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <div style={{ backgroundColor: 'red', color: 'white', padding: '100px', fontSize: '50px', textAlign: 'center' }}>
    REACT CALISIYOR - SORUN WEB3 BAGLANTISINDA
  </div>
);
