'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore'; // Adjust path as needed
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Filter } from 'lucide-react';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  createdAt: string;
}

interface HistoryResponse {
  currentBalance: number;
  totalTransactions: number;
  page: number;
  totalPages: number;
  transactions: Transaction[];
}

export default function UserHistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get current filter parameters
  const type = searchParams.get('type') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const fetchHistory = async () => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${user._id}/account-history?type=${type}&startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handlePageChange = (newPage: number): void => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 rounded-lg bg-red-50 border border-red-100 shadow-sm">
        <div className="p-6">
          <div className="text-center text-red-500 py-8">
            <h3 className="text-lg font-medium">Authentication Required</h3>
            <p className="mt-2">Please log in to view your transaction history.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8 space-y-4 p-4">
        <div className="w-full h-12 bg-slate-200 animate-pulse rounded-md"></div>
        <div className="w-full h-24 bg-slate-200 animate-pulse rounded-md"></div>
        <div className="w-full h-64 bg-slate-200 animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 rounded-lg bg-red-50 border border-red-100 shadow-sm">
        <div className="p-6">
          <div className="text-center text-red-500 py-8">
            <h3 className="text-lg font-medium">Data Load Error</h3>
            <p className="mt-2">Unable to fetch your transaction history. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const deposits = data.transactions.filter(t => t.type === 'deposit' || t.amount > 0);
  const withdrawals = data.transactions.filter(t => t.type === 'withdrawal' || t.amount < 0);
  
  const totalDeposits = deposits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalWithdrawals = withdrawals.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Account Transaction History</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="pb-2">
            <p className="text-sm text-slate-500">Current Balance</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.currentBalance)}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="pb-2">
            <p className="text-sm text-slate-500 flex items-center">
              <ArrowDown className="w-4 h-4 mr-1 text-green-500" />
              Total Deposits
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalDeposits)}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="pb-2">
            <p className="text-sm text-slate-500 flex items-center">
              <ArrowUp className="w-4 h-4 mr-1 text-red-500" />
              Total Withdrawals
            </p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalWithdrawals)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Transaction Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <button className="py-1 px-3 text-sm border border-slate-200 rounded-md flex items-center gap-1 hover:bg-slate-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Showing {data.transactions.length} of {data.totalTransactions} transactions
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-4 font-medium border-b border-slate-200">Type</th>
                <th className="text-left p-4 font-medium border-b border-slate-200">Amount</th>
                <th className="text-left p-4 font-medium border-b border-slate-200">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((txn) => (
                <tr key={txn._id} className="hover:bg-slate-50">
                  <td className="p-4 border-b border-slate-100">
                    <span 
                      className={`py-1 px-2 rounded-full text-xs font-medium ${
                        txn.type === 'deposit' || txn.amount > 0 
                          ? "bg-green-50 text-green-700" 
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                    </span>
                  </td>
                  <td className={`p-4 border-b border-slate-100 font-medium ${
                    txn.type === 'deposit' || txn.amount > 0 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}>
                    {txn.type === 'deposit' || txn.amount > 0 ? '+' : '-'} {formatCurrency(Math.abs(txn.amount))}
                  </td>
                  <td className="p-4 border-b border-slate-100 text-slate-500">
                    {formatDate(txn.createdAt)}
                  </td>
                </tr>
              ))}
              
              {data.transactions.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-slate-500 border-b border-slate-100">
                    No transactions found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Page {data.page} of {data.totalPages}
          </p>
          
          <div className="flex gap-2">
            <button
              className={`p-1 rounded-md border border-slate-200 ${
                data.page <= 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => data.page > 1 && handlePageChange(data.page - 1)}
              disabled={data.page <= 1}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous Page</span>
            </button>
            
            <button
              className={`p-1 rounded-md border border-slate-200 ${
                data.page >= data.totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => data.page < data.totalPages && handlePageChange(data.page + 1)}
              disabled={data.page >= data.totalPages}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}