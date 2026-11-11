import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  Activity,
  Layers,
  Settings,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  PieChart as PieChartIcon,
  Clock,
  Eye,
  Sliders,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth, PLATFORM_OWNER_EMAIL } from '../../context/AuthContext';
import { Business, UserProfile, PlatformAuditLog } from '../../types';

export const SuperAdminPortal: React.FC = () => {
  const { user, isSuperAdmin, signOut, setCurrentView, business } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'businesses' | 'users' | 'analytics' | 'audit_logs' | 'settings'
  >('overview');

  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLog[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>({
    platformName: 'KASA OS Multi-Tenant Platform',
    maintenanceMode: false,
    allowNewRegistrations: true,
    defaultCurrency: 'GHS',
    supportEmail: 'support@kasaos.com',
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // Selected Business for Detail Drawer / Modal
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [actionReason, setActionReason] = useState<string>('');
  const [statusActionLoading, setStatusActionLoading] = useState<boolean>(false);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState<boolean>(false);

  // Load Admin Data from Server
  const loadAdminData = async () => {
    setLoading(true);
    const adminEmail = user?.email || PLATFORM_OWNER_EMAIL;

    try {
      // 1. Overview
      const resOverview = await fetch('/api/admin/overview', {
        headers: { 'x-admin-email': adminEmail },
      });
      if (resOverview.ok) {
        const data = await resOverview.json();
        setOverview(data);
        if (data.settings) setPlatformSettings(data.settings);
      }

      // 2. Businesses
      const resBiz = await fetch(
        `/api/admin/businesses?search=${encodeURIComponent(searchQuery)}&industry=${industryFilter}&status=${statusFilter}&sort=${sortOrder}`,
        { headers: { 'x-admin-email': adminEmail } }
      );
      if (resBiz.ok) {
        const data = await resBiz.json();
        setBusinesses(data.businesses || []);
      }

      // 3. Users
      const resUsers = await fetch('/api/admin/users', {
        headers: { 'x-admin-email': adminEmail },
      });
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data.users || []);
      }

      // 4. Audit Logs
      const resLogs = await fetch('/api/admin/audit-logs', {
        headers: { 'x-admin-email': adminEmail },
      });
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [searchQuery, industryFilter, statusFilter, sortOrder]);

  // Handle Business Status Change (Activate / Suspend)
  const handleUpdateBusinessStatus = async (bizId: string, newStatus: 'active' | 'suspended') => {
    setStatusActionLoading(true);
    try {
      const res = await fetch('/api/admin/business/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': user?.email || PLATFORM_OWNER_EMAIL,
        },
        body: JSON.stringify({
          businessId: bizId,
          status: newStatus,
          adminEmail: user?.email || PLATFORM_OWNER_EMAIL,
          reason: actionReason || 'Super Admin operational review',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBusinesses((prev) => prev.map((b) => (b.id === bizId ? { ...b, status: newStatus } : b)));
        if (selectedBusiness?.id === bizId) {
          setSelectedBusiness((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        setActionReason('');
        await loadAdminData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Save Platform Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': user?.email || PLATFORM_OWNER_EMAIL,
        },
        body: JSON.stringify({
          ...platformSettings,
          adminEmail: user?.email || PLATFORM_OWNER_EMAIL,
        }),
      });
      if (res.ok) {
        setSaveSettingsSuccess(true);
        setTimeout(() => setSaveSettingsSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col font-sans">
      {/* Super Admin Top Header */}
      <header className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">KASA OS</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SUPER ADMIN PORTAL
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Platform Owner: {PLATFORM_OWNER_EMAIL}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {business && (
              <button
                onClick={() => setCurrentView('business_app')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors flex items-center gap-1.5"
              >
                <span>Switch to Business Workspace</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            )}

            <button
              onClick={() => loadAdminData()}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/50 hover:bg-red-900 text-red-300 border border-red-800/50 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto border-t border-neutral-800/80">
          {[
            { id: 'overview', label: 'Platform Overview', icon: Activity },
            { id: 'businesses', label: `Business Directory (${businesses.length})`, icon: Building2 },
            { id: 'users', label: `User Management (${users.length})`, icon: Users },
            { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp },
            { id: 'audit_logs', label: `Audit Logs (${auditLogs.length})`, icon: Clock },
            { id: 'settings', label: 'Platform Settings', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-neutral-800/40'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 shadow-sm">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase">
                  <span>Total Businesses</span>
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">
                  {overview?.totalBusinesses ?? businesses.length}
                </div>
                <div className="mt-1 text-xs text-neutral-400">Registered SaaS tenants</div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 shadow-sm">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase">
                  <span>Active Tenants</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-emerald-400">
                  {overview?.activeBusinesses ?? businesses.filter((b) => b.status === 'active').length}
                </div>
                <div className="mt-1 text-xs text-neutral-400">Operating normally</div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 shadow-sm">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase">
                  <span>Suspended Tenants</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-amber-400">
                  {overview?.suspendedBusinesses ?? businesses.filter((b) => b.status === 'suspended').length}
                </div>
                <div className="mt-1 text-xs text-neutral-400">Access paused by Admin</div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 shadow-sm">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase">
                  <span>Total Users</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">
                  {overview?.totalUsers ?? users.length}
                </div>
                <div className="mt-1 text-xs text-neutral-400">Platform user profiles</div>
              </div>
            </div>

            {/* Quick Status Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Business Registrations */}
              <div className="p-6 rounded-2xl bg-neutral-800/70 border border-neutral-700/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4.5 h-4.5 text-emerald-400" /> Recent Registrations
                  </h3>
                  <button
                    onClick={() => setActiveTab('businesses')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    View Directory →
                  </button>
                </div>

                {businesses.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm border border-dashed border-neutral-700 rounded-xl">
                    Zero businesses registered yet. When businesses sign up on the landing page, they will appear here.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-700/50">
                    {businesses.slice(0, 5).map((b) => (
                      <div key={b.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{b.name}</div>
                          <div className="text-xs text-neutral-400">
                            {b.industry} • Owner: {b.ownerEmail}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              b.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {b.status}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedBusiness(b);
                              setActiveTab('businesses');
                            }}
                            className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Platform Activity */}
              <div className="p-6 rounded-2xl bg-neutral-800/70 border border-neutral-700/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-blue-400" /> Platform Audit Activity
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit_logs')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    All Logs →
                  </button>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm border border-dashed border-neutral-700 rounded-xl">
                    No administrative audit activity recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-700/50">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="py-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400 uppercase tracking-wide">{log.action}</span>
                          <span className="text-neutral-500">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1">{log.details}</p>
                        <div className="text-[11px] text-neutral-500 mt-0.5">Admin: {log.adminEmail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUSINESS DIRECTORY & MANAGEMENT */}
        {activeTab === 'businesses' && (
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="w-full md:w-96 relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, or tenant ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none"
                >
                  <option value="all">All Industries</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="services">Services</option>
                  <option value="construction">Construction</option>
                  <option value="automotive">Automotive</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Businesses Table */}
            <div className="bg-neutral-800/80 rounded-2xl border border-neutral-700/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-300">
                  <thead className="text-xs uppercase bg-neutral-900/80 text-neutral-400 border-b border-neutral-700">
                    <tr>
                      <th className="px-6 py-3.5">Business Name & ID</th>
                      <th className="px-6 py-3.5">Industry</th>
                      <th className="px-6 py-3.5">Owner Email</th>
                      <th className="px-6 py-3.5">Registered</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-700/50">
                    {businesses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                          {searchQuery || industryFilter !== 'all' || statusFilter !== 'all'
                            ? 'No businesses match the specified filters.'
                            : 'No registered businesses in the system yet. Register a business on the landing page to test.'}
                        </td>
                      </tr>
                    ) : (
                      businesses.map((biz) => (
                        <tr key={biz.id} className="hover:bg-neutral-750 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{biz.name}</div>
                            <div className="text-xs font-mono text-neutral-500">{biz.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize">{biz.industry}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-neutral-400">
                            {biz.ownerEmail}
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-400">
                            {biz.createdAt ? new Date(biz.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                biz.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {biz.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedBusiness(biz)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-700 hover:bg-neutral-600 text-white transition-colors"
                            >
                              Manage Business
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Business Management Modal */}
            {selectedBusiness && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                    <div>
                      <h4 className="text-lg font-bold text-white">{selectedBusiness.name}</h4>
                      <p className="text-xs text-neutral-400">Tenant ID: {selectedBusiness.id}</p>
                    </div>
                    <button
                      onClick={() => setSelectedBusiness(null)}
                      className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="py-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
                      <div>
                        <span className="text-neutral-500">Industry:</span>
                        <p className="font-semibold text-white capitalize">{selectedBusiness.industry}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Currency:</span>
                        <p className="font-semibold text-white">
                          {selectedBusiness.currency} ({selectedBusiness.currencySymbol})
                        </p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Owner Email:</span>
                        <p className="font-semibold text-white font-mono">{selectedBusiness.ownerEmail}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Contact Phone:</span>
                        <p className="font-semibold text-white">{selectedBusiness.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Location:</span>
                        <p className="font-semibold text-white">{selectedBusiness.address || 'N/A'}, {selectedBusiness.country}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Current Status:</span>
                        <p className="font-bold uppercase tracking-wider text-emerald-400">
                          {selectedBusiness.status}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Administrative Action Note / Reason:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Terms verification or reactivation following payment"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedBusiness(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                    >
                      Close
                    </button>

                    <div className="flex items-center gap-2">
                      {selectedBusiness.status === 'active' ? (
                        <button
                          disabled={statusActionLoading}
                          onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, 'suspended')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-4 h-4" /> Suspend Business
                        </button>
                      ) : (
                        <button
                          disabled={statusActionLoading}
                          onClick={() => handleUpdateBusinessStatus(selectedBusiness.id, 'active')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Reactivate Business
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-neutral-800/80 rounded-2xl border border-neutral-700/60 overflow-hidden">
            <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Registered Users</h3>
                <p className="text-xs text-neutral-400">Platform-wide user profile registry</p>
              </div>
              <span className="text-xs text-neutral-400 font-mono">Total Users: {users.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="text-xs uppercase bg-neutral-900/80 text-neutral-400 border-b border-neutral-700">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Business Name</th>
                    <th className="px-6 py-3.5">Platform Role</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700/50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                        Zero user records registered. User profiles appear automatically when users sign in.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.uid} className="hover:bg-neutral-750 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{u.displayName || 'User'}</td>
                        <td className="px-6 py-4 text-xs font-mono text-neutral-400">{u.email}</td>
                        <td className="px-6 py-4 text-xs text-neutral-300">{u.businessName || 'None (Unassigned)'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-neutral-700 text-neutral-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PLATFORM ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Industry Distribution Chart */}
              <div className="p-6 rounded-2xl bg-neutral-800/80 border border-neutral-700/60">
                <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                  <PieChartIcon className="w-4.5 h-4.5 text-emerald-400" /> Industry Distribution
                </h3>
                <p className="text-xs text-neutral-400 mb-6">Proportion of businesses by selected operating sector</p>

                {businesses.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-neutral-500 text-xs">
                    No data to chart yet. Register businesses to view industry analytics.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Retail', value: businesses.filter((b) => b.industry === 'retail').length },
                            { name: 'Wholesale', value: businesses.filter((b) => b.industry === 'wholesale').length },
                            { name: 'Manufacturing', value: businesses.filter((b) => b.industry === 'manufacturing').length },
                            { name: 'Agriculture', value: businesses.filter((b) => b.industry === 'agriculture').length },
                            { name: 'Services', value: businesses.filter((b) => b.industry === 'services').length },
                            { name: 'Other', value: businesses.filter((b) => !['retail', 'wholesale', 'manufacturing', 'agriculture', 'services'].includes(b.industry)).length },
                          ].filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Active vs Suspended Ratio */}
              <div className="p-6 rounded-2xl bg-neutral-800/80 border border-neutral-700/60">
                <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-blue-400" /> Tenant Health Ratio
                </h3>
                <p className="text-xs text-neutral-400 mb-6">Active vs Suspended business accounts</p>

                {businesses.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-neutral-500 text-xs">
                    No registered tenants available to evaluate health ratio.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: 'Status',
                            Active: businesses.filter((b) => b.status === 'active').length,
                            Suspended: businesses.filter((b) => b.status === 'suspended').length,
                          },
                        ]}
                      >
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Active" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Suspended" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit_logs' && (
          <div className="bg-neutral-800/80 rounded-2xl border border-neutral-700/60 overflow-hidden">
            <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Administrative Audit Trail</h3>
                <p className="text-xs text-neutral-400">Immutable ledger of platform-level administrative changes</p>
              </div>
              <span className="text-xs text-neutral-400 font-mono">Entries: {auditLogs.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="text-xs uppercase bg-neutral-900/80 text-neutral-400 border-b border-neutral-700">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Details</th>
                    <th className="px-6 py-3.5">Administrator</th>
                    <th className="px-6 py-3.5">Target Business</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700/50">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                        No audit logs registered yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-750 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-neutral-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-700 text-emerald-400">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-200">{log.details}</td>
                        <td className="px-6 py-4 text-xs font-mono text-neutral-400">{log.adminEmail}</td>
                        <td className="px-6 py-4 text-xs text-neutral-300">
                          {log.targetBusinessName || log.targetBusinessId || 'Platform-Wide'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PLATFORM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-neutral-800/80 rounded-2xl border border-neutral-700/60 p-6">
            <h3 className="font-bold text-white text-lg mb-1">Platform Global Settings</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Configure system-wide operational flags and default tenant parameters.
            </p>

            {saveSettingsSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Platform settings saved successfully.
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Platform Display Name</label>
                <input
                  type="text"
                  value={platformSettings.platformName}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Support Contact Email</label>
                <input
                  type="email"
                  value={platformSettings.supportEmail}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Default Platform Currency</label>
                <select
                  value={platformSettings.defaultCurrency}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, defaultCurrency: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none"
                >
                  <option value="GHS">GHS - Ghana Cedi (GH₵)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="NGN">NGN - Nigerian Naira (₦)</option>
                  <option value="KES">KES - Kenyan Shilling (KSh)</option>
                </select>
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.allowNewRegistrations}
                    onChange={(e) =>
                      setPlatformSettings({ ...platformSettings, allowNewRegistrations: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Allow Public Business Registrations</div>
                    <div className="text-[11px] text-neutral-400">
                      When enabled, new enterprises can register workspaces from the landing page.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.maintenanceMode}
                    onChange={(e) =>
                      setPlatformSettings({ ...platformSettings, maintenanceMode: e.target.checked })
                    }
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Platform Maintenance Mode</div>
                    <div className="text-[11px] text-neutral-400">
                      Temporarily locks tenant writes while preserving read access.
                    </div>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Save Platform Settings
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
