document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // 1. Pink Confetti Effect (Runs on index.html)
    // =========================================================================
    const canvas = document.getElementById("confetti-canvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ["#ff4d94", "#ff80b3", "#e60073", "#ffb3d1", "#ffffff", "#ffccd5"];
        let particles = [];

        function createConfetti(count = 100) {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height - canvas.height,
                    size: Math.random() * 8 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    speedY: Math.random() * 3 + 2,
                    speedX: Math.random() * 2 - 1,
                    rotation: Math.random() * 360
                });
            }
        }

        function animateConfetti() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += 2;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();

                if (p.y > canvas.height) {
                    particles.splice(i, 1);
                }
            }
            requestAnimationFrame(animateConfetti);
        }

        createConfetti(120);
        animateConfetti();

        const celebrateBtn = document.getElementById("celebrate-btn");
        if (celebrateBtn) {
            celebrateBtn.addEventListener("click", () => createConfetti(100));
        }

        window.addEventListener("resize", () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    // =========================================================================
    // 2. Continuous Low-Volume Background Music (Runs on greetings.html)
    // =========================================================================
    const bgMusic = document.getElementById("bg-music");
    const musicToggle = document.getElementById("music-toggle");
    const LOW_BGM_VOLUME = 0.10;
    let userMutedMusic = false;

    function getAudioSrc() {
        if (!bgMusic) return "";
        const sourceEl = bgMusic.querySelector("source");
        return bgMusic.getAttribute("src") || (sourceEl && sourceEl.getAttribute("src")) || "";
    }

    function keepBackgroundMusicPlaying() {
        if (!bgMusic || !getAudioSrc() || userMutedMusic) return;
        bgMusic.volume = LOW_BGM_VOLUME;
        bgMusic.loop = true;
        if (bgMusic.paused) {
            bgMusic.play().then(() => {
                if (musicToggle) musicToggle.textContent = "🎵 Music: ON";
            }).catch(() => {});
        }
    }

    if (bgMusic && musicToggle) {
        bgMusic.volume = LOW_BGM_VOLUME;
        bgMusic.loop = true;

        const startMusic = () => {
            if (!userMutedMusic && getAudioSrc()) {
                bgMusic.volume = LOW_BGM_VOLUME;
                bgMusic.play().then(() => {
                    musicToggle.textContent = "🎵 Music: ON";
                }).catch(() => {
                    musicToggle.textContent = "🔇 Tap for Music";
                });
            }
        };

        startMusic();

        const unlockMusic = () => {
            if (!userMutedMusic && bgMusic.paused && getAudioSrc()) {
                startMusic();
            }
        };
        document.addEventListener("click", unlockMusic, { once: true });
        document.addEventListener("touchstart", unlockMusic, { once: true });
        document.addEventListener("scroll", unlockMusic, { once: true });

        musicToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            if (bgMusic.paused) {
                userMutedMusic = false;
                bgMusic.volume = LOW_BGM_VOLUME;
                bgMusic.play().then(() => {
                    musicToggle.textContent = "🎵 Music: ON";
                }).catch(() => {});
            } else {
                userMutedMusic = true;
                bgMusic.pause();
                musicToggle.textContent = "🔇 Music: OFF";
            }
        });
    }

    // =========================================================================
    // 3. Video Card Fade-In Reveal & Autoplay on Scroll
    // =========================================================================
    const videoCards = document.querySelectorAll(".video-card");
    const allVideos = document.querySelectorAll("video");

    if (videoCards.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        }, { threshold: 0.12 });

        videoCards.forEach((card) => revealObserver.observe(card));
    }

    if (allVideos.length > 0) {
        const autoplayObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                const hasSource = Boolean(video.getAttribute("src") || video.currentSrc);
                if (!hasSource) return;

                if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
                    allVideos.forEach((otherVideo) => {
                        if (otherVideo !== video && !otherVideo.paused) {
                            otherVideo.pause();
                        }
                    });

                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            keepBackgroundMusicPlaying();
                        }).catch(() => {});
                    }
                } else if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
                    if (!video.paused) {
                        video.pause();
                        keepBackgroundMusicPlaying();
                    }
                }
            });
        }, {
            threshold: [0, 0.35, 0.65, 1]
        });

        allVideos.forEach((video) => {
            autoplayObserver.observe(video);

            video.addEventListener("play", () => {
                allVideos.forEach((otherVideo) => {
                    if (otherVideo !== video && !otherVideo.paused) {
                        otherVideo.pause();
                    }
                });
                keepBackgroundMusicPlaying();
            });

            video.addEventListener("pause", keepBackgroundMusicPlaying);
            video.addEventListener("ended", keepBackgroundMusicPlaying);
        });
    }

    // =========================================================================
    // 4. Envelope Popup (After Reaching Bottom or Last Video Ended + 3s Delay)
    // =========================================================================
    const bottomTrigger = document.getElementById("bottom-trigger");
    const envelopeModal = document.getElementById("envelope-modal");
    const envelopeBox = document.getElementById("envelope-box");
    const closeLetterBtn = document.getElementById("close-letter-btn");
    const feedVideos = document.querySelectorAll(".video-feed video");

    let popupShown = false;
    let delayTimer = null;

    function triggerEnvelopeAfterDelay() {
        if (popupShown || delayTimer || !envelopeModal) return;

        delayTimer = setTimeout(() => {
            envelopeModal.classList.add("active");
            envelopeModal.setAttribute("aria-hidden", "false");
            popupShown = true;
            delayTimer = null;
        }, 8000); // 8 seconds delay
    }

    if (bottomTrigger) {
        const bottomObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    triggerEnvelopeAfterDelay();
                } else if (!popupShown && delayTimer) {
                    clearTimeout(delayTimer);
                    delayTimer = null;
                }
            });
        }, { threshold: 0.5 });

        bottomObserver.observe(bottomTrigger);
    }

    const populatedVideos = Array.from(feedVideos).filter((v) => v.getAttribute("src"));
    if (populatedVideos.length > 0) {
        const lastVideo = populatedVideos[populatedVideos.length - 1];
        lastVideo.addEventListener("ended", () => {
            triggerEnvelopeAfterDelay();
        });
    }

    if (envelopeBox) {
        envelopeBox.addEventListener("click", (e) => {
            if (closeLetterBtn && (e.target === closeLetterBtn || closeLetterBtn.contains(e.target))) {
                return;
            }
            envelopeBox.classList.add("opened");
        });
    }

    if (closeLetterBtn && envelopeModal) {
        closeLetterBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            envelopeModal.classList.remove("active");
            envelopeModal.setAttribute("aria-hidden", "true");
        });
    }
});