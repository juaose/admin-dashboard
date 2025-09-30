"use client";

import React from "react";

interface BotStatusLEDProps {
  isConnected: boolean; // Socket connection status
  isLoggedIn: boolean; // Authentication/session status
  size?: "small" | "medium" | "large";
  orientation?: "horizontal" | "vertical";
  showLabels?: boolean;
}

export function BotStatusLED({
  isConnected,
  isLoggedIn,
  size = "medium",
  orientation = "horizontal",
  showLabels = false,
}: BotStatusLEDProps) {
  // Size configurations - made larger and more visible
  const sizeConfig = {
    small: {
      ledSize: "12px",
      gap: "8px",
      fontSize: "0.75rem",
      padding: "8px",
      labelGap: "6px",
    },
    medium: {
      ledSize: "16px",
      gap: "12px",
      fontSize: "0.85rem",
      padding: "12px",
      labelGap: "8px",
    },
    large: {
      ledSize: "20px",
      gap: "16px",
      fontSize: "0.9rem",
      padding: "16px",
      labelGap: "10px",
    },
  };

  const config = sizeConfig[size];

  // Updated colors to match application palette
  const connectionLED = {
    color: isConnected ? "#28a745" : "#dc3545", // Bootstrap-like green/red
    shadow: isConnected
      ? "0 0 12px rgba(40, 167, 69, 0.8)"
      : "0 0 12px rgba(220, 53, 69, 0.8)",
    label: isConnected ? "Conectado" : "Sin Conexión",
    bgColor: isConnected ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
  };

  const sessionLED = {
    color: isLoggedIn ? "#28a745" : "#dc3545",
    shadow: isLoggedIn
      ? "0 0 12px rgba(40, 167, 69, 0.8)"
      : "0 0 12px rgba(220, 53, 69, 0.8)",
    label: isLoggedIn ? "Sesión" : "Sin Sesión",
    bgColor: isLoggedIn ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
  };

  // Session status is always relevant - show actual login state
  const effectiveSessionLED = sessionLED;

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: orientation === "horizontal" ? "row" : "column",
    alignItems: "center",
    gap: config.gap,
    padding: config.padding,
    backgroundColor: "var(--bg-primary, rgba(33, 37, 41, 0.95))",
    borderRadius: "8px",
    border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  };

  const ledItemStyle = (led: typeof connectionLED): React.CSSProperties => ({
    display: "flex",
    flexDirection: orientation === "horizontal" ? "column" : "row",
    alignItems: "center",
    gap: config.labelGap,
    padding: "4px 8px",
    borderRadius: "6px",
    backgroundColor: led.bgColor,
    border: `1px solid ${led.color}20`,
    minWidth: showLabels ? "80px" : "auto",
  });

  const ledStyle = (led: typeof connectionLED): React.CSSProperties => ({
    width: config.ledSize,
    height: config.ledSize,
    borderRadius: "50%",
    backgroundColor: led.color,
    boxShadow: led.shadow,
    border: `2px solid ${led.color}40`,
    transition: "all 0.3s ease",
    flexShrink: 0,
  });

  const labelStyle: React.CSSProperties = {
    fontSize: config.fontSize,
    color: "var(--text-primary, #ffffff)",
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
  };

  return (
    <div style={containerStyle} title="Estado del Bot: Conexión | Sesión">
      {/* Connection LED */}
      <div style={ledItemStyle(connectionLED)}>
        <div style={ledStyle(connectionLED)} />
        {showLabels && <div style={labelStyle}>{connectionLED.label}</div>}
      </div>

      {/* Session LED */}
      <div style={ledItemStyle(effectiveSessionLED)}>
        <div style={ledStyle(effectiveSessionLED)} />
        {showLabels && (
          <div style={labelStyle}>{effectiveSessionLED.label}</div>
        )}
      </div>
    </div>
  );
}

// Utility component for compact use in bot selection
export function BotStatusLEDCompact({
  isConnected,
  isLoggedIn,
}: {
  isConnected: boolean;
  isLoggedIn: boolean;
}) {
  return (
    <BotStatusLED
      isConnected={isConnected}
      isLoggedIn={isLoggedIn}
      size="small"
      orientation="horizontal"
      showLabels={false}
    />
  );
}

// Utility component with Spanish labels for detailed view
export function BotStatusLEDWithLabels({
  isConnected,
  isLoggedIn,
}: {
  isConnected: boolean;
  isLoggedIn: boolean;
}) {
  return (
    <BotStatusLED
      isConnected={isConnected}
      isLoggedIn={isLoggedIn}
      size="medium"
      orientation="horizontal"
      showLabels={true}
    />
  );
}
