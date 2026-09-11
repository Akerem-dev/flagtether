import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "./Icon";

const githubUrl = "https://github.com/Akerem-dev/releasepilot";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
        >
          Menu
        </button>
        <a href="/flags" className="mobile-brand" aria-label="FlagTether home">
          <Icon name="brand-mark" size={20} />
          <strong>FlagTether</strong>
        </a>
      </header>

      {mobileOpen ? (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      ) : null}

      <aside id="app-sidebar" className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand" aria-label="FlagTether">
          <Icon name="brand-mark" size={20} className="brand-icon" />
          <span>FlagTether</span>
        </div>

        <div className="sidebar-section sidebar-project-section">
          <span className="sidebar-section-label">Project</span>
          <button className="project-switcher" type="button" title="Current project">
            <Icon name="project" size={20} />
            <span>flagtether-api</span>
            <Icon name="chevron-down" size={16} className="project-chevron" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <span className="sidebar-section-label">Manage</span>
          <NavLink
            to="/flags"
            onClick={closeMobile}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon name="flags" size={20} />
            <span>Flags</span>
          </NavLink>
          <NavLink
            to="/audit"
            onClick={closeMobile}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon name="audit-log" size={20} />
            <span>Audit log</span>
          </NavLink>

          <span className="sidebar-section-label developer-label">Developer</span>
          <NavLink
            to="/api"
            onClick={closeMobile}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon name="api" size={20} />
            <span>API</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <a className="sidebar-footer-link" href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer">
            <Icon name="docs" size={20} />
            <span>Docs</span>
            <Icon name="external-link" size={16} className="external-icon" />
          </a>
          <a className="sidebar-footer-link" href={githubUrl} target="_blank" rel="noreferrer">
            <Icon name="repository" size={20} />
            <span>GitHub</span>
            <Icon name="external-link" size={16} className="external-icon" />
          </a>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
