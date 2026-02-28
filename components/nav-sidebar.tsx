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
  useSidebar,
} from "@/components/ui/sidebar"
import { CalendarCheck, Home, ListTodo, LogOut, MessageCircle, NotebookText, NotepadText } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";


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
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Notes",
    url: "/notes",
    icon: NotepadText,
  },
  {
    title: "Journal",
    url: "/journal",
    icon: NotebookText,
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
      <SidebarContent className="pt-2 group-data-[collapsible=icon]:items-center">
        <SidebarHeader className="h-13 flex-row items-center justify-center px-0">
          <span className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <Image src="/icon.svg" alt="me icon" width={24} height={24} className="size-6" />
            <span className="font-black text-foreground text-3xl/none">me.</span>
          </span>
          <Image
            src="/icon.svg"
            alt="me icon"
            width={32}
            height={32}
            className="hidden size-8 group-data-[collapsible=icon]:inline-block"
          />
        </SidebarHeader>
        <SidebarGroup className="group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-0">
          <SidebarGroupContent className="group-data-[collapsible=icon]:w-auto">
            <SidebarMenu className="group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:items-center">
              {items.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                >
                  <SidebarMenuButton
                    className="group-data-[collapsible=icon]:justify-center"
                    render={
                      <Link
                        href={item.url}
                        onClick={handleNavClick()}
                        className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
                      >
                        <item.icon className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
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
              {/* {comingSoonItems.map((item) => (
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
              ))} */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:items-center">
        <SidebarMenu className="group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <div className="flex w-full justify-start group-data-[collapsible=icon]:justify-center">
              <ModeToggle />
            </div>
          </SidebarMenuItem>
          {footerItems.map((item) => (
            <SidebarMenuItem
              key={item.title}
              className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
            >
              <SidebarMenuButton
                className="group-data-[collapsible=icon]:justify-center"
                render={
                  <a
                    href={item.url}
                    aria-disabled={item.disabled}
                    onClick={handleNavClick(item.disabled)}
                    className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
                  >
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </a>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
