
interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    id?: string;
}

export default function SectionHeader({ title, description, action, id }: SectionHeaderProps) {
    const headingId = id || `section-header-${title.toLowerCase().replace(/\s+/g, '-')}`;
    const descriptionId = description ? `${headingId}-description` : undefined;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 id={headingId} className="text-2xl font-semibold">
                    {title}
                </h2>
                {action}
            </div>
            {description && (
                <p
                    id={descriptionId}
                    aria-labelledby={headingId}
                    className="text-sm text-muted-foreground"
                >
                    {description}
                </p>
            )}
        </div>
    );
}