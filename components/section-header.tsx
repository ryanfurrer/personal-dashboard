
interface SectionHeaderProps {
    title: string;
    action?: React.ReactNode;
    id?: string;
}

export default function SectionHeader({ title, action, id }: SectionHeaderProps) {
    const headingId = id || `section-header-${title.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className="flex items-center gap-4">
            <h2
                id={headingId}
                className="shrink-0 scroll-mt-20 font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
            >
                {title}
            </h2>
            <div className="h-px flex-1 bg-border/60" />
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}