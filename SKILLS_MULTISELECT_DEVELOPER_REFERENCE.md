# Profile Settings Multi-Select - Developer Quick Reference

## Quick Start

### For Users
1. Go to Settings → Profile tab
2. Find "Skills You Offer" and "Skills You Want to Learn" fields
3. Click to open dropdown
4. Select/deselect skills from organized categories
5. Click "Save Changes"

### For Developers

#### Integration Points

**Component:** `src/components/SkillsMultiSelect.tsx`
```tsx
<SkillsMultiSelect
  label="Skills You Offer"
  value={profile.skillsOffered}
  onChange={(skills) => setProfile({ ...profile, skillsOffered: skills })}
  placeholder="Select skills you offer"
  searchPlaceholder="Search skills..."
/>
```

**Data:** `src/data/skillsCategories.ts`
```typescript
SKILLS_CATEGORIES: SkillCategory[] // 12 categories with subcategories
getAllSkills(): string[] // Get all ~130 available skills
getCategoryForSkill(skill): SkillCategory // Find category for a skill
normalizeSkill(skill): string // Normalize for comparison
```

**Page:** `src/pages/Settings.tsx`
- Lines 36-37: State definition
- Lines 56-74: Data loading with backward compatibility
- Lines 241-245: Data saving (array format)
- Lines 418-437: UI rendering with components

## Architecture

### Component Hierarchy
```
Settings.tsx (Page)
  └─ SkillsMultiSelect (Component) x2
     ├─ Popover
     │  ├─ Button (Trigger)
     │  └─ PopoverContent
     │     ├─ Input (Search)
     │     └─ ScrollArea
     │        └─ Categories & Skills
     └─ Badge (Tags)
```

### Data Flow
```
UI Render
    ↓
User Interaction (click, type, select)
    ↓
onChange callback triggered
    ↓
setProfile updates state (array of selected skills)
    ↓
Component re-renders with new selections
    ↓
User clicks "Save Changes"
    ↓
handleProfileSave() called
    ↓
Array sent to backend as skills_offered/skills_wanted
    ↓
Database updated
```

## Key Implementation Details

### State Management
```typescript
// Profile state with array-based skills
skillsOffered: [] as string[]  // e.g., ["Web Development", "JavaScript"]
skillsWanted: [] as string[]   // e.g., ["Photography", "Cooking"]
```

### Backward Compatibility Parser
```typescript
const parseSkills = (skills: any): string[] => {
  if (Array.isArray(skills)) {
    return skills.filter(s => typeof s === 'string' && s.trim());
  }
  if (typeof skills === 'string') {
    return skills.split(',').map(s => s.trim()).filter(s => s);
  }
  return [];
};
```

### Database Interaction
```typescript
// Sending data
skills_offered: Array.isArray(profile.skillsOffered) ? profile.skillsOffered : []
skills_wanted: Array.isArray(profile.skillsWanted) ? profile.skillsWanted : []

// Receiving data - auto-converted by parseSkills() function
```

## Skills Categories (12 Total)

| ID | Name | Count | Examples |
|---|---|---|---|
| art-craft | Art & Craft | 8 | Painting, Drawing, Calligraphy |
| languages | Languages | 12 | English, Arabic, French, Urdu |
| music | Music | 11 | Guitar, Piano, Singing |
| dance-movement | Dance & Movement | 11 | Hip Hop, Ballet, Contemporary |
| cooking-cuisine | Cooking & Cuisine | 11 | Baking, Asian, Continental |
| technology | Technology | 11 | Web Dev, Mobile, UI/UX |
| wellness-fitness | Wellness & Fitness | 11 | Yoga, Meditation, Training |
| craftsmanship | Craftsmanship | 10 | Woodworking, Pottery, Jewelry |
| business-entrepreneurship | Business & Entrepreneurship | 10 | Marketing, Sales, Freelancing |
| academic | Academic | 10 | Math, Science, Writing |
| sports | Sports | 11 | Cricket, Football, Tennis |
| literature-writing | Literature & Writing | 10 | Writing, Poetry, Blogging |

**Total Skills: ~130**

## Component Props

### SkillsMultiSelect

| Prop | Type | Default | Description |
|---|---|---|---|
| value | string[] | - | Selected skills (required) |
| onChange | (skills: string[]) => void | - | Called when selection changes (required) |
| label | string | "Skills" | Field label |
| placeholder | string | "Select skills" | Button placeholder text |
| searchPlaceholder | string | "Search skills..." | Search input placeholder |

