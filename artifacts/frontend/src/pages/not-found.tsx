import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-olive-500/5 rounded-full blur-[160px] animate-orb pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] animate-orb-alt pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center px-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl items-center justify-center mb-8"
        >
          <AlertCircle className="h-10 w-10 text-red-400" />
        </motion.div>

        <h1 className="text-6xl font-extrabold text-gray-900 mb-3">404</h1>
        <p className="text-xl font-semibold text-gray-600 mb-2">
          Page Not Found
        </p>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-10">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 bg-olive-500 hover:bg-olive-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors glow-olive"
            >
              <Home className="h-4 w-4" /> Back to Home
            </motion.button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 border border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium px-6 py-3 rounded-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
