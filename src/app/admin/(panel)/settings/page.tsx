import { Flash, type SP } from '@/components/admin/Flash';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { requireAdmin } from '@/lib/auth';
import { imgSrc } from '@/lib/format';
import { fileExists } from '@/lib/paths';
import { getSettings } from '@/lib/settings';
import { FILE_SETTINGS } from '@/lib/settings-schema';

export const metadata = { title: 'Website settings' };

export default async function SettingsAdmin({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const [sp, s] = await Promise.all([searchParams, getSettings()]);
  return (
    <>
      <Flash sp={sp} />
      <SettingsForm
        values={s}
        logoUrl={imgSrc(s.logo)}
        faviconUrl={imgSrc(s.favicon)}
        brochureUrl={fileExists(s.brochure_file) ? imgSrc(s.brochure_file) : null}
        brochureIsDefault={s.brochure_file === FILE_SETTINGS.brochure_file}
      />
    </>
  );
}
