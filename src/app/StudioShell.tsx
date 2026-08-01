import { useState } from "react";

import { StudioSidebar } from "../components/layout/StudioSidebar";
import { StudioTopbar } from "../components/layout/StudioTopbar";

type StudioView = "library" | "settings";

export function StudioShell() {
  const [activeView, setActiveView] =
    useState<StudioView>("library");

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  return (
    <div
      className={
        sidebarCollapsed
          ? "studio-shell studio-shell--sidebar-collapsed"
          : "studio-shell"
      }
      dir="rtl"
    >
      <StudioSidebar
        activeView={activeView}
        onShowLibrary={() => {
          setActiveView("library");
        }}
        onShowSettings={() => {
          setActiveView("settings");
        }}
        onCreateProject={() => {
          setActiveView("library");
        }}
      />

      <div className="studio-main">
        <StudioTopbar
          title={
            activeView === "library"
              ? "مكتبة المشاريع"
              : "الإعدادات"
          }
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => {
            setSidebarCollapsed(
              (currentValue) => !currentValue,
            );
          }}
        />

        <section className="studio-workspace">
          {activeView === "library" ? (
            <LibraryPlaceholder />
          ) : (
            <SettingsPlaceholder />
          )}
        </section>
      </div>
    </div>
  );
}

function LibraryPlaceholder() {
  return (
    <main className="library-view">
      <header className="library-heading">
        <div>
          <h1>مكتبة المشاريع</h1>
          <p>لا توجد مشاريع محفوظة حاليًا.</p>
        </div>

        <button
          type="button"
          className="primary-button"
        >
          مشروع جديد
        </button>
      </header>

      <section className="library-empty-state">
        <div className="empty-state-mark">
          SW
        </div>

        <h2>لا توجد مشاريع بعد</h2>

        <p>
          أنشئ مشروعك الأول، ثم ابدأ بناء
          الحكاية والشخصيات والحلقات والمشاهد.
        </p>

        <button
          type="button"
          className="primary-button"
        >
          إنشاء أول مشروع
        </button>
      </section>
    </main>
  );
}

function SettingsPlaceholder() {
  return (
    <main className="settings-view">
      <div className="settings-card">
        <div className="settings-mark">إ</div>

        <h1>إعدادات التطبيق</h1>

        <p>
          ستضم هذه المساحة إعدادات اللغة
          والمظهر والحفظ والطباعة والتصدير.
        </p>
      </div>
    </main>
  );
}