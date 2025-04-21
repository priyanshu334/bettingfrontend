"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define types
interface BetEntry {
  sport: string;
  event: string;
  market: string;
  option: string;
  amount: string;
  status: "Current" | "Settle" | "Un-Settle";
  type: "Back" | "Lay";
}

type FilterType = "All Bet" | "Back" | "Lay";

const BetHistory: React.FC = () => {
  // State variables
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All Bet");
  const [filteredData, setFilteredData] = useState<BetEntry[]>([]);
  const [totalPages, setTotalPages] = useState<number>(5);
  const itemsPerPage: number = 3;

  // Sample data with more entries
  const allData: BetEntry[] = [
    {
      sport: "Cricket",
      event: "Ipl-2025",
      market: "Match Winner",
      option: "123 back",
      amount: "1,000",
      status: "Current",
      type: "Back"
    },
    {
      sport: "Football",
      event: "Premier League",
      market: "Match Odds",
      option: "Team A back",
      amount: "500",
      status: "Settle",
      type: "Back"
    },
    {
      sport: "Tennis",
      event: "US Open",
      market: "Set Winner",
      option: "Player B lay",
      amount: "750",
      status: "Un-Settle",
      type: "Lay"
    },
    {
      sport: "Cricket",
      event: "World Cup",
      market: "Top Scorer",
      option: "Player X back",
      amount: "2,000",
      status: "Current",
      type: "Back"
    },
    {
      sport: "Basketball",
      event: "NBA Finals",
      market: "Total Points",
      option: "Over 200 lay",
      amount: "1,500",
      status: "Settle",
      type: "Lay"
    },
    {
      sport: "Football",
      event: "Champions League",
      market: "First Goal",
      option: "Team B back",
      amount: "800",
      status: "Current",
      type: "Back"
    },
    {
      sport: "Cricket",
      event: "T20 Series",
      market: "Total Sixes",
      option: "Under 15 lay",
      amount: "600",
      status: "Un-Settle",
      type: "Lay"
    },
    {
      sport: "Tennis",
      event: "Wimbledon",
      market: "Match Winner",
      option: "Player C back",
      amount: "1,200",
      status: "Settle",
      type: "Back"
    },
  ];

  // Apply filter
  const applyFilter = (filter: FilterType): void => {
    setActiveFilter(filter);
    
    let results = [...allData];
    if (filter === "Back") {
      results = allData.filter(bet => bet.type === "Back");
    } else if (filter === "Lay") {
      results = allData.filter(bet => bet.type === "Lay");
    }
    
    setFilteredData(results);
    setTotalPages(Math.ceil(results.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Update bet status
  const updateBetStatus = (index: number, status: "Current" | "Settle" | "Un-Settle"): void => {
    const updatedData = [...filteredData];
    updatedData[index].status = status;
    setFilteredData(updatedData);
  };

  // Initialize data
  useEffect(() => {
    setFilteredData(allData);
    setTotalPages(Math.ceil(allData.length / itemsPerPage));
  }, []);

  // Get current page data
  const getCurrentPageData = (): BetEntry[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  // Handle pagination display
  const getPaginationRange = (): number[] => {
    // Logic for smart pagination display
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    
    if (currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    }
    
    return Array.from({ length: 5 }, (_, i) => currentPage - 2 + i);
  };

  return (
    <div className="p-6 w-full mx-auto bg-gray-50 min-h-screen">
      <Card className="shadow-lg">
        <CardHeader className="bg-blue-700 text-white">
          <CardTitle className="text-2xl font-bold">BET HISTORY</CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button 
              className={activeFilter === "All Bet" 
                ? "bg-blue-600 hover:bg-blue-700 font-medium" 
                : "bg-gray-100 text-blue-600 hover:bg-blue-50 border-2 border-blue-600"}
              onClick={() => applyFilter("All Bet")}
            >
              All Bet
            </Button>
            <Button 
              className={activeFilter === "Back" 
                ? "bg-blue-600 hover:bg-blue-700 font-medium text-white" 
                : "bg-gray-100 text-blue-600 hover:bg-blue-50 border-2 border-blue-600"}
              onClick={() => applyFilter("Back")}
            >
              Back
            </Button>
            <Button 
              className={activeFilter === "Lay" 
                ? "bg-blue-600 hover:bg-blue-700 font-medium text-white" 
                : "bg-gray-100 text-blue-600 hover:bg-blue-50 border-2 border-blue-600"}
              onClick={() => applyFilter("Lay")}
            >
              Lay
            </Button>
          </div>

          {/* Table container with overflow for mobile */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-[600px] w-full border-collapse">
              <thead>
                <tr className="bg-blue-700 text-white">
                  {[
                    "Sports",
                    "Event Name",
                    "Market Name",
                    "User Option",
                    "Amount",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="p-3 border border-blue-800 text-left font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getCurrentPageData().map((bet, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-3 border border-gray-200">{bet.sport}</td>
                    <td className="p-3 border border-gray-200">{bet.event}</td>
                    <td className="p-3 border border-gray-200">{bet.market}</td>
                    <td className="p-3 border border-gray-200 font-medium">
                      {bet.option}
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        bet.type === "Back" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {bet.type}
                      </span>
                    </td>
                    <td className="p-3 border border-gray-200 font-medium text-blue-600">{bet.amount}</td>
                    <td className="p-3 border border-gray-200">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={`px-4 py-1 font-medium ${
                              bet.status === "Current" 
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200" 
                                : bet.status === "Settle" 
                                ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                                : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                            }`}
                          >
                            {bet.status}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-yellow-50"
                            onClick={() => updateBetStatus(index, "Current")}
                          >
                            Current
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-green-50"
                            onClick={() => updateBetStatus(index, "Settle")}
                          >
                            Settle
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-red-50"
                            onClick={() => updateBetStatus(index, "Un-Settle")}
                          >
                            Un-Settle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                className="border-2 border-gray-300 hover:bg-gray-100"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {getPaginationRange().map(page => (
                  <Button 
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    className={`w-10 h-10 ${currentPage === page ? 'bg-blue-600 text-white' : 'border-2 border-gray-300'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="border-2 border-gray-300 hover:bg-gray-100"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BetHistory;