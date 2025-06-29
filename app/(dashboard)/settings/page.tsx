import { SettingsCard } from "./settings-card";
import { MockQRCode } from "@/components/mock-qr-code";

const SettingsPage = () => {
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24 space-y-6">
      <SettingsCard />
      <MockQRCode />
    </div>
  );
};

export default SettingsPage;