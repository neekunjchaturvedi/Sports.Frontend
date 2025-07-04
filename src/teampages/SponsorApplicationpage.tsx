import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Circle, X } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = `${import.meta.env.VITE_PORT}/api/v1/user/applications`;

const getBadgeColor = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "bg-green-100 text-green-600";
    case "REJECTED":
      return "bg-red-100 text-red-600";
    case "SUBMITTED":
      return "bg-yellow-100 text-yellow-600";
    default:
      return "";
  }
};

const getStatusDot = (status: string) => {
  switch (status) {
    case "SPONSORED":
      return "text-green-600 bg-green-200";
    case "PENDING":
      return "text-yellow-600 bg-yellow-200";
    case "DISAPPROVED":
      return "text-red-600 bg-red-200";
    default:
      return "text-gray-600 bg-gray-200";
  }
};

const statusToDisplay = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "Accepted";
    case "REJECTED":
      return "Rejected";
    case "SUBMITTED":
      return "Submitted";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
};

const stateToDisplay = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "Sponsored";
    case "REJECTED":
      return "Disapproved";
    case "SUBMITTED":
      return "Pending";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
};

const SponsorApplicationpage = () => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [modalData, setModalData] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line
  }, [page, statusFilter]);

  const fetchApplications = async () => {
    try {
      let url = `${API_BASE_URL}?limit=20&page=${page}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setApplications(data.applications || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setApplications([]);
    }
  };

  const openReportModal = (app: any) => {
    setModalData(app);
    setIsReportOpen(true);
  };
  const closeReportModal = () => setIsReportOpen(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // You can implement search on typing or on pressing enter (not implemented here)
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "All" ? undefined : value);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative w-full sm:w-1/3">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Application ID | Search"
            className="pl-10 w-full"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="w-full sm:w-1/3">
          <Select onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="ACCEPTED">Sponsored</SelectItem>
              <SelectItem value="SUBMITTED">Pending</SelectItem>
              <SelectItem value="REJECTED">Disapproved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="dark:bg-gray-800 overflow-x-auto rounded-md">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Application ID</TableHead>
              <TableHead>Applicant Name</TableHead>
              <TableHead>Application Date</TableHead>
              <TableHead>Sponsorship Type</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Application View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>{app.id}</TableCell>
                <TableCell className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={app.user?.photo} />
                    <AvatarFallback>
                      {app.user?.firstName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="cursor-pointer text-blue-600 hover:underline"
                    onClick={() => navigate(`/team/Sponsorinfo`)}
                  >
                    {app.user
                      ? app.user.firstName + " " + app.user.lastName
                      : "-"}
                  </span>
                </TableCell>
                <TableCell>
                  {app.createdAt
                    ? new Date(app.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell>{app.sponsorshipType || "-"}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <span
                    className={`text-sm px-2 py-1 rounded ${getBadgeColor(
                      app.status
                    )}`}
                  >
                    {statusToDisplay(app.status)}
                  </span>
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Circle
                    size={10}
                    className={getStatusDot(
                      stateToDisplay(app.status).toUpperCase()
                    )}
                  />
                  <span>{stateToDisplay(app.status)}</span>
                </TableCell>
                <TableCell
                  className="text-blue-500 hover:underline cursor-pointer"
                  onClick={() => openReportModal(app)}
                >
                  {app.user
                    ? `${app.user.firstName}${app.user.lastName}.application`
                    : "View"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex justify-end mt-4 gap-2 text-sm">
          <button
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </button>
          <span className="px-2 pt-1">
            {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {isReportOpen && modalData && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 bg-opacity-95 overflow-auto">
          <div className="max-w-3xl mx-auto p-4 sm:p-6">
            <div className="flex justify-end">
              <button onClick={closeReportModal}>
                <X className="w-6 h-6 text-gray-800 hover:text-black dark:text-white" />
              </button>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-bold mb-4">Application Details</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={modalData.user?.photo} />
                  <AvatarFallback>
                    {modalData.user?.firstName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm space-y-1">
                  <div className="font-semibold text-lg">
                    {modalData.user
                      ? modalData.user.firstName + " " + modalData.user.lastName
                      : "-"}
                  </div>
                  <div className="text-gray-500">
                    Username: {modalData.user?.username || "-"}
                  </div>
                  <div className="text-gray-500">
                    Application ID: {modalData.id}
                  </div>
                  <div className="text-gray-500">
                    Date:{" "}
                    {modalData.createdAt
                      ? new Date(modalData.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </div>
                </div>
              </div>
              <hr className="my-4" />
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Sponsorship Type:</strong>{" "}
                  {modalData.sponsorshipType || "-"}
                </div>
                <div>
                  <strong>Reason for Sponsorship:</strong>{" "}
                  {modalData.reason || "-"}
                </div>
                <div>
                  <strong>What makes you/your team stand out:</strong>{" "}
                  {modalData.uniqueFactor || "-"}
                </div>
                <div>
                  <strong>Additional Info:</strong>{" "}
                  {modalData.additionalInfo || "-"}
                </div>
                <div>
                  <strong>Profile/Website:</strong>{" "}
                  <a
                    href={
                      modalData.website && !modalData.website.startsWith("http")
                        ? `https://${modalData.website}`
                        : modalData.website
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-words"
                  >
                    {modalData.website || "-"}
                  </a>
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded ${getBadgeColor(
                      modalData.status
                    )}`}
                  >
                    {statusToDisplay(modalData.status)}
                  </span>
                </div>
              </div>
              <hr className="my-4" />
              <div className="flex gap-4 items-center text-sm">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={modalData.sponsor?.photo} />
                  <AvatarFallback>
                    {modalData.sponsor?.firstName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">
                    Sponsor:{" "}
                    {modalData.sponsor
                      ? modalData.sponsor.firstName +
                        " " +
                        modalData.sponsor.lastName
                      : "-"}
                  </div>
                  <div className="text-gray-500">
                    {modalData.sponsor?.username && (
                      <>
                        Username: {modalData.sponsor.username}
                        <br />
                      </>
                    )}
                    Sponsor ID: {modalData.sponsor?.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorApplicationpage;
