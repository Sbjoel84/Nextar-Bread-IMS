import React, { useState } from 'react';
import { Employee, AttendanceRecord } from '../types/erp';
import { formatNaira, formatDateNG } from '../utils/formatters';
import {
  UserCheck,
  Plus,
  Calendar,
  Clock,
  Briefcase,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';

interface EmployeesViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  onAddEmployee: (data: any) => Promise<void>;
  onMarkAttendance: (data: any) => Promise<void>;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  attendance,
  onAddEmployee,
  onMarkAttendance,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance'>('roster');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);

  // Add Employee Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<Employee['department']>('BAKING');
  const [designation, setDesignation] = useState('');
  const [shiftPattern, setShiftPattern] = useState<Employee['shiftPattern']>('ROTATING');
  const [salary, setSalary] = useState(0);
  const [emergency, setEmergency] = useState('');

  // Attendance Form
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [attStatus, setAttStatus] = useState<AttendanceRecord['status']>('PRESENT');
  const [attShift, setAttShift] = useState('Morning Bake (05:00 - 14:00)');
  const [attNotes, setAttNotes] = useState('');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddEmployee({
      fullName,
      phone,
      department,
      designation,
      shiftPattern,
      basicSalaryNaira: salary,
      emergencyContact: emergency,
    });
    setShowAddEmpModal(false);
  };

  const handleAttSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onMarkAttendance({
      employeeId: selectedEmpId,
      status: attStatus,
      shift: attShift,
      notes: attNotes,
    });
    setShowAttModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            Bakery Personnel & Shift Attendance Rota
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Master bakers, mixing operators, oven crews, dispatch drivers, quality controllers, and daily shift attendance logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'roster' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Staff Roster ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'attendance' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Attendance Rota ({attendance.length})
            </button>
          </div>

          {activeTab === 'roster' ? (
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAttModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'roster' ? (
        /* Staff Roster Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => (
            <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm hover:border-indigo-500/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">{emp.staffCode}</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{emp.fullName}</h3>
                  <div className="text-[11px] text-amber-300 font-medium">{emp.designation}</div>
                </div>
                <span className="text-[10px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {emp.department}
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-300 pt-2 border-t border-slate-800">
                <div><strong>Phone:</strong> {emp.phone}</div>
                <div><strong>Shift Pattern:</strong> {emp.shiftPattern.replace(/_/g, ' ')}</div>
                <div><strong>Monthly Salary:</strong> {formatNaira(emp.basicSalaryNaira)}</div>
                <div className="text-[11px] text-slate-400">Emergency: {emp.emergencyContact}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Attendance Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Shift</th>
                  <th className="p-3">Clock In Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {attendance.map(att => (
                  <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white">{att.employeeName}</td>
                    <td className="p-3 text-slate-300">{att.department}</td>
                    <td className="p-3 font-mono text-slate-300 text-[11px]">{formatDateNG(att.date)}</td>
                    <td className="p-3 text-slate-200">{att.shift}</td>
                    <td className="p-3 font-mono font-bold text-blue-400">{att.timeIn}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        att.status === 'PRESENT'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : att.status === 'LATE'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}>
                        {att.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{att.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                Add Bakery Staff Member
              </h2>
              <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="BAKING">Baking Floor</option>
                    <option value="MIXING">Dough Mixing</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="QUALITY">Quality Control</option>
                    <option value="LOGISTICS">Dispatch Logistics</option>
                    <option value="SALES">Sales & Marketing</option>
                    <option value="FINANCE">Finance & Accounts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Basic Monthly Salary (₦)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={e => setSalary(Number(e.target.value))}
                    step={10000}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Emergency Contact</label>
                <input
                  type="text"
                  placeholder="e.g. Next of kin name and phone"
                  value={emergency}
                  onChange={e => setEmergency(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showAttModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Mark Shift Attendance
              </h2>
              <button onClick={() => setShowAttModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAttSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Attendance Status</label>
                  <select
                    value={attStatus}
                    onChange={e => setAttStatus(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late Clock In</option>
                    <option value="EXCUSED">Excused Leave</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift</label>
                  <select
                    value={attShift}
                    onChange={e => setAttShift(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="Morning Bake (05:00 - 14:00)">Morning Bake Shift</option>
                    <option value="Afternoon Bake (13:00 - 21:00)">Afternoon Bake Shift</option>
                    <option value="Night Bake (21:00 - 06:00)">Night Bake Shift</option>
                    <option value="Day Administrative">Day Administrative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. On-time report for mixing cycle"
                  value={attNotes}
                  onChange={e => setAttNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAttModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Clock In Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
