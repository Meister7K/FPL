import { Html, Head, Main, NextScript } from "next/document";
import Link from "next/link";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Link href='/' className="border px-2 rounded-md hover:bg-stone-800 w-fit block sticky top-0 right-0 text-center">Home</Link>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
