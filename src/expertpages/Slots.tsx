import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Swal from "sweetalert2";
import BulkAvailabilityManager from "./Bulkslotmanager";

interface TimeSlot {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

interface AvailabilityPattern {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface DailyAvailability {
  [date: string]: boolean;
}

const ExpertAvailabilityManager = () => {
  const currentDate = new Date("2025-06-08 08:16:50");
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date(currentDate));
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availabilityPatterns, setAvailabilityPatterns] = useState<
    AvailabilityPattern[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingAvailabilityPatterns, setLoadingAvailabilityPatterns] =
    useState(false);
  const [addSlotDialogOpen, setAddSlotDialogOpen] = useState(false);
  const [newSlotStartTime, setNewSlotStartTime] = useState("09:00");
  const [newSlotEndTime, setNewSlotEndTime] = useState("09:30");
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [monthlyAvailability, setMonthlyAvailability] =
    useState<DailyAvailability>({});
  const [selectedDayAvailability, setSelectedDayAvailability] = useState(true);
  const [blockReasonDialogOpen, setBlockReasonDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockingDate, setBlockingDate] = useState<Date | null>(null);
  const [blockingTimeSlot, setBlockingTimeSlot] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);

  const API_BASE_URL = `${import.meta.env.VITE_PORT}/api/v1/user/availability`;
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeekMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const dayOfWeekReverseMap = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const expertId =
    localStorage.getItem("userId") ||
    localStorage.getItem("userid") ||
    localStorage.getItem("user_id");

  const token = localStorage.getItem("token");
  const axiosInstance = axios.create({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const timeOptions = [
    "06:00",
    "06:30",
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
  ];

  useEffect(() => {
    fetchAvailabilityPatterns();
  }, []);

  useEffect(() => {
    fetchMonthlyAvailability();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlotsForSelectedDate();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      const formattedSelectedDate = formatDateString(selectedDate);
      if (monthlyAvailability[formattedSelectedDate] !== undefined) {
        setSelectedDayAvailability(monthlyAvailability[formattedSelectedDate]);
      }
    }
  }, [monthlyAvailability, selectedDate]);

  const fetchAvailabilityPatterns = async () => {
    setLoadingAvailabilityPatterns(true);
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/${expertId}`);
      setAvailabilityPatterns(response.data);
    } catch (error) {
      console.error("Error fetching availability patterns:", error);
      Swal.fire("Error", "Failed to load availability patterns", "error");
    } finally {
      setLoadingAvailabilityPatterns(false);
    }
  };

  const fetchMonthlyAvailability = async () => {
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}/${expertId}/monthly?month=${
          currentMonth + 1
        }&year=${currentYear}`
      );
      setMonthlyAvailability(response.data);
    } catch (error) {
      console.error("Error fetching monthly availability:", error);
      Swal.fire("Error", "Failed to load monthly availability", "error");
      generateDummyMonthlyAvailability();
    }
  };

  const fetchTimeSlotsForSelectedDate = async () => {
    if (!selectedDate) return;

    setLoading(true);
    const formattedDate = formatDateString(selectedDate);

    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}/${expertId}/slots?date=${formattedDate}`
      );

      const transformedSlots: TimeSlot[] = response.data.map((slot: any) => ({
        id: slot.id || generateId(),
        date: formattedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: slot.available,
        reason: slot.reason,
      }));

      setTimeSlots(transformedSlots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      Swal.fire("Error", "Failed to load time slots", "error");
      if (!monthlyAvailability[formattedDate]) {
        setTimeSlots([]);
      } else {
        generateDummyTimeSlots(formattedDate);
      }
    } finally {
      setLoading(false);
    }
  };

  const blockDate = async (
    date: Date,
    reason: string,
    timeSlot?: { startTime: string; endTime: string }
  ) => {
    const formattedDate = formatDateString(date);

    try {
      const payload: any = {
        date: formattedDate,
        reason: reason,
      };

      if (timeSlot) {
        payload.startTime = timeSlot.startTime;
        payload.endTime = timeSlot.endTime;
      }

      await axiosInstance.patch(`${API_BASE_URL}/block`, payload);

      if (!timeSlot) {
        setMonthlyAvailability((prev) => ({
          ...prev,
          [formattedDate]: false,
        }));

        if (isSameDay(date, selectedDate)) {
          setSelectedDayAvailability(false);
          setTimeSlots([]);
        }
        Swal.fire(
          "Success",
          `${formatDateForDisplay(date)} has been marked as unavailable.`,
          "success"
        );
      } else {
        if (isSameDay(date, selectedDate)) {
          setTimeSlots((prev) =>
            prev.map((slot) =>
              slot.startTime === timeSlot.startTime &&
              slot.endTime === timeSlot.endTime
                ? { ...slot, available: false, reason }
                : slot
            )
          );
        }
        Swal.fire(
          "Success",
          `Time slot from ${formatTimeForDisplay(
            timeSlot.startTime
          )} to ${formatTimeForDisplay(timeSlot.endTime)} has been blocked.`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error blocking date:", error);
      Swal.fire("Error", "Failed to block date or time slot", "error");
    }
  };

  // MODIFIED: When a slot is added, mark day as available immediately
  const addTimeSlot = async (slot: Omit<TimeSlot, "id" | "available">) => {
    try {
      const payload = {
        availabilities: [
          {
            dayOfWeek: dayOfWeekMap[dayOfWeekReverseMap[selectedDate.getDay()]],
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        ],
      };

      await axiosInstance.post(`${API_BASE_URL}`, payload);

      // If the day was previously unavailable, mark it as available now!
      setMonthlyAvailability((prev) => ({
        ...prev,
        [formatDateString(selectedDate)]: true,
      }));
      setSelectedDayAvailability(true);

      // Refresh the data
      fetchTimeSlotsForSelectedDate();
      fetchAvailabilityPatterns();

      Swal.fire(
        "Success",
        `New slot from ${formatTimeForDisplay(
          slot.startTime
        )} to ${formatTimeForDisplay(slot.endTime)} added.`,
        "success"
      );

      return true;
    } catch (error) {
      console.error("Error adding time slot:", error);
      Swal.fire("Error", "Failed to add time slot", "error");
      return false;
    }
  };

  const updateTimeSlot = async (
    slotId: string,
    startTime: string,
    endTime: string
  ) => {
    try {
      const pattern = availabilityPatterns.find(
        (p) =>
          p.dayOfWeek === selectedDate.getDay() &&
          p.startTime === editingSlot?.startTime &&
          p.endTime === editingSlot?.endTime
      );

      if (!pattern?.id) {
        throw new Error("Could not find matching availability pattern");
      }

      const payload = [
        {
          id: pattern.id,
          dayOfWeek: pattern.dayOfWeek,
          startTime: startTime,
          endTime: endTime,
        },
      ];

      await axiosInstance.patch(`${API_BASE_URL}`, payload);

      fetchTimeSlotsForSelectedDate();
      fetchAvailabilityPatterns();

      Swal.fire(
        "Success",
        `Slot updated to ${formatTimeForDisplay(
          startTime
        )} - ${formatTimeForDisplay(endTime)}.`,
        "success"
      );

      return true;
    } catch (error) {
      console.error("Error updating time slot:", error);
      Swal.fire("Error", "Failed to update time slot", "error");
      return false;
    }
  };

  const deleteTimeSlot = async (slotId: string) => {
    try {
      const slot = timeSlots.find((s) => s.id === slotId);
      if (!slot) return false;

      const pattern = availabilityPatterns.find(
        (p) =>
          p.dayOfWeek === selectedDate.getDay() &&
          p.startTime === slot.startTime &&
          p.endTime === slot.endTime
      );

      if (!pattern?.id) {
        throw new Error("Could not find matching availability pattern");
      }

      const payload = { ids: [pattern.id] };

      await axiosInstance.delete(`${API_BASE_URL}`, { data: payload });

      fetchTimeSlotsForSelectedDate();
      fetchAvailabilityPatterns();

      Swal.fire("Success", "The time slot has been deleted.", "success");

      return true;
    } catch (error) {
      console.error("Error deleting time slot:", error);
      Swal.fire("Error", "Failed to delete time slot", "error");
      return false;
    }
  };

  const generateDummyMonthlyAvailability = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const availability: DailyAvailability = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      availability[formatDateString(date)] = !isWeekend;
    }

    setMonthlyAvailability(availability);
  };

  const generateDummyTimeSlots = (formattedDate: string) => {
    const date = new Date(formattedDate);
    const dayOfWeek = date.getDay();
    let startHour = 9;
    let endHour = 17;

    if (dayOfWeek === 1) {
      startHour = 10;
      endHour = 16;
    } else if (dayOfWeek === 5) {
      startHour = 9;
      endHour = 15;
    }

    const dummySlots: TimeSlot[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes of ["00", "30"]) {
        const startTime = `${hour.toString().padStart(2, "0")}:${minutes}`;
        let endHour = hour;
        let endMinutes = parseInt(minutes) + 30;

        if (endMinutes >= 60) {
          endHour += 1;
          endMinutes -= 60;
        }

        const endTime = `${endHour.toString().padStart(2, "0")}:${endMinutes
          .toString()
          .padStart(2, "0")}`;
        const isAvailable = Math.random() > 0.3;

        dummySlots.push({
          id: generateId(),
          date: formattedDate,
          startTime,
          endTime,
          available: isAvailable,
        });
      }
    }

    setTimeSlots(dummySlots);
  };

  const formatDateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeForDisplay = (time: string): string => {
    const [hour, minute] = time.split(":");
    const hourNum = parseInt(hour, 10);

    if (hourNum === 0) {
      return `12:${minute}am`;
    } else if (hourNum === 12) {
      return `12:${minute}pm`;
    } else if (hourNum > 12) {
      return `${hourNum - 12}:${minute}pm`;
    } else {
      return `${hourNum}:${minute}am`;
    }
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDayAvailabilityToggle = (available: boolean) => {
    if (!available) {
      setBlockingDate(new Date(selectedDate));
      setBlockingTimeSlot(null);
      setBlockReasonDialogOpen(true);
    } else {
      setSelectedDayAvailability(true);
      setMonthlyAvailability((prev) => ({
        ...prev,
        [formatDateString(selectedDate)]: true,
      }));
      fetchTimeSlotsForSelectedDate();
      Swal.fire(
        "Success",
        `${formatDateString(selectedDate)} is now marked as available.`,
        "success"
      );
    }
  };

  const handleBlockTimeSlot = (slot: TimeSlot) => {
    if (!slot.available) {
      Swal.fire(
        "Error",
        "This time slot is already booked by a player.",
        "error"
      );
      return;
    }

    setBlockingDate(new Date(selectedDate));
    setBlockingTimeSlot({
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    setBlockReasonDialogOpen(true);
  };

  const handleConfirmBlock = () => {
    if (!blockingDate) return;

    if (blockReason.trim() === "") {
      Swal.fire(
        "Error",
        "Please provide a reason for blocking this time.",
        "error"
      );
      return;
    }

    blockDate(blockingDate, blockReason, blockingTimeSlot || undefined);

    setBlockReasonDialogOpen(false);
    setBlockReason("");
    setBlockingDate(null);
    setBlockingTimeSlot(null);
  };

  const handleAddTimeSlot = () => {
    if (newSlotStartTime >= newSlotEndTime) {
      Swal.fire("Error", "End time must be after start time.", "error");
      return;
    }

    const isOverlapping = timeSlots.some((slot) => {
      return (
        (newSlotStartTime >= slot.startTime &&
          newSlotStartTime < slot.endTime) ||
        (newSlotEndTime > slot.startTime && newSlotEndTime <= slot.endTime) ||
        (newSlotStartTime <= slot.startTime && newSlotEndTime >= slot.endTime)
      );
    });

    if (isOverlapping) {
      Swal.fire(
        "Error",
        "This time slot overlaps with an existing slot.",
        "error"
      );
      return;
    }

    const newSlot = {
      date: formatDateString(selectedDate),
      startTime: newSlotStartTime,
      endTime: newSlotEndTime,
    };

    addTimeSlot(newSlot).then((success) => {
      if (success) {
        setNewSlotStartTime("09:00");
        setNewSlotEndTime("09:30");
        setAddSlotDialogOpen(false);
      }
    });
  };

  const handleDeleteTimeSlot = (slotId: string) => {
    const slotToDelete = timeSlots.find((slot) => slot.id === slotId);

    if (slotToDelete && !slotToDelete.available) {
      Swal.fire(
        "Error",
        "This time slot is already booked by a player.",
        "error"
      );
      return;
    }

    deleteTimeSlot(slotId);
  };

  const handleEditTimeSlot = (slot: TimeSlot) => {
    if (!slot.available) {
      Swal.fire(
        "Error",
        "This time slot is already booked by a player.",
        "error"
      );
      return;
    }

    setEditingSlot(slot);
  };

  const handleSaveTimeSlot = (
    slotId: string,
    startTime: string,
    endTime: string
  ) => {
    if (startTime >= endTime) {
      Swal.fire("Error", "End time must be after start time.", "error");
      return;
    }

    const isOverlapping = timeSlots.some((slot) => {
      if (slot.id === slotId) return false;

      return (
        (startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime)
      );
    });

    if (isOverlapping) {
      Swal.fire(
        "Error",
        "This time slot overlaps with an existing slot.",
        "error"
      );
      return;
    }

    updateTimeSlot(slotId, startTime, endTime).then((success) => {
      if (success) {
        setEditingSlot(null);
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingSlot(null);
  };

  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const days = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  };

  const groupTimeSlotsByHour = () => {
    const groupedSlots: { [hour: string]: TimeSlot[] } = {};

    timeSlots.forEach((slot) => {
      const hour = slot.startTime.split(":")[0];
      if (!groupedSlots[hour]) {
        groupedSlots[hour] = [];
      }
      groupedSlots[hour].push(slot);
    });

    return groupedSlots;
  };

  const calendarDays = generateCalendarDays();
  const groupedTimeSlots = groupTimeSlotsByHour();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Manage Your Availability</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <CardTitle>Monthly Availability</CardTitle>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevMonth}
                      className="mr-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-md font-medium">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextMonth}
                      className="ml-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map((day, index) => (
                    <div
                      key={index}
                      className="text-center text-sm font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return (
                        <div key={`empty-${index}`} className="h-14 p-1"></div>
                      );
                    }

                    const formattedDate = formatDateString(day);
                    const isAvailable = monthlyAvailability[formattedDate];
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                      <div
                        key={formattedDate}
                        onClick={() => handleDateSelect(day)}
                        className={`
                          h-14 p-1 border rounded-md flex flex-col justify-between cursor-pointer
                          ${
                            isSelected
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }
                        `}
                      >
                        <div className="text-right text-sm font-medium">
                          {day.getDate()}
                        </div>
                        <div className="flex justify-center">
                          {isAvailable === false ? (
                            <Badge
                              variant="outline"
                              className="bg-gray-100 text-gray-500 text-xs"
                            >
                              Unavailable
                            </Badge>
                          ) : isAvailable === true ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-600 text-xs"
                            >
                              Available
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <CardTitle>Daily Slots</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor="day-availability"
                      className="text-sm font-medium"
                    >
                      Mark day as available
                    </Label>
                    <Switch
                      id="day-availability"
                      checked={selectedDayAvailability}
                      onCheckedChange={handleDayAvailabilityToggle}
                    />
                  </div>

                  <Dialog
                    open={addSlotDialogOpen}
                    onOpenChange={setAddSlotDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        disabled={!selectedDayAvailability}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Time Slot
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Time Slot</DialogTitle>
                        <DialogDescription>
                          Create a new availability slot for{" "}
                          {selectedDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start-time">Start Time</Label>
                            <Select
                              value={newSlotStartTime}
                              onValueChange={setNewSlotStartTime}
                            >
                              <SelectTrigger id="start-time">
                                <SelectValue placeholder="Select start time" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeOptions.map((time) => (
                                  <SelectItem
                                    key={`start-${time}`}
                                    value={time}
                                  >
                                    {formatTimeForDisplay(time)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="end-time">End Time</Label>
                            <Select
                              value={newSlotEndTime}
                              onValueChange={setNewSlotEndTime}
                            >
                              <SelectTrigger id="end-time">
                                <SelectValue placeholder="Select end time" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeOptions.map((time) => (
                                  <SelectItem key={`end-${time}`} value={time}>
                                    {formatTimeForDisplay(time)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setAddSlotDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddTimeSlot}>Add Slot</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                ) : !selectedDayAvailability ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <AlertCircle className="h-10 w-10 mb-2" />
                    <p>This day is marked as unavailable</p>
                    <p className="text-sm">
                      Toggle the switch above to make it available.
                    </p>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <Clock className="h-10 w-10 mb-2" />
                    <p>No time slots available</p>
                    <p className="text-sm">
                      Click the "Add Time Slot" button to create slots.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedTimeSlots).map(([hour, slots]) => (
                      <div key={hour} className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700">
                          {formatTimeForDisplay(`${hour}:00`).split(":")[0]}{" "}
                          {parseInt(hour) < 12 ? "AM" : "PM"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {slots.map((slot) => (
                            <div
                              key={slot.id}
                              className={`
                                p-3 border rounded-md
                                ${
                                  !slot.available
                                    ? "bg-gray-50 border-gray-300"
                                    : "border-gray-200"
                                }
                              `}
                            >
                              {editingSlot?.id === slot.id ? (
                                <div className="flex flex-col space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <Select
                                      value={editingSlot.startTime}
                                      onValueChange={(value) =>
                                        setEditingSlot({
                                          ...editingSlot,
                                          startTime: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger
                                        id={`edit-start-${slot.id}`}
                                        className="h-8 text-xs"
                                      >
                                        <SelectValue placeholder="Start" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {timeOptions.map((time) => (
                                          <SelectItem
                                            key={`edit-start-${slot.id}-${time}`}
                                            value={time}
                                          >
                                            {formatTimeForDisplay(time)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    <Select
                                      value={editingSlot.endTime}
                                      onValueChange={(value) =>
                                        setEditingSlot({
                                          ...editingSlot,
                                          endTime: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger
                                        id={`edit-end-${slot.id}`}
                                        className="h-8 text-xs"
                                      >
                                        <SelectValue placeholder="End" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {timeOptions.map((time) => (
                                          <SelectItem
                                            key={`edit-end-${slot.id}-${time}`}
                                            value={time}
                                          >
                                            {formatTimeForDisplay(time)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        handleSaveTimeSlot(
                                          slot.id || "",
                                          editingSlot.startTime,
                                          editingSlot.endTime
                                        )
                                      }
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-sm font-medium">
                                      {formatTimeForDisplay(slot.startTime)} -{" "}
                                      {formatTimeForDisplay(slot.endTime)}
                                    </span>

                                    {!slot.available && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 bg-blue-50 text-blue-600 text-xs"
                                      >
                                        Booked
                                      </Badge>
                                    )}

                                    {slot.reason && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="inline-block ml-1">
                                              <Info className="h-4 w-4 text-gray-400 inline-block" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Reason: {slot.reason}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>

                                  {slot.available && (
                                    <div className="flex space-x-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              onClick={() =>
                                                handleEditTimeSlot(slot)
                                              }
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Edit time slot</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                                              onClick={() =>
                                                handleBlockTimeSlot(slot)
                                              }
                                            >
                                              <AlertCircle className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Block time slot</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                              onClick={() =>
                                                handleDeleteTimeSlot(
                                                  slot.id || ""
                                                )
                                              }
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Delete time slot</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <CardTitle>All Available Time Slots</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(monthlyAvailability)
                    .filter(([_, isAvailable]) => isAvailable)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date]) => {
                      const dateObj = new Date(date);
                      const formattedDate = dateObj.toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }
                      );

                      return (
                        <div key={date} className="border rounded-md p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-md font-medium">
                              {formattedDate}
                            </h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const dateObj = new Date(date);
                                setSelectedDate(dateObj);
                                setCurrentMonth(dateObj.getMonth());
                                setCurrentYear(dateObj.getFullYear());
                                setActiveTab("calendar");
                              }}
                            >
                              View Day
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={blockReasonDialogOpen}
        onOpenChange={setBlockReasonDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blockingTimeSlot ? "Block Time Slot" : "Block Entire Day"}
            </DialogTitle>
            <DialogDescription>
              {blockingTimeSlot
                ? `Block the time slot from ${formatTimeForDisplay(
                    blockingTimeSlot.startTime
                  )} to ${formatTimeForDisplay(blockingTimeSlot.endTime)}`
                : `Mark ${blockingDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })} as unavailable`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="block-reason">Reason for blocking</Label>
              <Input
                id="block-reason"
                placeholder="e.g., Personal appointment, Out of town, etc."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockReasonDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBlock}
              disabled={blockReason.trim() === ""}
            >
              Block {blockingTimeSlot ? "Time Slot" : "Day"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertAvailabilityManager;
