import React, { useState, useEffect } from "react";
import sponsor2 from "../../assets/images/avatar.png";
import { Card, CardContent } from "@/components/ui/card";
import { X, Star, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getProfiles } from "@/store/profile-slice";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ApplicationForm from "./ApplicationForm";

interface SponsorProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  bio?: string;
  photo?: string;
  country?: string;
  city?: string;
  sponsorshipType?: string;
  budgetRange?: string;
  reviewsReceived?: any[];
  role?: string;
  sponsorType?: string;
  sponsorshipCountryPreferred?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface Country {
  name: {
    common: string;
  };
  cca2: string;
}

// Pagination Component
const Pagination: React.FC<{
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}> = ({ totalPages, currentPage, onPageChange }) => {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex justify-center mt-6 space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrev}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {[...Array(totalPages)].map((_, index) => (
        <span
          key={index}
          className={`px-3 py-1 rounded-md cursor-pointer ${
            currentPage === index + 1
              ? "bg-red-500 text-white"
              : "bg-gray-200 dark:bg-slate-600 dark:text-white"
          }`}
          onClick={() => onPageChange(index + 1)}
        >
          {index + 1}
        </span>
      ))}

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function SponsorProfiles() {
  // Redux state and dispatch
  const dispatch = useAppDispatch();
  const { profiles, status, error, totalPages } = useAppSelector(
    (state) => state.profile
  );

  // Extract users array from the profiles response
  const sponsorsArray = profiles?.users || [];

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(8); // Number of profiles per page
  const [activeSponsor, setActiveSponsor] = useState<SponsorProfile | null>(
    null
  );

  // Filter states - ensure we use consistent exact keys for filters
  const [filters, setFilters] = useState({
    country: "",
    sponsorType: "",
    sponsorshipType: "",
    budgetRange: "",
  });

  const navigate = useNavigate();

  // Open/close modal handlers
  const openReportModal = (sponsor: SponsorProfile) => {
    setActiveSponsor(sponsor);
    localStorage.setItem("sponsorid", sponsor.id);
    setIsReportOpen(true);
  };

  const closeReportModal = () => {
    setIsReportOpen(false);
  };

  // Navigation to sponsor profile
  const handleViewProfile = (sponsorId: string, username: string) => {
    localStorage.setItem("viewsponsorusername", username);

    const role = localStorage.getItem("role");

    if (role === "player") {
      navigate("/player/sponsorinfo");
    } else if (role === "sponsor") {
      navigate("/sponsor/sponsorinfo");
    } else if (role === "team") {
      navigate("/team/sponsorinfo");
    } else {
      navigate("/expert/sponsorinfo");
    }
  };

  // Fetch sponsors on mount and when filters/pagination change
  useEffect(() => {
    fetchSponsors();
  }, [currentPage, limit, dispatch]);

  // Function to fetch sponsors
  const fetchSponsors = () => {
    dispatch(
      getProfiles({
        page: currentPage,
        limit,
        userType: "sponsor",
      })
    );
  };

  // Fetch countries for filtering
  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((res) => res.json())
      .then((data: Country[]) => {
        const sorted = data.sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sorted);
      })
      .catch((error) => {
        console.error("Failed to fetch countries:", error);
      });
  }, []);

  // Handle filter changes - key fix here!
  const handleFilterChange = (value: string, filterType: string) => {
    // Make sure we use the exact filter keys with correct casing
    const normalizedKey = filterType.toLowerCase();

    // Map the normalized key to the correct casing used in our state
    let stateKey = "";
    switch (normalizedKey) {
      case "country":
        stateKey = "country";
        break;
      case "sponsortype":
        stateKey = "sponsorType";
        break;
      case "sponsorship type":
      case "sponsorshiptype":
        stateKey = "sponsorshipType";
        break;
      case "budget range":
      case "budgetrange":
        stateKey = "budgetRange";
        break;
      default:
        stateKey = normalizedKey;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      [stateKey]: value,
    }));

    // Reset to first page when filters change
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setFilters({
      country: "",
      sponsorType: "",
      sponsorshipType: "",
      budgetRange: "",
    });
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      searchTerm !== "" || Object.values(filters).some((value) => value !== "")
    );
  };

  // Extract unique filter options from sponsor data
  const extractFilterOptions = (key: keyof SponsorProfile): string[] => {
    const options = new Set<string>();

    sponsorsArray.forEach((sponsor: SponsorProfile) => {
      const value = sponsor[key];
      if (value && typeof value === "string") options.add(value);
    });

    return Array.from(options);
  };

  // Get filter options
  const countryOptions = extractFilterOptions("country");
  const sponsorTypeOptions = extractFilterOptions("sponsorType");
  const sponsorshipTypeOptions = extractFilterOptions("sponsorshipType");
  const budgetRangeOptions = extractFilterOptions("budgetRange");

  // Default options when data doesn't provide any
  const defaultSponsorTypes = ["Individual", "Corporate", "Institution"];
  const defaultSponsorshipTypes = ["Cash", "Card", "Gift", "Professional Fee"];
  const defaultBudgetRanges = ["10K-50K", "50K-100K", "100K-500K", "500K+"];

  // Filter sponsor data - using case-insensitive comparison
  const filteredSponsors = sponsorsArray.filter((sponsor: SponsorProfile) => {
    // Search query filtering
    const fullName = `${sponsor.firstName || ""} ${
      sponsor.lastName || ""
    }`.toLowerCase();
    const companyName = sponsor.company?.toLowerCase() || "";
    const bio = sponsor.bio?.toLowerCase() || "";

    if (
      searchTerm &&
      !fullName.includes(searchTerm.toLowerCase()) &&
      !companyName.includes(searchTerm.toLowerCase()) &&
      !bio.includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Apply other filters if they're set (case insensitive)
    if (
      filters.country &&
      sponsor.country &&
      sponsor.country.toLowerCase() !== filters.country.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.sponsorType &&
      sponsor.sponsorType &&
      sponsor.sponsorType.toLowerCase() !== filters.sponsorType.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.sponsorshipType &&
      sponsor.sponsorshipType &&
      sponsor.sponsorshipType.toLowerCase() !==
        filters.sponsorshipType.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.budgetRange &&
      sponsor.budgetRange &&
      sponsor.budgetRange.toLowerCase() !== filters.budgetRange.toLowerCase()
    ) {
      return false;
    }

    return true;
  });

  // Calculate average rating and review count
  const calculateRating = (reviews: any[] = []) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

  return (
    <div className="px-6 py-2 w-full mx-auto dark:bg-gray-900">
      <div className="mb-6 relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search sponsors by name, company or description..."
            className="pl-9 w-full bg-white dark:bg-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        {/* Country Filter */}
        <Select
          value={filters.country}
          onValueChange={(value) => handleFilterChange(value, "country")}
        >
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-700">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            {countryOptions.length > 0
              ? countryOptions.map((country, index) => (
                  <SelectItem key={`country-${index}`} value={country}>
                    {country}
                  </SelectItem>
                ))
              : countries.map((c) => (
                  <SelectItem key={`country-${c.cca2}`} value={c.name.common}>
                    {c.name.common}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>

        {/* Sponsor Type Filter */}
        <Select
          value={filters.sponsorType}
          onValueChange={(value) => handleFilterChange(value, "sponsorType")}
        >
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-700">
            <SelectValue placeholder="Sponsor Type" />
          </SelectTrigger>
          <SelectContent>
            {sponsorTypeOptions.length > 0
              ? sponsorTypeOptions.map((type, index) => (
                  <SelectItem key={`sponsorType-${index}`} value={type}>
                    {type}
                  </SelectItem>
                ))
              : defaultSponsorTypes.map((type) => (
                  <SelectItem key={`sponsorType-${type}`} value={type}>
                    {type}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>

        {/* Sponsorship Type Filter */}
        <Select
          value={filters.sponsorshipType}
          onValueChange={(value) =>
            handleFilterChange(value, "sponsorshipType")
          }
        >
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-700">
            <SelectValue placeholder="Sponsorship Type" />
          </SelectTrigger>
          <SelectContent>
            {sponsorshipTypeOptions.length > 0
              ? sponsorshipTypeOptions.map((type, index) => (
                  <SelectItem key={`sponsorshipType-${index}`} value={type}>
                    {type}
                  </SelectItem>
                ))
              : defaultSponsorshipTypes.map((type) => (
                  <SelectItem key={`sponsorshipType-${type}`} value={type}>
                    {type}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>

        {/* Budget Range Filter */}
        <Select
          value={filters.budgetRange}
          onValueChange={(value) => handleFilterChange(value, "budgetRange")}
        >
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-700">
            <SelectValue placeholder="Budget Range" />
          </SelectTrigger>
          <SelectContent>
            {budgetRangeOptions.length > 0
              ? budgetRangeOptions.map((range, index) => (
                  <SelectItem key={`budgetRange-${index}`} value={range}>
                    {range}
                  </SelectItem>
                ))
              : defaultBudgetRanges.map((range) => (
                  <SelectItem key={`budgetRange-${range}`} value={range}>
                    {range}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters() && (
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="flex items-center gap-1 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-slate-700 dark:border-slate-600 dark:text-red-400 dark:hover:bg-slate-600"
          >
            <X size={16} /> Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Debug Display */}

      {/* Loading State */}
      {status === "loading" && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
        </div>
      )}

      {/* Error State */}
      {status === "failed" && error && (
        <div className="text-center p-6 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          <p className="text-lg font-semibold">Failed to load sponsors</p>
          <p>{error}</p>
          <Button
            className="mt-4 bg-red-600 hover:bg-red-700"
            onClick={fetchSponsors}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* No Sponsors State */}
      {status === "succeeded" && filteredSponsors.length === 0 && (
        <div className="text-center p-10">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            No sponsors found matching your criteria.
          </p>
        </div>
      )}

      {/* Sponsor List */}
      {status === "succeeded" &&
        filteredSponsors.length > 0 &&
        filteredSponsors.map((sponsor: SponsorProfile) => {
          const rating = calculateRating(sponsor.reviewsReceived);
          const sponsoredCount = sponsor.reviewsReceived?.length || 0;
          const displayName =
            `${sponsor.firstName || ""} ${sponsor.lastName || ""}`.trim() ||
            sponsor.username ||
            "Anonymous Sponsor";

          return (
            <Card
              key={sponsor.id}
              className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4 mb-3 dark:bg-gray-800"
            >
              <img
                src={sponsor.photo || sponsor2}
                alt={displayName}
                className="w-48 h-48 object-fill rounded-md"
                onError={(e) => {
                  // Fallback to default image if profile photo fails to load
                  e.currentTarget.src = sponsor2;
                }}
              />
              <CardContent className="flex-1 p-0">
                <h2 className="text-lg font-semibold dark:text-white">
                  {displayName}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {sponsor.company ||
                    (sponsor.sponsorType === "individual"
                      ? "Individual Sponsor"
                      : "Organization")}
                  {sponsor.city && sponsor.country
                    ? ` • ${sponsor.city}, ${sponsor.country}`
                    : ""}
                </p>
                <p className="text-sm mt-1 line-clamp-2 dark:text-gray-300">
                  {sponsor.bio || "No description available."}
                </p>
                <div className="flex items-center mt-2 text-sm text-gray-700">
                  <div className="flex items-center text-yellow-400 mr-2">
                    {Array.from({
                      length: Math.floor(Number(rating) || 0),
                    }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-yellow-400 text-lg">
                    {rating || "N/A"}
                  </span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    (Sponsored - {sponsoredCount} players)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sponsor.sponsorType && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded dark:text-white">
                      {sponsor.sponsorType}
                    </span>
                  )}
                  {sponsor.budgetRange && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded dark:text-white">
                      {sponsor.budgetRange}
                    </span>
                  )}
                  {sponsor.sponsorshipType && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded dark:text-white">
                      {sponsor.sponsorshipType}
                    </span>
                  )}
                </div>
              </CardContent>
              <div className="flex flex-row justify-start items-start gap-5">
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                  onClick={() =>
                    handleViewProfile(sponsor.id, sponsor.username)
                  }
                >
                  View Profile
                </Button>
                <Button
                  variant="ghost"
                  className=" bg-yellow-300 hover:bg-yellow-400 text-gray-800 flex items-center justify-center dark:bg-gray-700 dark:text-white"
                  onClick={() => openReportModal(sponsor)}
                >
                  Apply
                </Button>
              </div>
            </Card>
          );
        })}

      {/* Modal that respects sidebar and header positioning */}
      {isReportOpen && (
        <div className="fixed left-[260px] top-0 right-0 bottom-0 z-50 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
          <div className="sticky top-0 w-full flex justify-between items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
            <button
              onClick={closeReportModal}
              className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-6 h-6 text-gray-800 dark:text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
            <ApplicationForm />
          </div>
          <div className="sticky bottom-0 w-full p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end">
            <Button
              variant="outline"
              className="mr-2"
              onClick={closeReportModal}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={closeReportModal}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {status === "succeeded" && totalPages > 0 && (
        <div className="flex flex-col items-center mt-6">
          <div className="flex items-center mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              Items per page:
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setCurrentPage(1); // Reset to first page when changing limit
              }}
              className="border rounded p-1 text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="4">4</option>
              <option value="8">8</option>
              <option value="12">12</option>
              <option value="20">20</option>
            </select>
          </div>

          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />

          <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Showing {filteredSponsors.length} of {profiles?.total || 0} sponsors
          </div>
        </div>
      )}
    </div>
  );
}
