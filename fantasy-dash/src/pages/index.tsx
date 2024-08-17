import { Inter } from "next/font/google";
import EnterForm from "../components/home/entranceForm"

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  console.log("Rendering Home component");
  console.log("EnterForm component:", EnterForm);

  return (
    <main
      className={`flex min-h-screen flex-col justify-start ${inter.className}`}
    >
      <h1 className="lg:text-6xl bold text-2xl w-full text-center py-20 px-4 ">Welcome to the Sleeper Data Dashboard</h1>
    
      
        {EnterForm ? <EnterForm /> : <p>EnterForm component not found</p>}
        
 
    </main>
  );
}