export const salon = {
  id: "salon-001",
  name: "Maya Nails Studio",
  slug: "maya-nails",
  description:
    "A warm boutique beauty studio specializing in careful nail care, brows, lashes, and polished everyday looks.",
  phone: "+972 54-321-7788",
  instagram: "@maya.nails.studio",
  address: "Dizengoff 142, Tel Aviv",
  currency: "₪",
};

export const services = [
  {
    id: "service-001",
    name: "Gel Polish",
    description: "Long-lasting gel color with nail shaping and cuticle care.",
    durationMinutes: 60,
    price: 160,
  },
  {
    id: "service-002",
    name: "Pedicure",
    description: "Relaxing foot care treatment with polish and heel smoothing.",
    durationMinutes: 75,
    price: 190,
  },
  {
    id: "service-003",
    name: "Lash Lift",
    description: "Natural lash lift and tint for a brighter, open-eye look.",
    durationMinutes: 50,
    price: 220,
  },
  {
    id: "service-004",
    name: "Brow Design",
    description: "Brow shaping, trimming, and tinting tailored to your face.",
    durationMinutes: 35,
    price: 120,
  },
  {
    id: "service-005",
    name: "Nail Art",
    description:
      "Custom nail details, accents, chrome, French, or hand-painted designs.",
    durationMinutes: 90,
    price: 260,
  },
];

export const clients = [
  {
    id: "client-001",
    name: "Noa Levi",
    phone: "0542680205",
    lastVisit: "2026-05-02",
    status: "regular",
    totalSpent: 1240,
    notes: "Prefers soft pink shades and short almond shape.",
  },
  {
    id: "client-002",
    name: "Tamar Cohen",
    phone: "+972 54-722-9031",
    lastVisit: "2026-04-26",
    status: "vip",
    totalSpent: 2860,
    notes: "Books every three weeks, usually mornings.",
  },
  {
    id: "client-003",
    name: "Lian Mizrahi",
    phone: "+972 50-188-6374",
    lastVisit: "2026-05-10",
    status: "new",
    totalSpent: 220,
    notes: "Interested in lash lift maintenance tips.",
  },
  {
    id: "client-004",
    name: "Shira Ben-David",
    phone: "+972 53-906-1142",
    lastVisit: "2026-03-18",
    status: "inactive",
    totalSpent: 740,
    notes: "Avoid strong fragrance products.",
  },
  {
    id: "client-005",
    name: "Dana Rosen",
    phone: "+972 58-331-5208",
    lastVisit: "2026-05-07",
    status: "regular",
    totalSpent: 1520,
    notes: "Likes clean French designs and chrome accents.",
  },
  {
    id: "client-006",
    name: "Roni Azulay",
    phone: "+972 52-640-7785",
    lastVisit: "2026-04-30",
    status: "regular",
    totalSpent: 980,
    notes: "Usually combines brow design with pedicure appointments.",
  },
];

export const bookingRequests = [
  {
    id: "request-001",
    clientName: "Ali Alnouna",
    phone: "+972 54-268-0205",
    serviceName: "Gel Polish",
    date: "2026-05-18",
    time: "10:00",
    status: "pending",
    notes: "Asked for a neutral shade before a work event.",
  },
  {
    id: "request-002",
    clientName: "Mika Stern",
    phone: "+972 52-301-6648",
    serviceName: "Lash Lift",
    date: "2026-05-18",
    time: "13:30",
    status: "pending",
    notes: "First lash lift, wants a natural result.",
  },
  {
    id: "request-003",
    clientName: "Yael Mor",
    phone: "+972 50-711-8439",
    serviceName: "Pedicure",
    date: "2026-05-19",
    time: "16:00",
    status: "pending",
    notes: "Prefers late afternoon if another slot opens.",
  },
  {
    id: "request-004",
    clientName: "Hila Shaked",
    phone: "+972 58-449-2750",
    serviceName: "Nail Art",
    date: "2026-05-20",
    time: "11:30",
    status: "pending",
    notes: "Sent inspiration photo on Instagram.",
  },
];

export const upcomingAppointments = [
  {
    id: "appointment-001",
    clientName: "Noa Levi",
    serviceName: "Gel Polish",
    date: "2026-05-17",
    time: "09:30",
    status: "confirmed",
    price: 160,
  },
  {
    id: "appointment-002",
    clientName: "Dana Rosen",
    serviceName: "Nail Art",
    date: "2026-05-17",
    time: "12:00",
    status: "confirmed",
    price: 260,
  },
  {
    id: "appointment-003",
    clientName: "Tamar Cohen",
    serviceName: "Pedicure",
    date: "2026-05-18",
    time: "09:00",
    status: "confirmed",
    price: 190,
  },
  {
    id: "appointment-004",
    clientName: "Roni Azulay",
    serviceName: "Brow Design",
    date: "2026-05-18",
    time: "15:00",
    status: "confirmed",
    price: 120,
  },
  {
    id: "appointment-005",
    clientName: "Lian Mizrahi",
    serviceName: "Lash Lift",
    date: "2026-05-19",
    time: "11:00",
    status: "confirmed",
    price: 220,
  },
];

export const messageTemplates = [
  {
    id: "template-001",
    name: "Appointment Confirmation",
    type: "confirmation",
    content:
      "Hi {{clientName}}, your {{serviceName}} appointment at Maya Nails Studio is confirmed for {{date}} at {{time}}. See you soon!",
  },
  {
    id: "template-002",
    name: "Appointment Reminder",
    type: "reminder",
    content:
      "Hi {{clientName}}, this is a friendly reminder for your {{serviceName}} appointment tomorrow at {{time}}. Reply here if you need to make a change.",
  },
  {
    id: "template-003",
    name: "Follow-Up",
    type: "follow-up",
    content:
      "Hi {{clientName}}, thank you for visiting Maya Nails Studio. I hope you love your {{serviceName}}. Let me know if you need anything.",
  },
  {
    id: "template-004",
    name: "No-Show",
    type: "no-show",
    content:
      "Hi {{clientName}}, we missed you today for your {{serviceName}} appointment. Please message us when you are ready to reschedule.",
  },
];
