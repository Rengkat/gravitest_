import Footer from "@/Components/Footer";
import PublicNav from "./Components/navigation/Nav";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <PublicNav />
      {children}
      <Footer />
    </div>
  );
}
