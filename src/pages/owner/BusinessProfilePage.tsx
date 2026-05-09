import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { toast } from "sonner";

const BusinessProfilePage = () => {
  const navigate = useNavigate();
  const { businessName, businessIntro, setBusinessIntro } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(businessName || "");
  const [location, setLocation] = useState("");
  const [intro, setIntro] = useState(businessIntro || "");
  const [logo, setLogo] = useState<string | null>(null);

  const onPickPhoto = () => fileRef.current?.click();

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSave = () => {
    if (!name.trim()) {
      toast.error("Business name is required");
      return;
    }
    setBusinessIntro(intro.trim());
    toast.success("Business profile updated");
    navigate(-1);
  };

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-lg font-bold text-foreground mb-6">
          Your Business Details
        </h1>

        {/* Logo */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onPickPhoto}
            className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden"
            aria-label="Upload logo"
          >
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
          <div>
            <p className="text-sm font-medium text-foreground">Logo</p>
            <p className="text-xs text-muted-foreground">PNG or JPG · max 2 MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoChange}
          />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-2">
            Business name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mama Nkechi Provisions"
            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
          />
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State"
            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
          />
        </div>

        {/* Business intro */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Business intro
            </label>
            <span className="text-[10px] text-muted-foreground">{intro.length}/300</span>
          </div>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value.slice(0, 300))}
            placeholder="Say something about your business in a few words. This shows on your profile."
            rows={4}
            maxLength={300}
            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none"
          />
        </div>

        <button
          onClick={onSave}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
        >
          Save changes
        </button>
      </div>
      <OwnerBottomNav />
    </div>
  );
};

export default BusinessProfilePage;