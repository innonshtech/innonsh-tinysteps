"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { X } from "lucide-react";
import { LogoMark } from "@/components/landing/LogoMark";
import { InnonshCredit } from "@/components/landing/InnonshCredit";
import "./landing.css";

const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), { ssr: false });

const NAV_LINKS = [
  { href: "#day", label: "A Day With It" },
  { href: "#feelings", label: "Why Schools Love It" },
  { href: "#modules", label: "Modules" },
  { href: "#parents", label: "For Parents" },
  { href: "#contact", label: "Contact" },
];

const PROBLEMS = [
  { cls: "p1", icon: "📞", title: "20 phone calls a day.", text: '"Is my child in class?" "When\'s the picnic?" "Did the bus reach yet?" Same questions, every day, from every parent.' },
  { cls: "p2", icon: "📓", title: "The register that lives in fear.", text: "Attendance in a paper book. Lose it, and you've lost the day. Rain? Good luck reading the ink." },
  { cls: "p3", icon: "💬", title: "15 WhatsApp groups.", text: "One per class. One for teachers. One for parents. One for the picnic. Nobody knows where anything is." },
  { cls: "p4", icon: "💸", title: "Chasing fees, awkwardly.", text: "Calling parents about pending payments. Excel that doesn't quite tally. Receipts printed twice, then lost." },
  { cls: "p5", icon: "📝", title: "Report cards by hand.", text: "Written every term. Half redone for spelling mistakes. Late nights before parent meetings." },
  { cls: "p6", icon: "📇", title: "Enquiries on sticky notes.", text: "The parent who called last month? Forgotten. Follow-ups? Meant to. Admissions? Quietly slipping through." },
];

const TIMELINE = [
  { cls: "t1", emoji: "☀️", time: "7:30 AM", title: "The school day begins.", text: "TinySteps is already awake. Today's timetable, bus routes, and staff attendance are all ready before your first cup of chai." },
  { cls: "t2", emoji: "✋", time: "9:00 AM", title: "Attendance in 30 seconds.", text: 'Miss Anita taps through her class. Parents get a little "Yay, Aarav is in class!" the moment their child arrives.' },
  { cls: "t3", emoji: "🎨", time: "11:30 AM", title: "Art class snapshot.", text: "One photo, two taps, 42 phones light up at home. Grandparents in Nagpur see it before lunch is served." },
  { cls: "t4", emoji: "💌", time: "1:00 PM", title: "Fees paid in the app.", text: "Priya's mom pays this month's fees while eating lunch. Receipt lands in her inbox in 4 seconds. No follow-up call needed." },
  { cls: "t5", emoji: "🚌", time: "3:30 PM", title: "The bus rolls out.", text: 'Parents track their little one all the way home. The driver\'s phone is the ticket. No more anxious "Where\'s the bus?" calls.' },
  { cls: "t6", emoji: "🌙", time: "6:00 PM", title: "Everything is in order.", text: "Principal Ma'am glances at the dashboard. Attendance closed, fees updated, notices sent. Time to go home." },
];

const FEELINGS = [
  { cls: "f1", icon: "📞", title: "Parents stop calling.", text: "They can see everything in the app: where their child is, what they ate, when the picnic is. Your office phone finally rests." },
  { cls: "f2", icon: "☕", title: "Teachers breathe again.", text: "Attendance in 30 seconds. Photos in two taps. Report cards without registers. Less writing, more teaching." },
  { cls: "f3", icon: "🌱", title: "Nothing slips through.", text: "Every medical note, every parent contact, every child's history is safe, searchable, and one tap away." },
  { cls: "f4", icon: "💰", title: "The fees actually come in.", text: "Clear dashboard of who paid and who didn't. Gentle reminders go out on their own. Your accountant will smile." },
];

