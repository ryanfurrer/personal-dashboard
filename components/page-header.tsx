import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
}

export default function PageHeader({ icon: Icon, title }: PageHeaderProps) {
  return (
    <header className="py-2 text-sm border-b px-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={<SidebarTrigger />}></TooltipTrigger>
            <TooltipContent>
              <p>Toggle Sidebar <Kbd>CMD+S</Kbd></p>
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center h-6">
            <Separator orientation="vertical" />
          </div>
        </div>
        <Icon className="size-4" />
        <h1>{title}</h1>
      </div>
    </header>
  );
}
