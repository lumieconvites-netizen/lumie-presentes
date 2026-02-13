'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  photo?: string;
  createdAt: Date;
}

export interface GiftItem {
  id: string;
  title: string;
  description: string;
  value: number;
  photo?: string;
  quantity: number;
  quantityAvailable: number;
  status: 'active' | 'inactive';
}

export interface Message {
  id: string;
  guestName: string;
  message: string;
  giftId?: string;
  giftTitle?: string;
  amount?: number;
  date: Date;
  isPublic: boolean;
  isFavorite: boolean;
}

export interface Payment {
  id: string;
  guestName: string;
  guestEmail: string;
  giftTitle: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'paid' | 'pending' | 'refunded';
  date: Date;
  message?: string;
}

export interface PageBlock {
  id: string;
  type: 'hero' | 'message' | 'countdown' | 'gifts' | 'messages' | 'gallery' | 'event-info';
  order: number;
  enabled: boolean;
  config: any;
}

export interface UserSettings {
  feePassedToGuest: boolean;
  messagesPublic: boolean;
  published: boolean;
  theme?: {
    primary_color?: string;
    secondary_color?: string;
    background_color?: string;
    font_title?: string;
    font_body?: string;
  };
}

interface UserContextType {
  user: UserProfile | null;
  gifts: GiftItem[];
  messages: Message[];
  payments: Payment[];
  pageBlocks: PageBlock[];
  settings: UserSettings;

  updateUser: (user: Partial<UserProfile>) => void;

  addGift: (gift: Omit<GiftItem, 'id'>) => void;
  updateGift: (id: string, gift: Partial<GiftItem>) => void;
  deleteGift: (id: string) => void;

  addMessage: (message: Omit<Message, 'id'>) => void;
  toggleMessageVisibility: (id: string) => void;
  toggleMessageFavorite: (id: string) => void;

  addPayment: (payment: Omit<Payment, 'id'>) => void;

  updatePageBlocks: (blocks: PageBlock[]) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ========== DEFAULTS (os seus) ==========
const defaultGifts: GiftItem[] = [
  { id: '1', title: 'Liquidificador', description: 'Liquidificador potente 1000W', value: 250.0, quantity: 1, quantityAvailable: 1, status: 'active' },
  { id: '2', title: 'Jogo de Panelas', description: 'Jogo com 5 peças antiaderente', value: 450.0, quantity: 1, quantityAvailable: 1, status: 'active' },
  { id: '3', title: 'Cafeteira Elétrica', description: 'Cafeteira com timer programável', value: 180.0, quantity: 1, quantityAvailable: 1, status: 'active' },
  { id: '4', title: 'Air Fryer', description: 'Fritadeira sem óleo 5L', value: 380.0, quantity: 1, quantityAvailable: 1, status: 'active' },
  { id: '5', title: 'Micro-ondas', description: 'Micro-ondas 30L branco', value: 520.0, quantity: 1, quantityAvailable: 1, status: 'active' },
  { id: '6', title: 'Aspirador de Pó', description: 'Aspirador vertical sem fio', value: 680.0, quantity: 1, quantityAvailable: 1, status: 'active' },
  { id: '7', title: 'Ferro de Passar', description: 'Ferro a vapor com base antiaderente', value: 150.0, quantity: 1, quantityAvailable: 1, status: 'active' },
  { id: '8', title: 'Edredom Casal', description: 'Edredom 100% algodão', value: 280.0, quantity: 1, quantityAvailable: 1, status: 'active' },
];

const defaultMessages: Message[] = [
  { id: '1', guestName: 'Maria Silva', message: 'Parabéns pelo evento! Desejo muita felicidade!', giftTitle: 'Liquidificador', amount: 250.0, date: new Date('2024-02-09'), isPublic: true, isFavorite: false },
];

const defaultPayments: Payment[] = [
  { id: '1', guestName: 'Maria Silva', guestEmail: 'maria@example.com', giftTitle: 'Liquidificador', amount: 250.0, fee: 19.98, netAmount: 230.02, status: 'paid', date: new Date('2024-02-09'), message: 'Parabéns pelo evento! Desejo muita felicidade!' },
];

const defaultPageBlocks: PageBlock[] = [
  { id: '1', type: 'hero', order: 1, enabled: true, config: { title: '15 anos da Isa Nauana', subtitle: '10 de março de 2026', label: 'Convite Especial', buttonText: 'Ver Lista de Presentes' } },
  { id: '2', type: 'message', order: 2, enabled: true, config: { title: 'Nossa História', message: 'Você é meu convidado especial e sua presença é o que mais importa. Mas se desejar nos presentear, criamos esta lista com carinho.', signature: '— Com amor, Isa e Rayan' } },
  { id: '3', type: 'countdown', order: 3, enabled: true, config: { eventDate: '2026-03-10', title: 'Contagem Regressiva' } },
  { id: '4', type: 'gifts', order: 4, enabled: true, config: { title: 'Lista de Presentes', showPrices: true } },
  { id: '5', type: 'messages', order: 5, enabled: true, config: { title: 'Mural de Recados', showMessages: true } },
  { id: '6', type: 'gallery', order: 6, enabled: false, config: { title: 'Galeria de Fotos', photos: [] } },
  { id: '7', type: 'event-info', order: 7, enabled: false, config: { locationName: 'Salão de Festas Bela Vista', address: 'Rua das Flores, 123 - Centro', datetime: '10 de março de 2026, 19h' } },
];

const defaultSettings: UserSettings = {
  feePassedToGuest: true,
  messagesPublic: true,
  published: true,
  theme: {
    primary_color: '#C86E52',
    secondary_color: '#8E3D2C',
    background_color: '#FAF4EF',
    font_title: 'Cormorant Garamond',
    font_body: 'Inter',
  },
};

// ========== helpers ==========
const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;

