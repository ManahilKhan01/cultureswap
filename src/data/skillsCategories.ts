export interface SkillCategory {
  id: string;
  name: string;
  subcategories: string[];
}

export const SKILLS_CATEGORIES: SkillCategory[] = [
  {
    id: "art-craft",
    name: "Art & Craft",
    subcategories: [
      "Painting",
      "Drawing",
      "Calligraphy",
      "Sculpture",
      "Digital Art",
      "Printmaking",
      "Illustration",
      "Sketching"
    ]
  },
  {
    id: "languages",
    name: "Languages",
    subcategories: [
      "English",
      "Arabic",
      "French",
      "Urdu",
      "Spanish",
      "Mandarin",
      "Hindi",
      "German",
      "Italian",
      "Japanese",
      "Portuguese",
      "Korean"
    ]
  },
  {
    id: "music",
    name: "Music",
    subcategories: [
      "Guitar",
      "Piano",
      "Singing",
      "Music Production",
      "Drums",
      "Violin",
      "Flute",
      "Music Theory",
      "Ukulele",
      "Harmonica",
      "Keyboard"
    ]
  },
  {
    id: "dance-movement",
    name: "Dance & Movement",
    subcategories: [
      "Hip Hop",
      "Classical Dance",
      "Contemporary",
      "Zumba",
      "Ballet",
      "Belly Dance",
      "Salsa",
      "Breakdancing",
      "Jazz Dance",
      "Street Jazz",
      "Latin Dance"
    ]
  },
  {
    id: "cooking-cuisine",
    name: "Cooking & Cuisine",
    subcategories: [
      "Baking",
      "Desserts",
      "Continental",
      "Asian Cuisine",
      "Italian Cooking",
      "Middle Eastern Cuisine",
      "Indian Cooking",
      "Vegan Cooking",
      "Pastry Making",
      "Mexican Cuisine",
      "Fusion Cooking"
    ]
  },
  {
    id: "technology",
    name: "Technology",
    subcategories: [
      "Web Development",
      "Mobile Apps",
      "UI/UX",
      "AI Basics",
      "Python",
      "JavaScript",
      "React",
      "Database Design",
      "Cloud Computing",
      "Cybersecurity",
      "Machine Learning"
    ]
  },
  {
    id: "wellness-fitness",
    name: "Wellness & Fitness",
    subcategories: [
      "Yoga",
      "Meditation",
      "Weight Training",
      "Nutrition",
      "Pilates",
      "Running",
      "Stretching",
      "Mental Health",
      "Sleep Coaching",
      "Sports Nutrition",
      "Functional Fitness"
    ]
  },
  {
    id: "craftsmanship",
    name: "Craftsmanship",
    subcategories: [
      "Woodworking",
      "Jewelry Making",
      "Pottery",
      "Leatherworking",
      "Metalworking",
      "Knitting",
      "Sewing",
      "Embroidery",
      "Glassblowing",
      "Carpentry"
    ]
  },
  {
    id: "business-entrepreneurship",
    name: "Business & Entrepreneurship",
    subcategories: [
      "Marketing",
      "Sales",
      "Startup Basics",
      "Freelancing",
      "Business Planning",
      "Accounting",
      "Leadership",
      "Negotiation",
      "Personal Branding",
      "Social Media Marketing"
    ]
  },
  {
    id: "academic",
    name: "Academic",
    subcategories: [
      "Mathematics",
      "Science",
      "Research Writing",
      "Public Speaking",
      "Essay Writing",
      "Study Skills",
      "Chemistry",
      "Physics",
      "Biology",
      "History"
    ]
  },
  {
    id: "sports",
    name: "Sports",
    subcategories: [
      "Cricket",
      "Football",
      "Badminton",
      "Tennis",
      "Basketball",
      "Swimming",
      "Volleyball",
      "Table Tennis",
      "Golf",
      "Boxing",
      "Martial Arts"
    ]
  },
  {
    id: "literature-writing",
    name: "Literature & Writing",
    subcategories: [
      "Creative Writing",
      "Poetry",
      "Blogging",
      "Copywriting",
      "Screenwriting",
      "Journalism",
      "Storytelling",
      "Novel Writing",
      "Content Writing",
      "Technical Writing"
    ]
  }
];

// Flatten all skills for quick lookup
export const getAllSkills = (): string[] => {
  const skills: string[] = [];
  SKILLS_CATEGORIES.forEach(category => {
    skills.push(...category.subcategories);
  });
  return skills;
};

// Get category for a skill
export const getCategoryForSkill = (skill: string): SkillCategory | undefined => {
  return SKILLS_CATEGORIES.find(category =>
    category.subcategories.some(sub => sub.toLowerCase() === skill.toLowerCase())
  );
};

// Normalize skill name for comparison
export const normalizeSkill = (skill: string): string => {
  return skill.trim().toLowerCase();
};
