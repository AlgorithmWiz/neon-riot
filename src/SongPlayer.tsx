import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from "react";
import { LockKeyhole, Radio } from "lucide-react";

export const SONGS = [
  {
    title: "Static in the Wires",
    src: `${import.meta.env.BASE_URL}audio/static-in-the-wires.mp3`,
    cover: 0,
  },
  {
    title: "Concrete Cathedral",
    src: `${import.meta.env.BASE_URL}audio/concrete-cathedral.mp3`,
    cover: 1,
  },
  {
    title: "Chrome Is a Disease",
    src: `${import.meta.env.BASE_URL}audio/chrome-is-a-disease.mp3`,
    cover: 2,
  },
  {
    title: "No Gods / Only Noise",
    src: `${import.meta.env.BASE_URL}audio/no-gods-only-noise.mp3`,
    cover: 3,
  },
  {
    title: "Kill the Algorithm",
    src: `${import.meta.env.BASE_URL}audio/kill-the-algorithm.mp3`,
    cover: 4,
  },
  {
    title: "Earth Is the Opening Act",
    src: `${import.meta.env.BASE_URL}audio/Earth Is The Opening Act.mp3`,
    cover: 5,
  },
] as const;

type Song = (typeof SONGS)[number];
export type SongPlayerHandle = { playSong: (title: string) => void };

export default function SongPlayer({
  playerRef,
  unlockedTitles,
  backgroundMusic,
  riffPlaying,
  onToggleBackgroundMusic,
}: {
  playerRef: RefObject<SongPlayerHandle | null>;
  unlockedTitles: string[];
  backgroundMusic: boolean;
  riffPlaying: boolean;
  onToggleBackgroundMusic: () => void;
}) {
  const unlockedSongs = SONGS.filter((entry) =>
    unlockedTitles.includes(entry.title),
  );
  const [song, setSong] = useState<Song | null>(unlockedSongs[0] ?? null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const requested = useRef(false);

  const play = () => {
    void audioRef.current?.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setFailed(true);
    });
  };

  function selectSong(title: string) {
    const next = unlockedSongs.find((entry) => entry.title === title);
    if (!next) return;
    setFailed(false);
    if (next === song) {
      play();
      return;
    }
    requested.current = true;
    setPlaying(false);
    setSong(next);
  }

  useImperativeHandle(playerRef, () => ({
    playSong(title) {
      selectSong(title);
      audioRef.current?.scrollIntoView({ behavior: "auto", block: "center" });
    },
  }));

  useEffect(() => {
    if (song && unlockedSongs.some((entry) => entry.title === song.title))
      return;
    audioRef.current?.pause();
    setSong(unlockedSongs[0] ?? null);
    setPlaying(false);
  }, [song, unlockedSongs]);

  useEffect(() => {
    if (requested.current) {
      requested.current = false;
      play();
    }
  }, [song]);

  return (
    <>
      <BackgroundMusic
        suspended={playing || riffPlaying}
        enabled={backgroundMusic}
        onToggle={onToggleBackgroundMusic}
      />
      <section
        className={`song-player ${playing ? "song-playing" : ""} ${song ? "" : "song-locked"}`}
        aria-label="Pirate radio music player"
      >
        <div className="song-cover" aria-hidden="true">
          {song ? (
            <svg
              viewBox={`${(song.cover % 3) * 512} ${Math.floor(song.cover / 3) * 512} 512 512`}
              preserveAspectRatio="xMidYMid slice"
            >
              <image
                href={`${import.meta.env.BASE_URL}art/album-covers.webp`}
                width="1536"
                height="1024"
              />
            </svg>
          ) : (
            <LockKeyhole />
          )}
        </div>
        <div className="song-details">
          <div className="song-heading">
            <div>
              <span className="eyebrow">
                <Radio size={11} /> PIRATE RADIO /{" "}
                {playing
                  ? "ON AIR"
                  : song
                    ? `TRACK ${String(song.cover + 1).padStart(2, "0")}`
                    : "SIGNAL LOCKED"}
              </span>
              <h3>{song?.title ?? "Release an album to unlock its song"}</h3>
            </div>
            <span className="song-artist">NEON RIOT</span>
          </div>
          {song ? (
            <>
              <select
                className="song-select"
                aria-label="Choose a song"
                value={song.title}
                onChange={(event) => selectSong(event.target.value)}
              >
                {unlockedSongs.map((entry) => (
                  <option key={entry.src} value={entry.title}>
                    {entry.title}
                  </option>
                ))}
              </select>
              <audio
                ref={audioRef}
                src={song.src}
                controls
                preload="metadata"
                aria-label={`Play ${song.title}`}
                onPlay={() => {
                  setPlaying(true);
                  setFailed(false);
                }}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onError={() => {
                  setPlaying(false);
                  setFailed(true);
                }}
              >
                Your browser does not support audio playback.
              </audio>
            </>
          ) : (
            <p className="song-lock-message">
              Complete your first recording project to bring Pirate Radio
              online.
            </p>
          )}
          {failed && song && (
            <p className="song-error" role="alert">
              The track could not play. Try the controls or{" "}
              <a href={song.src}>open the MP3 directly</a>.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function BackgroundMusic({
  suspended,
  enabled,
  onToggle,
}: {
  suspended: boolean;
  enabled: boolean;
  onToggle: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    if (!enabled || suspended) {
      audio.pause();
      return;
    }
    const start = () => {
      void audio.play().catch(() => {
        // Browsers may require a user gesture before music can start.
      });
    };
    start();
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      audio.pause();
    };
  }, [enabled, suspended]);

  return (
    <section className="song-player" aria-label="Background music">
      <div className="song-cover" aria-hidden="true">
        <Radio />
      </div>
      <div className="song-details">
        <span className="eyebrow">BACKGROUND MUSIC / LOOP</span>
        <h3>Relentless Overdrive</h3>
        <button
          className="song-select"
          onClick={onToggle}
          aria-pressed={enabled}
        >
          {enabled ? "Mute background music" : "Enable background music"}
        </button>
        {enabled && suspended && <p>Paused during the performance.</p>}
        <audio
          ref={audioRef}
          src={`${import.meta.env.BASE_URL}audio/relentless drive.mp3`}
          loop
          preload="metadata"
          onError={() => setFailed(true)}
        />
        {failed && <p role="alert">Background music could not load.</p>}
      </div>
    </section>
  );
}