  // prefix por userId (quando não tem, usa "guest")
  const storagePrefix = useMemo(() => `lumie:${userId ?? 'guest'}:`, [userId]);
  const channelName = useMemo(() => `lumie_preview:${userId ?? 'guest'}`, [userId]);

  const key = (k: string) => `${storagePrefix}${k}`;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pageBlocks, setPageBlocks] = useState<PageBlock[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Refs para sync
  const settingsRef = useRef(settings);
  const pageBlocksRef = useRef(pageBlocks);
  const giftsRef = useRef(gifts);
  const messagesRef = useRef(messages);
  const paymentsRef = useRef(payments);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { pageBlocksRef.current = pageBlocks; }, [pageBlocks]);
  useEffect(() => { giftsRef.current = gifts; }, [gifts]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { paymentsRef.current = payments; }, [payments]);

  // ✅ Carrega estado quando troca o usuário (ou no primeiro load)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // se deslogou, zera tudo pra não “vazar”
    if (status === 'unauthenticated') {
      setUser(null);
      setGifts([]);
      setMessages([]);
      setPayments([]);
      setPageBlocks([]);
      setSettings(defaultSettings);
      return;
    }

    // enquanto carregando, não faz nada
    if (status === 'loading') return;

    const dbUser = session?.user as any;

    // user vem da session (fonte de verdade)
    setUser({
      id: dbUser?.id ?? 'guest',
      name: dbUser?.name ?? '',
      email: dbUser?.email ?? '',
      username: dbUser?.username ?? '',
      photo: dbUser?.image ?? undefined,
      createdAt: new Date(),
    });

    // dados por-user no localStorage
    const loadedGifts = safeJsonParse(localStorage.getItem(key('gifts')), defaultGifts);
    const loadedMessages = safeJsonParse(localStorage.getItem(key('messages')), defaultMessages);
    const loadedPayments = safeJsonParse(localStorage.getItem(key('payments')), defaultPayments);
    const loadedBlocks = safeJsonParse(localStorage.getItem(key('pageBlocks')), defaultPageBlocks);
    const loadedSettings = safeJsonParse(localStorage.getItem(key('settings')), defaultSettings);

    setGifts(loadedGifts);
    setMessages(loadedMessages);
    setPayments(loadedPayments);
    setPageBlocks(loadedBlocks);
    setSettings(loadedSettings);
  }, [key, session, status]);

  function safeBroadcast(type: string, payload?: any) {
    try {
      const ch = new BroadcastChannel(channelName);
      ch.postMessage({ type, payload });
      ch.close();
    } catch {}
  }

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const addGift = (gift: Omit<GiftItem, 'id'>) => {
    const newGift: GiftItem = { ...gift, id: Date.now().toString() };
    setGifts((prev) => {
      const next = [...prev, newGift];
      safeBroadcast('SYNC_GIFTS', next);
      return next;
    });
  };

  const updateGift = (id: string, updates: Partial<GiftItem>) => {
    setGifts((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, ...updates } : g));
      safeBroadcast('SYNC_GIFTS', next);
      return next;
    });
  };

  const deleteGift = (id: string) => {
    setGifts((prev) => {
      const next = prev.filter((g) => g.id !== id);
      safeBroadcast('SYNC_GIFTS', next);
      return next;
    });
  };

  const addMessage = (message: Omit<Message, 'id'>) => {
    const newMessage: Message = { ...message, id: Date.now().toString() };
    setMessages((prev) => {
      const next = [newMessage, ...prev];
      safeBroadcast('SYNC_MESSAGES', next);
      return next;
    });
  };

  const toggleMessageVisibility = (id: string) => {
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, isPublic: !m.isPublic } : m));
      safeBroadcast('SYNC_MESSAGES', next);
      return next;
    });
  };

  const toggleMessageFavorite = (id: string) => {
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
      safeBroadcast('SYNC_MESSAGES', next);
      return next;
    });
  };

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = { ...payment, id: Date.now().toString() };
    setPayments((prev) => {
      const next = [newPayment, ...prev];
      safeBroadcast('SYNC_PAYMENTS', next);
      return next;
    });
  };

  const updatePageBlocks = (blocks: PageBlock[]) => {
    setPageBlocks(blocks);
    safeBroadcast('SYNC_BLOCKS', blocks);
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next: UserSettings = {
        ...prev,
        ...updates,
        theme: updates.theme ? { ...prev.theme, ...updates.theme } : prev.theme,
      };
      safeBroadcast('SYNC_THEME', next);
      return next;
    });
  };

  // ✅ listener isolado por usuário
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ch = new BroadcastChannel(channelName);

    function onMessage(ev: MessageEvent) {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'SYNC_THEME') setSettings(msg.payload);
      if (msg.type === 'SYNC_BLOCKS') setPageBlocks(msg.payload);
      if (msg.type === 'SYNC_GIFTS') setGifts(msg.payload);
      if (msg.type === 'SYNC_MESSAGES') setMessages(msg.payload);
      if (msg.type === 'SYNC_PAYMENTS') setPayments(msg.payload);

      if (msg.type === 'REQUEST_SYNC') {
        ch.postMessage({ type: 'SYNC_THEME', payload: settingsRef.current });
        ch.postMessage({ type: 'SYNC_BLOCKS', payload: pageBlocksRef.current });
        ch.postMessage({ type: 'SYNC_GIFTS', payload: giftsRef.current });
        ch.postMessage({ type: 'SYNC_MESSAGES', payload: messagesRef.current });
        ch.postMessage({ type: 'SYNC_PAYMENTS', payload: paymentsRef.current });
      }
    }

    ch.addEventListener('message', onMessage);

    try { ch.postMessage({ type: 'REQUEST_SYNC' }); } catch {}

    return () => {
      ch.removeEventListener('message', onMessage);
      ch.close();
    };
  }, [channelName]);

  // ✅ persistência por usuário
  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(key('pageBlocks'), JSON.stringify(pageBlocks));
    localStorage.setItem(key('settings'), JSON.stringify(settings));
    localStorage.setItem(key('gifts'), JSON.stringify(gifts));
    localStorage.setItem(key('messages'), JSON.stringify(messages));
    localStorage.setItem(key('payments'), JSON.stringify(payments));
  }, [key, pageBlocks, settings, gifts, messages, payments]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key('user'), JSON.stringify(user));
  }, [key, user]);

  return (
    <UserContext.Provider
      value={{
        user,
        gifts,
        messages,
        payments,
        pageBlocks,
        settings,
        updateUser,
        addGift,
        updateGift,
        deleteGift,
        addMessage,
        toggleMessageVisibility,
        toggleMessageFavorite,
        addPayment,
        updatePageBlocks,
        updateSettings,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within a UserProvider');
  return context;
}
