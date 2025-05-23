import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faLinkedinIn,
  faFacebookF,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import {
  getProfile,
  updateProfile,
  updateProfilePhoto,
} from "@/store/profile-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface FormData {
  teamName: string;
  type: string;
  firstName: string;
  lastName: string;
  clubName: string;
  city: string;
  country: string;
  address: string;
  countryCode: string;
  phone: string;
  email: string;
  bio: string;
  socialLinks: {
    instagram: string;
    linkedin: string;
    facebook: string;
    twitter: string;
  };
}

interface CountryData {
  name: string;
  code: string;
  dialCode: string;
  cities: string[];
}

export default function TeamDetailsForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [existingProfilePhoto, setExistingProfilePhoto] = useState<
    string | null
  >(null);
  const [profilePhotoChanged, setProfilePhotoChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Redux hooks
  const dispatch = useAppDispatch();
  const profileState = useAppSelector((state) => state.profile);

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, 2));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const navigate = useNavigate();
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const goBack = () => {
    navigate(-1); // goes to previous page
  };

  const [form, setForm] = useState<FormData>({
    teamName: "",
    type: "",
    firstName: "",
    lastName: "",
    clubName: "",
    city: "",
    country: "",
    address: "",
    countryCode: "",
    phone: "",
    email: "",
    bio: "",
    socialLinks: {
      instagram: "",
      linkedin: "",
      facebook: "",
      twitter: "",
    },
  });

  // API base URL
  const API_BASE_URL = `${import.meta.env.VITE_PORT}/api/v1`;
  const profileData = useAppSelector((state) => state.profile.viewedProfile);

  // Get auth token from localStorage
  const getAuthToken = (): string | null => {
    return localStorage.getItem("token");
  };

  // Validation for each step
  const validateCurrentStep = (): boolean => {
    setError(null);
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!form.teamName.trim()) {
        errors.teamName = "Team name is required";
      }
      if (!form.firstName.trim()) {
        errors.firstName = "First name is required";
      }
      if (!form.lastName.trim()) {
        errors.lastName = "Last name is required";
      }
      if (!form.type) {
        errors.type = "Please select a type";
      }
      if (!form.country) {
        errors.country = "Country is required";
      }
      if (!form.city) {
        errors.city = "City is required";
      }
      if (!form.email) {
        errors.email = "Email is required";
      } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        errors.email = "Please enter a valid email address";
      }
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please correct the highlighted fields");
      return false;
    }
    return true;
  };

  // Helper to create axios instance with auth header
  const createAuthAxios = () => {
    const token = getAuthToken();
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  };

  // Handle file uploads
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File size should not exceed 2MB.");
      return;
    }

    // Store the file locally and mark that profile photo has changed
    setProfilePhoto(file);
    setProfilePhotoChanged(true);
    setError(null);
  };

  const handleSocialMedia = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    // Handling nested socialLinks
    if (name.startsWith("socialLinks.")) {
      const socialKey = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };
  const username = localStorage.getItem("username");
  useEffect(() => {
    if (username) {
      dispatch(getProfile(username));
    } else {
      console.error("No username found in localStorage");
    }
  }, [dispatch, username]);

  // Fetch team data if editing existing team
  useEffect(() => {
    if (profileData) {
      // Save existing profile photo if available
      if (profileData.photo) {
        setExistingProfilePhoto(profileData.photo);
      }

      // Map the team data to form data structure
      setForm({
        teamName: profileData.firstName || "",
        type: profileData.type || "",
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        clubName: profileData.clubName || "",
        city: profileData.city || "",
        country: profileData.country || "",
        address: profileData.address || "",
        countryCode: profileData.countryCode || "",
        phone: profileData.phone || "",
        email: profileData.email || "",
        bio: profileData.bio || "",
        socialLinks: {
          instagram: profileData.socialLinks?.instagram || "",
          linkedin: profileData.socialLinks?.linkedin || "",
          facebook: profileData.socialLinks?.facebook || "",
          twitter: profileData.socialLinks?.twitter || "",
        },
      });
    }
  }, [profileData]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countryRes = await fetch("https://restcountries.com/v3.1/all");
        const data = await countryRes.json();
        const countryList: CountryData[] = data
          .map((item: any) => ({
            name: item.name.common,
            code: item.cca2,
            dialCode: item.idd.root
              ? `${item.idd.root}${
                  item.idd.suffixes ? item.idd.suffixes[0] : ""
                }`
              : "",
            cities: [],
          }))
          .sort((a: CountryData, b: CountryData) =>
            a.name.localeCompare(b.name)
          );
        setCountries(countryList);
      } catch (error) {
        console.error("Error fetching countries:", error);
        setError("Failed to load countries. Please try again.");
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!form.country) return;

      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries"
        );
        const data = await res.json();
        const countryData = data.data.find(
          (item: any) =>
            item.country.toLowerCase() === form.country.toLowerCase()
        );
        if (countryData) {
          setCities(countryData.cities);
        } else {
          setCities([]);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setError("Failed to load cities. Please try again.");
      }
    };

    if (form.country) fetchCities();
  }, [form.country]);

  // Watch for changes in profileState status
  useEffect(() => {
    if (profileState.status === "failed" && profileState.error) {
      setError(profileState.error);
      setIsSubmitting(false);
    }
  }, [profileState.status, profileState.error]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "country" && {
        countryCode: countries.find((c) => c.name === value)?.dialCode || "",
        city: "",
      }),
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const submitForm = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // First upload profile photo if it's changed
      let photoUrl = existingProfilePhoto;

      if (profilePhoto && profilePhotoChanged) {
        try {
          // Dispatch updateProfilePhoto action and wait for the result
          const resultAction = await dispatch(updateProfilePhoto(profilePhoto));

          // Check if the action was fulfilled
          if (updateProfilePhoto.fulfilled.match(resultAction)) {
            // Extract the updated profile from the action payload
            const updatedProfile = resultAction.payload;
            // Get the photo URL from the updated profile
            photoUrl = updatedProfile.photo || photoUrl;
          } else if (updateProfilePhoto.rejected.match(resultAction)) {
            throw new Error("Failed to upload profile photo.");
          }
        } catch (error) {
          console.error("Error uploading profile photo:", error);
          setError("Failed to upload profile photo. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare the data for API submission
      const teamData = {
       
        profession: form.type,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        club: form.clubName.trim(),
        city: form.city,
        country: form.country,
        address: form.address,
       
        bio: form.bio,
        photo: photoUrl,
        socialLinks: {
          instagram: form.socialLinks.instagram || "",
          linkedin: form.socialLinks.linkedin || "",
          facebook: form.socialLinks.facebook || "",
          twitter: form.socialLinks.twitter || "",
        },
      };

      // Update profile using Redux action
      const updateProfileResult = await dispatch(updateProfile(teamData));

      if (updateProfile.fulfilled.match(updateProfileResult)) {
        setSuccess("Team details saved successfully!");

        // Redirect to appropriate page after submission
        setTimeout(() => {
          navigate("/team/dashboard");
        }, 1500);
      } else if (updateProfile.rejected.match(updateProfileResult)) {
        throw new Error("Failed to update profile.");
      }
    } catch (error: any) {
      console.error("Error submitting team data:", error);

      // Handle API error responses
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const apiErrors = error.response.data.errors;
        const formattedErrors: Record<string, string> = {};

        Object.keys(apiErrors).forEach((key) => {
          formattedErrors[key] = apiErrors[key].message || apiErrors[key];
        });

        setValidationErrors(formattedErrors);
        setError("Please correct the errors in the form.");
      } else {
        setError(
          error.message || "Failed to save team details. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-20 mx-auto dark:bg-gray-900">
      {/* Status messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          {Object.keys(validationErrors).length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {Object.entries(validationErrors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
          <p className="font-semibold">Success</p>
          <p>{success}</p>
        </div>
      )}

      <button
        onClick={goBack}
        className="flex items-center text-gray-700 hover:text-black text-sm font-medium mb-4 dark:text-white cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
      </button>
      {/* Step Indicator */}
      <div className="flex flex-col items-center mb-12">
        <div className="flex w-full max-w-lg items-center relative">
          {[1, 2].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div className="relative flex flex-col items-center w-1/4">
                <div
                  className={`w-8 h-8 ${
                    step >= stepNum ? "bg-red-500" : "bg-gray-300"
                  } rounded-full flex items-center justify-center text-white font-bold text-sm`}
                >
                  {stepNum}
                </div>
              </div>
              {stepNum < 2 && (
                <div className="flex-1 h-1 bg-gray-300 rounded-full -mx-14 relative">
                  <div
                    className={`absolute top-0 left-0 h-1 rounded-full ${
                      step > stepNum ? "bg-red-500 w-full" : "w-0"
                    } transition-all duration-500`}
                  ></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex w-full max-w-lg justify-between mt-2 ">
          <div className="w-1/4 text-center text-sm font-medium">
            Profile Details
          </div>
          <div className="w-1/4 text-center text-sm font-medium">
            More Details
          </div>
        </div>
      </div>
      {/* Step 1: Profile Details */}
      {step === 1 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Profile Details</h2>
          <Label className="text-sm text-gray-400 mb-1">PROFILE PICTURE</Label>
          <Card className="border-dashed border border-gray-300 p-4 w-5/6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Display existing profile photo if available */}
              {existingProfilePhoto && !profilePhoto && (
                <img
                  src={existingProfilePhoto}
                  alt="Current profile"
                  className="h-10 w-10 object-cover rounded-full"
                />
              )}
              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500 text-xl">🖼️</span>
              </div>
              <span className="text-sm text-gray-700">
                {profilePhoto
                  ? profilePhoto.name
                  : existingProfilePhoto
                  ? "Current profile photo"
                  : "Upload a profile picture. Max size 2MB"}
              </span>
              <label className="cursor-pointer px-4 py-2 bg-gray-100 border rounded text-sm text-gray-700 hover:bg-gray-200">
                Browse
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Team Name*
              </label>
              <Input
                name="teamName"
                value={form.teamName}
                onChange={handleChange}
                placeholder="Enter team name"
                className={validationErrors.teamName ? "border-red-500" : ""}
              />
              {validationErrors.teamName && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.teamName}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Type*
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={`border p-2 rounded text-sm text-gray-700 w-full ${
                  validationErrors.type ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Type</option>
                <option value="football">Football</option>
                <option value="tennis">Tennis</option>
                <option value="basketball">Basketball</option>
                <option value="other">Other</option>
              </select>
              {validationErrors.type && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.type}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                First Name*
              </label>
              <Input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className={validationErrors.firstName ? "border-red-500" : ""}
              />
              {validationErrors.firstName && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Last Name*
              </label>
              <Input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className={validationErrors.lastName ? "border-red-500" : ""}
              />
              {validationErrors.lastName && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.lastName}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Club Name
              </label>
              <Input
                name="clubName"
                value={form.clubName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Country*
              </label>
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className={`border p-2 rounded text-sm text-gray-700 w-full ${
                  validationErrors.country ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
              {validationErrors.country && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.country}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                City*
              </label>
              <select
                name="city"
                value={form.city}
                onChange={handleChange}
                className={`border p-2 rounded text-sm text-gray-700 w-full ${
                  validationErrors.city ? "border-red-500" : ""
                }`}
              >
                <option value="">Select City</option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {validationErrors.city && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.city}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Address
              </label>
              <Input
                name="address"
                placeholder="Street no."
                value={form.address}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white mb-1 block">
                Phone Number
              </label>
              <div className="flex items-center gap-2">
                <div className="w-1/3">
                  <select
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className="border p-2 rounded text-sm text-gray-700 w-full"
                  >
                    <option value="">Code</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.dialCode}>
                        {country.dialCode}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Input
                    name="phone"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Email*
              </label>
              <Input
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className={validationErrors.email ? "border-red-500" : ""}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>
          </div>
          <div className="text-right mt-6">
            <Button
              onClick={nextStep}
              className="bg-yellow-400 text-white hover:bg-amber-500 cursor-pointer"
            >
              Save & Next
            </Button>
          </div>
        </>
      )}
      {/* Step 2: More Details */}
      {step === 2 && (
        <>
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            More Details
          </h2>
          <label className="text-sm font-medium text-gray-900 dark:text-white">
            Bio Data
          </label>
          <Textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="mb-6 mt-2"
            placeholder="Bio data"
            maxLength={500}
          />
          <Label className="text-md font-semibold mb-2 dark:text-white">
            Social Media Links
          </Label>
          <div className="space-y-4 mt-4 w-1/3">
            {[
              {
                icon: faInstagram,
                name: "instagram",
                bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
              },
              {
                icon: faLinkedinIn,
                name: "linkedin",
                bg: "bg-blue-700",
              },
              {
                icon: faFacebookF,
                name: "facebook",
                bg: "bg-blue-600",
              },
              {
                icon: faXTwitter,
                name: "twitter",
                bg: "bg-black",
              },
            ].map((social) => (
              <div key={social.name} className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 flex items-center justify-center border rounded ${social.bg}`}
                >
                  <FontAwesomeIcon
                    icon={social.icon}
                    className="w-6 h-6 text-white"
                  />
                </div>
                <Input
                  name={`socialLinks.${social.name}`}
                  value={
                    form.socialLinks[
                      social.name as keyof typeof form.socialLinks
                    ]
                  }
                  onChange={handleSocialMedia}
                  className=" w-full px-4 py-2 "
                  placeholder={`Your ${social.name} link`}
                />
              </div>
            ))}
          </div>
          {/* Navigation Buttons */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={prevStep}
              className="border border-gray-400 text-black bg-amber-50 hover:bg-amber-50 rounded mr-9 cursor-pointer"
              disabled={isSubmitting}
              type="button"
            >
              Back
            </Button>
            <Button
              onClick={submitForm}
              className="bg-yellow-400 text-white hover:bg-yellow-500 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
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
                  Submitting...
                </div>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
