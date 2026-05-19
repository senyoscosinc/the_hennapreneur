/* ============================================
   THE HENNAPRENEUR - Animations
   ============================================ */

// ============ LOADING PAGE ANIMATION ============
document.addEventListener('DOMContentLoaded', () => {
  const loadingContainer = document.querySelector('.loading-container');
  if (loadingContainer) {
    initializeLoadingPage();
  }
});

function initializeLoadingPage() {
  const typingText = document.getElementById('typingText');
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');

  const fullText = 'The Hennapreneur';
  const duration = 5000; // 5 seconds total
  const startTime = Date.now();
  const typingCompletePercent = 70; // Full text appears by 70%

  function animateLoading() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / duration) * 100, 100);

    // Update progress bar
    if (progressFill) progressFill.style.width = progress + '%';
    if (progressText) progressText.textContent = Math.floor(progress) + '%';

    // Complete typing by 40% progress
    const typingThreshold = typingCompletePercent / 100;
    const displayedText = progress >= typingCompletePercent 
      ? fullText 
      : fullText.substring(0, Math.floor((progress / typingCompletePercent) * fullText.length));
    
    typingText.innerHTML = displayedText + '<span class="typing-cursor">|</span>';

    if (progress < 100) {
      requestAnimationFrame(animateLoading);
    } else {
      // Ensure full text is displayed
      typingText.innerHTML = fullText + '<span class="typing-cursor">|</span>';
      // Redirect to home page
      setTimeout(() => {
        window.location.href = './pages/home.html';
      }, 500);
    }
  }

  animateLoading();
}

// ============ PAGE ANIMATIONS ============
function animateElementsOnScroll() {
  const elements = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', animateElementsOnScroll);
} else {
  animateElementsOnScroll();
}

// ============ CARD ANIMATIONS ============
function addHoverAnimations() {
  const cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    card.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-5px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
}

document.addEventListener('DOMContentLoaded', addHoverAnimations);

// ============ PARALLAX EFFECT ============
function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  window.addEventListener('scroll', () => {
    parallaxElements.forEach(el => {
      const scrollPosition = window.scrollY;
      const speed = el.getAttribute('data-parallax') || 0.5;
      el.style.transform = `translateY(${scrollPosition * speed}px)`;
    });
  });
}

document.addEventListener('DOMContentLoaded', initParallax);
