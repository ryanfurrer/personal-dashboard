"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { CalendarCheck, Home, ListTodo, LogOut, MessageCircle, NotebookText, NotepadText } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePathname } from "next/navigation";
import Link from "next/link";


const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Socials",
    url: "/socials",
    icon: MessageCircle,
  },
]


const comingSoonItems = [
  {
    title: "Habits",
    url: "/habits",
    icon: CalendarCheck,
    disabled: true,
    tooltip: "Coming soon",
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
    disabled: true,
    tooltip: "Coming soon",
  },
  {
    title: "Notes",
    url: "/notes",
    icon: NotepadText,
    disabled: true,
    tooltip: "Coming soon",
  },
  {
    title: "Journal",
    url: "/journal",
    icon: NotebookText,
    disabled: true,
    tooltip: "Coming soon",
  },

]
const footerItems = [
  {
    title: "Log out",
    url: "/account",
    icon: LogOut,
    disabled: true,
    tooltip: "Coming soon",
  },
]

export function NavSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (

                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  } isActive={pathname === item.url} />
                </SidebarMenuItem>))}
              {comingSoonItems.map((item) => (
                <Tooltip key={item.title} aria-label={`${item.title} is ${item.tooltip}`}>
                  <TooltipTrigger>
                    <SidebarMenuItem>
                      <SidebarMenuButton render={
                        <Link href={item.url} aria-disabled={item.disabled} className="cursor-not-allowed">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      } />
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.tooltip}
                  </TooltipContent>
                </Tooltip>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ModeToggle />
          </SidebarMenuItem>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton render={
                <a href={item.url} aria-disabled={item.disabled}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              } />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}