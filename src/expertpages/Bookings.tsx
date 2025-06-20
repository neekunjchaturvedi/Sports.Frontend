import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faCheck,
  faTimes,
  faCalendarAlt,
  faVideo,
  faFileAlt,
  faStar,
  faCheckCircle,
  faUser,
  faMoneyBill,
  faClock,
  faMapMarkerAlt,
  faLink,
  faExclamationTriangle,
  faPager,
  faTrash,
  faLaptop,
  faVideoCamera,
  faChalkboardTeacher,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";

interface Expert {
  id: string;
  username: string;
  photo: string;
}

interface Player {
  id: string;
  username: string;
  photo: string;
}

interface ServiceDetails {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  id: string;
  serviceId: string;
  price: number;
  service: ServiceDetails;
}

interface Booking {
  id: string;
  playerId: string;
  expertId: string;
  serviceId: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  meetLink: string | null;
  recordedVideo: string | null;
  meetingRecording: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  expert: Expert;
  player: Player;
  service: Service;
  review?: string;
}

const BookingExpertside: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingStatus, setBookingStatus] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [filtersApplied, setFiltersApplied] = useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState<string | null>(null);

  const [isAcceptConfirmOpen, setIsAcceptConfirmOpen] = useState(false);
  const [bookingToAccept, setBookingToAccept] = useState<string | null>(null);

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<string | null>(
    null
  );
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const [isFullscreenVideoOpen, setIsFullscreenVideoOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const API_BASE_URL = `${import.meta.env.VITE_PORT}/api/v1`;
  const navigate = useNavigate();

  useEffect(() => {
    setFiltersApplied(
      bookingStatus !== "all" ||
        actionFilter !== "all" ||
        serviceTypeFilter !== "all" ||
        dateFilter !== "" ||
        search !== ""
    );
  }, [bookingStatus, actionFilter, serviceTypeFilter, dateFilter, search]);

  const isRecordedVideoAssessment = (booking: Booking) => {
    return booking.service?.service?.id === "1" && booking.recordedVideo;
  };

  const getServiceType = (booking: Booking): string => {
    if (booking.service?.serviceId === "1") {
      return "recorded-video";
    } else if (booking.service?.serviceId === "2") {
      return "online";
    } else if (booking.service?.serviceId === "3") {
      return "in-person";
    }
    return "other";
  };

  const getServiceTypeName = (type: string): string => {
    switch (type) {
      case "recorded-video":
        return "RECORDED VIDEO ASSESSMENT";
      case "online":
        return "ONLINE TRAINING";
      case "in-person":
        return "ON GROUND ASSESSMENT";
      case "other":
      default:
        return "ONLINE ASSESSMENT";
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case "recorded-video":
        return faVideoCamera;
      case "online":
        return faLaptop;
      case "in-person":
        return faChalkboardTeacher;
      default:
        return faInfoCircle;
    }
  };

  const clearAllFilters = () => {
    setBookingStatus("all");
    setActionFilter("all");
    setServiceTypeFilter("all");
    setDateFilter("");
    setSearch("");
  };

  const openFullscreenVideo = (booking: Booking) => {
    if (isRecordedVideoAssessment(booking)) {
      setVideoError(null);
      setCurrentVideoUrl(booking.recordedVideo);
      setIsFullscreenVideoOpen(true);
    }
  };

  const closeFullscreenVideo = () => {
    setIsFullscreenVideoOpen(false);
    setCurrentVideoUrl(null);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/booking`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        setBookings(response.data.bookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Could not load bookings. Using demo data instead.");
        setBookings(getDemoBookings());
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleVideoError = () => {
    setVideoError(
      "Failed to load video. The URL might be invalid or the video may no longer be available."
    );
  };

  const getDemoBookings = (): Booking[] => {
    return [
      {
        id: "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
        playerId: "p1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
        expertId: "e1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
        serviceId: "s1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
        status: "WAITING_EXPERT_APPROVAL",
        date: "2025-05-15T00:00:00.000Z",
        startTime: "10:00",
        endTime: "11:00",
        location: null,
        meetLink: null,
        recordedVideo: null,
        meetingRecording: null,
        createdAt: "2025-04-29T14:30:00.000Z",
        updatedAt: "2025-04-29T14:30:00.000Z",
        player: {
          id: "p1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
          username: "alex_taylor",
          photo: "https://i.pravatar.cc/150?u=alex",
        },
        expert: {
          id: "e1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
          username: "john_coach",
          photo: "https://i.pravatar.cc/150?u=john",
        },
        service: {
          id: "s1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
          serviceId: "1",
          price: 35,
          service: {
            id: "1",
            name: "Technical Training Session",
            description: "One-on-one technical skills training",
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
          },
        },
      },
      {
        id: "c2b3d4e5-f6g7-8901-hijk-lm2345678901",
        playerId: "p2b3c4d5-e6f7-8901-ijkl-mnopqrstu2",
        expertId: "e1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
        serviceId: "s2b3c4d5-e6f7-8901-ijkl-mnopqrstu2",
        status: "ACCEPTED",
        date: "2025-05-20T00:00:00.000Z",
        startTime: "14:00",
        endTime: "15:00",
        location: null,
        meetLink: "https://meet.google.com/abc-defg-hij",
        recordedVideo: null,
        meetingRecording: null,
        createdAt: "2025-04-30T09:15:00.000Z",
        updatedAt: "2025-05-01T10:20:00.000Z",
        player: {
          id: "p2b3c4d5-e6f7-8901-ijkl-mnopqrstu2",
          username: "michael_brown",
          photo: "https://i.pravatar.cc/150?u=michael",
        },
        expert: {
          id: "e1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
          username: "john_coach",
          photo: "https://i.pravatar.cc/150?u=john",
        },
        service: {
          id: "s2b3c4d5-e6f7-8901-ijkl-mnopqrstu2",
          serviceId: "2",
          price: 40,
          service: {
            id: "2",
            name: "Strategy Session",
            description: "Game strategy and tactical analysis",
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
          },
        },
      },
      {
        id: "d3c4e5f6-g7h8-9012-jklm-no3456789012",
        playerId: "p3c4d5e6-f7g8-9012-jklm-nopqrstuv3",
        expertId: "e1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
        serviceId: "s3c4d5e6-f7g8-9012-jklm-nopqrstuv3",
        status: "COMPLETED",
        date: "2025-04-25T00:00:00.000Z",
        startTime: "09:00",
        endTime: "10:00",
        location: "Central Park Field #3",
        meetLink: null,
        recordedVideo: "https://example.com/videos/session123.mp4",
        meetingRecording: null,
        createdAt: "2025-04-22T11:30:00.000Z",
        updatedAt: "2025-04-25T10:05:00.000Z",
        review:
          "Player showed strong fundamentals but needs to work on positioning. Overall good progress.",
        player: {
          id: "p3c4d5e6-f7g8-9012-jklm-nopqrstuv3",
          username: "sophia_williams",
          photo: "https://i.pravatar.cc/150?u=sophia",
        },
        expert: {
          id: "e1a2b3c4-d5e6-7890-fghi-jklmnopqrst1",
          username: "john_coach",
          photo: "https://i.pravatar.cc/150?u=john",
        },
        service: {
          id: "s3c4d5e6-f7g8-9012-jklm-nopqrstuv3",
          serviceId: "3",
          price: 45,
          service: {
            id: "3",
            name: "Field Training",
            description: "On-field practice and drills",
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
          },
        },
      },
    ];
  };

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setVideoError(null);
    setIsBookingDetailsOpen(true);
  };

  const closeBookingDetails = () => {
    setIsBookingDetailsOpen(false);
    setSelectedBooking(null);
    setVideoError(null);
  };

  const openRejectConfirmDialog = (bookingId: string) => {
    setBookingToReject(bookingId);
    setIsRejectConfirmOpen(true);

    if (selectedBooking?.id !== bookingId) {
      setIsBookingDetailsOpen(false);
    }
  };

  const closeRejectConfirmDialog = () => {
    setIsRejectConfirmOpen(false);
    setBookingToReject(null);
  };

  const openAcceptConfirmDialog = (bookingId: string) => {
    setBookingToAccept(bookingId);
    setIsAcceptConfirmOpen(true);

    if (selectedBooking?.id !== bookingId) {
      setIsBookingDetailsOpen(false);
    }
  };

  const closeAcceptConfirmDialog = () => {
    setIsAcceptConfirmOpen(false);
    setBookingToAccept(null);
  };

  const openRescheduleModal = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setBookingToReschedule(bookingId);
      setRescheduleDate(booking.date.split("T")[0]);
      setRescheduleStartTime(booking.startTime);
      setRescheduleEndTime(booking.endTime);
      setIsRescheduleModalOpen(true);

      if (selectedBooking?.id !== bookingId) {
        setIsBookingDetailsOpen(false);
      }
    }
  };

  const closeRescheduleModal = () => {
    setIsRescheduleModalOpen(false);
    setBookingToReschedule(null);
    setRescheduleDate("");
    setRescheduleStartTime("");
    setRescheduleEndTime("");
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_BASE_URL}/booking/${bookingId}/accept`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "ACCEPTED" }
            : booking
        )
      );

      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: "ACCEPTED" });
      }

      closeAcceptConfirmDialog();

      if (isBookingDetailsOpen) {
        closeBookingDetails();
      }

      // Success alert
      await Swal.fire({
        icon: "success",
        title: "Booking Accepted!",
        text: "The booking has been successfully accepted. The player has been notified.",
        confirmButtonColor: "#10B981",
        timer: 2500,
      });
    } catch (error) {
      console.error("Error accepting booking:", error);

      await Swal.fire({
        icon: "error",
        title: "Accept Failed",
        text: "Failed to accept booking. Please try again.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_BASE_URL}/booking/${bookingId}/reject`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "REJECTED" }
            : booking
        )
      );

      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: "REJECTED" });
      }

      closeRejectConfirmDialog();
      closeBookingDetails();

      // Success alert
      await Swal.fire({
        icon: "info",
        title: "Booking Rejected",
        text: "The booking has been rejected. The player has been notified.",
        confirmButtonColor: "#6B7280",
        timer: 2500,
      });
    } catch (error) {
      console.error("Error rejecting booking:", error);

      await Swal.fire({
        icon: "error",
        title: "Reject Failed",
        text: "Failed to reject booking. Please try again.",
        confirmButtonColor: "#EF4444",
      });

      closeRejectConfirmDialog();
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleBooking = async () => {
    if (
      !bookingToReschedule ||
      !rescheduleDate ||
      !rescheduleStartTime ||
      !rescheduleEndTime
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all the required fields.",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    try {
      setRescheduling(true);
      const token = localStorage.getItem("token");

      const rescheduleData = {
        date: rescheduleDate,
        startTime: rescheduleStartTime,
        endTime: rescheduleEndTime,
      };

      await axios.patch(
        `${API_BASE_URL}/booking/${bookingToReschedule}/reschedule`,
        rescheduleData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingToReschedule
            ? {
                ...booking,
                status: "RESCHEDULED",
                date: `${rescheduleDate}T00:00:00.000Z`,
                startTime: rescheduleStartTime,
                endTime: rescheduleEndTime,
              }
            : booking
        )
      );

      if (selectedBooking && selectedBooking.id === bookingToReschedule) {
        setSelectedBooking({
          ...selectedBooking,
          status: "RESCHEDULED",
          date: `${rescheduleDate}T00:00:00.000Z`,
          startTime: rescheduleStartTime,
          endTime: rescheduleEndTime,
        });
      }

      closeRescheduleModal();
      closeBookingDetails();

      // Success alert
      await Swal.fire({
        icon: "success",
        title: "Booking Rescheduled!",
        text: "The booking has been successfully rescheduled. The player will be notified of the changes.",
        confirmButtonColor: "#10B981",
        timer: 3000,
        showConfirmButton: true,
      });
    } catch (error) {
      console.error("Error rescheduling booking:", error);

      // Error alert
      await Swal.fire({
        icon: "error",
        title: "Reschedule Failed",
        text: "Failed to reschedule booking. Please try again or contact support if the problem persists.",
        confirmButtonColor: "#EF4444",
        footer: `<small>Error occurred at: ${new Date().toLocaleString()}</small>`,
      });
    } finally {
      setRescheduling(false);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_BASE_URL}/booking/${bookingId}/complete`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "COMPLETED" }
            : booking
        )
      );

      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: "COMPLETED" });
      }

      closeBookingDetails();
    } catch (error) {
      console.error("Error completing booking:", error);
      setError("Failed to complete booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    setSelectedBookingId(bookingId);
    setReviewText(booking?.review || "");
    setIsReviewModalOpen(true);
    setIsBookingDetailsOpen(false);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedBookingId(null);
    setReviewText("");
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingId) return;

    setSubmittingReview(true);

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_BASE_URL}/booking/${selectedBookingId}/review`,
        { review: reviewText },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === selectedBookingId
            ? { ...booking, review: reviewText }
            : booking
        )
      );

      if (selectedBooking && selectedBooking.id === selectedBookingId) {
        setSelectedBooking({ ...selectedBooking, review: reviewText });
      }

      closeReviewModal();
    } catch (error) {
      console.error("Error submitting review:", error);
      setError("Failed to submit review. Please try again.");

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === selectedBookingId
            ? { ...booking, review: reviewText }
            : booking
        )
      );
      closeReviewModal();
    } finally {
      setSubmittingReview(false);
    }
  };

  const getActionBadgeStyle = (status: string) => {
    switch (status) {
      case "ACCEPTED":
      case "CONFIRMED":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "RESCHEDULED":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "WAITING_EXPERT_APPROVAL":
      case "PENDING":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "SCHEDULED":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getPaymentBadgeStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "SCHEDULED":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "WAITING_EXPERT_APPROVAL":
      case "PENDING":
      case "CONFIRMED":
      case "ACCEPTED":
      case "RESCHEDULED":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getPaymentStatus = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Paid";
      case "REJECTED":
      case "CANCELLED":
        return "Not Paid";
      case "SCHEDULED":
        return "Paid";
      default:
        return "Pending";
    }
  };

  const formatDate = (dateStr: string, startTime: string) => {
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const [hours, minutes] = startTime.split(":");
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "pm" : "am";
    hour = hour % 12;
    hour = hour ? hour : 12;

    return `${formattedDate} at ${hour}:${minutes}${ampm}`;
  };

  const truncateUsername = (username: string, maxLength: number = 15) => {
    if (username.length <= maxLength) return username;
    return `${username.substring(0, maxLength)}...`;
  };

  const matchesDateFilter = (booking: Booking) => {
    if (!dateFilter) return true;

    const bookingDate = new Date(booking.date);
    bookingDate.setHours(0, 0, 0, 0);

    const filterDate = new Date(dateFilter);
    filterDate.setHours(0, 0, 0, 0);

    return bookingDate.getTime() === filterDate.getTime();
  };

  const matchesServiceTypeFilter = (booking: Booking) => {
    if (serviceTypeFilter === "all") return true;
    return getServiceType(booking) === serviceTypeFilter;
  };

  const filteredBookings = bookings.filter((booking) => {
    const playerName = booking.player?.username || "";
    const matchesSearch = playerName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      bookingStatus === "all" ||
      getPaymentStatus(booking.status) === bookingStatus;
    const matchesAction =
      actionFilter === "all" ||
      (actionFilter === "Accepted" &&
        ["CONFIRMED", "ACCEPTED"].includes(booking.status)) ||
      (actionFilter === "Rejected" && booking.status === "REJECTED") ||
      (actionFilter === "Re-Scheduled" && booking.status === "RESCHEDULED") ||
      (actionFilter === "Completed" && booking.status === "COMPLETED") ||
      (actionFilter === "Pending" &&
        booking.status === "WAITING_EXPERT_APPROVAL");
    actionFilter === "Scheduled" && booking.status === "SCHEDULED";

    return (
      matchesSearch &&
      matchesStatus &&
      matchesAction &&
      matchesDateFilter(booking) &&
      matchesServiceTypeFilter(booking)
    );
  });

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-md shadow-md">
      <h1 className="text-2xl font-bold mb-6">Your Bookings</h1>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative w-full sm:w-1/5">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Search by Player Name"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative sm:w-auto flex min-w-[120px]">
          <FontAwesomeIcon
            icon={faCalendarAlt}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            type="date"
            className="pl-10"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            max="2030-12-31"
            min="2020-01-01"
          />
        </div>

        <Select value={bookingStatus} onValueChange={setBookingStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Not Paid">Not Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Booking Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Re-Scheduled">Re-Scheduled</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Service Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Service Types</SelectItem>
            <SelectItem value="recorded-video">
              RECORDED VIDEO ASSESSMENT
            </SelectItem>
            <SelectItem value="online">ONLINE TRAINING</SelectItem>
            <SelectItem value="in-person">ON GROUND ASSESSMENT</SelectItem>
            <SelectItem value="other">ONLINE ASSESSMENT</SelectItem>
          </SelectContent>
        </Select>

        {filtersApplied && (
          <Button
            variant="outline"
            className="flex items-center text-red-600 border-red-600"
            onClick={clearAllFilters}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            <span>Clear Filters</span>
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading bookings...</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[140px]">Player</TableHead>
                <TableHead className="w-[160px]">Date</TableHead>
                <TableHead className="w-[140px]">Service</TableHead>
                <TableHead className="w-[80px]">Price</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]">Payment</TableHead>
                <TableHead className="text-center w-[120px]">Actions</TableHead>
                <TableHead className="text-center w-[70px]">Session</TableHead>
                <TableHead className="text-center w-[70px]">Report</TableHead>
                <TableHead className="text-center w-[70px]">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openBookingDetails(booking)}
                  >
                    <TableCell className="font-medium">
                      {booking.id.substring(0, 6)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="truncate max-w-[100px]"
                          title={booking.player?.username}
                          onClick={() => {
                            const player = booking.player?.username;
                            localStorage.setItem("viewplayerusername", player);
                            navigate("/expert/playerinfo");
                          }}
                        >
                          {truncateUsername(
                            booking.player?.username || "Unknown Player"
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(booking.date, booking.startTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={getServiceTypeIcon(getServiceType(booking))}
                          className="text-gray-500"
                        />
                        <span
                          className="truncate max-w-[100px]"
                          title={booking.service?.service?.name}
                        >
                          {booking.service?.service?.name || "Unknown Service"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>${booking.service?.price || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getActionBadgeStyle(booking.status)}
                      >
                        {formatStatus(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getPaymentBadgeStyle(booking.status)}
                      >
                        {getPaymentStatus(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex justify-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAcceptConfirmDialog(booking.id);
                          }}
                          title="Accept Booking"
                          disabled={
                            booking.status !== "WAITING_EXPERT_APPROVAL"
                          }
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRejectConfirmDialog(booking.id);
                          }}
                          title="Reject Booking"
                          disabled={
                            booking.status !== "WAITING_EXPERT_APPROVAL"
                          }
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRescheduleModal(booking.id);
                          }}
                          title="Reschedule Booking"
                          disabled={
                            !["WAITING_EXPERT_APPROVAL", "ACCEPTED"].includes(
                              booking.status
                            )
                          }
                        >
                          <FontAwesomeIcon icon={faCalendarAlt} />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={
                          isRecordedVideoAssessment(booking)
                            ? "View Video Assessment"
                            : "Start Video Session"
                        }
                        disabled={
                          !isRecordedVideoAssessment(booking) &&
                          !booking.meetLink
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isRecordedVideoAssessment(booking)) {
                            openFullscreenVideo(booking);
                          } else if (booking.meetLink) {
                            window.open(booking.meetLink, "_blank");
                          }
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faVideo}
                          className={
                            isRecordedVideoAssessment(booking)
                              ? "text-black"
                              : booking.meetLink
                              ? "text-green-500"
                              : "text-gray-400"
                          }
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Create/View Report"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FontAwesomeIcon icon={faFileAlt} />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${
                          booking.review ? "text-yellow-500" : ""
                        }`}
                        title={booking.review ? "Edit Review" : "Add Review"}
                        onClick={(e) => {
                          e.stopPropagation();
                          openReviewModal(booking.id);
                        }}
                      >
                        <FontAwesomeIcon icon={faStar} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4">
        <h3 className="font-medium mb-2">Active Sessions</h3>
        <div className="space-y-2">
          {bookings
            .filter((booking) => booking.status === "ACCEPTED")
            .map((booking) => (
              <div
                key={`complete-${booking.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer"
                onClick={() => openBookingDetails(booking)}
              >
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <img
                    src={
                      booking.player?.photo ||
                      `https://i.pravatar.cc/60?u=${booking.playerId}`
                    }
                    alt="Player"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://i.pravatar.cc/60?u=${booking.playerId}`;
                    }}
                  />
                  <div>
                    <p
                      className="font-medium"
                      onClick={() => {
                        const player = booking.player?.username;
                        localStorage.setItem("viewplayerusername", player);
                        navigate("/expert/playerinfo");
                      }}
                    >
                      {booking.player?.username || "Unknown Player"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {booking.service?.service?.name} -{" "}
                      {formatDate(booking.date, booking.startTime)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border-purple-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompleteBooking(booking.id);
                  }}
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  Mark as Completed
                </Button>
              </div>
            ))}
          {bookings.filter((b) => b.status === "ACCEPTED").length === 0 && (
            <p className="text-gray-500 text-center py-2">
              No active sessions to complete
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800">Total Bookings</h3>
          <p className="text-2xl font-bold">{bookings.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="font-medium text-green-800">Accepted</h3>
          <p className="text-2xl font-bold">
            {
              bookings.filter((b) =>
                ["CONFIRMED", "ACCEPTED"].includes(b.status)
              ).length
            }
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <h3 className="font-medium text-red-800">Rejected</h3>
          <p className="text-2xl font-bold">
            {bookings.filter((b) => b.status === "REJECTED").length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="font-medium text-purple-800">Completed</h3>
          <p className="text-2xl font-bold">
            {bookings.filter((b) => b.status === "COMPLETED").length}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings
            .filter((booking) => booking.status === "ACCEPTED")
            .slice(0, 3)
            .map((booking) => (
              <div
                key={`upcoming-${booking.id}`}
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer"
                onClick={() => openBookingDetails(booking)}
              >
                <div className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <div className="flex items-center gap-2 mb-1">
                      <FontAwesomeIcon
                        icon={getServiceTypeIcon(getServiceType(booking))}
                        className="text-gray-500"
                      />
                      <h3
                        className="font-medium truncate"
                        title={booking.service?.service?.name}
                      >
                        {booking.service?.service?.name || "Service"}
                      </h3>
                    </div>
                    <p
                      className="text-sm text-gray-500 truncate"
                      title={`with ${booking.player?.username || "Player"}`}
                    >
                      with {booking.player?.username || "Player"}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-800">
                    {new Date(booking.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Badge>
                </div>
                <div className="mt-4 flex justify-between">
                  <span className="text-gray-600">
                    ${booking.service?.price || "N/A"}
                  </span>
                </div>
              </div>
            ))}

          {bookings.filter((booking) => booking.status === "ACCEPTED")
            .length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-4 text-gray-500">
              No upcoming sessions
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <Dialog
          open={isBookingDetailsOpen}
          onOpenChange={setIsBookingDetailsOpen}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Booking Details</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <Badge
                  variant="outline"
                  className={getActionBadgeStyle(selectedBooking.status)}
                >
                  {formatStatus(selectedBooking.status)}
                </Badge>
                <Badge
                  variant="outline"
                  className={getPaymentBadgeStyle(selectedBooking.status)}
                >
                  {getPaymentStatus(selectedBooking.status)}
                </Badge>
              </div>

              <div className="mb-5 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="mr-2 text-gray-600"
                  />
                  Player Information
                </h3>
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={
                      selectedBooking.player?.photo ||
                      `https://i.pravatar.cc/60?u=${selectedBooking.playerId}`
                    }
                    alt="Player"
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://i.pravatar.cc/60?u=${selectedBooking.playerId}`;
                    }}
                  />
                  <div>
                    <h4 className="font-medium">
                      {selectedBooking.player?.username}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Player ID: {selectedBooking.playerId.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-5 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold flex items-center">
                    <FontAwesomeIcon
                      icon={getServiceTypeIcon(getServiceType(selectedBooking))}
                      className="mr-2 text-gray-600"
                    />
                    Service Details
                  </h3>
                  <div className="text-lg font-bold text-green-700">
                    <FontAwesomeIcon icon={faMoneyBill} className="mr-1" />$
                    {selectedBooking.service?.price || "N/A"}
                  </div>
                </div>
                <p className="font-medium break-words">
                  {selectedBooking.service?.service?.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Type: {getServiceTypeName(getServiceType(selectedBooking))}
                </p>
                {selectedBooking.service?.service?.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedBooking.service.service.description}
                  </p>
                )}
              </div>

              <div className="mb-5 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="mr-2 text-gray-600"
                  />
                  Session Information
                </h3>
                <p className="mb-1">
                  <span className="font-medium">Date & Time:</span>{" "}
                  {formatDate(selectedBooking.date, selectedBooking.startTime)}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Duration:</span>{" "}
                  {selectedBooking.startTime} - {selectedBooking.endTime}
                </p>
                {selectedBooking.location && (
                  <p className="mb-1 flex items-start">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="mr-2 mt-1 text-gray-600"
                    />
                    <span className="break-words">
                      {selectedBooking.location}
                    </span>
                  </p>
                )}
                {selectedBooking.meetLink && (
                  <>
                    <p className="mb-1 flex items-start">
                      <FontAwesomeIcon
                        icon={faLink}
                        className="mr-2 mt-1 text-gray-600"
                      />
                      <a
                        href={selectedBooking.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {selectedBooking.meetLink}
                      </a>
                    </p>
                  </>
                )}
              </div>
              <div className="mb-5 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <FontAwesomeIcon
                    icon={faPager}
                    className="mr-2 text-gray-600"
                  />
                  Description
                </h3>

                {selectedBooking.description && (
                  <>
                    <p className="mb-1 flex items-start">
                      {selectedBooking.description}
                    </p>
                  </>
                )}
              </div>

              {(selectedBooking.recordedVideo ||
                selectedBooking.meetingRecording) && (
                <div className="mb-5 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <FontAwesomeIcon
                      icon={faVideo}
                      className="mr-2 text-gray-600"
                    />
                    Media
                  </h3>

                  {selectedBooking.recordedVideo && (
                    <div className="mb-2">
                      <p className="font-medium mb-2">Recorded Video:</p>

                      {selectedBooking.service?.serviceId === "1" ? (
                        <div className="w-full rounded-lg overflow-hidden border border-gray-200">
                          {videoError ? (
                            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700 flex items-center">
                              <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                className="mr-2"
                              />
                              <span>{videoError}</span>
                            </div>
                          ) : (
                            <video
                              src={selectedBooking.recordedVideo}
                              controls
                              className="w-full h-auto"
                              preload="metadata"
                              onError={handleVideoError}
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}

                          <div className="mt-2 text-sm text-gray-500">
                            <p>
                              If the video doesn't play, you can also{" "}
                              <a
                                href={selectedBooking.recordedVideo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                open it directly
                              </a>
                              .
                            </p>
                          </div>

                          <div className="mt-3 text-sm text-gray-600">
                            <p>
                              Uploaded by: {selectedBooking.player?.username}
                            </p>
                            <p>
                              Date:{" "}
                              {new Date(
                                selectedBooking.createdAt
                              ).toLocaleDateString()}
                            </p>
                            {selectedBooking.description && (
                              <div className="mt-2">
                                <p className="font-medium">Description:</p>
                                <p className="italic">
                                  {selectedBooking.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <a
                          href={selectedBooking.recordedVideo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          View Video
                        </a>
                      )}
                    </div>
                  )}

                  {selectedBooking.meetingRecording && (
                    <div>
                      <p className="font-medium">Meeting Recording:</p>
                      <a
                        href={selectedBooking.meetingRecording}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        View Recording
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selectedBooking.review && (
                <div className="mb-5 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <FontAwesomeIcon
                      icon={faStar}
                      className="mr-2 text-yellow-500"
                    />
                    Your Review
                  </h3>
                  <p className="text-gray-700 italic">
                    "{selectedBooking.review}"
                  </p>
                  <button
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={() => openReviewModal(selectedBooking.id)}
                  >
                    Edit Review
                  </button>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                <p>Booking ID: {selectedBooking.id}</p>
                <p>
                  Created:{" "}
                  {new Date(selectedBooking.createdAt).toLocaleString()}
                </p>
                <p>
                  Last Updated:{" "}
                  {new Date(selectedBooking.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-wrap gap-2 justify-end">
              {selectedBooking.status === "WAITING_EXPERT_APPROVAL" && (
                <>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => openRejectConfirmDialog(selectedBooking.id)}
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="border-yellow-500 text-yellow-500 hover:bg-yellow-50"
                    onClick={() => openRescheduleModal(selectedBooking.id)}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                    Reschedule
                  </Button>
                  <Button
                    className="bg-green-500 text-white hover:bg-green-600"
                    onClick={() => openAcceptConfirmDialog(selectedBooking.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                    Accept
                  </Button>
                </>
              )}

              {selectedBooking.status === "ACCEPTED" && (
                <>
                  <Button
                    variant="outline"
                    className="border-yellow-500 text-yellow-500 hover:bg-yellow-50"
                    onClick={() => openRescheduleModal(selectedBooking.id)}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                    Reschedule
                  </Button>
                  {selectedBooking.meetLink && (
                    <Button
                      variant="outline"
                      className="border-blue-500 text-blue-500 hover:bg-blue-50"
                      onClick={() =>
                        window.open(selectedBooking.meetLink, "_blank")
                      }
                    >
                      <FontAwesomeIcon icon={faVideo} className="mr-2" />
                      Join Session
                    </Button>
                  )}
                  <Button
                    className="bg-purple-500 text-white hover:bg-purple-600"
                    onClick={() => handleCompleteBooking(selectedBooking.id)}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    Mark Completed
                  </Button>
                </>
              )}

              {selectedBooking.status === "COMPLETED" &&
                !selectedBooking.review && (
                  <Button
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                    onClick={() => openReviewModal(selectedBooking.id)}
                  >
                    <FontAwesomeIcon icon={faStar} className="mr-2" />
                    Add Review
                  </Button>
                )}

              <Button
                variant="outline"
                onClick={closeBookingDetails}
                className="ml-2"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {bookings.find((b) => b.id === selectedBookingId)?.review
                ? "Edit Player Review"
                : "Add Player Review"}
            </DialogTitle>
            <DialogDescription>
              Add your feedback about the player's performance during this
              session. This review will be visible to the player.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Session Details:</p>
              {selectedBookingId && (
                <p className="text-sm text-gray-500">
                  {bookings.find((b) => b.id === selectedBookingId)?.service
                    ?.service?.name || "Service"}{" "}
                  with{" "}
                  {bookings.find((b) => b.id === selectedBookingId)?.player
                    ?.username || "Player"}{" "}
                  on{" "}
                  {bookings.find((b) => b.id === selectedBookingId)
                    ? formatDate(
                        bookings.find((b) => b.id === selectedBookingId)
                          ?.date || "",
                        bookings.find((b) => b.id === selectedBookingId)
                          ?.startTime || ""
                      )
                    : ""}
                </p>
              )}
            </div>

            <Textarea
              placeholder="Enter your review here..."
              className="min-h-[150px]"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeReviewModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submittingReview || !reviewText.trim()}
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Confirm Rejection
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this booking? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {bookingToReject && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">
                  <span className="font-semibold">Player:</span>{" "}
                  {
                    bookings.find((b) => b.id === bookingToReject)?.player
                      ?.username
                  }
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Service:</span>{" "}
                  {
                    bookings.find((b) => b.id === bookingToReject)?.service
                      ?.service?.name
                  }
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Date:</span>{" "}
                  {formatDate(
                    bookings.find((b) => b.id === bookingToReject)?.date || "",
                    bookings.find((b) => b.id === bookingToReject)?.startTime ||
                      ""
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeRejectConfirmDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                bookingToReject && handleRejectBooking(bookingToReject)
              }
            >
              Reject Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Confirmation Modal */}
      <Dialog open={isAcceptConfirmOpen} onOpenChange={setIsAcceptConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-green-600">
              Confirm Acceptance
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this booking? You'll be committed
              to providing this service at the scheduled time.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {bookingToAccept && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">
                  <span className="font-semibold">Player:</span>{" "}
                  {
                    bookings.find((b) => b.id === bookingToAccept)?.player
                      ?.username
                  }
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Service:</span>{" "}
                  {
                    bookings.find((b) => b.id === bookingToAccept)?.service
                      ?.service?.name
                  }
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Date:</span>{" "}
                  {formatDate(
                    bookings.find((b) => b.id === bookingToAccept)?.date || "",
                    bookings.find((b) => b.id === bookingToAccept)?.startTime ||
                      ""
                  )}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Price:</span> $
                  {bookings.find((b) => b.id === bookingToAccept)?.service
                    ?.price || "N/A"}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAcceptConfirmDialog}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() =>
                bookingToAccept && handleAcceptBooking(bookingToAccept)
              }
            >
              Accept Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isRescheduleModalOpen}
        onOpenChange={setIsRescheduleModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
              Reschedule Booking
            </DialogTitle>
            <DialogDescription className="text-gray-600 mb-4">
              Select a new date and time for this booking session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {bookingToReschedule && (
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm">
                  <span className="font-semibold">Player:</span>{" "}
                  {
                    bookings.find((b) => b.id === bookingToReschedule)?.player
                      ?.username
                  }
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Service:</span>{" "}
                  {
                    bookings.find((b) => b.id === bookingToReschedule)?.service
                      ?.service?.name
                  }
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Current Date:</span>{" "}
                  {bookings.find((b) => b.id === bookingToReschedule) &&
                    formatDate(
                      bookings.find((b) => b.id === bookingToReschedule)
                        ?.date || "",
                      bookings.find((b) => b.id === bookingToReschedule)
                        ?.startTime || ""
                    )}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Date
              </label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <Input
                type="time"
                value={rescheduleStartTime}
                onChange={(e) => setRescheduleStartTime(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <Input
                type="time"
                value={rescheduleEndTime}
                onChange={(e) => setRescheduleEndTime(e.target.value)}
                className="w-full"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              onClick={closeRescheduleModal}
              disabled={rescheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleBooking}
              disabled={
                rescheduling ||
                !rescheduleDate ||
                !rescheduleStartTime ||
                !rescheduleEndTime
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {rescheduling ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Rescheduling...
                </>
              ) : (
                "Reschedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isFullscreenVideoOpen &&
        currentVideoUrl &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={closeFullscreenVideo}
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </Button>
            </div>

            <div className="w-full h-full max-w-6xl max-h-[80vh] p-4">
              <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
                {videoError ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-red-700 max-w-md">
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className="mr-2"
                      />
                      <span>{videoError}</span>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    src={currentVideoUrl}
                    controls
                    autoPlay
                    className="w-full h-full"
                    onError={handleVideoError}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              <div className="mt-4 text-white text-center">
                <p className="text-sm">
                  If the video doesn't play properly, you can{" "}
                  <a
                    href={currentVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    download it
                  </a>{" "}
                  and play it locally.
                </p>
                <div className="flex justify-end">
                  <Button
                    className="bg-red-500 hover:bg-red-600 w-24"
                    onClick={closeFullscreenVideo}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default BookingExpertside;
