import { motion } from 'framer-motion';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-2 md:py-5
                 w-full md:static md:bottom-auto mt-40  bottom-0 left-0"
    >
      <div className="container  mx-auto px-4">
        {/* Logo and Description */}
        <div className="flex  flex-row justify-between items-center text-center md:text-left">
          <div className="mb-4 md:mb-0">
            <h2 className="text-base md:text-2xl font-bold">FutHub</h2>
            <p className="text-xs md:text-sm mt-1">Your ultimate football hub</p>
          </div>
          {/* Navigation Links */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 mt-2 md:mt-0">
            <a href="#" className="text-xs md:text-sm hover:text-gray-400 transition duration-300">
              Home
            </a>
            <a href="#" className="text-xs md:text-sm hover:text-gray-400 transition duration-300">
              About
            </a>
            <a href="#" className="text-xs md:text-sm hover:text-gray-400 transition duration-300">
              Contact
            </a>
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="mt-6 flex justify-center space-x-4 md:space-x-6">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-400 transition duration-300"
          >
            <FaFacebookF size={6} className="md:size-4" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-400 transition duration-300"
          >
            <FaTwitter size={6} className="md:size-4" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-400 transition duration-300"
          >
            <FaInstagram size={6} className="md:size-4" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-400 transition duration-300"
          >
            <FaLinkedinIn size={6} className="md:size-4" />
          </a>
        </div>

        {/* Contact Information */}
        <div className="mt-4 text-center">
          <p className="text-xs md:text-sm text-gray-400">
            123 Football St, Soccer City, SC 12345
          </p>
          <p className="text-xs md:text-sm text-gray-400">
            Email: contact@futhub.com | Phone: (123) 456-7890
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-2 text-center text-gray-400 text-xs md:text-sm">
          &copy; {new Date().getFullYear()} FutHub. All rights reserved.
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
