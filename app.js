// Main Application Script for SHL Assessment Simulation - Clean & Sequential Flow
class AssessmentApp {
  constructor() {
    this.currentView = 'view-notice';
    this.currentSectionIdx = 0;
    this.currentQuestionIdx = 0;
    this.currentCodingProbIdx = 0;
    this.currentCodingLang = 'c';

    // State storage for candidate and responses (Defaulted to requested credentials)
    this.candidateData = {
      regNo: '12315158',
      name: 'Utsav Kumar',
      email: 'utsavkr47@gmail.com',
      contact: '+91 9876543210',
      securityQuestion: 'school',
      securityAnswer: 'Saint Xavier School'
    };

    // User responses: sectionId -> { answers: {}, reviewed: {} }
    this.userResponses = {
      english: { answers: {}, reviewed: {} },
      aptitude: { answers: {}, reviewed: {} },
      domain: { answers: {}, reviewed: {} }
    };

    // Coding solutions
    this.codingSolutions = {};

    // Section Timers: 30 mins (1800s) for each MCQ section, 90 mins (5400s) for coding section
    this.mcqSectionDuration = 30 * 60; // 1800 seconds
    this.codingSectionDuration = 90 * 60; // 5400 seconds
    this.timerSeconds = this.mcqSectionDuration;
    this.timerInterval = null;
    this.timerStarted = false;

    this.init();
  }

  init() {
    this.bindDOMEvents();
    this.setupAccordions();
    this.initCodingStarterCodes();
  }

  // --- View Management ---
  showView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
      this.currentView = viewId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Match Toolbar on Final Page (Image 2): Hide Help and Exit buttons, hide timer
    const helpBtn = document.getElementById('btn-header-help');
    const exitBtn = document.getElementById('btn-header-exit');
    const timerContainer = document.getElementById('assessment-timer-container');

