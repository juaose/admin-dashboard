"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SpanishNavigation.module.css";

interface NavigationItem {
  name: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "🏠",
  },
  {
    name: "Depósitos",
    href: "/depositos",
    icon: "💰",
    children: [
      {
        name: "Por banco de procedencia",
        href: "/depositos/banco-procedencia",
      },
      { name: "Por banco de destino", href: "/depositos/banco-destino" },
      { name: "Por cuenta de destino", href: "/depositos/cuenta-destino" },
      { name: "Por método de pago", href: "/depositos/metodo-pago" },
    ],
  },
  {
    name: "Retiros",
    href: "/retiros",
    icon: "🏆",
    children: [
      { name: "Por banco de destino", href: "/retiros/banco-destino" },
      { name: "Por tienda", href: "/retiros/tienda" },
      { name: "Por jugador", href: "/retiros/jugador" },
    ],
  },
  {
    name: "Jugadores",
    href: "/jugadores",
    icon: "👥",
  },
  {
    name: "Recargas",
    href: "/recargas",
    icon: "⚡",
    children: [
      { name: "Por tienda", href: "/recargas/tienda" },
      { name: "Por jugador", href: "/recargas/jugador" },
    ],
  },
  {
    name: "Promociones",
    href: "/promociones",
    icon: "🎁",
  },
  {
    name: "Directorios",
    href: "/directorios",
    icon: "📋",
    children: [
      { name: "Teléfonos", href: "/directorios/telefonos" },
      { name: "Cuentas", href: "/directorios/cuentas" },
    ],
  },
];

export default function SpanishNavigation() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const isExpanded = (href: string) => expandedItems.has(href);

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <Link href="/dashboard" className={styles.logoLink}>
          🎲 Lotto Admin
        </Link>
      </div>

      <ul className={styles.navList}>
        {navigationItems.map((item) => (
          <li key={item.href} className={styles.navItem}>
            <div
              className={`${styles.navLink} ${
                isActive(item.href) ? styles.active : ""
              }`}
              onClick={() => item.children && toggleItem(item.href)}
            >
              {item.children ? (
                <span className={styles.expandableLink}>
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.name}</span>
                  <span
                    className={`${styles.arrow} ${
                      isExpanded(item.href) ? styles.expanded : ""
                    }`}
                  >
                    ▶
                  </span>
                </span>
              ) : (
                <Link href={item.href} className={styles.link}>
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.name}</span>
                </Link>
              )}
            </div>

            {item.children && isExpanded(item.href) && (
              <ul className={styles.subMenu}>
                {item.children.map((child) => (
                  <li key={child.href} className={styles.subItem}>
                    <Link
                      href={child.href}
                      className={`${styles.subLink} ${
                        isActive(child.href) ? styles.active : ""
                      }`}
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <div className={styles.status}>
          <div className={styles.statusIndicator}></div>
          <span>Sistema Activo</span>
        </div>
      </div>
    </nav>
  );
}
