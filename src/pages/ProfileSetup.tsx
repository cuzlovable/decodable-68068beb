import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ImagePlus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadProfilePhoto, signPhotoPaths } from "@/lib/photos";
import { useUserState } from "@/hooks/useUserState";
import { toast } from "sonner";


const VIBE_TRAITS = [
  "Slow burn",
  "Instant spark",
  "Deep talks",
  "Playful chaos",
  "Grounded calm",
  "Adventurous",
  "Creative fire",
  "Quiet intimacy",
  "Big energy",
  "Curious mind",
  "Nature seeker",
  "Night owl",
];

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { refresh } = useUserState();
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);


      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, photos, vibe_traits")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        setTraits(profile.vibe_traits || []);
        setPhotos(profile.photos || []);
        setPreviews(await signPhotoPaths(profile.photos || []));
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const toggleTrait = (trait: string) =>
    setTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : prev.length >= 5 ? prev : [...prev, trait],
    );

  const handleFiles = async (files: FileList | null) => {
    if (!files || !userId) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, 6 - photos.length)) {
        added.push(await uploadProfilePhoto(userId, file));
      }
      const nextPhotos = [...photos, ...added];
      setPhotos(nextPhotos);
      const signed = await signPhotoPaths(added);
      setPreviews((prev) => ({ ...prev, ...signed }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (path: string) => setPhotos((prev) => prev.filter((p) => p !== path));

  const handleSave = async () => {
    if (!userId) return;
    if (!displayName.trim()) {
      toast.error("Add your name so matches know who you are");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          photos,
          vibe_traits: traits,
          avatar_url: null,
        },
        { onConflict: "user_id" },
      )
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
    await refresh();
    navigate("/discover", { replace: true });

  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-celestial flex items-center justify-center">
        <div className="w-10 h-10 rounded-full gradient-aura animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-celestial px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Your profile</h1>
          <p className="text-sm text-muted-foreground">
            Name, photos, and the vibe you bring — this is what others see.
          </p>
        </div>

        <div className="space-y-6 p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Luna"
              maxLength={60}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What lights you up?"
              rows={4}
              maxLength={500}
            />
            <p className="text-[11px] text-muted-foreground">{bio.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((path) => (
                <div key={path} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  {previews[path] && (
                    <img src={previews[path]} alt="Profile photo" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(path)}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <label className="aspect-square rounded-xl border border-dashed border-border flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted/40 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-5 h-5 mb-1" />
                      <span className="text-[11px]">Add</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chemistry / vibe traits <span className="text-muted-foreground">(pick up to 5)</span></Label>
            <div className="flex flex-wrap gap-2">
              {VIBE_TRAITS.map((trait) => {
                const active = traits.includes(trait);
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => toggleTrait(trait)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      active
                        ? "gradient-aura text-primary-foreground border-transparent"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {trait}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-6 rounded-xl gradient-aura text-primary-foreground"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Save and start discovering
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
