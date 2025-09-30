"use client";

import React, { useState, useEffect } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useTheme } from "./ThemeProvider";
import "./Navigation.css";

interface NavigationProps {
  user?: any; // Using any to allow access to all user properties for debugging
  onSignOut?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onSignOut }) => {
  const { theme, setTheme } = useTheme();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userAttributes, setUserAttributes] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch user attributes when component mounts or user changes
  useEffect(() => {
    async function getUserAttributes() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes();
          console.log("Fetched user attributes:", attributes);
          setUserAttributes(attributes);
        } catch (error) {
          console.error("Error fetching user attributes:", error);
        }
      }
    }

    getUserAttributes();
  }, [user]);

  // Function to get display name with proper fallback
  const getDisplayName = () => {
    if (userAttributes?.name) return userAttributes.name;
    if (userAttributes?.given_name) return userAttributes.given_name;
    if (user?.signInDetails?.loginId) return user.signInDetails.loginId;
    return user?.username;
  };

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setActiveDropdown(null); // Close any open dropdowns when opening mobile menu
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  // Close mobile menu when clicking outside
  const handleNavClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeDropdowns();
      closeMobileMenu();
    }
  };

  return (
    <nav className="navigation" onClick={handleNavClick}>
      <div className="nav-container">
        {/* Logo and Brand */}
        <div className="nav-brand">
          <div className="nav-logo">
            <img
              src="/logo.png"
              alt="Lotto Fleet"
              className="logo-image"
              style={{ height: "32px", width: "auto", marginRight: "8px" }}
            />
            <span className="brand-text">Admin Dashboard</span>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className={`mobile-menu-toggle ${isMobileMenuOpen ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleMobileMenu();
          }}
          aria-label="Toggle mobile menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Navigation Menu */}
        <div className="nav-menu">
          <a href="/" className="nav-item">
            Inicio
          </a>

          <div className="nav-dropdown">
            <button
              className="nav-item dropdown-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown("apps");
              }}
            >
              Aplicaciones
              <span className="dropdown-arrow">▼</span>
            </button>
            {activeDropdown === "apps" && (
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                >
                  🚧 Próximamente
                </div>
              </div>
            )}
          </div>

          <div className="nav-dropdown">
            <button
              className="nav-item dropdown-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown("tools");
              }}
            >
              Dev
              <span className="dropdown-arrow">▼</span>
            </button>
            {activeDropdown === "tools" && (
              <div className="dropdown-menu">
                <a href="/color-palette-demo" className="dropdown-item">
                  🎨 Demo de Paleta de Colores
                </a>
                <a href="/test-theme" className="dropdown-item">
                  🎭 Test de Temas
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Theme Toggle and User Menu */}
        <div className="nav-actions">
          {/* Theme Toggle */}
          <div className="theme-toggle">
            <button
              className={`theme-btn ${theme === "light" ? "active" : ""}`}
              onClick={() => setTheme("light")}
              title="Tema claro"
            >
              ☀️
            </button>
            <button
              className={`theme-btn ${theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
              title="Tema oscuro"
            >
              🌙
            </button>
          </div>

          {/* User Menu */}
          {user && (
            <div className="nav-dropdown">
              <button
                className="nav-item user-menu-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown("user");
                }}
              >
                <span className="user-icon">👤</span>
                <span className="user-name">{getDisplayName()}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {activeDropdown === "user" && (
                <div className="dropdown-menu user-dropdown">
                  <div className="dropdown-item user-info">
                    <strong>{getDisplayName()}</strong>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item logout-btn"
                    onClick={onSignOut}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Menu Header */}
            <div className="mobile-menu-header">
              <div className="mobile-menu-logo">
                <img
                  src="/logo.png"
                  alt="Lotto Fleet"
                  className="logo-image"
                  style={{ height: "24px", width: "auto", marginRight: "8px" }}
                />
                <span className="brand-text">Admin Dashboard</span>
              </div>
              <button
                className="mobile-menu-close"
                onClick={closeMobileMenu}
                aria-label="Close mobile menu"
              >
                ✕
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="mobile-menu-content">
              {/* Home Link */}
              <a href="/" className="mobile-nav-item" onClick={closeMobileMenu}>
                🏠 Inicio
              </a>

              {/* Apps Section */}
              <div className="mobile-nav-section">
                <div className="mobile-nav-section-title">📱 Aplicaciones</div>
                <div className="mobile-nav-section-items">
                  <div className="mobile-nav-item disabled">
                    🚧 Próximamente
                  </div>
                </div>
              </div>

              {/* Dev Section */}
              <div className="mobile-nav-section">
                <div className="mobile-nav-section-title">⚙️ Dev</div>
                <div className="mobile-nav-section-items">
                  <a
                    href="/color-palette-demo"
                    className="mobile-nav-item"
                    onClick={closeMobileMenu}
                  >
                    🎨 Demo de Paleta de Colores
                  </a>
                  <a
                    href="/test-theme"
                    className="mobile-nav-item"
                    onClick={closeMobileMenu}
                  >
                    Test de Temas
                  </a>
                </div>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="mobile-nav-section">
                <div className="mobile-nav-section-title">� Tema</div>
                <div className="mobile-theme-toggle">
                  <button
                    className={`mobile-theme-btn ${
                      theme === "light" ? "active" : ""
                    }`}
                    onClick={() => setTheme("light")}
                  >
                    ☀️ Claro
                  </button>
                  <button
                    className={`mobile-theme-btn ${
                      theme === "dark" ? "active" : ""
                    }`}
                    onClick={() => setTheme("dark")}
                  >
                    � Oscuro
                  </button>
                </div>
              </div>

              {/* User Section */}
              {user && (
                <div className="mobile-nav-section">
                  <div className="mobile-nav-section-title">👤 Usuario</div>
                  <div className="mobile-nav-section-items">
                    <div className="mobile-nav-item user-info">
                      <strong>{getDisplayName()}</strong>
                    </div>
                    <button
                      className="mobile-nav-item logout-btn"
                      onClick={() => {
                        onSignOut?.();
                        closeMobileMenu();
                      }}
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
