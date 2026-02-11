'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

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

// Helpers
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

function safeBroadcast(type: string, payload?: any) {
  try {
    const ch = new BroadcastChannel('lumie_preview');
    ch.postMessage({ type, payload });
    ch.close();
  } catch {}
}

const defaultGifts: GiftItem[] = [
  {
    id: '1',
    title: 'Liquidificador',
    description: 'Liquidificador potente 1000W',
    value: 250.0,
    quantity: 1,
    quantityAvailable: 1,
    status: 'active',
  },
  {
    id: '2',
    title: 'Jogo de Panelas',
    description: 'Jogo com 5 peças antiaderente',
    value: 450.0,
    quantity: 1,
    quantityAvailable: 1,
    status: 'active',
  },
  {
    id: '3',
    title: 'Cafeteira Elétrica',
    description: 'Cafeteira com timer programável',
    value: 180.0,
    quantity: 1,
    quantityAvailable: 1,
    status: 'active',
  },
  {
    id: '4',
    title: 'Air Fryer',
    description: 'Fritadeira sem óleo 5L',
    value: 380.0,
    quantity: 1,
    quantityAvailable: 1,
    status: 'active',
  },
  {
    id: '5',
    title: 'Micro-ondas',
    description: 'Micro-ondas 30L branco',
    value: 520.0,
    quantity: 1,
    quantityAvailable: 1,
    status: 'active',
  },
  {
    id: '6',
    title: 'Aspirador de Pó',
    description: 'Aspirador vertical sem fio',
    value: 680.0,
    quantity: 1,
    quantityAvailable: 1,
    status: 'active',
  },
  {
    id: '7',
    title: 'Ferro de Passar',
    description: 'Ferro a vapor com base antiaderente',
    value: 150.0,
    quantity: 1,
    quantityAvailable: 1,
    status: 'active',
  },
  {
    id: '8',
    title: 'Edredom Casal',
    description: 'Edredom 100% algodão',
    value: 280.0,
    quantity: 1,
    quantityAvailable: 1,
    status: 'active',
  },
];

const defaultMessages: Message[] = [
  {
    id: '1',
    guestName: 'Maria Silva',
    message: 'Parabéns pelo evento! Desejo muita felicidade!',
    giftTitle: 'Liquidificador',
    amount: 250.0,
    date: new Date('2024-02-09'),
    isPublic: true,
    isFavorite: false,
  },
];

const defaultPayments: Payment[] = [
  {
    id: '1',
    guestName: 'Maria Silva',
    guestEmail: 'maria@example.com',
    giftTitle: 'Liquidificador',
    amount: 250.0,
    fee: 19.98,
    netAmount: 230.02,
    status: 'paid',
    date: new Date('2024-02-09'),
    message: 'Parabéns pelo evento! Desejo muita felicidade!',
  },
];

const defaultPageBlocks: PageBlock[] = [
  {
    id: '1',
    type: 'hero',
    order: 1,
    enabled: true,
    config: {
      title: '15 anos da Isa Nauana',
      subtitle: '10 de março de 2026',
      label: 'Convite Especial',
      buttonText: 'Ver Lista de Presentes',
    },
  },
  {
    id: '2',
    type: 'message',
    order: 2,
    enabled: true,
    config: {
      title: 'Nossa História',
      message:
        'Você é meu convidado especial e sua presença é o que mais importa. Mas se desejar nos presentear, criamos esta lista com carinho.',
      signature: '— Com amor, Isa e Rayan',
    },
  },
  {
    id: '3',
    type: 'countdown',
    order: 3,
    enabled: true,
    config: {
      eventDate: '2026-03-10',
      title: 'Contagem Regressiva',
    },
  },
  {
    id: '4',
    type: 'gifts',
    order: 4,
    enabled: true,
    config: {
      title: 'Lista de Presentes',
      showPrices: true,
    },
  },
  {
    id: '5',
    type: 'messages',
    order: 5,
    enabled: true,
    config: {
      title: 'Mural de Recados',
      showMessages: true,
    },
  },
  {
    id: '6',
    type: 'gallery',
    order: 6,
    enabled: false,
    config: { title: 'Galeria de Fotos', photos: [] },
  },
  {
    id: '7',
    type: 'event-info',
    order: 7,
    enabled: false,
    config: {
      locationName: 'Salão de Festas Bela Vista',
      address: 'Rua das Flores, 123 - Centro',
      datetime: '10 de março de 2026, 19h',
    },
  },
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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() =>
    loadFromStorage('lumie_user', {
      id: '1',
      name: 'Rayan',
      email: 'rayan@example.com',
      username: 'rayan',
      photo: undefined,
      createdAt: new Date(),
    })
  );

  const [gifts, setGifts] = useState<GiftItem[]>(() => loadFromStorage('lumie_gifts', defaultGifts));
  const [messages, setMessages] = useState<Message[]>(() => loadFromStorage('lumie_messages', defaultMessages));

  // ✅ payments agora persiste + sync
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage('lumie_payments', defaultPayments));

  const [pageBlocks, setPageBlocks] = useState<PageBlock[]>(() => loadFromStorage('lumie_pageBlocks', defaultPageBlocks));
  const [settings, setSettings] = useState<UserSettings>(() => loadFromStorage('lumie_settings', defaultSettings));

  // refs para REQUEST_SYNC sempre devolver o estado mais novo
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

  // ✅ addPayment: cria pagamento e sincroniza com dashboard/site
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

  // Listener único
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ch = new BroadcastChannel('lumie_preview');

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

    // opcional: pede sync ao montar
    try { ch.postMessage({ type: 'REQUEST_SYNC' }); } catch {}

    return () => {
      ch.removeEventListener('message', onMessage);
      ch.close();
    };
  }, []);

  // Persistência local
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lumie_pageBlocks', JSON.stringify(pageBlocks));
    localStorage.setItem('lumie_settings', JSON.stringify(settings));
    localStorage.setItem('lumie_gifts', JSON.stringify(gifts));
    localStorage.setItem('lumie_messages', JSON.stringify(messages));
    localStorage.setItem('lumie_payments', JSON.stringify(payments));
  }, [pageBlocks, settings, gifts, messages, payments]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lumie_user', JSON.stringify(user));
  }, [user]);

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
