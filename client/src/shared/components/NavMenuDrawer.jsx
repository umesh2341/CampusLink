import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, MessageSquare, Info, ChevronRight, ExternalLink } from 'lucide-react';

function NavMenuDrawer({
  isOpen,
  onClose,
  onOpenNotifications,
  onOpenFeedback,
  onOpenAbout,
  onOpenAddNotice,
  isOrganizer,
  isCoAdmin,
  isAdmin,
  onOpenAdminRequests,
}) {
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
    {
      id: 'community',
      label: 'Community Hub',
      description: 'Join the official ITER student Discord',
      icon: MessageSquare,
      onClick: () => {
        window.open('https://discord.gg/iter-campus', '_blank', 'noopener,noreferrer');
      },
      badge: 'DISCORD',
      external: true,
    },
    {
      id: 'feedback',
      label: 'Send Feedback',
      description: 'Report bugs or submit suggestions',
      icon: MessageCircle,
      onClick: () => {
        onClose();
        if (onOpenFeedback) onOpenFeedback();
      },
    },
    {
      id: 'about',
      label: 'About CampusLink',
      description: 'System specifications & platform info',
      icon: Info,
      onClick: () => {
        onClose();
        if (onOpenAbout) onOpenAbout();
      },
      badge: 'V2.0',
    },
  ];

  if (isAdmin) {
    menuItems.push({
      id: 'admin_requests',
      label: 'Admin Requests',
      description: 'Review role requests',
      icon: ExternalLink,
      onClick: () => {
        onClose();
        if (onOpenAdminRequests) onOpenAdminRequests();
      },
      badge: 'ADMIN',
    });
  }

  if (isCoAdmin) {
    menuItems.unshift({
      id: 'post_notice',
      label: 'Post Notice',
      description: 'Broadcast announcement to campus',
      icon: Bell,
      onClick: () => {
        onClose();
        if (onOpenAddNotice) onOpenAddNotice();
      },
      badge: 'CO-ADMIN',
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop contained inside main viewport area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink/30 backdrop-blur-xs z-40"
            onClick={onClose}
          />

          {/* Slide-in Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="absolute inset-y-0 right-0 z-40 w-full max-w-xs sm:max-w-sm bg-paper border-l-2 border-ink shadow-hard-xl flex flex-col font-mono"
          >
            {/* Drawer Header Strip */}
            <div className="bg-ink text-paper px-4 py-3 flex items-center justify-center shrink-0">
              <span className="text-xs uppercase tracking-widest font-bold">
                [ TERMINAL MENU ]
              </span>
            </div>

            {/* Menu Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-grain">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="w-full text-left bg-card hover:bg-paper border-2 border-ink shadow-hard hover:shadow-hard-lg rounded-xs p-3 flex items-center justify-between group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] active:translate-x-[1px] active:translate-y-[1px] focus:outline-none cursor-pointer"
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
                    {item.external ? (
                      <ExternalLink className="w-4 h-4 text-ink/40 group-hover:text-ink shrink-0 ml-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-ink/40 group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    )}
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default NavMenuDrawer;

