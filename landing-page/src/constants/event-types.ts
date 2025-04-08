export interface EventType {
  id: number;
  title: string;
  image: string;
  description: string;
}

export const eventTypes: EventType[] = [
  {
    id: 1,
    title: "Anniversaire",
    image: "/assets/images/events/birthday.jpeg",
    description: "birthday genie",
  },
  {
    id: 2,
    title: "Mariage",
    image: "/assets/images/events/wedding.jpeg",
    description: "wedding genie",
  },
  {
    id: 3,
    title: "Naissance",
    image: "/assets/images/events/birth.jpeg",
    description: "birth genie",
  },
  {
    id: 4,
    title: "Saint Valentin",
    image: "/assets/images/events/saint-valentin.jpeg",
    description: "saint valentin genie",
  },
  {
    id: 5,
    title: "Pot de départ",
    image: "/assets/images/events/leaving-party.jpeg",
    description: "leaving party genie",
  },
  {
    id: 6,
    title: "Crémaillère",
    image: "/assets/images/events/house-warming.jpeg",
    description: "house warming genie",
  },
  {
    id: 7,
    title: "Fiançailles",
    image: "/assets/images/events/engagement.jpeg",
    description: "engagement genie",
  },
  {
    id: 8,
    title: "Noël",
    image: "/assets/images/events/christmas.jpeg",
    description: "christmas genie",
  },
  {
    id: 9,
    title: "Remise de Diplôme",
    image: "/assets/images/events/diploma.jpeg",
    description: "diploma genie",
  },
  {
    id: 10,
    title: "Retraite",
    image: "/assets/images/events/retirement.jpeg",
    description: "retirement genie",
  },
  {
    id: 11,
    title: "Secret Santa",
    image: "/assets/images/events/secret-santa.jpeg",
    description: "secret santa genie",
  },
  {
    id: 12,
    title: "Fête des mères",
    image: "/assets/images/events/mothers-day.jpeg",
    description: "mothers day genie",
  },
  {
    id: 13,
    title: "Fête des pères",
    image: "/assets/images/events/fathers-day.jpeg",
    description: "fathers day genie",
  },
  {
    id: 14,
    title: "Baby Shower",
    image: "/assets/images/events/baby-shower.jpeg",
    description: "baby shower genie",
  }
];
