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
  SidebarRail,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { CalendarCheck, Home, ListTodo, LogOut, MessageCircle, NotebookText, NotepadText } from "lucide-react"
import { ModeToggle } from "./mode-toggle"


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
    disabled: true,
    tooltip: "Coming soon",
  },
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
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader>
          <SidebarTrigger className="text-muted-foreground" />
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
      {/* <SidebarRail /> */}
    </Sidebar>
  )
}