import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';

function NavMenuDrawer({
  isOpen,
  onClose,
  onOpenNotifications,
  isOrganizer,
}) {
  if (!isOpen) return null;

  // Extensible list of menu options (kept array-driven for easy future additions)
  const menuItems = [
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Alert preferences & club subscriptions',
      icon: Bell,
      onClick: () => {
        onClose();
        onOpenNotifications();
      },
      badge: 'PUSH ALERTS',
    },
  ];

  return (
    <>
      {/* Backdrop contained inside main viewport area */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Drawer contained precisely between Header bottom border and Bottom Nav top border */}
      <aside
        className={`absolute inset-y-0 right-0 z-40 w-full max-w-xs sm:max-w-sm bg-paper border-l-2 border-ink shadow-hard-xl flex flex-col font-mono transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-grain">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-full text-left bg-card hover:bg-paper border-2 border-ink shadow-hard hover:shadow-hard-lg rounded-xs p-3 flex items-center justify-between group transition-all active:translate-x-[1px] active:translate-y-[1px] focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xs bg-paper border-2 border-ink flex items-center justify-center group-hover:bg-signal group-hover:text-ink transition-colors shrink-0">
                    <Icon className="w-5 h-5 text-ink" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm uppercase text-ink group-hover:text-signal transition-colors">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-signal/20 text-ink border border-ink rounded-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted leading-tight mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink/40 group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            );
          })}
        </div>

        {/* Footer info strip */}
        <div className="bg-card border-t-2 border-ink p-3 shrink-0 text-center">
          <p className="text-[10px] text-muted uppercase font-bold tracking-widest">
            ITER, SOA UNIVERSITY • KIOSK V2.0
          </p>
        </div>
      </aside>
    </>
  );
}

export default NavMenuDrawer;
