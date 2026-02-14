interface AvatarProps {
  initials: string;
  gradient: string;
}

export function Avatar({ initials, gradient }: AvatarProps) {
  return (
    <div className="avatar" style={{ background: gradient }}>
      {initials}
    </div>
  );
}
