import { useSelector, useDispatch } from "react-redux";
import { FaCarSide, FaWalking, FaTrain } from "react-icons/fa";
import { setMode } from "../store/modeSlice";
import { motion } from "framer-motion";

const ModeSwitcher = () => {
  const dispatch = useDispatch();
  const currentMode = useSelector((state) => state.mode.mode);
  const route = useSelector((state) => state.route.route);

  const modes = [
    { key: "DRIVING", label: "Araba", icon: <FaCarSide /> },
    { key: "WALKING", label: "Yürüme", icon: <FaWalking /> },
    { key: "TRANSIT", label: "T. Taşıma", icon: <FaTrain /> },
  ];

  const handleClick = (modeKey) => {
    dispatch(setMode(modeKey));
  };

  return (
    <>
      {!route && (
        <motion.div
          initial={{ opacity: 0,  y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex bg-white rounded-xl shadow-md p-2 items-center justify-between px-6"
        >
          {modes.map((m) => (
            <motion.button
              key={m.key}
              onClick={() => handleClick(m.key)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              className={`flex flex-col items-center px-4 py-2 rounded-lg transition 
                ${
                  currentMode === m.key
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              <motion.div
                className="text-xl"
                animate={{
                  rotate: currentMode === m.key ? [0, 10, -10, 0] : 0,
                }}
                transition={{ duration: 0.4 }}
              >
                {m.icon}
              </motion.div>
              <span className="text-xs">{m.label}</span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </>
  );
};

export default ModeSwitcher;
