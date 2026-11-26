document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // 1. Pink Confetti Effect (Runs on index.html)
    // =========================================================================
    const canvas = document.getElementById("confetti-canvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ["#ff4d94", "#ff80b3", "#e60073", "#ffb3d1", "#ffffff", "#ffccd5", "#ffe66d"];
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
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        videoCards.forEach((card) => revealObserver.observe(card));
    }

    if (allVideos.length > 0) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const vid = entry.target;
                if (entry.isIntersecting) {
                    allVideos.forEach((other) => {
                        if (other !== vid && !other.paused) {
                            other.pause();
                        }
                    });
                    vid.play().catch(() => {});
                } else if (!vid.paused) {
                    vid.pause();
                }
            });
        }, { threshold: 0.6 });

        allVideos.forEach((vid) => {
            vid.addEventListener("ended", keepBackgroundMusicPlaying);
            vid.addEventListener("pause", keepBackgroundMusicPlaying);
            videoObserver.observe(vid);
        });
    }

    // =========================================================================
    // 4. Interactive Envelope Letter Modal (Activates ONLY at Bottom -> 4s Timer)
    // =========================================================================
    const envelopeModal = document.getElementById("envelope-modal");
    const envelopeBox = document.getElementById("envelope-box");
    const closeLetterBtn = document.getElementById("close-letter-btn");
    const openEnvelopeBtn = document.getElementById("open-envelope-btn");
    const bottomTrigger = document.getElementById("bottom-trigger");

    const BOTTOM_POPUP_DELAY_MS = 4000; // 4 seconds countdown pagkarating sa pinakababa
    let bottomCountdownId = null;
    let popupAlreadyShown = false;

    function openModal() {
        if (!envelopeModal) return;
        clearBottomCountdown();
        envelopeModal.classList.add("active");
        envelopeModal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
        if (!envelopeModal) return;
        envelopeModal.classList.remove("active");
        envelopeModal.setAttribute("aria-hidden", "true");
        if (envelopeBox) envelopeBox.classList.remove("opened");
    }

    function clearBottomCountdown() {
        if (bottomCountdownId) {
            clearTimeout(bottomCountdownId);
            bottomCountdownId = null;
        }
    }

    function isScrolledToVeryBottom() {
        const scrollPosition = window.scrollY + window.innerHeight;
        const docHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
        );
        return scrollPosition >= docHeight - 24;
    }

    function startFourSecondBottomTimer() {
        if (!envelopeModal || popupAlreadyShown || bottomCountdownId) return;
        bottomCountdownId = setTimeout(() => {
            bottomCountdownId = null;
            if (!popupAlreadyShown && isScrolledToVeryBottom()) {
                popupAlreadyShown = true;
                openModal();
            }
        }, BOTTOM_POPUP_DELAY_MS);
    }

    function handleBottomReached() {
        if (!envelopeModal || popupAlreadyShown) return;
        if (isScrolledToVeryBottom()) {
            startFourSecondBottomTimer();
        }
    }

    if (openEnvelopeBtn) {
        openEnvelopeBtn.addEventListener("click", () => {
            popupAlreadyShown = true;
            openModal();
        });
    }

    if (envelopeBox) {
        envelopeBox.addEventListener("click", () => {
            envelopeBox.classList.add("opened");
        });
    }

    if (closeLetterBtn) {
        closeLetterBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeModal();
        });
    }

    if (envelopeModal) {
        envelopeModal.addEventListener("click", (e) => {
            if (e.target === envelopeModal) {
                closeModal();
            }
        });

        // 1) Scroll check: kapag naabot ang pinakababa, saka magsisimula ang 4s timer
        window.addEventListener("scroll", handleBottomReached, { passive: true });
        window.addEventListener("resize", handleBottomReached, { passive: true });

        // 2) Bottom trigger observer para sa mas siguradong detection sa pinakababa ng page
        if (bottomTrigger && "IntersectionObserver" in window) {
            const bottomObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && isScrolledToVeryBottom()) {
                        startFourSecondBottomTimer();
                    }
                });
            }, { threshold: 0.1 });
            bottomObserver.observe(bottomTrigger);
        }
    }
});