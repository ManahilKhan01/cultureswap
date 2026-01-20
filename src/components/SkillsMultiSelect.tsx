import React, { useState, useMemo } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SKILLS_CATEGORIES, SkillCategory } from "@/data/skillsCategories";
import { cn } from "@/lib/utils";

interface SkillsMultiSelectProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
}

export const SkillsMultiSelect: React.FC<SkillsMultiSelectProps> = ({
  value = [],
  onChange,
  placeholder = "Select skills",
  label = "Skills",
  searchPlaceholder = "Search skills...",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(SKILLS_CATEGORIES.map(cat => cat.id))
  );

  // Filter categories and subcategories based on search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) {
      return SKILLS_CATEGORIES;
    }

    const searchLower = search.toLowerCase();
    return SKILLS_CATEGORIES.map(category => ({
      ...category,
      subcategories: category.subcategories.filter(skill =>
        skill.toLowerCase().includes(searchLower)
      ),
    })).filter(category => category.subcategories.length > 0);
  }, [search]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSkillToggle = (skill: string) => {
    const skillLower = skill.toLowerCase();
    const existingIndex = value.findIndex(s => s.toLowerCase() === skillLower);
    let newValue: string[];

    if (existingIndex > -1) {
      newValue = value.filter((_, i) => i !== existingIndex);
    } else {
      newValue = [...value, skill];
    }

    onChange(newValue);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const newValue = value.filter(
      s => s.toLowerCase() !== skillToRemove.toLowerCase()
    );
    onChange(newValue);
  };

  const isSkillSelected = (skill: string) => {
    return value.some(s => s.toLowerCase() === skill.toLowerCase());
  };

  return (
    <div className="w-full space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 bg-white hover:bg-white"
          >
            <div className="flex flex-wrap gap-1 flex-1 text-left">
              {value.length > 0 ? (
                value.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="gap-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                  >
                    {skill}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSkill(skill);
                      }}
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-4 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px] w-full">
            <div className="p-2">
              {filteredCategories.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No skills found
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <div key={category.id} className="space-y-1">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={cn(
                        "w-full px-3 py-2 rounded-md text-sm font-medium text-left",
                        "hover:bg-accent transition-colors flex items-center justify-between",
                        expandedCategories.has(category.id) && "bg-accent"
                      )}
                    >
                      <span>{category.name}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 opacity-50 transition-transform",
                          expandedCategories.has(category.id) && "transform rotate-180"
                        )}
                      />
                    </button>

                    {expandedCategories.has(category.id) && (
                      <div className="ml-2 space-y-1 border-l border-border pl-2">
                        {category.subcategories.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => handleSkillToggle(skill)}
                            className={cn(
                              "w-full px-3 py-2 rounded-md text-sm text-left",
                              "flex items-center gap-2 transition-colors",
                              isSkillSelected(skill)
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "hover:bg-muted text-foreground"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded border",
                                isSkillSelected(skill)
                                  ? "bg-primary border-primary"
                                  : "border-border"
                              )}
                            >
                              {isSkillSelected(skill) && (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {value.length} skill{value.length !== 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
};

export default SkillsMultiSelect;
