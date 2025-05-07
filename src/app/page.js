import ModeToggle from "../components/ModeToggle/page";
import Image from "next/image";
import SidebarToggle from "./Dashboard/page";
import TodoTeach from "./TodoTeach/page";
import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <div
      className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}
