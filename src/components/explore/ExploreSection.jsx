"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { getPublicVideos } from "@/services/api";

const defaultVideos = [
  {
    id: 1,
    src: "/videos/install_video_1.mp4",
    title: "Live Installation Walkthrough",
    subtitle: "Watch Our Team at Work",
    description:
      "See a real invisible grill installation in action — from aluminium track mounting to stainless steel cable tensioning, all performed by our certified Hyderabad team.",
    tag: "INSTALLATION PROCESS",
  },
  {
    id: 2,
    src: "/videos/install_video_2.mp4",
    title: "Product Showcase & Finish Quality",
    subtitle: "Seamless Design, Premium Feel",
    description:
      "A close-up walkthrough of the finished grill — observe the nylon melt-coated SS 316 cables, the 27 mm aluminium base track, and the near-invisible look from every angle.",
    tag: "PRODUCT SHOWCASE",
  },
];

function VideoPlayer({ video, index }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(!muted);
  };

  const openFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || el.duration === 0) return;
    setProgress((el.currentTime / el.duration) * 100);
  };

  const handleSeek = (e) => {
    const el = videoRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * el.duration;
  };

  const handleEnded = () => setPlaying(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group relative rounded-3xl overflow-hidden border border-white/10 bg-deccan-card shadow-2xl hover:border-deccan-cyan/40 transition-all duration-300"
    >
      {/* Video Element */}
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          src={video.src}
          muted
          loop={false}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-deccan-dark/90 via-transparent to-black/10 pointer-events-none" />

        {/* Top Tag */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="bg-deccan-dark/85 backdrop-blur-md border border-deccan-cyan/30 text-deccan-cyan font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
            {video.tag}
          </span>
        </div>

        {/* Controls overlay - shows on hover or pause */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
          {/* Big center play/pause button */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-deccan-dark/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-deccan-cyan/20 hover:border-deccan-cyan/60 transition-all hover:scale-110 shadow-2xl"
            aria-label={playing ? "Pause video" : "Play video"}
          >
            {playing ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>
        </div>

        {/* Bottom Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <div
            className="w-full h-1 rounded-full bg-white/20 cursor-pointer group/progress"
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full bg-deccan-cyan transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              onClick={openFullscreen}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Info Below Video */}
      <div className="p-6 space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-deccan-cyan block">
          {video.subtitle}
        </span>
        <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-deccan-cyan transition-colors">
          {video.title}
        </h3>
        <p className="text-slate-400 text-sm font-light leading-relaxed">
          {video.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function ExploreSection() {
  const [videoList, setVideoList] = useState(defaultVideos);

  useEffect(() => {
    getPublicVideos().then((liveVideos) => {
      if (liveVideos && liveVideos.length > 0) {
        const formatted = liveVideos.map((v, i) => ({
          id: v._id || i,
          src: v.videoUrl,
          title: v.title,
          subtitle: v.subtitle || v.category || "Deccan Space Works",
          description: v.description,
          tag: v.tag || "INSTALLATION PROCESS"
        }));
        setVideoList(formatted);
      }
    });
  }, []);

  return (
    <section id="explore" className="py-24 bg-deccan-dark relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-deccan-cyan/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
              Explore Our Work
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              See Invisible Grills{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-deccan-cyan via-cyan-300 to-blue-400">
                In Action
              </span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
              Real installation footage from our Hyderabad projects — from the first aluminium track drill to the final tensioned cable finish.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-shrink-0"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-deccan-card border border-white/10">
              <div className="w-2 h-2 rounded-full bg-deccan-cyan animate-pulse" />
              <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider">
                Authentic Field Footage
              </span>
            </div>
          </motion.div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {videoList.map((video, index) => (
            <VideoPlayer key={video.id} video={video} index={index} />
          ))}
        </div>

      </div>
    </section>
  );
}
