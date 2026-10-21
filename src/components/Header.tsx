import React, { useState, useEffect } from 'react';
import { NextarLogo } from './NextarLogo';
import { User, SystemNotification } from '../types/erp';
import {
  Bell,
  UserCheck,
  ChevronDown,
  RotateCcw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building2,
  LogOut,
  Undo2,
  Eye,
} from 'lucide-react';
import { formatDateTimeNG } from '../utils/formatters';
import { ROLE_LABELS } from '../shared/permissions';

interface HeaderProps {
  currentUser: User | null;
  realUser: User | null; // who is at the device; differs while a Super Admin views as someone else
  allUsers: User[];
  canSwitchUsers: boolean; // Super Admin only
  canResetDatabase: boolean;
  onSwitchUser: (userId: string) => void;
  onReleaseDevice: () => void;
  notifications: SystemNotification[];
  onMarkNotificationsRead: () => void;
  onResetDatabase: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  realUser,
  allUsers,
  canSwitchUsers,
  canResetDatabase,
  onSwitchUser,
  onReleaseDevice,
  notifications,
  onMarkNotificationsRead,
  onResetDatabase,
}) => {
  const [time, setTime] = useState<string>('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Africa/Lagos',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const impersonating = Boolean(realUser && currentUser && realUser.id !== currentUser.id);

  return (
    <>
    {impersonating && (
      <div className="shrink-0 bg-amber-500 text-slate-950 text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-3">
        <Eye className="w-3.5 h-3.5" />
        <span>
          You ({realUser?.fullName}) are viewing the system as {currentUser?.fullName} ({currentUser ? ROLE_LABELS[currentUser.role] : ''}).
          Everything you do is recorded as both of you.
        </span>
        <button
          onClick={() => realUser && onSwitchUser(realUser.id)}
          className="flex items-center gap-1 bg-slate-950 text-amber-300 hover:text-white rounded px-2 py-0.5"
        >
          <Undo2 className="w-3 h-3" /> Return to my account
        </button>
      </div>
    )}
    <header className="shrink-0 h-14 sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between shadow-md">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-4">
        <NextarLogo size="md" />
      </div>

      {/* Center: Live Timezone (Africa/Lagos) & Status */}
      <div className="hidden md:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3 py-1 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono font-medium">{time}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">WAT (Lagos)</span>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/50 rounded-full px-2.5 py-1 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-medium">DBMS Online • Kubwa Hub</span>
        </div>
      </div>

      {/* Right: Actions, Notifications, Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Reset Demo Data button (Super Admin only) */}
        {canResetDatabase && (
        <button
          onClick={() => {
            if (confirm('Reset Nextar Bakery database to fresh initial seed data?')) {
              onResetDatabase();
            }
          }}
          title="Reset database to seed records"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Reset Demo</span>
        </button>
        )}

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            className="relative p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="System Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDrawer && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-400" />
                  Notifications & Alerts
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkNotificationsRead();
                      setShowNotifDrawer(false);
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications.</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        n.severity === 'WARNING'
                          ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                          : n.severity === 'ALERT'
                          ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold flex items-center gap-1">
                          {n.severity === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                          {n.severity === 'ALERT' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          {n.severity === 'SUCCESS' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {n.severity === 'INFO' && <Info className="w-3 h-3 text-blue-400" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDateTimeNG(n.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current User & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => canSwitchUsers && setShowRoleModal(!showRoleModal)}
            title={canSwitchUsers ? 'Switch user (Super Admin)' : 'This device is assigned to you'}
            className="flex items-center gap-2.5 bg-gradient-to-r from-blue-950/60 to-slate-800/90 hover:from-blue-900/70 hover:to-slate-700/90 border border-blue-500/30 rounded-xl px-3 py-1.5 transition-all shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
              {currentUser?.fullName.charAt(0) || 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight">
                {currentUser?.fullName || 'User'}
              </div>
              <div className="text-[10px] font-medium text-blue-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                {currentUser ? ROLE_LABELS[currentUser.role] : ''}
              </div>
            </div>
            {canSwitchUsers && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Quick Role Switcher Modal */}
          {canSwitchUsers && showRoleModal && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2 py-1.5 mb-1.5 border-b border-slate-800">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  View the system as another user
                </div>
                <div className="text-[11px] text-slate-400">
                  Super Admin only. Use it to check what each person can see and do.
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1">
                {allUsers.map(u => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setShowRoleModal(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                        isCurrent
                          ? 'bg-blue-600/30 border border-blue-500/50 text-white font-medium'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          {u.fullName}
                          {isCurrent && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded">Active</span>}
                        {u.id === realUser?.id && <span className="text-[10px] bg-slate-700 text-slate-200 px-1.5 py-0.2 rounded">You</span>}
                        </div>
                        <div className="text-[10px] text-blue-400 font-mono">
                          {ROLE_LABELS[u.role]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  if (confirm('Release this device? It will ask which account to use next time it is opened.')) onReleaseDevice();
                }}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-900/60 rounded-lg py-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Release this device
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
};
