import { Dimensions } from 'react-native';
import { EventDetails } from './types';

// Dimensions de l'écran
export const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Dimensions du bottom sheet
export const COLLAPSED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.12);  // 12% de l'écran quand réduit
export const INITIAL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.60);   // 60% de l'écran - état initial
export const FULL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.90);     // 90% de l'écran - complètement déployé

// Données mockées pour les hôtes d'événements
export const EVENT_HOSTS = [
  {
    id: '1',
    name: 'Dan Toulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait%20simple%203d&aspect=1:1&seed=123'
  },
  {
    id: '2',
    name: 'Audriana Toulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait%20simple%203d&aspect=1:1&seed=456'
  }
];

// Données mockées pour les cadeaux de mariage
export const WEDDING_GIFT_ITEMS = [
  {
    id: 'g1',
    name: 'Tefal Casseroles',
    price: '129 €',
    image: 'https://api.a0.dev/assets/image?text=tefal%20casseroles%20black&aspect=1:1&seed=201',
    isFavorite: true,
    quantity: 1
  },
  {
    id: 'g2',
    name: 'Montre Casio',
    price: '59.90 €',
    image: 'https://api.a0.dev/assets/image?text=casio%20gold%20watch&aspect=1:1&seed=202',
    isFavorite: true,
    quantity: 1
  },
  {
    id: 'g3',
    name: 'Rouge à lèvres YSL',
    price: '36.99 €',
    image: 'https://api.a0.dev/assets/image?text=ysl%20lipstick%20red&aspect=1:1&seed=203',
    isFavorite: false,
    quantity: 1
  },
  {
    id: 'g4',
    name: 'Aspirateur Dyson',
    price: '299.99 €',
    image: 'https://api.a0.dev/assets/image?text=dyson%20vacuum%20cleaner&aspect=1:1&seed=204',
    isFavorite: false,
    quantity: 1
  }
];

// Données mockées pour les demandes de rejoindre
export const JOIN_REQUESTS = [
  {
    id: '1',
    name: 'Matilda Fritz',
    username: 'matildafritz',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20curly%20hair%20cartoon%20portrait%20simple%203d&aspect=1:1&seed=789'
  }
];

// Données mockées pour les événements
export const EVENT_DETAILS: {[key: string]: EventDetails} = {
  '1': { // Wedding event
    id: '1',
    type: 'owned',
    title: 'Mariage',
    subtitle: '',
    date: '25/12/2024',
    color: '#C8E6FF', // Light blue for wedding
    image: 'https://api.a0.dev/assets/image?text=wedding%20ring%20icon&aspect=1:1',
    location: { address: '15 rue des Lampes', city: 'Paris', postalCode: '75012' },
    time: { day: '16', month: 'Juillet', year: '2025', hour: '15', minute: '00' },
    description: 'Thème année 70 !!',
    hosts: EVENT_HOSTS,
    gifts: WEDDING_GIFT_ITEMS,
    participants: [],
    isCollective: false
  },
  '3': { // Christmas event
    id: '3',
    type: 'owned',
    title: 'Noël',
    subtitle: 'Noël 2024',
    date: '25/12/2024',
    color: '#FFE4E4', // Light pink for Christmas
    image: 'https://api.a0.dev/assets/image?text=christmas%20tree%20emoji%203d&aspect=1:1',
    location: { address: '15 rue des Roses', city: 'Paris', postalCode: '75008' },
    time: { day: '25', month: 'Décembre', year: '2024', hour: '19', minute: '00' },
    description: 'Fêtons Noël ensemble !',
    participants: [
      {
        id: '1',
        name: 'Dan Toulet',
        username: 'dantoulet',
        avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait&aspect=1:1&seed=111'
      },
      {
        id: '2',
        name: 'Noémie Sanchez',
        username: 'noemiesanchez',
        avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=222'
      },
      {
        id: '3',
        name: 'Audriana Toulet',
        username: 'audrianatoulet',
        avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=333'
      },
      {
        id: '4',
        name: 'Paul Marceau',
        username: 'paulmarceau',
        avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=444'
      }
    ],
    gifts: [
      {
        id: 'g1',
        name: 'Nintendo Switch OLED',
        price: '349.99 €',
        image: 'https://api.a0.dev/assets/image?text=nintendo%20switch%20oled%20console&aspect=1:1&seed=201',
        isFavorite: true,
        addedBy: {
          name: 'Dan Toulet',
          avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait&aspect=1:1&seed=111'
        }
      },
      {
        id: 'g2',
        name: 'AirPods Pro',
        price: '279.90 €',
        image: 'https://api.a0.dev/assets/image?text=airpods%20pro%20white%20earbuds&aspect=1:1&seed=202',
        isFavorite: true,
        addedBy: {
          name: 'Noémie Sanchez',
          avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=222'
        }
      },
      {
        id: 'g3',
        name: 'LEGO Star Wars',
        price: '159.99 €',
        image: 'https://api.a0.dev/assets/image?text=lego%20star%20wars%20millennium%20falcon&aspect=1:1&seed=203',
        isFavorite: false,
        addedBy: {
          name: 'Paul Marceau',
          avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=444'
        }
      }
    ],
    isCollective: true
  }
};

