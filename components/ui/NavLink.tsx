// Section links ("/#pricing") use a plain <a> so the browser glides there straight away on the home page
// (a Next <Link> would re-fetch the page first); everything else uses <Link>.
import Link from "next/link";

export default function NavLink({ href, ...rest }: React.ComponentProps<"a"> & { href: string }) {
  return href.startsWith("/#") || !href.startsWith("/") ? <a href={href} {...rest} /> : <Link href={href} {...rest} />;
}
