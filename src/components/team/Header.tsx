import { AlignJustify } from "lucide-react";
import { Button } from "../ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faGem,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface teamHeaderProps {
  setOpen: (open: boolean) => void;
}
const menuItems = [
  { path: "/team/details-form", name: "Edit Profile" },
  { path: "/team/dashboard", name: "Dashboard" },
  { path: "/team/players", name: "Players" },
  { path: "/team/experts", name: "Experts" },
  { path: "/team/sponsors", name: "Sponsor" },
  { path: "/team/applications", name: "Sponsors Application" },
  { path: "/team/profile", name: " Team Profile" },
  { path: "/team/sponsorinfo", name: "Sponsor Profile" },
  { path: "/team/playerinfo", name: "Player Profile" },
  { path: "/team/exdetails", name: "Expert Profile" },
];
function TeamHeader({ setOpen }: teamHeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const location = useLocation();
  const currentTitle =
    menuItems.find((item) => location.pathname.startsWith(item.path))?.name ??
    "Players";
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "enabled") {
      setIsDarkMode(true);
      document.body.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.body.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.body.classList.remove("dark");
      localStorage.setItem("darkMode", "disabled");
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("darkMode", "enabled");
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between px-4 py-3 bg-background dark:bg-slate-950 ">
      {/* Left Section: Menu Button + Page Title */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Button
          onClick={() => setOpen(true)}
          className="lg:hidden sm:block bg-white dark:bg-slate-700 dark:text-white text-black hover:bg-slate-100 dark:hover:bg-slate-600"
        >
          <AlignJustify />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px] sm:max-w-sm md:max-w-md lg:max-w-lg">
          {currentTitle}
        </h2>
      </div>

      {/* Right Section: Premium Button, Notifications, Theme Toggle */}
      <div className="flex flex-wrap justify-end gap-3 items-center w-full sm:w-auto mt-4 sm:mt-0">
        <Button className="bg-white hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-700 dark:text-white transition-colors p-3">
          <FontAwesomeIcon
            icon={faBell}
            className="text-black dark:text-white text-xl"
          />
        </Button>

        <Button
          onClick={toggleTheme}
          className="p-4 rounded-full dark:bg-slate-950 bg-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <FontAwesomeIcon
            icon={isDarkMode ? faMoon : faSun}
            className="text-gray-600 dark:text-white text-xl"
          />
        </Button>
      </div>
    </header>
  );
}

export default TeamHeader;
