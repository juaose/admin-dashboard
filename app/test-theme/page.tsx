"use client";

import React from "react";
import ThemeSelector from "../../components/ThemeSelector";

export default function TestTheme() {
  return (
    <main
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ color: "var(--text-primary)" }}>Theme Test Page</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            This page demonstrates the theme switching functionality without
            authentication.
          </p>
        </div>
        <ThemeSelector />
      </div>
      <div>
        <button
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--brand-primary)",
            color: "var(--brand-white)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            marginRight: "12px",
            transition: "all 0.2s ease",
          }}
        >
          Primary Button
        </button>
        <button
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--brand-secondary)",
            color: "var(--brand-white)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            marginRight: "12px",
            transition: "all 0.2s ease",
          }}
        >
          Secondary Button
        </button>
        <button
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--brand-dark)",
            color: "var(--brand-white)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            transition: "all 0.2s ease",
          }}
        >
          Dark Button
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "1rem" }}>
          Theme Variables Demo
        </h2>
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
          }}
        >
          <p style={{ color: "var(--text-primary)" }}>Primary text color</p>
          <p style={{ color: "var(--text-secondary)" }}>Secondary text color</p>
          <p style={{ color: "var(--text-tertiary)" }}>Tertiary text color</p>
        </div>
      </div>
    </main>
  );
}
