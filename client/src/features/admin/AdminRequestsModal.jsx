import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../shared/lib/supabaseClient';
import { useAuth } from '../../shared/context/AuthContext';
import { Check, X, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

export default function AdminRequestsModal({ isOpen, onClose }) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_requests')
        .select(`
          id,
          requested_role,
          status,
          created_at,
          user_id,
          profiles:user_id ( full_name, email )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching role requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const handleAction = async (requestId, userId, requestedRole, action) => {
    if (!profile) return;
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      // Update request status
      const { error: reqError } = await supabase
        .from('role_requests')
        .update({
          status: newStatus,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (reqError) throw reqError;

      // If approved, update the profile role
      if (action === 'approve') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: requestedRole })
          .eq('id', userId);
          
        if (profileError) throw profileError;
      }

      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error(`Error processing ${action}:`, error);
      alert(`Failed to ${action} request.`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-mono">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-paper border-4 border-ink shadow-hard-xl relative z-50 flex flex-col w-full max-w-2xl max-h-full overflow-hidden"
          >
            {/* Header */}
            <header className="bg-ink text-paper px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-signal" />
                <div>
                  <h1 className="text-xs sm:text-sm uppercase tracking-widest font-bold leading-tight">
                    [ ADMIN PORTAL ]
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-paper/70">ROLE REQUESTS REVIEW</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="text-paper hover:text-signal transition-colors p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-grain">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between border-b-2 border-ink pb-3 sm:pb-4">
                  <h2 className="text-lg sm:text-xl font-display uppercase tracking-tight text-ink flex items-center gap-2">
                    Pending Requests
                    <span className="bg-signal text-ink text-xs sm:text-sm px-2 py-0.5 rounded-xs font-mono font-bold">
                      {requests.length}
                    </span>
                  </h2>
                  <button 
                    onClick={fetchRequests}
                    className="p-1.5 sm:p-2 border-2 border-ink rounded-xs hover:bg-ink hover:text-paper transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center p-8 sm:p-12">
                    <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-muted animate-pulse">LOADING REQUESTS...</span>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="bg-card border-2 border-ink border-dashed rounded-xs p-8 sm:p-12 text-center space-y-2 sm:space-y-3">
                    <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-muted" />
                    <p className="text-xs sm:text-sm font-bold text-ink uppercase">NO PENDING REQUESTS</p>
                    <p className="text-[10px] sm:text-xs text-muted">All caught up. Grab a coffee.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4">
                    {requests.map(req => (
                      <div key={req.id} className="bg-card border-2 border-ink shadow-hard rounded-xs p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
                        <div className="flex justify-between items-start gap-2 sm:gap-4">
                          <div className="space-y-1 overflow-hidden">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                              <span className="text-[10px] sm:text-xs font-bold bg-ink text-paper px-1.5 sm:px-2 py-0.5 rounded-xs uppercase whitespace-nowrap">
                                {req.requested_role}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-muted flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                {new Date(req.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-bold text-ink truncate">
                              {req.profiles?.full_name || 'UNKNOWN USER'}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-muted truncate">
                              {req.profiles?.email || 'No email provided'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2 border-t border-ink/10">
                          <button
                            onClick={() => handleAction(req.id, req.user_id, req.requested_role, 'reject')}
                            className="flex-1 flex items-center justify-center gap-1 border-2 border-ink text-ink py-1.5 sm:py-2 rounded-xs hover:bg-ink hover:text-paper transition-all active:translate-y-[1px] text-[10px] sm:text-xs font-bold uppercase"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleAction(req.id, req.user_id, req.requested_role, 'approve')}
                            className="flex-1 flex items-center justify-center gap-1 border-2 border-ink bg-signal text-ink py-1.5 sm:py-2 rounded-xs hover:brightness-95 transition-all active:translate-y-[1px] text-[10px] sm:text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(30,30,36,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                          >
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </main>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
