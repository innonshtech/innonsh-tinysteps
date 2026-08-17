import type { Metadata } from "next";
import { Inter, Manrope, Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "react-toastify";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TinySteps — A little app that runs your preschool with a smile",
  description:
    "TinySteps is a warm, simple preschool ERP. Attendance, fees, parents, admissions, notices — all in one friendly little app made for tiny humans and the grown-ups who love them.",
  keywords: [
    "School ERP",
    "Innonsh TinySteps",
    "School Management System",
    "Pre-primary software",
    "Education Management",
    "Student Information System",
  ],
  authors: [{ name: "Innonsh TinySteps" }],
  creator: "Innonsh TinySteps",
  publisher: "Innonsh TinySteps",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  applicationName: "Innonsh TinySteps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${fredoka.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </AuthProvider>
      </body>
    </html>
  );
}
