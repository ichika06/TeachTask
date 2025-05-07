"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  BookOpen,
  Bot,
  Frame,
  Map,
  PieChart,
  Settings2,
  Gauge,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar(props) {
  const [user, setUser] = useState(null)
  const [userdata, setUserData] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("email, name, avatar")
          .eq("email", user.email)

        if (error) {
          console.error("Error fetching user data:", error)
        } else {
          setUserData(data[0])
        }
      }

      fetchUserData()
    }
  }, [user]) 

  const data = {
    user: {
      name: userdata?.name ?? "Guest",
      email: userdata?.email ?? "guest@example.com",
      avatar: userdata?.avatar ?? "https://images.seeklogo.com/logo-png/32/1/next-js-logo-png_seeklogo-321806.png", // Default avatar
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/Dashboard",
        icon: Gauge,
      },
      {
        title: "To-Do",
        url: "#",
        icon: Bot,
        items: [
          { title: "Todays Task", url: "/TodaysTask" },
          { title: "Teach", url: "/TodoTeach" },
          { title: "Task", url: "/Task" },
        ],
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
