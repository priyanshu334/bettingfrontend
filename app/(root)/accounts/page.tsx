"use client"
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const AccountStatement = () => {
  const [currentPage, setCurrentPage] = useState(2);
  
  const data = [
    { sNo: "01", date: "03-03-2025", credit: "2,000", debit: "1,000", balance: "1,000", sports: "Cricket", remarks: "Opening pts" },
    { sNo: "02", date: "04-03-2025", credit: "2,000", debit: "-", balance: "2,000", sports: "Cricket", remarks: "Opening pts" },
    { sNo: "03", date: "05-03-2025", credit: "2,000", debit: "0.00", balance: "0.00", sports: "Cricket", remarks: "Closing pts" },
  ];
  
  return (
    <div className="p-4 md:p-6 w-full mx-auto bg-gradient-to-br from-orange-50 to-orange-100 min-h-screen">
      <Card className="shadow-xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/cricket-pattern.png')] bg-repeat"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-full">
    
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white">Account Statement</CardTitle>
          </div>
          <p className="text-orange-100 mt-2">View and track all your transactions</p>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6">
          {/* Filters */}
          <div className="bg-orange-50 p-4 rounded-xl mb-6 border border-orange-100 shadow-sm">
            <h3 className="text-orange-800 font-semibold mb-3 flex items-center">
              <Filter className="w-4 h-4 mr-2" /> Filter Transactions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                <Input 
                  type="date" 
                  placeholder="From Date" 
                  className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500" 
                />
              </div>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                <Input 
                  type="date" 
                  placeholder="To Date" 
                  className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500" 
                />
              </div>
              <Select>
                <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Withdraw">Withdraw</SelectItem>
                  <SelectItem value="Deposit">Deposit</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all duration-200 shadow-md hover:shadow-lg">
                Apply Filter
              </Button>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-orange-200 shadow-md">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  {['S.no', 'Date', 'Credit', 'Debit', 'Balance', 'Sports', 'Remarks'].map((heading) => (
                    <th key={heading} className="p-3 text-left font-semibold first:rounded-tl-lg last:rounded-tr-lg">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.sNo} className={index % 2 === 0 ? "bg-white hover:bg-orange-50" : "bg-orange-50 hover:bg-orange-100"}>
                    <td className="p-3 text-center font-medium border-b border-orange-100">{row.sNo}</td>
                    <td className="p-3 border-b border-orange-100">{row.date}</td>
                    <td className="p-3 text-center font-medium text-green-600 border-b border-orange-100">{row.credit}</td>
                    <td className="p-3 text-center font-medium text-red-600 border-b border-orange-100">{row.debit}</td>
                    <td className="p-3 text-center font-medium text-orange-600 border-b border-orange-100">{row.balance}</td>
                    <td className="p-3 border-b border-orange-100">{row.sports}</td>
                    <td className="p-3 border-b border-orange-100">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 bg-orange-50 p-3 rounded-lg border border-orange-100">
            <div className="text-sm text-orange-800 mb-4 md:mb-0">
              Showing page {currentPage} of 5
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                className="border border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map(page => (
                  <Button 
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    className={`w-10 h-10 ${currentPage === page ? 'bg-orange-600 text-white' : 'border border-orange-300 text-orange-700 hover:bg-orange-100'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="border border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={() => setCurrentPage(prev => Math.min(5, prev + 1))}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
          
          {/* Summary Card */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white shadow-md">
              <p className="text-green-100 text-sm">Total Credit</p>
              <p className="text-2xl font-bold">₹6,000</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl text-white shadow-md">
              <p className="text-red-100 text-sm">Total Debit</p>
              <p className="text-2xl font-bold">₹1,000</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl text-white shadow-md">
              <p className="text-orange-100 text-sm">Current Balance</p>
              <p className="text-2xl font-bold">₹5,000</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountStatement;