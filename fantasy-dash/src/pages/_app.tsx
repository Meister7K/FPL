
import Navbar from "@/components/nav/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Link from "next/link";



export default function App({ Component, pageProps }: AppProps) {
  return <>
<div className="flex flex-row justify-between fixed w-full z-20 top-0 start-0 ">
<Navbar/>
</div>
  <Component {...pageProps} />
  </>;
}
