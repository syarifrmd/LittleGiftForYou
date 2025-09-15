// Basic interactions and animations
(function(){
  const envelope = document.getElementById('envelope');
  const envelopeFlap = document.getElementById('envelopeFlap');
  const openBtn = document.getElementById('openBtn');
  const gridSection = document.getElementById('grid-section');
  const envelopeSection = document.getElementById('envelope-section');
  const splashBtn = document.getElementById('splashBtn');
  const splashSection = document.getElementById('splash-section');
  const nextBtn = document.getElementById('nextBtn');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const bgMusic = document.getElementById('bg-music');
  const audioToggle = document.getElementById('audioToggle');
  const presplash = document.getElementById('presplash');
  let musicStarted = false;

  // Envelope opening
  function openEnvelope(){
    if(!envelope || !envelopeFlap) return;
    // Animate flap and reveal grid
    gsap.to(envelopeFlap, {duration:0.7, rotateX: -180, transformOrigin:'top', ease:'power2.inOut'});
    gsap.to(envelope, {duration:0.5, y:-10, yoyo:true, repeat:1});
    setTimeout(()=>{
      if(envelopeSection){
        envelopeSection.classList.add('hidden');
        envelopeSection.setAttribute('aria-hidden','true');
      }
      if(gridSection){
        gridSection.classList.remove('hidden');
        gridSection.setAttribute('aria-hidden','false');
        // init 3D carousel
        const stage = document.getElementById('carouselStage');
        const cells = stage ? Array.from(stage.querySelectorAll('.carousel3d__cell')) : [];
        const prevBtn = document.getElementById('prev3d');
        const nextBtn = document.getElementById('next3d');
        const cellCount = cells.length;
        let selectedIndex = 0;
        const rotateFn = 'rotateY';
        const theta = 360 / Math.max(cellCount,1);
        const cellSize = stage ? stage.clientWidth : 300;
        const radius = cellSize / 2 / Math.tan(Math.PI / cellCount);

        function setupCells(){
          cells.forEach((cell, i)=>{
            const angle = theta * i;
            cell.style.transform = `${rotateFn}(${angle}deg) translateZ(${radius}px)`;
          });
        }

        function rotateCarousel(){
          const angle = theta * selectedIndex * -1;
          stage && (stage.style.transform = `translateZ(-${radius}px) ${rotateFn}(${angle}deg)`);
        }

        setupCells();
        rotateCarousel();
        prevBtn && prevBtn.addEventListener('click', ()=>{ selectedIndex--; rotateCarousel(); });
        nextBtn && nextBtn.addEventListener('click', ()=>{ selectedIndex++; rotateCarousel(); });
        // entrance animation
        gsap.fromTo('#carousel3d', {opacity:0, y:12}, {opacity:1, y:0, duration:0.6, ease:'power2.out'});
      }
    }, 650);
  }

  if(openBtn){
    openBtn.addEventListener('click', openEnvelope);
  }
  if(envelope){
    envelope.addEventListener('click', (e)=>{
      if(e.target && (e.target.id === 'openBtn' || e.currentTarget === e.target || e.target.classList.contains('envelope__flap'))){
        openEnvelope();
      }
    });
  }

  // Splash / trumpet
  async function doSplash(){
    if(!splashSection) return;
    splashSection.classList.remove('hidden');
    splashSection.setAttribute('aria-hidden','false');

    // play confetti burst
    try{
      const confetti = window.confetti || (await import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.module.mjs')).default;
      const rect = splashSection.getBoundingClientRect();

      const fire = (particleRatio, opts) => confetti(Object.assign({
        spread: 60,
        ticks: 90,
        gravity: 1,
        decay: 0.92,
        scalar: 1,
        origin: { x: 0.5, y: 0.3 }
      }, opts, { particleCount: Math.floor(200 * particleRatio) }));

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      // floating hearts
      const hearts = document.querySelector('.floating-hearts');
      if(hearts){
        for(let i=0;i<18;i++){
          const span = document.createElement('span');
          span.textContent = ['❤','💙','💖','💘'][i%4];
          span.style.position = 'absolute';
          span.style.left = Math.random()*100 + '%';
          span.style.bottom = '-10%';
          span.style.fontSize = (16 + Math.random()*20) + 'px';
          span.style.opacity = '0.8';
          hearts.appendChild(span);
          const dur = 3 + Math.random()*3;
          gsap.to(span, {y: -window.innerHeight*0.8, duration: dur, ease:'sine.inOut', rotation: (Math.random()*60-30)});
          gsap.to(span, {opacity:0, duration:0.5, delay:dur-0.5, onComplete(){span.remove();}});
        }
      }
    }catch(err){
      console.warn('confetti failed', err);
    }
  }

  if(splashBtn){
    splashBtn.addEventListener('click', doSplash);
  }

  if(nextBtn){
    nextBtn.addEventListener('click', ()=>{
      window.location.href = './gallery.html';
    });
  }

  // Gallery page dynamic image injection
  document.addEventListener('DOMContentLoaded', ()=>{
    const masonry = document.getElementById('masonry');
    if(!masonry) return;

    // Declare images list from workspace. Prefer JPGs for web; keep HEIC as non-critical entries.
    const images = [
      'Images/20250703_131732.jpg',
      'Images/20250727_160944.jpg',
      'Images/20250823_220415.jpg',
      'Images/20250905_144412.jpg',
      'Images/20250905_151055.jpg',
      'Images/20250905_151118.jpg',
    ];

    images.forEach(src=>{
      const item = document.createElement('figure');
      item.className = 'mitem';

      // Use picture for basic future-proofing; HEIC likely won't show.
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = 'memori kita';
      img.src = src;

      picture.appendChild(img);
      item.appendChild(picture);
      masonry.appendChild(item);
    });

    // small fade-in
    gsap.fromTo('.mitem', {opacity:0, y:10}, {opacity:1, y:0, duration:0.5, stagger:0.05, ease:'power2.out'});
  });

  // Try to resume/unmute music on first user interaction
  const startMusic = async ()=>{
    if(!bgMusic) return;
    if(musicStarted) return; // prevent double
    try{
      bgMusic.muted = false;
      if(bgMusic.paused) await bgMusic.play();
      musicStarted = true;
      if(audioToggle){
        audioToggle.hidden = false;
        audioToggle.textContent = '🔊';
      }
    }catch(e){ /* autoplay policies may block until interaction */ }
  };
  window.addEventListener('pointerdown', startMusic, {capture:true, once:true});
  window.addEventListener('touchstart', startMusic, {capture:true, once:true});
  window.addEventListener('click', startMusic, {capture:true, once:true});

  if(audioToggle && bgMusic){
    audioToggle.hidden = false;
    audioToggle.addEventListener('click', async ()=>{
      try{
        if(bgMusic.paused){
          bgMusic.muted = false;
          await bgMusic.play();
          audioToggle.textContent = '🔊';
        }else{
          bgMusic.pause();
          audioToggle.textContent = '🔇';
        }
      }catch(e){/* ignore */}
    });
  }

  // Pre-splash sequence: 3 slides then reveal main content
  (function setupPreSplash(){
    if(!presplash) return;
    const slide1 = presplash.querySelector('.slide1');
    const slide2 = presplash.querySelector('.slide2');
    const slide3 = presplash.querySelector('.slide3');

  const playMusicIfPossible = startMusic;

    // Kick off music ASAP during splash 1
    setTimeout(playMusicIfPossible, 300);

    const next = (from, to)=>{
      if(from){ from.classList.add('hidden'); }
      if(to){ to.classList.remove('hidden'); }
    };

    // Timings (mobile friendly)
    setTimeout(()=> next(slide1, slide2), 3000);
    setTimeout(()=> next(slide2, slide3), 6000);
    setTimeout(()=>{
      presplash.remove();
      // reveal the rest naturally
    }, 8000);

    // Also advance on tap (user can skip faster)
    presplash.addEventListener('click', async ()=>{
  await startMusic();
      if(!slide2.classList.contains('hidden')){ // currently on slide2 -> go slide3
        next(slide2, slide3);
      } else if(!slide1.classList.contains('hidden')){ // on slide1 -> slide2
        next(slide1, slide2);
      } else { // on slide3 -> finish
        presplash.remove();
      }
    });
  })();
})();
