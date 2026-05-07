"use client";

interface TopbarIconButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  hiddenMobile?: boolean;
}

export default function TopbarIconButton({
  onClick,
  title,
  children,
  hiddenMobile = false,
}: TopbarIconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-8 h-8 rounded-full
        flex items-center justify-center
        text-slate-500
        hover:text-[var(--color-primary)]
        hover:bg-[var(--color-primary)]/10
        transition-all active:scale-90
        ${hiddenMobile ? "hidden sm:flex" : ""}
      `}
    >
      {children}
    </button>
  );
}