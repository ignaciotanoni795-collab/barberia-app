import { Bebas_Neue, Inter, Poppins } from "next/font/google";
import "./globals.css";
import LitFooter from "@/components/LitFooter";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "Otto Barbería",
  description: "Reservá tu turno",
  appleWebApp: {
    title: "Otto Barbería",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#1C1917",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${bebasNeue.variable} ${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <LitFooter cliente="Otto Barbería" />
      </body>
    </html>
  );
}
