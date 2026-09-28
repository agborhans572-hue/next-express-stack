export interface Article {
  id: number;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  img: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  featured: boolean;
  body: string[];
}

export const ARTICLES: Article[] = [
  {
    id: 1,
    slug: "shiprion-opens-dallas-hub",
    category: "Company News",
    title: "Shiprion Opens New Hub in Dallas, Expanding Americas Coverage",
    excerpt:
      "Our new Dallas–Fort Worth logistics hub brings express delivery and sea freight consolidation to Mexico, Canada, and Central America — cutting transit times by up to 40%.",
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=600&fit=crop",
    author: "Marcus Rivera",
    authorRole: "Head of Americas Operations",
    date: "April 18, 2026",
    readTime: "4 min read",
    featured: true,
    body: [
      "Shiprion is proud to announce the official opening of its Dallas–Fort Worth Logistics Hub — our seventh regional facility and the first purpose-built freight consolidation centre in the South-Central United States. Located 8 km from Dallas/Fort Worth International Airport, the 18,000 m² facility is equipped with bonded warehousing, cold-chain storage, and a customs pre-clearance processing suite that integrates directly with US Customs and Border Protection's ACE platform.",
      "The hub serves as a regional gateway for four key markets simultaneously: the continental United States, Mexico, Canada, and Central America. Freight previously routed through Los Angeles or Miami can now be consolidated directly in Dallas before onward distribution — eliminating an average of two transit days and reducing landed costs by up to 22% for our Americas clients.",
      '"The South-Central US is one of the fastest-growing trade corridors in the hemisphere," said Marcus Rivera, Shiprion\'s Head of Americas Operations. "With this hub we\'re not just cutting transit times — we\'re giving businesses across the region access to logistics infrastructure that was previously only available to large multinationals."',
      "The facility handles air freight, sea freight less-than-container-load (LCL) consolidation, and express parcel services. A fleet of 24 dedicated last-mile delivery vehicles covers the Dallas–Fort Worth Metroplex, with contracted partners extending reach to Houston, San Antonio, Oklahoma City, Kansas City, and Monterrey.",
      "Phase two of the Dallas hub — expected to go live in Q4 2026 — will add a 4,000 m² cross-docking facility and expand refrigerated storage capacity for pharmaceutical and perishables clients. Shiprion has also committed to installing a 400 kW rooftop solar array at the site, consistent with its 2035 net-zero target announced earlier this year.",
      "Businesses interested in leveraging the Dallas hub for Americas distribution can contact our regional sales team or request a quote directly through the Shiprion platform.",
    ],
  },
  {
    id: 2,
    slug: "ai-route-optimisation-road-freight",
    category: "Technology",
    title: "Introducing AI-Powered Route Optimisation for Road Freight",
    excerpt:
      "Shiprion's new machine learning engine dynamically reroutes truck consignments in real time, reducing average delivery time by 22% and fuel costs by 18%.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop",
    author: "Daniel Reyes",
    authorRole: "Chief Technology Officer",
    date: "April 10, 2026",
    readTime: "5 min read",
    featured: false,
    body: [
      "Today Shiprion is launching RouteIQ — our proprietary machine learning engine for real-time road freight route optimisation. Built over 18 months by a team of 14 engineers and data scientists, RouteIQ ingests live data from 11 sources including road sensors, weather APIs, border crossing wait-time feeds, and historical consignment performance records to continuously recompute optimal routes for every truck in our network.",
      "Traditional route planning in logistics is largely static: a dispatcher sets a route before departure and the driver follows it regardless of what happens en route. RouteIQ changes this fundamentally. Every five minutes, the engine re-evaluates each active consignment against current conditions and, where rerouting would save time or fuel, pushes an updated route to the driver's in-cab terminal with a single tap to accept.",
      "In a six-month closed pilot across our Western and Southern United States road network — covering 1,400 consignments and 38 drivers — RouteIQ delivered a 22% reduction in average door-to-door transit time and an 18% reduction in fuel consumption per tonne-kilometre. Combined, those gains translate to a meaningful reduction in per-shipment carbon emissions.",
      '"The hardest engineering problem wasn\'t the ML model — it was getting high-quality, low-latency data from 11 different sources into a single decision pipeline," said CTO Daniel Reyes. "Once we had that, the model itself was able to learn from our historical network very quickly."',
      "RouteIQ is initially available for full-truck-load (FTL) consignments on Shiprion-operated vehicles in 16 states and provinces. LTL support and an API for third-party fleet operators are on the roadmap for H2 2026. All clients using Shiprion Road Freight services will see RouteIQ's benefits automatically — no configuration required.",
    ],
  },
  {
    id: 3,
    slug: "global-freight-market-2026",
    category: "Industry",
    title:
      "Global Freight Market 2026: Demand Rebounds After Supply Chain Reset",
    excerpt:
      "Industry analysts forecast a 9% rise in global air cargo volumes and a 6% uptick in container throughput as trade normalises post-disruption.",
    img: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=1200&h=600&fit=crop",
    author: "Sophie Chen",
    authorRole: "Senior Market Analyst",
    date: "March 29, 2026",
    readTime: "6 min read",
    featured: false,
    body: [
      "After three years of extraordinary volatility — ocean freight rates that swung from historic highs to near-cost-of-operations lows, chronic port congestion followed by excess capacity, and air cargo demand driven by pandemic-era electronics and pharmaceuticals rather than traditional trade flows — the global freight market is entering a period of more predictable normalisation in 2026.",
      "The latest composite forecast from IATA, the Container Trades Statistics bureau, and leading consultancies projects global air cargo volumes to grow 9% year-on-year in 2026, recovering to and slightly exceeding pre-disruption trend levels. Container throughput at the world's top 50 ports is forecast to grow 6% — modest by historical standards, but reflecting genuine underlying trade growth rather than inventory restocking distortions.",
      "Several structural shifts are reshaping the demand picture. Near-shoring and friend-shoring — the relocation of manufacturing closer to end markets in response to geopolitical uncertainty — is creating new trade lanes between Southeast Asia, Eastern Europe, and Latin America that didn't exist at meaningful scale five years ago. These lanes are shorter on average, which benefits air and road freight more than deep-sea container shipping.",
      "On the supply side, the orderbook of new container vessels remains elevated, keeping ocean freight rates competitive. Air cargo capacity is growing more slowly; narrowbody aircraft retirements are not being fully replaced in the short term, which is providing some floor under airfreight yields for time-sensitive cargo.",
      "For shippers, the practical implication is a buyer's market for ocean freight but a tighter market for premium air cargo services. Shipper strategies that blend ocean consolidation for standard inventory with air express for replenishment and high-value goods will deliver the best landed-cost outcomes in the current environment.",
      "Shiprion's own volume data mirrors these trends. Our sea freight LCL volumes grew 11% in Q1 2026 versus Q1 2025, while express and air freight bookings grew 17% — consistent with clients optimising for cost on standard goods while protecting service levels on higher-value and time-critical lines.",
    ],
  },
  {
    id: 4,
    slug: "swiftship-net-zero-2035",
    category: "Sustainability",
    title: "Shiprion Commits to Net-Zero Emissions by 2035",
    excerpt:
      "We're investing $50M over the next decade in electric last-mile vehicles, solar-powered warehouses, and carbon offset programmes in partnership with leading environmental NGOs.",
    img: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=600&fit=crop",
    author: "Amara Diallo",
    authorRole: "Chief Sustainability Officer",
    date: "March 15, 2026",
    readTime: "3 min read",
    featured: false,
    body: [
      "Shiprion today announced a binding commitment to achieve net-zero greenhouse gas emissions across all its owned and operated facilities and vehicles by 2035 — ten years ahead of the Paris Agreement's 2050 target for the logistics sector. The commitment is backed by a $50 million capital allocation over the next decade and an independently verified Science Based Target.",
      "The investment programme has three pillars. First, fleet electrification: Shiprion will replace 100% of its last-mile delivery vehicles — currently 840 units across 22 states and countries — with battery-electric equivalents by 2030. Orders for the first 200 vehicles have already been placed with two manufacturers, with deliveries beginning in Q3 2026.",
      "Second, renewable energy for facilities: all Shiprion-owned warehouses and hubs will transition to 100% renewable electricity by 2028, through a combination of rooftop solar installations and power purchase agreements. The first solar installation — a 400 kW array at our new Dallas hub — is under construction and will be operational by mid-year.",
      "Third, supply chain engagement: Shiprion will require all Tier 1 freight partners — airlines, shipping lines, and road hauliers — to report their emissions intensity data through our supplier portal from 2027 onwards. Partners who do not meet minimum improvement thresholds will be phased out in favour of lower-emission alternatives by 2030.",
      '"We recognise that logistics is a hard-to-abate sector, and we\'re not pretending the path to net-zero is easy," said Chief Sustainability Officer Amara Diallo. "But our clients are increasingly setting their own net-zero targets, and they need their supply chain partners to move with them. This commitment is as much about enabling our clients\' sustainability goals as it is about our own."',
      "A detailed sustainability roadmap — including scope 1, 2, and 3 baselines, annual reduction milestones, and offset methodology — is available for download on our Sustainability page.",
    ],
  },
  {
    id: 5,
    slug: "iso-9001-certification",
    category: "Company News",
    title: "Shiprion Achieves ISO 9001:2015 Certification Across All Hubs",
    excerpt:
      "After 18 months of process audits and operational upgrades, all seven Shiprion regional hubs have passed ISO 9001:2015 quality certification.",
    img: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&h=600&fit=crop",
    author: "Marcus Rivera",
    authorRole: "Head of Americas Operations",
    date: "February 28, 2026",
    readTime: "3 min read",
    featured: false,
    body: [
      "Shiprion is pleased to announce that all seven of its regional logistics hubs have achieved ISO 9001:2015 certification, following an 18-month audit and improvement programme conducted with certification body Bureau Veritas. The certification covers quality management systems across warehousing, freight forwarding, customs brokerage, and last-mile delivery operations.",
      "ISO 9001:2015 is the internationally recognised standard for quality management. Achieving it requires an organisation to demonstrate systematic processes for identifying customer requirements, consistently meeting them, and continuously improving performance. For a multi-country logistics operation, this involves harmonising procedures across diverse regulatory environments — a significant undertaking.",
      "The certification process identified and resolved over 200 process improvement opportunities across the seven hubs. These ranged from standardising proof-of-delivery documentation formats across markets (reducing claims processing time by 35%) to implementing a unified non-conformance reporting system that surfaces recurring issues to regional management within 24 hours.",
      '"ISO 9001 isn\'t a trophy — it\'s a management system," said Marcus Rivera, Head of Operations. "What we\'re proud of is not the certificate itself but the discipline and the culture it reflects. Our teams genuinely engaged with the process and the improvements are real."',
      "The certification is valid for three years and requires annual surveillance audits. Shiprion's full quality policy and its ISO certificates are available on request from any regional sales office.",
    ],
  },
  {
    id: 6,
    slug: "eu-customs-pre-clearance",
    category: "Technology",
    title: "Real-Time Customs Pre-Clearance Now Live for EU Imports",
    excerpt:
      "Our new digital customs integration cuts EU import clearance from 48 hours to under 4 hours for eligible commodity codes — no paperwork, no manual filing.",
    img: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&h=600&fit=crop",
    author: "Daniel Reyes",
    authorRole: "Chief Technology Officer",
    date: "February 12, 2026",
    readTime: "4 min read",
    featured: false,
    body: [
      "Shiprion has launched a fully automated EU customs pre-clearance service for import shipments, integrating directly with the European Union Customs Information System (CIS) via the Automated Import System (AIS). For eligible commodity codes — currently covering approximately 78% of Shiprion's EU import volume by value — clearance decisions are received within four hours of vessel or aircraft arrival, compared to the industry average of 48 hours.",
      "The integration works by extracting shipment data — commodity codes, declared values, certificates of origin, and regulatory permits — directly from the Shiprion booking system and transmitting a pre-arrival notification to the relevant national customs authority up to 72 hours before arrival. When the consignment lands, the customs authority has already conducted its risk assessment and, in most cases, issues an immediate release.",
      "The practical impact for clients is significant. A pharmaceutical client importing from Singapore to the Netherlands reduced its average customs hold time from 52 hours to 3.2 hours in a 60-day pilot, allowing it to reduce safety stock by approximately 15% without increasing stockout risk. An electronics distributor importing from Taiwan to Germany reported that the integration paid for itself within the first shipment by avoiding an expediting fee.",
      '"Customs dwell time is one of the most frustrating and opaque sources of supply chain delay," said CTO Daniel Reyes. "We\'ve essentially made it a solved problem for the majority of our EU import clients."',
      "The pre-clearance service is available to all Shiprion clients with EU import shipments and is enabled automatically for new bookings from today. Clients with existing bookings can opt in through the shipment settings panel. Commodity codes currently outside the automated scope — primarily agricultural products requiring phytosanitary inspection — will be added in phases through Q3 2026.",
    ],
  },
  {
    id: 7,
    slug: "americas-trade-logistics-summit-2026",
    category: "Events",
    title: "Meet Shiprion at Americas Trade & Logistics Summit 2026",
    excerpt:
      "Our team will be exhibiting at ATLS Miami from May 5–7. Book a meeting to explore partnership opportunities and live-demo our tracking platform.",
    img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop",
    author: "Sophie Chen",
    authorRole: "Senior Market Analyst",
    date: "January 30, 2026",
    readTime: "2 min read",
    featured: false,
    body: [
      "Shiprion will be exhibiting at the Americas Trade & Logistics Summit 2026 in Miami, Florida, from May 5 to 7. ATLS is the hemisphere's leading annual gathering for freight forwarders, carriers, port authorities, and shippers, drawing over 4,000 attendees from 60 countries.",
      "We'll be at Stand G-14 in Hall 3 with a team of eight regional specialists. The stand will feature a live demonstration of the Shiprion tracking platform, including the AI-powered route optimisation engine launched in April, and a preview of our forthcoming multi-carrier booking API designed for freight management system integrations.",
      "Shiprion's regional VP for the Americas, Carlos Mendez, will deliver a keynote address on the morning of May 6 titled 'Infrastructure Reality vs. E-Commerce Ambition: Closing the Last-Mile Gap in North and Latin America'. The session will draw on data from our own delivery network as well as a survey of 340 e-commerce merchants conducted across the United States, Mexico, Colombia, and Brazil.",
      "We're also hosting a private breakfast briefing on May 7 for existing enterprise clients and qualified prospective partners to discuss our Americas expansion, the Dallas hub's capabilities, and our 2027 service roadmap for the region.",
      "To book a one-to-one meeting at our stand or to register for the breakfast briefing, contact your Shiprion account manager or use the contact form on our website. We look forward to seeing you in Miami.",
    ],
  },
  {
    id: 8,
    slug: "cross-border-ecommerce-american-logistics",
    category: "Industry",
    title: "How Cross-Border E-Commerce Is Reshaping American Logistics",
    excerpt:
      "With e-commerce penetration surging across North and Latin America, last-mile delivery infrastructure is the critical bottleneck — and Shiprion is building to solve it.",
    img: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop",
    author: "Amara Diallo",
    authorRole: "Chief Sustainability Officer",
    date: "January 15, 2026",
    readTime: "7 min read",
    featured: false,
    body: [
      "North and Latin America's cross-border e-commerce market has grown dramatically over the past three years, reaching an estimated $120 billion in gross merchandise value in 2025 — and analysts project it will reach $250 billion by 2030. This growth is being driven by increasing consumer demand for international goods, expanding digital payment infrastructure, and a growing middle class with rising disposable income and appetite for variety beyond what local retail can offer.",
      "Yet the growth story has a structural constraint: logistics infrastructure has not kept pace in all markets. Address standardisation across Latin American cities can be inconsistent. Road and customs infrastructure outside major urban centres varies enormously. Customs clearance for cross-border e-commerce parcels remains slow in some markets. And the density of collection/drop-off points required for efficient last-mile delivery is still being built out in many regions.",
      "The consequences are felt throughout the e-commerce value chain. Average last-mile delivery times in parts of Latin America are 4–7 days, compared to 1–2 days in the United States and Canada. Failed delivery rates can reach 10–18% in less-served markets, compared to under 5% in mature US markets. These performance gaps translate directly into higher return rates, lower customer satisfaction, and increased cost of fulfilment.",
      "The solutions emerging are innovative and tech-forward. Digital address systems and real-time geocoding are supplementing traditional addressing. Retail agent networks — pharmacies, convenience stores, and gas stations — are being activated as parcel collection points. Gig-economy couriers with route-optimisation apps are covering urban and peri-urban areas far more flexibly than traditional four-wheel fleets.",
      "Shiprion's approach in this environment is to build where infrastructure is adequate and partner where it isn't. In seven markets, we operate owned last-mile fleets. In fourteen others, we work with vetted local partners through our ShipPartner programme, providing them with our technology platform, brand standards, and client insurance — while they provide local knowledge, vehicles, and relationships.",
      "The opportunity is real and large. But capturing it requires a long-term commitment to building infrastructure — not just reselling capacity that doesn't yet exist. The logistics players who invest now in genuinely solving the last-mile problem in American markets will earn durable competitive advantages that will be very hard to replicate later. That is the bet Shiprion is making.",
    ],
  },
];

export const CATEGORIES = [
  "All",
  "Company News",
  "Industry",
  "Technology",
  "Sustainability",
  "Events",
];
