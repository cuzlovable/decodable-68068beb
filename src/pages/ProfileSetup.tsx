import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ImagePlus, X, Sparkles, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadProfilePhoto, signPhotoPaths } from "@/lib/photos";
import { useUserState } from "@/hooks/useUserState";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { DEFAULT_SEARCH_RADIUS_MILES } from "@/lib/compatibility";
import { ageFromBirthDate, GENDER_OPTIONS, MIN_AGE, ORIENTATION_OPTIONS } from "@/lib/age";
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
  const [locationLabel, setLocationLabel] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(DEFAULT_SEARCH_RADIUS_MILES);
  const [locating, setLocating] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<string>("");
  const [orientation, setOrientation] = useState<string>("");
  const [preferredGenders, setPreferredGenders] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(99);


  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);


      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "display_name, bio, photos, vibe_traits, current_location, current_latitude, current_longitude, search_radius_miles, birth_date, gender, orientation, preferred_genders, preferred_age_min, preferred_age_max",
        )
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        setTraits(profile.vibe_traits || []);
        setPhotos(profile.photos || []);
        setPreviews(await signPhotoPaths(profile.photos || []));
        setLocationLabel(profile.current_location || "");
        if (
          typeof profile.current_latitude === "number" &&
          typeof profile.current_longitude === "number"
        ) {
          setCoords({ lat: profile.current_latitude, lng: profile.current_longitude });
        }
        setRadius(profile.search_radius_miles ?? DEFAULT_SEARCH_RADIUS_MILES);
        // Age is derived from the Human Design birth date — never stored separately.
        setAge(ageFromBirthDate(profile.birth_date));
        setGender(profile.gender || "");
        setOrientation(profile.orientation || "");
        setPreferredGenders(profile.preferred_genders || []);
        setAgeMin(profile.preferred_age_min ?? 18);
        setAgeMax(profile.preferred_age_max ?? 99);
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

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const json = await res.json();
          setLocationLabel(json?.display_name || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        } catch {
          setLocationLabel(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        }
        setLocating(false);
      },
      () => {
        toast.error("Couldn't get your location");
        setLocating(false);
      },
    );
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!displayName.trim()) {
      toast.error("Add your name so matches know who you are");
      return;
    }
    // 18+ gate: derived from the birth date collected during Human Design onboarding.
    if (age === null || age < MIN_AGE) {
      toast.error(`You must be ${MIN_AGE} or older to create a dating profile`);
      return;
    }
    if (photos.length === 0) {
      toast.error("Add at least one photo so you can be discovered");
      return;
    }
    if (!gender) {
      toast.error("Select your gender");
      return;
    }
    if (preferredGenders.length === 0) {
      toast.error("Pick who you'd like to see");
      return;
    }
    if (ageMin > ageMax) {
      toast.error("Your age range is inverted");
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
          current_location: locationLabel.trim() || null,
          current_latitude: coords?.lat ?? null,
          current_longitude: coords?.lng ?? null,
          search_radius_miles: radius,
          gender,
          orientation: orientation || null,
          preferred_genders: preferredGenders,
          preferred_age_min: Math.max(MIN_AGE, ageMin),
          preferred_age_max: Math.min(120, ageMax),
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
            <Label>
              You{" "}
              {age !== null && (
                <span className="text-muted-foreground">
                  · {age} {age < MIN_AGE ? "(must be 18+)" : "years old"}
                </span>
              )}
            </Label>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGender(option)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    gender === option
                      ? "gradient-aura text-primary-foreground border-transparent"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {ORIENTATION_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOrientation(orientation === option ? "" : option)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    orientation === option
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Your age is shown to others — your exact birth date never is.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Show me</Label>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((option) => {
                const active = preferredGenders.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setPreferredGenders((prev) =>
                        prev.includes(option) ? prev.filter((g) => g !== option) : [...prev, option],
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      active
                        ? "gradient-aura text-primary-foreground border-transparent"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Label htmlFor="ageMin" className="text-xs text-muted-foreground">
                  Age from
                </Label>
                <Input
                  id="ageMin"
                  type="number"
                  min={MIN_AGE}
                  max={120}
                  value={ageMin}
                  onChange={(e) => setAgeMin(Math.max(MIN_AGE, Math.min(120, Number(e.target.value) || MIN_AGE)))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ageMax" className="text-xs text-muted-foreground">
                  Age to
                </Label>
                <Input
                  id="ageMax"
                  type="number"
                  min={MIN_AGE}
                  max={120}
                  value={ageMax}
                  onChange={(e) => setAgeMax(Math.max(MIN_AGE, Math.min(120, Number(e.target.value) || MIN_AGE)))}
                />
              </div>
            </div>
          </div>



          <div className="space-y-2">
            <Label htmlFor="location">Current location</Label>
            <LocationAutocomplete
              value={locationLabel}
              onChange={(loc, lat, lon) => {
                setLocationLabel(loc);
                setCoords({ lat, lng: lon });
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={useCurrentLocation}
              disabled={locating}
              className="w-full"
            >
              {locating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              Use current location
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="radius">Search radius (miles)</Label>
            <Input
              id="radius"
              type="number"
              min={1}
              max={500}
              value={radius}
              onChange={(e) => setRadius(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
            />
            <p className="text-[11px] text-muted-foreground">
              Nearby matches inside this radius rank higher.
            </p>
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
