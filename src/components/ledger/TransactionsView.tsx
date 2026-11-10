import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, verifyLedgerBalance } from '../../utils/accounting';

export const TransactionsView: React.FC = () => {
  const { data } = useApp();
  const symbol = data.org.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');

  const verification = verifyLedgerBalance(data.ledgerEntries);

  const filteredEntries = data.ledgerEntries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.accountCode.includes(searchTerm);

    const matchesAccount = selectedAccount === 'all' || entry.accountCode === selectedAccount;
    return matchesSearch && matchesAccount;
  });

  // Extract unique accounts
  const uniqueAccounts = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const e of data.ledgerEntries) {
      map.set(e.accountCode, e.accountName);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data.ledgerEntries]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Entry ID', 'Date', 'Transaction ID', 'Account Code', 'Account Name', 'Debit', 'Credit', 'Reference', 'Description'];
    const rows = filteredEntries.map((e) => [
      e.id,
      e.date,
      e.transactionId,
      e.accountCode,
      `"${e.accountName}"`,
      e.debit,
      e.credit,
      `"${e.reference}"`,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kasa_os_ledger_${data.org.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Ledger Integrity & Audit Verification Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Double-Entry Transaction Ledger</h3>
              {verification.isBalanced ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Balanced Invariant (Debits == Credits)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5" /> Out of Balance ({symbol} {verification.difference})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict immutable bookkeeping: Every commercial action generates paired debit and credit journal rows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 block font-sans">Total Debits</span>
            <span className="font-bold text-slate-900">{formatCurrency(verification.totalDebits, symbol)}</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 block font-sans">Total Credits</span>
            <span className="font-bold text-slate-900">{formatCurrency(verification.totalCredits, symbol)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by narration, reference, account name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Chart Accounts</option>
            {uniqueAccounts.map(([code, name]) => (
              <option key={code} value={code}>
                {code} — {name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Journal Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Description / Narration</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 font-sans">{entry.date}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">{entry.accountCode}</td>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{entry.accountName}</td>
                  <td className="py-2.5 px-4 text-slate-600">{entry.reference}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-700 max-w-xs truncate" title={entry.description}>
                    {entry.description}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    {entry.debit > 0 ? formatCurrency(entry.debit, symbol) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    {entry.credit > 0 ? formatCurrency(entry.credit, symbol) : '—'}
                  </td>
                </tr>
              ))}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center font-sans text-slate-500">
                    No ledger transactions matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
