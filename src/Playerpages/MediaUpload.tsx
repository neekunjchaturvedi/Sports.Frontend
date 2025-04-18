import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";

interface UploadItem {
  id: number;
  title: string;
  file: File | null;
  preview?: string | null;
  type: "photo" | "video";
}

const MediaUpload: React.FC<{ onMediaUpdate: () => void; onClose: () => void }> = ({ onMediaUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<"photo" | "video">("photo");
  const [uploads, setUploads] = useState<UploadItem[]>([{
    id: Date.now(),
    title: "",
    file: null,
    preview: null,
    type: "photo",
  }]);

  useEffect(() => {
    const savedMedia = JSON.parse(localStorage.getItem("savedMedia") || "[]");
    if (savedMedia.length > 0) {
      setUploads(savedMedia);
    }
  }, []);

  const handleAdd = () => {
    const newUpload: UploadItem = {
      id: Date.now(),
      title: "",
      file: null,
      preview: null,
      type: activeTab,
    };
    setUploads((prev) => [...prev, newUpload]);
  };

  const handleRemove = (id: number) => {
    const currentTabUploads = uploads.filter(u => u.type === activeTab);
    if (currentTabUploads.length <= 1) return; // prevent removing the last item

    const updatedUploads = uploads.filter((item) => item.id !== id);
    setUploads(updatedUploads);
    localStorage.setItem("savedMedia", JSON.stringify(updatedUploads));
    onMediaUpdate();
  };

  const handleTitleChange = (id: number, value: string) => {
    setUploads(uploads.map((item) => (item.id === id ? { ...item, title: value } : item)));
  };

  const handleFileChange = (id: number, file: File | null) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setUploads(uploads.map((item) => (item.id === id ? { ...item, file, preview: previewUrl } : item)));
  };

  const handleupload = () => {
    localStorage.setItem("savedMedia", JSON.stringify(uploads));
    alert("Media saved successfully!");
    onMediaUpdate();
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-[600px] relative">
      <button onClick={handleClose} className="absolute top-2 right-2 text-gray-600 dark:text-gray-300">
        <FontAwesomeIcon icon={faTimes} size="lg" />
      </button>

      <h2 className="text-xl font-Raleway font-semibold">Upload Media</h2>

      {/* Tabs */}
      <div className="flex justify-between items-center border-b pb-2 mt-2">
        <div className="flex space-x-4">
          <span
            onClick={() => setActiveTab("photo")}
            className={`cursor-pointer ${activeTab === "photo" ? "text-red-500 font-semibold border-b-2 border-red-500" : "text-gray-500 dark:text-gray-300"}`}
          >
            Photos
          </span>
          <span
            onClick={() => setActiveTab("video")}
            className={`cursor-pointer ${activeTab === "video" ? "text-red-500 font-semibold border-b-2 border-red-500" : "text-gray-500 dark:text-gray-300"}`}
          >
            Videos
          </span>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center bg-yellow-200 hover:bg-yellow-300 text-black px-3 py-2 rounded-md dark:bg-yellow-200 dark:text-black"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add
        </button>
      </div>

      {/* Upload Fields */}
      {uploads.filter((item) => item.type === activeTab).map((upload) => (
        <div key={upload.id} className="flex items-center space-x-3 mt-2">
          <input
            type="text"
            placeholder="Title"
            value={upload.title}
            onChange={(e) => handleTitleChange(upload.id, e.target.value)}
            className="border p-2 w-full rounded-md dark:bg-gray-600 dark:text-white"
          />

          <input
            type="file"
            accept={activeTab === "photo" ? "image/*" : "video/*"}
            onChange={(e) => handleFileChange(upload.id, e.target.files?.[0] || null)}
            className="border p-2 file:bg-white file:rounded-lg file:border-gray-300 file:dark:bg-slate-400 file:dark:text-white rounded-md dark:bg-gray-600 dark:text-white"
          />

          {uploads.filter((u) => u.type === activeTab).length > 1 && (
            <button onClick={() => handleRemove(upload.id)} className="text-red-500">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          )}
        </div>
      ))}

      {/* Preview */}
      <div className="mt-4">
        {uploads
          .filter((item) => item.preview && item.type === activeTab)
          .map((item) => (
            <div key={item.id} className="mt-2">
              {item.type === "photo" ? (
                <img src={item.preview!} alt={item.title} className="w-full h-40 object-cover rounded-md cursor-pointer" />
              ) : (
                <video src={item.preview!} controls className="w-full h-40 rounded-md cursor-pointer" />
              )}
            </div>
          ))}
      </div>

      {/* Upload Button */}
      <div className="flex justify-end space-x-3 mt-4">
        <button onClick={handleupload} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 shadow-md rounded-md dark:bg-red-600">
          Upload
        </button>
      </div>
    </div>
  );
};

export default MediaUpload;
