  import { useState } from 'react';
  import { motion } from 'framer-motion';
  import { useNavigate } from 'react-router-dom';

  const Navbar = () => {
    const [isOpen] = useState(false);
    const navigate = useNavigate();
    return (
      <motion.nav 
        className="bg-gray-900 text-white mb-10 p-4 z-50 flex justify-between items-center shadow-lg"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-2xl     font-anton">
          Futhub<span className="text-yellow-500">.</span>
        </div>
        
        <div className={`font-anton mx-auto space-x-6 ${isOpen ? 'block' : 'hidden'} md:inline absolute md:static bg-gray-900 w-full md:w-auto left-0 top-16  md:top-0`}>
        <motion.ul 
          className="flex flex-col  md:flex-row md:space-x-6 md:items-center md:justify-center ml-6 md:mx-auto md:-ml-20" 
        >
          <motion.li 
            onClick = {() => navigate("/")} 
            whileHover={{ scale: 1.1 }}
            className="hover:text-yellow-500   cursor-pointer p-4 md:p-0  md:m-0 "
          >
            Home
          </motion.li>
          <motion.li 
            onClick = {() => navigate("/News")}
            whileHover={{ scale: 1.1 }}
            className="hover:text-yellow-500 cursor-pointer p-4 md:p-0"
          >
            News
          </motion.li>
          <motion.li 
            onClick = {() => navigate("/Contact")}
            whileHover={{ scale: 1.1 }}
            className="hover:text-yellow-500 cursor-pointer  p-4 md:p-0"
          >
            Contact
          </motion.li>
          
        </motion.ul>
        </div>
      </motion.nav>
    );
  };

  export default Navbar;