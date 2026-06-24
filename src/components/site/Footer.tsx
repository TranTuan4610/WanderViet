import { Facebook, Mail, Plane, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-slate-900 text-slate-200 mt-20">
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Plane className="h-5 w-5" />
            </span>
            <span className="font-heading text-xl font-bold">WanderViet</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{t("footer.tagline")}</p>
          <div className="flex gap-3 mt-4">
            {[
              { Icon: Facebook, href: "https://www.facebook.com/share/1R5bcomULN/" },
              { Icon: Youtube, href: "https://www.youtube.com/channel/UCtK3y_g9Up1WGG9-HxQfBnA" },
            ].map(({ Icon, href }, i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-slate-800 hover:bg-primary inline-flex items-center justify-center transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">{t("footer.support")}</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-primary">{t("footer.helpCenter")}</a></li>
            <li><a href="#" className="hover:text-primary">{t("footer.contact")}</a></li>
            <li><a href="#" className="hover:text-primary">{t("footer.faq")}</a></li>
            <li><a href="tel:0865665046" className="hover:text-primary">Hotline: 0865 665 046</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">{t("footer.policy")}</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-primary">{t("footer.terms")}</a></li>
            <li><a href="#" className="hover:text-primary">{t("footer.privacy")}</a></li>
            <li><a href="#" className="hover:text-primary">{t("footer.refund")}</a></li>
            <li><a href="#" className="hover:text-primary">{t("footer.payment")}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">{t("footer.newsletter")}</h4>
          <p className="text-sm text-slate-400 mb-3">{t("footer.newsletterDesc")}</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <Input type="email" placeholder={t("footer.emailPlaceholder")} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
            <Button type="submit" size="icon"><Mail className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-5 text-xs text-slate-500 flex flex-col md:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} WanderViet. {t("footer.rights")}</p>
          <p>Made with ♥ in Vietnam</p>
        </div>
      </div>
    </footer>
  );
}