// Détails d'un événement rejoint
export const joinedEventDetails: EventDetails = {
  id: '2',
  title: 'Anniversaire',
  subtitle: 'Paul Marceau',
  date: '09/12/2024',
  color: '#E8E1FF',
  image: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=444',
  location: { address: '8 avenue des Pins', city: 'Lyon', postalCode: '69002' },
  time: { day: '09', month: 'Décembre', year: '2024', hour: '19', minute: '30' },
  description: 'Venez célébrer l\'anniversaire de Paul!',
  isCollective: false
};

// Détails d'une invitation
export const invitationDetails: EventDetails = {
  id: 'invitation',
  title: 'Saint Valentin',
  date: '14/02/2025',
  color: '#EADDFF',
  image: 'https://api.a0.dev/assets/image?text=red%20rose&aspect=1:1',
  invitedBy: { 
    name: 'Audriana Toulet', 
    username: 'audrianatoulet', 
    avatar: 'https://api.a0.dev/assets/image?text=avatar&aspect=1:1'
  },
  location: { address: '72 rue de la Maison Verte', city: 'Perpignan', postalCode: '66000' },
  time: { day: '14', month: 'Février', year: '2025', hour: '21', minute: '30', period: 'PM' },
  isCollective: false
};

// Données mockées pour les souhaits des participants
export const PARTICIPANT_WISHES: {[key: string]: any[]} = {
  'dantoulet': [
    {
      id: 'g1',
      name: 'Nintendo Switch OLED',
      price: '349.99 €',
      image: 'https://api.a0.dev/assets/image?text=nintendo%20switch%20oled%20console&aspect=1:1&seed=201',
      isFavorite: true,
      addedBy: {
        name: 'Dan Toulet',
        avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait&aspect=1:1&seed=111'
      }
    }
  ],
  'noemiesanchez': [
    {
      id: 'g2', 
      name: 'AirPods Pro',
      price: '279.90 €',
      image: 'https://api.a0.dev/assets/image?text=airpods%20pro%20white%20earbuds&aspect=1:1&seed=202',
      isFavorite: true,
      addedBy: {
        name: 'Noémie Sanchez',
        avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=222'
      }
    }
  ],
  'paulmarceau': [
    {
      id: 'g3',
      name: 'LEGO Star Wars',
      price: '159.99 €',
      image: 'https://api.a0.dev/assets/image?text=lego%20star%20wars%20millennium%20falcon&aspect=1:1&seed=203',
      isFavorite: true,
      addedBy: {
        name: 'Paul Marceau',
        avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=444'
      }
    }
  ],
  'audrianatoulet': [
    {
      id: 'g4',
      name: 'Diesel Ceinture',
      price: '59.90 €',
      image: 'https://api.a0.dev/assets/image?text=diesel%20belt%20black&aspect=1:1&seed=205',
      isFavorite: true,
      addedBy: {
        name: 'Audriana Toulet',
        avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=333'
      }
    }
  ]
};