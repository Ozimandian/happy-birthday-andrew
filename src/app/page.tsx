'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

/* ============================================================
   TYPES
   ============================================================ */
type Screen = 'boot' | 'encrypted' | 'vault-door' | 'main' | 'location' | 'chat';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SpecialStats {
  СИЛ: number;
  ВОС: number;
  ВЫН: number;
  ХАР: number;
  ИНТ: number;
  ЛОВ: number;
  УДЧ: number;
}

interface ResidentCard {
  name: string;
  number: string;
  stats: SpecialStats;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const BOOT_LINES = [
  'VAULT-TEC BIOS v118.0.2077',
  '',
  'VAULT-TEC INDUSTRIES™ TERMINAL OS v.118.0',
  'COPYRIGHT © 2077 VAULT-TEC CORPORATION',
  'ВСЕ ПРАВА ЗАЩИЩЕНЫ',
  '',
  'ПРОВЕРКА ПАМЯТИ: 65536K OK',
  'ОБНАРУЖЕНО: ТЕРМИНАЛ VT-100 ✓ | МОНИТОР CRT-14 ✓ | КЛАВИАТУРА PK-01 ✓',
  '',
  'ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ УБЕЖИЩА №18...',
  '▓▓▓▓▓▓▓▓▓▓ ЗАГРУЗКА ЯДРА............. OK',
  '▓▓▓▓▓▓▓▓▓▓ СКАНИРОВАНИЕ РАДИАЦИИ..... 0.03 ЗВ/Ч',
  '▓▓▓▓▓▓▓▓▓▓ ВЕНТИЛЯЦИЯ............... АКТИВНА',
  '▓▓▓▓▓▓▓▓▓▓ ДВЕРИ УБЕЖИЩА............ ЗАПЕРТЫ',
  '▓▓▓▓▓▓▓▓▓▓ СВЯЗЬ С ПОВЕРХНОСТЬЮ..... НЕТ СИГНАЛА',
  '▓▓▓▓▓▓▓▓▓▓ ПРОПУСКНАЯ СИСТЕМА....... ОЖИДАНИЕ',
  '▓▓▓▓▓▓▓▓▓▓ СИСТЕМА ЖИЗНЕОБЕСПЕЧЕНИЯ НОРМА',
  '▓▓▓▓▓▓▓▓▓▓ РЕЗЕРВНЫЙ ГЕНЕРАТОР...... ЗАРЯЖЕН',
  '',
  'УБЕЖИЩЕ №18 — КРИМИНАЛЬНЫЙ РОСТОВ-НА-ДОНУ',
  'СТАТУС: ПРИГЛАШЕНИЕ ОЖИДАЕТ ПОДТВЕРЖДЕНИЯ',
  '',
  '> СИСТЕМА ГОТОВА К ПРИЁМУ СООБЩЕНИЯ...',
];

const SCRAMBLE_CHARS = '█▓░▒╔╗╚╝║═╬╠╣╦╩▀▄⌐¬≡≈∞∑∏∫⊂⊃∩∪0123456789ABCDEF@#$%&*!?<>{}[]АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

const BIRTHDAY_DATE = new Date('2026-05-30T13:00:00+03:00');

const SPECIAL_LABELS: { key: keyof SpecialStats; label: string; full: string }[] = [
  { key: 'СИЛ', label: 'СИЛ', full: 'Сила' },
  { key: 'ВОС', label: 'ВОС', full: 'Восприятие' },
  { key: 'ВЫН', label: 'ВЫН', full: 'Выносливость' },
  { key: 'ХАР', label: 'ХАР', full: 'Харизма' },
  { key: 'ИНТ', label: 'ИНТ', full: 'Интеллект' },
  { key: 'ЛОВ', label: 'ЛОВ', full: 'Ловкость' },
  { key: 'УДЧ', label: 'УДЧ', full: 'Удача' },
];

const DEFAULT_STATS: SpecialStats = { СИЛ: 5, ВОС: 5, ВЫН: 5, ХАР: 5, ИНТ: 5, ЛОВ: 5, УДЧ: 5 };

const VAULT_RULES = [
  '01. ЯВКА В ДРЕСС-КОДЕ ПУСТОШИ ОДОБРЕНА — ЛЮБОЙ НАРЯД ПРИНИМАЕТСЯ',
  '02. ПРОПУСК В УБЕЖИЩЕ ТОЛЬКО ПО ПРИГЛАШЕНИЮ — ПРИНЕСИТЕ ХОРОШЕЕ НАСТРОЕНИЕ',
  '03. АЛКОГОЛЬ РАЗРЕШЁН — НО МЕРУ ЗНАЙ, ЖИТЕЛЬ',
  '04. ФОТО И ВИДЕО ПРИВЕТСТВУЕТСЯ — ЗАФИКСИРУЙ МОМЕНТ СПАСЕНИЯ',
];

const SPEECH_MESSAGES = ['ДОБРО ПОЖАЛОВАТЬ!', 'УБЕЖИЩЕ ЖДЁТ!', 'РАД ВИДЕТЬ ТЕБЯ!'];

const GALLERY_IMAGES = [
  { src: '/gallery/vault-interior.png', caption: 'ИНТЕРЬЕР УБЕЖИЩА' },
  { src: '/gallery/wasteland-party.png', caption: 'ВЕЧЕРИНКА НА ПУСТОШИ' },
  { src: '/gallery/pip-boy-party.png', caption: 'PIP-BOY ВЕЧЕРИНКА' },
  { src: '/gallery/cake-nuclear.png', caption: 'ТОРТ «ЯДЕРНЫЙ»' },
];

const VAULT_LOG_ENTRIES = [
  '2077.05.30 13:00 — ДВЕРИ УБЕЖИЩА ОТКРЫТЫ',
  '2077.05.30 13:05 — ПЕРВЫЙ ЖИТЕЛЬ ПРИБЫЛ',
  '2077.05.30 13:15 — ПРАЗДНОВАНИЕ НАЧАЛОСЬ',
  '2077.05.30 14:00 — ТОРТ ПОДАН',
  '2077.05.30 22:00 — УБЕЖИЩЕ ЗАКРЫТО — ВСЕ ВЕСЕЛИЛИСЬ',
];

const INVENTORY_ITEMS = [
  '🔫 ЛАЗЕРНАЯ ПУШКА x1',
  '🎂 ТОРТ "ЯДЕРНЫЙ" x1',
  '🥤 НАПИТОК "ВИМ" x5',
  '🎵 МУЗЫКА "УРБАН" x1',
  '🧪 СТИМПАК x3',
];

const PERKS = [
  { id: 'drinker', emoji: '🍻', name: 'Завсегдатай', desc: 'Алкоголь действует на вас в два раза слабее' },
  { id: 'fist', emoji: '💪', name: 'Кулак власти', desc: 'Ваш кулак наносит дополнительный урон' },
  { id: 'educated', emoji: '🧠', name: 'Образованность', desc: 'Вы получаете +2 к Интеллекту' },
  { id: 'sniper', emoji: '🎯', name: 'Снайпер', desc: 'Ваши выстрелы в голову всегда критические' },
  { id: 'runner', emoji: '🏃', name: 'Бегун', desc: 'Вы можете бежать на 30% дольше' },
  { id: 'chemist', emoji: '💊', name: 'Химик', desc: 'Ваш организм лучше переносит стимпаки' },
  { id: 'silvertongue', emoji: '💬', name: 'Серебряный язык', desc: 'Вы получаете +50% к убеждению' },
  { id: 'nightvision', emoji: '🔦', name: 'Ночное зрение', desc: 'Вы видите в темноте как днём' },
];

const RANDOM_EVENTS = [
  '⚠ РАДИАЦИОННЫЙ ВСПЛЕСК ОБНАРУЖЕН — 0.05 ЗВ/Ч',
  '🟢 ЖИТЕЛЬ УБЕЖИЩА №42 ПОКИНУЛ ЗОНУ',
  '📡 СИГНАЛ SOS ЗАФИКСИРОВАН НА ЧАСТОТЕ 121.5',
  '🌡 ТЕМПЕРАТУРА ПУСТОШИ: +42°C',
  '🚨 ДВИЖЕНИЕ ОБНАРУЖЕНО У ВХОДА В УБЕЖИЩЕ',
  '📻 РАДИО: МУЗЫКА ВОЗОБНОВЛЕНА НА ЧАСТОТЕ 89.7',
  '⚡ ЭНЕРГЕТИЧЕСКИЙ ЩИТ УБЕЖИЩА: 98% СТАБИЛЬНОСТИ',
  '🧬 МУТАЦИЯ УРОВНЯ 2 ЗАФИКСИРОВАНА В СЕКТОРЕ 7',
  '🔔 НОВЫЙ ЖИТЕЛЬ ЗАРЕГИСТРИРОВАН В УБЕЖИЩЕ №18',
  '🌧 КИСЛОТНЫЙ ДОЖДЬ ОЖИДАЕТСЯ ЧЕРЕЗ 2 ЧАСА',
  '🛡 ПРОТОКОЛ БЕЗОПАСНОСТИ АКТИВИРОВАН',
  '📦 ПОСТАВКА ОТ БРАТИШКИ ИЗ УБЕЖИЩА №101 ПРИБЫЛА',
];

const NUKA_COLA_MENU = [
  { name: 'Nuka-Cola Classic', emoji: '🥤', desc: 'Оригинальный вкус, освежающий как ядерная зима', price: '5 крышек', color: '#14FE17' },
  { name: 'Nuka-Cola Quantum', emoji: '⚗️', desc: 'Синее свечение, заряженное квантовой энергией', price: '8 крышек', color: '#4FC3F7' },
  { name: 'Nuka-Cola Cherry', emoji: '🍒', desc: 'Вишнёвый взрыв на каждом глотке', price: '6 крышек', color: '#FF5252' },
  { name: 'Водка «Пустошь»', emoji: '🥃', desc: 'Крепость 40°, как в лучших традициях Криминального Ростова', price: '10 крышек', color: '#E0E0E0' },
  { name: 'Стимпак Шот', emoji: '💉', desc: 'Зелёный коктейль, восстанавливает 25 HP', price: '7 крышек', color: '#14FE17' },
  { name: 'Психоделический Мутфрут', emoji: '🍇', desc: 'Экзотический фруктовый микс с Пустоши', price: '4 крышки', color: '#CE93D8' },
];

const WEATHER_STATES = [
  { temp: '+38°C', wind: '5 км/ч', radiation: '0.01 ЗВ/Ч', visibility: 'ПУСТОША', icon: '☀️', windLevel: 1 },
  { temp: '+42°C', wind: '12 км/ч', radiation: '0.05 ЗВ/Ч', visibility: 'СРЕДНЯЯ', icon: '🌤', windLevel: 2 },
  { temp: '+47°C', wind: '18 км/ч', radiation: '0.08 ЗВ/Ч', visibility: 'НИЗКАЯ', icon: '🌫', windLevel: 3 },
  { temp: '+50°C', wind: '22 км/ч', radiation: '0.10 ЗВ/Ч', visibility: 'ОПАСНАЯ', icon: '⛈', windLevel: 4 },
  { temp: '+52°C', wind: '25 км/ч', radiation: '0.12 ЗВ/Ч', visibility: 'ОПАСНАЯ', icon: '☢️', windLevel: 5 },
];

const HACKING_WORDS = [
  'УБЕЖИЩЕ', 'РАДИАЦИЯ', 'ПУСТОШЬ', 'СТИМПАК', 'ВОЛТБОЙ',
  'МУТАНТ', 'ПИПБОЙ', 'КРИМИНАЛ', 'ВЗЛОМЩИК', 'ТЕРМИНАЛ',
];

const ACHIEVEMENTS = [
  { id: 'rsvp', icon: '✅', name: 'ЯВКА ПОДТВЕРЖДЕНА', desc: 'Подтвердите явку в Убежище', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-rsvp') === 'confirmed' },
  { id: 'card', icon: '🪪', name: 'ЖИТЕЛЬ ЗАРЕГИСТРИРОВАН', desc: 'Создайте карту жителя', check: () => typeof window !== 'undefined' && !!localStorage.getItem('vault18-resident-card') },
  { id: 'perks', icon: '⭐', name: 'ПЕРКИ ВЫБРАНЫ', desc: 'Выберите 3 перка', check: () => { if (typeof window === 'undefined') return false; const p = localStorage.getItem('vault18-perks'); return p ? JSON.parse(p).length >= 3 : false; } },
  { id: 'chat', icon: '🤖', name: 'ПЕРВЫЙ КОНТАКТ', desc: 'Поговорите с Волтбоем', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-chatted') === 'true' },
  { id: 'hack', icon: '🔓', name: 'ВЗЛОМЩИК', desc: 'Успешно взломайте терминал', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-hacked') === 'true' },
  { id: 'terminal', icon: '🖥️', name: 'СЕКРЕТНЫЙ ТЕРМИНАЛ', desc: 'Найдите секретный терминал', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-terminal') === 'true' },
  { id: 'music', icon: '🎵', name: 'РАДИО ПУСТОШИ', desc: 'Включите музыку', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-music') === 'true' },
  { id: 'lockpick', icon: '🔓', name: 'ВЗЛОМЩИК ЗАМКОВ', desc: 'Вскройте замок', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-lockpicked') === 'true' },
  { id: 'konami', icon: '🎮', name: 'КОНАМИ КОД', desc: 'Введите секретный код', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-konami') === 'true' },
];

/* ============================================================
   SOUND UTILITY (Web Audio API)
   ============================================================ */
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playBeep(frequency = 800, duration = 0.06, volume = 0.08) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'square';
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

function playTerminalBeep() {
  playBeep(1200, 0.15, 0.1);
  setTimeout(() => playBeep(1600, 0.1, 0.08), 100);
}

function playClickBeep() {
  playBeep(600, 0.04, 0.06);
}

function playVaultDoorBeep() {
  playBeep(200, 0.3, 0.12);
  setTimeout(() => playBeep(150, 0.3, 0.1), 300);
  setTimeout(() => playBeep(100, 0.5, 0.08), 600);
}

/* ============================================================
   HOOKS
   ============================================================ */

function useTypewriter(lines: string[], speed = 35) {
  const [step, setStep] = useState(0);
  const totalChars = lines.reduce((sum, l) => sum + l.length + 1, 0);

  useEffect(() => {
    if (step >= totalChars) return;
    const timer = setTimeout(() => setStep(s => s + 1), speed);
    return () => clearTimeout(timer);
  }, [step, totalChars, speed]);

  const displayedLines: string[] = [];
  let currentText = '';
  let charsLeft = step;

  for (let i = 0; i < lines.length; i++) {
    if (charsLeft >= lines[i].length) {
      displayedLines.push(lines[i]);
      charsLeft -= lines[i].length + 1;
    } else if (charsLeft > 0) {
      currentText = lines[i].slice(0, charsLeft);
      charsLeft = 0;
    } else {
      break;
    }
  }

  const isComplete = step >= totalChars;
  return { displayedLines, currentText, isComplete };
}

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function useRSVP() {
  const [confirmed, setConfirmed] = useState(false);
  const [flashShow, setFlashShow] = useState(false);

  // Directly read localStorage in render (client-only component, acceptable)
  const isConfirmed = typeof window !== 'undefined' ? localStorage.getItem('vault18-rsvp') === 'confirmed' : false;
  const effectiveConfirmed = confirmed || isConfirmed;

  const confirmRSVP = useCallback(() => {
    localStorage.setItem('vault18-rsvp', 'confirmed');
    setConfirmed(true);
    setFlashShow(true);
    playTerminalBeep();
    setTimeout(() => setFlashShow(false), 1500);
  }, []);

  return { confirmed: effectiveConfirmed, flashShow, confirmRSVP };
}

function useResidentCard() {
  const [card, setCard] = useState<ResidentCard | null>(null);

  // Read from localStorage without triggering lint violation
  const storedCard = typeof window !== 'undefined' ? (() => {
    const stored = localStorage.getItem('vault18-resident-card');
    if (stored) {
      try { return JSON.parse(stored) as ResidentCard; } catch { return null; }
    }
    return null;
  })() : null;
  const effectiveCard = card || storedCard;

  const generateCard = useCallback((name: string, stats: SpecialStats) => {
    const number = String(Math.floor(100000 + Math.random() * 900000));
    const newCard: ResidentCard = { name, number, stats };
    localStorage.setItem('vault18-resident-card', JSON.stringify(newCard));
    setCard(newCard);
    playTerminalBeep();
  }, []);

  const resetCard = useCallback(() => {
    localStorage.removeItem('vault18-resident-card');
    setCard(null);
  }, []);

  return { card: effectiveCard, generateCard, resetCard };
}

/* ============================================================
   PIXEL ART SVGs (Inline for crispness)
   ============================================================ */
function RadiationSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="10" />
      <path d="M50 35 A20 20 0 0 1 67 45 L80 35 A40 40 0 0 0 50 15Z" />
      <path d="M65 55 A20 20 0 0 1 55 72 L65 85 A40 40 0 0 0 85 55Z" />
      <path d="M35 55 A20 20 0 0 1 45 35 L35 15 A40 40 0 0 0 15 55Z" />
    </svg>
  );
}

function NuclearBlastSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} fill="currentColor">
      <ellipse cx="50" cy="30" rx="35" ry="20" />
      <rect x="40" y="30" width="20" height="30" rx="2" />
      <rect x="42" y="50" width="16" height="40" rx="2" />
      <ellipse cx="50" cy="95" rx="30" ry="10" />
      <ellipse cx="50" cy="28" rx="20" ry="12" opacity="0.5" />
    </svg>
  );
}

function CompassSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" stroke="currentColor">
      <circle cx="60" cy="60" r="55" strokeWidth="2" opacity="0.3" />
      <circle cx="60" cy="60" r="48" strokeWidth="1" opacity="0.2" />
      <line x1="60" y1="5" x2="60" y2="15" strokeWidth="2" />
      <line x1="60" y1="105" x2="60" y2="115" strokeWidth="2" opacity="0.5" />
      <line x1="5" y1="60" x2="15" y2="60" strokeWidth="2" opacity="0.5" />
      <line x1="105" y1="60" x2="115" y2="60" strokeWidth="2" opacity="0.5" />
      <text x="60" y="28" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="currentColor" stroke="none">С</text>
      <polygon points="60,18 54,60 60,55 66,60" fill="#14FE17" stroke="none" opacity="0.9" />
      <polygon points="60,102 54,60 60,65 66,60" fill="#0B8C0D" stroke="none" opacity="0.5" />
      <circle cx="60" cy="60" r="3" fill="#14FE17" stroke="none" />
    </svg>
  );
}

function VaultDoorSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 300" className={className} fill="none" stroke="#14FE17" strokeWidth="2">
      {/* Outer circle - door frame */}
      <circle cx="150" cy="150" r="140" strokeWidth="3" />
      <circle cx="150" cy="150" r="130" strokeWidth="1" opacity="0.5" />
      {/* Inner door panel */}
      <circle cx="150" cy="150" r="110" strokeWidth="2" />
      {/* Wheel spokes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x1 = 150 + 30 * Math.cos(angle);
        const y1 = 150 + 30 * Math.sin(angle);
        const x2 = 150 + 90 * Math.cos(angle);
        const y2 = 150 + 90 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" />;
      })}
      {/* Wheel center */}
      <circle cx="150" cy="150" r="30" strokeWidth="3" />
      <circle cx="150" cy="150" r="20" strokeWidth="1" opacity="0.5" />
      {/* Wheel handle dots */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x = 150 + 90 * Math.cos(angle);
        const y = 150 + 90 * Math.sin(angle);
        return <circle key={`h${i}`} cx={x} cy={y} r="6" fill="#14FE17" opacity="0.6" />;
      })}
      {/* Bolts around frame */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x = 150 + 135 * Math.cos(angle);
        const y = 150 + 135 * Math.sin(angle);
        return <circle key={`b${i}`} cx={x} cy={y} r="4" fill="#14FE17" opacity="0.3" />;
      })}
      {/* VAULT 18 text */}
      <text x="150" y="155" textAnchor="middle" fontSize="14" fontFamily="monospace" fill="#14FE17" stroke="none" fontWeight="bold">18</text>
    </svg>
  );
}

/* ============================================================
   NUCLEAR FLASH OVERLAY
   ============================================================ */
function NuclearFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.3, 0.8, 0] }}
      transition={{ duration: 1.5, times: [0, 0.1, 0.2, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-[#14FE17] pointer-events-none"
    />
  );
}

/* ============================================================
   VAULT DOOR OPENING TRANSITION
   ============================================================ */
function VaultDoorTransition({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'wheel' | 'doors' | 'done'>('wheel');

  useEffect(() => {
    playVaultDoorBeep();
    // Phase 1: Wheel spins for 1 second
    const wheelTimer = setTimeout(() => setPhase('doors'), 1200);
    return () => clearTimeout(wheelTimer);
  }, []);

  useEffect(() => {
    if (phase === 'doors') {
      // Phase 2: Doors slide apart for 1 second
      const doorTimer = setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 1000);
      return () => clearTimeout(doorTimer);
    }
  }, [phase, onComplete]);

  return (
    <div className="fixed inset-0 z-[90] bg-[#050505] flex items-center justify-center overflow-hidden">
      <div className="scanline-overlay" />

      {/* Centered vault door */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80">
        {/* Wheel spins */}
        <motion.div
          className="absolute inset-0"
          animate={phase === 'wheel' ? { rotate: 1080 } : { rotate: 1080 }}
          transition={phase === 'wheel' ? { duration: 1.2, ease: 'easeInOut' } : { duration: 0 }}
        >
          <VaultDoorSVG className="w-full h-full" />
        </motion.div>

        {/* Left door half */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'inset(0 50% 0 0)' }}
          animate={phase === 'doors' ? { x: '-110%' } : { x: '0%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 bg-[#0A0A0A] border-r-2 border-[#14FE17]" />
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <VaultDoorSVG className="w-full h-full" />
          </div>
        </motion.div>

        {/* Right door half */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'inset(0 0 0 50%)' }}
          animate={phase === 'doors' ? { x: '110%' } : { x: '0%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 bg-[#0A0A0A] border-l-2 border-[#14FE17]" />
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <VaultDoorSVG className="w-full h-full" />
          </div>
        </motion.div>
      </div>

      {/* Status text */}
      <div className="absolute bottom-20 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] sm:text-xs text-[#14FE17] font-mono tracking-[0.3em] fallout-glow-subtle"
        >
          {phase === 'wheel' ? '▌ОТКРЫТИЕ ДВЕРИ УБЕЖИЩА...' : '▌ДОБРО ПОЖАЛОВАТЬ В УБЕЖИЩЕ №18'}
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================
   RADIOACTIVE PARTICLES
   ============================================================ */
function RadioactiveParticles() {
  // Hard-coded particle values to avoid SSR/client hydration mismatch
  // (Math.sin produces slightly different results between Node.js and browser)
  const particles = useMemo(() => [
    { id: 0, left: '12%', size: 3, duration: 8, delay: 0, opacity: 0.25, drift: -10 },
    { id: 1, left: '45%', size: 4, duration: 10, delay: 2, opacity: 0.3, drift: 15 },
    { id: 2, left: '78%', size: 2, duration: 7, delay: 4, opacity: 0.2, drift: -20 },
    { id: 3, left: '23%', size: 5, duration: 12, delay: 1, opacity: 0.35, drift: 8 },
    { id: 4, left: '67%', size: 3, duration: 9, delay: 3, opacity: 0.2, drift: -15 },
    { id: 5, left: '91%', size: 4, duration: 11, delay: 5, opacity: 0.3, drift: 12 },
    { id: 6, left: '34%', size: 2, duration: 8, delay: 7, opacity: 0.15, drift: -25 },
    { id: 7, left: '56%', size: 5, duration: 13, delay: 2, opacity: 0.4, drift: 5 },
    { id: 8, left: '8%', size: 3, duration: 9, delay: 6, opacity: 0.25, drift: -8 },
    { id: 9, left: '82%', size: 4, duration: 10, delay: 1, opacity: 0.3, drift: 20 },
    { id: 10, left: '19%', size: 2, duration: 7, delay: 8, opacity: 0.2, drift: -12 },
    { id: 11, left: '51%', size: 6, duration: 14, delay: 3, opacity: 0.35, drift: 10 },
    { id: 12, left: '73%', size: 3, duration: 8, delay: 5, opacity: 0.25, drift: -18 },
    { id: 13, left: '39%', size: 4, duration: 11, delay: 0, opacity: 0.3, drift: 7 },
    { id: 14, left: '95%', size: 2, duration: 9, delay: 9, opacity: 0.2, drift: -5 },
    { id: 15, left: '27%', size: 5, duration: 12, delay: 4, opacity: 0.35, drift: 15 },
    { id: 16, left: '61%', size: 3, duration: 8, delay: 6, opacity: 0.25, drift: -22 },
    { id: 17, left: '14%', size: 4, duration: 10, delay: 2, opacity: 0.3, drift: 3 },
    { id: 18, left: '88%', size: 2, duration: 7, delay: 7, opacity: 0.15, drift: -14 },
    { id: 19, left: '48%', size: 5, duration: 13, delay: 1, opacity: 0.4, drift: 18 },
  ], []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden" suppressHydrationWarning>
      {particles.map(p => (
        <div
          key={p.id}
          className="radioactive-particle absolute rounded-full bg-[#14FE17]"
          style={{
            left: p.left,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            '--particle-duration': `${p.duration}s`,
            '--particle-delay': `${p.delay}s`,
            '--particle-opacity': p.opacity,
            '--particle-drift': `${p.drift}px`,
            boxShadow: `0 0 ${p.size * 2}px #14FE1740`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ============================================================
   SCREEN FLICKER EFFECT
   ============================================================ */
function ScreenFlicker() {
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    const triggerFlicker = () => {
      setFlicker(true);
      setTimeout(() => setFlicker(false), 80);
      const next = 10000 + Math.random() * 10000;
      setTimeout(triggerFlicker, next);
    };
    const initial = 5000 + Math.random() * 10000;
    const timer = setTimeout(triggerFlicker, initial);
    return () => clearTimeout(timer);
  }, []);

  if (!flicker) return null;
  return <div className="fixed inset-0 z-[99] bg-[#14FE1705] pointer-events-none" />;
}



/* ============================================================
   BOOT MEMORY COUNTER (animated 0→65536)
   ============================================================ */
function MemoryCounterLine({ bootStep }: { bootStep: number }) {
  const [memoryCount, setMemoryCount] = useState(0);
  const [done, setDone] = useState(false);

  // Start counting when boot step reaches the memory line (line index 6 in BOOT_LINES)
  useEffect(() => {
    if (bootStep < 6) return;

    const target = 65536;
    const steps = 20;
    const increment = Math.floor(target / steps);
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        setDone(true);
        clearInterval(interval);
      }
      setMemoryCount(current);
    }, 30);

    return () => clearInterval(interval);
  }, [bootStep]);

  if (bootStep < 6) return null;

  return (
    <div className="text-[#14FE17] font-mono whitespace-pre">
      ПРОВЕРКА ПАМЯТИ: {String(memoryCount).padStart(5, ' ')}K{done ? ' OK' : ''}
    </div>
  );
}

/* ============================================================
   BOOT SCREEN
   ============================================================ */
function BootScreen({ onComplete }: { onComplete: () => void }) {
  const { displayedLines, currentText, isComplete } = useTypewriter(BOOT_LINES, 25);
  const hasCompleted = useRef(false);
  const [systemReady, setSystemReady] = useState(false);
  const [skipPulse, setSkipPulse] = useState(false);

  const progress = Math.min(100, (displayedLines.length / BOOT_LINES.length) * 100);

  useEffect(() => {
    if (isComplete && !hasCompleted.current) {
      hasCompleted.current = true;
      // Show SYSTEM READY flash after a tick (not synchronous setState)
      setTimeout(() => {
        setSystemReady(true);
        setTimeout(() => setSystemReady(false), 800);
      }, 0);
      const timer = setTimeout(onComplete, 1800);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  // Pulse skip button after 3 seconds to draw attention
  useEffect(() => {
    const timer = setTimeout(() => setSkipPulse(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex flex-col justify-end p-4 sm:p-8 overflow-hidden relative">
      <div className="scanline-overlay" />
      <div className="crt-overlay" />

      {/* SYSTEM READY flash */}
      {systemReady && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1, 0] }}
          transition={{ duration: 0.8, times: [0, 0.15, 0.3, 0.6, 1] }}
          className="fixed inset-0 z-[100] bg-[#14FE1710] pointer-events-none flex items-center justify-center"
        >
          <div className="text-[#14FE17] font-mono text-lg sm:text-2xl tracking-[0.3em] fallout-glow">
            ▌SYSTEM READY▌
          </div>
        </motion.div>
      )}

      <button
        onClick={onComplete}
        className={`absolute top-3 right-3 z-20 pixel-border px-2 py-0.5 bg-[#0A0A0A90] backdrop-blur-sm
                   text-[#0B8C0D] font-mono text-[7px] sm:text-[8px] tracking-wider
                   hover:text-[#14FE17] hover:border-[#14FE17] transition-all duration-300 active:scale-[0.97]${skipPulse ? ' skip-btn-pulse' : ''}`}
      >
        ПРОПУСТИТЬ ▶▶
      </button>

      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-20 sm:h-20 opacity-10">
        <NuclearBlastSVG className="w-full h-full text-[#14FE17]" />
      </div>

      <div className="absolute top-3 left-3 sm:top-6 sm:left-6">
        <div className="flex items-center gap-2">
          <RadiationSVG className="w-5 h-5 sm:w-7 sm:h-7 text-[#0B8C0D] opacity-60" />
          <div>
            <div className="text-[8px] sm:text-[10px] text-[#0B8C0D] font-mono tracking-[0.2em]">VAULT-TEC™</div>
            <div className="text-[6px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider opacity-50">УБЕЖИЩЕ №18</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end max-w-2xl mx-auto w-full">
        <div className="space-y-[1px] text-[9px] sm:text-[11px] leading-[1.4]">
          {displayedLines.map((line, i) => (
            <div key={i} className={`font-mono whitespace-pre ${i === 0 ? 'text-[#F1AC43] text-[8px] sm:text-[9px] tracking-wider' : 'text-[#14FE17]'}`}>
              {i === 6 ? (
                <MemoryCounterLine bootStep={displayedLines.length} />
              ) : i === 0 ? line : line}
            </div>
          ))}
          {currentText && (
            <div className="text-[#14FE17] font-mono whitespace-pre">
              {currentText}
              <span className="terminal-cursor">█</span>
            </div>
          )}
        </div>

        <div className="mt-4 w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono">СИСТЕМА УБЕЖИЩА</span>
            <span className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-[3px] sm:h-1 bg-[#0D1A0D] border border-[#14FE1740] overflow-hidden">
            <motion.div
              className="h-full progress-gradient"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between opacity-30">
        <div className="flex items-center gap-1">
          <RadiationSVG className="w-3 h-3 text-[#0B8C0D]" />
          <span className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono">РАДИАЦИЯ: 0.03 ЗВ/Ч</span>
        </div>
        <span className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono">КРИМИНАЛЬНЫЙ РОСТОВ</span>
      </div>
    </div>
  );
}

/* ============================================================
   ENCRYPTED MESSAGE SCREEN
   ============================================================ */
function EncryptedScreen({ onAccept }: { onAccept: () => void }) {
  const [scrambledText, setScrambledText] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [flashShow, setFlashShow] = useState(false);
  const [glitchReveal, setGlitchReveal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [borderPulseSpeed, setBorderPulseSpeed] = useState(2);
  const targetText = '▶ ВХОДЯЩЕЕ СООБЩЕНИЕ — УБЕЖИЩЕ №18 ◀';
  const subtitleText = 'ПРИНЯТЬ СООБЩЕНИЕ ОТ VAULT-TEC?';
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sound wave bars state
  const [waveHeights, setWaveHeights] = useState<number[]>(Array.from({ length: 14 }, (_, i) => 8 + i * 3));

  const handleAccept = useCallback(() => {
    setIsRevealed(true);
    setScrambledText(targetText);
    setFlashShow(true);
    playTerminalBeep();
    setTimeout(() => setFlashShow(false), 1500);
    setTimeout(() => onAccept(), 2000);
  }, [onAccept, targetText]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (isRevealed) return;
      const result = targetText.split('').map((char) => {
        if (char === ' ' || char === '▶' || char === '◀' || char === '—') return char;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join('');
      setScrambledText(result);

      // Animate wave heights
      setWaveHeights(Array.from({ length: 14 }, () => 5 + Math.floor(Math.random() * 25)));
    }, 50);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRevealed, targetText]);

  // Glitch reveal effect - briefly show correct text
  useEffect(() => {
    if (isRevealed) return;
    const scheduleGlitch = () => {
      const delay = 2000 + Math.random() * 3000;
      const timer = setTimeout(() => {
        setGlitchReveal(true);
        setTimeout(() => setGlitchReveal(false), 100);
        scheduleGlitch();
      }, delay);
      return timer;
    };
    const timer = scheduleGlitch();
    return () => clearTimeout(timer);
  }, [isRevealed]);

  // Countdown timer - auto-accept at 0
  useEffect(() => {
    if (isRevealed) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAccept();
          return 0;
        }
        // Speed up border pulse as countdown decreases
        setBorderPulseSpeed(Math.max(0.3, prev / 30));
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRevealed, handleAccept]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="scanline-overlay" />
      <div className="crt-overlay" />
      <NuclearFlash show={flashShow} />
      <MatrixRain />

      {/* Data stream columns - left side */}
      <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 flex gap-[2px] overflow-hidden opacity-20">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} className="flex-1 overflow-hidden">
            {Array.from({ length: 30 }).map((_, row) => (
              <div key={row} className="text-[6px] sm:text-[8px] text-[#14FE17] font-mono leading-[1.2] encrypted-data-char"
                style={{ animationDelay: `${(row * 0.1 + col * 0.5)}s` }}
              >
                {SCRAMBLE_CHARS[(row * 7 + col * 13) % SCRAMBLE_CHARS.length]}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Data stream columns - right side */}
      <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-8 flex gap-[2px] overflow-hidden opacity-20">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} className="flex-1 overflow-hidden">
            {Array.from({ length: 30 }).map((_, row) => (
              <div key={row} className="text-[6px] sm:text-[8px] text-[#14FE17] font-mono leading-[1.2] encrypted-data-char"
                style={{ animationDelay: `${(row * 0.15 + col * 0.3)}s` }}
              >
                {SCRAMBLE_CHARS[(row * 11 + col * 7 + 20) % SCRAMBLE_CHARS.length]}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <NuclearBlastSVG className="w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] text-[#14FE17] flicker" />
      </div>

      <motion.div
        initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 360, scale: 1, opacity: 0.1 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute w-56 h-56 sm:w-80 sm:h-80"
      >
        <img src="/vault-door.png" alt="" className="w-full h-full object-contain" />
      </motion.div>

      <div className="relative z-10 text-center max-w-[340px] sm:max-w-md w-full">
        {/* Pulsing border card */}
        <div className="encrypted-pulse-border p-4 sm:p-6" style={{ '--pulse-speed': `${borderPulseSpeed}s` } as React.CSSProperties}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
            className="mx-auto mb-5 sm:mb-8 w-16 h-16 sm:w-24 sm:h-24 relative"
          >
            {/* Pulsing glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#14FE17]"
              animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#14FE17]"
              animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#14FE17]"
              animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 1 }}
            />
            <RadiationSVG className="w-full h-full text-[#14FE17] pulse-glow relative z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-block pixel-border bg-[#0D1A0D] px-3 py-1 mb-4"
          >
            <span className="text-[8px] sm:text-[10px] text-[#F1AC43] font-mono tracking-[0.3em]">🔒 ЗАШИФРОВАНО</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className={`text-[#14FE17] text-[11px] sm:text-base font-mono mb-2 tracking-wider ${glitchReveal ? '' : 'glitch-text'}`}>
              {glitchReveal ? targetText : scrambledText}
            </div>
            <div className="text-[#0B8C0D] text-[10px] sm:text-xs font-mono mb-6 sm:mb-8 tracking-wide">
              {subtitleText}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pixel-border bg-[#0A0A0A] p-2 mb-5 sm:mb-8 overflow-hidden"
          >
            <div className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono space-y-0.5 text-left">
              <div>ШИФР: AES-256-VAULT <span className="text-[#14FE17]">АКТИВЕН</span></div>
              <div>КЛЮЧ: <span className="terminal-cursor">████████</span></div>
              <div>ОТПРАВИТЕЛЬ: VAULT-TEC HQ</div>
              <div>ПОЛУЧАТЕЛЬ: ЖИТЕЛЬ УБЕЖИЩА №18</div>
              <div>ПРИОРИТЕТ: <span className="text-[#F1AC43]">ВЫСОКИЙ</span></div>
            </div>
          </motion.div>

          {/* Sound wave visualization */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center items-end gap-[2px] mb-4 sm:mb-6"
          >
            {waveHeights.map((h, i) => (
              <motion.div
                key={i}
                className="w-[3px] bg-[#14FE17] rounded-[1px]"
                style={{ height: `${h}px` }}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }}
              />
            ))}
          </motion.div>

          {/* Countdown timer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mb-4 sm:mb-6"
          >
            <div className="text-[7px] sm:text-[8px] text-[#F1AC43] font-mono tracking-wider">
              ОБРАТНЫЙ ОТСЧЁТ: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, type: 'spring' }}
            onClick={handleAccept}
            className="pixel-border-bright px-6 sm:px-10 py-3 sm:py-4 bg-[#0D1A0D] text-[#14FE17] font-mono text-[12px] sm:text-sm tracking-[0.3em]
                       hover:bg-[#14FE17] hover:text-[#050505] transition-all duration-300 active:scale-[0.97]
                       fallout-glow-subtle w-full sm:w-auto"
          >
            [ ПРИНЯТЬ ]
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.8 }}
            className="mt-4 space-y-0.5"
          >
            <p className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono">
              VAULT-TEC™ — ВАША БЕЗОПАСНОСТЬ — НАШ ПРИОРИТЕТ
            </p>
            <p className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono opacity-60">
              ОТКАЗ ОТ ПРИНЯТИЯ НЕ РЕКОМЕНДУЕТСЯ
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MATRIX RAIN EFFECT
   ============================================================ */
function MatrixRain() {
  // Fixed values to avoid hydration mismatch from Math.random()
  const columns = useMemo(() => [
    { left: '0%', duration: '4s', delay: '0s', chars: '█▓░╔╗╚╝║═╬╠╣╦╩▀▄⌐¬≡≈∞0123456789ABCDEF@#$%&*!?' },
    { left: '6.67%', duration: '5s', delay: '1s', chars: '▓░▒╚╝║═╬╠╣╦╩▀⌐¬≡∞∑∏∫⊂⊃∩0123456789АБВГДЕЖЗИКЛМН' },
    { left: '13.33%', duration: '3.5s', delay: '2.5s', chars: '░▒╔╗╚╝║═╬╠╣╦╩▀▄⌐≡≈∞∑∏⊂⊃∩∪ABCDEF@#$%&*!?<>{}[]' },
    { left: '20%', duration: '6s', delay: '0.5s', chars: '█▓░╔╗╚╝║═╬╠╣╦▀▄⌐¬≡≈∞∑∏∫⊂0123456789АБВГДЕЖЗИКЛМ' },
    { left: '26.67%', duration: '4.5s', delay: '3s', chars: '▒╔╗╚╝║═╬╠╣╦╩▀▄⌐¬≡∞∑∏∫⊂⊃∩∪0123456789ABCDEF@#$%&' },
    { left: '33.33%', duration: '5.5s', delay: '1.5s', chars: '█▓░╔╗╚╝║═╬╠╣╦╩▀▄⌐¬≡≈∞∑∏∩∪ABCDEF@#$%&*!?<>{}[]ОПР' },
    { left: '40%', duration: '4s', delay: '2s', chars: '▓░▒╔╗╚╝║═╬╠╣╦╩▀⌐¬≡≈∞0123456789АБВГДЕЖЗИКЛМНОПРСТ' },
    { left: '46.67%', duration: '6.5s', delay: '0s', chars: '░▒╔╗╚╝║═╬╠╣╦╩▀▄⌐≡≈∞∑∏⊂⊃∩∪0123456789ABCDEF@#$%&' },
    { left: '53.33%', duration: '3.8s', delay: '1s', chars: '█▓░╔╗╚╝║═╬╠╣╦╩▀▄⌐¬≡≈∞∑∏∩∪ABCDEF@#$%&*!?<>{}[]УФ' },
    { left: '60%', duration: '5.2s', delay: '3.5s', chars: '▒╔╗╚╝║═╬╠╣╦╩▀▄⌐¬≡∞∑∏∫⊂0123456789АБВГДЕЖЗИКЛМНО' },
    { left: '66.67%', duration: '4.3s', delay: '0.5s', chars: '█▓░╔╗╚╝║═╬╠╣╦╩▀▄⌐¬≡≈∞0123456789ABCDEF@#$%&*!?<>{}' },
    { left: '73.33%', duration: '5.8s', delay: '2s', chars: '▓░▒╔╗╚╝║═╬╠╣╦╩▀⌐¬≡≈∞∑∏∩∪0123456789АБВГДЕЖЗИКЛМН' },
    { left: '80%', duration: '4.1s', delay: '1.5s', chars: '░╔╗╚╝║═╬╠╣╦╩▀▄⌐≡≈∞∑∏⊂⊃∩∪ABCDEF@#$%&*!?<>{}[]ОПР' },
    { left: '86.67%', duration: '6.2s', delay: '3s', chars: '█▓░╔╗╚╝║═╬╠╣╦╩▀▄⌐¬≡≈∞0123456789АБВГДЕЖЗИКЛМНОП' },
    { left: '93.33%', duration: '3.6s', delay: '0s', chars: '▒╔╗╚╝║═╬╠╣╦╩▀▄⌐¬≡∞∑∏∩∪0123456789ABCDEF@#$%&*!?' },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.06]">
      {columns.map((col, i) => (
        <div
          key={i}
          className="matrix-column absolute top-0 text-[#14FE17] font-mono text-[9px] leading-[14px] whitespace-pre"
          style={{
            left: col.left,
            '--matrix-duration': col.duration,
            '--matrix-delay': col.delay,
          } as React.CSSProperties}
        >
          {col.chars.split('').map((char, j) => (
            <div key={j}>{char}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   PIP-BOY STATUS BAR (with triple-tap easter egg on radiation icon)
   ============================================================ */
function PipBoyStatusBar({ onTripleTap }: { onTripleTap: () => void }) {
  const [time, setTime] = useState('');
  const tapTimes = useRef<number[]>([]);
  const [clearanceLevel, setClearanceLevel] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate clearance level from achievements
  useEffect(() => {
    const calcClearance = () => {
      const count = ACHIEVEMENTS.filter(a => a.check()).length;
      if (count === 0) return 0;
      if (count <= 2) return 1;
      if (count <= 4) return 2;
      if (count <= 6) return 3;
      return 4;
    };
    // Initial read via setTimeout to avoid synchronous setState in effect
    setTimeout(() => setClearanceLevel(calcClearance()), 0);
    const interval = setInterval(() => setClearanceLevel(calcClearance()), 5000);
    return () => clearInterval(interval);
  }, []);

  const clearanceFillPct = clearanceLevel === 0 ? 0 : (clearanceLevel / 4) * 100;
  const clearanceColor = clearanceLevel >= 4 ? '#14FE17' : clearanceLevel === 3 ? '#F1AC43' : '#14FE17';
  const clearanceGlow = clearanceLevel >= 4 ? '0 0 6px #14FE17, 0 0 12px #14FE1780' : clearanceLevel === 3 ? '0 0 4px #F1AC43' : 'none';

  const stats = [
    { label: 'СИЛ', value: 70 },
    { label: 'ВОС', value: 85 },
    { label: 'ВЫН', value: 60 },
    { label: 'ХАР', value: 90 },
    { label: 'ИНТ', value: 75 },
    { label: 'ЛОВ', value: 65 },
    { label: 'УДЧ', value: 80 },
  ];

  const handleRadiationTap = useCallback(() => {
    const now = Date.now();
    tapTimes.current.push(now);
    // Keep only last 3 taps
    if (tapTimes.current.length > 3) {
      tapTimes.current = tapTimes.current.slice(-3);
    }
    // Check if 3 taps within 800ms
    if (tapTimes.current.length === 3) {
      const diff = tapTimes.current[2] - tapTimes.current[0];
      if (diff < 800) {
        tapTimes.current = [];
        onTripleTap();
      }
    }
  }, [onTripleTap]);

  return (
    <div className="pixel-border bg-[#0A0A0A] px-2 py-1.5 sm:px-3 sm:py-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRadiationTap}
            className="touch-manipulation"
            aria-label="Radiation icon"
          >
            <RadiationSVG className="w-3 h-3 text-[#14FE17]" />
          </button>
          <span className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono tracking-wider font-bold">PIP-BOY 3000</span>
        </div>
        <div className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono">{time}</div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#14FE17] animate-pulse" />
          <span className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono">УБЕЖИЩЕ №18</span>
        </div>
      </div>
      <div className="flex gap-1 overflow-hidden">
        {stats.map(stat => (
          <div key={stat.label} className="flex-1 min-w-0">
            <div className="text-[5px] sm:text-[6px] text-[#0B8C0D] font-mono text-center">{stat.label}</div>
            <div className="h-[3px] sm:h-1 bg-[#0D1A0D] border border-[#14FE1720] overflow-hidden">
              <div
                className="stat-bar-fill h-full bg-[#14FE17]"
                style={{ width: `${stat.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Clearance Level */}
      <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-[#14FE1715]">
        <span className="text-[5px] sm:text-[6px] text-[#0B8C0D] font-mono tracking-wider shrink-0">УР. ДОПУСКА:</span>
        <span
          className="text-[6px] sm:text-[7px] font-mono font-bold shrink-0 clearance-level-anim"
          style={{ color: clearanceColor, textShadow: clearanceGlow }}
        >
          {clearanceLevel}
        </span>
        <div className="flex-1 h-[3px] bg-[#0D1A0D] border border-[#14FE1520] overflow-hidden">
          <div
            className="h-full clearance-bar-fill transition-all duration-700 ease-out"
            style={{ width: `${clearanceFillPct}%`, backgroundColor: clearanceColor, boxShadow: clearanceGlow }}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NEWS TICKER
   ============================================================ */
function NewsTicker() {
  const news = [
    '⚡ VAULT-TEC: УБЕЖИЩЕ №18 ОТКРЫВАЕТ ДВЕРИ ДЛЯ ПРАЗДНОВАНИЯ ДНЯ РОЖДЕНИЯ МАКАРОВА АНДРЕЯ • 29 ЛЕТ НА ПУСТОШИ •',
    '☢ КРИМИНАЛЬНЫЙ РОСТОВ: УРОВЕНЬ РАДИАЦИИ СТАБИЛЬНЫЙ • 0.03 ЗВ/Ч • МАРШРУТ К УБЕЖИЩУ БЕЗОПАСЕН •',
    '🟢 COUNTRY LAKE: СИСТЕМА ЖИЗНЕОБЕСПЕЧЕНИЯ НОРМА • ВЕНТИЛЯЦИЯ АКТИВНА • ДВЕРИ ЗАПЕРТЫ •',
    '📋 ПРИГЛАШЕНИЕ АКТИВНО • ЯВКА ОБЯЗАТЕЛЬНА • БЛАГОДАРИМ КОМПАНИЮ VAULT-TEC •',
  ];

  return (
    <div className="pixel-border bg-[#0A0A0A] overflow-hidden h-5 sm:h-6 flex items-center">
      <div className="shrink-0 bg-[#14FE17] text-[#050505] font-mono text-[6px] sm:text-[7px] font-bold px-1.5 py-0.5 tracking-wider">
        НОВОСТИ
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-scroll whitespace-nowrap text-[7px] sm:text-[8px] text-[#14FE17] font-mono">
          {news.join(' ')}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MUSIC PLAYER (with equalizer)
   ============================================================ */
function MusicPlayer({ position = 'left' }: { position?: 'left' | 'right' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/audio/basta-urban.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.35;
    return () => { audioRef.current?.pause(); };
  }, []);

  const toggle = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
      localStorage.setItem('vault18-music', 'true');
    }
    setIsPlaying(!isPlaying);
    playClickBeep();
  }, [isPlaying]);

  const posClass = position === 'left' ? 'left-3' : 'right-3';

  return (
    <div className={`fixed top-3 ${posClass} z-50 flex items-center gap-1`}>
      {isPlaying && (
        <div className="flex items-end gap-[2px] h-4">
          {[0.3, 0.5, 0.35, 0.6, 0.4].map((speed, i) => (
            <div
              key={i}
              className="eq-bar w-[2px] bg-[#14FE17] rounded-[1px]"
              style={{
                '--eq-speed': `${speed}s`,
                '--eq-delay': `${i * 0.1}s`,
                '--eq-max-height': `${6 + i * 2}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
      <button
        onClick={toggle}
        className="pixel-border px-2 py-1 sm:px-3 sm:py-1.5 bg-[#0A0A0A90] backdrop-blur-sm
                   text-[#14FE17] font-mono text-[8px] sm:text-[10px] tracking-wider
                   hover:bg-[#14FE17] hover:text-[#050505] transition-all duration-300 active:scale-[0.97]"
      >
        {isPlaying ? '🔊 SND' : '🔇 SND'}
      </button>
    </div>
  );
}

/* ============================================================
   SOUND TOGGLE (next to music)
   ============================================================ */
function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  // Read from localStorage without triggering lint violation
  const storedEnabled = typeof window !== 'undefined'
    ? (localStorage.getItem('vault18-sound') ?? 'true') === 'true'
    : true;
  const effectiveEnabled = enabled && storedEnabled;

  const toggle = useCallback(() => {
    const newVal = !enabled;
    setEnabled(newVal);
    localStorage.setItem('vault18-sound', String(newVal));
  }, [enabled]);

  useEffect(() => {
    (window as Record<string, unknown>).__vaultSound = effectiveEnabled;
  }, [enabled]);

  return (
    <button
      onClick={toggle}
      className="pixel-border px-1.5 py-1 sm:px-2 sm:py-1.5 bg-[#0A0A0A90] backdrop-blur-sm
                 text-[#14FE17] font-mono text-[7px] sm:text-[9px] tracking-wider
                 hover:bg-[#14FE17] hover:text-[#050505] transition-all duration-300 active:scale-[0.97]"
    >
      {effectiveEnabled ? '🔉' : '🔇'}
    </button>
  );
}

/* ============================================================
   NAVIGATION BAR
   ============================================================ */
function NavBar({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const items: { id: Screen; icon: string; label: string; order: number; sound: () => void }[] = [
    { id: 'main', icon: '☢', label: 'ПРИГЛ.', order: 0, sound: () => playClickBeep() },
    { id: 'location', icon: '🗺', label: 'КАРТА', order: 1, sound: () => playBeep(900, 0.08, 0.06) },
    { id: 'chat', icon: '🤖', label: 'ВОЛТ.', order: 2, sound: () => playBeep(1400, 0.06, 0.05) },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A] border-t-2 border-[#14FE1740]">
      <div className="flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)] max-w-2xl mx-auto">
        {items.map(item => {
          const isActive = screen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setScreen(item.id); item.sound(); }}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 relative
                         font-mono text-[9px] tracking-wider transition-all duration-200
                         ${isActive
                           ? 'text-[#14FE17] fallout-glow-subtle'
                           : 'text-[#0B8C0D] hover:text-[#14FE17] active:text-[#14FE17]'}`}
            >
              {/* Animated dot above active icon */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute top-0.5 w-1 h-1 rounded-full bg-[#14FE17] nav-dot-active"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-1 w-8 h-[2px] bg-[#14FE17] nav-active-glow"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ============================================================
   COUNTDOWN TIMER (enhanced with pulsing radiation & flip-clock)
   ============================================================ */
function CountdownTimer() {
  const { days, hours, minutes, seconds, isPast } = useCountdown(BIRTHDAY_DATE);

  // Determine pulse speed based on proximity
  const now = new Date();
  const diff = BIRTHDAY_DATE.getTime() - now.getTime();
  const daysUntil = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const pulseClass = daysUntil <= 7 ? 'radiation-pulse-fast' : daysUntil <= 30 ? 'radiation-pulse-medium' : 'radiation-pulse-slow';

  const units = [
    { label: 'ДНЕЙ', value: days, key: 'days' },
    { label: 'ЧАСОВ', value: hours, key: 'hours' },
    { label: 'МИНУТ', value: minutes, key: 'minutes' },
    { label: 'СЕКУНД', value: seconds, key: 'seconds' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: 0.2 }}
      className="timer-glow-bg pixel-border countdown-glow bg-[#0A0A0A] p-3 sm:p-4 relative card-hover-lift"
    >
      <div className="text-center text-[8px] sm:text-[10px] text-[#0B8C0D] font-mono tracking-[0.2em] mb-2 flex items-center justify-center gap-1.5">
        <RadiationSVG className={`w-3 h-3 sm:w-4 sm:h-4 text-[#14FE17] ${pulseClass}`} />
        <span>{isPast ? 'УБЕЖИЩЕ ОТКРЫТО!' : 'ОБРАТНЫЙ ОТСЧЁТ ДО ДНЯ РОЖДЕНИЯ'}</span>
        <RadiationSVG className={`w-3 h-3 sm:w-4 sm:h-4 text-[#14FE17] ${pulseClass}`} />
      </div>
      <div className="flex justify-center gap-2 sm:gap-3">
        {units.map(u => (
            <div key={u.label} className="text-center">
              <div className="pixel-border bg-[#0D1A0D] px-2 py-1.5 sm:px-3 sm:py-2">
                <motion.span
                  key={`${u.key}-${u.value}`}
                  initial={{ scaleY: 0.8, opacity: 0.5 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="text-[18px] sm:text-2xl font-mono font-bold text-[#14FE17] fallout-glow-subtle countdown-digit-glow inline-block"
                >
                  {String(u.value).padStart(2, '0')}
                </motion.span>
              </div>
              <div className="text-[5px] sm:text-[6px] text-[#0B8C0D] font-mono tracking-wider mt-1">
                {u.label}
              </div>
            </div>
        ))}
      </div>
      {!isPast && (
        <div className="text-center text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider mt-2 opacity-60">
          ДЕНЬ РОЖДЕНИЯ: 30 МАЯ 2026
        </div>
      )}
      {isPast && (
        <div className="text-center text-[9px] sm:text-[11px] text-[#14FE17] font-mono fallout-glow-subtle mt-2">
          🎉 С ДНЁМ РОЖДЕНИЯ, АНДРЕЙ! 🎉
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================
   RSVP BUTTON
   ============================================================ */
function RSVPSection({ onConfirm }: { onConfirm?: () => void }) {
  const { confirmed, flashShow, confirmRSVP } = useRSVP();

  const handleConfirm = useCallback(() => {
    confirmRSVP();
    onConfirm?.();
  }, [confirmRSVP, onConfirm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <NuclearFlash show={flashShow} />

      {confirmed ? (
        <div className="pixel-border-bright rsvp-shimmer bg-[#0D1A0D] px-4 py-3 sm:py-4 text-center">
          <div className="text-[10px] sm:text-xs text-[#14FE17] font-mono tracking-wider fallout-glow-subtle">
            ✓ ЯВКА ПОДТВЕРЖДЕНА • УБЕЖИЩЕ №18
          </div>
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          className="w-full pixel-border-bright px-4 py-3 sm:py-4 bg-[#0D1A0D] text-[#14FE17] font-mono
                     text-[10px] sm:text-xs tracking-[0.3em] hover:bg-[#14FE17] hover:text-[#050505]
                     transition-all duration-300 active:scale-[0.98] fallout-glow-subtle"
        >
          ☢ ПОДТВЕРДИТЬ ЯВКУ ☢
        </button>
      )}
    </motion.div>
  );
}

/* ============================================================
   VAULT-TEC SEAL WATERMARK
   ============================================================ */
function VaultTecSeal() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="vault-seal-rotate opacity-[0.03]">
        <svg viewBox="0 0 200 200" className="w-64 h-64 sm:w-96 sm:h-96" fill="none" stroke="#14FE17" strokeWidth="1">
          <circle cx="100" cy="100" r="95" />
          <circle cx="100" cy="100" r="85" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 100 + 85 * Math.cos(angle);
            const y1 = 100 + 85 * Math.sin(angle);
            const x2 = 100 + 95 * Math.cos(angle);
            const y2 = 100 + 95 * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
          <circle cx="100" cy="100" r="15" />
          <text x="100" y="75" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#14FE17" stroke="none">VAULT-TEC</text>
          <text x="100" y="135" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#14FE17" stroke="none">№18</text>
          <path d="M100 85 L110 100 L90 100Z" fill="#14FE17" opacity="0.5" />
          <path d="M85 110 L100 100 L95 115Z" fill="#14FE17" opacity="0.5" />
          <path d="M115 110 L100 100 L105 115Z" fill="#14FE17" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

/* ============================================================
   INVITATION CARD SCAN LINE
   ============================================================ */
function CardScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="card-scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14FE1740] to-transparent"
      />
    </div>
  );
}

/* ============================================================
   VAULT BOY SPEECH BUBBLE
   ============================================================ */
function VaultBoySpeechBubble() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % SPEECH_MESSAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          initial={{ opacity: 0, y: 4, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="pixel-border bg-[#0A0A0A] px-2 py-0.5 whitespace-nowrap"
        >
          <span className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono tracking-wider">
            {SPEECH_MESSAGES[msgIndex]}
          </span>
          {/* Speech bubble tail */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0
                          border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#14FE17]" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   PHOTO GALLERY SECTION
   ============================================================ */
function PhotoGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: 0.7 }}
      className="pixel-border bg-[#0A0A0A] p-3 sm:p-4 card-hover-lift"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2.5 border-b border-[#14FE1730] pb-1.5 flex items-center gap-2">
        <span>▌ПРЕВЬЮ МЕРОПРИЯТИЯ</span>
        <span className="badge-new-glow inline-block pixel-border bg-[#14FE17] text-[#050505] font-mono text-[6px] sm:text-[7px] font-bold px-1.5 py-0.5 tracking-wider">
          NEW
        </span>
      </div>

      {/* Mobile: horizontal scroll snap */}
      <div
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 lg:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {GALLERY_IMAGES.map((img, i) => (
          <div
            key={i}
            className="snap-center shrink-0 w-[85%] relative group cursor-pointer"
            onTouchStart={() => setActiveIndex(i)}
            onClick={() => setLightboxIndex(i)}
          >
            <div className="pixel-border bg-[#0D1A0D] overflow-hidden relative">
              {/* Scan line effect */}
              <div className="gallery-img-scan" />
              {/* Green tint overlay */}
              <div className="gallery-green-overlay" />
              <img
                src={img.src}
                alt={img.caption}
                className="w-full h-32 sm:h-40 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Caption overlay with scanline */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#050505E6] to-transparent px-2 py-1.5 gallery-caption-scanline">
                <span className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono tracking-wider fallout-glow-subtle">
                  {img.caption}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile VIEWING counter */}
      <div className="flex items-center justify-center gap-1 mt-1 lg:hidden">
        <span className="text-[6px] text-[#0B8C0D] font-mono tracking-wider">VIEWING: {activeIndex + 1}/{GALLERY_IMAGES.length}</span>
      </div>

      {/* Desktop: 2x2 grid */}
      <div className="hidden lg:grid grid-cols-2 gap-2">
        {GALLERY_IMAGES.map((img, i) => (
          <div key={i} className="relative group cursor-pointer" onClick={() => setLightboxIndex(i)}>
            <div className="pixel-border bg-[#0D1A0D] overflow-hidden relative">
              {/* Scan line effect */}
              <div className="gallery-img-scan" style={{ animationDelay: `${i * 0.5}s` }} />
              {/* Green tint overlay */}
              <div className="gallery-green-overlay" />
              <img
                src={img.src}
                alt={img.caption}
                className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Caption overlay with scanline */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#050505E6] to-transparent px-2 py-1.5 gallery-caption-scanline">
                <span className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono tracking-wider fallout-glow-subtle">
                  {img.caption}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile navigation dots */}
      <div className="flex justify-center gap-1.5 mt-1.5 lg:hidden">
        {GALLERY_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              i === activeIndex ? 'bg-[#14FE17] w-4 gallery-dot-active' : 'bg-[#0B8C0D]'
            }`}
          />
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <GalleryLightbox
            images={GALLERY_IMAGES}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ============================================================
   VAULT BOY PARALLAX (with scroll-based transform)
   ============================================================ */
function VaultBoyParallax() {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      if (rect.top < windowH && rect.bottom > 0) {
        const progress = (windowH - rect.top) / (windowH + rect.height);
        setOffset((progress - 0.5) * 15);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, type: 'spring' }}
      className="flex justify-center"
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className="relative">
        <VaultBoySpeechBubble />
        <img src="/vault-boy.png" alt="Vault Boy" className="w-24 h-24 sm:w-36 sm:h-36 object-contain" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 pixel-border bg-[#0A0A0A] px-2 py-0.5"
        >
          <span className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono whitespace-nowrap">
            ВОЛТБОЙ УТВЕРЖДАЕТ ✓
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HOLOTAPE SVG DECORATION
   ============================================================ */
function HolotapeSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 30" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      {/* Cassette body */}
      <rect x="2" y="5" width="36" height="20" rx="2" />
      {/* Reel holes */}
      <circle cx="12" cy="15" r="5" />
      <circle cx="28" cy="15" r="5" />
      {/* Reel inner circles */}
      <circle cx="12" cy="15" r="2" />
      <circle cx="28" cy="15" r="2" />
      {/* Tape window */}
      <rect x="16" y="8" width="8" height="6" rx="1" opacity="0.5" />
      {/* Label area */}
      <line x1="6" y1="22" x2="34" y2="22" opacity="0.3" />
      <line x1="6" y1="19" x2="34" y2="19" opacity="0.2" />
    </svg>
  );
}

/* ============================================================
   PERK SELECTION SECTION
   ============================================================ */
function PerkSelectionSection() {
  const [selected, setSelected] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('vault18-perks');
    if (stored) {
      try { return JSON.parse(stored) as string[]; } catch { return []; }
    }
    return [];
  });

  const togglePerk = useCallback((id: string) => {
    setSelected(prev => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter(p => p !== id);
      } else if (prev.length < 3) {
        next = [...prev, id];
      } else {
        return prev;
      }
      localStorage.setItem('vault18-perks', JSON.stringify(next));
      playClickBeep();
      return next;
    });
  }, []);

  const selectedPerks = PERKS.filter(p => selected.includes(p.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="pixel-border bg-[#0A0A0A] p-3 sm:p-4 card-hover-lift"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2.5 border-b border-[#14FE1730] pb-1.5 flex items-center justify-between">
        <span>▌ПЕРКИ ЖИТЕЛЯ</span>
        <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-normal tracking-wider">
          {selected.length}/3 ВЫБРАНО
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {PERKS.map((perk, i) => {
          const isSelected = selected.includes(perk.id);
          return (
            <motion.button
              key={perk.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              onClick={() => togglePerk(perk.id)}
              className={`relative pixel-border bg-[#0D1A0D] p-2 sm:p-2.5 text-left transition-all duration-300 active:scale-[0.97]
                ${isSelected ? 'perk-selected border-[#14FE17]' : 'hover:border-[#14FE1780]'}
                ${!isSelected && selected.length >= 3 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={!isSelected && selected.length >= 3}
            >
              {isSelected && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#14FE17] rounded-full flex items-center justify-center z-10">
                  <span className="text-[7px] text-[#050505] font-bold">✓</span>
                </div>
              )}
              <div className="text-base sm:text-lg mb-0.5">{perk.emoji}</div>
              <div className="text-[7px] sm:text-[9px] text-[#14FE17] font-mono font-bold leading-tight mb-0.5">
                {perk.name}
              </div>
              <div className="text-[5px] sm:text-[7px] text-[#0B8C0D] font-mono leading-[1.3]">
                {perk.desc}
              </div>
            </motion.button>
          );
        })}
      </div>

      {selected.length === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 pixel-border-bright bg-[#0D1A0D] px-3 py-2 text-center"
        >
          <div className="text-[8px] sm:text-[10px] text-[#14FE17] font-mono tracking-wider fallout-glow-subtle">
            ВАШИ ПЕРКИ: {selectedPerks.map(p => p.name).join(', ')}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ============================================================
   ATMOSPHERIC RANDOM EVENTS
   ============================================================ */
function RandomEvents() {
  const [event, setEvent] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const lastIndex = useRef(-1);

  useEffect(() => {
    const showEvent = () => {
      let idx: number;
      do {
        idx = Math.floor(Math.random() * RANDOM_EVENTS.length);
      } while (idx === lastIndex.current && RANDOM_EVENTS.length > 1);
      lastIndex.current = idx;
      setEvent(RANDOM_EVENTS[idx]);
      setIsExiting(false);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setEvent(null);
          setIsExiting(false);
        }, 400);
      }, 5000);
    };

    // First event after 5 seconds, then every 15-25 seconds
    const initialDelay = 5000;
    const timer = setTimeout(() => {
      showEvent();
      const interval = setInterval(showEvent, 15000 + Math.random() * 10000);
      return () => clearInterval(interval);
    }, initialDelay);

    return () => clearTimeout(timer);
  }, []);

  if (!event) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-30 pointer-events-none">
      <div className={`max-w-lg mx-auto pixel-border bg-[#0A0A0AE6] backdrop-blur-sm px-3 py-2 ${isExiting ? 'event-toast-exit' : 'event-toast-enter'}`}>
        <div className="text-[8px] sm:text-[10px] text-[#14FE17] font-mono tracking-wider fallout-glow-subtle text-center flex items-center justify-center gap-1.5">
          <span className="toast-radiation-pulse text-[8px]">☢</span>
          {event}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TERMINAL DIVIDER
   ============================================================ */
function TerminalDivider({ icon = '⚡' }: { icon?: string }) {
  return (
    <div className="relative flex items-center justify-center gap-2 py-2 sm:py-3">
      {/* Left line */}
      <div className="relative flex-1 h-[1px] bg-[#14FE1730] overflow-hidden">
        <div className="divider-traveling-light absolute top-0 w-8 h-full bg-gradient-to-r from-transparent via-[#14FE1780] to-transparent" />
      </div>
      {/* Center icon */}
      <span className="divider-icon-pulse text-[10px] sm:text-xs text-[#14FE17]">
        {icon}
      </span>
      {/* Right line */}
      <div className="relative flex-1 h-[1px] bg-[#14FE1730] overflow-hidden">
        <div className="divider-traveling-light absolute top-0 w-8 h-full bg-gradient-to-r from-transparent via-[#14FE1780] to-transparent" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}

/* ============================================================
   FLOATING RADIATION ICONS (Desktop only)
   ============================================================ */
function FloatingRadiationIcons() {
  return (
    <div className="hidden lg:block fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[20%] left-[8%] float-rotate-slow opacity-[0.04]">
        <RadiationSVG className="w-16 h-16 text-[#14FE17]" />
      </div>
      <div className="absolute top-[60%] right-[12%] float-rotate-slow opacity-[0.04]" style={{ animationDelay: '7s' }}>
        <RadiationSVG className="w-12 h-12 text-[#14FE17]" />
      </div>
    </div>
  );
}

/* ============================================================
   VAULT RULES SECTION
   ============================================================ */
/* Glitch text for ЗНАЙ/ЗАБУДЬ auto-cycling animation */
function GlitchWord() {
  const [phase, setPhase] = useState<'idle' | 'glitching' | 'changed'>('idle');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cycleRef = useRef<() => void>();

  const clearCycle = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runCycle = useCallback(() => {
    clearCycle();
    const t = timersRef.current;

    // 2s showing ЗНАЙ → glitch
    t.push(setTimeout(() => setPhase('glitching'), 2000));
    // 2.4s → change to ЗАБУДЬ
    t.push(setTimeout(() => setPhase('changed'), 2400));
    // 4.4s → glitch back
    t.push(setTimeout(() => setPhase('glitching'), 4400));
    // 4.8s → back to ЗНАЙ, restart
    t.push(setTimeout(() => {
      setPhase('idle');
      cycleRef.current?.();
    }, 4800));
  }, [clearCycle]);

  useEffect(() => {
    cycleRef.current = runCycle;
  }, [runCycle]);

  useEffect(() => {
    runCycle();
    return clearCycle;
  }, [runCycle, clearCycle]);

  const isGlitching = phase === 'glitching';
  const displayWord = phase === 'changed' ? 'ЗАБУДЬ' : 'ЗНАЙ';

  return (
    <span
      className={`inline-block relative cursor-default select-none ${
        isGlitching ? 'glitch-text-active' : ''
      }`}
      style={isGlitching ? {
        animation: 'glitchFlicker 0.1s infinite',
        textShadow: '2px 0 #ff0000, -2px 0 #00ffff, 0 0 8px #14FE17',
      } : phase === 'changed' ? {
        color: '#ff4444',
        textShadow: '0 0 6px #ff0000',
      } : undefined}
    >
      {isGlitching && (
        <>
          <span className="absolute left-0 top-0 opacity-70" style={{ transform: 'translate(-2px, 1px)', color: '#ff0000' }}>
            {displayWord}
          </span>
          <span className="absolute left-0 top-0 opacity-70" style={{ transform: 'translate(2px, -1px)', color: '#00ffff' }}>
            {displayWord}
          </span>
        </>
      )}
      {displayWord}
    </span>
  );
}

function VaultRules() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: 0.6 }}
      className="pixel-border bg-[#0A0A0A] p-3 sm:p-4 card-hover-lift"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2.5 border-b border-[#14FE1730] pb-1.5 flex items-center gap-2">
        <HolotapeSVG className="w-5 h-4 text-[#14FE17] holotape-spin" />
        <span>▌ПРАВИЛА УБЕЖИЩА №18</span>
      </div>
      <div className="space-y-2">
        {VAULT_RULES.map((rule, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.15, duration: 0.4 }}
            className="text-[8px] sm:text-[10px] text-[#14FE17] font-mono leading-[1.5] pl-2 border-l-2 border-[#14FE1730] hover:border-[#14FE17] transition-colors"
          >
            {i === 2 ? (
              <>
                {'03. АЛКОГОЛЬ РАЗРЕШЁН — НО МЕРУ '}
                <GlitchWord />
                {', ЖИТЕЛЬ'}
              </>
            ) : rule}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ============================================================
   VAULT RESIDENT CARD (S.P.E.C.I.A.L. system)
   ============================================================ */
function VaultResidentCardSection() {
  const { card, generateCard, resetCard } = useResidentCard();
  const [name, setName] = useState('');
  const [stats, setStats] = useState<SpecialStats>({ ...DEFAULT_STATS });
  const [error, setError] = useState('');

  const totalPoints = Object.values(stats).reduce((sum, v) => sum + v, 0);
  const maxPoints = 40;
  const remaining = maxPoints - totalPoints;

  const handleStatChange = useCallback((key: keyof SpecialStats, value: number) => {
    setStats(prev => {
      const newTotal = totalPoints - prev[key] + value;
      if (newTotal > maxPoints) return prev;
      return { ...prev, [key]: value };
    });
  }, [totalPoints, maxPoints]);

  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('ВВЕДИТЕ ИМЯ ЖИТЕЛЯ');
      return;
    }
    if (totalPoints > maxPoints) {
      setError('ПРЕВЫШЕН ЛИМИТ ОЧКОВ');
      return;
    }
    setError('');
    generateCard(trimmedName, stats);
  }, [name, stats, totalPoints, maxPoints, generateCard]);

  if (card) {
    // Show the generated card
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pixel-border-bright bg-[#0A0A0A] p-3 sm:p-4 relative holo-shimmer"
      >
        <CardScanLine />

        {/* Card header */}
        <div className="flex items-center justify-between mb-3 border-b border-[#14FE1730] pb-2">
          <div className="flex items-center gap-1.5">
            <RadiationSVG className="w-4 h-4 text-[#14FE17]" />
            <span className="text-[8px] sm:text-[10px] text-[#14FE17] font-mono tracking-wider font-bold">
              VAULT-TEC RESIDENT ID
            </span>
          </div>
          <span className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono">УБЕЖИЩЕ №18</span>
        </div>

        {/* Name and number */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono">ИМЯ ЖИТЕЛЯ:</div>
            <div className="text-[12px] sm:text-sm text-[#14FE17] font-mono font-bold fallout-glow-subtle">
              {card.name.toUpperCase()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono">№ ЖИТЕЛЯ:</div>
            <div className="text-[12px] sm:text-sm text-[#14FE17] font-mono font-bold">
              {card.number}
            </div>
          </div>
        </div>

        {/* S.P.E.C.I.A.L. bars */}
        <div className="space-y-1.5 mb-3">
          {SPECIAL_LABELS.map((s, i) => {
            const val = card.stats[s.key];
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono w-6 shrink-0">{s.label}</span>
                <div className="flex-1 h-3 sm:h-4 bg-[#0D1A0D] border border-[#14FE1720] overflow-hidden relative">
                  <div
                    className="resident-stat-bar h-full bg-[#14FE17] opacity-80"
                    style={{
                      '--stat-width': `${val * 10}%`,
                      '--stat-delay': `${i * 0.1}s`,
                    } as React.CSSProperties}
                  />
                  <span className="absolute right-1 top-0 bottom-0 flex items-center text-[6px] sm:text-[7px] text-[#14FE17] font-mono">
                    {val}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between border-t border-[#14FE1730] pt-2">
          <span className="text-[8px] sm:text-[10px] text-[#F1AC43] font-mono tracking-wider font-bold">
            СТАТУС: ОДОБРЕН
          </span>
          <button
            onClick={resetCard}
            className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono tracking-wider hover:text-[#14FE17] transition-colors"
          >
            [СБРОСИТЬ]
          </button>
        </div>

        {/* Vault 18 badge */}
        <div className="absolute top-2 right-2 opacity-10">
          <VaultDoorSVG className="w-10 h-10 sm:w-14 sm:h-14" />
        </div>
      </motion.div>
    );
  }

  // Show the form
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="pixel-border bg-[#0A0A0A] p-3 sm:p-4"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-3 border-b border-[#14FE1730] pb-1.5">
        ▌КАРТА ЖИТЕЛЯ УБЕЖИЩА
      </div>

      {/* Name input */}
      <div className="mb-3">
        <label className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider block mb-1">
          ИМЯ ЖИТЕЛЯ:
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Введите ваше имя..."
          className="w-full pixel-border bg-[#0D1A0D] px-2.5 py-1.5 sm:py-2 text-[#14FE17] font-mono text-[10px] sm:text-xs
                     placeholder:text-[#0B8C0D] focus:outline-none focus:border-[#14FE17] transition-colors"
        />
      </div>

      {/* S.P.E.C.I.A.L. sliders */}
      <div className="space-y-2 mb-3">
        {SPECIAL_LABELS.map(s => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono w-6 shrink-0">{s.label}</span>
            <input
              type="range"
              min="1"
              max="10"
              value={stats[s.key]}
              onChange={e => handleStatChange(s.key, Number(e.target.value))}
              className="flex-1 h-1 appearance-none bg-[#0D1A0D] border border-[#14FE1730] rounded-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:bg-[#14FE17] [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-[8px] sm:text-[10px] text-[#14FE17] font-mono w-4 text-right">{stats[s.key]}</span>
          </div>
        ))}
      </div>

      {/* Points counter */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono">
          ОСТАЛОСЬ ОЧКОВ:
        </span>
        <span className={`text-[9px] sm:text-[11px] font-mono font-bold ${remaining < 0 ? 'text-red-500' : remaining === 0 ? 'text-[#F1AC43]' : 'text-[#14FE17]'}`}>
          {remaining}/{maxPoints}
        </span>
      </div>

      {error && (
        <div className="text-[8px] sm:text-[9px] text-red-500 font-mono mb-2 text-center">
          ⚠ {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={remaining < 0}
        className="w-full pixel-border-bright px-4 py-2.5 bg-[#0D1A0D] text-[#14FE17] font-mono
                   text-[9px] sm:text-[11px] tracking-[0.2em] hover:bg-[#14FE17] hover:text-[#050505]
                   transition-all duration-300 active:scale-[0.98] fallout-glow-subtle disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ☢ ГЕНЕРИРОВАТЬ КАРТУ ☢
      </button>
    </motion.div>
  );
}

/* ============================================================
   SECRET TERMINAL EASTER EGG
   ============================================================ */
function SecretTerminal({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<string[]>([
    'VAULT-TEC SECRET TERMINAL v2.077',
    '========================================',
    'УРОВЕНЬ ДОСТУПА: СЕКРЕТНЫЙ',
    'ВВЕДИТЕ КОМАНДУ (help — СПИСОК):',
    '',
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const processCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const lines = [`> ${cmd}`];

    switch (trimmed) {
      case 'help':
        lines.push('ДОСТУПНЫЕ КОМАНДЫ:');
        lines.push('  help      — СПИСОК КОМАНД');
        lines.push('  status    — СТАТУС УБЕЖИЩА');
        lines.push('  whoami    — ИНФОРМАЦИЯ О ЖИТЕЛЕ');
        lines.push('  date      — ТЕКУЩАЯ ДАТА');
        lines.push('  unlock    — СЕКРЕТНЫЙ РАЗДЕЛ');
        lines.push('  log       — ЖУРНАЛ УБЕЖИЩА');
        lines.push('  inventory — ИНВЕНТАРЬ ЖИТЕЛЯ');
        lines.push('  hack      — ПОПЫТКА ВЗЛОМА');
        lines.push('  exit      — ЗАКРЫТЬ ТЕРМИНАЛ');
        break;
      case 'status':
        lines.push('▌СТАТУС УБЕЖИЩА №18:');
        lines.push('  ДВЕРИ: ОТКРЫТЫ');
        lines.push('  РАДИАЦИЯ: 0.03 ЗВ/Ч');
        lines.push('  ВЕНТИЛЯЦИЯ: АКТИВНА');
        lines.push('  ЖИТЕЛИ: ОЖИДАЮТСЯ');
        lines.push('  СТАТУС: ПРАЗДНОВАНИЕ АКТИВНО');
        lines.push('  ЗАПАСЫ: НЕОГРАНИЧЕНЫ');
        break;
      case 'whoami':
        lines.push('▌ИДЕНТИФИКАЦИЯ ЖИТЕЛЯ:');
        lines.push('  СТАТУС: ЖИТЕЛЬ УБЕЖИЩА №18');
        lines.push('  УРОВЕНЬ ДОСТУПА: СЕКРЕТНЫЙ');
        lines.push('  ПРИГЛАШЕНИЕ: АКТИВНО');
        lines.push('  ЯВКА: ОЖИДАЕТСЯ');
        break;
      case 'date':
        lines.push('▌ТЕКУЩАЯ ДАТА ВРЕМЕНИ:');
        lines.push('  2277.05.30 — 13:00 МСК');
        lines.push('  ДЕНЬ РОЖДЕНИЯ МАКАРОВА АНДРЕЯ');
        break;
      case 'unlock':
        lines.push('▌ОТКРЫТИЕ СЕКРЕТНОГО РАЗДЕЛА...');
        lines.push('▓▓▓▓▓▓▓▓ ДОСТУП РАЗРЕШЁН ▓▓▓▓▓▓▓▓');
        lines.push('ОТКРЫТ СЕКРЕТНЫЙ РАЗДЕЛ: ДЕНЬ РОЖДЕНИЯ АНДРЕЯ - ПАРОЛЬ: VAULT18BIRTHDAY');
        break;
      case 'log':
        lines.push('▌ЖУРНАЛ УБЕЖИЩА №18:');
        VAULT_LOG_ENTRIES.forEach(entry => lines.push(`  ${entry}`));
        lines.push('  — КОНЕЦ ЖУРНАЛА —');
        break;
      case 'inventory':
        lines.push('▌ИНВЕНТАРЬ ЖИТЕЛЯ:');
        INVENTORY_ITEMS.forEach(item => lines.push(`  ${item}`));
        lines.push('  СУММА: 11 ПРЕДМЕТОВ');
        break;
      case 'hack': {
        lines.push('ПОПЫТКА ВЗЛОМА...');
        // Use setHistory to add lines with a delay
        const hackLines1 = [...lines];
        lines.length = 0;
        lines.push(...hackLines1);
        // Add progressive delay animation
        const hackSteps = ['▓░░░░░░░', '▓▓░░░░░░', '▓▓▓░░░░░', '▓▓▓▓░░░░', '▓▓▓▓▓░░░', '▓▓▓▓▓▓░░', '▓▓▓▓▓▓▓░', '▓▓▓▓▓▓▓▓'];
        hackSteps.forEach((step, idx) => {
          setTimeout(() => {
            setHistory(prev => [...prev.slice(0, -1), `ПОПЫТКА ВЗЛОМА... ${step}`, idx === hackSteps.length - 1 ? 'ДОСТУП ЗАПРЕЩЁН. ВАШ IP ЗАФИКСИРОВАН.' : '']);
            if (idx === hackSteps.length - 1) {
              setHistory(prev => [...prev, '']);
            }
          }, (idx + 1) * 200);
        });
        break;
      }
      case 'exit':
        lines.push('ЗАКРЫТИЕ ТЕРМИНАЛА...');
        setTimeout(onClose, 500);
        break;
      default:
        lines.push(`НЕИЗВЕСТНАЯ КОМАНДА: "${trimmed}"`);
        lines.push('ВВЕДИТЕ "help" ДЛЯ СПИСКА КОМАНД');
    }

    lines.push('');
    setHistory(prev => [...prev, ...lines]);
    setInput('');
    playClickBeep();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      processCommand(input);
    }
  }, [input, processCommand]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[200] bg-[#050505] flex flex-col p-4 sm:p-8"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="scanline-overlay" />
      <div className="crt-overlay" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 pixel-border px-2 py-0.5 bg-[#0A0A0A90]
                   text-[#0B8C0D] font-mono text-[7px] sm:text-[8px] tracking-wider
                   hover:text-[#14FE17] transition-all duration-300 active:scale-[0.97]"
      >
        ✕ ЗАКРЫТЬ
      </button>

      {/* Terminal output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-[9px] sm:text-[11px] text-[#14FE17] leading-[1.5] max-h-[80vh]"
      >
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap terminal-glow">{line}</div>
        ))}
      </div>

      {/* Input line */}
      <div className="flex items-center gap-2 mt-2 border-t border-[#14FE1740] pt-2">
        <span className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-[#14FE17] font-mono text-[9px] sm:text-[11px] focus:outline-none terminal-glow"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="terminal-blink-block text-[9px] sm:text-[11px] text-[#14FE17] font-mono">█</span>
      </div>
    </motion.div>
  );
}

/* ============================================================
   NUKA-COLA DRINK MENU
   ============================================================ */
function NukaColaMenu() {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="pixel-border bg-[#0A0A0A] p-3 sm:p-4"
    >
      <button
        onClick={() => { setExpanded(!expanded); playClickBeep(); }}
        className="w-full flex items-center justify-between text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold border-b border-[#14FE1730] pb-1.5"
      >
        <div className="flex items-center gap-2">
          <span className="cap-spin text-sm">🥤</span>
          <span>▌МЕНЮ БАРА «NUKA-COLA»</span>
        </div>
        <span className="text-[7px] text-[#0B8C0D]">{expanded ? '▲ СВЕРНУТЬ' : '▼ РАЗВЕРНУТЬ'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-2.5 space-y-1.5">
              {NUKA_COLA_MENU.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="menu-item-hover pixel-border bg-[#0D1A0D] p-2 flex items-center gap-2 liquid-shimmer"
                >
                  <span className="text-lg shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] sm:text-[9px] text-[#14FE17] font-mono font-bold truncate" style={{ color: item.color }}>
                        {item.name}
                      </span>
                    </div>
                    <div className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono leading-[1.3] mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                  <div className="shrink-0 pixel-border bg-[#0A0A0A] px-1.5 py-0.5">
                    <span className="text-[7px] sm:text-[8px] text-[#F1AC43] font-mono font-bold whitespace-nowrap">
                      {item.price}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-2.5 text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono opacity-60">
              * ЦЕНА УКАЗАНА В КРЫШКАХ ОТ NUKA-COLA • СПИРТНЫЕ НАПИТКИ ТОЛЬКО ДЛЯ ЖИТЕЛЕЙ 18+
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ============================================================
   HACKING MINIGAME
   ============================================================ */
function HackingMinigame({ onClose }: { onClose: () => void }) {
  const [gameState, setGameState] = useState(() => {
    const shuffled = [...HACKING_WORDS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);
    const target = selected[Math.floor(Math.random() * selected.length)];
    return { targetWord: target, wordList: selected };
  });
  const targetWord = gameState.targetWord;
  const wordList = gameState.wordList;
  const [guesses, setGuesses] = useState<{ word: string; matches: number }[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(4);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shakeWord, setShakeWord] = useState('');
  const [successFlash, setSuccessFlash] = useState(false);

  const countMatches = useCallback((guess: string, target: string) => {
    let matches = 0;
    const minLen = Math.min(guess.length, target.length);
    for (let i = 0; i < minLen; i++) {
      if (guess[i] === target[i]) matches++;
    }
    return matches;
  }, []);

  const handleGuess = useCallback((word: string) => {
    if (gameStatus !== 'playing' || guesses.some(g => g.word === word)) return;

    const matches = countMatches(word, targetWord);
    const newGuesses = [...guesses, { word, matches }];
    setGuesses(newGuesses);
    playClickBeep();

    if (word === targetWord) {
      setGameStatus('won');
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 500);
      playTerminalBeep();
      localStorage.setItem('vault18-hacked', 'true');
    } else {
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);
      setShakeWord(word);
      setTimeout(() => setShakeWord(''), 400);
      playBeep(300, 0.2, 0.1);
      if (newAttempts === 0) {
        setGameStatus('lost');
        playBeep(150, 0.5, 0.15);
      }
    }
  }, [gameStatus, guesses, targetWord, attemptsLeft, countMatches]);

  const restart = useCallback(() => {
    const shuffled = [...HACKING_WORDS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);
    const target = selected[Math.floor(Math.random() * selected.length)];
    setGameState({ targetWord: target, wordList: selected });
    setGuesses([]);
    setAttemptsLeft(4);
    setGameStatus('playing');
    setShakeWord('');
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[200] bg-[#050505] flex flex-col p-4 sm:p-8"
    >
      <div className="scanline-overlay" />
      <div className="crt-overlay" />

      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 pixel-border px-2 py-0.5 bg-[#0A0A0A90]
                   text-[#0B8C0D] font-mono text-[7px] sm:text-[8px] tracking-wider
                   hover:text-[#14FE17] transition-all duration-300 active:scale-[0.97]"
      >
        ✕ ЗАКРЫТЬ
      </button>

      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <div className="text-center mb-4">
          <div className="text-[11px] sm:text-sm text-[#14FE17] font-mono font-bold hack-pulse tracking-wider mb-1">
            🔐 ВЗЛОМ ТЕРМИНАЛА
          </div>
          <div className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider">
            НАЙДИТЕ ПАРОЛЬ • СОВПАДЕНИЯ БУКВ ПОКАЗЫВАЮТ СХОДСТВО
          </div>
        </div>

        {/* Attempts indicator */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono">ПОПЫТКИ:</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 border border-[#14FE1740] ${i < attemptsLeft ? 'bg-[#14FE17]' : 'bg-transparent'}`}
              style={{ boxShadow: i < attemptsLeft ? '0 0 5px #14FE1740' : 'none' }}
            />
          ))}
        </div>

        {/* Word grid */}
        {gameStatus === 'playing' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {wordList.map((word) => {
              const isGuessed = guesses.some(g => g.word === word);
              const isShaking = shakeWord === word;
              return (
                <button
                  key={word}
                  onClick={() => handleGuess(word)}
                  disabled={isGuessed}
                  className={`pixel-border bg-[#0D1A0D] px-3 py-2.5 text-center font-mono text-[10px] sm:text-xs tracking-[0.2em]
                    transition-all duration-200 active:scale-[0.97]
                    ${isGuessed ? 'opacity-40 cursor-not-allowed border-[#0B8C0D]' : 'text-[#14FE17] hover:bg-[#14FE1710] hover:border-[#14FE17] cursor-pointer'}
                    ${isShaking ? 'hack-fail-shake' : ''}`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        )}

        {/* Guess history */}
        {guesses.length > 0 && (
          <div className="pixel-border bg-[#0A0A0A] p-2.5 mb-4">
            <div className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider mb-1.5">
              ▌ИСТОРИЯ ПОПЫТОК:
            </div>
            <div className="space-y-1">
              {guesses.map((g, i) => (
                <div key={i} className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono">
                  <span className="text-[#14FE17]">{g.word}</span>
                  <span className={`${g.matches === g.word.length ? 'text-[#14FE17] fallout-glow-subtle' : g.matches > 0 ? 'text-[#F1AC43]' : 'text-[#FF5252]'}`}>
                    {g.matches}/{g.word.length} совпадений
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game result */}
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`pixel-border-bright p-4 text-center ${successFlash ? 'hack-success-flash' : ''}`}
            style={{ background: gameStatus === 'won' ? '#14FE1710' : '#FF525210' }}
          >
            <div className={`text-sm sm:text-base font-mono font-bold mb-2 ${gameStatus === 'won' ? 'text-[#14FE17] fallout-glow' : 'text-[#FF5252]'}`}>
              {gameStatus === 'won' ? '✅ ВЗЛОМ УСПЕШЕН!' : '❌ ВЗЛОМ ПРОВАЛЕН'}
            </div>
            <div className="text-[8px] sm:text-[9px] text-[#0B8C0D] font-mono mb-3">
              {gameStatus === 'won'
                ? 'ДОСТУП К ТЕРМИНАЛУ ПОЛУЧЕН • ПАРОЛЬ: ' + targetWord
                : 'ПАРОЛЬ БЫЛ: ' + targetWord + ' • ПОВТОРИТЕ ПОПЫТКУ'}
            </div>
            <button
              onClick={restart}
              className="pixel-border-bright px-4 py-2 bg-[#0D1A0D] text-[#14FE17] font-mono
                         text-[9px] sm:text-[11px] tracking-[0.2em] hover:bg-[#14FE17] hover:text-[#050505]
                         transition-all duration-300 active:scale-[0.97]"
            >
              {gameStatus === 'won' ? '🔄 НОВЫЙ ВЗЛОМ' : '🔄 ПОВТОРИТЬ'}
            </button>
          </motion.div>
        )}

        {/* Hint */}
        {gameStatus === 'playing' && (
          <div className="text-center text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono opacity-50 mt-2">
            ПОДСКАЗКА: ИЩИТЕ СЛОВО С МАКСИМАЛЬНЫМ ЧИСЛОМ СОВПАДЕНИЙ БУКВ НА ТЕХ ЖЕ ПОЗИЦИЯХ
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   LOCKPICKING MINI-GAME
   ============================================================ */
function LockpickMinigame({ onClose }: { onClose: () => void }) {
  const [tumblers, setTumblers] = useState(() =>
    Array.from({ length: 4 }, () => ({
      angle: Math.floor(Math.random() * 360),
      sweetSpot: Math.floor(Math.random() * 360),
      sweetSpotWidth: 35,
      locked: false,
      spinning: false,
    }))
  );
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [successFlash, setSuccessFlash] = useState(false);

  const spinTumbler = useCallback((index: number) => {
    if (gameStatus !== 'playing') return;
    const tumbler = tumblers[index];
    if (tumbler.locked || tumbler.spinning) return;

    playClickBeep();
    setTumblers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], spinning: true };
      return next;
    });

    // Spin for 0.8-1.5 seconds then stop
    const spinDuration = 800 + Math.random() * 700;
    setTimeout(() => {
      setTumblers(prev => {
        const next = [...prev];
        const stopAngle = Math.floor(Math.random() * 360);
        const isInSweetSpot = Math.abs(stopAngle - next[index].sweetSpot) < next[index].sweetSpotWidth / 2 ||
          Math.abs(stopAngle - next[index].sweetSpot + 360) < next[index].sweetSpotWidth / 2 ||
          Math.abs(stopAngle - next[index].sweetSpot - 360) < next[index].sweetSpotWidth / 2;

        if (isInSweetSpot) {
          next[index] = { ...next[index], angle: stopAngle, locked: true, spinning: false };
          playBeep(1200, 0.15, 0.1);
          // Check if all locked
          const allLocked = next.every(t => t.locked);
          if (allLocked) {
            setGameStatus('won');
            setSuccessFlash(true);
            setTimeout(() => setSuccessFlash(false), 500);
            playTerminalBeep();
            localStorage.setItem('vault18-lockpicked', 'true');
          }
        } else {
          next[index] = { ...next[index], angle: stopAngle, spinning: false };
          // Cost 1 attempt
          setAttemptsLeft(prevAttempts => {
            const newAttempts = prevAttempts - 1;
            if (newAttempts === 0) {
              setGameStatus('lost');
              playBeep(150, 0.5, 0.15);
            } else {
              playBeep(300, 0.2, 0.1);
            }
            return newAttempts;
          });
        }
        return next;
      });
    }, spinDuration);
  }, [gameStatus, tumblers]);

  const restart = useCallback(() => {
    setTumblers(Array.from({ length: 4 }, () => ({
      angle: Math.floor(Math.random() * 360),
      sweetSpot: Math.floor(Math.random() * 360),
      sweetSpotWidth: 35,
      locked: false,
      spinning: false,
    })));
    setAttemptsLeft(3);
    setGameStatus('playing');
    setSuccessFlash(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[200] bg-[#050505] flex flex-col p-4 sm:p-8"
    >
      <div className="scanline-overlay" />
      <div className="crt-overlay" />

      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 pixel-border px-2 py-0.5 bg-[#0A0A0A90]
                   text-[#0B8C0D] font-mono text-[7px] sm:text-[8px] tracking-wider
                   hover:text-[#14FE17] transition-all duration-300 active:scale-[0.97]"
      >
        ✕ ЗАКРЫТЬ
      </button>

      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col items-center justify-center">
        {/* Header with lock SVG */}
        <div className="text-center mb-4">
          <div className="mb-2 flex justify-center">
            <svg viewBox="0 0 60 80" className="w-10 h-12 sm:w-12 sm:h-14" fill="none" stroke="#14FE17" strokeWidth="2">
              <rect x="10" y="35" width="40" height="35" rx="3" />
              <path d="M20 35 V25 A10 10 0 0 1 40 25 V35" />
              <circle cx="30" cy="50" r="4" fill="#14FE17" opacity={gameStatus === 'won' ? 1 : 0.4} />
              <rect x="28" y="54" width="4" height="8" fill="#14FE17" opacity={gameStatus === 'won' ? 1 : 0.4} />
            </svg>
          </div>
          <div className="text-[11px] sm:text-sm text-[#14FE17] font-mono font-bold hack-pulse tracking-wider mb-1">
            🔓 ВЗЛОМ ЗАМКА
          </div>
          <div className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider">
            ВРАЩАЙТЕ ЦИЛИНДРЫ • СОВПАДЕНИЕ С ЗОНОЙ = ЗАКРЫТО
          </div>
        </div>

        {/* Attempts indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono">ПОПЫТКИ:</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 border border-[#14FE1740] ${i < attemptsLeft ? 'bg-[#14FE17]' : 'bg-transparent'}`}
              style={{ boxShadow: i < attemptsLeft ? '0 0 5px #14FE1740' : 'none' }}
            />
          ))}
        </div>

        {/* Tumblers */}
        {gameStatus === 'playing' && (
          <div className="flex gap-3 sm:gap-4 mb-6">
            {tumblers.map((tumbler, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  {/* Background circle */}
                  <div className="absolute inset-0 rounded-full border-2 border-[#14FE1730] bg-[#0D1A0D]" />
                  {/* Sweet spot arc */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="#14FE1740"
                      strokeWidth="6"
                      strokeDasharray={`${(tumbler.sweetSpotWidth / 360) * 283} ${283 - (tumbler.sweetSpotWidth / 360) * 283}`}
                      strokeDashoffset={-(tumbler.sweetSpot / 360) * 283}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  {/* Rotating indicator */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: tumbler.spinning ? tumbler.angle + 720 : tumbler.angle }}
                    transition={tumbler.spinning ? { duration: 1, ease: 'linear' } : { duration: 0.3 }}
                  >
                    <div className={`w-1 h-5 sm:h-6 rounded-full ${tumbler.locked ? 'bg-[#14FE17]' : 'bg-[#F1AC43]'}`}
                      style={{ boxShadow: tumbler.locked ? '0 0 6px #14FE17' : '0 0 3px #F1AC43' }}
                    />
                  </motion.div>
                  {/* Center dot */}
                  <div className={`absolute inset-0 flex items-center justify-center ${tumbler.locked ? 'text-[#14FE17]' : tumbler.spinning ? 'text-[#F1AC43]' : 'text-[#0B8C0D]'}`}>
                    <span className="text-[8px] sm:text-[10px] font-mono font-bold">
                      {tumbler.locked ? '✓' : tumbler.spinning ? '...' : (i + 1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => spinTumbler(i)}
                  disabled={tumbler.locked || tumbler.spinning}
                  className={`pixel-border px-2 py-1 text-[7px] sm:text-[8px] font-mono tracking-wider transition-all duration-200 active:scale-[0.97]
                    ${tumbler.locked ? 'bg-[#14FE1720] text-[#14FE17] border-[#14FE17] cursor-default'
                      : tumbler.spinning ? 'bg-[#F1AC4320] text-[#F1AC43] border-[#F1AC43] cursor-wait'
                      : 'bg-[#0D1A0D] text-[#14FE17] hover:bg-[#14FE1710] hover:border-[#14FE17] cursor-pointer'}`}
                >
                  {tumbler.locked ? 'LOCKED ✓' : tumbler.spinning ? 'ВРАЩЕНИЕ' : 'ВРАЩАТЬ'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Game result */}
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`pixel-border-bright p-4 text-center ${successFlash ? 'hack-success-flash' : ''}`}
            style={{ background: gameStatus === 'won' ? '#14FE1710' : '#FF525210' }}
          >
            <div className={`text-sm sm:text-base font-mono font-bold mb-2 ${gameStatus === 'won' ? 'text-[#14FE17] fallout-glow' : 'text-[#FF5252]'}`}>
              {gameStatus === 'won' ? '🔓 ЗАМОК ВСКРЫТ!' : '🔒 ЗАМОК СОРВАН'}
            </div>
            <div className="text-[8px] sm:text-[9px] text-[#0B8C0D] font-mono mb-3">
              {gameStatus === 'won'
                ? 'ПУТЬ СВОБОДЕН • ДОСТУП ЧЕРЕЗ ЗАМОК ПОЛУЧЕН'
                : 'ПОПЫТКИ ИСЧЕРПАНЫ • ПОВТОРИТЕ ВЗЛОМ'}
            </div>
            <button
              onClick={restart}
              className="pixel-border-bright px-4 py-2 bg-[#0D1A0D] text-[#14FE17] font-mono
                         text-[9px] sm:text-[11px] tracking-[0.2em] hover:bg-[#14FE17] hover:text-[#050505]
                         transition-all duration-300 active:scale-[0.97]"
            >
              {gameStatus === 'won' ? '🔄 НОВЫЙ ЗАМОК' : '🔄 ПОВТОРИТЬ'}
            </button>
          </motion.div>
        )}

        {/* Hint */}
        {gameStatus === 'playing' && (
          <div className="text-center text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono opacity-50 mt-2">
            ПОДСКАЗКА: ЦИЛИНДР ОСТАНОВИТСЯ В ЗЕЛЁНОЙ ЗОНЕ — ОН ЗАКРЕПИТСЯ. ПРОМАХ — МИНУС ПОПЫТКА
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   ACHIEVEMENT TRACKER
   ============================================================ */
function AchievementTracker() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);

  // Check achievements periodically
  useEffect(() => {
    const checkAchievements = () => {
      const current: string[] = [];
      ACHIEVEMENTS.forEach(a => {
        if (a.check()) current.push(a.id);
      });

      // Only update if changed — use functional update to avoid dependency on unlocked
      setUnlocked(prev => {
        if (prev.length === current.length && prev.every((v, i) => v === current[i])) return prev;
        // Check for newly unlocked
        const newOnes = current.filter(id => !prev.includes(id));
        if (newOnes.length > 0) {
          setNewAchievement(newOnes[0]);
          setTimeout(() => setNewAchievement(null), 4000);
        }
        return current;
      });
    };

    checkAchievements();
    const interval = setInterval(checkAchievements, 3000);
    return () => clearInterval(interval);
  }, []);

  const unlockedCount = unlocked.length;
  const totalCount = ACHIEVEMENTS.length;
  const progress = (unlockedCount / totalCount) * 100;

  return (
    <>
      {/* Achievement popup notification */}
      <AnimatePresence>
        {newAchievement && (() => {
          const ach = ACHIEVEMENTS.find(a => a.id === newAchievement);
          if (!ach) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="fixed top-16 left-3 right-3 z-[150] max-w-sm mx-auto"
            >
              <div className="achievement-pop achievement-badge pixel-border-bright bg-[#0A0A0AF0] backdrop-blur-sm p-3 flex items-center gap-3">
                <div className="text-2xl">{ach.icon}</div>
                <div>
                  <div className="text-[8px] sm:text-[9px] text-[#F1AC43] font-mono tracking-wider font-bold">
                    🏆 ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО!
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#14FE17] font-mono font-bold fallout-glow-subtle">
                    {ach.name}
                  </div>
                  <div className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono">
                    {ach.desc}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Achievement section in main page */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="pixel-border bg-[#0A0A0A] p-3 sm:p-4"
      >
        <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2.5 border-b border-[#14FE1730] pb-1.5">
          <span>▌ДОСТИЖЕНИЯ</span>
          <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-normal tracking-wider">
            {unlockedCount}/{totalCount}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#0D1A0D] border border-[#14FE1720] overflow-hidden mb-3">
          <motion.div
            className="h-full bg-[#14FE17]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ boxShadow: '0 0 6px #14FE1740' }}
          />
        </div>

        {/* Achievement grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlocked.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`flex items-center gap-1.5 p-1.5 border transition-all duration-300 ${
                  isUnlocked
                    ? 'pixel-border bg-[#14FE1708] achievement-badge'
                    : 'border-[#14FE1715] bg-[#0A0A0A] opacity-40'
                }`}
              >
                <span className="text-base sm:text-lg shrink-0">{isUnlocked ? ach.icon : '🔒'}</span>
                <div className="min-w-0">
                  <div className={`text-[6px] sm:text-[7px] font-mono font-bold truncate ${isUnlocked ? 'text-[#14FE17]' : 'text-[#0B8C0D]'}`}>
                    {ach.name}
                  </div>
                  <div className="text-[5px] sm:text-[6px] text-[#0B8C0D] font-mono truncate">
                    {isUnlocked ? ach.desc : '???'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

/* ============================================================
   WASTELAND WEATHER WIDGET
   ============================================================ */
function WastelandWeather() {
  const [weatherIndex, setWeatherIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWeatherIndex(prev => (prev + 1) % WEATHER_STATES.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const weather = WEATHER_STATES[weatherIndex];
  const visColor = weather.visibility === 'ОПАСНАЯ' ? 'text-[#FF5252]'
    : weather.visibility === 'НИЗКАЯ' ? 'text-[#F1AC43]'
    : weather.visibility === 'СРЕДНЯЯ' ? 'text-[#14FE17]'
    : 'text-[#0B8C0D]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="pixel-border bg-[#0A0A0A] p-3"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2 border-b border-[#14FE1730] pb-1.5 flex items-center justify-between">
        <span>▌ПОГОДА ПУСТОШИ</span>
        <span className="text-lg">{weather.icon}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[8px] sm:text-[9px] font-mono">
        <div>
          <div className="text-[#0B8C0D] text-[6px] sm:text-[7px] tracking-wider">ТЕМПЕРАТУРА</div>
          <div className="text-[#14FE17] fallout-glow-subtle font-bold">{weather.temp}</div>
        </div>
        <div>
          <div className="text-[#0B8C0D] text-[6px] sm:text-[7px] tracking-wider">ВЕТЕР</div>
          <div className="text-[#14FE17] fallout-glow-subtle font-bold flex items-center gap-1">
            <span className="weather-wind text-[10px]" style={{ animationDuration: `${1.5 - weather.windLevel * 0.15}s` }}>🌬</span>
            {weather.wind}
          </div>
        </div>
        <div>
          <div className="text-[#0B8C0D] text-[6px] sm:text-[7px] tracking-wider">РАДИАЦИЯ</div>
          <div className={`fallout-glow-subtle font-bold ${weather.radiation.includes('0.1') || weather.radiation.includes('0.12') ? 'text-[#F1AC43]' : 'text-[#14FE17]'}`}>
            {weather.radiation}
          </div>
        </div>
        <div>
          <div className="text-[#0B8C0D] text-[6px] sm:text-[7px] tracking-wider">ВИДИМОСТЬ</div>
          <div className={`font-bold ${visColor}`}>{weather.visibility}</div>
        </div>
      </div>

      {/* Weather state indicator dots */}
      <div className="flex justify-center gap-1 mt-2">
        {WEATHER_STATES.map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${i === weatherIndex ? 'bg-[#14FE17] w-3' : 'bg-[#0B8C0D]'}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ============================================================
   QUEST TRACKER SECTION
   ============================================================ */
function QuestTrackerSection() {
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());

  const quests = [
    { id: 'rsvp', icon: '☢', name: 'ПОДТВЕРДИТЬ ЯВКУ', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-rsvp') === 'confirmed' },
    { id: 'card', icon: '🪪', name: 'СОЗДАТЬ КАРТУ ЖИТЕЛЯ', check: () => typeof window !== 'undefined' && !!localStorage.getItem('vault18-resident-card') },
    { id: 'perks', icon: '⭐', name: 'ВЫБРАТЬ 3 ПЕРКА', check: () => { if (typeof window === 'undefined') return false; const p = localStorage.getItem('vault18-perks'); return p ? JSON.parse(p).length >= 3 : false; } },
    { id: 'chat', icon: '🤖', name: 'ПОГОВОРИТЬ С ВОЛТБОЕМ', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-chatted') === 'true' },
    { id: 'hack', icon: '🔐', name: 'ВЗЛОМАТЬ ТЕРМИНАЛ', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-hacked') === 'true' },
    { id: 'lockpick', icon: '🔓', name: 'ВСКРЫТЬ ЗАМОК', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-lockpicked') === 'true' },
    { id: 'terminal', icon: '🖥️', name: 'НАЙТИ СЕКРЕТНЫЙ ТЕРМИНАЛ', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-terminal') === 'true' },
    { id: 'music', icon: '🎵', name: 'ВКЛЮЧИТЬ РАДИО', check: () => typeof window !== 'undefined' && localStorage.getItem('vault18-music') === 'true' },
  ];

  useEffect(() => {
    const update = () => {
      const completed = new Set<string>();
      quests.forEach(q => { if (q.check()) completed.add(q.id); });
      setCompletedQuests(completed);
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalCompleted = completedQuests.size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: 0.4 }}
      className="pixel-border bg-[#0A0A0A] p-3"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2 border-b border-[#14FE1730] pb-1.5">
        ▌ТРЕКЕР ЗАДАНИЙ
      </div>

      <div className="space-y-1.5">
        {quests.map(quest => {
          const done = completedQuests.has(quest.id);
          return (
            <div key={quest.id} className={`flex items-center gap-1.5 text-[7px] sm:text-[8px] font-mono ${done ? 'text-[#14FE17] fallout-glow-subtle' : 'text-[#0B8C0D] opacity-60'}`}>
              <span className="shrink-0">{done ? '✓' : '☐'}</span>
              <span className="shrink-0">{quest.icon}</span>
              <span className="flex-1 truncate">{quest.name}</span>
              <span className={`shrink-0 text-[6px] sm:text-[7px] tracking-wider ${done ? 'text-[#14FE17]' : 'text-[#0B8C0D]'}`}>
                {done ? 'ВЫПОЛНЕНО' : 'АКТИВНО'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-2.5 pt-2 border-t border-[#14FE1720]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono tracking-wider">ВЫПОЛНЕНО:</span>
          <span className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono font-bold">{totalCompleted}/9</span>
        </div>
        <div className="h-[3px] bg-[#0D1A0D] border border-[#14FE1520] overflow-hidden">
          <div
            className="h-full bg-[#14FE17] transition-all duration-700 ease-out"
            style={{ width: `${(totalCompleted / 9) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   INTERACTIVE VAULT DOOR MINI-WIDGET
   ============================================================ */
function VaultDoorWidget() {
  // Read localStorage directly in render (like useRSVP pattern)
  const isAccessGranted = typeof window !== 'undefined' ? localStorage.getItem('vault18-door-access') === 'true' : false;
  const [accessGranted, setAccessGranted] = useState(isAccessGranted);
  const [spinning, setSpinning] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);

  const handleClick = useCallback(() => {
    if (accessGranted || spinning) return;
    playClickBeep();
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setAccessGranted(true);
      setFlashVisible(true);
      localStorage.setItem('vault18-door-access', 'true');
      playTerminalBeep();
      setTimeout(() => setFlashVisible(false), 1000);
    }, 500);
  }, [accessGranted, spinning]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center gap-1"
    >
      <div className={`relative ${!accessGranted ? 'vault-door-pulse' : ''}`}>
        <button
          onClick={handleClick}
          disabled={accessGranted}
          className="touch-manipulation focus:outline-none"
          aria-label="Vault door access"
        >
          <div className={`w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] transition-transform duration-500 ${spinning ? 'animate-[vault-spin_0.5s_ease-in-out]' : ''}`}>
            <VaultDoorSVG className="w-full h-full" />
          </div>
        </button>
        {/* Green flash on access granted */}
        {flashVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-full bg-[#14FE1730] pointer-events-none"
          />
        )}
      </div>
      <span className={`text-[6px] sm:text-[7px] font-mono tracking-wider ${accessGranted ? 'text-[#14FE17] fallout-glow-subtle' : 'text-[#0B8C0D]'}`}>
        {accessGranted ? 'ДОСТУП ПОЛУЧЕН ✓' : 'НАЖМИТЕ ДЛЯ ДОСТУПА'}
      </span>
    </motion.div>
  );
}

/* ============================================================
   CONFETTI EFFECT
   ============================================================ */
function ConfettiEffect({ show }: { show: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Pre-computed particle data (no Math.random in render)
    const PARTICLE_DATA = [
      { xPct: 10, w: 3, h: 3, color: '#14FE17', delay: 0, wind: -20, rotSpeed: 3 },
      { xPct: 20, w: 2, h: 4, color: '#F1AC43', delay: 50, wind: 15, rotSpeed: 5 },
      { xPct: 30, w: 4, h: 2, color: '#14FE17', delay: 100, wind: -10, rotSpeed: 4 },
      { xPct: 40, w: 3, h: 3, color: '#F1AC43', delay: 30, wind: 25, rotSpeed: 6 },
      { xPct: 50, w: 2, h: 2, color: '#14FE17', delay: 80, wind: -15, rotSpeed: 3 },
      { xPct: 55, w: 3, h: 4, color: '#F1AC43', delay: 0, wind: 20, rotSpeed: 5 },
      { xPct: 60, w: 4, h: 3, color: '#14FE17', delay: 60, wind: -25, rotSpeed: 4 },
      { xPct: 65, w: 2, h: 3, color: '#F1AC43', delay: 120, wind: 10, rotSpeed: 6 },
      { xPct: 70, w: 3, h: 2, color: '#14FE17', delay: 40, wind: -5, rotSpeed: 3 },
      { xPct: 75, w: 4, h: 4, color: '#F1AC43', delay: 90, wind: 30, rotSpeed: 5 },
      { xPct: 80, w: 2, h: 2, color: '#14FE17', delay: 20, wind: -18, rotSpeed: 4 },
      { xPct: 85, w: 3, h: 3, color: '#F1AC43', delay: 70, wind: 12, rotSpeed: 6 },
      { xPct: 15, w: 4, h: 2, color: '#14FE17', delay: 110, wind: -22, rotSpeed: 3 },
      { xPct: 25, w: 2, h: 4, color: '#F1AC43', delay: 50, wind: 8, rotSpeed: 5 },
      { xPct: 35, w: 3, h: 3, color: '#14FE17', delay: 130, wind: -12, rotSpeed: 4 },
      { xPct: 45, w: 4, h: 4, color: '#F1AC43', delay: 10, wind: 28, rotSpeed: 6 },
      { xPct: 5, w: 2, h: 2, color: '#14FE17', delay: 80, wind: -8, rotSpeed: 3 },
      { xPct: 90, w: 3, h: 2, color: '#F1AC43', delay: 40, wind: 16, rotSpeed: 5 },
      { xPct: 12, w: 4, h: 3, color: '#14FE17', delay: 100, wind: -30, rotSpeed: 4 },
      { xPct: 22, w: 2, h: 3, color: '#F1AC43', delay: 60, wind: 5, rotSpeed: 6 },
      { xPct: 32, w: 3, h: 4, color: '#14FE17', delay: 20, wind: -14, rotSpeed: 3 },
      { xPct: 42, w: 4, h: 2, color: '#F1AC43', delay: 90, wind: 22, rotSpeed: 5 },
      { xPct: 52, w: 2, h: 2, color: '#14FE17', delay: 30, wind: -6, rotSpeed: 4 },
      { xPct: 62, w: 3, h: 3, color: '#F1AC43', delay: 70, wind: 18, rotSpeed: 6 },
      { xPct: 72, w: 4, h: 4, color: '#14FE17', delay: 0, wind: -20, rotSpeed: 3 },
      { xPct: 82, w: 2, h: 2, color: '#F1AC43', delay: 50, wind: 14, rotSpeed: 5 },
      { xPct: 92, w: 3, h: 3, color: '#14FE17', delay: 110, wind: -10, rotSpeed: 4 },
      { xPct: 8, w: 4, h: 2, color: '#F1AC43', delay: 80, wind: 26, rotSpeed: 6 },
      { xPct: 18, w: 2, h: 4, color: '#14FE17', delay: 40, wind: -16, rotSpeed: 3 },
      { xPct: 28, w: 3, h: 2, color: '#F1AC43', delay: 120, wind: 9, rotSpeed: 5 },
      { xPct: 38, w: 4, h: 3, color: '#14FE17', delay: 60, wind: -24, rotSpeed: 4 },
      { xPct: 48, w: 2, h: 2, color: '#F1AC43', delay: 10, wind: 20, rotSpeed: 6 },
      { xPct: 58, w: 3, h: 4, color: '#14FE17', delay: 90, wind: -8, rotSpeed: 3 },
      { xPct: 68, w: 4, h: 2, color: '#F1AC43', delay: 30, wind: 15, rotSpeed: 5 },
      { xPct: 78, w: 2, h: 3, color: '#14FE17', delay: 100, wind: -28, rotSpeed: 4 },
      { xPct: 88, w: 3, h: 2, color: '#F1AC43', delay: 70, wind: 11, rotSpeed: 6 },
      { xPct: 95, w: 4, h: 4, color: '#14FE17', delay: 50, wind: -4, rotSpeed: 3 },
      { xPct: 3, w: 2, h: 3, color: '#F1AC43', delay: 130, wind: 19, rotSpeed: 5 },
      { xPct: 13, w: 3, h: 2, color: '#14FE17', delay: 20, wind: -12, rotSpeed: 4 },
      { xPct: 23, w: 4, h: 3, color: '#F1AC43', delay: 80, wind: 7, rotSpeed: 6 },
      { xPct: 33, w: 2, h: 4, color: '#14FE17', delay: 40, wind: -18, rotSpeed: 3 },
      { xPct: 43, w: 3, h: 2, color: '#F1AC43', delay: 110, wind: 24, rotSpeed: 5 },
      { xPct: 53, w: 4, h: 3, color: '#14FE17', delay: 0, wind: -2, rotSpeed: 4 },
      { xPct: 63, w: 2, h: 2, color: '#F1AC43', delay: 60, wind: 13, rotSpeed: 6 },
      { xPct: 73, w: 3, h: 4, color: '#14FE17', delay: 90, wind: -22, rotSpeed: 3 },
      { xPct: 83, w: 4, h: 2, color: '#F1AC43', delay: 30, wind: 17, rotSpeed: 5 },
      { xPct: 93, w: 2, h: 3, color: '#14FE17', delay: 70, wind: -6, rotSpeed: 4 },
      { xPct: 7, w: 3, h: 2, color: '#F1AC43', delay: 120, wind: 21, rotSpeed: 6 },
      { xPct: 17, w: 4, h: 4, color: '#14FE17', delay: 50, wind: -14, rotSpeed: 3 },
      { xPct: 27, w: 2, h: 2, color: '#F1AC43', delay: 10, wind: 10, rotSpeed: 5 },
    ];

    const particles = PARTICLE_DATA.map(p => ({
      x: canvas.width * (p.xPct / 100),
      y: -20,
      w: p.w,
      h: p.h,
      color: p.color,
      vx: p.wind,
      vy: 2,
      rotation: 0,
      rotSpeed: p.rotSpeed,
      opacity: 1,
      delay: p.delay,
      started: false,
      startTime: Date.now() + p.delay,
    }));

    const duration = 3000;
    const startTime = Date.now();
    let animId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration + 1000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        if (Date.now() < p.startTime) return;
        const particleElapsed = Date.now() - p.startTime;
        const progress = Math.min(particleElapsed / duration, 1);

        const x = p.x + p.vx * progress;
        const y = p.y + (canvas.height * 0.8) * (progress * progress); // gravity-like
        const rotation = p.rotSpeed * particleElapsed * 0.01;
        const opacity = Math.max(0, 1 - progress);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [show]);

  if (!show) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

/* ============================================================
   WASTELAND RADIO SECTION
   ============================================================ */
function WastelandRadio() {
  const [activeStation, setActiveStation] = useState<number | null>(null);
  const [volume, setVolume] = useState(35);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const noiseNodeRef = useRef<{ source: AudioBufferSourceNode | null; gain: GainNode | null }>({ source: null, gain: null });
  const ambientNodeRef = useRef<{ osc: OscillatorNode | null; gain: GainNode | null }>({ osc: null, gain: null });

  const stopAll = useCallback(() => {
    // Stop HTML audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Stop noise
    if (noiseNodeRef.current.source) {
      try { noiseNodeRef.current.source.stop(); } catch { /* already stopped */ }
      noiseNodeRef.current = { source: null, gain: null };
    }
    // Stop ambient
    if (ambientNodeRef.current.osc) {
      try { ambientNodeRef.current.osc.stop(); } catch { /* already stopped */ }
      ambientNodeRef.current = { osc: null, gain: null };
    }
    setActiveStation(null);
  }, []);

  const playStation = useCallback((stationIndex: number) => {
    stopAll();
    const ctx = getAudioCtx();
    if (!ctx) return;

    setActiveStation(stationIndex);
    localStorage.setItem('vault18-music', 'true');

    if (stationIndex === 0) {
      // Баста — Урбан (HTML5 Audio)
      if (!audioRef.current) {
        audioRef.current = new Audio('/audio/basta-urban.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.volume = volume / 100;
      audioRef.current.play().catch(() => {});
    } else if (stationIndex === 1) {
      // Static noise (Web Audio API)
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = volume / 300;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3000;
      filter.Q.value = 0.5;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      noiseNodeRef.current = { source, gain };
    } else if (stationIndex === 2) {
      // Ambient drone (Web Audio API oscillator)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 55;
      const gain = ctx.createGain();
      gain.gain.value = volume / 500;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 2;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ambientNodeRef.current = { osc, gain };
    }
  }, [stopAll, volume]);

  // Update volume for all sources
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (noiseNodeRef.current.gain) noiseNodeRef.current.gain.gain.value = volume / 300;
    if (ambientNodeRef.current.gain) ambientNodeRef.current.gain.gain.value = volume / 500;
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      try { noiseNodeRef.current.source?.stop(); } catch { /* */ }
      try { ambientNodeRef.current.osc?.stop(); } catch { /* */ }
    };
  }, []);

  const stations = [
    { icon: '🎵', name: 'Баста — Урбан', desc: 'Классика Криминального Ростова', idx: 0 },
    { icon: '📻', name: 'Радио Пустоши', desc: 'Статический шум эфира', idx: 1 },
    { icon: '🎶', name: 'Ambient — Пустошь', desc: 'Низкий гул опустошённого мира', idx: 2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="pixel-border bg-[#0A0A0A] p-3"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2 border-b border-[#14FE1730] pb-1.5">
        ▌РАДИО ПУСТОШИ
      </div>

      {/* Now playing indicator */}
      {activeStation !== null && (
        <div className="flex items-center gap-1.5 mb-2 text-[7px] sm:text-[8px] text-[#14FE17] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14FE17] status-pulse-dot" />
          <span>В ЭФИРЕ: {stations[activeStation].name}</span>
          {/* Animated equalizer bars */}
          <div className="flex items-end gap-[1px] h-3 ml-1">
            {[0.3, 0.5, 0.35, 0.6, 0.4].map((speed, i) => (
              <div
                key={i}
                className="eq-bar w-[1.5px] bg-[#14FE17] rounded-[1px]"
                style={{
                  '--eq-speed': `${speed}s`,
                  '--eq-delay': `${i * 0.1}s`,
                  '--eq-max-height': `${4 + i * 1.5}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      )}

      {/* Station list */}
      <div className="space-y-1.5">
        {stations.map((station) => {
          const isActive = activeStation === station.idx;
          return (
            <div
              key={station.idx}
              className={`flex items-center gap-2 p-1.5 sm:p-2 border transition-all duration-200 ${
                isActive
                  ? 'border-[#14FE17] bg-[#14FE1710] fallout-box-glow'
                  : 'border-[#14FE1520] bg-[#0D1A0D] hover:border-[#14FE1740]'
              }`}
            >
              <span className="text-sm sm:text-base shrink-0">{station.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-[8px] sm:text-[9px] font-mono truncate ${isActive ? 'text-[#14FE17] fallout-glow-subtle' : 'text-[#14FE17]'}`}>
                  {station.name}
                </div>
                <div className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono truncate">
                  {station.desc}
                </div>
              </div>
              <button
                onClick={() => isActive ? stopAll() : playStation(station.idx)}
                className={`pixel-border px-1.5 py-0.5 text-[6px] sm:text-[7px] font-mono tracking-wider shrink-0 transition-all duration-200 active:scale-[0.97] ${
                  isActive
                    ? 'bg-[#14FE17] text-[#050505] border-[#14FE17]'
                    : 'bg-[#0D1A0D] text-[#14FE17] hover:bg-[#14FE1710]'
                }`}
              >
                {isActive ? 'СТОП' : 'PLAY'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Volume slider */}
      <div className="mt-2.5 pt-2 border-t border-[#14FE1520]">
        <div className="flex items-center gap-2">
          <span className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono tracking-wider shrink-0">🔊 ГРОМК:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-1 appearance-none bg-[#0D1A0D] border border-[#14FE1530] rounded-sm cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:bg-[#14FE17] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#0B8C0D]
                       [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_4px_#14FE1740]"
          />
          <span className="text-[6px] sm:text-[7px] text-[#14FE17] font-mono w-6 text-right">{volume}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   ASCII ART CHARACTER PORTRAIT
   ============================================================ */
function ASCIIPortraitSection() {
  // Only show if resident card is generated
  const hasCard = typeof window !== 'undefined' ? !!localStorage.getItem('vault18-resident-card') : false;
  const [show, setShow] = useState(hasCard);

  useEffect(() => {
    const check = () => {
      setShow(!!localStorage.getItem('vault18-resident-card'));
    };
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  const card = (() => {
    if (!show) return null;
    const stored = localStorage.getItem('vault18-resident-card');
    if (!stored) return null;
    try { return JSON.parse(stored) as ResidentCard; } catch { return null; }
  })();

  if (!card) return null;

  const stats = card.stats;
  const isHigh = (val: number) => val >= 7;
  const isLow = (val: number) => val <= 3;

  // Build ASCII portrait based on stats
  const head = isHigh(stats.ИНТ) ? '  ░░░░░  ' : isLow(stats.ИНТ) ? '  ░░░  ' : '  ░░░░  ';
  const face = isHigh(stats.ХАР) ? '  (:))   ' : '  (:|)   ';
  const shoulders = isHigh(stats.СИЛ) ? ' ████▓████ ' : isLow(stats.СИЛ) ? ' ██▓██ ' : ' ███▓███ ';
  const body = isHigh(stats.ЛОВ) ? '  ║║▓║║  ' : '  ║║▓║║  ';
  const legs = isHigh(stats.ВЫН) ? '  ║║▓║║  ' : isLow(stats.ВЫН) ? '  ║▓║  ' : '  ║║▓║║  ';
  const feet = isHigh(stats.ВЫН) ? ' ▓▓▓▓▓▓▓▓ ' : ' ▓▓▓▓▓▓ ';

  // Determine class based on highest stat
  const statEntries = Object.entries(stats) as [keyof SpecialStats, number][];
  const maxStat = statEntries.reduce((a, b) => a[1] > b[1] ? a : b);
  const classMap: Record<string, string> = {
    'СИЛ': 'ВОИН',
    'ИНТ': 'УЧЁНЫЙ',
    'ХАР': 'ДИПЛОМАТ',
    'ЛОВ': 'РАЗВЕДЧИК',
    'ВЫН': 'ТАНК',
    'ВОС': 'СНАЙПЕР',
    'УДЧ': 'АВАНТЮРИСТ',
  };
  const charClass = classMap[maxStat[0]] || 'НЕИЗВЕСТНО';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="pixel-border bg-[#0A0A0A] p-3"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2 border-b border-[#14FE1730] pb-1.5">
        ▌ПОРТРЕТ ЖИТЕЛЯ
      </div>

      <div className="bg-[#050505] border border-[#14FE1515] p-2 relative overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #14FE1708 1px, #14FE1708 2px)' }}
        />
        <pre className="text-[8px] sm:text-[9px] text-[#14FE17] font-mono leading-[1.3] text-center fallout-glow-subtle">
{head}
{face}
{shoulders}
{body}
{legs}
{feet}
        </pre>
      </div>

      <div className="mt-2 text-center">
        <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider">КЛАСС: </span>
        <span className="text-[8px] sm:text-[9px] text-[#14FE17] font-mono font-bold tracking-[0.15em] fallout-glow-subtle">
          {charClass}
        </span>
      </div>
    </motion.div>
  );
}

/* ============================================================
   PHOTO GALLERY LIGHTBOX
   ============================================================ */
function GalleryLightbox({ images, initialIndex, onClose }: {
  images: { src: string; caption: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef(0);

  const goTo = useCallback((idx: number) => {
    if (idx < 0) idx = images.length - 1;
    if (idx >= images.length) idx = 0;
    setCurrentIndex(idx);
    playClickBeep();
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
      if (e.key === 'ArrowRight') goTo(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goTo, currentIndex]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] bg-[#000000E0] flex flex-col items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="scanline-overlay" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 pixel-border px-2 py-0.5 bg-[#0A0A0A90]
                   text-[#0B8C0D] font-mono text-[7px] sm:text-[8px] tracking-wider
                   hover:text-[#14FE17] transition-all duration-300 active:scale-[0.97]"
      >
        ✕ ЗАКРЫТЬ
      </button>

      {/* Image with AnimatePresence for transitions */}
      <div className="relative max-w-3xl w-full flex-1 flex items-center justify-center" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <img
              src={images[currentIndex].src}
              alt={images[currentIndex].caption}
              className="max-h-[60vh] sm:max-h-[70vh] w-auto object-contain pixel-border"
            />
          </motion.div>
        </AnimatePresence>

        {/* Left arrow */}
        <button
          onClick={() => goTo(currentIndex - 1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 pixel-border px-2 py-3 bg-[#0A0A0A90]
                     text-[#14FE17] font-mono text-sm hover:bg-[#14FE1720] transition-all duration-200 active:scale-[0.97]"
        >
          ◀
        </button>

        {/* Right arrow */}
        <button
          onClick={() => goTo(currentIndex + 1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 pixel-border px-2 py-3 bg-[#0A0A0A90]
                     text-[#14FE17] font-mono text-sm hover:bg-[#14FE1720] transition-all duration-200 active:scale-[0.97]"
        >
          ▶
        </button>
      </div>

      {/* Caption and counter */}
      <div className="mt-3 text-center">
        <div className="text-[8px] sm:text-[10px] text-[#14FE17] font-mono tracking-wider fallout-glow-subtle mb-1">
          {images[currentIndex].caption}
        </div>
        <div className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider">
          {currentIndex + 1}/{images.length}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   SCROLL TO TOP BUTTON
   ============================================================ */
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playClickBeep();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed right-4 bottom-24 z-40 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#14FE17] text-[#050505]
                     flex items-center justify-center scroll-top-btn active:scale-[0.97]"
          aria-label="Scroll to top"
        >
          <span className="text-xs sm:text-sm font-bold">▲</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   SCROLL PROGRESS INDICATOR
   ============================================================ */
function ScrollProgressIndicator() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, pct));
      setVisible(scrollTop > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 h-[2px] z-[10000] bg-[#14FE17] scroll-progress-glow"
      style={{ width: `${progress}%` }}
    />
  );
}

/* ============================================================
   GEIGER COUNTER WIDGET
   ============================================================ */
function GeigerCounter() {
  const [needleAngle, setNeedleAngle] = useState(-30);
  const [clickCount, setClickCount] = useState(0);

  // Animate the needle with subtle random wobble
  useEffect(() => {
    const interval = setInterval(() => {
      setNeedleAngle(-30 + Math.random() * 8 - 4);
      // Visual click counter only (sound removed per user request)
      if (Math.random() > 0.7) {
        setClickCount(prev => prev + 1);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="pixel-border bg-[#0A0A0A] p-3 geiger-glow"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2 border-b border-[#14FE1730] pb-1.5 flex items-center justify-between">
        <span>▌ДОЗИМЕТР</span>
        <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-normal tracking-wider">
          ☢ РАДИАЦИЯ
        </span>
      </div>

      {/* SVG Gauge */}
      <div className="flex justify-center mb-2">
        <svg viewBox="0 0 200 120" className="w-full max-w-[220px]" fill="none">
          {/* Gauge arc background */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            stroke="#0B8C0D"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Green zone (safe) */}
          <path
            d="M 20 100 A 80 80 0 0 1 80 25"
            stroke="#14FE17"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Yellow zone */}
          <path
            d="M 80 25 A 80 80 0 0 1 130 22"
            stroke="#F1AC43"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Red zone (danger) */}
          <path
            d="M 130 22 A 80 80 0 0 1 180 100"
            stroke="#FF5252"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Tick marks */}
          {Array.from({ length: 11 }).map((_, i) => {
            const angle = -180 + i * 18;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + 72 * Math.cos(rad);
            const y1 = 100 - 72 * Math.sin(rad);
            const x2 = 100 + 80 * Math.cos(rad);
            const y2 = 100 - 80 * Math.sin(rad);
            return <line key={i} x1={x1} y1={-y1 + 200} x2={x2} y2={-y2 + 200} stroke="#0B8C0D" strokeWidth="1" opacity="0.4" />;
          })}
          {/* Needle */}
          <g transform={`translate(100, 100)`}>
            <line
              x1="0" y1="0"
              x2={65 * Math.cos(((needleAngle - 90) * Math.PI) / 180)}
              y2={65 * Math.sin(((needleAngle - 90) * Math.PI) / 180)}
              stroke="#14FE17"
              strokeWidth="2"
              className="geiger-needle-wobble"
              style={{ filter: 'drop-shadow(0 0 3px #14FE17)' }}
            />
            <circle cx="0" cy="0" r="4" fill="#14FE17" />
            <circle cx="0" cy="0" r="2" fill="#050505" />
          </g>
          {/* Labels */}
          <text x="30" y="95" fontSize="6" fontFamily="monospace" fill="#0B8C0D">0</text>
          <text x="88" y="35" fontSize="6" fontFamily="monospace" fill="#F1AC43">0.05</text>
          <text x="150" y="95" fontSize="6" fontFamily="monospace" fill="#FF5252">0.1</text>
        </svg>
      </div>

      {/* Digital readout */}
      <div className="pixel-border bg-[#050505] p-2 text-center">
        <div className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider mb-0.5">
          УРОВЕНЬ РАДИАЦИИ:
        </div>
        <div className="text-[16px] sm:text-xl font-mono font-bold text-[#14FE17] fallout-glow-subtle tracking-wider">
          0.03 <span className="text-[10px] sm:text-xs text-[#0B8C0D]">ЗВ/Ч</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full bg-[#14FE17] ${clickCount % 2 === 0 ? 'opacity-100' : 'opacity-30'}`} />
          <span className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono tracking-wider">
            СТАТУС: БЕЗОПАСНО
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   GUEST BOOK SECTION
   ============================================================ */
interface GuestEntry {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

const GUESTBOOK_STORAGE_KEY = 'vault18-guestbook';

function loadGuestbook(): GuestEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(GUESTBOOK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestbook(entries: GuestEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(entries));
}

function GuestBookSection() {
  const [entries, setEntries] = useState<GuestEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(GUESTBOOK_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError('ВВЕДИТЕ ИМЯ');
      return;
    }
    if (!trimmedMessage) {
      setError('ВВЕДИТЕ СООБЩЕНИЕ');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Simulate terminal processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const newEntry: GuestEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: trimmedName,
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...entries].slice(0, 50);
    saveGuestbook(updated);
    setEntries(updated);
    setName('');
    setMessage('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    playTerminalBeep();
    setIsSubmitting(false);
  }, [name, message, entries]);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'только что';
    if (diffMin < 60) return `${diffMin} мин. назад`;
    if (diffHour < 24) return `${diffHour} ч. назад`;
    if (diffDay < 7) return `${diffDay} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="pixel-border bg-[#0A0A0A] p-3 sm:p-4"
    >
      <div className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono tracking-[0.2em] font-bold mb-2.5 border-b border-[#14FE1730] pb-1.5">
        ▌ЖУРНАЛ УБЕЖИЩА — ГОСТЕВАЯ КНИГА
      </div>

      {/* Entry form */}
      <div className="space-y-2 mb-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="ВАШЕ ИМЯ..."
          maxLength={50}
          className="w-full pixel-border bg-[#0D1A0D] px-2.5 py-1.5 text-[#14FE17] font-mono text-[9px] sm:text-[10px]
                     placeholder:text-[#0B8C0D] focus:outline-none focus:border-[#14FE17] transition-colors"
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="СООБЩЕНИЕ ДЛЯ ЖУРНАЛА УБЕЖИЩА..."
          maxLength={500}
          rows={2}
          className="w-full pixel-border bg-[#0D1A0D] px-2.5 py-1.5 text-[#14FE17] font-mono text-[9px] sm:text-[10px]
                     placeholder:text-[#0B8C0D] focus:outline-none focus:border-[#14FE17] transition-colors resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full pixel-border-bright px-4 py-2 bg-[#0D1A0D] text-[#14FE17] font-mono
                     text-[8px] sm:text-[10px] tracking-[0.2em] hover:bg-[#14FE17] hover:text-[#050505]
                     transition-all duration-300 active:scale-[0.98] fallout-glow-subtle disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'ОТПРАВКА...' : '📝 ОСТАВИТЬ ЗАПИСЬ В ЖУРНАЛЕ УБЕЖИЩА'}
        </button>

        {error && (
          <div className="text-[8px] text-red-500 font-mono text-center">⚠ {error}</div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[8px] text-[#14FE17] font-mono text-center fallout-glow-subtle"
          >
            ✓ ЗАПИСЬ ДОБАВЛЕНА В ЖУРНАЛ
          </motion.div>
        )}
      </div>

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="border-t border-[#14FE1730] pt-2.5 space-y-2 max-h-60 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="pixel-border bg-[#0D1A0D] p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] sm:text-[9px] text-[#14FE17] font-mono font-bold fallout-glow-subtle">
                  ▌{entry.name.toUpperCase()}
                </span>
                <span className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono">
                  {formatRelativeTime(entry.createdAt)}
                </span>
              </div>
              <div className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono leading-[1.4]">
                {entry.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono py-2 opacity-50">
          ЖУРНАЛ ПУСТ — БУДЬТЕ ПЕРВЫМ
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================
   MAIN INVITATION PAGE (with 2-column desktop layout)
   ============================================================ */
function MainPage({ onNavigate, onHackStart, onLockpickStart }: { onNavigate: (s: Screen) => void; onHackStart: () => void; onLockpickStart: () => void }) {
  // Parallax offset for NuclearBlastSVG on desktop
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPullReveal, setShowPullReveal] = useState(false);
  const blastRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!blastRef.current) return;
      const rect = blastRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      if (rect.top < windowH && rect.bottom > 0) {
        const progress = (windowH - rect.top) / (windowH + rect.height);
        setParallaxOffset((progress - 0.5) * 20);
      }

      // Pull-to-reveal: detect overscroll at top
      const currentScrollTop = window.scrollY;
      if (currentScrollTop <= 0 && lastScrollTop.current <= 0 && !showPullReveal) {
        setShowPullReveal(true);
        setTimeout(() => setShowPullReveal(false), 2500);
      }
      lastScrollTop.current = currentScrollTop;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showPullReveal]);

  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-20 pt-[76px] sm:pt-[84px] px-4 sm:px-8 relative overflow-x-hidden hex-bg">
      <div className="scanline-overlay" />

      {/* Pull-to-reveal refresh indicator */}
      <AnimatePresence>
        {showPullReveal && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="fixed top-[84px] sm:top-[92px] left-0 right-0 z-20 text-center pointer-events-none"
          >
            <div className="inline-block pixel-border bg-[#0A0A0AE6] backdrop-blur-sm px-3 py-1.5">
              <span className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono tracking-wider fallout-glow-subtle">
                ▌ОБНОВЛЕНИЕ ДАННЫХ...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data stream background behind header */}
      <div className="data-stream-bg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-6 relative z-10"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <RadiationSVG className="w-4 h-4 sm:w-6 sm:h-6 text-[#0B8C0D] opacity-60" />
            <span className="text-[7px] sm:text-[9px] text-[#0B8C0D] font-mono tracking-[0.3em]">
              VAULT-TEC™ PRESENTS
            </span>
            <RadiationSVG className="w-4 h-4 sm:w-6 sm:h-6 text-[#0B8C0D] opacity-60 rotate-180" />
          </div>

          <h1 className="text-[22px] lg:text-5xl sm:text-4xl font-mono font-bold text-[#14FE17] fallout-glow tracking-[0.15em] leading-tight glitch-title">
            УБЕЖИЩЕ №18
          </h1>
          <div className="text-[9px] sm:text-xs text-[#0B8C0D] font-mono tracking-[0.2em] mt-0.5">
            КРИМИНАЛЬНЫЙ РОСТОВ-НА-ДОНУ
          </div>
          
          <div className="flex items-center justify-center gap-1 mt-2">
            <div className="h-[1px] w-12 bg-[#14FE1740]" />
            <RadiationSVG className="w-2.5 h-2.5 text-[#14FE17] opacity-40" />
            <div className="h-[1px] w-12 bg-[#14FE1740]" />
          </div>
        </motion.div>
      </div>

        {/* 2-column layout on lg+ */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 sm:space-y-6 lg:space-y-0">
          {/* Left column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Vault Door Widget */}
            <VaultDoorWidget />

            <TerminalDivider icon="🗝" />

            {/* Nuclear blast divider with parallax */}
            <motion.div
              ref={blastRef}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="flex justify-center"
              style={{ transform: `translateY(${parallaxOffset}px)` }}
            >
              <NuclearBlastSVG className="w-20 h-20 sm:w-28 sm:h-28 text-[#14FE17] flicker" />
            </motion.div>

            {/* Invitation card with seal and scan line */}
            <div className="relative">
              <VaultTecSeal />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative pixel-border-bright bg-[#0A0A0A] p-3 sm:p-5 space-y-3 lg:max-w-2xl card-hover-lift holo-shimmer"
              >
                <CardScanLine />

                {/* CLASSIFIED stamp */}
                <div className="classified-stamp">CLASSIFIED</div>

                <div className="text-center text-[#14FE17] font-mono text-[9px] sm:text-[11px] tracking-[0.2em] border-b border-[#14FE1730] pb-2">
                  ▶ ВХОДЯЩЕЕ СООБЩЕНИЕ ◀
                </div>

                <div className="text-[#14FE17] font-mono text-[11px] sm:text-sm leading-[1.6] space-y-2.5 letter-spacing-[0.05em]">
                  <p className="text-[#F1AC43] font-bold">Приветствуем, Избранный!</p>

                  <p>
                    Твой Пип-бой зафиксировал сигнал, который получают единицы. Vault-Tec™ подтверждает: ты держишь в руках <span className="fallout-glow-subtle font-bold">Золотой билет</span>. Это не случайность и не удача. Мы наблюдали за тобой, житель Криминального Ростова. Твои решения, твоя воля, твой путь сквозь Пустошь — всё говорило о том, что ты достоин. И теперь ты призван.
                  </p>

                  <p>
                    Убежище №18 открывает свои герметичные двери для узкого круга избранных. Наш Смотритель{' '}
                    <span className="fallout-glow-subtle font-bold">Макаров Андрей</span> — наша надежда, наша защита и наш свет в конце туннеля — отметит свой{' '}
                    <span className="text-[18px] sm:text-xl font-bold age-glow-dramatic">29-й</span>{' '}
                    год жизни 29 мая. Но празднование состоится{' '}
                    <span className="fallout-glow-subtle font-bold">30 мая</span>, ибо великий Смотритель решил: истинный пир должен быть отделён от мирской даты. Он ждёт тебя в свой чертог, чтобы разделить этот день с братьями.
                  </p>

                  <p className="text-[#F1AC43] font-bold">
                    Формат — чисто мужской. Вторые половинки остаются за порогом. Только ты, твой Пип-бой и братство избранных.
                  </p>

                  <p>
                    Столы накрыты. Шашлычки из игуаны источают аромат, достойный довоенных легенд. Картофель «Тошка» золотится. Рад-овощи нарезаны, мутированные соусы густеют. «Хиросима» пиво, ядер-виски и «Нюка-Кола» ждут своего часа. Криокамеры... <span className="text-[#FF5252]">ошибка</span> ...праздничные хлопушки готовы.
                  </p>

                  <p className="text-[#14FE17] font-bold">
                    Войти в Убежище №18 — честь. Остаться в нём — судьба.
                  </p>

                  {/* Event details box */}
                  <div className="pixel-border bg-[#0D1A0D] p-2.5 sm:p-3 text-[9px] sm:text-[11px] space-y-1">
                    <div className="text-[#14FE17] font-bold tracking-wider mb-1.5 text-[10px] sm:text-xs">
                      ▌ДАННЫЕ МЕРОПРИЯТИЯ:
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                      <span className="text-[#0B8C0D] font-bold">СМОТРИТЕЛЬ:</span><span>Макаров Андрей</span>
                      <span className="text-[#0B8C0D] font-bold">ВОЗРАСТ:</span><span>29 лет</span>
                      <span className="text-[#0B8C0D] font-bold">УБЕЖИЩЕ:</span><span>№18</span>
                      <span className="text-[#0B8C0D] font-bold">ДАТА:</span><span>30 мая 2026</span>
                      <span className="text-[#0B8C0D] font-bold">ВРЕМЯ:</span><span>13:00</span>
                      <span className="text-[#0B8C0D] font-bold">ЛОКАЦИЯ:</span><span>Country Lake</span>
                      <span className="text-[#0B8C0D] font-bold">АДРЕС:</span><span>ул. Левобережная 34</span>
                      <span className="text-[#0B8C0D] font-bold">РАЙОН:</span><span>ст-ца Ольгинская</span>
                      <span className="text-[#0B8C0D] font-bold">ПУТЬ:</span><span>6 км от Аксайского моста</span>
                      <span className="text-[#0B8C0D] font-bold">ФОРМАТ:</span><span className="text-[#F1AC43]">ТОЛЬКО МУЖЧИНЫ</span>
                      <span className="text-[#0B8C0D] font-bold">СТАТУС:</span><span className="text-[#F1AC43]">ПРИГЛАШЕНИЕ АКТИВНО ✓</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#14FE17] status-pulse-dot ml-1" />
                    </div>
                  </div>

                  <p className="text-[#14FE17] font-bold fallout-glow-subtle">
                    Ждём тебя 30 мая 2026 года, в 13:00. Станица Ольгинская, ул. Левобережная, 34, COUNTRY LAKE.
                  </p>

                  <p className="text-[#0B8C0D] text-[9px] sm:text-[10px]">
                    Vault-Tec™. Мы наблюдаем. Мы выбираем. Мы ждём.
                  </p>

                  {/* Vault-Tec watermark */}
                  <div className="text-center vault-watermark mt-2">V-18-2077</div>
                </div>
              </motion.div>
            </div>

            <TerminalDivider icon="☢" />

            {/* Vault Rules */}
            <VaultRules />

            <TerminalDivider icon="⚡" />

            {/* Photo Gallery Section */}
            <PhotoGallery />

            <TerminalDivider icon="📡" />

            {/* Vault Boy with speech bubble */}
            <VaultBoyParallax />

            <TerminalDivider icon="🧬" />

            {/* ASCII Art Character Portrait */}
            <ASCIIPortraitSection />

            <TerminalDivider icon="📝" />

            {/* Guest Book */}
            <GuestBookSection />
          </div>

          {/* Right column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Countdown Timer */}
            <CountdownTimer />

            <TerminalDivider icon="⏱" />

            {/* Wasteland Weather */}
            <WastelandWeather />

            <TerminalDivider icon="☢" />

            {/* Geiger Counter */}
            <GeigerCounter />

            <TerminalDivider icon="📋" />

            {/* Quest Tracker */}
            <QuestTrackerSection />

            <TerminalDivider icon="📍" />

            {/* RSVP */}
            <RSVPSection onConfirm={triggerConfetti} />
            <ConfettiEffect show={showConfetti} />

            <TerminalDivider icon="📍" />

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="space-y-2.5"
            >
              <button
                onClick={() => { onNavigate('location'); playClickBeep(); }}
                className="w-full pixel-border-bright px-4 py-2.5 sm:py-3.5 bg-[#0D1A0D] text-[#14FE17] font-mono
                           text-[10px] sm:text-xs tracking-[0.2em] hover:bg-[#14FE17] hover:text-[#050505]
                           transition-all duration-300 active:scale-[0.98] fallout-glow-subtle"
              >
                📍 ПОКАЗАТЬ ЛОКАЦИЮ УБЕЖИЩА
              </button>

              <button
                onClick={() => { onNavigate('chat'); playClickBeep(); }}
                className="w-full pixel-border px-4 py-2.5 sm:py-3.5 bg-[#0D1A0D] text-[#14FE17] font-mono
                           text-[10px] sm:text-xs tracking-[0.2em] hover:bg-[#14FE17] hover:text-[#050505]
                           transition-all duration-300 active:scale-[0.98]"
              >
                🤖 ПОГОВОРИТЬ С ВОЛТБОЕМ
              </button>

              <button
                onClick={() => { onHackStart(); playClickBeep(); }}
                className="w-full pixel-border px-4 py-2.5 sm:py-3.5 bg-[#0D1A0D] text-[#F1AC43] font-mono
                           text-[10px] sm:text-xs tracking-[0.2em] hover:bg-[#F1AC43] hover:text-[#050505]
                           transition-all duration-300 active:scale-[0.98]"
              >
                🔐 ВЗЛОМ ТЕРМИНАЛА
              </button>

              <button
                onClick={() => { onLockpickStart(); playClickBeep(); }}
                className="w-full pixel-border px-4 py-2.5 sm:py-3.5 bg-[#0D1A0D] text-[#14FE17] font-mono
                           text-[10px] sm:text-xs tracking-[0.2em] hover:bg-[#14FE17] hover:text-[#050505]
                           transition-all duration-300 active:scale-[0.98]"
              >
                🔓 ВЗЛОМ ЗАМКА
              </button>
            </motion.div>

            <TerminalDivider icon="☢" />

            {/* Vault Resident Card */}
            <VaultResidentCardSection />

            <TerminalDivider icon="🧬" />

            {/* Perk Selection */}
            <PerkSelectionSection />

            <TerminalDivider icon="🥤" />

            {/* Nuka-Cola Drink Menu */}
            <NukaColaMenu />

            <TerminalDivider icon="📻" />

            {/* Wasteland Radio */}
            <WastelandRadio />

            <TerminalDivider icon="🏆" />

            {/* Achievement Tracker */}
            <AchievementTracker />
          </div>
        </div>

        {/* Footer - full width */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center space-y-1.5 pt-4 sm:pt-6 pb-2 mt-4 sm:mt-6 border-t border-[#14FE1715] pixel-border bg-[#0A0A0A] p-3 sm:p-4 relative"
        >
          {/* Slow rotating vault door in center */}
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 footer-vault-spin opacity-20">
              <VaultDoorSVG className="w-full h-full" />
            </div>
          </div>

          <div className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono tracking-wider">
            VAULT-TEC™ — ВАША БЕЗОПАСНОСТЬ — НАШ ПРИОРИТЕТ
          </div>
          <div className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono tracking-wider">
            УБЕЖИЩЕ №18 • КРИМИНАЛЬНЫЙ РОСТОВ-НА-ДОНУ • <span className="year-2077-glow">2077</span>
          </div>

          {/* Sector and Grid info */}
          <div className="flex items-center justify-center gap-3 text-[5px] sm:text-[6px] text-[#0B8C0D] font-mono tracking-wider">
            <span>SECTOR: 18-A</span>
            <span>•</span>
            <span>GRID: 47.2N 39.7E</span>
          </div>

          {/* Signal strength indicator */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[5px] sm:text-[6px] text-[#0B8C0D] font-mono tracking-wider">SIGNAL STATUS:</span>
            <div className="flex items-end gap-[2px]">
              <div className="w-[3px] h-[4px] bg-[#14FE17] signal-bar-anim" style={{ animationDelay: '0s' }} />
              <div className="w-[3px] h-[6px] bg-[#14FE17] signal-bar-anim" style={{ animationDelay: '0.15s' }} />
              <div className="w-[3px] h-[8px] bg-[#14FE17] signal-bar-anim" style={{ animationDelay: '0.3s' }} />
              <div className="w-[3px] h-[10px] bg-[#14FE17] signal-bar-anim" style={{ animationDelay: '0.45s' }} />
              <div className="w-[3px] h-[10px] bg-[#0B8C0D] opacity-30" />
            </div>
            <span className="text-[5px] sm:text-[6px] text-[#14FE17] font-mono tracking-wider">STRONG</span>
          </div>

          <div className="text-[5px] sm:text-[6px] font-mono tracking-wider footer-shimmer">
            POWERED BY VAULT-TEC™
          </div>
          <div className="flex items-center justify-center gap-1">
            <RadiationSVG className="w-2.5 h-2.5 text-[#0B8C0D]" />
            <span className="text-[5px] sm:text-[6px] text-[#0B8C0D] font-mono">
              РАДИАЦИЯ — 0.03 ЗВ/Ч — БЕЗОПАСНО
            </span>
            <RadiationSVG className="w-2.5 h-2.5 text-[#0B8C0D]" />
          </div>
          <div className="text-[5px] sm:text-[6px] text-[#0B8C0D] font-mono opacity-50 tracking-wider">
            ДАННОЕ ПРИГЛАШЕНИЕ ЯВЛЯЕТСЯ ОФИЦИАЛЬНЫМ ДОКУМЕНТОМ VAULT-TEC • НЕ ПОДЛЕЖИТ КОПИРОВАНИЮ БЕЗ РАЗРЕШЕНИЯ
          </div>
        </motion.div>

      {/* Floating radiation icons on desktop */}
      <FloatingRadiationIcons />
    </div>
  );
}

/* ============================================================
   LOCATION PAGE (with compass and route steps)
   ============================================================ */
function LocationPage() {
  const routeSteps = [
    { num: 1, text: 'Аксайский мост', icon: '🌉' },
    { num: 2, text: 'Дорога на Ольгинскую', icon: '🛤' },
    { num: 3, text: 'Country Lake', icon: '📍' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-20 pt-[76px] sm:pt-[84px] px-4 sm:px-8 relative road-grid-bg">
      <div className="scanline-overlay" />
      
      <div className="max-w-lg mx-auto space-y-3 sm:space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 compass-wiggle text-[#14FE17]">
              <CompassSVG className="w-full h-full" />
            </div>
          </div>
          <h2 className="text-base sm:text-2xl font-mono font-bold text-[#14FE17] fallout-glow tracking-wider">
            📍 ЛОКАЦИЯ УБЕЖИЩА
          </h2>
          <div className="text-[8px] sm:text-[10px] text-[#0B8C0D] font-mono tracking-wider mt-0.5">
            УБЕЖИЩЕ №18 — КАРТА ПУТИ К СПАСЕНИЮ
          </div>
          {/* Distance badge */}
          <div className="mt-2 inline-flex items-center gap-1.5 distance-badge px-2.5 py-1 mx-auto">
            <span className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono tracking-wider">📍 ~25 МИН ОТ ЦЕНТРА РОСТОВА</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="pixel-border bg-[#0A0A0A] p-3 sm:p-4 card-hover-lift"
        >
          <div className="text-[8px] sm:text-[10px] text-[#14FE17] font-mono tracking-wider mb-2 border-b border-[#14FE1730] pb-1.5">
            ▌МАРШРУТ К УБЕЖИЩУ:
          </div>
          <div className="space-y-2">
            {routeSteps.map((step, i) => (
              <div key={step.num} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 pixel-border bg-[#0D1A0D] flex items-center justify-center text-[9px] sm:text-[10px] ${i === routeSteps.length - 1 ? 'text-[#F1AC43] quest-bounce' : 'text-[#14FE17]'}`}>
                    {step.num}
                  </div>
                  {i < routeSteps.length - 1 && (
                    <div className="w-[2px] h-3 route-dash-animate" />
                  )}
                </div>
                <span className="text-[9px] sm:text-[11px] text-[#14FE17] font-mono">
                  {step.icon} {step.text}
                </span>
                {i < routeSteps.length - 1 && (
                  <span className="text-[7px] text-[#0B8C0D] font-mono ml-auto">→</span>
                )}
                {i === routeSteps.length - 1 && (
                  <span className="text-[7px] text-[#F1AC43] font-mono ml-auto">УБЕЖИЩЕ ✓</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="pixel-border-bright overflow-hidden"
        >
          {/* Nav mode header */}
          <div className="nav-mode-header bg-[#0A0A0A] px-3 py-1.5 border-b border-[#14FE1740]">
            <div className="text-[7px] sm:text-[8px] text-[#14FE17] font-mono text-center tracking-wider">
              ▌РЕЖИМ НАВИГАЦИИ: АКТИВЕН ●
            </div>
          </div>
          <div className="bg-[#0A0A0A] px-3 py-0.5 border-b border-[#14FE1715]">
            <div className="text-[6px] sm:text-[7px] text-[#0B8C0D] font-mono text-center">
              🗺 КАРТА ПУСТОШИ • УРОВЕНЬ РАДИАЦИИ: НИЗКИЙ
            </div>
          </div>
          <div
            className="w-full h-[260px] sm:h-[400px] bg-[#0A0A0A] fallout-map overflow-hidden"
          >
            <iframe
              src="https://yandex.ru/map-widget/v1/-/CPWjIG3S"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ filter: 'hue-rotate(80deg) saturate(2) brightness(0.7) contrast(1.3)', pointerEvents: 'auto' }}
              allowFullScreen
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pixel-border bg-[#0A0A0A] p-3 sm:p-4 space-y-2.5 card-hover-lift"
        >
          <div className="text-[#14FE17] font-mono text-[9px] sm:text-[11px] tracking-wider border-b border-[#14FE1730] pb-1.5">
            ▌КОНТАКТНЫЕ ДАННЫЕ УБЕЖИЩА:
          </div>

          <div className="space-y-1.5 text-[9px] sm:text-[11px]">
            {[
              ['НАЗВАНИЕ:', 'Country Lake'],
              ['АДРЕС:', 'ул. Левобережная 34'],
              ['РАЙОН:', 'ст-ца Ольгинская'],
              ['ПУТЬ:', 'по дороге на Ольгинскую'],
              ['ОРИЕНТИР:', '6 км от Аксайского моста'],
              ['ГОРОД:', 'Криминальный Ростов-на-Дону'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-2 text-[#14FE17] font-mono">
                <span className="text-[#0B8C0D] shrink-0">▸</span>
                <span><span className="text-[#0B8C0D]">{label}</span> {value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            <a
              href="https://yandex.ru/maps/-/CPWjIG3S"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full pixel-border-bright px-4 py-2 sm:py-2.5 bg-[#0D1A0D] text-[#14FE17] font-mono
                         text-[9px] sm:text-[10px] tracking-[0.2em] text-center
                         hover:bg-[#14FE17] hover:text-[#050505] transition-all duration-300 active:scale-[0.98] yandex-pulse"
            >
              🧭 ОТКРЫТЬ В ЯНДЕКС.КАРТАХ
            </a>
            <a
              href="https://countrylake.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full pixel-border px-4 py-2 sm:py-2.5 bg-[#0D1A0D] text-[#14FE17] font-mono
                         text-[9px] sm:text-[10px] tracking-[0.2em] text-center
                         hover:bg-[#14FE17] hover:text-[#050505] transition-all duration-300 active:scale-[0.98]"
            >
              🌐 COUNTRYLAKE.RU
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================
   TYPING INDICATOR
   ============================================================ */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#14FE17]" />
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#14FE17]" />
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#14FE17]" />
    </div>
  );
}

/* ============================================================
   VAULTBOY CHAT (enhanced)
   ============================================================ */
function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Приветствую, житель Криминального Ростова! 🟢 Я — Волтбой, ассистент Убежища №18. Чем могу помочь? Спрашивайте о Дне Рождения Андрея, маршруте к Убежищу или правилах безопасности. Vault-Tec всегда к вашим услугам!',
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgFlash, setNewMsgFlash] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickReplies = ['Что будет?', 'Как добраться?', 'Во сколько?'];

  const initialGreeting: ChatMessage = {
    role: 'assistant',
    content: 'Приветствую, житель Криминального Ростова! 🟢 Я — Волтбой, ассистент Убежища №18. Чем могу помочь? Спрашивайте о Дне Рождения Андрея, маршруте к Убежищу или правилах безопасности. Vault-Tec всегда к вашим услугам!',
    timestamp: Date.now(),
  };

  const sendMessage = useCallback(async (msgText?: string) => {
    const text = msgText || input.trim();
    if (!text || isLoading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
    setIsLoading(true);
    playClickBeep();
    localStorage.setItem('vault18-chatted', 'true');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: Date.now() }]);
      setNewMsgFlash(true);
      setTimeout(() => setNewMsgFlash(false), 1500);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠ ОШИБКА СИСТЕМЫ: Терминал Убежища временно недоступен. Vault-Tec приносит извинения.',
        timestamp: Date.now(),
      }]);
      setNewMsgFlash(true);
      setTimeout(() => setNewMsgFlash(false), 1500);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const clearChat = useCallback(() => {
    setMessages([{ ...initialGreeting, timestamp: Date.now() }]);
    playClickBeep();
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 60);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] pb-20 pt-[76px] sm:pt-[84px] px-3 sm:px-8 relative flex flex-col">
      <div className="scanline-overlay" />

      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2 sm:mb-3"
        >
          <div className="flex items-center justify-center gap-2">
            <img src="/vault-boy.png" alt="VaultBoy" className="w-9 h-9 sm:w-12 sm:h-12 object-contain" />
            <div className="text-left">
              <h2 className="text-sm sm:text-lg font-mono font-bold text-[#14FE17] fallout-glow tracking-wider">
                ВОЛТБОЙ
              </h2>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#14FE17] animate-pulse" />
                <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono tracking-wider">
                  АССИСТЕНТ УБЕЖИЩА №18 • В СЕТИ
                </span>
                <span className="text-[7px] sm:text-[8px] text-[#0B8C0D] font-mono ml-1">
                  SIGNAL: STRONG <span className="signal-bar" style={{ height: '4px' }} /><span className="signal-bar" style={{ height: '6px' }} /><span className="signal-bar" style={{ height: '8px' }} /><span className="signal-bar" style={{ height: '10px' }} />
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative flex-1 flex flex-col">
          {/* Clear chat button */}
          <button
            onClick={clearChat}
            className="absolute top-1 right-1 z-10 pixel-border px-1.5 py-0.5 bg-[#0A0A0A90] backdrop-blur-sm
                       text-[#0B8C0D] font-mono text-[6px] sm:text-[7px] tracking-wider
                       hover:text-[#14FE17] transition-all duration-300 active:scale-[0.97]"
          >
            ОЧИСТИТЬ
          </button>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 pixel-border bg-[#0A0A0A] p-2.5 sm:p-3 space-y-2 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto chat-static-bg chat-diagonal-bg"
          >
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${msg.role === 'user' ? 'ml-8 sm:ml-12' : 'mr-2'}`}
              >
                <div className={`flex items-center gap-1 text-[6px] sm:text-[7px] font-mono mb-0.5 ${
                  msg.role === 'user' ? 'text-[#F1AC43] justify-end' : 'text-[#0B8C0D]'
                }`}>
                  {msg.role === 'assistant' && (
                    <RadiationSVG className="w-2.5 h-2.5 text-[#0B8C0D] shrink-0" />
                  )}
                  <span>{msg.role === 'user' ? '▌ВЫ' : '▌ВОЛТБОЙ'}</span>
                  <span className="opacity-50">{formatTime(msg.timestamp)}</span>
                </div>
                <div className={`text-[9px] sm:text-[11px] font-mono leading-[1.5] p-2 border ${
                  msg.role === 'user'
                    ? 'border-[#F1AC4330] bg-[#F1AC4308] text-[#F1AC43]'
                    : `border-[#14FE1720] bg-[#14FE1705] text-[#14FE17]${newMsgFlash && i === messages.length - 1 && msg.role === 'assistant' ? ' msg-flash' : ''}`
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="chat-markdown">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="mr-2">
                <div className="flex items-center gap-1 text-[6px] sm:text-[7px] font-mono mb-0.5 text-[#0B8C0D]">
                  <RadiationSVG className="w-2.5 h-2.5 text-[#0B8C0D] shrink-0" />
                  <span>▌ВОЛТБОЙ</span>
                </div>
                <div className="text-[9px] sm:text-[11px] font-mono text-[#0B8C0D] p-2 border border-[#14FE1715]">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={scrollToBottom}
              className="absolute bottom-2 right-4 z-10 w-7 h-7 rounded-full bg-[#14FE17] text-[#050505] flex items-center justify-center
                         shadow-[0_0_8px_#14FE1740] hover:shadow-[0_0_12px_#14FE1780] transition-all duration-300 active:scale-[0.97]"
            >
              <span className="text-xs font-bold">▼</span>
            </motion.button>
          )}
        </div>

        {!isLoading && messages.length <= 2 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {quickReplies.map(qr => (
              <button
                key={qr}
                onClick={() => sendMessage(qr)}
                className="chip-hover pixel-border px-2 py-1 bg-[#0D1A0D] text-[#14FE17] font-mono
                           text-[8px] sm:text-[9px] tracking-wider hover:bg-[#14FE17] hover:text-[#050505]
                           transition-all duration-300 active:scale-[0.97]"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 flex gap-1.5 items-center">
          <span className="text-[10px] sm:text-xs text-[#14FE17] font-mono chat-cursor-prefix shrink-0">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Введите сообщение..."
            className="flex-1 pixel-border bg-[#0A0A0A] px-2.5 py-2.5 sm:py-2.5 text-[#14FE17] font-mono text-[10px] sm:text-xs
                       placeholder:text-[#0B8C0D] focus:outline-none transition-colors input-focus-glow"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="pixel-border-bright px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0D1A0D] text-[#14FE17] font-mono
                       text-[10px] sm:text-xs tracking-wider hover:bg-[#14FE17] hover:text-[#050505]
                       transition-all duration-300 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SLIDE TRANSITION VARIANTS
   ============================================================ */
const screenOrder: Record<string, number> = { main: 0, location: 1, chat: 2 };
const prevScreenRef = { current: 'main' };

function getSlideVariants(direction: 'left' | 'right' | 'none') {
  if (direction === 'none') {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0 },
    };
  }
  const xShift = direction === 'left' ? -80 : 80;
  return {
    initial: { opacity: 0, x: xShift },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -xShift },
  };
}

/* ============================================================
   MAIN APP (Screen Router)
   ============================================================ */
export default function Home() {
  const [screen, setScreen] = useState<Screen>('boot');
  const [showTerminal, setShowTerminal] = useState(false);
  const [showHacking, setShowHacking] = useState(false);
  const [showLockpick, setShowLockpick] = useState(false);
  const isMainApp = screen === 'main' || screen === 'location' || screen === 'chat';

  const handleSetScreen = useCallback((s: Screen) => {
    prevScreenRef.current = screen;
    setScreen(s);
  }, [screen]);

  const handleTripleTap = useCallback(() => {
    playTerminalBeep();
    setShowTerminal(true);
    localStorage.setItem('vault18-terminal', 'true');
  }, []);

  // Determine slide direction
  let slideDir: 'left' | 'right' | 'none' = 'none';
  if (screen !== 'boot' && screen !== 'encrypted' && screen !== 'vault-door') {
    const prev = prevScreenRef.current;
    if (prev in screenOrder && screen in screenOrder) {
      const diff = screenOrder[screen] - screenOrder[prev];
      if (diff > 0) slideDir = 'left';
      else if (diff < 0) slideDir = 'right';
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] text-[#14FE17] font-mono overflow-x-hidden">
      <div className="crt-edge-line" />
      <div className="vignette-overlay" />

      <AnimatePresence mode="wait">
        {screen === 'boot' && (
          <motion.div
            key="boot"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BootScreen onComplete={() => setScreen('encrypted')} />
          </motion.div>
        )}

        {screen === 'encrypted' && (
          <motion.div
            key="encrypted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <EncryptedScreen onAccept={() => setScreen('vault-door')} />
          </motion.div>
        )}

        {screen === 'vault-door' && (
          <motion.div
            key="vault-door"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VaultDoorTransition onComplete={() => setScreen('main')} />
          </motion.div>
        )}

        {isMainApp && (
          <motion.div
            key="app"
            initial={{ opacity: 0, x: slideDir === 'left' ? 80 : slideDir === 'right' ? -80 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDir === 'left' ? -80 : slideDir === 'right' ? 80 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <MusicPlayer position="left" />

            <div className="fixed top-3 left-3 z-50 flex items-center gap-1 mt-[34px] sm:mt-[40px]">
              <SoundToggle />
            </div>

            <NavBar screen={screen} setScreen={handleSetScreen} />

            <div className="fixed top-0 left-0 right-0 z-30 p-3 pt-2 sm:px-6">
              <PipBoyStatusBar onTripleTap={handleTripleTap} />
            </div>

            <div className="fixed top-[52px] sm:top-[60px] left-0 right-0 z-30 px-3 sm:px-6">
              <NewsTicker />
            </div>

            <RadioactiveParticles />
            <ScreenFlicker />
            <RandomEvents />
            <ScrollToTopButton />

            <AnimatePresence mode="wait">
              {screen === 'main' && (
                <motion.div
                  key="main-page"
                  initial={{ opacity: 0, x: slideDir === 'left' ? 40 : slideDir === 'right' ? -40 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDir === 'left' ? -40 : slideDir === 'right' ? 40 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <MainPage onNavigate={handleSetScreen} onHackStart={() => setShowHacking(true)} onLockpickStart={() => setShowLockpick(true)} />
                </motion.div>
              )}
              {screen === 'location' && (
                <motion.div
                  key="location-page"
                  initial={{ opacity: 0, x: slideDir === 'left' ? 40 : slideDir === 'right' ? -40 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDir === 'left' ? -40 : slideDir === 'right' ? 40 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <LocationPage />
                </motion.div>
              )}
              {screen === 'chat' && (
                <motion.div
                  key="chat-page"
                  initial={{ opacity: 0, x: slideDir === 'left' ? 40 : slideDir === 'right' ? -40 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDir === 'left' ? -40 : slideDir === 'right' ? 40 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChatPage />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secret Terminal Easter Egg */}
      <AnimatePresence>
        {showTerminal && (
          <SecretTerminal onClose={() => setShowTerminal(false)} />
        )}
      </AnimatePresence>

      {/* Hacking Minigame */}
      <AnimatePresence>
        {showHacking && (
          <HackingMinigame onClose={() => setShowHacking(false)} />
        )}
      </AnimatePresence>

      {/* Lockpick Minigame */}
      <AnimatePresence>
        {showLockpick && (
          <LockpickMinigame onClose={() => setShowLockpick(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
