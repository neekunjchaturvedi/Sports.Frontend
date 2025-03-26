import profile from "../assets/images/profile.jpg";
import "react-circular-progressbar/dist/styles.css";
import { useNavigate, useLocation } from "react-router-dom";

const SideNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); //  Get current route path

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg p-6 h-full overflow-y-auto">
        <h1 className="font-bold text-center mb-2 text-gray-800 dark:text-white">LOGO</h1>

        <div className="text-center bg-slate-100 shadow-md dark:bg-gray-700 p-5 rounded-lg">
          <img
            src={profile}
            alt="Profile"
            className="rounded-full mx-auto w-24 h-24 cursor-pointer"
            onClick={() => navigate("/detailsform")}
          />
          <h2 className="text-lg font-semibold mt-4 font-Raleway text-gray-800 dark:text-white">Rohan Roshan</h2>
          <p className="text-gray-500 text-sm font-Opensans dark:text-gray-400">Under 15</p>
          <p className="text-gray-600 font-bold text-sm font-Raleway dark:text-gray-400">Goal Keeper</p>
        </div>

        <nav className="mt-6 font-Raleway font-semibold">
          <ul>
            {[
              { name: "Dashboard", icon: "fas fa-tachometer-alt", path: "/dashboard" },
              { name: "Profile", icon: "fas fa-user", path: "/profile" },
              { name: "My Bookings", icon: "fas fa-calendar-check", path: "/mybooking" },
              { name: "Matches", icon: "fas fa-futbol", path: "/matches" },
              { name: "Experts", icon: "fas fa-user-tie", path: "/expertspage" },
              { name: "Sponsors", icon: "fas fa-handshake", path: "/sponsors" },
            ].map((item) => {
              const isActive = location.pathname === item.path; //  Compare route
              return (
                <li
                  key={item.name}
                  className={`p-3 rounded-lg flex items-center space-x-2 cursor-pointer transition-all
                    ${isActive ? "bg-gray-200 shadow-md dark:bg-gray-700" : "hover:bg-gray-200 dark:hover:bg-gray-700"}
                  `}
                >
                <div
      onClick={() => navigate(item.path)}
      className="flex items-center space-x-2 w-full cursor-pointer"
    >
      <i className={`${item.icon} text-lg text-gray-800 dark:text-gray-300`}></i>
      <span className="text-gray-800 dark:text-white">{item.name}</span>
    </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Main content will be rendered here based on route */}
      </div>
    </div>
  );
};

export default SideNavbar;
