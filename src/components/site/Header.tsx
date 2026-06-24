import { Link, useNavigate } from "@tanstack/react-router";
import { Globe, LogOut, Menu, Monitor, Moon, Plane, Search, Sun, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useTheme, type Theme } from "@/lib/theme";
import { LANGUAGES, useLanguage, type Language } from "@/lib/i18n";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("common.theme")}>
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="h-4 w-4 hidden dark:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("common.theme")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <DropdownMenuRadioItem value="light"><Sun className="h-4 w-4 mr-2" />{t("common.light")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><Moon className="h-4 w-4 mr-2" />{t("common.dark")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system"><Monitor className="h-4 w-4 mr-2" />{t("common.system")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("common.language")}>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={language} onValueChange={(v) => setLanguage(v as Language)}>
          {LANGUAGES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code}>{l.nativeLabel}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const nav = [
    { to: "/", label: t("nav.home") },
    { to: "/tours", label: t("nav.tours") },
    { to: "/hotels", label: t("nav.hotels") },
    { to: "/flights", label: t("nav.flights") },
    { to: "/rentals", label: t("nav.rentals") },
    { to: "/list-property", label: t("nav.listProperty"), highlight: true },
  ];

  function handleLogout() {
    logout();
    toast.success(t("auth.loggedOut"));
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Plane className="h-5 w-5" />
          </span>
          <span className="font-heading text-xl tracking-tight">
            Wander<span className="text-primary">Viet</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={
                n.highlight
                  ? "ml-2 px-3 py-2 rounded-md text-sm font-semibold border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  : "px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-primary hover:bg-accent/50 transition-colors"
              }
              activeProps={{ className: n.highlight ? "ml-2 px-3 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground" : "text-primary bg-accent/60" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/tours" aria-label={t("common.search")}><Search className="h-4 w-4" /></Link>
          </Button>
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/profile"><User className="h-4 w-4 mr-2" />{t("auth.profile")}</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />{t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild><Link to="/login">{t("auth.login")}</Link></Button>
              <Button asChild><Link to="/register">{t("auth.register")}</Link></Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon"><Menu /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-2 mt-8">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-md text-base font-medium hover:bg-accent"
                >
                  {n.label}
                </Link>
              ))}
              <div className="border-t my-3" />

              <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">{t("common.language")}</div>
              <div className="grid grid-cols-2 gap-2 px-1">
                {LANGUAGES.map((l) => (
                  <Button
                    key={l.code}
                    variant={language === l.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage(l.code)}
                  >
                    {l.nativeLabel}
                  </Button>
                ))}
              </div>

              <div className="px-3 mt-3 text-xs font-semibold uppercase text-muted-foreground">{t("common.theme")}</div>
              <div className="grid grid-cols-3 gap-2 px-1">
                <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4 mr-1" />{t("common.light")}
                </Button>
                <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4 mr-1" />{t("common.dark")}
                </Button>
                <Button variant={theme === "system" ? "default" : "outline"} size="sm" onClick={() => setTheme("system")}>
                  <Monitor className="h-4 w-4 mr-1" />{t("common.system")}
                </Button>
              </div>

              <div className="border-t my-3" />
              {user ? (
                <>
                  <div className="px-3 py-2 rounded-md bg-accent/50">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="ghost" asChild><Link to="/profile" onClick={() => setOpen(false)}><User className="h-4 w-4 mr-2" />{t("auth.profile")}</Link></Button>
                  <Button variant="outline" onClick={() => { handleLogout(); setOpen(false); }}><LogOut className="h-4 w-4 mr-2" />{t("auth.logout")}</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild><Link to="/login" onClick={() => setOpen(false)}>{t("auth.login")}</Link></Button>
                  <Button asChild><Link to="/register" onClick={() => setOpen(false)}>{t("auth.register")}</Link></Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
