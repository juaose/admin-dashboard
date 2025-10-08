"use client";

import React, { useState, useEffect } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useTheme } from "./ThemeProvider";

interface NavigationProps {
  user?: any;
  onSignOut?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onSignOut }) => {
  const { theme, setTheme } = useTheme();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userAttributes, setUserAttributes] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setActiveDropdown(null);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const handleNavClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeDropdowns();
      closeMobileMenu();
    }
  };

  return (
    <nav
      className="bg-gradient-to-r from-brand-primary to-brand-primary-alt dark:from-gray-800 dark:to-gray-900 text-white shadow-lg sticky top-0 z-50"
      onClick={handleNavClick}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Logo and Brand */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Lotto Fleet" className="h-8 w-auto" />
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className={`md:hidden flex flex-col gap-1.5 p-2 rounded transition-transform ${
              isMobileMenuOpen ? "rotate-90" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleMobileMenu();
            }}
            aria-label="Toggle mobile menu"
          >
            <span
              className={`block w-6 h-0.5 bg-white transition-all ${
                isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-white transition-all ${
                isMobileMenuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-white transition-all ${
                isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            ></span>
          </button>

          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex items-center gap-1">
            <a
              href="/"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Inicio
            </a>

            <a
              href="/jugadores"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Jugadores
            </a>

            <a
              href="/reportes"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Reportes
            </a>

            {/* Directorios Dropdown */}
            <div className="relative">
              <button
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown("directorios");
                }}
              >
                Directorios
                <span
                  className={`text-xs transition-transform ${
                    activeDropdown === "directorios" ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {activeDropdown === "directorios" && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                  <a
                    href="/directorios/telefonos"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Teléfonos
                  </a>
                  <a
                    href="/directorios/cuentas"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cuentas
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Theme Toggle and User Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
              <button
                className={`px-3 py-1.5 rounded text-sm transition-all ${
                  theme === "light"
                    ? "bg-white text-brand-primary shadow"
                    : "text-white/70 hover:text-white"
                }`}
                onClick={() => setTheme("light")}
                title="Tema claro"
              >
                ☀️
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm transition-all ${
                  theme === "dark"
                    ? "bg-gray-700 text-white shadow"
                    : "text-white/70 hover:text-white"
                }`}
                onClick={() => setTheme("dark")}
                title="Tema oscuro"
              >
                🌙
              </button>
            </div>

            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown("user");
                  }}
                >
                  <span className="text-lg">👤</span>
                  <span className="text-sm font-medium hidden lg:inline">
                    {getDisplayName()}
                  </span>
                  <span
                    className={`text-xs transition-transform ${
                      activeDropdown === "user" ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {activeDropdown === "user" && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                      {getDisplayName()}
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        >
          <div
            className="fixed inset-y-0 left-0 w-80 max-w-full bg-white dark:bg-gray-800 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Lotto Fleet" className="h-6 w-auto" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Admin Dashboard
                </span>
              </div>
              <button
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-2xl leading-none"
                onClick={closeMobileMenu}
                aria-label="Close mobile menu"
              >
                ✕
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="p-4">
              <a
                href="/"
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                onClick={closeMobileMenu}
              >
                🏠 Inicio
              </a>

              <a
                href="/jugadores"
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium mt-2"
                onClick={closeMobileMenu}
              >
                👥 Jugadores
              </a>

              <a
                href="/reportes"
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium mt-2"
                onClick={closeMobileMenu}
              >
                📊 Reportes
              </a>

              {/* Directorios Section */}
              <div className="mt-4">
                <div className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  📋 Directorios
                </div>
                <div className="ml-4 space-y-1">
                  <a
                    href="/directorios/telefonos"
                    className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={closeMobileMenu}
                  >
                    Teléfonos
                  </a>
                  <a
                    href="/directorios/cuentas"
                    className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={closeMobileMenu}
                  >
                    Cuentas
                  </a>
                </div>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  🎨 Tema
                </div>
                <div className="flex gap-2 px-4 mt-2">
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      theme === "light"
                        ? "bg-brand-primary text-white shadow"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => setTheme("light")}
                  >
                    ☀️ Claro
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      theme === "dark"
                        ? "bg-gray-700 text-white shadow"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => setTheme("dark")}
                  >
                    🌙 Oscuro
                  </button>
                </div>
              </div>

              {/* User Section */}
              {user && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    👤 Usuario
                  </div>
                  <div className="px-4 py-2 text-gray-900 dark:text-gray-100 font-medium">
                    {getDisplayName()}
                  </div>
                  <button
                    className="w-full mt-2 px-4 py-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 font-medium transition-colors"
                    onClick={() => {
                      onSignOut?.();
                      closeMobileMenu();
                    }}
                  >
                    🚪 Cerrar Sesión
                  </button>
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
