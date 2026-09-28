// Platform settings: AI, ads, new accounts, payments, support contact, announcement
import { requireSuperAdmin } from "@/lib/auth";
import { getAiConfig, getPlatform, maskKey } from "@/lib/platform";
import { db } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import PlatformSettings from "@/components/admin/PlatformSettings";

export default async function AdminSettings() {
  await requireSuperAdmin();
  const [platform, ai, savedAi] = await Promise.all([getPlatform(), getAiConfig(), db.setting.findUnique({ where: { key: "ai" } })]);
  const savedKey = savedAi ? Boolean(JSON.parse(savedAi.value).apiKey) : false;
  const { methods, ...rest } = platform;
  return (
    <div className="space-y-6">
      <PageTitle title="Platform settings" desc="AI, prices, payments and everything businesses see." />
      <PlatformSettings
        {...rest}
        methods={methods}
        // the key itself never leaves the server
        ai={{ enabled: ai.enabled, model: ai.model, temperature: ai.temperature, keyHint: maskKey(ai.apiKey), keyFromEnv: !!ai.apiKey && !savedKey }}
      />
    </div>
  );
}