const TEAMS = [
  { avatar: "👑", title: "Principals", items: ["Your whole school on one screen", "Quick reports whenever you need", "See how the school is doing", "Make smarter decisions daily"] },
  { avatar: "📋", title: "Admin Staff", items: ["No more mountain of paperwork", "Collect fees easily", "Find any record in seconds", "Send updates in one click"] },
  { avatar: "🍎", title: "Teachers", items: ["Mark attendance in seconds", "Share photos & updates easily", "Track every child's progress", "More time with the children"] },
  { avatar: "💕", title: "Parents", items: ["Always know what's happening", "Pay fees online, easily", "See daily photos & updates", "Stay close to your little one"] },
];

const PARENT_BENEFITS = [
  { icon: "✓", cls: "mint", title: "Live attendance", text: '"Your child is safely in class." Every morning.' },
  { icon: "₹", cls: "mustard", title: "Pay fees online", text: "UPI, cards, netbanking. Receipt in seconds." },
  { icon: "🔔", cls: "tomato", title: "Instant notices", text: "Holidays, events, reminders. Never miss a thing." },
  { icon: "📸", cls: "sky", title: "Daily photos", text: "Little moments from the classroom, all day long." },
  { icon: "⭐", cls: "plum", title: "Progress tracking", text: "Watch your little one bloom over the year." },
  { icon: "🚌", cls: "peach", title: "Bus tracking", text: "Know where the bus is. Every ride, every day." },
];

type ModItem = { color: string; title: string; text: string; icon: React.ReactNode };
type ModGroup = { title: string; count: string; mods: ModItem[] };

