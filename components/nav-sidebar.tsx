"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
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
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Kbd } from "./ui/kbd"


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
  {
    title: "Habits",
    url: "/habits",
    icon: CalendarCheck,
  },
]


const comingSoonItems = [
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
  const { isMobile, setOpenMobile } = useSidebar();
  const archivedHabitsCount = useQuery(api.habits.getArchivedHabitsCount, {});
  const isHabitsRoute = pathname === "/habits" || pathname.startsWith("/habits/");
  const handleNavClick = (disabled?: boolean) => (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarContent className="pt-2">
        <SidebarHeader className="flex-row items-center justify-center">
          <span className="font-black text-foreground text-4xl/none">me.</span>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={
                      <Link href={item.url} onClick={handleNavClick()}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    }
                    isActive={item.url === "/habits" ? isHabitsRoute : pathname === item.url}
                  />
                  {item.url === "/habits" && (
                    <SidebarMenuSub>
                      {(archivedHabitsCount ?? 0) > 0 && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            render={
                              <Link href="/habits/archived" onClick={handleNavClick()}>
                                Archived
                              </Link>
                            }
                            isActive={pathname === "/habits/archived"}
                          />
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
              {comingSoonItems.map((item) => (
                <Tooltip key={item.title} aria-label={`${item.title} is ${item.tooltip}`}>
                  <TooltipTrigger>
                    <SidebarMenuItem>
                      <SidebarMenuButton render={
                        <Link
                          href={item.url}
                          aria-disabled={item.disabled}
                          className={item.disabled ? "cursor-not-allowed" : undefined}
                          onClick={handleNavClick(item.disabled)}
                        >
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
                <a
                  href={item.url}
                  aria-disabled={item.disabled}
                  onClick={handleNavClick(item.disabled)}
                >
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
