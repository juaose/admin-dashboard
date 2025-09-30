"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";
import "./ThemeSelector.css";

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-selector">
      <label className="theme-selector-label">Color Theme:</label>
      <div className="theme-options">
        <button
          className={`theme-option ${theme === "light" ? "active" : ""}`}
          onClick={() => setTheme("light")}
          title="Light theme with professional palette"
        >
          <div className="theme-preview light-theme">
            <div className="color-dot" style={{ backgroundColor: "#2d4a2b" }} />
            <div className="color-dot" style={{ backgroundColor: "#4a6b47" }} />
            <div className="color-dot" style={{ backgroundColor: "#f8f9fa" }} />
          </div>
          <span>Light</span>
        </button>

        <button
          className={`theme-option ${theme === "dark" ? "active" : ""}`}
          onClick={() => setTheme("dark")}
          title="Dark theme with professional palette"
        >
          <div className="theme-preview dark-theme">
            <div className="color-dot" style={{ backgroundColor: "#2d4a2b" }} />
            <div className="color-dot" style={{ backgroundColor: "#4a6b47" }} />
            <div className="color-dot" style={{ backgroundColor: "#1a2419" }} />
          </div>
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector;
