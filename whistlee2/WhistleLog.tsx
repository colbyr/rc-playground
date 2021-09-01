import React from "react";

export const WhistleLog = () => {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        minWidth: "100vw",
        padding: "1rem",
      }}
    >
      <h1 style={{ margin: "0 0 0.5rem 0" }}>Whistlee mk. 2</h1>
      <pre
        style={{
          backgroundColor: "#ccc",
          display: "flex",
          flexGrow: 1,
          padding: "0.5rem",
        }}
      />
    </main>
  );
};