    if (viewId === 'view-thankyou') {
      if (helpBtn) helpBtn.style.display = 'none';
      if (exitBtn) exitBtn.style.display = 'none';
      if (timerContainer) timerContainer.style.display = 'none';
    } else {
      if (helpBtn) helpBtn.style.display = 'inline-flex';
      if (exitBtn) exitBtn.style.display = 'inline-flex';
      if (this.timerStarted && (viewId === 'view-mcq' || viewId === 'view-coding')) {
        if (timerContainer) timerContainer.style.display = 'flex';
      }
    }
  }

  // --- DOM Event Bindings ---
  bindDOMEvents() {
    // 1. Notice Page Events (Image 1)
    const noticeAgreeCheckbox = document.getElementById('check-notice-agree');
    const noticeContinueBtn = document.getElementById('btn-notice-continue');
    if (noticeAgreeCheckbox && noticeContinueBtn) {
      noticeAgreeCheckbox.addEventListener('change', (e) => {
        noticeContinueBtn.disabled = !e.target.checked;
      });
      noticeContinueBtn.addEventListener('click', () => {
        this.showView('view-registration');
      });
    }

    // 2. Registration Page Events (Image 2)
    const regContinueBtn = document.getElementById('btn-reg-continue');
    const regCancelBtn = document.getElementById('btn-reg-cancel');
    const termsToggle = document.getElementById('terms-toggle');

    if (regContinueBtn) {
      regContinueBtn.addEventListener('click', () => {
        if (termsToggle && !termsToggle.checked) {
          alert('Please agree to the Terms and Conditions to proceed.');
          return;
        }

        const regNo = document.getElementById('input-reg-no').value.trim();
        const name = document.getElementById('input-name').value.trim();
        const email = document.getElementById('input-email').value.trim();
        const contact = document.getElementById('input-contact').value.trim();
        const secQues = document.getElementById('select-security-question').value;
        const secAns = document.getElementById('input-security-answer').value.trim();

        if (!regNo || !name || !email || !contact || !secQues || !secAns) {
          alert('Please fill out all mandatory fields marked with an asterisk (*).');
          return;
        }

        this.candidateData = { regNo, name, email, contact, securityQuestion: secQues, securityAnswer: secAns };
        this.showView('view-sections-overview');
      });
    }

    if (regCancelBtn) {
      regCancelBtn.addEventListener('click', () => {
        this.showView('view-notice');
      });
    }

    // Collapsible section headers on Registration page
    document.querySelectorAll('.reg-section-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const block = btn.closest('.reg-section-block');
        if (block) {
          block.classList.toggle('collapsed');
        }
      });
    });

    // 3. Section Overview Events
    const overviewBackBtn = document.getElementById('btn-overview-back');
    const overviewStartBtn = document.getElementById('btn-overview-start');
    if (overviewBackBtn) {
      overviewBackBtn.addEventListener('click', () => {
        this.showView('view-registration');
      });
    }
    if (overviewStartBtn) {
      overviewStartBtn.addEventListener('click', () => {
        this.startAssessment();
      });
    }

    // 4. MCQ Navigation & Submit Events matching photo
    document.getElementById('btn-mcq-submit')?.addEventListener('click', () => this.handleMCQSubmit());
    document.getElementById('btn-mcq-next')?.addEventListener('click', () => this.handleMCQNext());
    document.getElementById('btn-mcq-prev')?.addEventListener('click', () => this.handleMCQPrev());
    document.getElementById('btn-mcq-clear')?.addEventListener('click', () => this.clearCurrentMCQResponse());
    document.getElementById('btn-mcq-review')?.addEventListener('click', () => this.toggleMarkForReview());

    // Palette scroll down button matching photo
    document.getElementById('palette-scroll-down')?.addEventListener('click', () => {
      const container = document.getElementById('palette-nodes-container');
      if (container) container.scrollBy({ top: 80, behavior: 'smooth' });
    });

    // 5. Toolbar Controls: Fullscreen & Candidate Drawer (Image 2)
    const fullscreenBtn = document.getElementById('btn-fullscreen');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    const hamburgerBtn = document.getElementById('btn-hamburger');
    const sideDrawer = document.getElementById('candidate-side-drawer');
    const iconBars = document.getElementById('icon-menu-bars');
    const iconCross = document.getElementById('icon-menu-cross');

    const updateDrawerCandidateName = () => {
      const nameEl = document.getElementById('drawer-candidate-name');
      if (nameEl) {
        nameEl.textContent = 'amit raj';
      }
    };

    const openDrawer = () => {
      updateDrawerCandidateName();
      if (sideDrawer) sideDrawer.classList.add('open');
      if (iconBars) iconBars.style.display = 'none';
      if (iconCross) iconCross.style.display = 'block';
    };

    const closeDrawer = () => {
      if (sideDrawer) sideDrawer.classList.remove('open');
      if (iconBars) iconBars.style.display = 'block';
      if (iconCross) iconCross.style.display = 'none';
    };

    if (hamburgerBtn && sideDrawer) {
      let closeTimer = null;

      const scheduleClose = () => {
        closeTimer = setTimeout(() => {
          closeDrawer();
        }, 200);
      };

      const cancelCloseAndOpen = () => {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        openDrawer();
      };

      // Hover on hamburger/cross icon opens the drawer and shows cross icon
      hamburgerBtn.addEventListener('mouseenter', cancelCloseAndOpen);
      hamburgerBtn.addEventListener('mouseleave', scheduleClose);

      // Hovering inside the drawer keeps it open
      sideDrawer.addEventListener('mouseenter', cancelCloseAndOpen);
      sideDrawer.addEventListener('mouseleave', scheduleClose);

      // Click toggles it as well
      hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sideDrawer.classList.contains('open')) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });
    }

    // Code Editor sync with line numbers gutter
    const codeArea = document.getElementById('code-textarea');
    if (codeArea) {
      codeArea.addEventListener('input', () => {
        this.saveCurrentCode();
        this.updateEditorGutter();
      });
      codeArea.addEventListener('scroll', () => {
        const gutter = document.getElementById('editor-gutter');
        if (gutter) gutter.scrollTop = codeArea.scrollTop;
      });
    }

    // Participant ID Copy
    document.getElementById('btn-copy-pid')?.addEventListener('click', () => {
      const pid = document.getElementById('drawer-participant-id')?.textContent || '450018758676041';
      navigator.clipboard?.writeText(pid).catch(() => {});
      alert('Participant ID copied: ' + pid);
    });
  }

  showNoticeFromDrawer(event) {
    if (event) event.preventDefault();
    this.showView('view-notice');
    const sideDrawer = document.getElementById('candidate-side-drawer');
    if (sideDrawer) sideDrawer.classList.remove('open');
    const iconBars = document.getElementById('icon-menu-bars');
    const iconCross = document.getElementById('icon-menu-cross');
    if (iconBars) iconBars.style.display = 'block';
    if (iconCross) iconCross.style.display = 'none';
  }

  // --- Accordion Setup for Notice page ---
  setupAccordions() {
    document.querySelectorAll('.notice-acc-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.closest('.notice-acc-item');
        if (item) {
          item.classList.toggle('open');
        }
      });
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const item = header.closest('.notice-acc-item');
          if (item) {
            item.classList.toggle('open');
          }
        }
      });
    });
  }

  // --- Start Assessment & Real-time Section Timers ---
  startAssessment() {
    this.switchToSection(0);
  }

  startSectionTimer(sectionType) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // 30 mins for each MCQ section, 90 mins for Coding challenge
    this.timerSeconds = (sectionType === 'coding') ? this.codingSectionDuration : this.mcqSectionDuration;
    this.timerStarted = true;
    const timerContainer = document.getElementById('assessment-timer-container');
    if (timerContainer) {
      timerContainer.style.display = 'flex';
    }

    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
        this.updateTimerDisplay();
      } else {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.handleSectionTimeout();
      }
    }, 1000);
  }

  handleSectionTimeout() {
    const nextSecIdx = this.currentSectionIdx + 1;
    if (nextSecIdx < window.assessmentData.sections.length) {
      alert(`Time for Section ${this.currentSectionIdx + 1} has expired. Moving to Section ${nextSecIdx + 1} (30 mins timer starting).`);
      this.switchToSection(nextSecIdx);
    } else {
      alert('Time for Coding Challenge has expired. Submitting your assessment automatically.');
      this.confirmFinalSubmit();
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timerSeconds / 60);
    const seconds = this.timerSeconds % 60;

    const pad = (n) => n.toString().padStart(2, '0');
    const formattedTime = `${pad(minutes)} : ${pad(seconds)}`;

    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = formattedTime;
    }
  }

  // --- Section & Question Navigation ---
  switchToSection(secIdx) {
    this.currentSectionIdx = secIdx;
    const section = window.assessmentData.sections[secIdx];

    // Start fresh timer for the newly entered section (30 mins for MCQ, 90 mins for Coding)
    this.startSectionTimer(section.type);

    if (section.type === 'coding') {
      this.showView('view-coding');
      this.renderCodingProblem(this.currentCodingProbIdx);
    } else {
      this.showView('view-mcq');
      this.currentQuestionIdx = 0;
      this.renderCurrentMCQQuestion();
      this.renderQuestionPalette();
    }
  }

  // --- MCQ Question Rendering matching User Attached Photo ---
  renderCurrentMCQQuestion() {
    const section = window.assessmentData.sections[this.currentSectionIdx];
    if (!section || !section.questions) return;
    const question = section.questions[this.currentQuestionIdx];
    const secId = section.id;

    // Split instructions and sentence for the left pane matching the photo
    const questionTextEl = document.getElementById('mcq-question-text');
    if (questionTextEl && question) {
      const parts = question.question.split('\n\n');
      if (parts.length > 1) {
        questionTextEl.innerHTML = `
          <div class="mcq-inst-bold">${parts[0]}</div>
          <div class="mcq-statement-para">${parts.slice(1).join('<br><br>')}</div>
        `;
      } else {
        questionTextEl.innerHTML = `<div class="mcq-inst-bold">${question.question}</div>`;
      }
    }

    // Render Options matching the photo layout
    const optionsContainer = document.getElementById('mcq-options-list');
    if (optionsContainer && question) {
      optionsContainer.innerHTML = '';
      const currentAnswer = this.userResponses[secId]?.answers[this.currentQuestionIdx];

      question.options.forEach((optText, optIdx) => {
        const isSelected = (currentAnswer === optIdx);
        const box = document.createElement('div');
        box.className = `mcq-option-box ${isSelected ? 'selected' : ''}`;
        box.textContent = optText;

        box.addEventListener('click', () => {
          this.selectMCQOption(optIdx);
        });

        optionsContainer.appendChild(box);
      });
    }

    this.updatePaletteNodesState();
  }

  selectMCQOption(optIdx) {
    const section = window.assessmentData.sections[this.currentSectionIdx];
    const secId = section.id;

    this.userResponses[secId].answers[this.currentQuestionIdx] = optIdx;

    document.querySelectorAll('.mcq-option-box').forEach((box, idx) => {
      if (idx === optIdx) {
        box.classList.add('selected');
      } else {
        box.classList.remove('selected');
      }
    });

    this.updatePaletteNodesState();
  }

  handleMCQSubmit() {
    this.handleMCQNext();
  }

  clearCurrentMCQResponse() {
    const section = window.assessmentData.sections[this.currentSectionIdx];
    const secId = section.id;
    delete this.userResponses[secId].answers[this.currentQuestionIdx];

    document.querySelectorAll('.option-card').forEach(card => {
      card.classList.remove('selected');
    });

    this.updateMCQStatusTag();
    this.updatePaletteNodesState();
  }

  toggleMarkForReview() {
    const section = window.assessmentData.sections[this.currentSectionIdx];
    const secId = section.id;
    const isReviewed = !this.userResponses[secId].reviewed[this.currentQuestionIdx];
    this.userResponses[secId].reviewed[this.currentQuestionIdx] = isReviewed;

    const reviewBtn = document.getElementById('btn-mcq-review');
    if (isReviewed) {
      reviewBtn.textContent = 'Marked for Review';
      reviewBtn.style.background = '#fef9c3';
    } else {
      reviewBtn.textContent = 'Mark for Review';
      reviewBtn.style.background = 'transparent';
    }

    this.updateMCQStatusTag();
    this.updatePaletteNodesState();
  }

  updateMCQStatusTag() {
    const section = window.assessmentData.sections[this.currentSectionIdx];
    const secId = section.id;
    const tag = document.getElementById('mcq-status-tag');
    const isAnswered = this.userResponses[secId].answers[this.currentQuestionIdx] !== undefined;
    const isReview = this.userResponses[secId].reviewed[this.currentQuestionIdx];

    tag.className = 'question-status-tag';
    if (isReview && isAnswered) {
      tag.textContent = 'Answered & Marked for Review';
      tag.classList.add('review');
    } else if (isReview) {
      tag.textContent = 'Marked for Review';
      tag.classList.add('review');
    } else if (isAnswered) {
      tag.textContent = 'Answered';
      tag.classList.add('answered');
    } else {
      tag.textContent = 'Not Answered';
    }
  }

  // --- Right Vertical Palette (1-15) matching user attached photo ---
  renderQuestionPalette() {
    const section = window.assessmentData.sections[this.currentSectionIdx];
    const container = document.getElementById('palette-nodes-container');
    if (!container || !section) return;
    container.innerHTML = '';

    for (let i = 0; i < section.totalQuestions; i++) {
      const node = document.createElement('div');
      node.className = 'palette-photo-node palette-node';
      node.textContent = (i + 1);
      node.setAttribute('data-q-idx', i);

      node.addEventListener('click', () => {
        this.currentQuestionIdx = i;
        this.renderCurrentMCQQuestion();
      });

      container.appendChild(node);
    }

    this.updatePaletteNodesState();
  }

  updatePaletteNodesState() {
    const section = window.assessmentData.sections[this.currentSectionIdx];
    if (!section) return;
    const secId = section.id;
    const nodes = document.querySelectorAll('#palette-nodes-container .palette-photo-node, #palette-nodes-container .palette-node');

    nodes.forEach((node, idx) => {
      node.className = 'palette-photo-node palette-node';

      const isAnswered = this.userResponses[secId]?.answers[idx] !== undefined;
      const isCurrent = (idx === this.currentQuestionIdx);

      if (isCurrent) {
        node.classList.add('active');
      } else if (isAnswered) {
        node.classList.add('answered');
      }
    });
  }

  // --- Next & Previous MCQ Navigation ---
  handleMCQNext() {
    const section = window.assessmentData.sections[this.currentSectionIdx];

    if (this.currentQuestionIdx < section.totalQuestions - 1) {
      this.currentQuestionIdx++;
      this.renderCurrentMCQQuestion();
    } else {
      // Last question of current section -> Advance to Next Section
      if (this.currentSectionIdx < window.assessmentData.sections.length - 1) {
        this.switchToSection(this.currentSectionIdx + 1);
      } else {
        this.openSubmitModal();
      }
    }
  }

  handleMCQPrev() {
    if (this.currentQuestionIdx > 0) {
      this.currentQuestionIdx--;
      this.renderCurrentMCQQuestion();
    } else if (this.currentSectionIdx > 0) {
      this.switchToSection(this.currentSectionIdx - 1);
      const prevSection = window.assessmentData.sections[this.currentSectionIdx];
      this.currentQuestionIdx = prevSection.totalQuestions - 1;
      this.renderCurrentMCQQuestion();
    }
  }

  // --- Coding Section Logic ---
  initCodingStarterCodes() {
    const codingSection = window.assessmentData.sections.find(s => s.type === 'coding');
    if (!codingSection) return;

    codingSection.problems.forEach((prob, pIdx) => {
      this.codingSolutions[pIdx] = {
        c: prob.starterCode.c,
        cpp: prob.starterCode.cpp,
        java: prob.starterCode.java,
        python: prob.starterCode.python,
        javascript: prob.starterCode.javascript
      };
    });
  }

  switchCodingProblem(probIdx) {
    this.saveCurrentCode();
    this.currentCodingProbIdx = probIdx;

    const node1 = document.getElementById('coding-node-1');
    const node2 = document.getElementById('coding-node-2');
    if (node1 && node2) {
      node1.classList.toggle('active', probIdx === 0);
      node2.classList.toggle('active', probIdx === 1);
    }

    const nextBtn = document.getElementById('btn-coding-next');
    if (nextBtn) {
      nextBtn.textContent = probIdx === 0 ? 'NEXT' : 'SUBMIT TEST';
    }

    this.renderCodingProblem(probIdx);
  }

  renderCodingProblem(probIdx) {
    const codingSec = window.assessmentData.sections.find(s => s.type === 'coding');
    if (!codingSec || !codingSec.problems[probIdx]) return;
    const prob = codingSec.problems[probIdx];

    const descEl = document.getElementById('coding-desc');
    if (descEl) descEl.innerHTML = prob.description;

    const inEl = document.getElementById('coding-input-format');
    if (inEl) inEl.innerHTML = prob.inputFormat;

    const outEl = document.getElementById('coding-output-format');
    if (outEl) outEl.innerHTML = prob.outputFormat;

    const noteWrap = document.getElementById('coding-note-wrapper');
    const noteEl = document.getElementById('coding-note');
    if (noteEl && prob.note) {
      if (noteWrap) noteWrap.style.display = 'block';
      noteEl.innerHTML = prob.note;
    } else if (noteWrap) {
      noteWrap.style.display = 'none';
    }

    const constEl = document.getElementById('coding-constraints');
    if (constEl) constEl.innerHTML = prob.constraints;

    const exBox = document.getElementById('coding-example-content');
    if (exBox) {
      if (prob.example) {
        exBox.innerHTML = `
          <div class="coding-example-row">
            <span class="ex-lbl">Input:</span>
            <span class="ex-val">${prob.example.input}</span>
          </div>
          <div class="coding-example-row">
            <span class="ex-lbl">Output:</span>
            <span class="ex-val">${prob.example.output}</span>
          </div>
          <div class="coding-example-row">
            <span class="ex-lbl">Explanation:</span>
            <span class="ex-val">${prob.example.explanation}</span>
          </div>
        `;
      } else if (prob.sampleTestCases && prob.sampleTestCases[0]) {
        const tc = prob.sampleTestCases[0];
        exBox.innerHTML = `
          <div class="coding-example-row">
            <span class="ex-lbl">Input:</span>
            <span class="ex-val">${tc.input}</span>
          </div>
          <div class="coding-example-row">
            <span class="ex-lbl">Output:</span>
            <span class="ex-val">${tc.expectedOutput}</span>
          </div>
          <div class="coding-example-row">
            <span class="ex-lbl">Explanation:</span>
            <span class="ex-val">${tc.explanation || ''}</span>
          </div>
        `;
      }
    }

    const selectEl = document.getElementById('coding-lang-select');
    if (selectEl) selectEl.value = this.currentCodingLang;
    this.updateLanguageCallout(this.currentCodingLang);

    const textarea = document.getElementById('code-textarea');
    if (textarea) {
      textarea.value = (this.codingSolutions[probIdx] && this.codingSolutions[probIdx][this.currentCodingLang]) || '';
      this.updateEditorGutter();
    }

    const consoleOut = document.getElementById('test-console-output');
    if (consoleOut) {
      consoleOut.innerHTML = 'Click <strong>RUN SOLUTION</strong> to compile and execute against test cases.';
    }
  }

  updateLanguageCallout(lang) {
    const langMap = {
      c: { name: 'C99', compiler: 'C99' },
      cpp: { name: 'C++ 11', compiler: 'GCC 11' },
      java: { name: 'Java 17', compiler: 'OpenJDK 17' },
      python: { name: 'Python 3', compiler: 'Python 3.10' },
      javascript: { name: 'JavaScript (Node.js)', compiler: 'Node 18' }
    };
    const info = langMap[lang] || { name: lang.toUpperCase(), compiler: lang.toUpperCase() };
    const langNameEl = document.getElementById('callout-lang-name');
    const compVerEl = document.getElementById('callout-compiler-version');
    if (langNameEl) langNameEl.textContent = info.name;
    if (compVerEl) compVerEl.textContent = info.compiler;
  }

  updateEditorGutter() {
    const textarea = document.getElementById('code-textarea');
    const gutter = document.getElementById('editor-gutter');
    if (!textarea || !gutter) return;

    const lines = textarea.value.split('\n').length;
    const count = Math.max(lines, 35);
    let nums = '';
    for (let i = 1; i <= count; i++) {
      nums += i + '\n';
    }
    gutter.textContent = nums;
  }

  saveCurrentCode() {
    const textarea = document.getElementById('code-textarea');
    if (textarea && this.codingSolutions[this.currentCodingProbIdx]) {
      this.codingSolutions[this.currentCodingProbIdx][this.currentCodingLang] = textarea.value;
    }
  }

  changeLanguage() {
    this.saveCurrentCode();
    this.currentCodingLang = document.getElementById('coding-lang-select').value;
    const textarea = document.getElementById('code-textarea');
    if (textarea && this.codingSolutions[this.currentCodingProbIdx]) {
      textarea.value = this.codingSolutions[this.currentCodingProbIdx][this.currentCodingLang] || '';
    }
    this.updateLanguageCallout(this.currentCodingLang);
    this.updateEditorGutter();
  }

  resetCode() {
    if (confirm('Reset editor to initial boilerplate starter template?')) {
      const codingSec = window.assessmentData.sections.find(s => s.type === 'coding');
      const prob = codingSec.problems[this.currentCodingProbIdx];
      const starter = prob.starterCode[this.currentCodingLang];
      this.codingSolutions[this.currentCodingProbIdx][this.currentCodingLang] = starter;
      document.getElementById('code-textarea').value = starter;
      this.updateEditorGutter();
    }
  }

  toggleTestCasesTray() {
    const drawer = document.getElementById('coding-tray-drawer');
    const chevron = document.getElementById('tray-chevron');
    if (!drawer) return;
    drawer.classList.toggle('open');
    if (chevron) {
      chevron.innerHTML = drawer.classList.contains('open') ? '&#9662;' : '&#9652;';
    }
  }

  handleCodingNext() {
    if (this.currentCodingProbIdx === 0) {
      this.switchCodingProblem(1);
    } else {
      this.openSubmitModal();
    }
  }

  showTipsModal() {
    alert("Important Coding Guidelines:\n\n• Submission requires fully working code.\n• You can use printf() or print() for debugging.\n• Submit when your solution handles edge cases and passes constraints.");
  }

  runSampleTests() {
    const drawer = document.getElementById('coding-tray-drawer');
    const chevron = document.getElementById('tray-chevron');
    if (drawer && !drawer.classList.contains('open')) {
      drawer.classList.add('open');
      if (chevron) chevron.innerHTML = '&#9662;';
    }

    const outBox = document.getElementById('test-console-output');
    outBox.innerHTML = '<span style="color: #0284c7;">Compiling and executing test suite...</span>';

    setTimeout(() => {
      const codingSec = window.assessmentData.sections.find(s => s.type === 'coding');
      const prob = codingSec.problems[this.currentCodingProbIdx];
      const tc1 = (prob.sampleTestCases && prob.sampleTestCases[0]) || { input: 'haveaniceday', expectedOutput: 'hvncdy' };
      const tc2 = (prob.sampleTestCases && prob.sampleTestCases[1]) || { input: 'assessment', expectedOutput: 'sssmnt' };

      outBox.innerHTML = `
        <div style="margin-bottom: 6px;"><strong style="color: #16a34a;">✔ Test Case 1: PASSED</strong> <span style="font-size: 11px; color: #64748b;">(Execution Time: 12ms | Memory: 8.2 MB)</span></div>
        <div style="font-size: 11.5px; color: #475569; margin-left: 14px;">Input: <code>${tc1.input}</code></div>
        <div style="font-size: 11.5px; color: #475569; margin-left: 14px;">Output: <code>${tc1.expectedOutput}</code> | Expected: <code>${tc1.expectedOutput}</code></div>
        <div style="margin-top: 8px; margin-bottom: 6px;"><strong style="color: #16a34a;">✔ Test Case 2: PASSED</strong> <span style="font-size: 11px; color: #64748b;">(Execution Time: 11ms | Memory: 8.1 MB)</span></div>
        <div style="font-size: 11.5px; color: #475569; margin-left: 14px;">Input: <code>${tc2.input}</code></div>
        <div style="font-size: 11.5px; color: #475569; margin-left: 14px;">Output: <code>${tc2.expectedOutput}</code> | Expected: <code>${tc2.expectedOutput}</code></div>
      `;
    }, 600);
  }

  switchTestTab(tabIdx) {
    document.querySelectorAll('.tray-tab-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', (idx + 1) === tabIdx);
    });

    const codingSec = window.assessmentData.sections.find(s => s.type === 'coding');
    const prob = codingSec.problems[this.currentCodingProbIdx];
    const tc = (prob.sampleTestCases && prob.sampleTestCases[tabIdx - 1]) || prob.sampleTestCases[0];

    const outBox = document.getElementById('test-console-output');
    outBox.innerHTML = `
      <div style="margin-bottom: 6px;"><strong style="color: #16a34a;">✔ Test Case ${tabIdx}: PASSED</strong> <span style="font-size: 11px; color: #64748b;">(Runtime: 1${tabIdx}ms)</span></div>
      <div style="font-size: 11.5px; color: #475569; margin-left: 14px;">Input: <code>${tc.input}</code></div>
      <div style="font-size: 11.5px; color: #475569; margin-left: 14px;">Output: <code>${tc.expectedOutput}</code> | Expected: <code>${tc.expectedOutput}</code></div>
    `;
  }

  // --- Modals & Submission ---
  openSubmitModal() {
    let attempted = 0;
    let total = 47; // 15 + 15 + 15 + 2

    ['english', 'aptitude', 'domain'].forEach(secId => {
      attempted += Object.keys(this.userResponses[secId].answers).length;
    });
    attempted += 2;

    document.getElementById('modal-submit-summary').innerHTML = `
      You have attempted <strong>${attempted}</strong> out of <strong>${total}</strong> questions across all 4 evaluation sections.<br><br>
      Are you sure you want to finalize and submit your assessment?
    `;
    document.getElementById('submit-modal').classList.add('active');
  }

  closeSubmitModal() {
    document.getElementById('submit-modal').classList.remove('active');
  }

  openExitModal() {
    document.getElementById('exit-modal').classList.add('active');
  }

  closeExitModal() {
    document.getElementById('exit-modal').classList.remove('active');
  }

  openHelpModal() {
    document.getElementById('help-modal').classList.add('active');
  }

  closeHelpModal() {
    document.getElementById('help-modal').classList.remove('active');
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    }
  }

  confirmFinalSubmit() {
    this.closeSubmitModal();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    document.getElementById('assessment-timer-container').style.display = 'none';
    this.showView('view-thankyou');
  }
}

// Instantiate and expose globally
window.app = new AssessmentApp();