const MODULE_GROUPS: ModGroup[] = [
  {
    title: "🌼 Daily Life at School",
    count: "4 modules",
    mods: [
      { color: "mod-mustard", title: "Attendance", text: "Mark daily attendance in seconds. Parents get instant updates.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="9 16 11 18 15 14" /></svg> },
      { color: "mod-tomato", title: "Timetable", text: "Build weekly schedules without clashes. Drag, drop, done.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
      { color: "mod-mint", title: "Class & Sections", text: "Organize classes, sections, rooms. Everyone in the right place.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></svg> },
      { color: "mod-sky", title: "Events & Calendar", text: "Holidays, meetings, picnics. Every special day on one calendar.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    ],
  },
  {
    title: "💌 Parent Connection",
    count: "4 modules",
    mods: [
      { color: "mod-tomato", title: "Parent Portal", text: "A loving little app for parents. Their favourite feature.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
      { color: "mod-mustard", title: "Notifications", text: "Send announcements or personal notes in seconds. Always in the loop.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
      { color: "mod-mint", title: "Photo & Media", text: "Share classroom moments. Parents will treasure every memory.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg> },
      { color: "mod-plum", title: "Teacher & Student Portal", text: "Everyone has their own little dashboard. Simple and clear.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
    ],
  },
  {
    title: "💰 Money & Admissions",
    count: "3 modules",
    mods: [
      { color: "mod-mustard", title: "Fees", text: "Cash, online, cheque. Track it all. Send reminders. Print receipts.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
      { color: "mod-tomato", title: "Admissions", text: "From first inquiry to first day. Welcome families with ease.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg> },
      { color: "mod-mint", title: "Exams & Results", text: "Friendly report cards. Beautifully shared with parents.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> },
    ],
  },
  {
    title: "🏫 People & Setup",
    count: "5 modules",
    mods: [
      { color: "mod-mustard", title: "Admin Dashboard", text: "Your whole school on one friendly screen. Your daily command center.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg> },
      { color: "mod-tomato", title: "Student Records", text: "Every child's story in one loving little file.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
      { color: "mod-mint", title: "Teacher Records", text: "Your teaching team, beautifully organized.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
      { color: "mod-sky", title: "Transport", text: "Buses, drivers, routes. Know which child is on which bus, always.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3" /><polyline points="14 5 21 5 21 17 17 17" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg> },
      { color: "mod-plum", title: "Settings", text: "Your school profile, roles, permissions. Set up your way.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
    ],
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), i * 40);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".landing-page-wrapper .reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#") || href.length <= 1) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top, behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="landing-page-wrapper">
      <nav className={`nav ${isScrolled ? "scrolled" : ""}`} id="nav">
        <a href="#" className="logo" onClick={(e) => handleAnchorClick(e, "#")} aria-label="TinySteps home">
          <span className="logo-mark">
            <LogoMark />
          </span>
          TinySteps
        </a>
        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={(e) => handleAnchorClick(e, link.href)}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="nav-cta">
          <Link href="/login" className="btn btn-primary">
            Login <span className="arrow">→</span>
          </Link>
          <a href="#cta" className="btn btn-tomato" onClick={(e) => handleAnchorClick(e, "#cta")}>
            Book a Demo <span className="arrow">→</span>
          </a>
          <button type="button" className="menu-toggle" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B211C" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu-overlay ${mobileMenuOpen ? "open" : ""}`} onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700 }}>Menu</span>
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mobile-menu-links">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={(e) => handleAnchorClick(e, link.href)}>
                {link.label}
              </a>
            ))}
          </div>
          <div className="mobile-menu-cta">
            <Link href="/login" className="btn btn-primary" style={{ justifyContent: "center" }} onClick={() => setMobileMenuOpen(false)}>
              Login <span className="arrow">→</span>
            </Link>
            <a href="#cta" className="btn btn-tomato" style={{ justifyContent: "center" }} onClick={(e) => handleAnchorClick(e, "#cta")}>
              Book a Demo <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </div>

      <header className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-text">
              <span className="eyebrow">
                <span className="dot" /> A pre-primary school ERP
              </span>
              <h1>
                Run your preschool with a <span className="highlight">smile.</span>
              </h1>
              <p className="hero-sub">
                TinySteps takes care of the paperwork so you can go back to being with the children. Attendance, fees, parents, admissions, notices, all in one warm little app made for tiny humans and the grown-ups who love them.
              </p>
              <div className="hero-actions">
                <a href="#cta" className="btn btn-primary" onClick={(e) => handleAnchorClick(e, "#cta")}>
                  Book a Demo <span className="arrow">→</span>
                </a>
                <a href="#modules" className="btn btn-light" onClick={(e) => handleAnchorClick(e, "#modules")}>
                  See What&apos;s Inside
                </a>
              </div>
              <div className="hero-trust">
                <span className="hero-trust-item">
                  <span className="emoji">🇮🇳</span> Made in India
                </span>
                <span className="hero-trust-item">
                  <span className="emoji">📱</span> Works on any phone
                </span>
                <span className="hero-trust-item">
                  <span className="emoji">🤝</span> Setup done for you
                </span>
              </div>
            </div>
            <HeroScene />
          </div>
        </div>
      </header>

      <section className="problem-section" id="problem">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">
              <span className="dot" /> Sound familiar?
            </span>
            <h2>
              You didn&apos;t start a preschool to become a <span className="underline-doodle tomato">paperwork factory.</span>
            </h2>
            <p>But most days, that&apos;s exactly what it feels like. Between registers, WhatsApp groups, missed calls, and fee reminders, when do you actually get to be with the children?</p>
          </div>
          <div className="problems-grid">
            {PROBLEMS.map((p) => (
              <div key={p.title} className={`problem ${p.cls} reveal`}>
                <div className="problem-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
          <div className="problem-bridge reveal">
            <a href="#day" className="problem-bridge-pill" onClick={(e) => handleAnchorClick(e, "#day")}>
              Sound like your Tuesday? <strong>Here&apos;s the fix.</strong>
              <span className="arrow-down">↓</span>
            </a>
          </div>
        </div>
      </section>

      <section className="day-section" id="day">
        <div className="container">
          <div className="day-head reveal">
            <span className="eyebrow mint">
              <span className="dot" /> A day with TinySteps
            </span>
            <h2>
              From <span className="underline-doodle">7:30 in the morning</span> to <span className="underline-doodle tomato">5 in the evening.</span>
            </h2>
            <p>Every little moment of your school day, gently handled.</p>
          </div>
          <div className="timeline">
            {TIMELINE.map((m) => (
              <div key={m.time} className={`moment ${m.cls} reveal`}>
                <span className="emoji">{m.emoji}</span>
                <span className="time">{m.time}</span>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="feelings-section" id="feelings">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">
              <span className="dot" /> Why schools love it
            </span>
            <h2>
              Less to worry about. <span className="underline-doodle mint">More time to love the work.</span>
            </h2>
            <p>Four little changes that make a big difference in how your day feels.</p>
          </div>
          <div className="feelings-grid">
            {FEELINGS.map((f) => (
              <div key={f.title} className={`feeling ${f.cls} reveal`}>
                <div className="feeling-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="modules-section" id="modules">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow sky">
              <span className="dot" /> 16 thoughtful modules
            </span>
            <h2>
              Everything a preschool <span className="underline-doodle sky">actually needs.</span>
            </h2>
            <p>Grouped into four friendly buckets so you know exactly where to look.</p>
          </div>
          {MODULE_GROUPS.map((group) => (
            <div key={group.title} className="mod-group reveal">
              <div className="mod-group-head">
                <h3>{group.title}</h3>
                <span className="count">{group.count}</span>
                <span className="mod-group-line" />
              </div>
              <div className="mod-grid">
                {group.mods.map((mod) => (
                  <div key={mod.title} className={`mod ${mod.color}`}>
                    <div className="mod-icon">{mod.icon}</div>
                    <h4>{mod.title}</h4>
                    <p>{mod.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="parent-section" id="parents">
        <span className="parent-decoration d1">⭐</span>
        <span className="parent-decoration d2">💛</span>
        <span className="parent-decoration d3">✨</span>
        <span className="parent-decoration d4">🌸</span>
        <div className="container parent-grid">
          <div className="parent-visual reveal">
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="phone-title">
                  <div className="day">Today</div>
                  <div className="greet">Hello, Priya 👋</div>
                </div>
                <div className="notif">
                  <div className="notif-icon mint">✓</div>
                  <div className="notif-body">
                    <div className="notif-title">Aarav is at school!</div>
                    <div className="notif-text">Attendance marked at 9:02 AM</div>
                    <div className="notif-time">Just now</div>
                  </div>
                </div>
                <div className="notif">
                  <div className="notif-icon mustard">🍚</div>
                  <div className="notif-body">
                    <div className="notif-title">Lunch today: Veg pulao</div>
                    <div className="notif-text">With cucumber salad & fruit</div>
                    <div className="notif-time">12 min ago</div>
                  </div>
                </div>
                <div className="notif">
                  <div className="notif-icon tomato">🎉</div>
                  <div className="notif-body">
                    <div className="notif-title">Sports Day on Friday!</div>
                    <div className="notif-text">Please send sneakers ✨</div>
                    <div className="notif-time">2 hours ago</div>
                  </div>
                </div>
                <div className="notif">
                  <div className="notif-icon sky">📸</div>
                  <div className="notif-body">
                    <div className="notif-title">5 new photos</div>
                    <div className="notif-text">From today&apos;s art class</div>
                    <div className="notif-time">Yesterday</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="parent-content reveal">
            <span className="eyebrow plum">
              <span className="dot" /> For parents too
            </span>
            <h2>
              The app that mums and dads will <span className="underline-doodle">actually thank you for.</span>
            </h2>
            <p>Preschool parents worry. About lunch. About the bus. About whether their little one had a good day. TinySteps gently keeps them in the loop, with tiny, warm, real-time updates.</p>
            <div className="parent-benefits">
              {PARENT_BENEFITS.map((b) => (
                <div key={b.title} className="p-benefit">
                  <div className={`icon ${b.cls}`}>{b.icon}</div>
                  <div>
                    <strong>{b.title}</strong>
                    <span>{b.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="teams-section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow mustard">
              <span className="dot" /> Made for real school teams
            </span>
            <h2>
              Whether you&apos;re <span className="underline-doodle tomato">30 kids or 300,</span> TinySteps fits.
            </h2>
            <p>Everyone in your school gets a view built just for them. Nothing extra, nothing missing.</p>
          </div>
          <div className="teams-grid">
            {TEAMS.map((team) => (
              <div key={team.title} className="team-card reveal">
                <div className="team-avatar">{team.avatar}</div>
                <h3>{team.title}</h3>
                <ul>
                  {team.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="devices-section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow sky">
              <span className="dot" /> Anywhere, anytime
            </span>
            <h2>
              Runs on any <span className="underline-doodle mint">phone,</span> laptop, or wifi.
            </h2>
            <p>Nothing to install. Nothing to configure. Just open your browser and it works.</p>
          </div>
          <div className="devices-stage reveal">
            <div className="device device-laptop">
              <div className="device-screen">
                <div className="device-label">
                  <small>Principal&apos;s view</small>
                  132 kids at school today 🌼
                </div>
              </div>
            </div>
            <div className="device device-tablet">
              <div className="device-screen">
                <div className="device-label">
                  <small>Teacher</small>
                  Attendance ✓
                </div>
              </div>
            </div>
            <div className="device device-phone">
              <div className="device-screen">
                <div className="device-label">
                  <small>Parent</small>
                  Aarav is<br />
                  happy 💕
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section" id="cta">
        <div className="container">
          <div className="cta-banner reveal">
            <h2>
              Ready to make your school days a little <span style={{ color: "var(--mustard)" }}>brighter?</span>
            </h2>
            <p>
              Book a free 30-minute demo. We&apos;ll come to you (over Zoom, or in person if you&apos;re in Pune) and show you exactly how TinySteps works for a school your size. No commitment, no pressure.
            </p>
            <div className="cta-actions">
              <a href="#contact" className="btn btn-mustard" onClick={(e) => handleAnchorClick(e, "#contact")}>
                Book a Free Demo <span className="arrow">→</span>
              </a>
              <a href="#contact" className="btn btn-light" onClick={(e) => handleAnchorClick(e, "#contact")}>
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact">
        <div className="container">
          <div className="footer-grid">
            <div>
              <a href="#" className="logo" onClick={(e) => handleAnchorClick(e, "#")}>
                <span className="logo-mark">
                  <LogoMark />
                </span>
                TinySteps
              </a>
              <p className="footer-brand-text">A little app with a big heart. Built with care so preschools can spend less time on paperwork and more time with the children.</p>
              <div className="social-links">
                <a href="#" aria-label="Facebook">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5V12h2.6l-.4 3h-2.2v7A10 10 0 0 0 22 12z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M16 11.4a4 4 0 1 1-7.9 1.2 4 4 0 0 1 7.9-1.2z" />
                    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0H5a5 5 0 0 0-5 5v14a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5zM8 19H5V8h3v11zM6.5 6.7a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM20 19h-3v-5.6c0-3.4-4-3.1-4 0V19h-3V8h3v1.8c1.4-2.6 7-2.8 7 2.5V19z" />
                  </svg>
                </a>
                <a href="#" aria-label="YouTube">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8zM9.5 15.5v-7l6.4 3.5-6.4 3.5z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#day" onClick={(e) => handleAnchorClick(e, "#day")}>A Day With It</a></li>
                <li><a href="#feelings" onClick={(e) => handleAnchorClick(e, "#feelings")}>Why Schools Love It</a></li>
                <li><a href="#modules" onClick={(e) => handleAnchorClick(e, "#modules")}>All Modules</a></li>
                <li><a href="#parents" onClick={(e) => handleAnchorClick(e, "#parents")}>Parent App</a></li>
                <li><a href="#cta" onClick={(e) => handleAnchorClick(e, "#cta")}>Book a Demo</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Customer Stories</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Use</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Get in Touch</h4>
              <div className="footer-contact-item">
                <span className="emoji">📞</span>
                <span>+91 98765 43210</span>
              </div>
              <div className="footer-contact-item">
                <span className="emoji">✉️</span>
                <span>hello@tinysteps.school</span>
              </div>
              <div className="footer-contact-item">
                <span className="emoji">📍</span>
                <span>Pune, Maharashtra, India</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} TinySteps. Made with 💛 for preschools.</div>
            <InnonshCredit />
          </div>
        </div>
      </footer>
    </div>
  );
}
