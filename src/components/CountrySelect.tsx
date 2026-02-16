import React, { useState, useMemo } from "react";
import { Check, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { countries } from "@/data/countries";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
  label?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  placeholder = "Select country",
  label,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countries;
    const searchLower = search.toLowerCase();
    return countries.filter((country) =>
      country.name.toLowerCase().includes(searchLower),
    );
  }, [search]);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.name === value),
    [value],
  );

  const getFlagUrl = (code: string) =>
    `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

  return (
    <div className="w-full space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white hover:bg-white h-10 px-3"
          >
            <div className="flex items-center gap-3 truncate">
              {selectedCountry && (
                <img
                  src={getFlagUrl(selectedCountry.code)}
                  alt={selectedCountry.name}
                  className="w-5 h-auto rounded-sm object-cover"
                />
              )}
              <span
                className={cn("truncate", !value && "text-muted-foreground")}
              >
                {value || placeholder}
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ScrollArea className="h-60">
            <div className="p-1">
              {filteredCountries.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No country found.
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.name}
                    onClick={() => {
                      onChange(country.name);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                      value === country.name &&
                        "bg-accent text-accent-foreground",
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === country.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <img
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      className="mr-3 w-5 h-auto rounded-sm object-cover"
                    />
                    <span className="truncate">{country.name}</span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};
