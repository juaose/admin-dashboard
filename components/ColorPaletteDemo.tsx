import React from "react";

const ColorPaletteDemo: React.FC = () => {
  const colors = [
    {
      name: "Primary Green",
      variable: "--brand-primary",
      hex: "#67c534",
      description: "Main brand color",
    },
    {
      name: "Primary Green (Alt)",
      variable: "--brand-primary-alt",
      hex: "#67c530",
      description: "Alternative primary",
    },
    {
      name: "Light Green",
      variable: "--brand-secondary",
      hex: "#94d36b",
      description: "Secondary/accent color",
    },
    {
      name: "Brand Dark",
      variable: "--brand-dark",
      hex: "#181d16",
      description: "Dark backgrounds",
    },
    {
      name: "Brand White",
      variable: "--brand-white",
      hex: "#ffffff",
      description: "Light backgrounds",
    },
  ];

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ color: "var(--brand-dark)", marginBottom: "1.5rem" }}>
        Brand Color Palette
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {colors.map((color) => (
          <div
            key={color.variable}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                height: "80px",
                backgroundColor: `var(${color.variable})`,
                border: color.hex === "#ffffff" ? "1px solid #e0e0e0" : "none",
              }}
            />
            <div style={{ padding: "1rem" }}>
              <h3
                style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "1rem",
                  color: "var(--brand-dark)",
                }}
              >
                {color.name}
              </h3>
              <p
                style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "0.875rem",
                  color: "#666",
                  fontFamily: "monospace",
                }}
              >
                {color.hex}
              </p>
              <p
                style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "0.875rem",
                  color: "#666",
                  fontFamily: "monospace",
                }}
              >
                var({color.variable})
              </p>
              <p
                style={{
                  margin: "0",
                  fontSize: "0.875rem",
                  color: "#888",
                }}
              >
                {color.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ color: "var(--brand-dark)", marginBottom: "1rem" }}>
          Button Examples
        </h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "var(--brand-white)",
              border: "1px solid var(--brand-primary)",
              padding: "0.75rem 1.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Primary Button
          </button>

          <button
            style={{
              backgroundColor: "transparent",
              color: "var(--brand-primary)",
              border: "1px solid var(--brand-primary)",
              padding: "0.75rem 1.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Secondary Button
          </button>

          <button
            style={{
              backgroundColor: "var(--brand-secondary)",
              color: "var(--brand-dark)",
              border: "1px solid var(--brand-secondary)",
              padding: "0.75rem 1.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Accent Button
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ color: "var(--brand-dark)", marginBottom: "1rem" }}>
          Alert Examples
        </h3>
        <div
          style={{
            backgroundColor: "rgba(var(--brand-primary-rgb), 0.1)",
            border: "1px solid var(--brand-primary)",
            borderRadius: "4px",
            padding: "1rem",
            color: "var(--brand-dark)",
            marginBottom: "0.5rem",
          }}
        >
          <strong>Success:</strong> This is a success message using brand
          colors.
        </div>

        <div
          style={{
            backgroundColor: "rgba(var(--brand-secondary-rgb), 0.15)",
            border: "1px solid var(--brand-secondary)",
            borderRadius: "4px",
            padding: "1rem",
            color: "var(--brand-dark)",
          }}
        >
          <strong>Info:</strong> This is an info message using secondary brand
          colors.
        </div>
      </div>
    </div>
  );
};

export default ColorPaletteDemo;
