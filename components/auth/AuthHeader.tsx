import React from "react";

export const AuthHeader: React.FC = () => {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "2rem 0 1rem 0",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem",
        }}
      >
        <img
          src="/logo.png"
          alt="Sr. Cruz Logo"
          style={{
            height: "48px",
            marginRight: "1rem",
          }}
        />
        <h1
          style={{
            color: "var(--brand-primary)",
            fontSize: "2rem",
            fontWeight: "bold",
            margin: 0,
          }}
        >
          Sr. Cruz Admin
        </h1>
      </div>
      {/* <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "1rem",
          margin: 0,
        }}
      >
        Panel de Administración
      </p> */}
    </div>
  );
};
