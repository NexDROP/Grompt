document.addEventListener('DOMContentLoaded', () => {
  // Splash screen logic
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    // Create neural network background effect
    const neurons = document.querySelector('.splash-neurons');
    if (neurons) {
      const createNeurons = () => {
        // Create 20 connecting lines
        for (let i = 0; i < 20; i++) {
          const line = document.createElement('div');
          line.className = 'neuron-line';
          line.style.position = 'absolute';
          line.style.top = Math.random() * 100 + '%';
          line.style.left = Math.random() * 100 + '%';
          line.style.width = (Math.random() * 50 + 50) + 'px';
          line.style.height = '1px';
          line.style.background = 'linear-gradient(90deg, transparent, rgba(110, 86, 207, 0.3), transparent)';
          line.style.transform = `rotate(${Math.random() * 360}deg)`;
          line.style.opacity = 0;
          line.style.animation = `fadeIn 0.5s forwards ${Math.random() * 1 + 0.5}s`;
          neurons.appendChild(line);
        }
      };

      createNeurons();
    }

    // Hide splash screen after 3 seconds
    setTimeout(() => {
      splashScreen.style.opacity = '0';
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 500);
    }, 3000);

    // Detect if we should skip splash screen (e.g., return visitor)
    const hasVisitedBefore = localStorage.getItem('gromptVisited');
    if (hasVisitedBefore) {
      splashScreen.style.opacity = '0';
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 100);
    } else {
      localStorage.setItem('gromptVisited', 'true');
    }
  }

  // Initialize particles
  particlesJS('particles-js', {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: '#6e56cf' },
      shape: { type: 'circle' },
      opacity: { value: 0.3, random: true },
      size: { value: 3, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: '#a277ff',
        opacity: 0.2,
        width: 1
      },
      move: {
        enable: true,
        speed: 1,
        direction: 'none',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false
      }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: true, mode: 'grab' },
        onclick: { enable: true, mode: 'push' },
        resize: true
      },
      modes: {
        grab: { distance: 140, line_linked: { opacity: 0.5 } },
        push: { particles_nb: 4 }
      }
    }
  });

  // DOM elements
  const generateBtn = document.getElementById('generate-btn');
  const promptIdea = document.getElementById('prompt-idea');
  const outputSection = document.getElementById('output-section');
  const outputContent = document.getElementById('output-content');
  const loadingAnimation = document.getElementById('loading-animation');
  const copyBtn = document.getElementById('copy-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const historyPill = document.querySelector('.history-section .interactive-pill');

  // SVG gradient for logo
  const svgNS = "http://www.w3.org/2000/svg";
  const defs = document.createElementNS(svgNS, "defs");
  const gradient = document.createElementNS(svgNS, "linearGradient");
  gradient.setAttribute("id", "gradient");
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("y1", "0%");
  gradient.setAttribute("x2", "100%");
  gradient.setAttribute("y2", "100%");
  
  const stop1 = document.createElementNS(svgNS, "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#6e56cf");
  
  const stop2 = document.createElementNS(svgNS, "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", "#a277ff");
  
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  
  document.querySelector('.logo').appendChild(defs);

  // Load prompts from localStorage
  let savedPrompts = JSON.parse(localStorage.getItem('gromptHistory')) || [];

  // Show toast message
  function showToast(message, duration = 3000) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, duration);
  }

  // Typewriter effect
  function typewriterEffect(element, text, speed = 10) {
    let i = 0;
    element.textContent = '';
    return new Promise((resolve) => {
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          resolve();
        }
      }
      type();
    });
  }

  // Save prompt to history
  function savePrompt(input, output) {
    const promptData = {
      id: Date.now(),
      input,
      output,
      timestamp: new Date().toISOString()
    };
    
    savedPrompts.unshift(promptData);
    if (savedPrompts.length > 10) savedPrompts.pop();
    
    localStorage.setItem('gromptHistory', JSON.stringify(savedPrompts));
  }

  // Generate prompt using Groq API
  async function generatePrompt(idea) {
    const GROQ_API_KEY = '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';
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{
            role: "system",
            content: `You are an expert prompt engineer with deep understanding of AI capabilities and limitations. Analyze the given input and craft the most effective prompt that will yield optimal results.

Key principles:
- Understand the core intent and context
- Choose the most appropriate approach based on the specific need
- Use clear, precise language
- Include necessary context and constraints
- Output only the final prompt without any explanations or meta-commentary

Your expertise allows you to:
- Determine when to be highly technical vs conversational
- Decide when to include detailed parameters vs keeping it simple
- Adapt the tone and complexity to match the task
- Structure the prompt in the most effective way for that specific use case`
          }, {
            role: "user",
            content: `Create the most effective prompt for: ${idea}`
          }],
          temperature: 0.4,
          max_tokens: 5000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Details:', errorData);
        throw new Error(`API request failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  // Handle generate button click
  generateBtn.addEventListener('click', async () => {
    const idea = promptIdea.value.trim();
    
    if (!idea) {
      showToast('Please enter your idea first');
      return;
    }
    
    // Show loading animation
    loadingAnimation.classList.remove('hidden');
    outputSection.classList.add('hidden');
    
    try {
      const result = await generatePrompt(idea);
      
      // Hide loading, show output
      loadingAnimation.classList.add('hidden');
      outputSection.classList.remove('hidden');
      
      // Display with typewriter effect
      await typewriterEffect(outputContent, result, 5);
      
      // Save to history
      savePrompt(idea, result);
      
    } catch (error) {
      loadingAnimation.classList.add('hidden');
      showToast('Error generating prompt. Please try again.');
      console.error('Generation error:', error);
    }
  });

  // Copy button functionality
  copyBtn.addEventListener('click', () => {
    const textToCopy = outputContent.textContent;
    navigator.clipboard.writeText(textToCopy)
      .then(() => showToast('Prompt copied to clipboard!'))
      .catch(() => showToast('Failed to copy. Please try again.'));
  });

  // Add this HTML to your document body
  const modalHTML = `
  <div id="history-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Recent Prompts</h3>
        <button class="close-modal">×</button>
      </div>
      <div id="history-list"></div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Update the DOM elements
  const historyModal = document.getElementById('history-modal');
  const closeModal = document.querySelector('.close-modal');
  const historyList = document.getElementById('history-list');

  // Updated history pill functionality
  historyPill.addEventListener('click', () => {
    if (savedPrompts.length === 0) {
      showToast('No prompt history found');
      return;
    }
    
    // Clear existing history items
    historyList.innerHTML = '';
    
    // Add only the last 5 history items
    const recentPrompts = savedPrompts.slice(0, 5);
    
    recentPrompts.forEach(prompt => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const time = new Date(prompt.timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Preview text (first 80 characters)
      const previewText = prompt.output.length > 80 
        ? prompt.output.substring(0, 80) + '...' 
        : prompt.output;
      
      historyItem.innerHTML = `
        <div class="history-item-header">
          <div class="history-item-time">${time}</div>
          <div class="history-item-badge">AI Generated</div>
        </div>
        <div class="history-item-input">${prompt.input}</div>
        <div class="history-item-preview">${previewText}</div>
        <div class="history-item-actions">
          <button class="history-item-btn load">Use This Prompt</button>
        </div>
      `;
      
      // Add event listeners to buttons
      const loadBtn = historyItem.querySelector('.load');
      
      loadBtn.addEventListener('click', () => {
        promptIdea.value = prompt.input;
        outputContent.textContent = prompt.output;
        outputSection.classList.remove('hidden');
        historyModal.classList.remove('show');
        showToast('Prompt loaded from history');
      });
      
      historyList.appendChild(historyItem);
    });
    
    // Show modal with animation
    historyModal.classList.add('show');
  });

  // Updated close button functionality
  closeModal.addEventListener('click', () => {
    historyModal.classList.remove('show');
  });

  // Close when clicking outside
  historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) {
      historyModal.classList.remove('show');
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && historyModal.classList.contains('show')) {
      historyModal.classList.remove('show');
    }
  });

  // Add keyboard shortcut (Ctrl+Enter) to generate
  promptIdea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      generateBtn.click();
    }
  });

  // Update the tagline with the new message
  const tagline = document.querySelector('.tagline');
  if (tagline) {
    tagline.innerHTML = 'AI to ask AI';
  }
  
  // Update the logo gradient
  updateLogoGradient();

  // Update the logo text positioning
  const logoText = document.querySelector('.logo-text');
  if (logoText) {
    logoText.setAttribute('x', '75'); // Center point of the 150px width viewBox
    logoText.setAttribute('y', '30'); // Vertically centered
    logoText.setAttribute('text-anchor', 'middle'); // Center the text horizontally
    logoText.setAttribute('dominant-baseline', 'middle'); // Center the text vertically
  }

  // Instead, add this premium animation effect to textarea
  const addPremiumTextareaEffects = () => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    
    textarea.addEventListener('focus', () => {
      textarea.parentElement.classList.add('textarea-focused');
    });
    
    textarea.addEventListener('blur', () => {
      textarea.parentElement.classList.remove('textarea-focused');
    });
    
    // Add subtle animation to placeholder
    let placeholderText = textarea.placeholder;
    textarea.addEventListener('focus', () => {
      let i = 0;
      const typeEffect = setInterval(() => {
        if (i < placeholderText.length) {
          textarea.placeholder = placeholderText.substring(0, i + 1);
          i++;
        } else {
          clearInterval(typeEffect);
        }
      }, 30);
    });
    
    textarea.addEventListener('blur', () => {
      textarea.placeholder = placeholderText;
    });
  };

  // 2. FEATURE: Floating 3D elements that react to cursor
  const createFloatingElements = () => {
    const container = document.querySelector('.app-container');
    const numElements = 5;
    
    for (let i = 0; i < numElements; i++) {
      const element = document.createElement('div');
      element.className = 'floating-element';
      
      // Random size between 30px and 80px
      const size = Math.floor(Math.random() * 50) + 30;
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      
      // Random position
      element.style.left = `${Math.random() * 100}%`;
      element.style.top = `${Math.random() * 100}%`;
      
      // Random blur and opacity
      const blur = Math.floor(Math.random() * 5) + 2;
      const opacity = (Math.random() * 0.2) + 0.1;
      element.style.filter = `blur(${blur}px)`;
      element.style.opacity = opacity;
      
      // Random animation duration and delay
      const duration = (Math.random() * 10) + 15;
      const delay = Math.random() * 5;
      element.style.animationDuration = `${duration}s`;
      element.style.animationDelay = `${delay}s`;
      
      container.appendChild(element);
    }
    
    // Make floating elements react to cursor
    document.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX / window.innerWidth;
      const mouseY = e.clientY / window.innerHeight;
      
      document.querySelectorAll('.floating-element').forEach(el => {
        const moveX = (mouseX - 0.5) * 40;
        const moveY = (mouseY - 0.5) * 40;
        el.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${moveX}deg)`;
      });
    });
  };
  
  // 3. FEATURE: Interactive card tilt effect
  const createTiltEffect = () => {
    const cards = document.querySelectorAll('.glass-card');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xPercent = x / rect.width;
        const yPercent = y / rect.height;
        
        const rotateX = (0.5 - yPercent) * 8;
        const rotateY = (xPercent - 0.5) * 8;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });
  };
  
  // Initialize the features (remove cursor initialization)
  setTimeout(() => {
    createFloatingElements(); // Keep floating elements for premium feel
    createTiltEffect(); // Keep tilt effect for premium feel
    addPremiumTextareaEffects(); // Add new premium effects
    
    // Keep celebration animation
    generateBtn.addEventListener('click', () => {
      createConfetti();
    });
  }, 1000);
  
  // Celebration animation when prompt is generated
  const createConfetti = () => {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    const colors = ['#6e56cf', '#a277ff', '#9c5bff', '#7f4acf', '#5a38b5'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      
      // Random properties
      const size = Math.random() * 10 + 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      confetti.style.backgroundColor = color;
      
      // Random position
      confetti.style.left = `${Math.random() * 100}%`;
      
      // Random animation duration and delay
      const duration = Math.random() * 2 + 1;
      confetti.style.animationDuration = `${duration}s`;
      
      confettiContainer.appendChild(confetti);
    }
    
    // Remove after animation completes
    setTimeout(() => {
      confettiContainer.remove();
    }, 3000);
  };

  // Create and add the templates pill to the history section
  const historySection = document.querySelector('.history-section');
  const templatesPill = document.createElement('div');
  templatesPill.className = 'glass-pill interactive-pill templates-pill';
  templatesPill.innerHTML = `
    <span class="pill-icon">⚡</span>
    <span class="pill-text">Templates</span>
  `;
  historySection.appendChild(templatesPill);

  // Templates data structure
  const templates = [
    {
      id: 1,
      name: "Professional Email",
      category: "Business",
      description: "Formal and concise business email template",
      template: "Create a professional email to [recipient] regarding [topic]. The email should be concise, well-structured, and maintain a formal business tone. Include a clear subject line, appropriate greeting, brief introduction, main points, call to action, and professional closing."
    },
    {
      id: 2,
      name: "Creative Story",
      category: "Creative",
      description: "Engaging creative narrative with vivid details",
      template: "Write a creative short story set in [setting] featuring a character who [character trait/situation]. The story should include vivid sensory details, compelling dialogue, a clear narrative arc, and a thought-provoking ending. Focus on creating an immersive atmosphere and emotional resonance."
    },
    {
      id: 3,
      name: "Technical Documentation",
      category: "Technical",
      description: "Clear and structured technical documentation",
      template: "Create comprehensive technical documentation for [product/feature]. Include a clear overview, detailed functionality explanation, step-by-step usage instructions, code examples where appropriate, troubleshooting section, and relevant API references. The documentation should be well-structured, precise, and accessible to [target audience]."
    },
    {
      id: 4,
      name: "Social Media Campaign",
      category: "Marketing",
      description: "Engaging multi-platform social media content",
      template: "Develop a cohesive social media campaign for [brand/product] targeting [audience]. Include content tailored for Instagram, Twitter, Facebook, and LinkedIn. The campaign should have a consistent theme, compelling visuals, engaging copy, effective hashtags, and clear calls to action. Focus on driving [specific objective] while maintaining brand voice."
    },
    {
      id: 5,
      name: "Product Description",
      category: "E-commerce",
      description: "Compelling and detailed product description",
      template: "Write a compelling product description for [product name] that will be featured on an e-commerce website. Highlight the product's key features, unique selling points, materials/specifications, benefits to the user, and appropriate use cases. The description should be informative, persuasive, and optimized for SEO while maintaining an engaging tone that resonates with [target audience]."
    }
  ];

  // Add the templates modal HTML
  const templatesModalHTML = `
  <div id="templates-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Professional Templates</h3>
        <button class="close-modal templates-close">×</button>
      </div>
      <div class="templates-categories">
        <span class="template-category active" data-category="all">All</span>
        <span class="template-category" data-category="Business">Business</span>
        <span class="template-category" data-category="Creative">Creative</span>
        <span class="template-category" data-category="Technical">Technical</span>
        <span class="template-category" data-category="Marketing">Marketing</span>
      </div>
      <div id="templates-list"></div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', templatesModalHTML);

  // Get DOM elements for templates
  const templatesModal = document.getElementById('templates-modal');
  const closeTemplatesModal = document.querySelector('.templates-close');
  const templatesList = document.getElementById('templates-list');
  const templateCategories = document.querySelectorAll('.template-category');

  // Handle templates button click
  templatesPill.addEventListener('click', () => {
    renderTemplates('all');
    templatesModal.classList.add('show');
  });

  // Handle template categories
  templateCategories.forEach(category => {
    category.addEventListener('click', () => {
      templateCategories.forEach(c => c.classList.remove('active'));
      category.classList.add('active');
      const selectedCategory = category.getAttribute('data-category');
      renderTemplates(selectedCategory);
    });
  });

  // Render templates based on category
  function renderTemplates(category) {
    templatesList.innerHTML = '';
    
    const filteredTemplates = category === 'all' 
      ? templates 
      : templates.filter(t => t.category === category);
    
    filteredTemplates.forEach(template => {
      const templateItem = document.createElement('div');
      templateItem.className = 'template-item';
      
      templateItem.innerHTML = `
        <div class="template-header">
          <h4>${template.name}</h4>
          <span class="template-category-badge">${template.category}</span>
        </div>
        <p class="template-description">${template.description}</p>
        <button class="template-use-btn">Use Template</button>
      `;
      
      const useBtn = templateItem.querySelector('.template-use-btn');
      useBtn.addEventListener('click', () => {
        promptIdea.value = template.template;
        templatesModal.classList.remove('show');
        promptIdea.focus();
        
        // Highlight placeholders
        highlightPlaceholders();
        
        showToast('Template loaded');
      });
      
      templatesList.appendChild(templateItem);
    });
  }

  // Highlight placeholders in square brackets
  function highlightPlaceholders() {
    const text = promptIdea.value;
    const placeholderRegex = /\[(.*?)\]/g;
    
    if (placeholderRegex.test(text)) {
      // Create highlighted version for visual effect only
      showToast('Edit the highlighted placeholders', 5000);
      
      // Add class for animation
      promptIdea.classList.add('highlight-placeholders');
      
      // Remove the class after animation completes
      setTimeout(() => {
        promptIdea.classList.remove('highlight-placeholders');
      }, 3000);
    }
  }

  // Close templates modal
  closeTemplatesModal.addEventListener('click', () => {
    templatesModal.classList.remove('show');
  });

  // Close when clicking outside
  templatesModal.addEventListener('click', (e) => {
    if (e.target === templatesModal) {
      templatesModal.classList.remove('show');
    }
  });

  // Escape key to close templates modal too
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && templatesModal.classList.contains('show')) {
      templatesModal.classList.remove('show');
    }
  });

  // Device capability detection
  const deviceCapabilities = {
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    highDPI: window.devicePixelRatio > 1,
    lowMemory: navigator.deviceMemory && navigator.deviceMemory <= 4,
    isMobile: window.innerWidth <= 768 || ('ontouchstart' in window)
  };

  // Optimize particle system based on device capabilities
  function optimizeParticles() {
    let particleCount = 80; // Default
    
    if (deviceCapabilities.lowMemory) {
      particleCount = 40;
    } else if (window.innerWidth <= 768) {
      particleCount = 50;
    } else if (!deviceCapabilities.highDPI) {
      particleCount = 60;
    }

    return {
      particles: {
        number: { value: particleCount, density: { enable: true, value_area: 800 } },
        color: { value: '#6e56cf' },
        shape: { type: 'circle' },
        opacity: { value: 0.3, random: true },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#a277ff',
          opacity: 0.2,
          width: 1
        },
        move: {
          enable: true,
          speed: 1,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'grab' },
          onclick: { enable: true, mode: 'push' },
          resize: true
        },
        modes: {
          grab: { distance: 140, line_linked: { opacity: 0.5 } },
          push: { particles_nb: 4 }
        }
      }
    };
  }

  // Debounce function for performance
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Optimize textarea handling
  const optimizeTextarea = () => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    // Efficient input handling
    const handleInput = debounce(() => {
      const height = textarea.scrollHeight;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(height, 300)}px`;
    }, 100);

    textarea.addEventListener('input', handleInput);
  };

  // Optimize modal handling for touch devices
  const optimizeModals = () => {
    const modals = document.querySelectorAll('.modal');
    
    if (deviceCapabilities.touch) {
      modals.forEach(modal => {
        modal.addEventListener('touchmove', (e) => {
          if (e.target === modal) {
            e.preventDefault();
          }
        }, { passive: false });
      });
    }
  };

  // Optimize scroll performance
  const optimizeScroll = () => {
    const scrollableElements = document.querySelectorAll('.terminal-content, .modal-content');
    
    scrollableElements.forEach(element => {
      let ticking = false;
      
      element.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            // Handle scroll updates
            ticking = false;
          });
          ticking = true;
        }
      });
    });
  };

  // Handle orientation changes
  const handleOrientationChange = debounce(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }, 250);

  // Initialize optimizations
  function initOptimizations() {
    // Initialize particles with optimized config
    particlesJS('particles-js', optimizeParticles());

    // Apply device-specific optimizations
    optimizeTextarea();
    optimizeModals();
    optimizeScroll();

    // Handle orientation changes
    window.addEventListener('resize', handleOrientationChange);
    handleOrientationChange();

    // Disable hover effects on touch devices
    if (deviceCapabilities.touch) {
      document.body.classList.add('touch-device');
    }

    // Reduce animations if needed
    if (deviceCapabilities.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }

    // Disable animations on mobile
    if (deviceCapabilities.isMobile) {
      // Remove pulsing animations
      const logoGlow = document.querySelector('.logo-glow');
      if (logoGlow) {
        logoGlow.style.animation = 'none';
        logoGlow.style.opacity = '0.3';
        logoGlow.style.width = '180px';
        logoGlow.style.filter = 'blur(25px)';
      }

      // Disable floating elements
      const floatingElements = document.querySelectorAll('.floating-element');
      floatingElements.forEach(el => el.remove());

      // Disable card hover effects
      const cards = document.querySelectorAll('.glass-card');
      cards.forEach(card => {
        card.style.transform = 'none';
        card.style.transition = 'none';
      });
    }
  }

  // Initialize optimizations after a short delay
  setTimeout(initOptimizations, 100);

  // Cleanup function
  function cleanup() {
    window.removeEventListener('resize', handleOrientationChange);
  }

  // Cleanup on page unload
  window.addEventListener('unload', cleanup);

  // Ad System Implementation
  function initializeAdSystem() {
    // Ad slots configuration - removed rectangle entry
    const adSlots = {
      'ad-left-sky': {
        format: 'skyscraper',
        sizes: ['160x600'],
        rotation: 45000, // 45 seconds rotation
      },
      'ad-right-sky': {
        format: 'skyscraper',
        sizes: ['160x600'],
        rotation: 60000, // 60 seconds rotation
      }
      // Removed rectangle ad entry
    };

    // Adsterra ad codes (replace with your actual ad codes)
    const adsterraScripts = {
      'skyscraper': [
        '<script type="text/javascript">atOptions = { /* your Adsterra options for 160x600 */ }; document.write(\'<scr\' + \'ipt type="text/javascript" src="http://www.example.com/adsterra/skyscraper1.js"></scr\' + \'ipt>\');</script>',
        '<script type="text/javascript">atOptions = { /* your Adsterra options for 160x600 alt */ }; document.write(\'<scr\' + \'ipt type="text/javascript" src="http://www.example.com/adsterra/skyscraper2.js"></scr\' + \'ipt>\');</script>',
      ],
      'rectangle': [
        '<script type="text/javascript">atOptions = { /* your Adsterra options for 300x250 */ }; document.write(\'<scr\' + \'ipt type="text/javascript" src="http://www.example.com/adsterra/rectangle1.js"></scr\' + \'ipt>\');</script>',
        '<script type="text/javascript">atOptions = { /* your Adsterra options for 300x250 alt */ }; document.write(\'<scr\' + \'ipt type="text/javascript" src="http://www.example.com/adsterra/rectangle2.js"></scr\' + \'ipt>\');</script>',
      ],
      'leaderboard': [
        '<script type="text/javascript">atOptions = { /* your Adsterra options for 728x90 */ }; document.write(\'<scr\' + \'ipt type="text/javascript" src="http://www.example.com/adsterra/leaderboard1.js"></scr\' + \'ipt>\');</script>',
        '<script type="text/javascript">atOptions = { /* your Adsterra options for 728x90 alt */ }; document.write(\'<scr\' + \'ipt type="text/javascript" src="http://www.example.com/adsterra/leaderboard2.js"></scr\' + \'ipt>\');</script>',
      ]
    };

    // Current ad index for each slot
    const adIndices = {};
    
    // Load ad into slot
    function loadAd(slotId) {
      const slot = document.getElementById(slotId);
      if (!slot) return;
      
      const config = adSlots[slotId];
      
      // Initialize ad index for this slot if not exists
      if (typeof adIndices[slotId] === 'undefined') {
        adIndices[slotId] = 0;
      } else {
        // Increment index for rotation
        adIndices[slotId] = (adIndices[slotId] + 1) % adsterraScripts[config.format].length;
      }
      
      const adIndex = adIndices[slotId];
      const adHtml = adsterraScripts[config.format][adIndex];
      
      // Fade transition effect
      slot.style.opacity = 0;
      
      setTimeout(() => {
        // Clear previous ad
        slot.innerHTML = '';
        
        // Insert new ad
        const adWrapper = document.createElement('div');
        adWrapper.innerHTML = adHtml;
        slot.appendChild(adWrapper);
        
        // Fade in new ad
        slot.style.opacity = 1;
        
        // Schedule next rotation
        setTimeout(() => loadAd(slotId), config.rotation);
      }, 500);
    }
    
    // Initialize all ad slots
    Object.keys(adSlots).forEach(slotId => {
      // Check if the element exists (responsive layouts might hide some)
      if (document.getElementById(slotId)) {
        // Initial load with slight delay between slots
        setTimeout(() => loadAd(slotId), Math.random() * 1000);
      }
    });
    
    // Monitor viewport size for responsive ad adjustments
    window.addEventListener('resize', debounce(() => {
      // Adjust leaderboard ads for mobile
      const leaderboardAds = document.querySelectorAll('.ad-leaderboard');
      const isMobile = window.innerWidth <= 768;
      
      leaderboardAds.forEach(ad => {
        if (isMobile) {
          ad.style.width = '300px';
          ad.style.height = '250px';
        } else {
          ad.style.width = '728px';
          ad.style.height = '90px';
        }
      });
    }, 250));
  }

  // Initialize ads after page is fully loaded
  window.addEventListener('load', () => {
    // Delay ad loading to prioritize core app functions
    setTimeout(initializeAdSystem, 2000);
  });

  // Add this to implement ad dismissal feature
  function setupAdDismissal() {
    document.querySelectorAll('.ad-container').forEach(container => {
      const closeBtn = document.createElement('div');
      closeBtn.className = 'ad-close';
      closeBtn.textContent = 'X';
      container.appendChild(closeBtn);
      
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.style.display = 'none';
        
        // Re-display after 15 minutes
        setTimeout(() => {
          container.style.display = 'flex';
          loadAd(container.id);
        }, 15 * 60 * 1000);
      });
    });
  }
});

// Update the SVG gradient for a more premium look
const updateLogoGradient = () => {
  const gradient = document.querySelector('#gradient');
  if (!gradient) return;
  
  // Clear existing stops
  while (gradient.firstChild) {
    gradient.removeChild(gradient.firstChild);
  }
  
  // Create new premium gradient
  const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#8860ff");
  
  const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop2.setAttribute("offset", "40%");
  stop2.setAttribute("stop-color", "#6e56cf");
  
  const stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop3.setAttribute("offset", "100%");
  stop3.setAttribute("stop-color", "#ab67ff");
  
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  gradient.appendChild(stop3);
}; 
