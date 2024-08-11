
import { Inter } from "next/font/google";


import EnterForm from "@/components/home/entranceForm";


const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col justify-start ${inter.className}`}
    >
      <h1 className="lg:text-6xl bold text-2xl w-full text-center py-20 px-4 ">Welcome to the Fantasy Premier League</h1>
     {/* <Link href="/sleeper-stats" className=" px-4 py-2 border border-gray hover:bg-slate-700 transition-all duration-500">Enter</Link> */}
     <EnterForm/>
     {/* <DashboardData/> */}
    {/* <UserList/> */}
    </main>
  );
}
