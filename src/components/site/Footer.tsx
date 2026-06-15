import { Facebook, Mail, Plane, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
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
          <p className="text-sm text-slate-400 leading-relaxed">
            Người bạn đồng hành cho mọi hành trình. Đặt tour, khách sạn và vé máy bay với giá tốt nhất.
          </p>
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
          <h4 className="font-semibold mb-4 text-white">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-primary">Trung tâm trợ giúp</a></li>
            <li><a href="#" className="hover:text-primary">Liên hệ</a></li>
            <li><a href="#" className="hover:text-primary">Câu hỏi thường gặp</a></li>
            <li><a href="tel:0865665046" className="hover:text-primary">Hotline: 0865 665 046</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Chính sách</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-primary">Điều khoản sử dụng</a></li>
            <li><a href="#" className="hover:text-primary">Bảo mật thông tin</a></li>
            <li><a href="#" className="hover:text-primary">Chính sách hoàn hủy</a></li>
            <li><a href="#" className="hover:text-primary">Thanh toán</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Newsletter</h4>
          <p className="text-sm text-slate-400 mb-3">Đăng ký nhận ưu đãi mỗi tuần.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <Input type="email" placeholder="Email của bạn" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
            <Button type="submit" size="icon"><Mail className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-5 text-xs text-slate-500 flex flex-col md:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} WanderViet. All rights reserved.</p>
          <p>Made with ♥ in Vietnam</p>
        </div>
      </div>
    </footer>
  );
}
