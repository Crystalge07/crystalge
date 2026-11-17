import { hasPlaceholder } from '@/content';

/** A link that renders as plain muted text while its href is still a [placeholder]. */
export default function SmartLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (hasPlaceholder(href)) {
    return (
      <span className={className ? `${className} todo` : 'todo'} title={`todo: ${href}`}>
        {children}
      </span>
    );
  }
  const external = /^https?:/.test(href) || href.endsWith('.pdf');
  return (
    <a href={href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}
