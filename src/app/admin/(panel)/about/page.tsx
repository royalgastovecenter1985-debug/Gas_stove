import { AboutForm } from '@/components/admin/AboutForm';
import { Flash, type SP } from '@/components/admin/Flash';
import { requireAdmin } from '@/lib/auth';
import { smallOf } from '@/lib/picture';
import { getAbout } from '@/lib/settings';

export const metadata = { title: 'About page' };

export default async function AboutAdmin({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const [sp, about] = await Promise.all([searchParams, getAbout()]);
  return (
    <>
      <Flash sp={sp} />
      <AboutForm
        about={about}
        photoUrls={{
          photoMain: smallOf(about.photoMain),
          photoSide1: smallOf(about.photoSide1),
          photoSide2: smallOf(about.photoSide2),
          boardImage: smallOf(about.boardImage),
        }}
      />
    </>
  );
}
