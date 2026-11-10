import { notFound } from 'next/navigation';

/** Any unknown URL renders the site's 404 page (inside the normal header and footer). */
export default function Missing() {
  notFound();
}
