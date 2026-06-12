"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadCloud, X } from "lucide-react";
import "./landing.css";

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCareersModalOpen, setIsCareersModalOpen] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Sticky navbar logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("visible");
            }, i * 50);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Counter animation on stats
  useEffect(() => {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = parseInt(el.getAttribute("data-target") || "0", 10);
            const suffix = el.getAttribute("data-suffix") || "";
            const prefix = el.getAttribute("data-prefix") || "";
            const duration = 1600;
            let startTime: number | null = null;

            const step = (now: number) => {
              if (!startTime) startTime = now;
              const progress = Math.min((now - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const value = Math.floor(eased * target);
              el.textContent = prefix + value + suffix;
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                el.textContent = prefix + target + suffix;
              }
            };
            requestAnimationFrame(step);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );

    const elements = document.querySelectorAll("[data-target]");
    elements.forEach((el) => counterObserver.observe(el));

    return () => counterObserver.disconnect();
  }, []);

  // Parallax effect on blobs
  useEffect(() => {
    const blobs = document.querySelectorAll(".blob");
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      blobs.forEach((blob, i) => {
        const factor = (i + 1) * 0.4;
        (blob as HTMLElement).style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle smooth scroll for anchor links
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const offset = 70;
        const top = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: "smooth" });
        setMobileMenuOpen(false);
      }
    }
  };

  const handleCareerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingForm(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formsubmit.co/ajax/info@innonsh.com", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Application submitted successfully! We will review and get back to you soon.");
        setResumeName("");
        setIsCareersModalOpen(false);
        form.reset();
      } else {
        alert("Failed to send application. Please try again.");
      }
    } catch (error) {
      alert("Error submitting. Please try later.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingContact(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formsubmit.co/ajax/info@innonsh.com", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Thank you! Your message has been sent successfully.");
        form.reset();
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      alert("Error sending message. Please try later.");
    } finally {
      setIsSubmittingContact(false);
    }
  };


  return (
    <div className="landing-page-wrapper">
      {/* ============ NAV ============ */}
      <nav className={`nav ${isScrolled ? "scrolled" : ""}`} id="nav">
        <div className="container nav-inner">
          <a href="#" className="logo" onClick={(e) => handleAnchorClick(e, "#")} aria-label="Innonsh TinySteps home">
            Innonsh TinySteps
          </a>
          <div className="nav-links">
            <a href="#features" onClick={(e) => handleAnchorClick(e, "#features")}>Features</a>
            <a href="#modules" onClick={(e) => handleAnchorClick(e, "#modules")}>Modules</a>
            <a href="#parents" onClick={(e) => handleAnchorClick(e, "#parents")}>For Parents</a>
            <a href="#impact" onClick={(e) => handleAnchorClick(e, "#impact")}>Impact</a>
            <a href="#contact" onClick={(e) => handleAnchorClick(e, "#contact")}>Contact</a>
          </div>
          <div className="nav-cta-wrap">
            <a href="#contact" onClick={(e) => handleAnchorClick(e, "#contact")} className="btn btn-secondary" style={{ padding: "8px 18px", border: "1.5px solid var(--ink)", background: "transparent", color: "var(--ink)" }}>
              Request for a Demo
            </a>
            <Link href="/login" className="btn btn-primary" style={{ padding: "8px 18px" }}>
              Sign Up <span className="btn-arrow">→</span>
            </Link>
            <button className="menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ============ MOBILE NAV DRAWER ============ */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? "open" : ""}`} onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 500 }}>Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} style={{ padding: "8px", color: "var(--ink-soft)" }}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mobile-menu-links">
            <a href="#features" onClick={(e) => handleAnchorClick(e, "#features")}>Features</a>
            <a href="#modules" onClick={(e) => handleAnchorClick(e, "#modules")}>Modules</a>
            <a href="#parents" onClick={(e) => handleAnchorClick(e, "#parents")}>For Parents</a>
            <a href="#impact" onClick={(e) => handleAnchorClick(e, "#impact")}>Impact</a>
            <a href="#contact" onClick={(e) => handleAnchorClick(e, "#contact")}>Contact</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "auto" }}>
            <a href="#contact" onClick={(e) => { setMobileMenuOpen(false); handleAnchorClick(e, "#contact"); }} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              Request for a Demo
            </a>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Sign Up <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <header className="hero">
        <div className="hero-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <div className="container hero-grid">
          <div className="hero-text">
            <span className="eyebrow">Made for preschools</span>
            <h1>
              Everything your preschool needs, <span className="serif-italic">in one warm little place.</span>
            </h1>
            <p className="hero-sub">
              Simple, friendly school management for students, teachers, parents, attendance, fees, and daily school life designed so you can spend less time on paperwork and more time with the children.
            </p>
            <div className="hero-actions">
              <Link href="/login" className="btn btn-primary">
                Sign Up <span className="btn-arrow">→</span>
              </Link>
              <a href="#contact" onClick={(e) => handleAnchorClick(e, "#contact")} className="btn btn-secondary">
                Request for a Demo
              </a>
            </div>
            <div className="hero-trust">
              <span className="hero-trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                No technical knowledge needed
              </span>
              <span className="hero-trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Setup help included
              </span>
              <span className="hero-trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Works on any device
              </span>
            </div>
          </div>

          <div className="hero-visual">
            {/* Floating mini card 1 */}
            <div className="float-card float-card-1">
              <div className="float-icon" style={{ background: "var(--sage)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Aanya is in class</div>
                <div style={{ color: "var(--ink-muted)", fontSize: "0.75rem" }}>Attendance marked · 9:02 AM</div>
              </div>
            </div>

            {/* Dashboard card */}
            <div className="dashboard-card">
              <div className="dash-header">
                <div className="dash-title">Today at School</div>
                <div className="dash-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="dash-stats">
                <div className="dash-stat">
                  <div className="dash-stat-label">Present</div>
                  <div className="dash-stat-value">128</div>
                </div>
                <div className="dash-stat">
                  <div className="dash-stat-label">On Leave</div>
                  <div className="dash-stat-value">4</div>
                </div>
                <div className="dash-stat">
                  <div className="dash-stat-label">Fees Paid</div>
                  <div className="dash-stat-value">92%</div>
                </div>
              </div>
              <div className="dash-chart">
                <svg viewBox="0 0 300 90" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#E8704B" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#E8704B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,70 Q40,40 80,50 T160,30 T240,40 T300,20 L300,90 L0,90 Z" fill="url(#chartGrad)" />
                  <path d="M0,70 Q40,40 80,50 T160,30 T240,40 T300,20" stroke="#E8704B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <div className="dash-list">
                <div className="dash-row">
                  <div className="dash-avatar" style={{ background: "var(--coral)" }}>
                    AS
                  </div>
                  <div className="dash-row-info">
                    <div className="dash-row-name">Aarav Sharma</div>
                    <div className="dash-row-meta">Sunflower · Class A</div>
                  </div>
                  <span className="dash-row-badge badge-present">Present</span>
                </div>
                <div className="dash-row">
                  <div className="dash-avatar" style={{ background: "var(--sage)" }}>
                    MP
                  </div>
                  <div className="dash-row-info">
                    <div className="dash-row-name">Meera Patel</div>
                    <div className="dash-row-meta">Sunflower · Class A</div>
                  </div>
                  <span className="dash-row-badge badge-late">Late</span>
                </div>
                <div className="dash-row">
                  <div className="dash-avatar" style={{ background: "var(--plum)" }}>
                    RK
                  </div>
                  <div className="dash-row-info">
                    <div className="dash-row-name">Ria Kapoor</div>
                    <div className="dash-row-meta">Daisy · Class B</div>
                  </div>
                  <span className="dash-row-badge badge-present">Present</span>
                </div>
              </div>
            </div>

            {/* Floating mini card 2 */}
            <div className="float-card float-card-2">
              <div className="float-icon" style={{ background: "var(--coral)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Message sent</div>
                <div style={{ color: "var(--ink-muted)", fontSize: "0.75rem" }}>42 parents notified</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============ MARQUEE STRIP ============ */}
      <div className="strip">
        <div className="strip-track">
          <span>
            Save Time <span className="dot"></span> Happy Parents <span className="dot"></span> Easy Attendance <span className="dot"></span> Simple Fees <span className="dot"></span> Organized Records <span className="dot"></span> Smooth Operations <span className="dot"></span>
          </span>
          <span>
            Save Time <span className="dot"></span> Happy Parents <span className="dot"></span> Easy Attendance <span className="dot"></span> Simple Fees <span className="dot"></span> Organized Records <span className="dot"></span> Smooth Operations <span className="dot"></span>
          </span>
        </div>
      </div>

      {/* ============ PROBLEMS / SOLUTIONS ============ */}
      <section id="features">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Why schools love it</span>
            <h2>
              The little headaches you&apos;ll <span className="serif-italic">never deal with again.</span>
            </h2>
            <p>Running a preschool means juggling a thousand small things every day. Brightly takes care of the paperwork so you can focus on what really matters—the children.</p>
          </div>

          <div className="problem-grid">
            <div className="problem-card reveal">
              <div className="problem-icon pi-1">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3>Mountains of paperwork</h3>
              <p>Stop chasing files, ledgers, and registers. Everything is neatly stored and just one click away.</p>
              <div className="arrow">Goodbye, file cabinets →</div>
            </div>

            <div className="problem-card reveal">
              <div className="problem-icon pi-2">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <polyline points="9 16 11 18 15 14" />
                </svg>
              </div>
              <h3>Slow attendance taking</h3>
              <p>Mark attendance for the whole class in under a minute and share it with parents instantly.</p>
              <div className="arrow">Save 30 mins every morning →</div>
            </div>

            <div className="problem-card reveal">
              <div className="problem-icon pi-3">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3>Parents calling all day</h3>
              <p>Parents see attendance, fees, photos, and notices in their app—no more endless phone calls.</p>
              <div className="arrow">Happier parents, calmer office →</div>
            </div>

            <div className="problem-card reveal">
              <div className="problem-icon pi-4">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3>Confusing fee tracking</h3>
              <p>See who paid, who pending, who&apos;s due—all in one clear screen. Send reminders with one tap.</p>
              <div className="arrow">No more missed payments →</div>
            </div>

            <div className="problem-card reveal">
              <div className="problem-icon pi-5">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>Scattered student info</h3>
              <p>Every child&apos;s profile, parent info, medical notes, and history beautifully organized in one place.</p>
              <div className="arrow">Find anything in seconds →</div>
            </div>

            <div className="problem-card reveal">
              <div className="problem-icon pi-6">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3>Manual timetables & exams</h3>
              <p>Build class schedules, plan exams, and share results without the spreadsheet headaches.</p>
              <div className="arrow">Plan your week in minutes →</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MODULES ============ */}
      <section id="modules" className="modules-section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">17 thoughtful modules</span>
            <h2>
              One simple system. <span className="serif-italic">Every part of school life.</span>
            </h2>
            <p>From your first day of admission to the last day of the year—every step of your school&apos;s journey is covered.</p>
          </div>

          <div className="modules-grid">
            {/* 1 */}
            <div className="module-card reveal" data-color="coral">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
              </div>
              <h3>Admin Dashboard</h3>
              <p>See everything happening in your school at a glance—attendance, fees, students, and more, all on one friendly screen.</p>
              <span className="module-tag">Your daily command center</span>
            </div>

            {/* 2 */}
            <div className="module-card reveal" data-color="sage">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>Student Management</h3>
              <p>Every child&apos;s full story in one place—parents, medical notes, documents, photos, and progress.</p>
              <span className="module-tag">Everything about every child</span>
            </div>

            {/* 3 */}
            <div className="module-card reveal" data-color="sky">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Teacher Management</h3>
              <p>Manage your teaching team easily—profiles, qualifications, classes assigned, and more.</p>
              <span className="module-tag">Your team, organized</span>
            </div>

            {/* 4 */}
            <div className="module-card reveal" data-color="butter">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                </svg>
              </div>
              <h3>Class & Sections</h3>
              <p>Organize classes, sections, rooms, and who&apos;s in each one—clean and simple to set up.</p>
              <span className="module-tag">Right child, right place</span>
            </div>

            {/* 5 */}
            <div className="module-card reveal" data-color="plum">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <polyline points="9 16 11 18 15 14" />
                </svg>
              </div>
              <h3>Attendance</h3>
              <p>Mark daily attendance in seconds. Parents see updates instantly. Reports made automatically.</p>
              <span className="module-tag">One tap, done</span>
            </div>

            {/* 6 */}
            <div className="module-card reveal" data-color="coral">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3>Timetable</h3>
              <p>Build beautiful weekly schedules—drag, drop, and never have two classes in the same room again.</p>
              <span className="module-tag">No more clashes</span>
            </div>

            {/* 7 */}
            <div className="module-card reveal" data-color="sage">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3>Exams & Results</h3>
              <p>Plan exams, set grading, enter marks, and share friendly report cards with parents beautifully.</p>
              <span className="module-tag">Stress-free assessments</span>
            </div>

            {/* 8 */}
            <div className="module-card reveal" data-color="coral">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3>Fees</h3>
              <p>Collect fees in cash, online, or by cheque. Track who paid, send reminders, print receipts—done.</p>
              <span className="module-tag">Money matters, sorted</span>
            </div>

            {/* 9 */}
            <div className="module-card reveal" data-color="sky">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="13" y2="17" />
                </svg>
              </div>
              <h3>Admissions</h3>
              <p>From inquiry to enrollment—track new admissions, verify documents, and welcome new families easily.</p>
              <span className="module-tag">Smooth enrollments</span>
            </div>

            {/* 10 */}
            <div className="module-card reveal" data-color="plum">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <h3>Settings</h3>
              <p>Set up your school&apos;s profile, decide who can do what, and customize the system the way you like.</p>
              <span className="module-tag">Your school, your rules</span>
            </div>

            {/* 11 */}
            <div className="module-card reveal" data-color="butter">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 17h4V5H2v12h3" />
                  <polyline points="14 5 21 5 21 17 17 17" />
                  <circle cx="7.5" cy="17.5" r="2.5" />
                  <circle cx="17.5" cy="17.5" r="2.5" />
                </svg>
              </div>
              <h3>Transport</h3>
              <p>Manage school buses, drivers, and routes. Know which child is on which bus, always.</p>
              <span className="module-tag">Safe rides, every day</span>
            </div>

            {/* 12 */}
            <div className="module-card reveal" data-color="coral">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3>Notifications</h3>
              <p>Send announcements, reminders, or personal notes to one parent or everyone in seconds.</p>
              <span className="module-tag">Always in the loop</span>
            </div>

            {/* 13 */}
            <div className="module-card reveal" data-color="sage">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>Events & Calendar</h3>
              <p>Holidays, parent meetings, sports day, picnics—every special day on one shared calendar.</p>
              <span className="module-tag">Never miss a moment</span>
            </div>

            {/* 14 */}
            <div className="module-card reveal" data-color="sky">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <h3>Photo & Media</h3>
              <p>Share happy classroom moments and event photos with parents—they&apos;ll love every memory.</p>
              <span className="module-tag">Memories that matter</span>
            </div>

            {/* 15 */}
            <div className="module-card reveal" data-color="plum">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3>Parent Portal</h3>
              <p>A loving little app for parents—attendance, fees, photos, progress, and notices, all in their pocket.</p>
              <span className="module-tag">Parents&apos; favorite feature</span>
            </div>

            {/* 16 */}
            <div className="module-card reveal" data-color="butter">
              <div className="mod-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h3>Teacher & Student Portal</h3>
              <p>A simple dashboard where teachers manage their classes and students see their schedule and tasks.</p>
              <span className="module-tag">Everyone has their own space</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PARENT SECTION ============ */}
      <section id="parents" className="parent-section">
        <div className="container parent-grid">
          <div className="parent-visual reveal">
            <span className="parent-decoration d1">⭐</span>
            <span className="parent-decoration d2">❤️</span>
            <span className="parent-decoration d3">✨</span>
            <div className="phone">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", marginBottom: "16px", paddingLeft: "4px" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Today</div>
                  <div style={{ fontWeight: 500, marginTop: "2px" }}>Hello, Priya 👋</div>
                </div>

                <div className="notif">
                  <div className="notif-icon" style={{ background: "var(--sage-soft)", color: "#496D4C" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">Aarav is at school!</div>
                    <div className="notif-text">Attendance marked at 9:02 AM</div>
                    <div className="notif-time">Just now</div>
                  </div>
                </div>

                <div className="notif">
                  <div className="notif-icon" style={{ background: "var(--butter-soft)", color: "#8B6A1F" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C8 2 6 5 6 8c0 4 3 5 3 9 0 2 1 3 3 3s3-1 3-3c0-4 3-5 3-9 0-3-2-6-6-6z" />
                    </svg>
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">Lunch today: Veg pulao 🍚</div>
                    <div className="notif-text">With cucumber salad & fruit</div>
                    <div className="notif-time">12 min ago</div>
                  </div>
                </div>

                <div className="notif">
                  <div className="notif-icon" style={{ background: "var(--coral-soft)", color: "var(--coral-deep)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">Sports Day on Friday!</div>
                    <div className="notif-text">Please send sneakers ✨</div>
                    <div className="notif-time">2 hours ago</div>
                  </div>
                </div>

                <div className="notif">
                  <div className="notif-icon" style={{ background: "var(--sky-soft)", color: "#3F6586" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">New photos uploaded 📸</div>
                    <div className="notif-text">5 from today&apos;s art class</div>
                    <div className="notif-time">Yesterday</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="parent-content reveal">
            <span className="eyebrow">Built for parents too</span>
            <h2>
              The kind of school updates <span className="serif-italic">parents fall in love with.</span>
            </h2>
            <p>Parents feel calmer when they know their little one is happy and safe. Brightly gently keeps them in the loop so they always feel close, even when they&apos;re at work.</p>

            <div className="parent-benefits">
              <div className="parent-benefit">
                <div className="pb-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  </svg>
                </div>
                <div className="pb-text">
                  <strong>Live notifications</strong>
                  <span>The moment something happens, parents know.</span>
                </div>
              </div>

              <div className="parent-benefit">
                <div className="pb-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="pb-text">
                  <strong>Attendance updates</strong>
                  <span>&ldquo;Your child is safely in class.&rdquo; Every morning.</span>
                </div>
              </div>

              <div className="parent-benefit">
                <div className="pb-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="pb-text">
                  <strong>Friendly fee reminders</strong>
                  <span>Pay online or get a gentle reminder—no awkward calls.</span>
                </div>
              </div>

              <div className="parent-benefit">
                <div className="pb-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                  </svg>
                </div>
                <div className="pb-text">
                  <strong>Event updates</strong>
                  <span>Holidays, meetings, picnics—all in one calendar.</span>
                </div>
              </div>

              <div className="parent-benefit">
                <div className="pb-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div className="pb-text">
                  <strong>Progress tracking</strong>
                  <span>Watch your child grow with simple report cards.</span>
                </div>
              </div>

              <div className="parent-benefit">
                <div className="pb-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="pb-text">
                  <strong>Photos from the day</strong>
                  <span>Sweet little moments shared straight from the classroom.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ROLES SECTION ============ */}
      <section className="roles-section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Made for everyone</span>
            <h2>
              One system that <span className="serif-italic">makes everyone&apos;s day easier.</span>
            </h2>
            <p>From the principal to the parent, Brightly gives each person exactly what they need and nothing they don&apos;t.</p>
          </div>

          <div className="roles-grid">
            <div className="role-card reveal">
              <div className="role-illust" style={{ background: "var(--coral-soft)" }}>👑</div>
              <h3>For Principals</h3>
              <ul>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  One screen for the whole school
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Quick reports any time
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  See how the school is doing
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Make better decisions
                </li>
              </ul>
            </div>

            <div className="role-card reveal">
              <div className="role-illust" style={{ background: "var(--sage-soft)" }}>📋</div>
              <h3>For Admin Staff</h3>
              <ul>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  No more paperwork piles
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Collect fees easily
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Find any record in seconds
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Send updates in one click
                </li>
              </ul>
            </div>

            <div className="role-card reveal">
              <div className="role-illust" style={{ background: "var(--sky-soft)" }}>🍎</div>
              <h3>For Teachers</h3>
              <ul>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Mark attendance in seconds
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Share photos & updates
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Track each child&apos;s progress
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  More time with the children
                </li>
              </ul>
            </div>

            <div className="role-card reveal">
              <div className="role-illust" style={{ background: "var(--butter-soft)" }}>👨‍👩‍👧</div>
              <h3>For Parents</h3>
              <ul>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Always know what&apos;s happening
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Pay fees online easily
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  See daily photos & updates
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Stay close to your little one
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DEVICES SECTION ============ */}
      <section className="devices-section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Anywhere, anytime</span>
            <h2>
              Works beautifully on <span className="serif-italic">every device you own.</span>
            </h2>
            <p>Open it on your office desktop, your tablet during the day, or your phone on the go. It just works—no installation, no fuss.</p>
          </div>

          <div className="devices-stage reveal">
            <div className="device device-laptop">
              <div className="device-screen">
                <div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>Principal&apos;s view</div>
                  <div style={{ fontSize: "clamp(1rem, 2vw, 1.5rem)" }}>Today, 132 children are at school 🌼</div>
                </div>
              </div>
            </div>
            <div className="device device-tablet">
              <div className="device-screen">
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", opacity: 0.7, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Teacher&apos;s view</div>
                  <div style={{ fontSize: "1rem" }}>Attendance ✓</div>
                </div>
              </div>
            </div>
            <div className="device device-phone">
              <div className="device-screen">
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.6rem", opacity: 0.7, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Parent&apos;s view</div>
                  <div style={{ fontSize: "0.85rem" }}>
                    Aarav
                    <br />
                    is happy ❤️
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS / IMPACT ============ */}
      <section id="impact" className="stats-section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Real impact</span>
            <h2>
              Less paperwork. <span className="serif-italic">More smiles.</span>
            </h2>
            <p>Schools using Brightly tell us they save hours every week, and parents say the difference is night and day.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card reveal">
              <div className="stat-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-number" data-target="12" data-suffix="hrs">
                0
              </div>
              <div className="stat-label">Saved every week</div>
              <div className="stat-sub">Less time on admin, more time with children.</div>
            </div>

            <div className="stat-card reveal">
              <div className="stat-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="stat-number" data-target="98" data-suffix="%">
                0
              </div>
              <div className="stat-label">Happier parents</div>
              <div className="stat-sub">Parents feel informed and trusted.</div>
            </div>

            <div className="stat-card reveal">
              <div className="stat-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-number" data-target="3" data-suffix="x">
                0
              </div>
              <div className="stat-label">Faster fee collection</div>
              <div className="stat-sub">Fewer pending payments, clearer records.</div>
            </div>

            <div className="stat-card reveal">
              <div className="stat-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="stat-number" data-target="100" data-suffix="%">
                0
              </div>
              <div className="stat-label">Organized records</div>
              <div className="stat-sub">Every detail, neatly in its place.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER & CONTACT FORM ============ */}
      <section id="contact" className="cta-section">
        <div className="container">
          <div className="cta-banner reveal">
            <div className="cta-left">
              <h2>
                Ready to simplify your <br className="desktop-only" /><span className="serif-italic">school management?</span>
              </h2>
              <p>
                Book a free 30-minute demo with<br className="desktop-only" />
                our friendly team. We&apos;ll show you exactly<br className="desktop-only" />
                how Innonsh TinySteps can make your school<br className="desktop-only" />
                run smoother—no commitment, no pressure.
              </p>
            </div>
            
            <div className="cta-right">
              <form onSubmit={handleContactSubmit}>
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_subject" value="New Inquiry from Innonsh TinySteps Website!" />
                
                <h3 className="cta-right-title">Send us a message</h3>
                <p className="cta-right-subtitle">Have questions or want to see a live demo? Fill out the form below.</p>
                
                <div className="cta-form-group">
                  <label className="cta-form-label">Your Name</label>
                  <input type="text" name="Name" required className="cta-form-input" placeholder="Enter your full name" />
                </div>
                
                <div className="cta-form-group">
                  <label className="cta-form-label">Email Address</label>
                  <input type="email" name="Email" required className="cta-form-input" placeholder="you@example.com" />
                </div>
                
                <div className="cta-form-group">
                  <label className="cta-form-label">School Name</label>
                  <input type="text" name="School Name" required className="cta-form-input" placeholder="Your school or institution name" />
                </div>
                
                <div className="cta-form-group">
                  <label className="cta-form-label">Your Message</label>
                  <textarea name="Message" rows={3} required className="cta-form-textarea" placeholder="Tell us about your requirements..."></textarea>
                </div>
                
                <button type="submit" disabled={isSubmittingContact} className="btn btn-light" style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}>
                  {isSubmittingContact ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div>
              <a href="#" className="logo" onClick={(e) => handleAnchorClick(e, "#")}>
                Innonsh TinySteps
              </a>
              <p className="footer-brand-text">Easy school management made simple. Built with care for preschools so every day feels lighter and a little brighter.</p>
            </div>

            <div className="footer-col">
              <h4>PRODUCT</h4>
              <ul>
                <li>
                  <a href="#features" onClick={(e) => handleAnchorClick(e, "#features")}>Features</a>
                </li>
                <li>
                  <a href="#modules" onClick={(e) => handleAnchorClick(e, "#modules")}>All Modules</a>
                </li>
                <li>
                  <a href="#parents" onClick={(e) => handleAnchorClick(e, "#parents")}>Parent App</a>
                </li>
                <li>
                  <a href="#impact" onClick={(e) => handleAnchorClick(e, "#impact")}>Why TinySteps</a>
                </li>
                <li>
                  <a href="#contact" onClick={(e) => handleAnchorClick(e, "#contact")} className="hover:text-white transition-colors cursor-pointer text-left">
                    Book a Demo
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>COMPANY</h4>
              <ul>
                <li>
                  <a href="#">About Us</a>
                </li>
                <li>
                  <a href="#">Customer Stories</a>
                </li>
                <li>
                  <a href="#">Pricing</a>
                </li>
                <li>
                  <button onClick={(e) => { e.preventDefault(); setIsCareersModalOpen(true); }} className="hover:text-white transition-colors cursor-pointer text-left">
                    Careers
                  </button>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>CONTACT</h4>
              <ul>
                <li>
                  <a href="mailto:info@innonsh.com" className="hover:text-coral transition-colors" style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>info@innonsh.com</a>
                </li>
                <li style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>
                  Pune, Maharashtra
                </li>
                <li>
                  <a href="tel:+917620301874" className="hover:text-coral transition-colors" style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>+91 76203 01874</a>
                </li>
                <li style={{ display: "flex", alignItems: "center", height: "36px", padding: 0 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink)", textTransform: "uppercase" }}>
                    SOCIAL
                  </span>
                </li>
                <li>
                  <div className="social-links square-links" style={{ display: "flex", gap: "10px" }}>
                    <a href="#" aria-label="X">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    <a href="#" aria-label="LinkedIn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                    <a href="#" aria-label="GitHub">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                    </a>
                    <a href="#" aria-label="Instagram">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" />
                        <path d="M16 11.4a4 4 0 1 1-7.9 1.2 4 4 0 0 1 7.9-1.2z" />
                        <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                      </svg>
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} Innonsh TinySteps. Made with ❤️ for preschools from Innonsh Technologies Pvt. Ltd.</div>
            <div>All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* ============ CAREERS MODAL ============ */}
      {isCareersModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(31, 27, 22, 0.4)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#ffffff", borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)", width: "100%", maxWidth: "500px", overflow: "hidden", border: "1px solid var(--line)", display: "flex", flexDirection: "column", maxHeight: "90vh", transform: "translateY(-40px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: "1px solid var(--line)", background: "var(--bg-tint)" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500, color: "var(--ink)" }}>Join Our Team</h3>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: "4px" }}>We aren&apos;t actively hiring, but we&apos;d love to have your profile on file.</p>
              </div>
              <button onClick={() => { setIsCareersModalOpen(false); setResumeName(""); }} style={{ padding: "8px", borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--line)" }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="custom-scrollbar" style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              <form onSubmit={handleCareerSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_template" value="table" />
                <input type="hidden" name="_subject" value="New Career Application: Innonsh TinySteps" />

                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "6px" }}>Full Name</label>
                  <input type="text" name="Full Name" required className="form-input" placeholder="John Doe" style={{ width: "100%", padding: "12px 14px", background: "var(--bg-tint)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", fontFamily: "inherit", fontSize: "0.95rem", color: "var(--ink)", outline: "none" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "6px" }}>Email Address</label>
                  <input type="email" name="email" required className="form-input" placeholder="john@example.com" style={{ width: "100%", padding: "12px 14px", background: "var(--bg-tint)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", fontFamily: "inherit", fontSize: "0.95rem", color: "var(--ink)", outline: "none" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "6px" }}>Highest Education</label>
                  <input type="text" name="Education" required className="form-input" placeholder="e.g. B.Tech in Computer Science" style={{ width: "100%", padding: "12px 14px", background: "var(--bg-tint)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", fontFamily: "inherit", fontSize: "0.95rem", color: "var(--ink)", outline: "none" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "6px" }}>Key Skills</label>
                  <textarea name="Key Skills" rows={3} required className="form-textarea" placeholder="e.g. React, Node.js, Design, Management..." style={{ width: "100%", padding: "12px 14px", background: "var(--bg-tint)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", fontFamily: "inherit", fontSize: "0.95rem", color: "var(--ink)", outline: "none", resize: "none" }}></textarea>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "6px" }}>Resume / CV</label>
                  <label style={{ display: "block", border: "2px dashed var(--line)", borderRadius: "var(--radius-sm)", padding: "24px", textAlign: "center", cursor: "pointer", background: "var(--bg-tint)", position: "relative" }}>
                    <UploadCloud className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--coral)" }} />
                    <span style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink-soft)" }}>
                      {resumeName ? <span style={{ color: "var(--coral-deep)" }}>{resumeName}</span> : "Click to upload or drag and drop"}
                    </span>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "4px" }}>PDF, DOCX up to 5MB</span>
                    <input
                      type="file"
                      name="attachment"
                      accept=".pdf,.doc,.docx"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                      onChange={(e) => setResumeName(e.target.files?.[0]?.name || "")}
                      required
                    />
                  </label>
                </div>

                <div style={{ paddingTop: "16px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" disabled={isSubmittingForm} className="btn btn-primary">
                    {isSubmittingForm ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}