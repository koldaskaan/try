// Melisa Özübek - Yeni Medya Dersi Web Sayfası
// Temel Etkileşimler (Menü & Sayfa İçi Kaydırma)

document.addEventListener('DOMContentLoaded', () => {
    // Mobil Menü Açma / Kapatma
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Menüdeki bir linke tıklandığında menüyü kapat
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // Aktif Menü Elemanını Scroll ile Takip Etme
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // ===================================================
    // MELİSA'NIN GÜNLÜĞÜ (NOT EKLEME SİSTEMİ)
    // ===================================================
    const addDiaryBtn = document.getElementById('addDiaryBtn');
    const diaryTitleInput = document.getElementById('diaryTitleInput');
    const diaryMoodInput = document.getElementById('diaryMoodInput');
    const diaryContentInput = document.getElementById('diaryContentInput');
    const diaryEntriesList = document.getElementById('diaryEntriesList');

    if (addDiaryBtn && diaryEntriesList) {
        addDiaryBtn.addEventListener('click', () => {
            const title = diaryTitleInput.value.trim();
            const content = diaryContentInput.value.trim();
            const mood = diaryMoodInput.options[diaryMoodInput.selectedIndex].text;

            if (!title || !content) {
                alert('Lütfen günlüğünüz için bir başlık ve içerik metni yazın.');
                return;
            }

            // Bugünün tarihini formatla
            const today = new Date();
            const dateStr = today.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

            // Yeni Günlük Kartı Oluştur
            const newEntry = document.createElement('article');
            newEntry.className = 'diary-entry-card';
            newEntry.innerHTML = `
                <div class="entry-header">
                    <div class="entry-meta">
                        <span class="entry-date">📅 ${dateStr}</span>
                        <span class="entry-mood">${mood}</span>
                    </div>
                    <h4 class="entry-title">${title}</h4>
                </div>
                <div class="entry-body">
                    <p>${content}</p>
                </div>
            `;

            // Listenin en başına ekle
            diaryEntriesList.prepend(newEntry);

            // Formu temizle
            diaryTitleInput.value = '';
            diaryContentInput.value = '';

            // Kullanıcıya şık bir bildirim ver
            newEntry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // ===================================================
    // ZAHİDEBIRD OYUN MOTORU (CANVAS) - KOLAYLAŞTIRILMIŞ & RESİM DESTEKLİ
    // ===================================================
    const canvas = document.getElementById('birdCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const overlay = document.getElementById('gameOverlay');
        const overlayTitle = document.getElementById('overlayTitle');
        const overlayDesc = document.getElementById('overlayDesc');
        const startBtn = document.getElementById('startGameBtn');
        const currentScoreEl = document.getElementById('currentScore');
        const highScoreEl = document.getElementById('highScore');
        const birdImageInput = document.getElementById('birdImageInput');
        const resetBirdImgBtn = document.getElementById('resetBirdImgBtn');

        let isRunning = false;
        let score = 0;
        let highScore = localStorage.getItem('zahideBirdHighScore') || 0;
        highScoreEl.innerText = highScore;

        // Özel Resim (Avatar) Yönetimi - Yüklenen Zahide fotoğrafı varsayılan olarak yüklensin
        let customBirdImage = new Image();
        customBirdImage.src = 'zahide.jpg';
        let isUsingCustomImage = true;

        customBirdImage.onload = () => {
            draw();
        };

        // Resim Değiştirme Eventi
        if (birdImageInput) {
            birdImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            customBirdImage = img;
                            isUsingCustomImage = true;
                            draw();
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (resetBirdImgBtn) {
            resetBirdImgBtn.addEventListener('click', () => {
                customBirdImage = new Image();
                customBirdImage.src = 'zahide.jpg';
                isUsingCustomImage = true;
                if (birdImageInput) birdImageInput.value = '';
                draw();
            });
        }

        // Kuş özellikleri (Aşırı yumuşak yerçekimi & kontrollü zıplama)
        const bird = {
            x: 90,
            y: 280,
            radius: 20, // Çarpışma yarıçapı
            displaySize: 48, // Çizim genişlik/yükseklik
            velocity: 0,
            gravity: 0.08, // Çok hafif yerçekimi (hızlı düşmeyi tamamen engeller)
            maxDropSpeed: 2.8, // Maksimum düşüş hızı sınırı (asla hızlı düşemez)
            jump: -3.8,    // Yumuşak zıplama
            rotation: 0
        };

        // Borular (Engeller) - ÇOK KOLAY VE GENİŞ ARALIKLI
        let pipes = [];
        const pipeWidth = 56;
        const pipeGap = 210; // 210px devasa geçiş boşluğu
        const pipeSpeed = 1.4; // Sakin ve yavaş akış
        let frames = 0;
        let hasPlayerFirstFlapped = false; // Oyuncu ilk zıplamayı yapana kadar kuş düşmez!

        function resetGame() {
            bird.y = 280;
            bird.velocity = 0;
            bird.rotation = 0;
            pipes = [];
            score = 0;
            frames = 0;
            hasPlayerFirstFlapped = false;
            currentScoreEl.innerText = score;
        }

        function flap() {
            if (!isRunning) return;
            hasPlayerFirstFlapped = true; // Oyuncu zıpladı, artık serbest
            bird.velocity = bird.jump;
        }

        // Kontroller: Tuş ve Tıklama
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                const rect = canvas.getBoundingClientRect();
                if (rect.top >= -250 && rect.bottom <= window.innerHeight + 250) {
                    e.preventDefault();
                }
                if (!isRunning && overlay.classList.contains('hidden') === false) {
                    startGame();
                } else {
                    flap();
                }
            }
        });

        canvas.addEventListener('click', () => {
            if (isRunning) flap();
        });

        startBtn.addEventListener('click', () => {
            startGame();
        });

        function startGame() {
            resetGame();
            isRunning = true;
            overlay.classList.add('hidden');
            requestAnimationFrame(gameLoop);
        }

        // Ölüm Sesi Efekti
        const deathSound = new Audio('gameover.m4a');
        deathSound.preload = 'auto';

        function gameOver() {
            isRunning = false;
            
            // Ölüm sesini çal
            try {
                deathSound.currentTime = 0;
                deathSound.play().catch(e => console.log("Ses oynatma hatası:", e));
            } catch (err) {
                console.log("Ses hatası:", err);
            }

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('zahideBirdHighScore', highScore);
                highScoreEl.innerText = highScore;
            }
            overlayTitle.innerText = "Oyun Bitti! 💥";
            overlayDesc.innerText = `Skorun: ${score} | En Yüksek: ${highScore}`;
            startBtn.innerText = "Tekrar Oyna";
            overlay.classList.remove('hidden');
        }

        function update() {
            frames++;

            // Oyuncu ilk defa Space'e basana / tıklayana kadar havada tatlı tatlı süzülsün (Asla düşmez!)
            if (!hasPlayerFirstFlapped) {
                bird.y = 280 + Math.sin(frames * 0.06) * 6;
                bird.velocity = 0;
                return;
            }

            // Kuş fiziği (Yerçekimi ve maksimum hız limiti)
            bird.velocity += bird.gravity;
            if (bird.velocity > bird.maxDropSpeed) {
                bird.velocity = bird.maxDropSpeed; // Hızlı düşüşü önleyen kilit!
            }
            bird.y += bird.velocity;

            // Zemin ve Tavan çarpışması (Zemin payı: 35px)
            if (bird.y + bird.radius >= canvas.height - 35) {
                bird.y = canvas.height - 35 - bird.radius;
                gameOver();
                return;
            }
            if (bird.y - bird.radius <= 0) {
                bird.y = bird.radius;
                bird.velocity = 0;
            }

            // Boru üretimi (Daha geniş zaman aralığı: her 140 karede bir)
            if (frames % 140 === 0) {
                const minPipeHeight = 50;
                const maxPipeHeight = canvas.height - pipeGap - 110;
                const topPipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
                pipes.push({
                    x: canvas.width,
                    top: topPipeHeight,
                    bottom: topPipeHeight + pipeGap,
                    passed: false
                });
            }

            // Boruların hareketi ve çarpışma kontrolü
            for (let i = pipes.length - 1; i >= 0; i--) {
                const p = pipes[i];
                p.x -= pipeSpeed;

                // Skor kazanma
                if (!p.passed && p.x + pipeWidth < bird.x) {
                    score++;
                    p.passed = true;
                    currentScoreEl.innerText = score;
                }

                // Çarpışma algılama (Kuş için hafif toleranslı hitbox)
                const hitboxRadius = bird.radius * 0.85; 
                const birdLeft = bird.x - hitboxRadius;
                const birdRight = bird.x + hitboxRadius;
                const birdTop = bird.y - hitboxRadius;
                const birdBottom = bird.y + hitboxRadius;

                if (birdRight > p.x && birdLeft < p.x + pipeWidth) {
                    if (birdTop < p.top || birdBottom > p.bottom) {
                        gameOver();
                        return;
                    }
                }

                // Ekrandan çıkan boruyu sil
                if (p.x + pipeWidth < 0) {
                    pipes.splice(i, 1);
                }
            }
        }

        function draw() {
            // Gökyüzü arka planı
            ctx.fillStyle = '#70c5ce';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bulutlar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.arc(100, 80, 30, 0, Math.PI * 2);
            ctx.arc(140, 75, 40, 0, Math.PI * 2);
            ctx.arc(180, 80, 30, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(380, 130, 25, 0, Math.PI * 2);
            ctx.arc(415, 125, 35, 0, Math.PI * 2);
            ctx.arc(450, 130, 25, 0, Math.PI * 2);
            ctx.fill();

            // Boruları Çiz (Lacivert & Bordo detaylı)
            pipes.forEach(p => {
                // Üst boru
                ctx.fillStyle = '#12234e';
                ctx.fillRect(p.x, 0, pipeWidth, p.top);
                ctx.fillStyle = '#7b1129';
                ctx.fillRect(p.x - 3, p.top - 18, pipeWidth + 6, 18);

                // Alt boru
                ctx.fillStyle = '#12234e';
                ctx.fillRect(p.x, p.bottom, pipeWidth, canvas.height - p.bottom - 35);
                ctx.fillStyle = '#7b1129';
                ctx.fillRect(p.x - 3, p.bottom, pipeWidth + 6, 18);
            });

            // Zemin (Toprak / Çim)
            ctx.fillStyle = '#deb887';
            ctx.fillRect(0, canvas.height - 35, canvas.width, 35);
            ctx.fillStyle = '#2d6a4f';
            ctx.fillRect(0, canvas.height - 35, canvas.width, 10);

            // Kuşu veya Seçilen Resmi Çiz
            ctx.save();
            ctx.translate(bird.x, bird.y);
            const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 3.5) * (Math.PI / 180)));
            ctx.rotate(angle);

            if (isUsingCustomImage && customBirdImage) {
                // Özel Resmi Yüz Odaklı ve Kare Orantıyla Daire Maskesi İçine Çiz
                const size = bird.displaySize;
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                ctx.clip();

                // Görselin en-boy oranını koruyarak (aspect-fill) yüzü ortala
                const imgW = customBirdImage.width || 100;
                const imgH = customBirdImage.height || 100;
                const minSide = Math.min(imgW, imgH);
                // Dikey fotoğrafta yüz genellikle üst-orta kısımda yer alır
                const cropX = (imgW - minSide) / 2;
                const cropY = Math.max(0, (imgH - minSide) * 0.35); // Yüze denk gelen nokta

                ctx.drawImage(
                    customBirdImage,
                    cropX, cropY, minSide, minSide, // Kaynak alan (Kırpma)
                    -size / 2, -size / 2, size, size // Çizim alanı
                );
                ctx.restore();

                // Çerçeve (Bordo şık halka)
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#7b1129';
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Standart Sevimli Kuş Karakteri
                ctx.fillStyle = '#ffd166';
                ctx.beginPath();
                ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = '#c47d00';
                ctx.stroke();

                // Bordo Kanat
                ctx.fillStyle = '#7b1129';
                ctx.beginPath();
                ctx.ellipse(-6, 3, 10, 6, Math.PI / 6, 0, Math.PI * 2);
                ctx.fill();

                // Göz
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(8, -6, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#1e293b';
                ctx.beginPath();
                ctx.arc(9, -6, 3, 0, Math.PI * 2);
                ctx.fill();

                // Gaga
                ctx.fillStyle = '#e63946';
                ctx.beginPath();
                ctx.moveTo(14, -3);
                ctx.lineTo(25, 2);
                ctx.lineTo(14, 7);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }

        function gameLoop() {
            if (!isRunning) return;
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        // İlk durağan çizim
        draw();
    }
});
