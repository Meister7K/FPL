// @ts-nocheck
import { Inter } from "next/font/google";
import EnterForm from "../components/home/entranceForm"
import { TestEnterForm } from "@/components/home/testEnterForm";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  

  return (
    <main
      className={`flex min-h-screen flex-col justify-start ${inter.className}`}
    >  <Link className='border px-2 py-1 rounded-md' href={`/test`}>test</Link>
      <h1 className="lg:text-6xl bold text-2xl w-full text-center py-20 px-4 ">Welcome to the Sleeper Data Dashboard</h1>
    
      {/* <TestEnterForm/> */}
        {EnterForm ? <EnterForm /> : <p>EnterForm component not found</p>}
        
 
    </main>
  );
}