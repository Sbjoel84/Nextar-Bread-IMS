import React, { useState } from 'react';
import { BakerySettings } from '../types/erp';
import { formatNaira } from '../utils/formatters';
import {
  Sliders,
  Building2,
  Shield,
  Download,
  RotateCcw,
  CheckCircle2,
  HardDrive,
  Save,
} from 'lucide-react';

interface SettingsViewProps {
  settings: BakerySettings;
  onUpdateSettings: (newSettings: Partial<BakerySettings>) => Promise<void>;
  onResetDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDatabase,
}) => {
  const [form, setForm] = useState<BakerySettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/v1/system/backup';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            Bakery Profile, Governance & Database Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure Nextar Bread Bakery plant specifications, corporate tax identification, approval thresholds, and complete JSON database backup.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Database JSON</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to restore Nextar Bakery demo seed records?')) {
                onResetDatabase();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Reset Demo Seed</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Bakery corporate settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Building2 className="w-4 h-4 text-blue-400" />
            Company Identification & Plant Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company / Bakery Trade Name</label>
              <input
                type="text"
                value={form.bakeryName}
                onChange={e => setForm({ ...form, bakeryName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Physical Plant Location</label>
              <input
                type="text"
                value={form.locationAddress}
                onChange={e => setForm({ ...form, locationAddress: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">City & State</label>
              <input
                type="text"
                value={`${form.city}, ${form.state}`}
                disabled
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-slate-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Phone Numbers</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Corporate Registration (RC #)</label>
              <input
                type="text"
                value={form.rcNumber}
                onChange={e => setForm({ ...form, rcNumber: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tax Identification Number (TIN)</label>
              <input
                type="text"
                value={form.taxIdentificationNumber}
                onChange={e => setForm({ ...form, taxIdentificationNumber: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Operating Rules Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            Operational Authority & Governance Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Purchase Order GM Approval Threshold (₦)
              </label>
              <input
                type="number"
                value={form.poApprovalThresholdAmount}
                onChange={e => setForm({ ...form, poApprovalThresholdAmount: Number(e.target.value) })}
                step={50000}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-amber-300"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Orders exceeding this amount strictly require General Manager sign-off before vendor dispatch.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Daily Bakery Production Target (Loaves)
              </label>
              <input
                type="number"
                value={form.dailyProductionTargetLoaves}
                onChange={e => setForm({ ...form, dailyProductionTargetLoaves: Number(e.target.value) })}
                step={100}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-blue-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={form.creditLimitStrictEnforcement}
                onChange={e => setForm({ ...form, creditLimitStrictEnforcement: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 w-4 h-4"
              />
              <span className="font-semibold text-white">
                Strict Credit Limit Enforcement (Block sales orders when customer balance exceeds credit limit)
              </span>
            </label>
          </div>
        </div>

        {/* Operating Warehouses */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Configured Plant Warehouses & Bays
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {form.operatingWarehouses.map(wh => (
              <div key={wh.id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{wh.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{wh.id}</div>
                </div>
                <span className="text-[10px] font-bold uppercase bg-slate-800 text-blue-300 px-2 py-0.5 rounded">
                  {wh.type.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/30"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
