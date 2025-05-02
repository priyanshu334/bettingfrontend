'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { userId } = useParams() as { userId: string };
  const searchParams = useSearchParams();

  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const type = searchParams.get('type') || '';
      const startDate = searchParams.get('startDate') || '';
      const endDate = searchParams.get('endDate') || '';
      const page = searchParams.get('page') || '1';
      const limit = searchParams.get('limit') || '50';

      const res = await fetch(`/api/users/${userId}/history?type=${type}&startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

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

  if (loading) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  if (!data) {
    return <div className="text-red-500">Failed to load data.</div>;
  }

  return (
    <Card className="p-4 mt-6">
      <CardContent>
        <h1 className="text-xl font-semibold mb-4">User Account History</h1>
        <p className="mb-2">Current Balance: ₹{data.currentBalance}</p>
        <p className="mb-4">Total Transactions: {data.totalTransactions}</p>

        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.map((txn) => (
                <TableRow key={txn._id}>
                  <TableCell>{txn.type}</TableCell>
                  <TableCell>₹{txn.amount}</TableCell>
                  <TableCell>{new Date(txn.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Page {data.page} of {data.totalPages}
        </div>
      </CardContent>
    </Card>
  );
}