## Common Patterns

### Adding to Another Page
```tsx
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";

// In component
const [skills, setSkills] = useState<string[]>([]);

return (
  <SkillsMultiSelect
    label="Select Your Skills"
    value={skills}
    onChange={setSkills}
    placeholder="Choose skills..."
  />
);
```

### Filtering Skills by Category
```tsx
import { SKILLS_CATEGORIES, getCategoryForSkill } from "@/data/skillsCategories";

const skillCategory = getCategoryForSkill("Web Development");
console.log(skillCategory.name); // "Technology"
```

### Getting All Available Skills
```tsx
import { getAllSkills } from "@/data/skillsCategories";

const allSkills = getAllSkills(); // Array of ~130 skill names
```

## Styling Customization

### CSS Classes Used
- `.bg-primary/10` - Primary color background (10% opacity)
- `.text-primary` - Primary text color
- `.border-primary/20` - Primary border (20% opacity)
- `.bg-accent` - Accent background color
- `.text-muted-foreground` - Muted text
- `.hover:bg-primary/20` - Hover effect

### Tailwind Configuration
- Uses existing app color scheme
- `primary` color for selection highlights
- `accent` color for hover states
- `muted-foreground` for placeholders

## Performance Optimizations

1. **Search with useMemo** - Filters only on search change
2. **Lazy Popover** - Content only renders when open
3. **ScrollArea** - Handles ~130 items efficiently
4. **Set-based State** - Fast category toggle tracking

## Accessibility Features

- ✅ Semantic HTML (button, role="combobox")
- ✅ Keyboard navigation
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ Screen reader friendly badge removal (X button)
- ✅ High contrast text colors

## Testing

### Unit Test Example
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";

test("should select and display skills", async () => {
  const onChange = jest.fn();
  render(
    <SkillsMultiSelect value={[]} onChange={onChange} />
  );
  
  // Click dropdown
  const trigger = screen.getByRole("button");
  await userEvent.click(trigger);
  
  // Select a skill
  const skill = screen.getByText("Web Development");
  await userEvent.click(skill);
  
  expect(onChange).toHaveBeenCalledWith(["Web Development"]);
});
```

## Troubleshooting Checklist

- [ ] Skills array matches database format (lowercase, exact strings)
- [ ] Component receives `string[]` not `string`
- [ ] onChange callback called with full array
- [ ] Save handler processes arrays correctly
- [ ] Backward compatibility parser activated for existing string data
- [ ] All 12 categories display in dropdown
- [ ] Search filters across all skills correctly
- [ ] Selected badges render with X button
- [ ] Remove (X) button works on badges
- [ ] Page refreshes and persists selections

## Future Enhancements

- [ ] Add skill proficiency levels (Beginner/Intermediate/Expert)
- [ ] Support custom skills with admin approval
- [ ] Add recent/favorite skills section
- [ ] Skill recommendations based on profile
- [ ] Skill endorsements from other users
- [ ] Analytics on popular skills
- [ ] Skill difficulty indicators
- [ ] Related skills suggestions

## Files Reference

| File | Purpose | Size |
|---|---|---|
| src/data/skillsCategories.ts | Skill data & utilities | ~228 lines |
| src/components/SkillsMultiSelect.tsx | Multi-select component | ~208 lines |
| src/pages/Settings.tsx | Profile settings page | ~520 lines |
| PROFILE_SKILLS_MULTISELECT_IMPLEMENTATION.md | Implementation docs | ~350 lines |
| SKILLS_MULTISELECT_USER_GUIDE.md | User guide | ~270 lines |

## Support & Questions

### Common Issues
1. **Skills not saving** → Check handleProfileSave() logic
2. **Dropdown not opening** → Verify Popover component
3. **Search not working** → Check useMemo filter logic
4. **Styling issues** → Verify Tailwind config
5. **Old data not loading** → Check parseSkills() function

### Related Files
- Database schema: `CREATE_USER_PROFILES_TABLE.sql`
- Profile service: `src/lib/profileService.ts`
- Settings page: `src/pages/Settings.tsx`

---

**Last Updated:** January 2026  
**Status:** Production Ready  
**Version:** 1.0
