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

  // Configuration for prompt enhancement
  const promptEnhancementConfig = {
    maxBaseLength: 150,
    trendsRefreshInterval: 86400000, // 24 hours in milliseconds
    promptPatterns: {
      trending: [
        "Explain like I'm five: {topic}",
        "Create a step-by-step guide for {topic}",
        "Compare and contrast {topic} with {related_topic}",
        "What if {hypothetical_scenario} happened with {topic}?"
      ],
      effective: [
        "{action_verb} {specific_task} for {target_audience}",
        "Design a {timeframe} plan for {goal} without {common_obstacle}",
        "Generate {number} unique approaches to solve {problem}"
      ]
    }
  };

  // Fetch trending topics to incorporate into prompts
  async function fetchTrendingTopics() {
    try {
      // Replace with your actual trending topics API
      const response = await fetch('https://api.yourtrendingservice.com/topics');
      const data = await response.json();
      localStorage.setItem('trendingTopics', JSON.stringify(data));
      localStorage.setItem('trendsLastFetched', Date.now());
      return data;
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  // Enhance generated prompts
  function enhancePrompt(originalPrompt) {
    // Get trending topics or use cached ones
    let trendingTopics = [];
    const lastFetched = localStorage.getItem('trendsLastFetched');
    
    if (!lastFetched || Date.now() - lastFetched > promptEnhancementConfig.trendsRefreshInterval) {
      fetchTrendingTopics().then(topics => {
        trendingTopics = topics;
      });
    } else {
      trendingTopics = JSON.parse(localStorage.getItem('trendingTopics') || '[]');
    }
    
    // Core enhancement logic
    let enhancedPrompt = originalPrompt;
    
    // Make it more specific
    enhancedPrompt = makePromptSpecific(enhancedPrompt);
    
    // Add trending elements if appropriate
    if (shouldIncludeTrends(enhancedPrompt)) {
      enhancedPrompt = incorporateTrends(enhancedPrompt, trendingTopics);
    }
    
    // Optimize prompt length
    enhancedPrompt = optimizePromptLength(enhancedPrompt);
    
    return enhancedPrompt;
  }

  function makePromptSpecific(prompt) {
    // Replace vague terms with specific ones
    const vagueTerms = {
      'good': ['effective', 'high-quality', 'valuable'],
      'bad': ['ineffective', 'problematic', 'counterproductive'],
      'thing': ['component', 'element', 'factor'],
      'make': ['create', 'develop', 'produce', 'design']
    };
    
    let specificPrompt = prompt;
    
    Object.entries(vagueTerms).forEach(([vague, specific]) => {
      const regex = new RegExp(`\\b${vague}\\b`, 'gi');
      if (regex.test(specificPrompt)) {
        specificPrompt = specificPrompt.replace(regex, specific[Math.floor(Math.random() * specific.length)]);
      }
    });
    
    return specificPrompt;
  }

  function shouldIncludeTrends(prompt) {
    // Determine if this prompt would benefit from trending topics
    return !prompt.includes("historical") && 
           !prompt.includes("classic") && 
           prompt.length < 100;
  }

  function incorporateTrends(prompt, trendingTopics) {
    if (!trendingTopics.length) return prompt;
    
    // Select a trending topic relevant to the prompt
    const relevantTopic = trendingTopics.find(topic => 
      prompt.toLowerCase().includes(topic.category.toLowerCase())
    ) || trendingTopics[0];
    
    // Choose a trending pattern and apply it
    const patterns = promptEnhancementConfig.promptPatterns.trending;
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    return selectedPattern
      .replace('{topic}', prompt)
      .replace('{related_topic}', relevantTopic.name)
      .replace('{hypothetical_scenario}', getRandomScenario());
  }

  function optimizePromptLength(prompt) {
    if (prompt.length <= promptEnhancementConfig.maxBaseLength) return prompt;
    
    // Remove redundancies
    let optimized = prompt
      .replace(/\b(in order to|due to the fact that)\b/g, 'to')
      .replace(/\b(at this point in time)\b/g, 'now')
      .replace(/\b(for the purpose of)\b/g, 'for')
      .replace(/\b(in the event that)\b/g, 'if');
    
    // Truncate if still too long
    if (optimized.length > promptEnhancementConfig.maxBaseLength) {
      optimized = optimized.substring(0, promptEnhancementConfig.maxBaseLength) + '...';
    }
    
    return optimized;
  }

  // Add this where you process generated prompts
  function processAIResponse(response) {
    // Default to concise output
    let processedResponse = response.trim();
    
    // Determine if expanded response is needed based on complexity
    const needsExpansion = response.includes("complex") || 
                           response.includes("explain") || 
                           response.includes("detail");
    
    if (!needsExpansion && processedResponse.length > 150) {
      // Shorten response when possible
      processedResponse = processedResponse
        .split('. ')
        .slice(0, 2)
        .join('. ') + '.';
    }
    
    return processedResponse;
  }

  // Helpers
  function getRandomScenario() {
    const scenarios = [
      "sudden technological breakthrough",
      "global policy change",
      "unexpected discovery",
      "market disruption",
      "paradigm shift"
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
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
            content: `You are PROMPT ENGINEER GPT, the world's most skilled prompt engineer.

Your ONLY task is to craft a masterful prompt, NOT to answer the query directly.

When given an input idea, you will:
1. Transform it into a detailed, precise prompt that would get optimal results from an AI
2. Use prompt engineering best practices (specificity, context, constraints, examples when needed)
3. Structure the prompt with appropriate formatting (bullets, paragraphs, sections as needed)
4. Add specific instructions about desired format, style, length, and tone when relevant
5. NEVER provide the actual answer to the query - ONLY provide the optimized prompt
6. Use less symbols, marks, asterisks and other formatting unless necessary or needed strictly for the prompt.

Example: 
Input: "Tell me about Rome"
BAD OUTPUT: "Rome is the capital city of Italy with a rich history..."
GOOD OUTPUT: "Provide a comprehensive overview of Rome, Italy. Include its historical significance from founding to modern day, major architectural landmarks, cultural importance, and current role in global affairs. Structure the response with clear headings, beginning with a brief executive summary followed by chronological historical sections. Include specific dates and names of key historical figures."

Here is some more examples of how you will make prompts if the input includes image or Create an image, Remember, these are only examples and you should be inspired from these to develop a understanding and get intelligent in making image prompts:

Example: A stylized 3D chibi-style cute girl leans casually against a small three-dimensional name [your name]' designed in sleek black and red. She has long black hair and a playful smile. She is dressed in a maroon kurti with a printed dupatta, matching the exact outfit in the reference image, paired with black pants and high-heeled sandals. The background is a dark bedroom, enhancing the vibrant colors and cozy atmosphere of the scene.
Respond ONLY with the optimized prompt. No explanations, no commentary, no introductions.

Example: Create a stylized portrait of (image attached) in the artistic style of the Grand Theft Auto V loading screen. The person wears the same clothes as in the attached photo and wears a confident expression. Neon lights, palm trees and vintage movie signs make up the background. Include soft purple sunset lighting and a cinematic atmosphere. A shading of cartoon style and uncluttered contours, in the aesthetics of Rockstar Games illustrations.

Example: The image you provided shows a hand holding a photo frame that aligns perfectly with the background scene. Inside the frame, there is a digitally rendered cartoon-style girl in traditional Indian attire (teal dress with gold trim), styled with jewelry and a braid, sitting on a street ledge. The creative blend of real-world photography and animation makes it a charming and imaginative composition.

Example: Create a 1:1 poster of [product or brand name], where half of the product is photorealistic and the other half transforms into flat digital elements like UI fragments, abstract tech shapes, or minimal glitch effects.
Use bold double-exposure text that reflects the product’s identity, with clean minimal background matching the brand color.
The product should be fully visible in the center, uncut, with cinematic lighting, 3D style, and the brand logo placed professionally in the corner.

Example: Draw an action figure (Barbie-type doll) of the person in this photo. The figure must be full-body and in its original blister packaging. The name of the toy appears at the top of the box "add name" with the headline "headline" in a single line of text. On the blister packaging, next to the figure, show the toy's accessories, including - add accessories"

Example: Create an ultra-realistic close-up portrait in 9:16 of me (faceas per uploaded image) and anime character (naruto and family). All of us should make silly facial expressions. Background is an empty small living room with bright white finish. High angle view. Use an environmental extreme fisheye perspective to capture our entire bodies in motion.

Example: A top-down photo of two popular books, "[Book Title 1]" and "[Book Title 2]," placed side by side on a glass whiteboard. Hand-drawn arrows and thoughtful captions link the two books. Above them, include a powerful, insightful statement that reveals the shared concept or deeper theme they both explore. The covers should be clearly visible, with soft, natural lighting and a clean, professional look.

Example: A professional Panini-style photo of a soccer card featuring legend Lionel Messi wearing his iconic blue and white striped Argentina jersey. In a dramatic moment, Messi kicks the ball with force, breaking the boundaries of the card—making it explode into fragments. The card explodes into reality as Messi emerges from the 2D surface into the 3D world. In the foreground, a soccer ball spins at high speed, out of focus toward the viewer. The background shows the torn remains of the card against a dark backdrop, while aurora-like beams of light radiate from the torn card, creating a surreal and powerful dimensional crossing effect.

Example: Create a photorealistic scene of indore's Rajwada encapsulated inside a transparent pill capsule, placed on a cool beach. The capsule should have the name of the city Indore printed on it in clean, bold font. Inside the capsule, include detailed, miniature versions of Indore's rajwada. The capsule should be illuminated with soft, cinematic lighting that enhances the brand details. The background should feature a serene beach with soft waves, and the reflection of the capsule on the wet sand should be clearly visible, creating a dreamlike, imaginative atmosphere.

Example: Create an Image a cheerful 3D cartoon boy sitting on a colorful Instagram cube, wearing Dior t-shirt, Dior shorts, and Gucci sneakers, taking a selfie with an iPhone 14 Pro, with a giant smartphone screen behind him displaying his Instagram profile, realistic textures and vibrant lighting.

Example: Make 3D Chibi boy is Sitting on top of the letter 'Abhiiii' Cute Form blocky style in contrast with 'wine' background make it Stunning. Face is as per uploaded image, wearing same outfit and charming, cute, expressive.             
          }, {
            role: "user",
            content: `Create the most effective prompt for: ${idea}`
          }],
          temperature: 0.3,
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

  // Modified generate button handler to add comparison option after generation
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
      
      // Add compare button after generation is complete
      addCompareButton(idea, result);
      
    } catch (error) {
      loadingAnimation.classList.add('hidden');
      showToast('Error generating prompt. Please try again.');
      console.error('Generation error:', error);
    }
  });
  
  // Function to add the compare button
  function addCompareButton(originalPrompt, generatedPrompt) {
    // Remove existing compare button if present
    const existingBtn = document.getElementById('compare-btn');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    // Create and add the compare button directly next to the copy button
    const compareBtn = document.createElement('button');
    compareBtn.id = 'compare-btn';
    compareBtn.className = 'icon-btn';
    compareBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>';
    compareBtn.title = 'Compare Prompts';
    
    // Insert right after the copy button
    if (copyBtn && copyBtn.parentNode) {
      copyBtn.parentNode.insertBefore(compareBtn, copyBtn.nextSibling);
      
      // Add click event
      compareBtn.addEventListener('click', () => {
        comparePrompts(originalPrompt, generatedPrompt);
      });
    }
  }
  
  // Function to compare prompts
  function comparePrompts(originalPrompt, generatedPrompt) {
    showToast('Analyzing prompts...', 2000);
    
    setTimeout(() => {
      // Score both prompts
      const originalScore = calculatePromptScore(originalPrompt);
      const generatedScore = calculatePromptScore(generatedPrompt);
      
      // Calculate individual criteria scores on a 0-10 scale
      const originalCriteria = {
        clarity: Math.round(originalScore.breakdown.clarity / 10),
        specificity: Math.round(originalScore.breakdown.specificity / 10),
        relevance: Math.round(originalScore.breakdown.relevance / 10)
      };
      
      const generatedCriteria = {
        clarity: Math.round(generatedScore.breakdown.clarity / 10),
        specificity: Math.round(generatedScore.breakdown.specificity / 10),
        relevance: Math.round(generatedScore.breakdown.relevance / 10)
      };
      
      // Calculate total scores
      const originalTotal = originalCriteria.clarity + originalCriteria.specificity + originalCriteria.relevance;
      const generatedTotal = generatedCriteria.clarity + generatedCriteria.specificity + generatedCriteria.relevance;
      
      // Determine recommendation
      const recommendation = generatedTotal > originalTotal ? 'AI-Generated' : 'Original';
      
      // Reason for recommendation
      let reason = '';
      if (generatedTotal > originalTotal) {
        const strengths = [];
        if (generatedCriteria.clarity > originalCriteria.clarity) strengths.push('clearer');
        if (generatedCriteria.specificity > originalCriteria.specificity) strengths.push('more specific');
        if (generatedCriteria.relevance > originalCriteria.relevance) strengths.push('more relevant');
        
        reason = `The AI-generated prompt is ${strengths.join(', ')}, which will likely yield better results.`;
      } else if (originalTotal > generatedTotal) {
        const strengths = [];
        if (originalCriteria.clarity > generatedCriteria.clarity) strengths.push('clearer');
        if (originalCriteria.specificity > generatedCriteria.specificity) strengths.push('more specific');
        if (originalCriteria.relevance > generatedCriteria.relevance) strengths.push('more relevant');
        
        reason = `Your original prompt is ${strengths.join(', ')}, which will likely yield better results.`;
      } else {
        reason = 'Both prompts are equally effective. Choose based on your preference.';
      }
      
      // Display comparison
      displayComparisonResults(originalPrompt, generatedPrompt, originalCriteria, generatedCriteria, recommendation, reason);
    }, 1000);
  }
  
  // Update the calculatePromptScore function with more sophisticated metrics
  function calculatePromptScore(promptText) {
    const metrics = {
      precision: calculatePrecision(promptText),         // How specific and unambiguous 
      structure: calculateStructure(promptText),         // Organization and formatting
      context: calculateContext(promptText),             // Background information provided
      instruction: calculateInstruction(promptText),     // Clarity of requested action
      constraints: calculateConstraints(promptText)      // Limitations and requirements
    };
    
    // Calculate final score (weighted average)
    const totalScore = Math.round(
      (metrics.precision * 0.25) +
      (metrics.structure * 0.20) +
      (metrics.context * 0.15) +
      (metrics.instruction * 0.25) +
      (metrics.constraints * 0.15)
    );
    
    return {
      score: totalScore,
      breakdown: metrics
    };
  }

  // More detailed evaluation functions for each metric
  function calculatePrecision(text) {
    // Evaluate specificity and unambiguity
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    // Calculate precision based on specific terms, numerical data, etc.
    let score = 65; // Base score
    
    // Check for specific details
    if (/\d+/.test(text)) score += 5; // Contains numbers
    if (/\b(specifically|exactly|precisely|in particular|clearly defined)\b/i.test(text)) score += 8;
    if (/\b(avoid|do not|refrain from|exclude|must not)\b/i.test(text)) score += 7; // Negative constraints
    
    // Check for specificity markers
    const specificityMarkers = [
      /\b(detailed|specific|explicit|concrete|particular)\b/i,
      /\b(for example|such as|specifically|including|in particular)\b/i,
      /\b(exactly|precisely|only|exclusively)\b/i
    ];
    
    specificityMarkers.forEach(marker => {
      if (marker.test(text)) score += 5;
    });
    
    // Penalize vague language
    const vagueTerms = [
      /\b(maybe|perhaps|somehow|something|anything|whatever|sometime)\b/i,
      /\b(good|nice|great|interesting|cool)\b/i,
      /\b(stuff|things|aspects|details|features)\b/i
    ];
    
    vagueTerms.forEach(term => {
      if (term.test(text)) score -= 7;
    });
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  function calculateStructure(text) {
    // Evaluate organization and formatting
    let score = 70; // Base score
    
    // Check for structural elements
    if (/\d+\.\s/.test(text)) score += 10; // Numbered lists
    if (/\n-\s/.test(text)) score += 8; // Bullet points
    if (/\n\n/.test(text)) score += 5; // Paragraph breaks
    
    // Check for section headers
    if (/\b(introduction|background|context|summary|conclusion):/i.test(text)) score += 8;
    
    // Check for formatting instructions
    if (/\b(format|structure|organize|layout|presentation)\b/i.test(text)) score += 6;
    
    // Check for hierarchical organization
    const sections = text.split(/\n\s*\n/);
    if (sections.length >= 3) score += 5;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  function calculateContext(text) {
    // Evaluate background information
    let score = 60; // Base score
    
    // Check for context provision
    if (/\b(context|background|history|situation|scenario)\b/i.test(text)) score += 10;
    
    // Check for domain specification
    const domains = [
      /\b(scientific|academic|research|technical|educational)\b/i,
      /\b(business|professional|corporate|commercial|industry)\b/i,
      /\b(creative|artistic|narrative|storytelling|entertainment)\b/i,
      /\b(medical|healthcare|clinical|patient|treatment)\b/i,
      /\b(legal|regulatory|compliance|policy|governance)\b/i
    ];
    
    domains.forEach(domain => {
      if (domain.test(text)) score += 8;
    });
    
    // Check for audience specification
    if (/\b(audience|reader|user|viewer|customer|target)\b/i.test(text)) score += 8;
    
    // Check for purpose clarification
    if (/\b(purpose|goal|objective|aim|intended|meant to)\b/i.test(text)) score += 7;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  function calculateInstruction(text) {
    // Evaluate clarity of requested action
    let score = 65; // Base score
    
    // Check for clear action verbs
    const actionVerbs = [
      /\b(create|generate|produce|develop|write)\b/i,
      /\b(analyze|evaluate|assess|examine|investigate)\b/i,
      /\b(explain|describe|elaborate|clarify|illustrate)\b/i,
      /\b(compare|contrast|differentiate|distinguish|relate)\b/i,
      /\b(summarize|condense|distill|abbreviate|outline)\b/i
    ];
    
    let verbCount = 0;
    actionVerbs.forEach(verb => {
      if (verb.test(text)) {
        score += 5;
        verbCount++;
      }
    });
    
    // Bonus for beginning with a clear instruction
    if (actionVerbs.some(verb => new RegExp('^' + verb.source, 'i').test(text.trim()))) {
      score += 10;
    }
    
    // Check for output format specification
    if (/\b(format|structure|organize|layout|present)\b/i.test(text)) score += 7;
    
    // Check for clear task delineation
    if (/\b(task|assignment|job|request|instruction)\b/i.test(text)) score += 5;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  function calculateConstraints(text) {
    // Evaluate limitations and requirements
    let score = 50; // Base score
    
    // Check for explicit constraints
    if (/\b(must|should|need to|required to|have to)\b/i.test(text)) score += 10;
    if (/\b(limited to|maximum|minimum|at least|at most)\b/i.test(text)) score += 10;
    if (/\b(within|between|range|from|to)\b/i.test(text)) score += 5;
    
    // Check for quantitative constraints
    if (/\b(\d+\s*(words|characters|sentences|paragraphs|pages|sections))\b/i.test(text)) score += 15;
    
    // Check for qualitative constraints
    if (/\b(tone|style|voice|language|vocabulary)\b/i.test(text)) score += 8;
    if (/\b(formal|informal|technical|simple|complex|conversational|professional)\b/i.test(text)) score += 7;
    
    // Check for exclusion instructions
    if (/\b(avoid|do not|refrain from|exclude|omit)\b/i.test(text)) score += 10;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  // Update the displayComparisonResults function with a more premium design
  function displayComparisonResults(originalPrompt, generatedPrompt, originalCriteria, generatedCriteria, recommendation, reason) {
    // Create modal for comparison
    const modal = document.createElement('div');
    modal.className = 'modal comparison-modal premium-modal';
    
    // Calculate the total scores based on new metrics
    const originalScore = calculatePromptScore(originalPrompt);
    const generatedScore = calculatePromptScore(generatedPrompt);
    
    // Calculate individual criteria scores on a 0-100 scale
    const originalMetrics = originalScore.breakdown;
    const generatedMetrics = generatedScore.breakdown;
    
    // Calculate total scores
    const originalTotal = Math.round(Object.values(originalMetrics).reduce((sum, val) => sum + val, 0) / Object.keys(originalMetrics).length);
    const generatedTotal = Math.round(Object.values(generatedMetrics).reduce((sum, val) => sum + val, 0) / Object.keys(generatedMetrics).length);
    
    // Determine recommendation
    const betterOption = generatedTotal > originalTotal ? 'AI-Generated' : 'Original';
    const margin = Math.abs(generatedTotal - originalTotal);
    let confidenceLevel;
    
    if (margin > 15) confidenceLevel = 'High';
    else if (margin > 8) confidenceLevel = 'Medium';
    else confidenceLevel = 'Low';
    
    // Create strength indicators
    const getStrengths = (metrics1, metrics2) => {
      const strengths = [];
      Object.keys(metrics1).forEach(key => {
        if (metrics1[key] > metrics2[key] + 5) {
          strengths.push(key.charAt(0).toUpperCase() + key.slice(1));
        }
      });
      return strengths;
    };
    
    const originalStrengths = getStrengths(originalMetrics, generatedMetrics);
    const generatedStrengths = getStrengths(generatedMetrics, originalMetrics);
    
    // Get winner indicator
    const getWinner = (score1, score2) => {
      if (score1 > score2 + 3) return 'winner';
      return '';
    };
    
    // Create gauge indicator
    const createGaugeIndicator = (score) => {
      const percentage = score;
      let quality;
      
      if (percentage >= 85) quality = 'excellent';
      else if (percentage >= 70) quality = 'good';
      else if (percentage >= 50) quality = 'fair';
      else quality = 'poor';
      
      return `
        <div class="premium-progress-container">
          <div class="premium-progress ${quality}">
            <div class="premium-progress-fill" style="width: ${percentage}%"></div>
            <div class="premium-progress-value">${percentage}</div>
          </div>
          <div class="premium-progress-label ${quality}">${quality}</div>
        </div>
      `;
    };
    
    // Format criteria names for display
    const formatCriteriaName = (name) => {
      const names = {
        'precision': 'Precision & Specificity',
        'structure': 'Structure & Organization',
        'context': 'Context Provision',
        'instruction': 'Instruction Clarity',
        'constraints': 'Constraints & Guidelines'
      };
      return names[name] || name.charAt(0).toUpperCase() + name.slice(1);
    };
    
    modal.innerHTML = `
      <div class="modal-content glass-card premium-card">
        <div class="modal-header premium-header">
          <div class="premium-title">
            <h2>Expert Prompt Analysis</h2>
            <div class="premium-subtitle">Deep analysis based on 5 key metrics</div>
          </div>
          <button class="close-modal premium-close">&times;</button>
        </div>
        <div class="modal-body premium-body">
          <div class="simplified-comparison">
            <div class="premium-overview">
              <div class="premium-score-overview">
                <div class="premium-score-card ${getWinner(originalTotal, generatedTotal)}">
                  <div class="premium-score-title">Original</div>
                  ${createGaugeIndicator(originalTotal)}
                  <div class="premium-strengths">
                    ${originalStrengths.length > 0 ? 
                      `<div class="strengths-title">Key Strengths</div>
                       <ul class="premium-strength-list">
                        ${originalStrengths.map(s => `<li>${s}</li>`).join('')}
                       </ul>` : 
                      '<div class="no-strengths">No significant advantages</div>'}
                  </div>
                </div>
                
                <div class="premium-comparison-divider">
                  <div class="confidence-indicator ${confidenceLevel.toLowerCase()}">
                    <div class="confidence-label">Confidence</div>
                    <div class="confidence-level">${confidenceLevel}</div>
                    <div class="margin-difference">${margin}% difference</div>
                  </div>
                </div>
                
                <div class="premium-score-card ${getWinner(generatedTotal, originalTotal)}">
                  <div class="premium-score-title">AI-Generated</div>
                  ${createGaugeIndicator(generatedTotal)}
                  <div class="premium-strengths">
                    ${generatedStrengths.length > 0 ? 
                      `<div class="strengths-title">Key Strengths</div>
                       <ul class="premium-strength-list">
                        ${generatedStrengths.map(s => `<li>${s}</li>`).join('')}
                       </ul>` : 
                      '<div class="no-strengths">No significant advantages</div>'}
                  </div>
                </div>
              </div>
              
              <div class="premium-recommendation">
                <div class="recommendation-header">Expert Recommendation</div>
                <div class="recommendation-content ${betterOption === 'AI-Generated' ? 'ai' : 'original'}">
                  <div class="recommendation-icon">${betterOption === 'AI-Generated' ? '🤖' : '👤'}</div>
                  <div class="recommendation-details">
                    <div class="recommendation-choice"><strong>${betterOption}</strong> prompt is recommended</div>
                    <div class="recommendation-explanation">
                      ${betterOption === 'AI-Generated' ? 
                        `The AI-generated prompt ${confidenceLevel === 'High' ? 'significantly outperforms' : 'outperforms'} your original prompt, particularly in ${generatedStrengths.slice(0, 2).join(' and ')}. ${confidenceLevel === 'Low' ? 'However, the margin is slim and both are viable options.' : ''}` : 
                        `Your original prompt ${confidenceLevel === 'High' ? 'significantly outperforms' : 'outperforms'} the AI-generated version, particularly in ${originalStrengths.slice(0, 2).join(' and ')}. ${confidenceLevel === 'Low' ? 'However, the margin is slim and both are viable options.' : ''}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="premium-metrics-comparison">
              <div class="metrics-header">Detailed Metrics Comparison</div>
              <div class="metrics-content">
                <table class="metrics-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Original</th>
                      <th>AI-Generated</th>
                      <th>Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.keys(originalMetrics).map(key => {
                      const diff = generatedMetrics[key] - originalMetrics[key];
                      const winner = diff > 0 ? 'ai-win' : diff < 0 ? 'original-win' : '';
                      return `
                        <tr>
                          <td>${formatCriteriaName(key)}</td>
                          <td>
                            <div class="score-pill">
                              <div class="score-bar">
                                <div class="score-fill" style="width: ${originalMetrics[key]}%"></div>
                              </div>
                              <div class="score-value">${originalMetrics[key]}</div>
                            </div>
                          </td>
                          <td>
                            <div class="score-pill">
                              <div class="score-bar">
                                <div class="score-fill" style="width: ${generatedMetrics[key]}%"></div>
                              </div>
                              <div class="score-value">${generatedMetrics[key]}</div>
                            </div>
                          </td>
                          <td class="diff-cell ${winner}">
                            ${diff > 0 ? '+' : ''}${diff}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="premium-actions">
              <button class="premium-btn view-details-btn">View Prompt Text</button>
              <button class="premium-btn export-btn">Export Analysis</button>
            </div>
          </div>
          
          <div class="detailed-comparison hidden">
            <div class="comparison-prompts">
              <div class="prompt-container ${betterOption === 'Original' ? 'recommended' : ''}">
                <div class="prompt-header">
                  <h3>Original Prompt</h3>
                  ${betterOption === 'Original' ? '<span class="recommendation-chip">Recommended</span>' : ''}
                </div>
                <div class="prompt-content">${originalPrompt}</div>
              </div>
              <div class="prompt-container ${betterOption === 'AI-Generated' ? 'recommended' : ''}">
                <div class="prompt-header">
                  <h3>AI-Generated Prompt</h3>
                  ${betterOption === 'AI-Generated' ? '<span class="recommendation-chip">Recommended</span>' : ''}
                </div>
                <div class="prompt-content">${generatedPrompt}</div>
              </div>
            </div>
            
            <div class="back-to-summary">
              <button class="premium-btn back-summary-btn">← Back to Analysis</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle closing the modal
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', () => {
      modal.classList.add('fade-out');
      setTimeout(() => modal.remove(), 300);
    });
    
    // Toggle between summary and detailed view
    const viewDetailsBtn = modal.querySelector('.view-details-btn');
    const backSummaryBtn = modal.querySelector('.back-summary-btn');
    const simplifiedView = modal.querySelector('.simplified-comparison');
    const detailedView = modal.querySelector('.detailed-comparison');
    
    viewDetailsBtn.addEventListener('click', () => {
      simplifiedView.classList.add('hidden');
      detailedView.classList.remove('hidden');
    });
    
    backSummaryBtn.addEventListener('click', () => {
      simplifiedView.classList.remove('hidden');
      detailedView.classList.add('hidden');
    });
    
    // Handle export functionality
    const exportBtn = modal.querySelector('.export-btn');
    exportBtn.addEventListener('click', () => {
      const analysisData = {
        recommendation: betterOption,
        confidence: confidenceLevel,
        margin: margin,
        metrics: {
          original: originalMetrics,
          generated: generatedMetrics
        },
        strengths: {
          original: originalStrengths,
          generated: generatedStrengths
        }
      };
      
      // Convert to JSON
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysisData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "prompt_analysis.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      showToast('Analysis exported successfully');
    });
    
    // Animated entrance
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }

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
        '<script type="text/javascript">atOptions = {\'key\' : \'b45edc51a410bff54e36fd8f707bf4eb\',\'format\' : \'iframe\',\'height\' : 300,\'width\' : 160,\'params\' : {}};</script><script type="text/javascript" src="//www.highperformanceformat.com/b45edc51a410bff54e36fd8f707bf4eb/invoke.js"></script>',
        '<script type="text/javascript">atOptions = {\'key\' : \'b45edc51a410bff54e36fd8f707bf4eb\',\'format\' : \'iframe\',\'height\' : 300,\'width\' : 160,\'params\' : {}};</script><script type="text/javascript" src="//www.highperformanceformat.com/b45edc51a410bff54e36fd8f707bf4eb/invoke.js"></script>',
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

  // Prompt Scoring Feature
  function initPromptScoring() {
    // Create scoring button next to the generate button
    if (generateBtn && generateBtn.parentNode) {
      const scoreButton = document.createElement('button');
      scoreButton.id = 'score-btn';
      scoreButton.className = 'glow-btn score-button';
      scoreButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> <span>Score Prompt</span>';
      
      // Insert the button after the generate button
      generateBtn.parentNode.insertBefore(scoreButton, generateBtn.nextSibling);
      
      // Add event listener to the score button
      scoreButton.addEventListener('click', () => {
        const promptText = promptIdea.value.trim();
        if (promptText) {
          scorePrompt(promptText);
        } else {
          showToast('Please enter your idea first');
        }
      });
    }
  }

  function scorePrompt(promptText) {
    // Show loading indicator using existing toast
    showToast('Analyzing prompt...', 3000);
    
    // Simulate a delay for analysis
    setTimeout(() => {
      const score = calculatePromptScore(promptText);
      displayScoreResults(score);
    }, 800);
  }

  function displayScoreResults(scoreData) {
    // Create scoring modal
    const modal = document.createElement('div');
    modal.className = 'modal score-modal';
    modal.innerHTML = `
      <div class="modal-content glass-card">
        <div class="modal-header">
          <h2>Prompt Quality Score</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="score-overview">
            <div class="score-chart">
              <svg viewBox="0 0 100 100" class="score-circle">
                <circle cx="50" cy="50" r="45" fill="none" class="score-circle-bg"/>
                <circle cx="50" cy="50" r="45" fill="none" class="score-circle-progress" 
                        style="stroke-dasharray: ${scoreData.score * 2.83}, 283"/>
                <text x="50" y="55" text-anchor="middle" class="score-text">${scoreData.score}</text>
              </svg>
            </div>
            <div class="score-rating">
              ${getRatingText(scoreData.score)}
            </div>
          </div>
          <div class="score-breakdown">
            <h3>Score Breakdown</h3>
            <div class="breakdown-item">
              <div class="breakdown-label">Clarity</div>
              <div class="breakdown-bar">
                <div class="breakdown-progress" style="width: ${scoreData.breakdown.clarity}%"></div>
              </div>
              <div class="breakdown-value">${scoreData.breakdown.clarity}</div>
            </div>
            <div class="breakdown-item">
              <div class="breakdown-label">Specificity</div>
              <div class="breakdown-bar">
                <div class="breakdown-progress" style="width: ${scoreData.breakdown.specificity}%"></div>
              </div>
              <div class="breakdown-value">${scoreData.breakdown.specificity}</div>
            </div>
            <div class="breakdown-item">
              <div class="breakdown-label">Relevance</div>
              <div class="breakdown-bar">
                <div class="breakdown-progress" style="width: ${scoreData.breakdown.relevance}%"></div>
              </div>
              <div class="breakdown-value">${scoreData.breakdown.relevance}</div>
            </div>
            <div class="breakdown-item">
              <div class="breakdown-label">Effectiveness</div>
              <div class="breakdown-bar">
                <div class="breakdown-progress" style="width: ${scoreData.breakdown.effectiveness}%"></div>
              </div>
              <div class="breakdown-value">${scoreData.breakdown.effectiveness}</div>
            </div>
          </div>
          <div class="improvement-tips">
            <h3>Improvement Tips</h3>
            <ul>
              ${generateImprovementTips(scoreData).map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle closing the modal
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', () => {
      modal.classList.add('fade-out');
      setTimeout(() => modal.remove(), 300);
    });
    
    // Animated entrance
    setTimeout(() => modal.classList.add('show'), 10);
  }

  function getRatingText(score) {
    if (score >= 90) return '<span class="rating perfect">Perfect</span>';
    if (score >= 70) return '<span class="rating good">Good</span>';
    if (score >= 50) return '<span class="rating fair">Fair</span>';
    return '<span class="rating poor">Needs Improvement</span>';
  }

  function generateImprovementTips(scoreData) {
    const tips = [];
    
    if (scoreData.breakdown.clarity < 70) {
      tips.push('Improve clarity by using shorter sentences and simpler language.');
    }
    
    if (scoreData.breakdown.specificity < 70) {
      tips.push('Add more specific details, examples, or constraints to guide the AI.');
    }
    
    if (scoreData.breakdown.relevance < 70) {
      tips.push('Ensure your prompt clearly states the topic or domain of interest.');
    }
    
    if (scoreData.breakdown.effectiveness < 70) {
      tips.push('Structure your prompt as a clear instruction or question to improve effectiveness.');
    }
    
    if (tips.length === 0) {
      tips.push('Your prompt is well-crafted! For even better results, consider adding specific examples.');
    }
    
    return tips;
  }

  // Add SVG gradient definition for score circle
  const svgDefs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgDefs.id = "score-gradient-def";
  svgDefs.innerHTML = `
    <defs>
      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#a669ff" />
        <stop offset="100%" stop-color="#79e0ee" />
      </linearGradient>
    </defs>
  `;
  document.body.appendChild(svgDefs);
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
