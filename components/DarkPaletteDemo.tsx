"use client";

import React, { useState } from "react";
import "./DarkPaletteDemo.css";

interface ColorSwatch {
  name: string;
  variable: string;
  hex: string;
  rgb: string;
  usage: string;
}

const DarkPaletteDemo: React.FC = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const primaryColors: ColorSwatch[] = [
    {
      name: "Forest Green",
      variable: "--forest-primary",
      hex: "#2d4a2b",
      rgb: "45, 74, 43",
      usage: "Primary buttons, key UI elements",
    },
    {
      name: "Sage Green",
      variable: "--sage-secondary",
      hex: "#4a6b47",
      rgb: "74, 107, 71",
      usage: "Secondary buttons, hover states",
    },
    {
      name: "Pine Green",
      variable: "--pine-accent",
      hex: "#1a2419",
      rgb: "26, 36, 25",
      usage: "Dark backgrounds, navigation",
    },
  ];

  const grayScale: ColorSwatch[] = [
    {
      name: "Charcoal",
      variable: "--charcoal",
      hex: "#2c2c2c",
      rgb: "44, 44, 44",
      usage: "Primary text, main content backgrounds",
    },
    {
      name: "Slate",
      variable: "--slate",
      hex: "#404040",
      rgb: "64, 64, 64",
      usage: "Secondary backgrounds, cards",
    },
    {
      name: "Ash",
      variable: "--ash",
      hex: "#5a5a5a",
      rgb: "90, 90, 90",
      usage: "Borders, dividers, inactive elements",
    },
    {
      name: "Mist",
      variable: "--mist",
      hex: "#7a7a7a",
      rgb: "122, 122, 122",
      usage: "Secondary text, placeholders",
    },
    {
      name: "Fog",
      variable: "--fog",
      hex: "#9a9a9a",
      rgb: "154, 154, 154",
      usage: "Subtle text, hints, metadata",
    },
  ];

  const accentColors: ColorSwatch[] = [
    {
      name: "Mint Highlight",
      variable: "--mint-highlight",
      hex: "#7fb069",
      rgb: "127, 176, 105",
      usage: "Success states (use sparingly)",
    },
    {
      name: "Emerald Focus",
      variable: "--emerald-focus",
      hex: "#5a8a4f",
      rgb: "90, 138, 79",
      usage: "Focus states, active selections",
    },
  ];

  const neutralColors: ColorSwatch[] = [
    {
      name: "Pure White",
      variable: "--pure-white",
      hex: "#ffffff",
      rgb: "255, 255, 255",
      usage: "Text on dark backgrounds",
    },
    {
      name: "Off White",
      variable: "--off-white",
      hex: "#f8f8f8",
      rgb: "248, 248, 248",
      usage: "Light theme backgrounds",
    },
    {
      name: "Deep Black",
      variable: "--deep-black",
      hex: "#0f0f0f",
      rgb: "15, 15, 15",
      usage: "Maximum contrast text",
    },
  ];

  const ColorSwatchComponent: React.FC<{ color: ColorSwatch }> = ({
    color,
  }) => (
    <div className="color-swatch">
      <div
        className="color-preview"
        style={{ backgroundColor: color.hex }}
        title={`${color.name}: ${color.hex}`}
      />
      <div className="color-info">
        <h4>{color.name}</h4>
        <div className="color-values">
          <span className="hex">{color.hex}</span>
          <span className="rgb">rgb({color.rgb})</span>
          <span className="variable">{color.variable}</span>
        </div>
        <p className="usage">{color.usage}</p>
      </div>
    </div>
  );

  return (
    <div className={`dark-palette-demo ${theme}-theme`}>
      <header className="demo-header">
        <h1>Dark Color Palette Demo</h1>
        <p>
          A sophisticated, professional color palette emphasizing darker greens
          and grays
        </p>

        <div className="theme-toggle">
          <button
            className={theme === "dark" ? "active" : ""}
            onClick={() => setTheme("dark")}
          >
            Dark Theme
          </button>
          <button
            className={theme === "light" ? "active" : ""}
            onClick={() => setTheme("light")}
          >
            Light Theme
          </button>
        </div>
      </header>

      <main className="demo-content">
        <section className="color-section">
          <h2>Primary Colors</h2>
          <div className="color-grid">
            {primaryColors.map((color) => (
              <ColorSwatchComponent key={color.name} color={color} />
            ))}
          </div>
        </section>

        <section className="color-section">
          <h2>Gray Scale</h2>
          <div className="color-grid">
            {grayScale.map((color) => (
              <ColorSwatchComponent key={color.name} color={color} />
            ))}
          </div>
        </section>

        <section className="color-section">
          <h2>Accent Colors (Minimal Light Green Usage)</h2>
          <div className="color-grid">
            {accentColors.map((color) => (
              <ColorSwatchComponent key={color.name} color={color} />
            ))}
          </div>
        </section>

        <section className="color-section">
          <h2>Neutral Colors</h2>
          <div className="color-grid">
            {neutralColors.map((color) => (
              <ColorSwatchComponent key={color.name} color={color} />
            ))}
          </div>
        </section>

        <section className="component-examples">
          <h2>Component Examples</h2>

          <div className="example-section">
            <h3>Buttons</h3>
            <div className="button-examples">
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Button</button>
              <button className="btn-success">Success Button</button>
              <button className="btn-disabled" disabled>
                Disabled Button
              </button>
            </div>
          </div>

          <div className="example-section">
            <h3>Cards</h3>
            <div className="card-examples">
              <div className="demo-card">
                <div className="card-header">
                  <h4>Sample Card</h4>
                </div>
                <div className="card-content">
                  <p>
                    This is an example of how cards would look with the new
                    color palette. Notice the subtle use of colors and excellent
                    contrast.
                  </p>
                  <div className="card-actions">
                    <button className="btn-primary">Action</button>
                    <button className="btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>

              <div className="demo-card elevated">
                <div className="card-header">
                  <h4>Elevated Card</h4>
                  <span className="status-badge success">Active</span>
                </div>
                <div className="card-content">
                  <p>
                    This card shows elevated styling with status indicators. The
                    mint highlight is used sparingly for success states.
                  </p>
                  <div className="stats">
                    <div className="stat">
                      <span className="stat-label">Users</span>
                      <span className="stat-value">1,234</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Revenue</span>
                      <span className="stat-value">$45,678</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="example-section">
            <h3>Form Elements</h3>
            <div className="form-examples">
              <div className="form-group">
                <label htmlFor="demo-input">Sample Input</label>
                <input
                  id="demo-input"
                  type="text"
                  placeholder="Enter some text..."
                  defaultValue="Sample text"
                />
              </div>
              <div className="form-group">
                <label htmlFor="demo-select">Sample Select</label>
                <select id="demo-select">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" defaultChecked />
                  Sample checkbox with label
                </label>
              </div>
            </div>
          </div>

          <div className="example-section">
            <h3>Navigation</h3>
            <nav className="demo-nav">
              <div className="nav-brand">Brand</div>
              <ul className="nav-links">
                <li>
                  <a href="#" className="active">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#">Reports</a>
                </li>
                <li>
                  <a href="#">Settings</a>
                </li>
                <li>
                  <a href="#">Help</a>
                </li>
              </ul>
            </nav>
          </div>
        </section>

        <section className="comparison-section">
          <h2>Comparison with Original Palette</h2>
          <div className="comparison-grid">
            <div className="comparison-item">
              <h4>Original Bright Green</h4>
              <div
                className="color-preview"
                style={{ backgroundColor: "#67c534" }}
              />
              <span>#67c534</span>
              <p>Too bright for extended use in admin interfaces</p>
            </div>
            <div className="comparison-item">
              <h4>New Forest Green</h4>
              <div
                className="color-preview"
                style={{ backgroundColor: "#2d4a2b" }}
              />
              <span>#2d4a2b</span>
              <p>Professional, easier on the eyes for long work sessions</p>
            </div>
            <div className="comparison-item">
              <h4>Original Light Green</h4>
              <div
                className="color-preview"
                style={{ backgroundColor: "#94d36b" }}
              />
              <span>#94d36b</span>
              <p>Used sparingly in new palette</p>
            </div>
            <div className="comparison-item">
              <h4>New Mint Highlight</h4>
              <div
                className="color-preview"
                style={{ backgroundColor: "#7fb069" }}
              />
              <span>#7fb069</span>
              <p>Toned down, used only for success states</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DarkPaletteDemo;
