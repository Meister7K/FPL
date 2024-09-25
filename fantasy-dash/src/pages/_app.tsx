// @ts-nocheck
import { useEffect } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/nav/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
// import Link from "next/link";

export default function App({ Component, pageProps }: AppProps) {

  const router = useRouter();
  
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
      {/* AnimatePresence will ensure only one component is visible during the transition */}
      <motion.div
        key={router.route} 
        initial="initialState"
        animate="animateState"
        exit="exitState"
        transition={{
          duration: 0.75, // adjust to your desired timing
        }}
        variants={{
          // Define the different states of the animation
          initialState: { opacity: 0, x: 0, y: 0 },
          animateState: { opacity: 1, x: 0, y: 0 },
          exitState: { opacity: 0, x: 0, y: 0 },
        }}
      >
        <div className="flex flex-row justify-between fixed w-full z-20 top-0 start-0 ">
        <Navbar />
      </div>
      <div className="h-16"/>
        <Component {...pageProps} />
      </motion.div>
    </AnimatePresence>
    </>
  );
}
